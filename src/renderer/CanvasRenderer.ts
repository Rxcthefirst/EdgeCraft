import { GraphNode, GraphEdge, NodeStyle, EdgeStyle } from '../types';
import { IRenderer, RendererMetrics } from './IRenderer';
import { Graph } from '../core/Graph';

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
  private graph?: Graph; // Reference to graph for multi-edge bundling
  
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
      canvas.style.pointerEvents = 'none'; // All layers should not block mouse events
      
      const ctx = canvas.getContext('2d', { alpha: layerType !== 'background' })!;
      ctx.scale(this.pixelRatio, this.pixelRatio);
      
      this.layers.set(layerType, canvas);
      this.contexts.set(layerType, ctx);
      this.container.appendChild(canvas);
    });

    // Draw background
    this.renderBackground();
  }

  /**
   * Set graph reference for multi-edge bundling support
   */
  setGraph(graph: Graph): void {
    this.graph = graph;
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
    
    // Early return if contexts haven't been initialized
    if (this.contexts.size === 0) {
      return;
    }

    // Clear dynamic layers
    ['edges', 'nodes', 'labels'].forEach(layer => {
      const ctx = this.contexts.get(layer as LayerType);
      if (!ctx) {
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
      case 'window':
        this.renderWindowNode(ctx, x, y, style);
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, style.radius || 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Render icon inside the shape if provided (simple mode)
        if (style.icon && style.displayMode !== 'detailed') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${(style.radius || 30) * 0.8}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(style.icon, x, y);
        }
        break;

      case 'rectangle':
        const rectSize = (style.radius || 30) * 1.5;
        ctx.fillRect(x - rectSize / 2, y - rectSize / 2, rectSize, rectSize);
        ctx.strokeRect(x - rectSize / 2, y - rectSize / 2, rectSize, rectSize);
        
        // Render icon inside the shape if provided (simple mode)
        if (style.icon && style.displayMode !== 'detailed') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${(style.radius || 30) * 0.8}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(style.icon, x, y);
        }
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
        
        // Render icon inside the shape if provided (simple mode)
        if (style.icon && style.displayMode !== 'detailed') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${diamondSize * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(style.icon, x, y);
        }
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
        
        // Render icon inside the shape if provided (simple mode)
        if (style.icon && style.displayMode !== 'detailed') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${hexSize * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(style.icon, x, y);
        }
        break;

      default:
        // Default to circle
        ctx.beginPath();
        ctx.arc(x, y, style.radius || 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Render icon inside the shape if provided (simple mode)
        if (style.icon && style.displayMode !== 'detailed') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${(style.radius || 30) * 0.8}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(style.icon, x, y);
        }
    }

    ctx.restore();
  }

  private renderWindowNode(ctx: CanvasRenderingContext2D, x: number, y: number, style: any): void {
    const win = style.window || {};
    const width = win.width || 120;
    const height = win.height || 80;
    const borderRadius = win.borderRadius || 8;
    const padding = win.padding || 10;
    const headerHeight = win.headerHeight || 30;
    const bgColor = win.backgroundColor || style.fill || '#ffffff';
    const borderColor = win.borderColor || style.stroke || '#2c3e50';
    const borderWidth = win.borderWidth || style.strokeWidth || 2;
    
    const left = x - width / 2;
    const top = y - height / 2;
    
    ctx.save();
    
    // Draw rounded rectangle background
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    
    ctx.beginPath();
    ctx.moveTo(left + borderRadius, top);
    ctx.lineTo(left + width - borderRadius, top);
    ctx.arcTo(left + width, top, left + width, top + borderRadius, borderRadius);
    ctx.lineTo(left + width, top + height - borderRadius);
    ctx.arcTo(left + width, top + height, left + width - borderRadius, top + height, borderRadius);
    ctx.lineTo(left + borderRadius, top + height);
    ctx.arcTo(left, top + height, left, top + height - borderRadius, borderRadius);
    ctx.lineTo(left, top + borderRadius);
    ctx.arcTo(left, top, left + borderRadius, top, borderRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw header area (if icon exists)
    if (style.icon) {
      ctx.fillStyle = style.fill || '#3498db';
      ctx.beginPath();
      ctx.moveTo(left + borderRadius, top);
      ctx.lineTo(left + width - borderRadius, top);
      ctx.arcTo(left + width, top, left + width, top + borderRadius, borderRadius);
      ctx.lineTo(left + width, top + headerHeight);
      ctx.lineTo(left, top + headerHeight);
      ctx.lineTo(left, top + borderRadius);
      ctx.arcTo(left, top, left + borderRadius, top, borderRadius);
      ctx.closePath();
      ctx.fill();
      
      // Render icon in header
      ctx.fillStyle = '#ffffff';
      ctx.font = `${headerHeight * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(style.icon, x, top + headerHeight / 2);
    }
    
    // Render text lines in content area
    if (win.lines && win.lines.length > 0) {
      const contentTop = top + (style.icon ? headerHeight : 0) + padding;
      const fontSize = 11;
      const lineHeight = fontSize * 1.3;
      
      ctx.fillStyle = '#333';
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      win.lines.forEach((line: string, index: number) => {
        const lineY = contentTop + index * lineHeight;
        // Truncate text if too long
        let displayText = line;
        const maxWidth = width - padding * 2;
        if (ctx.measureText(displayText).width > maxWidth) {
          while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
          }
          displayText += '...';
        }
        ctx.fillText(displayText, left + padding, lineY);
      });
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

    // Split text into lines for multi-line support
    const lines = label.text ? label.text.split('\\n') : [];
    const lineHeight = fontSize * 1.2;
    
    // Draw background if specified
    if (label.backgroundColor && lines.length > 0) {
      const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      const padding = 4;
      const bgWidth = maxWidth + padding * 2;
      const bgHeight = lines.length * lineHeight + padding * 2;
      
      ctx.fillStyle = label.backgroundColor;
      ctx.fillRect(
        labelX - bgWidth / 2,
        labelY - (lines.length - 1) * lineHeight / 2 - bgHeight / 2,
        bgWidth,
        bgHeight
      );
    }

    // Draw text (multi-line support)
    ctx.fillStyle = label.color || '#333';
    lines.forEach((line, index) => {
      const lineY = labelY + (index - (lines.length - 1) / 2) * lineHeight;
      ctx.fillText(line, labelX, lineY);
    });

    ctx.restore();
  }

  private renderEdge(ctx: CanvasRenderingContext2D, cached: CachedEdge): void {
    const { edge, style } = cached;
    
    const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
    const targetId = 'target' in edge ? edge.target : (edge as any).object;
    
    // Check for self-loop
    const isSelfLoop = sourceId === targetId;
    
    if (isSelfLoop) {
      this.renderSelfLoop(ctx, edge, style);
      return;
    }
    
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

    // Get bundle info from graph for intelligent multi-edge handling
    const bundleInfo = this.graph?.getEdgeBundleInfo(edge.id);
    
    // Use bundle curvature and offset if available, otherwise fall back to style
    const curvature = bundleInfo?.curvature ?? (style.curvature !== undefined ? style.curvature : 0.2);
    const parallelOffset = bundleInfo?.parallelOffset ?? (style.parallelOffset || 0);
    
    // Cache style in graph for accurate spatial index bounds
    if (this.graph && (curvature !== 0 || parallelOffset !== 0)) {
      this.graph.setEdgeStyle(edge.id, { ...style, curvature, parallelOffset });
    }
    
    // Draw edge path
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    
    let endX = tx;
    let endY = ty;
    let controlX = 0;
    let controlY = 0;
    
    if (curvature === 0 && parallelOffset === 0) {
      // Straight line
      ctx.lineTo(tx, ty);
    } else {
      // Curved line with optional offset
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      
      // Perpendicular offset for multi-edges
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      controlX = midX + (-dy * curvature) + (perpX * parallelOffset);
      controlY = midY + (dx * curvature) + (perpY * parallelOffset);
      
      ctx.quadraticCurveTo(controlX, controlY, tx, ty);
      endX = tx;
      endY = ty;
    }
    ctx.stroke();

    // Draw arrows with new ArrowConfig support
    const arrowConfig = this.normalizeArrowConfig(style.arrow);
    
    if (arrowConfig.position === 'forward' || arrowConfig.position === 'both') {
      if (curvature === 0 && parallelOffset === 0) {
        this.drawArrowHead(ctx, sx, sy, tx, ty, arrowConfig);
      } else {
        // For curved edges, calculate tangent at end point
        const t = 0.95; // Draw arrow slightly before end
        const bezierPoint = this.getQuadraticBezierPoint(sx, sy, controlX, controlY, tx, ty, t);
        const tangent = this.getQuadraticBezierTangent(sx, sy, controlX, controlY, tx, ty, 1.0);
        this.drawArrowHeadAtPoint(ctx, bezierPoint.x, bezierPoint.y, tangent.angle, arrowConfig);
      }
    }
    
    if (arrowConfig.position === 'backward' || arrowConfig.position === 'both') {
      if (curvature === 0 && parallelOffset === 0) {
        this.drawArrowHead(ctx, tx, ty, sx, sy, arrowConfig);
      } else {
        const t = 0.05; // Draw arrow slightly after start
        const bezierPoint = this.getQuadraticBezierPoint(sx, sy, controlX, controlY, tx, ty, t);
        const tangent = this.getQuadraticBezierTangent(sx, sy, controlX, controlY, tx, ty, 0.0);
        this.drawArrowHeadAtPoint(ctx, bezierPoint.x, bezierPoint.y, tangent.angle + Math.PI, arrowConfig);
      }
    }

    // Render glyphs for inverse relationships
    if (style.glyphs && style.glyphs.length > 0) {
      style.glyphs.forEach(glyph => {
        if (curvature === 0 && parallelOffset === 0) {
          this.renderGlyph(ctx, glyph, sx, sy, tx, ty, null);
        } else {
          this.renderGlyph(ctx, glyph, sx, sy, tx, ty, { x: controlX, y: controlY });
        }
      });
    } else if (style.relationshipMode === 'inverse' && style.forwardPredicate && style.inversePredicate) {
      // Auto-generate glyphs for inverse relationships
      const sourceGlyph: any = {
        position: 0.15,
        text: style.forwardPredicate,
        shape: 'square',
        size: 16,
        fill: style.stroke || '#95a5a6',
        stroke: '#ffffff',
        interactive: true,
        direction: 'forward'
      };
      
      const targetGlyph: any = {
        position: 0.85,
        text: style.inversePredicate,
        shape: 'square',
        size: 16,
        fill: style.stroke || '#95a5a6',
        stroke: '#ffffff',
        interactive: true,
        direction: 'backward'
      };
      
      if (curvature === 0 && parallelOffset === 0) {
        this.renderGlyph(ctx, sourceGlyph, sx, sy, tx, ty, null);
        this.renderGlyph(ctx, targetGlyph, sx, sy, tx, ty, null);
      } else {
        this.renderGlyph(ctx, sourceGlyph, sx, sy, tx, ty, { x: controlX, y: controlY });
        this.renderGlyph(ctx, targetGlyph, sx, sy, tx, ty, { x: controlX, y: controlY });
      }
    }

    ctx.restore();
  }

  /**
   * Render a glyph on an edge
   */
  private renderGlyph(
    ctx: CanvasRenderingContext2D,
    glyph: any,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlPoint: { x: number; y: number } | null
  ): void {
    const t = glyph.position || 0.5;
    
    // Calculate point and tangent on edge
    let point: { x: number; y: number };
    let angle: number;
    
    if (controlPoint) {
      // Quadratic bezier curve
      point = this.getQuadraticBezierPoint(startX, startY, controlPoint.x, controlPoint.y, endX, endY, t);
      const tangent = this.getQuadraticBezierTangent(startX, startY, controlPoint.x, controlPoint.y, endX, endY, t);
      angle = tangent.angle;
    } else {
      // Straight line
      point = {
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t
      };
      angle = Math.atan2(endY - startY, endX - startX);
    }
    
    ctx.save();
    ctx.translate(point.x, point.y);
    
    // Keep glyph upright
    let rotation = angle;
    if (Math.abs(angle) > Math.PI / 2) {
      rotation = angle + Math.PI;
    }
    ctx.rotate(rotation);
    
    const size = glyph.size || 16;
    const halfSize = size / 2;
    
    // Draw glyph shape
    ctx.fillStyle = glyph.fill || '#95a5a6';
    ctx.strokeStyle = glyph.stroke || '#ffffff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    
    switch (glyph.shape) {
      case 'circle':
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        break;
        
      case 'diamond':
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(halfSize, 0);
        ctx.lineTo(0, halfSize);
        ctx.lineTo(-halfSize, 0);
        ctx.closePath();
        break;
        
      case 'square':
      default:
        ctx.rect(-halfSize, -halfSize, size, size);
        break;
    }
    
    ctx.fill();
    ctx.stroke();
    
    // Draw text/icon inside glyph
    if (glyph.text || glyph.icon) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `${size * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayText = glyph.text || glyph.icon;
      // Truncate to first 3 chars for compact display
      const truncated = displayText.length > 3 ? displayText.substring(0, 3) : displayText;
      ctx.fillText(truncated, 0, 0);
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

  /**
   * Normalize arrow configuration to ArrowConfig object
   */
  private normalizeArrowConfig(arrow: any): { position: string; size: number; shape: string; filled: boolean; offset: number } {
    if (!arrow || arrow === 'none') {
      return { position: 'none', size: 10, shape: 'triangle', filled: true, offset: 20 };
    }
    
    if (typeof arrow === 'string') {
      return { position: arrow, size: 10, shape: 'triangle', filled: true, offset: 20 };
    }
    
    return {
      position: arrow.position || 'forward',
      size: arrow.size || 10,
      shape: arrow.shape || 'triangle',
      filled: arrow.filled !== false,
      offset: arrow.offset || 20
    };
  }

  /**
   * Draw arrow head at specific point with angle
   */
  private drawArrowHeadAtPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    config: { size: number; shape: string; filled: boolean }
  ): void {
    const size = config.size;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    
    switch (config.shape) {
      case 'triangle':
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size / 2);
        ctx.lineTo(-size, size / 2);
        ctx.closePath();
        break;
        
      case 'chevron':
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size / 2);
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, size / 2);
        break;
        
      case 'diamond':
        ctx.moveTo(0, 0);
        ctx.lineTo(-size * 0.7, -size / 2);
        ctx.lineTo(-size * 1.4, 0);
        ctx.lineTo(-size * 0.7, size / 2);
        ctx.closePath();
        break;
        
      case 'circle':
        ctx.arc(-size / 2, 0, size / 2, 0, Math.PI * 2);
        break;
    }
    
    if (config.filled && config.shape !== 'chevron') {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
    
    if (!config.filled || config.shape === 'chevron') {
      ctx.stroke();
    }
    
    ctx.restore();
  }

  /**
   * Draw arrow head between two points
   */
  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    config: { size: number; shape: string; filled: boolean; offset: number }
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Position arrow at offset from target
    const arrowX = toX - Math.cos(angle) * config.offset;
    const arrowY = toY - Math.sin(angle) * config.offset;
    
    this.drawArrowHeadAtPoint(ctx, arrowX, arrowY, angle, config);
  }

  /**
   * Render self-loop edge
   */
  private renderSelfLoop(ctx: CanvasRenderingContext2D, edge: any, style: any): void {
    const sourceId = 'source' in edge ? edge.source : edge.subject;
    const sourceNode = this.nodes.get(sourceId);
    
    if (!sourceNode) return;
    
    const x = (sourceNode.node as any).x || 0;
    const y = (sourceNode.node as any).y || 0;
    const nodeRadius = sourceNode.style.radius || 30;
    
    const loopConfig = style.selfLoop || {};
    const loopRadius = loopConfig.radius || 35;
    const angle = ((loopConfig.angle || 45) * Math.PI / 180);  // Default 45 degrees (top-right)
    const clockwise = loopConfig.clockwise !== false;
    
    ctx.save();
    
    ctx.strokeStyle = style.stroke || '#95a5a6';
    ctx.lineWidth = style.strokeWidth || 2;
    
    if (style.strokeDasharray) {
      const dashArray = style.strokeDasharray.split(',').map((v: string) => parseFloat(v.trim()));
      ctx.setLineDash(dashArray);
    }
    
    // Calculate attachment points on node circle - closer together for more circular loop
    const attachmentSpread = Math.PI / 6; // 30 degrees spread
    const startAngle = angle - attachmentSpread;
    const endAngle = angle + attachmentSpread;
    
    const startX = x + nodeRadius * Math.cos(startAngle);
    const startY = y + nodeRadius * Math.sin(startAngle);
    const endX = x + nodeRadius * Math.cos(endAngle);
    const endY = y + nodeRadius * Math.sin(endAngle);
    
    // Control points for cubic bezier - positioned to create circular arc
    // The key is to place control points further out and at wider angles
    const controlDistance = nodeRadius + loopRadius;
    const controlSpread = Math.PI / 2.5; // Control points spread wider for circular shape
    
    const control1Angle = angle - controlSpread;
    const control2Angle = angle + controlSpread;
    
    const control1X = x + controlDistance * Math.cos(control1Angle);
    const control1Y = y + controlDistance * Math.sin(control1Angle);
    const control2X = x + controlDistance * Math.cos(control2Angle);
    const control2Y = y + controlDistance * Math.sin(control2Angle);
    
    // Draw cubic bezier curve
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(control1X, control1Y, control2X, control2Y, endX, endY);
    ctx.stroke();
    
    // Draw arrow at end if configured
    const arrowConfig = this.normalizeArrowConfig(style.arrow);
    
    if (arrowConfig.position === 'forward' || arrowConfig.position === 'both') {
      // Calculate tangent at end point for arrow direction
      const t = 1.0;
      const tangentAngle = this.getCubicBezierTangentAngle(
        startX, startY, control1X, control1Y,
        control2X, control2Y, endX, endY, t
      );
      this.drawArrowHeadAtPoint(ctx, endX, endY, tangentAngle, arrowConfig);
    }
    
    if (arrowConfig.position === 'backward' || arrowConfig.position === 'both') {
      const t = 0.0;
      const tangentAngle = this.getCubicBezierTangentAngle(
        startX, startY, control1X, control1Y,
        control2X, control2Y, endX, endY, t
      ) + Math.PI;
      this.drawArrowHeadAtPoint(ctx, startX, startY, tangentAngle, arrowConfig);
    }
    
    ctx.restore();
  }

  /**
   * Get point on quadratic bezier curve at t (0 to 1)
   */
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

  /**
   * Get tangent angle on quadratic bezier curve at t (0 to 1)
   */
  private getQuadraticBezierTangent(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    t: number
  ): { angle: number } {
    const u = 1 - t;
    
    const dx = 2 * u * (x1 - x0) + 2 * t * (x2 - x1);
    const dy = 2 * u * (y1 - y0) + 2 * t * (y2 - y1);
    
    return { angle: Math.atan2(dy, dx) };
  }

  /**
   * Get tangent angle on cubic bezier curve at t (0 to 1)
   */
  private getCubicBezierTangentAngle(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    t: number
  ): number {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    
    const dx = 3 * uu * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * tt * (x3 - x2);
    const dy = 3 * uu * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * tt * (y3 - y2);
    
    return Math.atan2(dy, dx);
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

    // Calculate label position at edge midpoint
    const dx = tx - sx;
    const dy = ty - sy;
    
    // Get curvature from bundler (same logic as renderEdge)
    const bundleInfo = this.graph?.getEdgeBundleInfo(edge.id);
    const curvature = bundleInfo?.curvature ?? (style.curvature !== undefined ? style.curvature : 0.2);
    const parallelOffset = bundleInfo?.parallelOffset ?? (style.parallelOffset || 0);
    
    let labelX: number, labelY: number;
    
    if (curvature === 0 && parallelOffset === 0) {
      // Straight line - use simple midpoint
      labelX = (sx + tx) / 2;
      labelY = (sy + ty) / 2;
    } else {
      // Curved line - use bezier midpoint
      const distance = Math.sqrt(dx * dx + dy * dy);
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      
      // Perpendicular offset for multi-edges
      const perpX = distance > 0 ? -dy / distance : 0;
      const perpY = distance > 0 ? dx / distance : 0;
      
      const controlX = midX + (-dy * curvature) + (perpX * parallelOffset);
      const controlY = midY + (dx * curvature) + (perpY * parallelOffset);
      
      // Bezier curve midpoint at t=0.5
      labelX = (sx + 2 * controlX + tx) / 4;
      labelY = (sy + 2 * controlY + ty) / 4;
    }

    ctx.save();

    const label = style.label;
    const fontSize = label.fontSize || 10;
    const fontFamily = label.fontFamily || 'Arial, sans-serif';
    
    // Rotate label to align with edge if enabled
    if (label.rotateWithEdge !== false) { // Default to true
      const angle = Math.atan2(dy, dx);
      // Keep text upright - flip if angle is upside down
      let displayAngle = angle;
      if (Math.abs(angle) > Math.PI / 2) {
        displayAngle = angle + Math.PI;
      }
      ctx.translate(labelX, labelY);
      ctx.rotate(displayAngle);
      labelX = 0;
      labelY = 0;
    }
    
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

  /**
   * Draw hitbox for debugging - shows bounding box for nodes/edges
   */
  drawHitbox(bounds: { x: number; y: number; width: number; height: number }, color: string = 'rgba(255, 0, 0, 0.3)'): void {
    const ctx = this.contexts.get('overlay');
    if (!ctx) return;

    ctx.save();
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / this.transform.scale;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    ctx.restore();
  }

  /**
   * Draw a path/curve for debugging
   */
  drawCurvePath(points: { x: number; y: number }[], color: string = 'rgba(0, 255, 0, 0.5)'): void {
    const ctx = this.contexts.get('overlay');
    if (!ctx) return;

    ctx.save();
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / this.transform.scale;
    ctx.beginPath();
    
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Clear the overlay layer (for hitboxes and debug drawings)
   */
  clearOverlay(): void {
    const ctx = this.contexts.get('overlay');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width * this.pixelRatio, this.height * this.pixelRatio);
    ctx.restore();
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
