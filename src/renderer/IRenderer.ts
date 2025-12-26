import { GraphNode, GraphEdge, NodeStyle, EdgeStyle } from '../types';

/**
 * Renderer abstraction interface
 * Allows multiple rendering backends (SVG, Canvas, WebGL)
 */
export interface IRenderer {
  /**
   * Initialize the renderer
   */
  initialize(): void;

  /**
   * Render all nodes and edges
   */
  render(): void;

  /**
   * Add a node to the renderer
   */
  addNode(node: GraphNode, style: NodeStyle): void;

  /**
   * Update a node's position and/or style
   */
  updateNode(id: string | number, updates: Partial<GraphNode>, style?: NodeStyle): void;

  /**
   * Remove a node from the renderer
   */
  removeNode(id: string | number): void;

  /**
   * Add an edge to the renderer
   */
  addEdge(edge: GraphEdge, style: EdgeStyle): void;

  /**
   * Update an edge's style or endpoints
   */
  updateEdge(id: string | number, updates: Partial<GraphEdge>, style?: EdgeStyle): void;

  /**
   * Remove an edge from the renderer
   */
  removeEdge(id: string | number): void;

  /**
   * Clear all rendered content
   */
  clear(): void;

  /**
   * Clean up and destroy the renderer
   */
  dispose(): void;

  /**
   * Get the container element
   */
  getContainer(): HTMLElement;

  /**
   * Set the viewport transform (zoom/pan)
   */
  setTransform(transform: { x: number; y: number; scale: number }): void;

  /**
   * Get the current transform
   */
  getTransform(): { x: number; y: number; scale: number };

  /**
   * Mark a region as dirty for re-rendering
   */
  markDirty(bounds?: { x: number; y: number; width: number; height: number }): void;

  /**
   * Get the renderer type
   */
  getType(): 'svg' | 'canvas' | 'webgl';

  /**
   * Get performance metrics
   */
  getMetrics(): RendererMetrics;
}

export interface RendererMetrics {
  fps: number;
  renderTime: number;
  nodeCount: number;
  edgeCount: number;
  lastFrameTime: number;
}

export type RendererType = 'svg' | 'canvas' | 'webgl';

export interface RendererConfig {
  type?: RendererType | 'auto';
  container: string | HTMLElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
  enableCache?: boolean;
  enableDirtyRegions?: boolean;
}
