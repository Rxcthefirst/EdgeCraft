import { EdgeCraft } from '../EdgeCraft';

export interface MinimapConfig {
  container: string | HTMLElement;
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  viewportColor?: string;
  className?: string;
}

/**
 * Minimap Component
 * Overview visualization with viewport navigation
 */
export class Minimap {
  private container: HTMLElement;
  private config: MinimapConfig;
  private element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private viewport: HTMLElement;
  private graph?: EdgeCraft;
  
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(config: MinimapConfig) {
    this.config = {
      width: 200,
      height: 150,
      scale: 0.1,
      backgroundColor: '#f5f5f5',
      viewportColor: '#2196F3',
      ...config
    };

    // Get container element
    if (typeof config.container === 'string') {
      const el = document.querySelector(config.container);
      if (!el) {
        throw new Error(`Minimap container not found: ${config.container}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = config.container;
    }

    this.element = this.createMinimap();
    this.canvas = this.element.querySelector('.edgecraft-minimap-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.viewport = this.element.querySelector('.edgecraft-minimap-viewport') as HTMLElement;
    
    this.container.appendChild(this.element);
    this.attachEventListeners();
  }

  /**
   * Attach the minimap to a graph instance
   */
  attachToGraph(graph: EdgeCraft): void {
    this.graph = graph;
    
    // Listen for graph updates
    graph.on('render', () => this.render());
    graph.on('viewportChanged', () => this.updateViewport());
    
    // Initial render
    this.render();
    this.updateViewport();
  }

  private createMinimap(): HTMLElement {
    const minimap = document.createElement('div');
    minimap.className = `edgecraft-minimap ${this.config.className || ''}`;
    minimap.style.width = `${this.config.width}px`;
    minimap.style.height = `${this.config.height}px`;

    const canvas = document.createElement('canvas');
    canvas.className = 'edgecraft-minimap-canvas';
    canvas.width = this.config.width!;
    canvas.height = this.config.height!;
    minimap.appendChild(canvas);

    const viewport = document.createElement('div');
    viewport.className = 'edgecraft-minimap-viewport';
    minimap.appendChild(viewport);

    return minimap;
  }

  private attachEventListeners(): void {
    // Viewport dragging
    this.viewport.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      document.body.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.graph) return;

      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;

      // Move viewport in graph
      const scale = 1 / (this.config.scale || 0.1);
      this.graph.pan(dx * scale, dy * scale);

      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.style.cursor = '';
      }
    });

    // Click to navigate
    this.canvas.addEventListener('click', (e) => {
      if (!this.graph) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert minimap coordinates to graph coordinates
      const scale = 1 / (this.config.scale || 0.1);
      const graphX = (x - this.canvas.width / 2) * scale;
      const graphY = (y - this.canvas.height / 2) * scale;

      this.graph.centerOn(graphX, graphY);
    });
  }

  /**
   * Render the minimap
   */
  render(): void {
    if (!this.graph) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.fillStyle = this.config.backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Get graph bounds
    const bounds = this.graph.getBounds();
    if (!bounds) return;

    // Calculate scale to fit graph in minimap
    const scaleX = width / (bounds.maxX - bounds.minX);
    const scaleY = height / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add margin

    // Center the graph
    const offsetX = width / 2 - ((bounds.maxX + bounds.minX) / 2) * scale;
    const offsetY = height / 2 - ((bounds.maxY + bounds.minY) / 2) * scale;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw edges
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1 / scale;
    
    const edges = this.graph.getEdges();
    edges.forEach((edge: any) => {
      const source = this.graph!.getNode(edge.source);
      const target = this.graph!.getNode(edge.target);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    const nodes = this.graph.getNodes();
    nodes.forEach((node: any) => {
      const radius = 3 / scale;
      
      ctx.fillStyle = node.style?.fill || '#666';
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Update viewport indicator
   */
  updateViewport(): void {
    if (!this.graph) return;

    const viewportBounds = this.graph.getViewportBounds();
    const graphBounds = this.graph.getBounds();
    
    if (!viewportBounds || !graphBounds) return;

    // Calculate minimap scale
    const width = this.canvas.width;
    const height = this.canvas.height;
    const scaleX = width / (graphBounds.maxX - graphBounds.minX);
    const scaleY = height / (graphBounds.maxY - graphBounds.minY);
    const scale = Math.min(scaleX, scaleY) * 0.9;

    // Calculate viewport position and size in minimap coordinates
    const vpWidth = (viewportBounds.maxX - viewportBounds.minX) * scale;
    const vpHeight = (viewportBounds.maxY - viewportBounds.minY) * scale;
    const vpX = (viewportBounds.minX - graphBounds.minX) * scale;
    const vpY = (viewportBounds.minY - graphBounds.minY) * scale;

    // Update viewport element
    this.viewport.style.left = `${vpX}px`;
    this.viewport.style.top = `${vpY}px`;
    this.viewport.style.width = `${vpWidth}px`;
    this.viewport.style.height = `${vpHeight}px`;
    this.viewport.style.borderColor = this.config.viewportColor!;
  }

  /**
   * Destroy the minimap
   */
  destroy(): void {
    this.element.remove();
  }
}
