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
  private hasDragged: boolean = false;
  private hoveredNode: string | number | null;
  private hoveredEdge: string | number | null;
  private currentTransform: { x: number; y: number; scale: number };
  private originalNodeStyles: Map<string | number, any>;
  private originalEdgeStyles: Map<string | number, any>;
  private boundHandlers: {
    mousedown?: (event: MouseEvent) => void;
    mousemove?: (event: MouseEvent) => void;
    mouseup?: (event: MouseEvent) => void;
    click?: (event: MouseEvent) => void;
    contextmenu?: (event: MouseEvent) => void;
  };
  private container?: HTMLElement;

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
    this.boundHandlers = {};
    this.container = undefined;
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
        .scaleExtent([0.3, 5]) // More reasonable zoom range
        .filter((event) => {
          // Allow zoom with wheel only
          if (event.type === 'wheel') return true;
          
          // Block all zoom/pan for click events - we handle those separately
          if (event.type === 'click' || event.type === 'dblclick') return false;
          
          // Block zoom/pan when dragging a node
          if (this.draggedNode !== null) return false;
          
          // For mousedown, only allow pan if not on a node or edge and user is holding space or middle mouse
          if (event.type === 'mousedown') {
            // Middle mouse button or space+left click for panning
            if (event.button === 1) return true; // Middle mouse
            
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
    
    // Store container reference for cleanup
    this.container = container;
    
    // Setup mouse interactions for nodes (use capture phase for priority)
    // Store bound handlers so we can remove them later
    this.boundHandlers.mousedown = (event) => this.handleMouseDown(event);
    this.boundHandlers.mousemove = (event) => this.handleMouseMove(event);
    this.boundHandlers.mouseup = (event) => this.handleMouseUp(event);
    this.boundHandlers.click = (event) => this.handleClick(event);
    this.boundHandlers.contextmenu = (event) => event.preventDefault();
    
    container.addEventListener('mousedown', this.boundHandlers.mousedown, true);
    container.addEventListener('mousemove', this.boundHandlers.mousemove, false);
    container.addEventListener('mouseup', this.boundHandlers.mouseup, false);
    container.addEventListener('click', this.boundHandlers.click, false);
    container.addEventListener('contextmenu', this.boundHandlers.contextmenu);
  }

  private handleMouseDown(event: MouseEvent): void {
    const mousePos = this.getMousePosition(event);
    const worldPos = this.screenToWorld(mousePos);
    const node = this.getNodeAtPosition(worldPos);
    
    if (node && this.config.draggable) {
      this.draggedNode = node.id;
      this.dragStartPos = worldPos;
      this.hasDragged = false; // Reset drag flag
      
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
      
      // Calculate drag delta
      const dx = worldPos.x - this.dragStartPos.x;
      const dy = worldPos.y - this.dragStartPos.y;
      
      // Mark as dragged if moved more than 2 pixels (prevents accidental selection changes)
      if (!this.hasDragged && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        this.hasDragged = true;
      }
      
      // Determine which nodes to move
      const nodesToMove = new Set<string | number>();
      
      // If dragged node is selected and there are multiple selections, move all selected nodes
      if (this.selectedNodes.has(this.draggedNode) && this.selectedNodes.size > 1) {
        this.selectedNodes.forEach(nodeId => nodesToMove.add(nodeId));
      } else {
        // Otherwise just move the single dragged node
        nodesToMove.add(this.draggedNode);
      }
      
      // Move all nodes in the set
      nodesToMove.forEach(nodeId => {
        const pos = this.positions.get(nodeId);
        const node = this.nodes.get(nodeId);
        
        if (pos && node) {
          // Get original position before this drag started
          const originalPos = (node as any).originalDragPos || { 
            x: pos.x - dx, 
            y: pos.y - dy 
          };
          
          // Store original position for subsequent moves
          if (!(node as any).originalDragPos) {
            (node as any).originalDragPos = { x: originalPos.x, y: originalPos.y };
          }
          
          // Update position relative to original position
          pos.x = originalPos.x + dx;
          pos.y = originalPos.y + dy;
          
          // Update node object
          (node as any).x = pos.x;
          (node as any).y = pos.y;
          
          // CRITICAL: Update spatial index in Graph
          this.graph.updateNode(nodeId, { 
            x: pos.x, 
            y: pos.y 
          } as any);
          
          // Update the renderer's internal node data
          this.renderer.updateNode(nodeId, { 
            ...node,
            position: { x: pos.x, y: pos.y }
          } as any);
          
          // Update all connected edges (both renderer and spatial index)
          const connectedEdges = this.graph.getConnectedEdges(nodeId);
          connectedEdges.forEach(edge => {
            // Update edge in spatial index with new node positions
            this.graph.updateEdge(edge.id, {});
            // Update edge in renderer
            this.renderer.updateEdge(edge.id, edge);
          });
        }
      });
      
      // Re-render immediately
      this.renderer.render();
      
      const node = this.nodes.get(this.draggedNode);
      if (node) {
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
      
      // Clear temporary drag positions from all nodes
      this.nodes.forEach(n => {
        delete (n as any).originalDragPos;
      });
      
      this.emit({
        type: 'node-dragend',
        target: node,
        position: mousePos,
        originalEvent: event,
      });
      
      this.draggedNode = null;
      this.dragStartPos = null;
    }
    
    // Always reset hasDragged on mouseup
    // Use setTimeout to allow the click handler to still detect drag-click vs normal-click
    setTimeout(() => {
      this.hasDragged = false;
    }, 10);
  }

  private handleClick(event: MouseEvent): void {
    // Ignore click if we just finished dragging
    if (this.hasDragged) {
      return;
    }
    
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
    
    // Show hitboxes if enabled
    if (this.config.showHitboxes) {
      this.showHitboxForClick(node, edge);
    }
    
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
    // Use spatial index for O(log n) lookup instead of O(n)
    const candidates = this.graph.getNodesNearPoint(worldPos, 50);
    
    // Check only candidate nodes for precise hit test
    for (const node of candidates) {
      const pos = this.positions.get(node.id);
      if (!pos) continue;
      
      // Get radius from node properties
      let radius = 30; // default
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
    
    // First check if clicking on a glyph
    const glyphHit = this.getGlyphAtPosition(worldPos);
    if (glyphHit) {
      // Return edge but with glyph metadata
      const edge = this.edges.get(glyphHit.edgeId);
      if (edge) {
        (edge as any).__glyphHit = {
          direction: glyphHit.direction,
          predicate: glyphHit.predicate,
          position: glyphHit.position
        };
        return edge;
      }
    }
    
    // Use spatial index for O(log n) lookup
    const candidates = this.graph.getEdgesNearPoint(worldPos, threshold);
    
    for (const edge of candidates) {
      const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
      const targetId = 'target' in edge ? edge.target : (edge as any).object;
      
      const sourcePos = this.positions.get(sourceId);
      const targetPos = this.positions.get(targetId);
      
      if (!sourcePos || !targetPos) continue;
      
      // Get bundle info and edge style to check if it's curved
      const bundleInfo = this.graph.getEdgeBundleInfo(edge.id);
      const edgeStyle = this.graph.getEdgeStyle(edge.id);
      
      // Determine if edge is curved
      const curvature = bundleInfo?.curvature ?? edgeStyle?.curvature ?? 0;
      const parallelOffset = bundleInfo?.parallelOffset ?? edgeStyle?.parallelOffset ?? 0;
      const isCurved = curvature !== 0 || parallelOffset !== 0;
      
      let dist: number;
      
      if (isCurved) {
        // Calculate control point for bezier curve with bundler's curvature and offset
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) continue;
        
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        
        // Perpendicular offset for multi-edges
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        const controlX = midX + (-dy * curvature) + (perpX * parallelOffset);
        const controlY = midY + (dx * curvature) + (perpY * parallelOffset);
        
        const controlPoint = { x: controlX, y: controlY };
        dist = this.distanceToQuadraticBezier(worldPos, sourcePos, controlPoint, targetPos);
      } else {
        // Straight line
        dist = this.distanceToLineSegment(worldPos, sourcePos, targetPos);
      }
      
      if (dist <= threshold) {
        return edge;
      }
    }
    
    return null;
  }

  /**
   * Check if position is over an edge glyph
   */
  private getGlyphAtPosition(worldPos: Position): { 
    edgeId: string | number; 
    direction: 'forward' | 'backward'; 
    predicate: string;
    position: number;
    propertyNodeId?: string | number;
  } | null {
    const glyphThreshold = 12 / this.currentTransform.scale; // Slightly larger than glyph radius
    
    // Check all edges for glyphs
    for (const edge of this.edges.values()) {
      const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
      const targetId = 'target' in edge ? edge.target : (edge as any).object;
      
      const sourcePos = this.positions.get(sourceId);
      const targetPos = this.positions.get(targetId);
      
      if (!sourcePos || !targetPos) continue;
      
      const edgeStyle = this.graph.getEdgeStyle(edge.id);
      if (!edgeStyle) continue;
      
      // Get glyphs from style or auto-generate for inverse relationships
      let glyphs: any[] = [];
      
      if (edgeStyle.glyphs && edgeStyle.glyphs.length > 0) {
        glyphs = edgeStyle.glyphs;
      } else if (edgeStyle.relationshipMode === 'inverse' && edgeStyle.forwardPredicate && edgeStyle.inversePredicate) {
        glyphs = [
          {
            position: 0.15,
            text: edgeStyle.forwardPredicate,
            size: 16,
            direction: 'forward'
          },
          {
            position: 0.85,
            text: edgeStyle.inversePredicate,
            size: 16,
            direction: 'backward'
          }
        ];
      }
      
      if (glyphs.length === 0) continue;
      
      // Get bundle info for curvature
      const bundleInfo = this.graph.getEdgeBundleInfo(edge.id);
      const curvature = bundleInfo?.curvature ?? edgeStyle.curvature ?? 0;
      const parallelOffset = bundleInfo?.parallelOffset ?? edgeStyle.parallelOffset ?? 0;
      const isCurved = curvature !== 0 || parallelOffset !== 0;
      
      // Calculate control point if curved
      let controlPoint: { x: number; y: number } | null = null;
      if (isCurved) {
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= 1) {
          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;
          const perpX = -dy / distance;
          const perpY = dx / distance;
          
          controlPoint = {
            x: midX + (-dy * curvature) + (perpX * parallelOffset),
            y: midY + (dx * curvature) + (perpY * parallelOffset)
          };
        }
      }
      
      // Check each glyph
      for (const glyph of glyphs) {
        const t = glyph.position || 0.5;
        let glyphPos: Position;
        
        if (controlPoint) {
          // Bezier curve position
          const u = 1 - t;
          const tt = t * t;
          const uu = u * u;
          
          glyphPos = {
            x: uu * sourcePos.x + 2 * u * t * controlPoint.x + tt * targetPos.x,
            y: uu * sourcePos.y + 2 * u * t * controlPoint.y + tt * targetPos.y
          };
        } else {
          // Straight line position
          glyphPos = {
            x: sourcePos.x + (targetPos.x - sourcePos.x) * t,
            y: sourcePos.y + (targetPos.y - sourcePos.y) * t
          };
        }
        
        // Check distance to glyph center
        const dx = worldPos.x - glyphPos.x;
        const dy = worldPos.y - glyphPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= glyphThreshold) {
          return {
            edgeId: edge.id,
            direction: glyph.direction || 'forward',
            predicate: glyph.text || glyph.icon || '',
            position: t,
            propertyNodeId: glyph.propertyNodeId
          };
        }
      }
    }
    
    return null;
  }

  private calculateBezierControlPoint(start: Position, end: Position): Position {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Perpendicular vector
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return { x: midX, y: midY };
    
    // Normalize perpendicular
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Offset control point perpendicular to the line (30% of edge length)
    const offset = length * 0.3;
    
    return {
      x: midX + perpX * offset,
      y: midY + perpY * offset
    };
  }

  private distanceToQuadraticBezier(
    point: Position,
    start: Position,
    control: Position,
    end: Position,
    samples: number = 20
  ): number {
    let minDist = Infinity;
    
    // Sample points along the curve
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      
      const curveX = uu * start.x + 2 * u * t * control.x + tt * end.x;
      const curveY = uu * start.y + 2 * u * t * control.y + tt * end.y;
      
      const dx = point.x - curveX;
      const dy = point.y - curveY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
      }
    }
    
    return minDist;
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
    
    // Emit nodeSelected event for UI components like Inspector
    const node = this.nodes.get(nodeId);
    if (node) {
      this.emit({
        type: 'nodeSelected' as any,
        target: node,
        position: { x: 0, y: 0 },
        originalEvent: new Event('nodeSelected'),
        data: { node }
      });
    }
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
    const hadSelection = this.selectedNodes.size > 0 || this.selectedEdges.size > 0;
    
    this.selectedNodes.forEach((nodeId) => {
      this.highlightNode(nodeId, false);
    });
    this.selectedNodes.clear();
    
    this.selectedEdges.forEach((edgeId) => {
      this.highlightEdge(edgeId, false);
    });
    this.selectedEdges.clear();
    
    // Emit selectionCleared event for UI components like Inspector
    if (hadSelection) {
      this.emit({
        type: 'selectionCleared' as any,
        target: null,
        position: { x: 0, y: 0 },
        originalEvent: new Event('selectionCleared')
      });
    }
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
    
    // Emit edgeSelected event for UI components like Inspector
    const edge = this.edges.get(edgeId);
    if (edge) {
      this.emit({
        type: 'edgeSelected' as any,
        target: edge,
        position: { x: 0, y: 0 },
        originalEvent: new Event('edgeSelected'),
        data: { edge }
      });
    }
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
      target: node,
      position: { x: 0, y: 0 },
      originalEvent: new Event('selection-changed'),
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
      target: edge,
      position: { x: 0, y: 0 },
      originalEvent: new Event('selection-changed'),
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

  /**
   * Show hitbox visualization for clicked node or edge
   */
  private showHitboxForClick(node: GraphNode | null, edge: GraphEdge | null): void {
    // Clear previous hitbox
    if ('clearOverlay' in this.renderer) {
      (this.renderer as any).clearOverlay();
    }

    if (node) {
      // Show node hitbox
      const pos = this.positions.get(node.id);
      if (pos && 'drawHitbox' in this.renderer) {
        const radius = 60; // Same as spatial index bounds
        (this.renderer as any).drawHitbox({
          x: pos.x - radius,
          y: pos.y - radius,
          width: radius * 2,
          height: radius * 2
        }, 'rgba(0, 150, 255, 0.4)');
      }
    } else if (edge) {
      // Show edge hitbox
      const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
      const targetId = 'target' in edge ? edge.target : (edge as any).object;
      
      const sourcePos = this.positions.get(sourceId);
      const targetPos = this.positions.get(targetId);
      
      if (sourcePos && targetPos) {
        // Check if edge is curved
        const edgeStyle = 'properties' in edge ? (edge as any).properties?.curveStyle : undefined;
        
        if (edgeStyle === 'bezier' && 'drawCurvePath' in this.renderer) {
          // Draw the bezier curve path
          const controlPoint = this.calculateBezierControlPoint(sourcePos, targetPos);
          const curvePoints: { x: number; y: number }[] = [];
          
          // Sample the curve
          for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            
            curvePoints.push({
              x: uu * sourcePos.x + 2 * u * t * controlPoint.x + tt * targetPos.x,
              y: uu * sourcePos.y + 2 * u * t * controlPoint.y + tt * targetPos.y
            });
          }
          
          (this.renderer as any).drawCurvePath(curvePoints, 'rgba(0, 255, 100, 0.6)');
        }
        
        // Show bounding box
        if ('drawHitbox' in this.renderer) {
          const tolerance = 10;
          const minX = Math.min(sourcePos.x, targetPos.x) - tolerance;
          const minY = Math.min(sourcePos.y, targetPos.y) - tolerance;
          const maxX = Math.max(sourcePos.x, targetPos.x) + tolerance;
          const maxY = Math.max(sourcePos.y, targetPos.y) + tolerance;
          
          (this.renderer as any).drawHitbox({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          }, 'rgba(255, 100, 0, 0.3)');
        }
      }
    }

    // Re-render to show the hitbox
    this.renderer.render();
  }

  /**
   * Clean up event listeners and references
   */
  destroy(): void {
    // Remove event listeners
    if (this.container && this.boundHandlers) {
      if (this.boundHandlers.mousedown) {
        this.container.removeEventListener('mousedown', this.boundHandlers.mousedown, true);
      }
      if (this.boundHandlers.mousemove) {
        this.container.removeEventListener('mousemove', this.boundHandlers.mousemove, false);
      }
      if (this.boundHandlers.mouseup) {
        this.container.removeEventListener('mouseup', this.boundHandlers.mouseup, false);
      }
      if (this.boundHandlers.click) {
        this.container.removeEventListener('click', this.boundHandlers.click, false);
      }
      if (this.boundHandlers.contextmenu) {
        this.container.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
      }
    }
    
    // Remove d3 zoom behavior
    if (this.zoomBehavior && this.container) {
      d3.select(this.container).on('.zoom', null);
    }
    
    // Clear all event listeners
    this.eventListeners.clear();
    
    // Clear selections
    this.selectedNodes.clear();
    this.selectedEdges.clear();
    
    // Clear references
    this.boundHandlers = {};
    this.container = undefined;
    this.draggedNode = null;
    this.dragStartPos = null;
    this.hoveredNode = null;
    this.hoveredEdge = null;
  }
}
