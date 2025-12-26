import { IRenderer } from '../renderer/IRenderer';
import {
  GraphEvent,
  EventCallback,
  InteractionConfig,
  Position,
  GraphNode,
  GraphEdge,
} from '../types';
import * as d3 from 'd3-selection';
import { zoom, zoomIdentity, ZoomBehavior } from 'd3-zoom';
import { Graph } from '../core/Graph';

export class InteractionManager {
  private renderer: IRenderer;
  private config: InteractionConfig;
  private eventListeners: Map<string, Set<EventCallback>>;
  private selectedNodes: Set<string | number>;
  private selectedEdges: Set<string | number>;
  private zoomBehavior: ZoomBehavior<HTMLElement, unknown> | null;
  private positions: Map<string | number, Position>;
  private nodes: Map<string | number, GraphNode>;
  private edges: Map<string | number, GraphEdge>;
  private graph: Graph;
  private draggedNode: string | number | null;
  private dragStartPos: Position | null;
  private hoveredNode: string | number | null;
  private hoveredEdge: string | number | null;
  private currentTransform: { x: number; y: number; scale: number };
  private originalNodeStyles: Map<string | number, any>;
  private originalEdgeStyles: Map<string | number, any>;

  constructor(
    renderer: IRenderer,
    positions: Map<string | number, Position>,
    nodes: Map<string | number, GraphNode>,
    graph: Graph,
    config: InteractionConfig
  ) {
    this.renderer = renderer;
    this.positions = positions;
    this.nodes = nodes;
    this.graph = graph;
    this.config = {
      draggable: true,
      zoomable: true,
      selectable: true,
      hoverable: true,
      multiSelect: false,
      ...config,
    };
    this.eventListeners = new Map();
    this.selectedNodes = new Set();
    this.selectedEdges = new Set();
    this.zoomBehavior = null;
    this.draggedNode = null;
    this.dragStartPos = null;
    this.hoveredNode = null;
    this.hoveredEdge = null;
    this.currentTransform = { x: 0, y: 0, scale: 1 };
    this.originalNodeStyles = new Map();
    this.originalEdgeStyles = new Map();
    
    // Build edges map from graph
    this.edges = new Map();
    this.graph.getAllEdges().forEach(edge => {
      this.edges.set(edge.id, edge);
    });

    this.setupInteractions();
  }

  private setupInteractions(): void {
    const container = this.renderer.getContainer();
    
    // Setup zoom/pan
    if (this.config.zoomable) {
      this.zoomBehavior = zoom<HTMLElement, unknown>()
        .scaleExtent([0.1, 10])
        .filter((event) => {
          // Allow zoom with wheel
          if (event.type === 'wheel') return true;
          
          // Block all zoom/pan for click events - we handle those separately
          if (event.type === 'click' || event.type === 'dblclick') return false;
          
          // Block zoom/pan when dragging a node
          if (this.draggedNode !== null) return false;
          
          // For mousedown, only allow if not on a node or edge
          if (event.type === 'mousedown' && !event.shiftKey) {
            const mousePos = this.getMousePosition(event);
            const worldPos = this.screenToWorld(mousePos);
            const node = this.getNodeAtPosition(worldPos);
            const edge = !node ? this.getEdgeAtPosition(worldPos) : null;
            return !node && !edge;
          }
          
          return !event.button;
        })
        .on('zoom', (event) => {
          if (this.draggedNode !== null) return; // Skip zoom updates during drag
          const { x, y, k: scale } = event.transform;
          this.currentTransform = { x, y, scale };
          this.renderer.setTransform({ x, y, scale });
          this.renderer.render();
        });

      d3.select(container).call(this.zoomBehavior);
    }
    
    // Setup mouse interactions for nodes (use capture phase for priority)
    container.addEventListener('mousedown', (event) => this.handleMouseDown(event), true);
    container.addEventListener('mousemove', (event) => this.handleMouseMove(event), false);
    container.addEventListener('mouseup', (event) => this.handleMouseUp(event), false);
    container.addEventListener('click', (event) => this.handleClick(event), false);
    
    // Prevent context menu
    container.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private handleMouseDown(event: MouseEvent): void {
    const mousePos = this.getMousePosition(event);
    const worldPos = this.screenToWorld(mousePos);
    const node = this.getNodeAtPosition(worldPos);
    
    if (node && this.config.draggable) {
      this.draggedNode = node.id;
      this.dragStartPos = worldPos;
      
      // Prevent zoom/pan from interfering
      event.preventDefault();
      event.stopPropagation();
      
      this.emit({
        type: 'node-dragstart',
        target: node,
        position: mousePos,
        originalEvent: event,
      });
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const mousePos = this.getMousePosition(event);
    const worldPos = this.screenToWorld(mousePos);
    
    // Handle drag
    if (this.draggedNode && this.dragStartPos) {
      event.preventDefault();
      event.stopPropagation();
      
      const pos = this.positions.get(this.draggedNode);
      const node = this.nodes.get(this.draggedNode);
      
      if (pos && node) {
        // Update position in positions Map
        pos.x = worldPos.x;
        pos.y = worldPos.y;
        
        // Update node object
        (node as any).x = worldPos.x;
        (node as any).y = worldPos.y;
        
        // Update the renderer's internal node data
        this.renderer.updateNode(this.draggedNode, { 
          ...node,
          position: { x: worldPos.x, y: worldPos.y }
        } as any);
        
        // Update all connected edges
        const connectedEdges = this.graph.getConnectedEdges(this.draggedNode);
        connectedEdges.forEach(edge => {
          this.renderer.updateEdge(edge.id, edge);
        });
        
        // Re-render immediately
        this.renderer.render();
        
        this.emit({
          type: 'node-drag',
          target: node,
          position: mousePos,
          originalEvent: event,
        });
      }
      return;
    }
    
    // Handle hover
    if (this.config.hoverable) {
      const node = this.getNodeAtPosition(worldPos);
      const nodeId = node?.id || null;
      
      if (nodeId !== this.hoveredNode) {
        // Mouse leave previous node
        if (this.hoveredNode) {
          const prevNode = this.nodes.get(this.hoveredNode);
          if (prevNode) {
            this.emit({
              type: 'node-mouseleave',
              target: prevNode,
              position: mousePos,
              originalEvent: event,
            });
          }
        }
        
        // Mouse enter new node
        if (node) {
          this.emit({
            type: 'node-mouseenter',
            target: node,
            position: mousePos,
            originalEvent: event,
          });
        }
        
        this.hoveredNode = nodeId;
        
        // Update cursor
        const container = this.renderer.getContainer();
        container.style.cursor = nodeId ? 'pointer' : 'default';
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.draggedNode) {
      const mousePos = this.getMousePosition(event);
      const node = this.nodes.get(this.draggedNode) || null;
      
      this.emit({
        type: 'node-dragend',
        target: node,
        position: mousePos,
        originalEvent: event,
      });
      
      this.draggedNode = null;
      this.dragStartPos = null;
    }
  }

  private handleClick(event: MouseEvent): void {
    const mousePos = this.getMousePosition(event);
    const worldPos = this.screenToWorld(mousePos);
    const node = this.getNodeAtPosition(worldPos);
    const edge = !node ? this.getEdgeAtPosition(worldPos) : null;
    
    console.log('[InteractionManager] Click:', {
      node: node?.id,
      edge: edge?.id,
      shiftKey: event.shiftKey,
      multiSelectEnabled: this.config.multiSelect
    });
    
    if (node && this.config.selectable) {
      event.stopPropagation();
      
      if (this.config.multiSelect && event.shiftKey) {
        console.log('[InteractionManager] Toggle node selection:', node.id);
        this.toggleNodeSelection(node.id);
      } else {
        console.log('[InteractionManager] Select node:', node.id);
        this.selectNode(node.id);
        this.clearEdgeSelection();
      }
      
      this.emit({
        type: 'node-click',
        target: node,
        position: mousePos,
        originalEvent: event,
      });
    } else if (edge && this.config.selectable) {
      event.stopPropagation();
      
      console.log('[InteractionManager] Edge clicked:', edge.id);
      
      if (this.config.multiSelect && event.shiftKey) {
        console.log('[InteractionManager] Toggle edge selection:', edge.id);
        this.toggleEdgeSelection(edge.id);
      } else {
        console.log('[InteractionManager] Select edge:', edge.id);
        this.selectEdge(edge.id);
        this.clearNodeSelection();
      }
      
      this.emit({
        type: 'edge-click',
        target: edge,
        position: mousePos,
        originalEvent: event,
      });
    } else {
      // Background click
      this.clearSelection();
      this.emit({
        type: 'background-click',
        target: null,
        position: mousePos,
        originalEvent: event,
      });
    }
  }

  private getNodeAtPosition(worldPos: Position): GraphNode | null {
    // Check all nodes for hit test
    for (const [id, node] of this.nodes.entries()) {
      const pos = this.positions.get(id);
      if (!pos) continue;
      
      // Get radius from node properties (LPGNode has properties, RDFNode doesn't)
      let radius = 30; // default to match renderer
      if ('properties' in node && node.properties) {
        radius = (node.properties as any).radius || 30;
      }
      
      const dx = worldPos.x - pos.x;
      const dy = worldPos.y - pos.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= radius * radius) {
        return node;
      }
    }
    
    return null;
  }

  private screenToWorld(screenPos: Position): Position {
    // Convert screen coordinates to world coordinates accounting for zoom/pan
    return {
      x: (screenPos.x - this.currentTransform.x) / this.currentTransform.scale,
      y: (screenPos.y - this.currentTransform.y) / this.currentTransform.scale,
    };
  }

  private getEdgeAtPosition(worldPos: Position): GraphEdge | null {
    const threshold = 15 / this.currentTransform.scale; // Larger threshold for easier selection
    
    for (const [_edgeId, edge] of this.edges.entries()) {
      const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
      const targetId = 'target' in edge ? edge.target : (edge as any).object;
      
      const sourcePos = this.positions.get(sourceId);
      const targetPos = this.positions.get(targetId);
      
      if (!sourcePos || !targetPos) continue;
      
      // Check if clicking on edge label (if edge has label)
      if ('label' in edge || ('properties' in edge && (edge as any).properties?.label)) {
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        const labelThreshold = 30; // Pixels around label center
        
        const dx = worldPos.x - midX;
        const dy = worldPos.y - midY;
        const distToLabel = Math.sqrt(dx * dx + dy * dy);
        
        if (distToLabel <= labelThreshold) {
          return edge;
        }
      }
      
      // Calculate distance from point to line segment
      const dist = this.distanceToLineSegment(worldPos, sourcePos, targetPos);
      
      if (dist <= threshold) {
        return edge;
      }
    }
    
    return null;
  }

  private distanceToLineSegment(point: Position, lineStart: Position, lineEnd: Position): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
      // Line segment is actually a point
      const pdx = point.x - lineStart.x;
      const pdy = point.y - lineStart.y;
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }
    
    // Calculate projection of point onto line
    let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t)); // Clamp to segment
    
    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;
    
    const pdx = point.x - projX;
    const pdy = point.y - projY;
    
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  selectNode(nodeId: string | number): void {
    this.clearSelection();
    this.selectedNodes.add(nodeId);
    this.highlightNode(nodeId, true);
  }

  toggleNodeSelection(nodeId: string | number): void {
    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId);
      this.highlightNode(nodeId, false);
    } else {
      this.selectedNodes.add(nodeId);
      this.highlightNode(nodeId, true);
    }
  }

  clearSelection(): void {
    this.selectedNodes.forEach((nodeId) => {
      this.highlightNode(nodeId, false);
    });
    this.selectedNodes.clear();
    
    this.selectedEdges.forEach((edgeId) => {
      this.highlightEdge(edgeId, false);
    });
    this.selectedEdges.clear();
  }

  clearNodeSelection(): void {
    this.selectedNodes.forEach((nodeId) => {
      this.highlightNode(nodeId, false);
    });
    this.selectedNodes.clear();
  }

  clearEdgeSelection(): void {
    this.selectedEdges.forEach((edgeId) => {
      this.highlightEdge(edgeId, false);
    });
    this.selectedEdges.clear();
  }

  selectEdge(edgeId: string | number): void {
    this.clearSelection();
    this.selectedEdges.add(edgeId);
    this.highlightEdge(edgeId, true);
  }

  toggleEdgeSelection(edgeId: string | number): void {
    if (this.selectedEdges.has(edgeId)) {
      this.selectedEdges.delete(edgeId);
      this.highlightEdge(edgeId, false);
    } else {
      this.selectedEdges.add(edgeId);
      this.highlightEdge(edgeId, true);
    }
  }

  private highlightNode(nodeId: string | number, highlight: boolean): void {
    console.log('[InteractionManager] highlightNode:', { nodeId, highlight });
    
    const node = this.nodes.get(nodeId);
    if (!node) {
      console.warn('[InteractionManager] Node not found:', nodeId);
      return;
    }
    
    // Update node properties for highlighting
    if ('properties' in node) {
      if (!node.properties) {
        node.properties = {};
      }
      node.properties.selected = highlight;
      console.log('[InteractionManager] Set node.properties.selected:', highlight, node.properties);
    } else {
      // For RDFNode, add a custom property
      (node as any).selected = highlight;
      console.log('[InteractionManager] Set node.selected:', highlight);
    }
    
    // Also update in the Graph - get the actual node object from Graph and modify it
    const graphNode = this.graph.getNode(nodeId);
    if (graphNode) {
      if ('properties' in graphNode) {
        if (!graphNode.properties) {
          graphNode.properties = {};
        }
        graphNode.properties.selected = highlight;
        console.log('[InteractionManager] Updated graph node properties:', graphNode.properties);
      } else {
        (graphNode as any).selected = highlight;
        console.log('[InteractionManager] Updated graph node selected:', highlight);
      }
    } else {
      console.warn('[InteractionManager] Graph node not found:', nodeId);
    }
    
    // Trigger re-render which will pick up the selected state
    console.log('[InteractionManager] Triggering render...');
    this.emit({
      type: 'selection-changed' as any,
      data: { nodeId, selected: highlight }
    });
  }

  private highlightEdge(edgeId: string | number, highlight: boolean): void {
    const edge = this.edges.get(edgeId);
    if (!edge) return;
    
    // Update edge properties for highlighting
    if ('properties' in edge) {
      if (!edge.properties) {
        (edge as any).properties = {};
      }
      (edge as any).properties.selected = highlight;
    } else {
      // For edges without properties field, add custom property
      (edge as any).selected = highlight;
    }
    
    // Also update in the Graph
    const graphEdge = this.graph.getEdge(edgeId);
    if (graphEdge) {
      if ('properties' in graphEdge) {
        if (!(graphEdge as any).properties) {
          (graphEdge as any).properties = {};
        }
        (graphEdge as any).properties.selected = highlight;
      } else {
        (graphEdge as any).selected = highlight;
      }
    }
    
    // Trigger re-render
    this.emit({
      type: 'selection-changed' as any,
      data: { edgeId, selected: highlight }
    });
  }

  private getMousePosition(event: MouseEvent): Position {
    const container = this.renderer.getContainer();
    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  on(eventType: string, callback: EventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: GraphEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }
  }

  // ============================================================================
  // View Controls
  // ============================================================================

  centerView(): void {
    if (!this.zoomBehavior) return;

    const container = d3.select(this.renderer.getContainer());
    const containerNode = this.renderer.getContainer();
    const width = containerNode.clientWidth;
    const height = containerNode.clientHeight;

    // Calculate bounding box of all nodes
    const positions = Array.from(this.positions.values());
    if (positions.length === 0) return;

    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    // Calculate scale to fit
    const scale = Math.min(
      width / (graphWidth + 100),
      height / (graphHeight + 100),
      1
    );

    // Calculate translation to center
    const translateX = width / 2 - graphCenterX * scale;
    const translateY = height / 2 - graphCenterY * scale;

    const transform = zoomIdentity.translate(translateX, translateY).scale(scale);

    container.transition().duration(750).call(this.zoomBehavior.transform as any, transform);
  }

  fitView(): void {
    this.centerView();
  }

  zoomIn(): void {
    if (!this.zoomBehavior) return;
    const container = d3.select(this.renderer.getContainer());
    container.transition().duration(300).call(this.zoomBehavior.scaleBy as any, 1.3);
  }

  zoomOut(): void {
    if (!this.zoomBehavior) return;
    const container = d3.select(this.renderer.getContainer());
    container.transition().duration(300).call(this.zoomBehavior.scaleBy as any, 0.7);
  }

  resetZoom(): void {
    if (!this.zoomBehavior) return;
    const container = d3.select(this.renderer.getContainer());
    container.transition().duration(300).call(this.zoomBehavior.transform as any, zoomIdentity);
  }

  updatePositions(newPositions: Map<string | number, Position>): void {
    this.positions = newPositions;
  }

  updateNodes(newNodes: Map<string | number, GraphNode>): void {
    this.nodes = newNodes;
  }

  updateEdges(newEdges: Map<string | number, GraphEdge>): void {
    this.edges = newEdges;
  }

  getSelectedNodes(): (string | number)[] {
    return Array.from(this.selectedNodes);
  }

  getSelectedEdges(): (string | number)[] {
    return Array.from(this.selectedEdges);
  }
}
