import { GraphNode, GraphEdge, NodeStyle, EdgeStyle, PropertyNode } from '../types';
import { IRenderer, RendererMetrics } from './IRenderer';
import type { Graph } from '../core/Graph';
import { WebGLShapeRenderer } from './WebGLShapeRenderer';
import { WebGLTextureManager } from './WebGLTextureManager';

interface NodeVertex {
  x: number;
  y: number;
  size: number;
  color: [number, number, number, number]; // RGBA
  shape: 'circle' | 'rectangle' | 'diamond' | 'hexagon' | 'star' | 'roundrect' | 'window';
  strokeWidth: number;
  strokeColor: [number, number, number, number]; // RGBA
  textureId?: string; // Reference to texture in texture manager
  hasTexture?: boolean; // Whether node uses texture rendering
}

interface EdgeVertex {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: [number, number, number, number]; // RGBA
  width: number;
  sourceId: string | number;
  targetId: string | number;
  curvature?: number;
  parallelOffset?: number;
  isSelfLoop?: boolean;
  selfLoopAngle?: number;
  selfLoopRadius?: number;
  arrow?: 'none' | 'forward' | 'backward' | 'both';
  dashArray?: number[];
}

interface GlyphVertex {
  x: number;
  y: number;
  size: number;
  text: string;
  color: [number, number, number, number];
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
  private textureManager: WebGLTextureManager;
  private nodes: Map<string | number, NodeVertex>;
  private edges: Map<string | number, EdgeVertex>;
  private glyphs: Map<string | number, GlyphVertex[]>; // Edge ID -> glyphs on that edge
  private _propertyNodes: Map<string | number, PropertyNode>;
  private associationClasses: Map<string | number, {ac: any, nodeVertex: NodeVertex}>;
  private nodeStyles: Map<string | number, NodeStyle>;
  private edgeStyles: Map<string | number, EdgeStyle>;
  private graph: Graph | null;
  private enableViewportCulling: boolean;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private transform: { x: number; y: number; scale: number };
  
  // WebGL resources
  private nodeProgram: WebGLProgram | null;
  private textureProgram: WebGLProgram | null; // Separate program for textured nodes
  private edgeProgram: WebGLProgram | null;
  private nodeBuffer: WebGLBuffer | null;
  private edgeBuffer: WebGLBuffer | null;
  private needsRebuild: boolean;
  
  // Performance metrics
  private metrics: RendererMetrics;
  private frameCount: number;
  private lastFpsUpdate: number;

  // LOD (Level of Detail) thresholds
  private lodThresholds = {
    hideLabels: 0.3,        // Below this zoom, hide labels
    hideGlyphs: 0.2,        // Below this zoom, hide glyphs
    collapseBundles: 0.15,  // Below this zoom, collapse multi-edges to single line
    simplifyNodes: 0.1      // Below this zoom, draw all nodes as simple circles
  };

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
    this.glyphs = new Map();
    this._propertyNodes = new Map();
    this.associationClasses = new Map();
    this.nodeStyles = new Map();
    this.edgeStyles = new Map();
    this.graph = null;
    this.enableViewportCulling = true; // Default ON for WebGL
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
    
    // Initialize texture manager
    this.textureManager = new WebGLTextureManager(this.gl);
    
    // Initialize programs
    this.nodeProgram = null;
    this.textureProgram = null;
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

  setGraph(graph: Graph): void {
    this.graph = graph;
  }

  /**
   * Calculate viewport bounds in world space
   */
  private getViewportBounds(): { x: number; y: number; width: number; height: number } {
    const { x, y, scale } = this.transform;
    const worldX = -x / scale;
    const worldY = -y / scale;
    const worldWidth = this.width / scale;
    const worldHeight = this.height / scale;
    
    // 20% margin
    const margin = 0.2;
    return {
      x: worldX - worldWidth * margin,
      y: worldY - worldHeight * margin,
      width: worldWidth * (1 + margin * 2),
      height: worldHeight * (1 + margin * 2)
    };
  }

  private initShaders(): void {
    const gl = this.gl;
    
    // Node shader program (draws shapes as triangle geometry)
    const nodeVertexShader = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      uniform vec3 u_transform; // x, y, scale
      uniform vec2 u_nodeCenter; // Center position of current node
      uniform float u_nodeSize;  // Size of current node
      
      varying vec4 v_color;
      
      void main() {
        // Transform vertex relative to node center
        vec2 vertexPos = a_position * u_nodeSize + u_nodeCenter;
        
        // Apply global transform
        vec2 transformed = (vertexPos + u_transform.xy) * u_transform.z;
        
        // Convert to clip space
        vec2 clipSpace = (transformed / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_color = a_color;
      }
    `;
    
    const nodeFragmentShader = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `;
    
    this.nodeProgram = this.createProgram(nodeVertexShader, nodeFragmentShader);
    
    // Texture shader program (draws textured nodes)
    const textureVertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform vec2 u_resolution;
      uniform vec3 u_transform; // x, y, scale
      uniform vec2 u_nodeCenter;
      uniform float u_nodeSize;
      
      varying vec2 v_texCoord;
      
      void main() {
        // Transform vertex relative to node center
        vec2 vertexPos = a_position * u_nodeSize + u_nodeCenter;
        
        // Apply global transform (scale first, then translate)
        vec2 transformed = vertexPos * u_transform.z + u_transform.xy;
        
        // Convert to clip space
        vec2 clipSpace = (transformed / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_texCoord = a_texCoord;
      }
    `;
    
    const textureFragmentShader = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform vec4 u_bgColor; // Background circle color
      
      void main() {
        // Draw circle background
        vec2 coord = v_texCoord * 2.0 - 1.0;
        float dist = length(coord);
        
        if (dist > 1.0) {
          discard; // Outside circle
        }
        
        // Sample texture
        vec4 texColor = texture2D(u_texture, v_texCoord);
        
        // Blend texture over background color
        vec3 finalColor = mix(u_bgColor.rgb, texColor.rgb, texColor.a);
        float finalAlpha = max(u_bgColor.a, texColor.a);
        
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `;
    
    this.textureProgram = this.createProgram(textureVertexShader, textureFragmentShader);
    
    // Edge shader program (draws lines)
    const edgeVertexShader = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      uniform vec3 u_transform; // x, y, scale
      
      varying vec4 v_color;
      
      void main() {
        // Apply transform (scale first, then translate)
        vec2 transformed = a_position * u_transform.z + u_transform.xy;
        
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
    
    console.log('[WebGLRenderer] Rendering frame:', { nodes: this.nodes.size, edges: this.edges.size, needsRebuild: this.needsRebuild });
    
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
    if (this.edges.size === 0 || !this.edgeProgram) {
      if (this.edges.size === 0) {
        console.log('[WebGLRenderer] No edges to draw');
      }
      return;
    }
    
    const gl = this.gl;
    const program = this.edgeProgram;
    
    gl.useProgram(program);
    
    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const transformLoc = gl.getUniformLocation(program, 'u_transform');
    
    gl.uniform2f(resolutionLoc, this.width, this.height);
    gl.uniform3f(transformLoc, this.transform.x, this.transform.y, this.transform.scale);
    
    // LOD: Collapse bundles to straight lines at far zoom
    const collapseBundles = this.transform.scale < this.lodThresholds.collapseBundles;
    
    // Viewport culling for large graphs
    let edgesToRender: Map<string | number, EdgeVertex>;
    
    if (this.enableViewportCulling && this.graph && this.edges.size > 500) {
      const viewportBounds = this.getViewportBounds();
      const visibleEdges = this.graph.getEdgesInBounds(viewportBounds);
      
      edgesToRender = new Map();
      visibleEdges.forEach(edge => {
        const vertex = this.edges.get(edge.id);
        if (vertex) {
          edgesToRender.set(edge.id, vertex);
        }
      });
    } else {
      edgesToRender = this.edges;
    }
    
    console.log(`[WebGLRenderer] Rendering ${edgesToRender.size} edges out of ${this.edges.size} total`);
    
    // Build vertex data - use line segments for curved edges
    const vertices: number[] = [];
    
    edgesToRender.forEach((edgeVertex, edgeId) => {
      const [r, g, b, a] = edgeVertex.color;
      
      // Get source and target IDs from the edge vertex
      const sourceId = edgeVertex.sourceId;
      const targetId = edgeVertex.targetId;
      
      const sourceNode = this.nodes.get(sourceId);
      const targetNode = this.nodes.get(targetId);
      
      if (!sourceNode || !targetNode) {
        console.warn(`[WebGLRenderer] Edge ${edgeId} missing nodes:`, { sourceId, targetId, hasSource: !!sourceNode, hasTarget: !!targetNode });
        return;
      }
      
      // Use current node positions instead of stale edge positions
      const x1 = sourceNode.x;
      const y1 = sourceNode.y;
      const x2 = targetNode.x;
      const y2 = targetNode.y;
      
      // DEBUG: Log first edge positions
      if (vertices.length === 0) {
        console.log('[WebGLRenderer] First edge positions:', {
          edgeId,
          source: { id: sourceId, x: x1, y: y1 },
          target: { id: targetId, x: x2, y: y2 },
          transform: this.transform
        });
      }
      
      // Calculate attachment points based on node shapes using current positions
      const sourceRadius = sourceNode.size / 2;
      
      const sourceAttachment = WebGLShapeRenderer.calculateEdgeAttachmentPoint(
        x1,
        y1,
        sourceNode.size,
        sourceNode.shape,
        x2,
        y2
      );
      
      const targetAttachment = WebGLShapeRenderer.calculateEdgeAttachmentPoint(
        x2,
        y2,
        targetNode.size,
        targetNode.shape,
        x1,
        y1
      );
      
      // Adjust edge endpoints to attachment points using current positions
      const adjustedX1 = x1 + sourceAttachment.x;
      const adjustedY1 = y1 + sourceAttachment.y;
      const adjustedX2 = x2 + targetAttachment.x;
      const adjustedY2 = y2 + targetAttachment.y;
      
      // At very far zoom, always draw straight lines (massive performance boost)
      if (collapseBundles || edgeVertex.isSelfLoop && this.transform.scale < 0.2) {
        // Skip self-loops at very far zoom (they're tiny anyway)
        if (!edgeVertex.isSelfLoop) {
          vertices.push(adjustedX1, adjustedY1, r, g, b, a);
          vertices.push(adjustedX2, adjustedY2, r, g, b, a);
        }
      } else if (edgeVertex.isSelfLoop) {
        // Draw self-loop as segmented curve
        // Map 'window' shape to 'roundrect'
        const renderShape = sourceNode.shape === 'window' ? 'roundrect' : sourceNode.shape;
        this.addSelfLoopVertices(vertices, edgeVertex, r, g, b, a, renderShape as any, sourceRadius);
      } else if (edgeVertex.curvature !== 0 || edgeVertex.parallelOffset !== 0) {
        // Draw curved edge as segmented line (with adjusted endpoints)
        this.addCurvedEdgeVertices(vertices, edgeVertex, r, g, b, a, 
          adjustedX1, adjustedY1, adjustedX2, adjustedY2);
      } else {
        // Straight line (2 vertices)
        vertices.push(adjustedX1, adjustedY1, r, g, b, a);
        vertices.push(adjustedX2, adjustedY2, r, g, b, a);
      }
    });
    
    const vertexData = new Float32Array(vertices);
    const vertexCount = vertices.length / 6;
    
    console.log(`[WebGLRenderer] Drawing edges:`, { 
      vertexFloats: vertices.length, 
      vertexCount, 
      edgesRendered: edgesToRender.size,
      firstVertex: vertices.length > 0 ? vertices.slice(0, 6) : 'EMPTY'
    });
    
    if (vertices.length === 0) {
      console.warn('[WebGLRenderer] No edge vertices to render!');
      return;
    }
    
    // Upload to buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
    
    // Setup attributes
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    
    console.log(`[WebGLRenderer] Attribute locations:`, { positionLoc, colorLoc });
    
    if (positionLoc === -1 || colorLoc === -1) {
      console.error('[WebGLRenderer] Failed to get attribute locations!');
      return;
    }
    
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
    
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
    
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    
    // Draw lines with appropriate width (note: WebGL lineWidth support is limited, may need to use triangles for thick lines)
    const lineWidth = Math.max(1.0, 2.0 * this.transform.scale); // Scale line width with zoom
    gl.lineWidth(lineWidth);
    
    console.log(`[WebGLRenderer] Drawing ${vertexCount} vertices as ${vertexCount/2} line segments with lineWidth=${lineWidth}`);
    gl.drawArrays(gl.LINES, 0, vertexCount);
  }

  private addCurvedEdgeVertices(
    vertices: number[],
    edge: EdgeVertex,
    r: number,
    g: number,
    b: number,
    a: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    // Quadratic bezier curve approximation with line segments
    const segments = 16; // Number of line segments
    const { curvature, parallelOffset } = edge;
    
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Perpendicular offset for multi-edges
    const perpX = distance > 0 ? -dy / distance : 0;
    const perpY = distance > 0 ? dx / distance : 0;
    
    // Control point for quadratic bezier
    const controlX = midX + (-dy * (curvature || 0)) + (perpX * (parallelOffset || 0));
    const controlY = midY + (dx * (curvature || 0)) + (perpY * (parallelOffset || 0));
    
    // Generate line segments
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = this.getQuadraticBezierPoint(startX, startY, controlX, controlY, endX, endY, t1);
      const p2 = this.getQuadraticBezierPoint(startX, startY, controlX, controlY, endX, endY, t2);
      
      vertices.push(p1.x, p1.y, r, g, b, a);
      vertices.push(p2.x, p2.y, r, g, b, a);
    }
  }

  private addSelfLoopVertices(
    vertices: number[],
    edge: EdgeVertex,
    r: number,
    g: number,
    b: number,
    a: number,
    nodeShape: 'circle' | 'rectangle' | 'diamond' | 'hexagon' | 'star' | 'roundrect',
    nodeRadius: number
  ): void {
    // Draw self-loop as segmented curve
    const segments = 20;
    const { x1, y1, selfLoopAngle = 45, selfLoopRadius = 100 } = edge;
    
    const angle = (selfLoopAngle * Math.PI) / 180;
    
    // Calculate attachment points based on node shape
    const tempControlX = x1 + (nodeRadius + selfLoopRadius * 2) * Math.cos(angle);
    const tempControlY = y1 + (nodeRadius + selfLoopRadius * 2) * Math.sin(angle);
    
    const startAttachment = WebGLShapeRenderer.calculateEdgeAttachmentPoint(
      x1,
      y1,
      nodeRadius * 2,
      nodeShape,
      tempControlX,
      tempControlY
    );
    const endAttachment = WebGLShapeRenderer.calculateEdgeAttachmentPoint(
      x1,
      y1,
      nodeRadius * 2,
      nodeShape,
      tempControlX,
      tempControlY
    );
    
    // Start and end points on node perimeter
    const startX = x1 + startAttachment.x;
    const startY = y1 + startAttachment.y;
    const endX = x1 + endAttachment.x;
    const endY = y1 + endAttachment.y;
    
    // Control point for loop
    const controlDistance2 = nodeRadius + selfLoopRadius * 2;
    const controlX = x1 + controlDistance2 * Math.cos(angle);
    const controlY = y1 + controlDistance2 * Math.sin(angle);
    
    // Generate line segments
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = this.getQuadraticBezierPoint(startX, startY, controlX, controlY, endX, endY, t1);
      const p2 = this.getQuadraticBezierPoint(startX, startY, controlX, controlY, endX, endY, t2);
      
      vertices.push(p1.x, p1.y, r, g, b, a);
      vertices.push(p2.x, p2.y, r, g, b, a);
    }
  }

  private getQuadraticBezierPoint(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    t: number
  ): { x: number; y: number } {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    
    return {
      x: uu * x0 + 2 * u * t * x1 + tt * x2,
      y: uu * y0 + 2 * u * t * y1 + tt * y2
    };
  }

  private drawNodes(): void {
    if (this.nodes.size === 0) return;
    
    // Separate textured and non-textured nodes
    const texturedNodes: Array<[string | number, NodeVertex]> = [];
    const regularNodes: Array<[string | number, NodeVertex]> = [];
    
    this.nodes.forEach((node, id) => {
      if (node.hasTexture && node.textureId) {
        texturedNodes.push([id, node]);
      } else {
        regularNodes.push([id, node]);
      }
    });
    
    // Draw regular nodes
    if (regularNodes.length > 0) {
      this.drawRegularNodes(new Map(regularNodes));
    }
    
    // Draw textured nodes
    if (texturedNodes.length > 0) {
      this.drawTexturedNodes(new Map(texturedNodes));
    }
  }
  
  private drawRegularNodes(nodes: Map<string | number, NodeVertex>): void {
    if (nodes.size === 0 || !this.nodeProgram) return;
    
    const gl = this.gl;
    const program = this.nodeProgram;
    
    gl.useProgram(program);
    
    // Set global uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const transformLoc = gl.getUniformLocation(program, 'u_transform');
    const nodeCenterLoc = gl.getUniformLocation(program, 'u_nodeCenter');
    const nodeSizeLoc = gl.getUniformLocation(program, 'u_nodeSize');
    
    gl.uniform2f(resolutionLoc, this.width, this.height);
    gl.uniform3f(transformLoc, this.transform.x, this.transform.y, this.transform.scale);
    
    // LOD: Simplify nodes to basic circles at far zoom
    const simplifyNodes = this.transform.scale < this.lodThresholds.simplifyNodes;
    
    // Viewport culling for large graphs
    let nodesToRender: Map<string | number, NodeVertex>;
    
    if (this.enableViewportCulling && this.graph && nodes.size > 500) {
      const viewportBounds = this.getViewportBounds();
      const visibleNodes = this.graph.getNodesInBounds(viewportBounds);
      
      nodesToRender = new Map();
      visibleNodes.forEach(node => {
        const vertex = nodes.get(node.id);
        if (vertex) {
          nodesToRender.set(node.id, vertex);
        }
      });
    } else {
      nodesToRender = nodes;
    }
    
    // Group nodes by shape for efficient batching
    const nodesByShape = new Map<string, NodeVertex[]>();
    nodesToRender.forEach((node) => {
      const shapeKey = simplifyNodes ? 'circle' : node.shape;
      if (!nodesByShape.has(shapeKey)) {
        nodesByShape.set(shapeKey, []);
      }
      nodesByShape.get(shapeKey)!.push(node);
    });
    
    // Get attribute locations
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    
    // Render each shape type as a batch
    nodesByShape.forEach((nodes, shape) => {
      // Map 'window' shape to 'roundrect' for rendering (window mode will be implemented later)
      const renderShape = shape === 'window' ? 'roundrect' : shape;
      
      // Generate geometry for this shape type (only once per shape)
      const geometry = WebGLShapeRenderer.generateShapeGeometry(
        renderShape as any,
        1.0, // Base radius (we'll scale per node)
        0    // No stroke at LOD (add later)
      );
      
      if (!geometry || geometry.vertices.length === 0) return;
      
      // Upload geometry to buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
      
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      
      // Setup vertex attributes for geometry
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
      
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
      
      // Draw each node of this shape type
      nodes.forEach((node) => {
        // Set per-node uniforms
        gl.uniform2f(nodeCenterLoc, node.x, node.y);
        
        let size = node.size;
        if (simplifyNodes) {
          size = Math.max(3, size * 0.5); // Minimum 3px diameter
        }
        gl.uniform1f(nodeSizeLoc, size);
        
        // Update colors in the geometry (inefficient, but works for now)
        // TODO: Use instancing for better performance
        const coloredVertices = new Float32Array(geometry.vertices);
        for (let i = 0; i < geometry.vertices.length; i += 6) {
          coloredVertices[i + 2] = node.color[0];
          coloredVertices[i + 3] = node.color[1];
          coloredVertices[i + 4] = node.color[2];
          coloredVertices[i + 5] = node.color[3];
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, coloredVertices, gl.STATIC_DRAW);
        
        // Draw this node
        gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
      });
      
      // Cleanup index buffer
      if (indexBuffer) {
        gl.deleteBuffer(indexBuffer);
      }
    });
  }

  addNode(node: GraphNode, style: NodeStyle): void {
    const color = this.parseColor(style.fill || '#3498db');
    const strokeColor = this.parseColor(style.stroke || '#2c3e50');
    
    const nodeVertex: NodeVertex = {
      x: (node as any).x || 0,
      y: (node as any).y || 0,
      size: (style.radius || 30) * 2, // Diameter
      color,
      shape: style.shape || 'circle',
      strokeWidth: style.strokeWidth || 0,
      strokeColor,
      hasTexture: !!style.image,
      textureId: undefined
    };
    
    // Load texture if image config is provided
    if (style.image) {
      this.loadNodeTexture(node.id, style.image);
    }
    
    this.nodes.set(node.id, nodeVertex);
    this.nodeStyles.set(node.id, style);
    this.needsRebuild = true;
    this.metrics.nodeCount = this.nodes.size;
  }
  
  /**
   * Async load texture for a node
   */
  private async loadNodeTexture(nodeId: string | number, imageConfig: NonNullable<NodeStyle['image']>): Promise<void> {
    try {
      const _textureInfo = await this.textureManager.loadTexture(imageConfig);
      const nodeVertex = this.nodes.get(nodeId);
      if (nodeVertex) {
        nodeVertex.textureId = this.textureManager['getCacheKey'](imageConfig);
        nodeVertex.hasTexture = true;
        this.needsRebuild = true;
      }
    } catch (error) {
      console.error(`Failed to load texture for node ${nodeId}:`, error);
    }
  }
  
  /**
   * Draw nodes with textures (SVG, PNG, font icons)
   */
  private drawTexturedNodes(nodes: Map<string | number, NodeVertex>): void {
    if (nodes.size === 0 || !this.textureProgram) return;
    
    const gl = this.gl;
    const program = this.textureProgram;
    
    gl.useProgram(program);
    
    // Set global uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const transformLoc = gl.getUniformLocation(program, 'u_transform');
    const nodeCenterLoc = gl.getUniformLocation(program, 'u_nodeCenter');
    const nodeSizeLoc = gl.getUniformLocation(program, 'u_nodeSize');
    const textureLoc = gl.getUniformLocation(program, 'u_texture');
    const bgColorLoc = gl.getUniformLocation(program, 'u_bgColor');
    
    gl.uniform2f(resolutionLoc, this.width, this.height);
    gl.uniform3f(transformLoc, this.transform.x, this.transform.y, this.transform.scale);
    gl.uniform1i(textureLoc, 0); // Texture unit 0
    
    // Create a quad for texture rendering
    const quad = new Float32Array([
      // Position (x, y), TexCoord (u, v)
      -1.0, -1.0,  0.0, 1.0,
       1.0, -1.0,  1.0, 1.0,
      -1.0,  1.0,  0.0, 0.0,
       1.0,  1.0,  1.0, 0.0,
    ]);
    
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    
    // Draw each textured node
    nodes.forEach((node) => {
      if (!node.textureId) return;
      
      const textureInfo = this.textureManager['textureCache'].get(node.textureId);
      if (!textureInfo || !textureInfo.ready) return;
      
      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      
      // Set node uniforms
      gl.uniform2f(nodeCenterLoc, node.x, node.y);
      gl.uniform1f(nodeSizeLoc, node.size * 0.5); // Half size for radius
      gl.uniform4fv(bgColorLoc, node.color);
      
      // Draw quad
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
    
    // Cleanup
    if (quadBuffer) {
      gl.deleteBuffer(quadBuffer);
    }
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
      
      // Update all edges connected to this node if position changed
      if ((updates as any).x !== undefined || (updates as any).y !== undefined) {
        this.edges.forEach((edgeVertex, _edgeId) => {
          if (edgeVertex.sourceId === id) {
            edgeVertex.x1 = existing.x;
            edgeVertex.y1 = existing.y;
          }
          if (edgeVertex.targetId === id) {
            edgeVertex.x2 = existing.x;
            edgeVertex.y2 = existing.y;
          }
        });
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
    
    if (!sourceNode || !targetNode) {
      console.warn('[WebGLRenderer] Cannot add edge - missing nodes:', { edgeId: edge.id, sourceId, targetId, hasSource: !!sourceNode, hasTarget: !!targetNode });
      return;
    }
    
    // Get bundle info for curvature and self-loop positioning
    const bundleInfo = this.graph?.getEdgeBundleInfo(edge.id);
    const curvature = bundleInfo?.curvature ?? (style.curvature !== undefined ? style.curvature : 0.2);
    const parallelOffset = bundleInfo?.parallelOffset ?? (style.parallelOffset || 0);
    
    const color = this.parseColor(style.stroke || '#999999');
    const isSelfLoop = sourceId === targetId;
    
    this.edges.set(edge.id, {
      x1: sourceNode.x,
      y1: sourceNode.y,
      x2: targetNode.x,
      y2: targetNode.y,
      color,
      width: style.strokeWidth || 1,
      sourceId,
      targetId,
      curvature,
      parallelOffset,
      isSelfLoop,
      selfLoopAngle: bundleInfo?.selfLoopAngle,
      selfLoopRadius: bundleInfo?.selfLoopRadius
    });
    
    // Handle glyphs (property objects)
    if (style.glyphs && style.glyphs.length > 0) {
      const glyphVertices: GlyphVertex[] = [];
      
      for (const glyphConfig of style.glyphs) {
        const position = glyphConfig.position || 0.5;
        
        // Calculate glyph position along edge (will need bezier calculation)
        const glyphX = sourceNode.x + (targetNode.x - sourceNode.x) * position;
        const glyphY = sourceNode.y + (targetNode.y - sourceNode.y) * position;
        
        glyphVertices.push({
          x: glyphX,
          y: glyphY,
          size: glyphConfig.size || 20,
          text: glyphConfig.text || '',
          color: this.parseColor(glyphConfig.fill || '#4CAF50')
        });
      }
      
      this.glyphs.set(edge.id, glyphVertices);
    }
    
    this.edgeStyles.set(edge.id, style);
    this.needsRebuild = true;
    this.metrics.edgeCount = this.edges.size;
    console.log('[WebGLRenderer] Edge added:', { edgeId: edge.id, totalEdges: this.edges.size, sourceId, targetId });
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

  addAssociationClass(ac: any, style: NodeStyle): void {
    // Calculate position from sourceEdges
    let x = 0, y = 0;
    
    if (ac.position) {
      x = ac.position.x || 0;
      y = ac.position.y || 0;
    } else if (ac.sourceEdges && ac.sourceEdges.length > 0) {
      // Calculate midpoint from first edge
      const edge = this.edges.get(ac.sourceEdges[0]);
      if (edge) {
        x = (edge.x1 + edge.x2) / 2;
        y = (edge.y1 + edge.y2) / 2;
      }
    }
    
    const color = this.parseColor(style.fill || '#9C27B0');
    const strokeColor = this.parseColor(style.stroke || '#2c3e50');
    this.associationClasses.set(ac.id, {
      ac,
      nodeVertex: {
        x,
        y,
        size: (style.radius || 30) * 2,
        color,
        shape: style.shape || 'circle',
        strokeWidth: style.strokeWidth || 0,
        strokeColor
      }
    });
    
    this.nodeStyles.set(ac.id, style);
    this.needsRebuild = true;
  }

  updateAssociationClass(id: string | number, updates: any, style?: NodeStyle): void {
    const existing = this.associationClasses.get(id);
    if (!existing) return;
    
    const updatedAc = { ...existing.ac, ...updates };
    
    if (style) {
      existing.nodeVertex.size = (style.radius || 30) * 2;
      existing.nodeVertex.color = this.parseColor(style.fill || '#9C27B0');
      this.nodeStyles.set(id, style);
    }
    
    this.associationClasses.set(id, {
      ac: updatedAc,
      nodeVertex: existing.nodeVertex
    });
    
    this.needsRebuild = true;
  }

  removeAssociationClass(id: string | number): void {
    this.associationClasses.delete(id);
    this.nodeStyles.delete(id);
    this.needsRebuild = true;
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.associationClasses.clear();
    this.glyphs.clear();
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
    this.associationClasses.clear();
    this.glyphs.clear();
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
    
    // Clear label canvas with current transform
    ctx.clearRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
    
    // LOD: Skip expensive label rendering at far zoom
    const skipLabels = scale < this.lodThresholds.hideLabels;
    const skipGlyphs = scale < this.lodThresholds.hideGlyphs;
    
    // Always draw node icons (they're inside the shape, important for recognition)
    for (const [nodeId, nodeVertex] of this.nodes.entries()) {
      const style = this.nodeStyles.get(nodeId);
      if (!style || !style.icon) continue;
      
      const screenX = nodeVertex.x * scale + tx;
      const screenY = nodeVertex.y * scale + ty;
      const iconSize = (style.radius || 30) * 0.8 * scale;
      
      // Skip very small icons (would be unreadable anyway)
      if (iconSize < 6) continue;
      
      ctx.save();
      ctx.font = `${iconSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(style.icon, screenX, screenY);
      ctx.restore();
    }
    
    // Skip labels at far zoom
    if (skipLabels) return;
    
    // Draw node labels
    for (const [nodeId, nodeVertex] of this.nodes.entries()) {
      const style = this.nodeStyles.get(nodeId);
      if (!style || !style.label || !style.label.text) continue;
      
      const label = style.label;
      const labelText = label.text as string;
      const screenX = nodeVertex.x * scale + tx;
      const screenY = nodeVertex.y * scale + ty;
      
      ctx.save();
      const fontSize = (label.fontSize || 12) * scale; // Scale font size with zoom
      ctx.font = `${fontSize}px ${label.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Position label based on style
      let offsetY = 0;
      if (label.position === 'bottom') {
        offsetY = (style.radius || 30) * scale + 15 * scale; // Scale offset too
      } else if (label.position === 'top') {
        offsetY = -(style.radius || 30) * scale - 15 * scale; // Scale offset too
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
    
    // Draw association classes (hexagons on canvas overlay since WebGL doesn't do hexagons easily)
    for (const [acId, data] of this.associationClasses.entries()) {
      const { ac, nodeVertex } = data;
      const style = this.nodeStyles.get(acId);
      if (!style) continue;
      
      // Recalculate position if needed (from edge midpoint)
      let x = nodeVertex.x;
      let y = nodeVertex.y;
      
      if (ac.sourceEdges && ac.sourceEdges.length > 0) {
        const edge = this.edges.get(ac.sourceEdges[0]);
        if (edge) {
          x = (edge.x1 + edge.x2) / 2;
          y = (edge.y1 + edge.y2) / 2;
          nodeVertex.x = x;
          nodeVertex.y = y;
        }
      }
      
      const screenX = x * scale + tx;
      const screenY = y * scale + ty;
      const size = (style.radius || 30) * scale;
      
      // Skip if too small
      if (size < 3) continue;
      
      ctx.save();
      
      // Draw hexagon
      ctx.fillStyle = `rgba(${nodeVertex.color[0] * 255}, ${nodeVertex.color[1] * 255}, ${nodeVertex.color[2] * 255}, ${nodeVertex.color[3]})`;
      ctx.strokeStyle = style.stroke || '#7B1FA2';
      ctx.lineWidth = (style.strokeWidth || 2) * Math.min(scale, 1);
      
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
        const px = screenX + size * Math.cos(angle);
        const py = screenY + size * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw icon if provided
      if (style.icon) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(style.icon, screenX, screenY);
      }
      
      // Draw name/label below
      if (ac.name && !skipLabels) {
        ctx.font = `${style.label?.fontSize || 10}px ${style.label?.fontFamily || 'Arial'}`;
        ctx.fillStyle = style.label?.color || '#333';
        ctx.textAlign = 'center';
        const offsetY = size + 12;
        ctx.fillText(ac.name, screenX, screenY + offsetY);
      }
      
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
    
    // LOD: Skip glyphs at very far zoom (they'd be too small to see)
    if (skipGlyphs) return;
    
    // Draw glyphs (property object indicators)
    for (const [edgeId, glyphList] of this.glyphs.entries()) {
      const edge = this.edges.get(edgeId);
      if (!edge) continue;
      
      for (const glyph of glyphList) {
        const screenX = glyph.x * scale + tx;
        const screenY = glyph.y * scale + ty;
        const size = glyph.size * scale;
        
        ctx.save();
        
        // Draw glyph background (circle or hexagon)
        ctx.fillStyle = `rgba(${glyph.color[0] * 255}, ${glyph.color[1] * 255}, ${glyph.color[2] * 255}, ${glyph.color[3]})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glyph text
        if (glyph.text) {
          ctx.font = `${size * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(glyph.text, screenX, screenY);
        }
        
        ctx.restore();
      }
    }
  }
}
