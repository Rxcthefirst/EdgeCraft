import { GraphNode, GraphEdge, NodeStyle, EdgeStyle } from '../types';
import { IRenderer, RendererMetrics } from './IRenderer';

interface NodeVertex {
  x: number;
  y: number;
  size: number;
  color: [number, number, number, number]; // RGBA
}

interface EdgeVertex {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: [number, number, number, number]; // RGBA
  width: number;
}

/**
 * High-performance WebGL renderer for large graphs (5000+ nodes)
 * Uses GPU-accelerated rendering with instanced drawing
 * Labels are rendered on a separate 2D canvas overlay
 */
export class WebGLRenderer implements IRenderer {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private labelCanvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private labelCtx: CanvasRenderingContext2D;
  private nodes: Map<string | number, NodeVertex>;
  private edges: Map<string | number, EdgeVertex>;
  private nodeStyles: Map<string | number, NodeStyle>;
  private edgeStyles: Map<string | number, EdgeStyle>;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private transform: { x: number; y: number; scale: number };
  
  // WebGL resources
  private nodeProgram: WebGLProgram | null;
  private edgeProgram: WebGLProgram | null;
  private nodeBuffer: WebGLBuffer | null;
  private edgeBuffer: WebGLBuffer | null;
  private needsRebuild: boolean;
  
  // Performance metrics
  private metrics: RendererMetrics;
  private frameCount: number;
  private lastFpsUpdate: number;

  constructor(container: string | HTMLElement, options: {
    width?: number;
    height?: number;
    pixelRatio?: number;
    webgl2?: boolean;
  } = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container)! 
      : container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.nodes = new Map();
    this.edges = new Map();
    this.nodeStyles = new Map();
    this.edgeStyles = new Map();
    this.transform = { x: 0, y: 0, scale: 1 };
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    this.needsRebuild = true;
    
    // Get dimensions
    this.width = options.width || this.container.clientWidth || 800;
    this.height = options.height || this.container.clientHeight || 600;
    
    // Create WebGL canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.style.zIndex = '1';
    
    // Create label overlay canvas
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.style.position = 'absolute';
    this.labelCanvas.style.top = '0';
    this.labelCanvas.style.left = '0';
    this.labelCanvas.width = this.width * this.pixelRatio;
    this.labelCanvas.height = this.height * this.pixelRatio;
    this.labelCanvas.style.width = `${this.width}px`;
    this.labelCanvas.style.height = `${this.height}px`;
    this.labelCanvas.style.zIndex = '2';
    this.labelCanvas.style.pointerEvents = 'none';
    
    const labelCtx = this.labelCanvas.getContext('2d');
    if (!labelCtx) {
      throw new Error('Could not get 2D context for labels');
    }
    this.labelCtx = labelCtx;
    this.labelCtx.scale(this.pixelRatio, this.pixelRatio);
    
    // Get WebGL context
    const contextOptions = { 
      alpha: false, 
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    };
    
    this.gl = (options.webgl2 
      ? this.canvas.getContext('webgl2', contextOptions)
      : this.canvas.getContext('webgl', contextOptions)) as WebGLRenderingContext | WebGL2RenderingContext;
    
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    this.container.appendChild(this.canvas);
    this.container.appendChild(this.labelCanvas);
    
    // Initialize programs
    this.nodeProgram = null;
    this.edgeProgram = null;
    this.nodeBuffer = null;
    this.edgeBuffer = null;
    
    // Metrics
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.metrics = {
      fps: 0,
      renderTime: 0,
      nodeCount: 0,
      edgeCount: 0,
      lastFrameTime: 0
    };
  }

  initialize(): void {
    this.initShaders();
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    console.log('WebGLRenderer initialized');
  }

  private initShaders(): void {
    const gl = this.gl;
    
    // Node shader program (draws circles as point sprites)
    const nodeVertexShader = `
      attribute vec2 a_position;
      attribute float a_size;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      uniform vec3 u_transform; // x, y, scale
      
      varying vec4 v_color;
      
      void main() {
        // Apply transform
        vec2 transformed = (a_position + u_transform.xy) * u_transform.z;
        
        // Convert to clip space
        vec2 clipSpace = (transformed / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        // Point size
        gl_PointSize = a_size * u_transform.z;
        v_color = a_color;
      }
    `;
    
    const nodeFragmentShader = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        // Draw circle
        vec2 coord = gl_PointCoord - vec2(0.5);
        if (length(coord) > 0.5) {
          discard;
        }
        gl_FragColor = v_color;
      }
    `;
    
    this.nodeProgram = this.createProgram(nodeVertexShader, nodeFragmentShader);
    
    // Edge shader program (draws lines)
    const edgeVertexShader = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      uniform vec3 u_transform; // x, y, scale
      
      varying vec4 v_color;
      
      void main() {
        // Apply transform
        vec2 transformed = (a_position + u_transform.xy) * u_transform.z;
        
        // Convert to clip space
        vec2 clipSpace = (transformed / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_color = a_color;
      }
    `;
    
    const edgeFragmentShader = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `;
    
    this.edgeProgram = this.createProgram(edgeVertexShader, edgeFragmentShader);
    
    // Create buffers
    this.nodeBuffer = gl.createBuffer();
    this.edgeBuffer = gl.createBuffer();
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl;
    
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    
    return program;
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }

  render(): void {
    const startTime = performance.now();
    
    if (!this.needsRebuild) {
      return;
    }
    
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Draw edges first (behind nodes)
    this.drawEdges();
    
    // Draw nodes
    this.drawNodes();
    
    // Draw labels on overlay canvas
    this.drawLabels();
    
    this.needsRebuild = false;
    
    // Update metrics
    const renderTime = performance.now() - startTime;
    this.metrics.renderTime = renderTime;
    this.updateFPS();
  }

  private drawEdges(): void {
    if (this.edges.size === 0 || !this.edgeProgram) return;
    
    const gl = this.gl;
    const program = this.edgeProgram;
    
    gl.useProgram(program);
    
    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const transformLoc = gl.getUniformLocation(program, 'u_transform');
    
    gl.uniform2f(resolutionLoc, this.width, this.height);
    gl.uniform3f(transformLoc, this.transform.x, this.transform.y, this.transform.scale);
    
    // Build vertex data
    const vertices: number[] = [];
    this.edges.forEach((edge) => {
      // Each edge = 2 vertices (line)
      // Vertex format: x, y, r, g, b, a
      const [r, g, b, a] = edge.color;
      
      // Start point
      vertices.push(edge.x1, edge.y1, r, g, b, a);
      // End point
      vertices.push(edge.x2, edge.y2, r, g, b, a);
    });
    
    const vertexData = new Float32Array(vertices);
    
    // Upload to buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
    
    // Setup attributes
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
    
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
    
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    
    // Draw lines
    gl.lineWidth(1.0);
    gl.drawArrays(gl.LINES, 0, vertices.length / 6);
  }

  private drawNodes(): void {
    if (this.nodes.size === 0 || !this.nodeProgram) return;
    
    const gl = this.gl;
    const program = this.nodeProgram;
    
    gl.useProgram(program);
    
    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const transformLoc = gl.getUniformLocation(program, 'u_transform');
    
    gl.uniform2f(resolutionLoc, this.width, this.height);
    gl.uniform3f(transformLoc, this.transform.x, this.transform.y, this.transform.scale);
    
    // Build vertex data
    const vertices: number[] = [];
    this.nodes.forEach((node) => {
      // Vertex format: x, y, size, r, g, b, a
      const [r, g, b, a] = node.color;
      vertices.push(node.x, node.y, node.size, r, g, b, a);
    });
    
    const vertexData = new Float32Array(vertices);
    
    // Upload to buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
    
    // Setup attributes
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const sizeLoc = gl.getAttribLocation(program, 'a_size');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    
    const stride = 7 * Float32Array.BYTES_PER_ELEMENT;
    
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
    
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    
    // Draw points
    gl.drawArrays(gl.POINTS, 0, vertices.length / 7);
  }

  addNode(node: GraphNode, style: NodeStyle): void {
    const color = this.parseColor(style.fill || '#3498db');
    this.nodes.set(node.id, {
      x: (node as any).x || 0,
      y: (node as any).y || 0,
      size: (style.radius || 30) * 2, // Diameter
      color
    });
    this.nodeStyles.set(node.id, style);
    this.needsRebuild = true;
    this.metrics.nodeCount = this.nodes.size;
  }

  updateNode(id: string | number, updates: Partial<GraphNode>, style?: NodeStyle): void {
    const existing = this.nodes.get(id);
    if (existing) {
      existing.x = (updates as any).x || existing.x;
      existing.y = (updates as any).y || existing.y;
      if (style) {
        existing.size = (style.radius || 30) * 2;
        existing.color = this.parseColor(style.fill || '#3498db');
      }
      this.needsRebuild = true;
    }
  }

  removeNode(nodeId: string | number): void {
    this.nodes.delete(nodeId);
    this.needsRebuild = true;
    this.metrics.nodeCount = this.nodes.size;
  }

  addEdge(edge: GraphEdge, style: EdgeStyle): void {
    const sourceId = 'source' in edge ? edge.source : edge.subject;
    const targetId = 'target' in edge ? edge.target : edge.object;
    
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);
    
    if (!sourceNode || !targetNode) return;
    
    const color = this.parseColor(style.stroke || '#999999');
    this.edges.set(edge.id, {
      x1: sourceNode.x,
      y1: sourceNode.y,
      x2: targetNode.x,
      y2: targetNode.y,
      color,
      width: style.strokeWidth || 1
    });
    this.edgeStyles.set(edge.id, style);
    this.needsRebuild = true;
    this.metrics.edgeCount = this.edges.size;
  }

  updateEdge(id: string | number, updates: Partial<GraphEdge>, style?: EdgeStyle): void {
    const existing = this.edges.get(id);
    if (!existing) return;

    // Update endpoints if provided
    if (updates) {
      // Handle both LPG (source/target) and RDF (subject/object) formats
      const updatesAny = updates as any;
      const sourceId = updatesAny.source || updatesAny.subject;
      const targetId = updatesAny.target || updatesAny.object;
      
      if (sourceId) {
        const sourceNode = this.nodes.get(sourceId);
        if (sourceNode) {
          existing.x1 = sourceNode.x;
          existing.y1 = sourceNode.y;
        }
      }
      
      if (targetId) {
        const targetNode = this.nodes.get(targetId);
        if (targetNode) {
          existing.x2 = targetNode.x;
          existing.y2 = targetNode.y;
        }
      }
    }
    
    // Update style if provided
    if (style) {
      existing.color = this.parseColor(style.stroke || '#999999');
      existing.width = style.strokeWidth || 1;
    }
    
    this.needsRebuild = true;
  }

  removeEdge(edgeId: string | number): void {
    this.edges.delete(edgeId);
    this.needsRebuild = true;
    this.metrics.edgeCount = this.edges.size;
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.needsRebuild = true;
    this.metrics.nodeCount = 0;
    this.metrics.edgeCount = 0;
  }

  setTransform(transform: { x: number; y: number; scale: number }): void {
    this.transform = transform;
    this.needsRebuild = true;
  }

  getType(): 'svg' | 'canvas' | 'webgl' {
    return 'webgl';
  }

  getMetrics(): RendererMetrics {
    return { ...this.metrics };
  }

  getContainer(): HTMLElement {
    return this.canvas;
  }

  dispose(): void {
    this.destroy();
  }

  getTransform(): { x: number; y: number; scale: number } {
    return { ...this.transform };
  }

  markDirty(): void {
    this.needsRebuild = true;
  }

  destroy(): void {
    const gl = this.gl;
    
    // Delete programs
    if (this.nodeProgram) gl.deleteProgram(this.nodeProgram);
    if (this.edgeProgram) gl.deleteProgram(this.edgeProgram);
    
    // Delete buffers
    if (this.nodeBuffer) gl.deleteBuffer(this.nodeBuffer);
    if (this.edgeBuffer) gl.deleteBuffer(this.edgeBuffer);
    
    // Remove canvases
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.labelCanvas.parentNode) {
      this.labelCanvas.parentNode.removeChild(this.labelCanvas);
    }
    
    this.nodes.clear();
    this.edges.clear();
  }

  private parseColor(color: string): [number, number, number, number] {
    // Simple hex color parser
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b, 1.0];
    }
    // Default blue
    return [0.29, 0.56, 0.89, 1.0];
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;
    
    if (elapsed >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  private drawLabels(): void {
    const ctx = this.labelCtx;
    const { x: tx, y: ty, scale } = this.transform;
    
    // Clear label canvas
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw node icons inside shapes
    for (const [nodeId, nodeVertex] of this.nodes.entries()) {
      const style = this.nodeStyles.get(nodeId);
      if (!style || !style.icon) continue;
      
      const screenX = nodeVertex.x * scale + tx;
      const screenY = nodeVertex.y * scale + ty;
      const iconSize = (style.radius || 30) * 0.8 * scale;
      
      ctx.save();
      ctx.font = `${iconSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(style.icon, screenX, screenY);
      ctx.restore();
    }
    
    // Draw node labels
    for (const [nodeId, nodeVertex] of this.nodes.entries()) {
      const style = this.nodeStyles.get(nodeId);
      if (!style || !style.label || !style.label.text) continue;
      
      const label = style.label;
      const labelText = label.text as string;
      const screenX = nodeVertex.x * scale + tx;
      const screenY = nodeVertex.y * scale + ty;
      
      ctx.save();
      const fontSize = label.fontSize || 12;
      ctx.font = `${fontSize}px ${label.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Position label based on style
      let offsetY = 0;
      if (label.position === 'bottom') {
        offsetY = (style.radius || 30) * scale + 15;
      } else if (label.position === 'top') {
        offsetY = -(style.radius || 30) * scale - 15;
      }
      
      // Split text into lines for multi-line support
      const lines = labelText.split('\\n');
      const lineHeight = fontSize * 1.2;
      
      // Draw background if specified
      if (label.backgroundColor) {
        const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const padding = 4;
        ctx.fillStyle = label.backgroundColor;
        ctx.fillRect(
          screenX - maxWidth / 2 - padding,
          screenY + offsetY - (lines.length - 1) * lineHeight / 2 - fontSize / 2 - padding,
          maxWidth + padding * 2,
          lines.length * lineHeight + padding * 2
        );
      }
      
      // Draw text (multi-line) (multi-line)
      ctx.fillStyle = label.color || '#333';
      lines.forEach((line, index) => {
        const lineY = screenY + offsetY + (index - (lines.length - 1) / 2) * lineHeight;
        ctx.fillText(line, screenX, lineY);
      });
      
      ctx.restore();
    }
    
    // Draw edge labels
    for (const [edgeId, edgeVertex] of this.edges.entries()) {
      const style = this.edgeStyles.get(edgeId);
      if (!style || !style.label || !style.label.text) continue;
      
      const label = style.label;
      const labelText = label.text as string; // Type assertion - checked above
      const midX = (edgeVertex.x1 + edgeVertex.x2) / 2;
      const midY = (edgeVertex.y1 + edgeVertex.y2) / 2;
      const screenX = midX * scale + tx;
      const screenY = midY * scale + ty;
      
      ctx.save();
      
      // Rotate label to align with edge if enabled
      if (label.rotateWithEdge !== false) { // Default to true
        const dx = edgeVertex.x2 - edgeVertex.x1;
        const dy = edgeVertex.y2 - edgeVertex.y1;
        const angle = Math.atan2(dy, dx);
        // Keep text upright - flip if angle is upside down
        let displayAngle = angle;
        if (Math.abs(angle) > Math.PI / 2) {
          displayAngle = angle + Math.PI;
        }
        ctx.translate(screenX, screenY);
        ctx.rotate(displayAngle);
      }
      
      ctx.font = `${label.fontSize || 10}px ${label.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const drawX = label.rotateWithEdge !== false ? 0 : screenX;
      const drawY = label.rotateWithEdge !== false ? 0 : screenY;
      
      // Draw background if specified
      if (label.backgroundColor) {
        const metrics = ctx.measureText(labelText);
        const padding = 3;
        ctx.fillStyle = label.backgroundColor;
        ctx.fillRect(
          drawX - metrics.width / 2 - padding,
          drawY - (label.fontSize || 10) / 2 - padding,
          metrics.width + padding * 2,
          (label.fontSize || 10) + padding * 2
        );
      }
      
      // Draw text
      ctx.fillStyle = label.color || '#666';
      ctx.fillText(labelText, drawX, drawY);
      
      ctx.restore();
    }
  }
}
