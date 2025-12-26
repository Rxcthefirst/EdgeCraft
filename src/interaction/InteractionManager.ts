/**
 * Interaction handler for graph events
 */

import { Graph } from '../core/Graph';
import { Renderer } from '../renderer/Renderer';
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
import { drag } from 'd3-drag';

export class InteractionManager {
  private graph: Graph;
  private renderer: Renderer;
  private config: InteractionConfig;
  private eventListeners: Map<string, Set<EventCallback>>;
  private selectedNodes: Set<string | number>;
  private zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null;
  private positions: Map<string | number, Position>;

  constructor(
    graph: Graph,
    renderer: Renderer,
    positions: Map<string | number, Position>,
    config: InteractionConfig
  ) {
    this.graph = graph;
    this.renderer = renderer;
    this.positions = positions;
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
    this.zoomBehavior = null;

    this.setupInteractions();
  }

  private setupInteractions(): void {
    const svg = d3.select(this.renderer.getSVG());
    const g = d3.select(this.renderer.getMainGroup());

    // Setup zoom
    if (this.config.zoomable) {
      this.zoomBehavior = zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(this.zoomBehavior);
    }

    // Setup node interactions
    if (this.config.draggable || this.config.selectable || this.config.hoverable) {
      this.graph.getAllNodes().forEach((node) => {
        this.setupNodeInteraction(node);
      });
    }

    // Setup background click
    svg.on('click', (event) => {
      if (event.target === this.renderer.getSVG()) {
        this.clearSelection();
        this.emit({
          type: 'background-click',
          target: null,
          position: this.getMousePosition(event),
          originalEvent: event,
        });
      }
    });
  }

  private setupNodeInteraction(node: GraphNode): void {
    const nodeElement = this.renderer.getNodeElement(node.id);
    if (!nodeElement) return;

    const d3Node = d3.select(nodeElement);

    // Drag behavior
    if (this.config.draggable) {
      const dragBehavior = drag<SVGGElement, unknown>()
        .on('start', (event) => {
          d3.select(event.sourceEvent.target.parentNode).raise();
          this.emit({
            type: 'node-dragstart',
            target: node,
            position: { x: event.x, y: event.y },
            originalEvent: event.sourceEvent,
          });
        })
        .on('drag', (event) => {
          const currentPos = this.positions.get(node.id);
          if (currentPos) {
            currentPos.x = event.x;
            currentPos.y = event.y;
            d3Node.attr('transform', `translate(${event.x}, ${event.y})`);

            // Update connected edges
            this.updateConnectedEdges(node.id);

            this.emit({
              type: 'node-drag',
              target: node,
              position: { x: event.x, y: event.y },
              originalEvent: event.sourceEvent,
            });
          }
        })
        .on('end', (event) => {
          this.emit({
            type: 'node-dragend',
            target: node,
            position: { x: event.x, y: event.y },
            originalEvent: event.sourceEvent,
          });
        });

      d3Node.call(dragBehavior as any);
    }

    // Click behavior
    if (this.config.selectable) {
      d3Node.on('click', (event) => {
        event.stopPropagation();

        if (this.config.multiSelect && event.shiftKey) {
          this.toggleNodeSelection(node.id);
        } else {
          this.selectNode(node.id);
        }

        this.emit({
          type: 'node-click',
          target: node,
          position: this.getMousePosition(event),
          originalEvent: event,
        });
      });
    }

    // Hover behavior
    if (this.config.hoverable) {
      d3Node
        .on('mouseenter', (event) => {
          d3Node.style('cursor', 'pointer');
          this.emit({
            type: 'node-mouseenter',
            target: node,
            position: this.getMousePosition(event),
            originalEvent: event,
          });
        })
        .on('mouseleave', (event) => {
          d3Node.style('cursor', 'default');
          this.emit({
            type: 'node-mouseleave',
            target: node,
            position: this.getMousePosition(event),
            originalEvent: event,
          });
        });
    }
  }

  private updateConnectedEdges(nodeId: string | number): void {
    const edges = this.graph.getConnectedEdges(nodeId);
    const svg = this.renderer.getSVG();

    edges.forEach((edge) => {
      const edgeElement = this.renderer.getEdgeElement(edge.id);
      if (!edgeElement) return;

      const sourceId = 'source' in edge ? edge.source : edge.subject;
      const targetId = 'target' in edge ? edge.target : edge.object;

      const sourcePos = this.positions.get(sourceId);
      const targetPos = this.positions.get(targetId);

      if (!sourcePos || !targetPos) return;

      const path = edgeElement.querySelector('path');
      if (path) {
        const pathData = `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;
        path.setAttribute('d', pathData);
      }

      // Update edge label position
      const labelGroup = edgeElement.querySelector('g');
      if (labelGroup) {
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        labelGroup.setAttribute('transform', `translate(${midX}, ${midY})`);
      }
    });
  }

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
  }

  private highlightNode(nodeId: string | number, highlight: boolean): void {
    const nodeElement = this.renderer.getNodeElement(nodeId);
    if (!nodeElement) return;

    const shape = nodeElement.querySelector('circle, rect, polygon');
    if (shape) {
      if (highlight) {
        shape.setAttribute('stroke', '#ff6b6b');
        shape.setAttribute('stroke-width', '4');
      } else {
        shape.setAttribute('stroke', '#2c5aa0');
        shape.setAttribute('stroke-width', '2');
      }
    }
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

  private getMousePosition(event: MouseEvent): Position {
    const svg = this.renderer.getSVG();
    const rect = svg.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  centerView(): void {
    if (!this.zoomBehavior) return;

    const svg = d3.select(this.renderer.getSVG());
    const svgNode = this.renderer.getSVG();
    const width = svgNode.clientWidth;
    const height = svgNode.clientHeight;

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

    svg.transition().duration(750).call(this.zoomBehavior.transform as any, transform);
  }

  fitView(): void {
    this.centerView();
  }

  zoomIn(): void {
    if (!this.zoomBehavior) return;
    const svg = d3.select(this.renderer.getSVG());
    svg.transition().duration(300).call(this.zoomBehavior.scaleBy as any, 1.3);
  }

  zoomOut(): void {
    if (!this.zoomBehavior) return;
    const svg = d3.select(this.renderer.getSVG());
    svg.transition().duration(300).call(this.zoomBehavior.scaleBy as any, 0.7);
  }

  resetZoom(): void {
    if (!this.zoomBehavior) return;
    const svg = d3.select(this.renderer.getSVG());
    svg.transition().duration(300).call(this.zoomBehavior.transform as any, zoomIdentity);
  }

  updatePositions(newPositions: Map<string | number, Position>): void {
    this.positions = newPositions;
  }

  getSelectedNodes(): (string | number)[] {
    return Array.from(this.selectedNodes);
  }
}
