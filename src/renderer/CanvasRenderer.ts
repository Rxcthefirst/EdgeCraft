import { GraphNode, GraphEdge, NodeStyle, EdgeStyle } from '../types';
import { IRenderer, RendererMetrics } from './IRenderer';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CachedNode {
  node: GraphNode;
  style: NodeStyle;
  bounds: BoundingBox;
}

interface CachedEdge {
  edge: GraphEdge;
  style: EdgeStyle;
  path?: Path2D;
}

type LayerType = 'background' | 'edges' | 'nodes' | 'labels' | 'overlay';

/**
 * High-performance Canvas-based renderer
 * Uses layered rendering and dirty region tracking for optimal performance
 */
export class CanvasRenderer implements IRenderer {
  private container: HTMLElement;
  private layers: Map<LayerType, HTMLCanvasElement>;
  private contexts: Map<LayerType, CanvasRenderingContext2D>;
  private nodes: Map<string | number, CachedNode>;
  private edges: Map<string | number, CachedEdge>;
  private dirtyRegions: Set<BoundingBox>;
  private isDirty: boolean;
  private transform: { x: number; y: number; scale: number };
  private pixelRatio: number;
  private width: number;
  private height: number;
  private enableDirtyRegions: boolean;
  
  // Performance metrics
  private metrics: RendererMetrics;
  private frameCount: number;
  private lastFpsUpdate: number;
  
  // Caches
  private textMeasureCache: Map<string, TextMetrics>;
  private shapeCache: Map<string, HTMLCanvasElement>;

  constructor(container: string | HTMLElement, options: {
    width?: number;
    height?: number;
    pixelRatio?: number;
    enableCache?: boolean;
    enableDirtyRegions?: boolean;
  } = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container)! 
      : container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.nodes = new Map();
    this.edges = new Map();
    this.dirtyRegions = new Set();
    this.isDirty = true;
    this.transform = { x: 0, y: 0, scale: 1 };
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    this.enableDirtyRegions = options.enableDirtyRegions !== false;
    
    this.textMeasureCache = new Map();
    this.shapeCache = new Map();
    
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.metrics = {
      fps: 0,
      renderTime: 0,
      nodeCount: 0,
      edgeCount: 0,
      lastFrameTime: 0
    };

    // Get dimensions
    const rect = this.container.getBoundingClientRect();
    this.width = options.width || rect.width;
    this.height = options.height || rect.height;

    this.layers = new Map();
    this.contexts = new Map();
  }

  initialize(): void {
    // Create layered canvas stack
    const layerOrder: LayerType[] = ['background', 'edges', 'nodes', 'labels', 'overlay'];
    
    layerOrder.forEach((layerType, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = this.width * this.pixelRatio;
      canvas.height = this.height * this.pixelRatio;
      canvas.style.width = `${this.width}px`;
      canvas.style.height = `${this.height}px`;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = String(index);
      canvas.style.pointerEvents = layerType === 'overlay' ? 'auto' : 'none';
      
      const ctx = canvas.getContext('2d', { alpha: layerType !== 'background' })!;
      ctx.scale(this.pixelRatio, this.pixelRatio);
      
      this.layers.set(layerType, canvas);
      this.contexts.set(layerType, ctx);
      this.container.appendChild(canvas);
    });

    // Draw background
    this.renderBackground();
  }

  private renderBackground(): void {
    const ctx = this.contexts.get('background')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  render(): void {
    const startTime = performance.now();

    if (!this.isDirty) {
      return;
    }

    // Clear dynamic layers
    ['edges', 'nodes', 'labels'].forEach(layer => {
      const ctx = this.contexts.get(layer as LayerType);
      if (!ctx) {
        console.error(`[CanvasRenderer] Context not found for layer: ${layer}`);
        return;
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.width * this.pixelRatio, this.height * this.pixelRatio);
      ctx.restore();
    });

    // Apply transform to all layers
    ['edges', 'nodes', 'labels'].forEach(layer => {
      const ctx = this.contexts.get(layer as LayerType);
      if (!ctx) return;
      ctx.save();
      ctx.translate(this.transform.x, this.transform.y);
      ctx.scale(this.transform.scale, this.transform.scale);
    });

    // Render edges
    const edgesCtx = this.contexts.get('edges')!;
    this.edges.forEach(cachedEdge => {
      this.renderEdge(edgesCtx, cachedEdge);
    });

    // Render nodes
    const nodesCtx = this.contexts.get('nodes')!;
    this.nodes.forEach(cachedNode => {
      this.renderNode(nodesCtx, cachedNode);
    });

    // Render labels
    const labelsCtx = this.contexts.get('labels')!;
    this.nodes.forEach(cachedNode => {
      this.renderNodeLabel(labelsCtx, cachedNode);
    });
    this.edges.forEach(cachedEdge => {
      this.renderEdgeLabel(labelsCtx, cachedEdge);
    });

    // Restore transforms
    ['edges', 'nodes', 'labels'].forEach(layer => {
      const ctx = this.contexts.get(layer as LayerType)!;
      ctx.restore();
    });

    this.isDirty = false;

    // Update metrics
    const endTime = performance.now();
    this.metrics.renderTime = endTime - startTime;
    this.metrics.lastFrameTime = endTime;
    this.frameCount++;

    if (endTime - this.lastFpsUpdate > 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (endTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = endTime;
    }

    this.metrics.nodeCount = this.nodes.size;
    this.metrics.edgeCount = this.edges.size;
  }

  private renderNode(ctx: CanvasRenderingContext2D, cached: CachedNode): void {
    const { node, style } = cached;
    const x = (node as any).x || 0;
    const y = (node as any).y || 0;

    ctx.save();

    // Apply node style
    ctx.fillStyle = style.fill || '#3498db';
    ctx.strokeStyle = style.stroke || '#2c3e50';
    ctx.lineWidth = style.strokeWidth || 2;

    // Draw shape based on type
    switch (style.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, style.radius || 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'rectangle':
        const rectSize = (style.radius || 30) * 1.5;
        ctx.fillRect(x - rectSize / 2, y - rectSize / 2, rectSize, rectSize);
        ctx.strokeRect(x - rectSize / 2, y - rectSize / 2, rectSize, rectSize);
        break;

      case 'diamond':
        const diamondSize = style.radius || 30;
        ctx.beginPath();
        ctx.moveTo(x, y - diamondSize);
        ctx.lineTo(x + diamondSize, y);
        ctx.lineTo(x, y + diamondSize);
        ctx.lineTo(x - diamondSize, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'hexagon':
        const hexSize = style.radius || 30;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const hx = x + hexSize * Math.cos(angle);
          const hy = y + hexSize * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      default:
        // Default to circle
        ctx.beginPath();
        ctx.arc(x, y, style.radius || 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
  }

  private renderNodeLabel(ctx: CanvasRenderingContext2D, cached: CachedNode): void {
    const { node, style } = cached;
    const x = (node as any).x || 0;
    const y = (node as any).y || 0;

    if (!style.label || !style.label.text) return;

    ctx.save();

    const label = style.label;
    const fontSize = label.fontSize || 12;
    const fontFamily = label.fontFamily || 'Arial, sans-serif';
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Position label
    let labelX = x;
    let labelY = y;
    const offset = (style.radius || 30) + 10;

    switch (label.position) {
      case 'top':
        labelY = y - offset;
        break;
      case 'bottom':
        labelY = y + offset;
        break;
      case 'left':
        labelX = x - offset;
        ctx.textAlign = 'right';
        break;
      case 'right':
        labelX = x + offset;
        ctx.textAlign = 'left';
        break;
      case 'center':
        labelY = y;
        break;
    }

    // Draw background if specified
    if (label.backgroundColor && label.text) {
      const metrics = ctx.measureText(label.text);
      const padding = 4;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = fontSize + padding * 2;
      
      ctx.fillStyle = label.backgroundColor;
      ctx.fillRect(
        labelX - bgWidth / 2,
        labelY - bgHeight / 2,
        bgWidth,
        bgHeight
      );
    }

    // Draw text
    ctx.fillStyle = label.color || '#333';
    if (label.text) {
      ctx.fillText(label.text, labelX, labelY);
    }

    ctx.restore();
  }

  private renderEdge(ctx: CanvasRenderingContext2D, cached: CachedEdge): void {
    const { edge, style } = cached;
    
    const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
    const targetId = 'target' in edge ? edge.target : (edge as any).object;
    
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);
    
    if (!sourceNode || !targetNode) return;

    const sx = (sourceNode.node as any).x || 0;
    const sy = (sourceNode.node as any).y || 0;
    const tx = (targetNode.node as any).x || 0;
    const ty = (targetNode.node as any).y || 0;

    ctx.save();

    ctx.strokeStyle = style.stroke || '#95a5a6';
    ctx.lineWidth = style.strokeWidth || 2;

    if (style.strokeDasharray) {
      const dashArray = style.strokeDasharray.split(',').map(v => parseFloat(v.trim()));
      ctx.setLineDash(dashArray);
    }

    // Calculate control point for curved edge
    const dx = tx - sx;
    const dy = ty - sy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1) {
      ctx.restore();
      return;
    }

    const curvature = 0.2;
    const midX = (sx + tx) / 2;
    const midY = (sy + ty) / 2;
    const controlX = midX - dy * curvature;
    const controlY = midY + dx * curvature;

    // Draw edge path
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(controlX, controlY, tx, ty);
    ctx.stroke();

    // Draw arrow if specified
    if (style.arrow === 'forward' || style.arrow === 'both') {
      this.drawArrow(ctx, controlX, controlY, tx, ty, style.strokeWidth || 2);
    }
    if (style.arrow === 'backward' || style.arrow === 'both') {
      this.drawArrow(ctx, controlX, controlY, sx, sy, style.strokeWidth || 2);
    }

    ctx.restore();
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    lineWidth: number
  ): void {
    const headLength = 10 + lineWidth;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.translate(toX, toY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-headLength, -headLength / 2);
    ctx.lineTo(-headLength, headLength / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderEdgeLabel(ctx: CanvasRenderingContext2D, cached: CachedEdge): void {
    const { edge, style } = cached;
    
    if (!style.label || !style.label.text) return;

    const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
    const targetId = 'target' in edge ? edge.target : (edge as any).object;
    
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);
    
    if (!sourceNode || !targetNode) return;

    const sx = (sourceNode.node as any).x || 0;
    const sy = (sourceNode.node as any).y || 0;
    const tx = (targetNode.node as any).x || 0;
    const ty = (targetNode.node as any).y || 0;

    // Calculate label position (midpoint of curve)
    const dx = tx - sx;
    const dy = ty - sy;
    const curvature = 0.2;
    const midX = (sx + tx) / 2;
    const midY = (sy + ty) / 2;
    const controlX = midX - dy * curvature;
    const controlY = midY + dx * curvature;
    
    // Bezier curve midpoint
    const labelX = (sx + 2 * controlX + tx) / 4;
    const labelY = (sy + 2 * controlY + ty) / 4;

    ctx.save();

    const label = style.label;
    const fontSize = label.fontSize || 10;
    const fontFamily = label.fontFamily || 'Arial, sans-serif';
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw background
    if (label.backgroundColor && label.text) {
      const metrics = ctx.measureText(label.text);
      const padding = 3;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = fontSize + padding * 2;
      
      ctx.fillStyle = label.backgroundColor;
      ctx.fillRect(
        labelX - bgWidth / 2,
        labelY - bgHeight / 2,
        bgWidth,
        bgHeight
      );
    }

    // Draw text
    ctx.fillStyle = label.color || '#666';
    if (label.text) {
      ctx.fillText(label.text, labelX, labelY);
    }

    ctx.restore();
  }

  addNode(node: GraphNode, style: NodeStyle): void {
    const bounds = this.calculateNodeBounds(node, style);
    this.nodes.set(node.id, { node, style, bounds });
    this.markDirty(bounds);
  }

  updateNode(id: string | number, updates: Partial<GraphNode>, style?: NodeStyle): void {
    const cached = this.nodes.get(id);
    if (!cached) return;

    const updatedNode = { ...cached.node, ...updates };
    const updatedStyle = style || cached.style;
    const bounds = this.calculateNodeBounds(updatedNode, updatedStyle);

    this.markDirty(cached.bounds);
    this.nodes.set(id, { node: updatedNode, style: updatedStyle, bounds });
    this.markDirty(bounds);
  }

  removeNode(id: string | number): void {
    const cached = this.nodes.get(id);
    if (cached) {
      this.markDirty(cached.bounds);
      this.nodes.delete(id);
    }
  }

  addEdge(edge: GraphEdge, style: EdgeStyle): void {
    this.edges.set(edge.id, { edge, style });
    this.markDirty();
  }

  updateEdge(id: string | number, updates: Partial<GraphEdge>, style?: EdgeStyle): void {
    const cached = this.edges.get(id);
    if (!cached) return;

    const updatedEdge = { ...cached.edge, ...updates };
    const updatedStyle = style || cached.style;

    this.edges.set(id, { edge: updatedEdge, style: updatedStyle });
    this.markDirty();
  }

  removeEdge(id: string | number): void {
    if (this.edges.has(id)) {
      this.edges.delete(id);
      this.markDirty();
    }
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.markDirty();
  }

  dispose(): void {
    this.layers.forEach(canvas => {
      canvas.remove();
    });
    this.layers.clear();
    this.contexts.clear();
    this.nodes.clear();
    this.edges.clear();
    this.textMeasureCache.clear();
    this.shapeCache.clear();
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  setTransform(transform: { x: number; y: number; scale: number }): void {
    this.transform = transform;
    this.markDirty();
  }

  getTransform(): { x: number; y: number; scale: number } {
    return { ...this.transform };
  }

  markDirty(bounds?: BoundingBox): void {
    this.isDirty = true;
    if (bounds && this.enableDirtyRegions) {
      this.dirtyRegions.add(bounds);
    }
  }

  getType(): 'svg' | 'canvas' | 'webgl' {
    return 'canvas';
  }

  getMetrics(): RendererMetrics {
    return { ...this.metrics };
  }

  private calculateNodeBounds(node: GraphNode, style: NodeStyle): BoundingBox {
    const x = (node as any).x || 0;
    const y = (node as any).y || 0;
    const radius = style.radius || 30;
    const padding = 10;

    return {
      x: x - radius - padding,
      y: y - radius - padding,
      width: (radius + padding) * 2,
      height: (radius + padding) * 2
    };
  }
}
