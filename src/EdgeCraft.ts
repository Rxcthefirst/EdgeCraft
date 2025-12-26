/**
 * Main EdgeCraft class - public API
 */

import { Graph } from './core/Graph';
import { Renderer } from './renderer/Renderer';
import { InteractionManager } from './interaction/InteractionManager';
import { getLayoutEngine } from './layout/LayoutEngine';
import {
  EdgeCraftConfig,
  GraphData,
  GraphNode,
  GraphEdge,
  NodeStyle,
  EdgeStyle,
  LayoutConfig,
  Position,
  EventCallback,
  LPGNode,
  LPGEdge,
  RDFNode,
  RDFTriple,
} from './types';

export class EdgeCraft {
  private graph: Graph;
  private renderer: Renderer;
  private interactionManager: InteractionManager;
  private config: EdgeCraftConfig;
  private positions: Map<string | number, Position>;
  private container: HTMLElement;

  constructor(config: EdgeCraftConfig) {
    this.config = this.validateConfig(config);
    this.container = this.resolveContainer(config.container);
    this.graph = new Graph(config.data);
    this.positions = new Map();

    // Initialize renderer
    const width = config.width || this.container.clientWidth || 800;
    const height = config.height || this.container.clientHeight || 600;
    const backgroundColor = config.backgroundColor || '#ffffff';

    this.renderer = new Renderer(this.container, width, height, backgroundColor);

    // Compute layout and render
    this.computeLayout();
    this.render();

    // Initialize interaction manager
    this.interactionManager = new InteractionManager(
      this.graph,
      this.renderer,
      this.positions,
      config.interaction || {}
    );

    // Fit view after initial render
    setTimeout(() => this.interactionManager.fitView(), 100);
  }

  // ============================================================================
  // Data Management
  // ============================================================================

  setData(data: GraphData): void {
    this.graph.setData(data);
    this.computeLayout();
    this.render();
    this.interactionManager.updatePositions(this.positions);
  }

  getData(): GraphData {
    return this.graph.getData();
  }

  addNode(node: GraphNode): void {
    this.graph.addNode(node);
    this.computeLayout();
    this.render();
    this.interactionManager.updatePositions(this.positions);
  }

  removeNode(nodeId: string | number): boolean {
    const result = this.graph.removeNode(nodeId);
    if (result) {
      this.computeLayout();
      this.render();
      this.interactionManager.updatePositions(this.positions);
    }
    return result;
  }

  addEdge(edge: GraphEdge): void {
    this.graph.addEdge(edge);
    this.render();
  }

  removeEdge(edgeId: string | number): boolean {
    const result = this.graph.removeEdge(edgeId);
    if (result) {
      this.render();
    }
    return result;
  }

  // ============================================================================
  // Layout Management
  // ============================================================================

  setLayout(layoutConfig: LayoutConfig): void {
    this.config.layout = layoutConfig;
    this.computeLayout();
    this.render();
    this.interactionManager.updatePositions(this.positions);
  }

  private computeLayout(): void {
    const layoutConfig = this.config.layout || { type: 'force' };
    const layoutEngine = getLayoutEngine(layoutConfig.type);
    this.positions = layoutEngine.compute(this.graph, layoutConfig);
  }

  // ============================================================================
  // Rendering
  // ============================================================================

  render(): void {
    const nodeStyle = this.config.nodeStyle || this.getDefaultNodeStyle();
    const edgeStyle = this.config.edgeStyle || this.getDefaultEdgeStyle();

    this.renderer.render(this.graph, this.positions, nodeStyle, edgeStyle);
  }

  private getDefaultNodeStyle(): NodeStyle {
    return {
      fill: '#4a90e2',
      stroke: '#2c5aa0',
      strokeWidth: 2,
      radius: 20,
      shape: 'circle',
      label: {
        fontSize: 12,
        color: '#333',
        position: 'center',
      },
    };
  }

  private getDefaultEdgeStyle(): EdgeStyle {
    return {
      stroke: '#999',
      strokeWidth: 2,
      arrow: 'forward',
    };
  }

  // ============================================================================
  // Interaction & Events
  // ============================================================================

  on(eventType: string, callback: EventCallback): void {
    this.interactionManager.on(eventType, callback);
  }

  off(eventType: string, callback: EventCallback): void {
    this.interactionManager.off(eventType, callback);
  }

  getSelectedNodes(): (string | number)[] {
    return this.interactionManager.getSelectedNodes();
  }

  selectNode(nodeId: string | number): void {
    this.interactionManager.selectNode(nodeId);
  }

  clearSelection(): void {
    this.interactionManager.clearSelection();
  }

  // ============================================================================
  // View Control
  // ============================================================================

  fitView(): void {
    this.interactionManager.fitView();
  }

  centerView(): void {
    this.interactionManager.centerView();
  }

  zoomIn(): void {
    this.interactionManager.zoomIn();
  }

  zoomOut(): void {
    this.interactionManager.zoomOut();
  }

  resetZoom(): void {
    this.interactionManager.resetZoom();
  }

  // ============================================================================
  // Graph Queries
  // ============================================================================

  getNode(nodeId: string | number): GraphNode | undefined {
    return this.graph.getNode(nodeId);
  }

  getEdge(edgeId: string | number): GraphEdge | undefined {
    return this.graph.getEdge(edgeId);
  }

  getAllNodes(): GraphNode[] {
    return this.graph.getAllNodes();
  }

  getAllEdges(): GraphEdge[] {
    return this.graph.getAllEdges();
  }

  getNeighbors(nodeId: string | number): GraphNode[] {
    return this.graph.getNeighbors(nodeId);
  }

  getConnectedEdges(nodeId: string | number): GraphEdge[] {
    return this.graph.getConnectedEdges(nodeId);
  }

  // ============================================================================
  // RDF-specific Methods
  // ============================================================================

  queryTriples(
    subject?: string | number,
    predicate?: string,
    object?: string | number
  ): RDFTriple[] {
    return this.graph.queryTriples(subject, predicate, object);
  }

  addTriple(subject: string | number, predicate: string, object: string | number): void {
    const triple: RDFTriple = {
      id: `${subject}-${predicate}-${object}`,
      subject,
      predicate,
      object,
    };
    this.addEdge(triple);
  }

  // ============================================================================
  // Export & Import
  // ============================================================================

  toJSON(): string {
    return JSON.stringify(this.getData());
  }

  fromJSON(json: string): void {
    const data = JSON.parse(json);
    this.setData(data);
  }

  exportSVG(): string {
    return this.renderer.getSVG().outerHTML;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  destroy(): void {
    const svg = this.renderer.getSVG();
    if (svg.parentNode) {
      svg.parentNode.removeChild(svg);
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private validateConfig(config: EdgeCraftConfig): EdgeCraftConfig {
    if (!config.container) {
      throw new Error('EdgeCraft: container is required');
    }
    return config;
  }

  private resolveContainer(container: HTMLElement | string): HTMLElement {
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`EdgeCraft: container "${container}" not found`);
      }
      return element as HTMLElement;
    }
    return container;
  }
}

// Re-export types for convenience
export * from './types';
export { Graph } from './core/Graph';
