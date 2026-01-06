/**
 * Main EdgeCraft class - public API
 */

import { Graph } from './core/Graph';
import { IRenderer } from './renderer/IRenderer';
import { RendererFactory } from './renderer/RendererFactory';
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
  RDFTriple,
} from './types';

export class EdgeCraft {
  private graph: Graph;
  private renderer: IRenderer;
  private interactionManager: InteractionManager;
  private config: EdgeCraftConfig;
  private positions: Map<string | number, Position>;
  private container: HTMLElement;
  private selectionChangedHandler: ((event: any) => void) | null = null;

  constructor(config: EdgeCraftConfig) {
    this.config = this.validateConfig(config);
    this.container = this.resolveContainer(config.container);
    this.graph = new Graph(config.data);
    this.positions = new Map();

    // Initialize renderer (Canvas or WebGL based on node count)
    const width = config.width || this.container.clientWidth || 800;
    const height = config.height || this.container.clientHeight || 600;
    const nodeCount = config.data?.nodes?.length || 0;

    // Clear container to remove any previous renderer canvases
    this.container.innerHTML = '';

    // Use Canvas/WebGL renderer system with auto-detection
    this.renderer = RendererFactory.create({
      type: config.renderer?.type || 'auto',
      container: this.container,
      width,
      height,
      pixelRatio: config.renderer?.pixelRatio,
      enableCache: config.renderer?.enableCache,
      enableDirtyRegions: config.renderer?.enableDirtyRegions
    }, nodeCount);
    
    this.renderer.initialize();
    
    // Set graph reference in renderer for multi-edge bundling support
    if ('setGraph' in this.renderer && typeof this.renderer.setGraph === 'function') {
      (this.renderer as any).setGraph(this.graph);
    }
    
    // Log which renderer was chosen
    const rendererType = this.renderer.getType();
    console.log(`EdgeCraft: Using ${rendererType.toUpperCase()} renderer (${nodeCount} nodes)`);

    // Compute layout and render
    this.computeLayout();
    this.render();

    // Get nodes as a Map for interaction manager
    const nodesMap = new Map<string | number, GraphNode>();
    const allNodes = this.graph.getAllNodes();
    allNodes.forEach(node => nodesMap.set(node.id, node));

    // Initialize interaction manager with nodes map
    this.interactionManager = new InteractionManager(
      this.renderer,
      this.positions,
      nodesMap,
      this.graph,
      config.interaction || {}
    );

    // Fit view after initial render
    setTimeout(() => {
      this.interactionManager.fitView();
      
      // Listen for selection changes to trigger re-render with updated styles
      // Do this after initialization is complete to avoid premature renders
      this.selectionChangedHandler = (event: any) => {
        // Only update affected nodes/edges instead of full render
        this.updateSelectionStyles(event);
      };
      this.interactionManager.on('selection-changed' as any, this.selectionChangedHandler);
    }, 100);
  }

  // ============================================================================
  // Data Management
  // ============================================================================

  setData(data: GraphData): void {
    this.graph.setData(data);
    this.computeLayout();
    this.render();
    
    // Update interaction manager with new data
    const nodesMap = new Map<string | number, GraphNode>();
    this.graph.getAllNodes().forEach(node => nodesMap.set(node.id, node));
    const edgesMap = new Map<string | number, GraphEdge>();
    this.graph.getAllEdges().forEach(edge => edgesMap.set(edge.id, edge));
    
    this.interactionManager.updateNodes(nodesMap);
    this.interactionManager.updateEdges(edgesMap);
    this.interactionManager.updatePositions(this.positions);
  }

  getData(): GraphData {
    return this.graph.getData();
  }

  addNode(node: GraphNode): void {
    this.graph.addNode(node);
    this.computeLayout();
    this.render();
    
    // Update interaction manager with new node
    const nodesMap = new Map<string | number, GraphNode>();
    this.graph.getAllNodes().forEach(n => nodesMap.set(n.id, n));
    this.interactionManager.updateNodes(nodesMap);
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

  /**
   * Resolve style properties that might be functions
   * Handles both entire style as function and individual properties as functions
   */
  private resolveNodeStyle(node: GraphNode): NodeStyle {
    const baseStyle = this.config.nodeStyle || this.getDefaultNodeStyle();
    const defaultStyle = this.getDefaultNodeStyle();
    
    // If the entire style is a function, call it
    if (typeof baseStyle === 'function') {
      const style = { ...defaultStyle, ...baseStyle(node) as NodeStyle };
      return this.applySelectionStyle(node, style);
    }
    
    // Otherwise, resolve individual property functions
    const resolvedStyle: NodeStyle = { ...defaultStyle, ...baseStyle };
    
    // Resolve fill if it's a function
    if (typeof baseStyle.fill === 'function') {
      resolvedStyle.fill = (baseStyle.fill as Function)(node);
    }
    
    // Resolve stroke if it's a function
    if (typeof baseStyle.stroke === 'function') {
      resolvedStyle.stroke = (baseStyle.stroke as Function)(node);
    }
    
    // Resolve other function properties as needed
    if (typeof baseStyle.radius === 'function') {
      resolvedStyle.radius = (baseStyle.radius as Function)(node);
    }
    
    if (typeof baseStyle.strokeWidth === 'function') {
      resolvedStyle.strokeWidth = (baseStyle.strokeWidth as Function)(node);
    }
    
    if (typeof baseStyle.shape === 'function') {
      resolvedStyle.shape = (baseStyle.shape as Function)(node);
    }
    
    // @ts-ignore - strokeDasharray may be a function (dynamic styling)
    if (typeof baseStyle.strokeDasharray === 'function') {
      // @ts-ignore
      resolvedStyle.strokeDasharray = baseStyle.strokeDasharray(node);
    }
    
    // Resolve icon if it's a function
    if (typeof baseStyle.icon === 'function') {
      resolvedStyle.icon = (baseStyle.icon as Function)(node);
    }
    
    // Resolve window properties if it's a function
    if (typeof baseStyle.window === 'function') {
      resolvedStyle.window = (baseStyle.window as Function)(node);
    }
    
    // Resolve label properties
    if (baseStyle.label) {
      resolvedStyle.label = { ...baseStyle.label };
      
      // Set label text from node.label if not already set
      // @ts-ignore - LPG nodes don't have label property, only RDF
      if (!resolvedStyle.label.text && node.label) {
        // @ts-ignore
        resolvedStyle.label.text = node.label;
      }
      
      // Resolve label property functions
      // @ts-ignore - visible may be a function (dynamic styling)
      if (typeof baseStyle.label.visible === 'function') {
        // @ts-ignore
        resolvedStyle.label.visible = baseStyle.label.visible(node);
      }
      if (typeof baseStyle.label.fontSize === 'function') {
        resolvedStyle.label.fontSize = (baseStyle.label.fontSize as Function)(node);
      }
      if (typeof baseStyle.label.color === 'function') {
        resolvedStyle.label.color = (baseStyle.label.color as Function)(node);
      }
      // @ts-ignore - fontWeight may be a function (dynamic styling)
      if (typeof baseStyle.label.fontWeight === 'function') {
        // @ts-ignore
        resolvedStyle.label.fontWeight = baseStyle.label.fontWeight(node);
      }
      if (typeof baseStyle.label.position === 'function') {
        resolvedStyle.label.position = (baseStyle.label.position as Function)(node);
      }
    } else if ((node as any).label) {
      // If no label config but node has label, create default label
      resolvedStyle.label = {
        text: (node as any).label,
        position: 'center',
      };
    }
    
    return this.applySelectionStyle(node, resolvedStyle);
  }
  
  /**
   * Apply visual highlighting to selected nodes
   */
  private applySelectionStyle(node: GraphNode, style: NodeStyle): NodeStyle {
    const isSelected = ('properties' in node && node.properties?.selected) || (node as any).selected;
    
    if (isSelected) {
      return {
        ...style,
        stroke: '#2563eb', // Blue selection border
        strokeWidth: (style.strokeWidth || 2) + 3, // Thicker border
      };
    }
    
    return style;
  }

  /**
   * Resolve edge style properties that might be functions
   */
  private resolveEdgeStyle(edge: GraphEdge): EdgeStyle {
    const baseStyle = this.config.edgeStyle || this.getDefaultEdgeStyle();
    const defaultStyle = this.getDefaultEdgeStyle();
    
    // If the entire style is a function, call it
    if (typeof baseStyle === 'function') {
      return { ...defaultStyle, ...baseStyle(edge) as EdgeStyle };
    }
    
    // Otherwise, resolve individual property functions
    const resolvedStyle: EdgeStyle = { ...defaultStyle, ...baseStyle };
    
    // Resolve stroke if it's a function
    if (typeof baseStyle.stroke === 'function') {
      resolvedStyle.stroke = (baseStyle.stroke as Function)(edge);
    }
    
    // Resolve strokeWidth if it's a function
    if (typeof baseStyle.strokeWidth === 'function') {
      resolvedStyle.strokeWidth = (baseStyle.strokeWidth as Function)(edge);
    }
    
    // Resolve other function properties
    if (typeof baseStyle.strokeDasharray === 'function') {
      resolvedStyle.strokeDasharray = (baseStyle.strokeDasharray as Function)(edge);
    }
    
    return resolvedStyle;
  }

  render(): void {
    // Canvas/WebGL renderers use incremental updates
    // Clear and rebuild from graph data
    this.renderer.clear();
    
    // Add all nodes and update their positions
    this.graph.getAllNodes().forEach((node) => {
      // Add position to node object
      const pos = this.positions.get(node.id);
      if (pos) {
        (node as any).x = pos.x;
        (node as any).y = pos.y;
      }
    });
    
    // Rebuild spatial index now that nodes have positions
    this.graph.rebuildSpatialIndex();
    
    // Render nodes with their styles
    this.graph.getAllNodes().forEach((node) => {
      const nodeStyle = this.resolveNodeStyle(node);
      this.renderer.addNode(node, nodeStyle);
    });
    
    // Add all edges
    this.graph.getAllEdges().forEach((edge) => {
      const edgeStyle = this.resolveEdgeStyle(edge);
      this.renderer.addEdge(edge, edgeStyle);
    });
    
    // Trigger render
    this.renderer.render();
  }

  /**
   * Update only the nodes/edges affected by selection change
   * This is much more efficient than re-rendering the entire graph
   */
  private updateSelectionStyles(event: any): void {
    // Update the specific node or edge that was selected/deselected
    if (event.data?.nodeId !== undefined) {
      const node = this.graph.getNode(event.data.nodeId);
      if (node) {
        const nodeStyle = this.resolveNodeStyle(node);
        this.renderer.updateNode(node.id, {}, nodeStyle);
      }
    }
    
    if (event.data?.edgeId !== undefined) {
      const edge = this.graph.getEdge(event.data.edgeId);
      if (edge) {
        const edgeStyle = this.resolveEdgeStyle(edge);
        this.renderer.updateEdge(edge.id, {}, edgeStyle);
      }
    }
    
    // Trigger a single render for the updates
    this.renderer.render();
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

  getSelectedEdges(): (string | number)[] {
    return this.interactionManager.getSelectedEdges();
  }

  selectNode(nodeId: string | number): void {
    this.interactionManager.selectNode(nodeId);
  }

  selectEdge(edgeId: string | number): void {
    this.interactionManager.selectEdge(edgeId);
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
    throw new Error('exportSVG is not supported with Canvas/WebGL renderers. Use exportPNG() instead.');
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  destroy(): void {
    // Remove event listener to prevent events during destruction
    if (this.selectionChangedHandler) {
      this.interactionManager.off('selection-changed' as any, this.selectionChangedHandler);
      this.selectionChangedHandler = null;
    }
    
    // Destroy interaction manager (removes event listeners)
    this.interactionManager.destroy();
    
    // Dispose renderer (removes canvases)
    this.renderer.dispose();
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
