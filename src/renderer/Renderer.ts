/**
 * SVG-based renderer for graph visualization
 */

import { Graph } from '../core/Graph';
import {
  GraphNode,
  GraphEdge,
  NodeStyle,
  EdgeStyle,
  Position,
  StyleFunction,
} from '../types';

export class Renderer {
  private svg: SVGSVGElement;
  private g: SVGGElement;
  private nodeElements: Map<string | number, SVGElement>;
  private edgeElements: Map<string | number, SVGElement>;

  constructor(
    container: HTMLElement,
    width: number,
    height: number,
    backgroundColor: string = '#ffffff'
  ) {
    this.nodeElements = new Map();
    this.edgeElements = new Map();

    // Create SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', width.toString());
    this.svg.setAttribute('height', height.toString());
    this.svg.style.backgroundColor = backgroundColor;

    // Create main group for transformations
    this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(this.g);

    container.appendChild(this.svg);
  }

  render(
    graph: Graph,
    positions: Map<string | number, Position>,
    nodeStyle: NodeStyle | StyleFunction<GraphNode>,
    edgeStyle: EdgeStyle | StyleFunction<GraphEdge>
  ): void {
    this.clear();

    // Render edges first (behind nodes)
    graph.getAllEdges().forEach((edge) => {
      this.renderEdge(edge, graph, positions, edgeStyle);
    });

    // Render nodes
    graph.getAllNodes().forEach((node) => {
      this.renderNode(node, positions, nodeStyle);
    });
  }

  private renderNode(
    node: GraphNode,
    positions: Map<string | number, Position>,
    styleConfig: NodeStyle | StyleFunction<GraphNode>
  ): void {
    const position = positions.get(node.id);
    if (!position) return;

    const style = typeof styleConfig === 'function' ? styleConfig(node) : styleConfig;

    const defaultStyle: NodeStyle = {
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

    const finalStyle = { ...defaultStyle, ...style };

    // Create node group
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('transform', `translate(${position.x}, ${position.y})`);
    nodeGroup.setAttribute('data-node-id', String(node.id));

    // Create shape
    const shape = this.createNodeShape(finalStyle);
    nodeGroup.appendChild(shape);

    // Add label
    if (finalStyle.label) {
      const labelPosition = 'position' in finalStyle.label ? finalStyle.label.position : 'center';
      const label = this.createLabel(
        this.getNodeLabel(node),
        finalStyle.label.fontSize || 12,
        finalStyle.label.color || '#333',
        labelPosition || 'center'
      );
      nodeGroup.appendChild(label);
    }

    this.g.appendChild(nodeGroup);
    this.nodeElements.set(node.id, nodeGroup);
  }

  private createNodeShape(style: NodeStyle): SVGElement {
    const shape = style.shape || 'circle';
    const radius = style.radius || 20;

    let element: SVGElement;

    switch (shape) {
      case 'circle':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        element.setAttribute('r', radius.toString());
        break;

      case 'rectangle':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        element.setAttribute('x', (-radius).toString());
        element.setAttribute('y', (-radius).toString());
        element.setAttribute('width', (radius * 2).toString());
        element.setAttribute('height', (radius * 2).toString());
        element.setAttribute('rx', '4');
        break;

      case 'diamond':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        element.setAttribute(
          'points',
          `0,${-radius} ${radius},0 0,${radius} ${-radius},0`
        );
        break;

      case 'hexagon':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const r = radius;
        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
        }
        element.setAttribute('points', points.join(' '));
        break;

      default:
        element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        element.setAttribute('r', radius.toString());
    }

    element.setAttribute('fill', style.fill || '#4a90e2');
    element.setAttribute('stroke', style.stroke || '#2c5aa0');
    element.setAttribute('stroke-width', (style.strokeWidth || 2).toString());

    return element;
  }

  private renderEdge(
    edge: GraphEdge,
    _graph: Graph,
    positions: Map<string | number, Position>,
    styleConfig: EdgeStyle | StyleFunction<GraphEdge>
  ): void {
    const sourceId = 'source' in edge ? edge.source : edge.subject;
    const targetId = 'target' in edge ? edge.target : edge.object;

    const sourcePos = positions.get(sourceId);
    const targetPos = positions.get(targetId);

    if (!sourcePos || !targetPos) return;

    const style = typeof styleConfig === 'function' ? styleConfig(edge) : styleConfig;

    const defaultStyle: EdgeStyle = {
      stroke: '#999',
      strokeWidth: 2,
      arrow: 'forward',
      curvature: 0,
    };

    const finalStyle = { ...defaultStyle, ...style };

    // Create edge group
    const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    edgeGroup.setAttribute('data-edge-id', String(edge.id));

    // Create path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = this.createEdgePath(sourcePos, targetPos, finalStyle.curvature || 0);
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', finalStyle.stroke || '#999');
    path.setAttribute('stroke-width', (finalStyle.strokeWidth || 2).toString());

    if (finalStyle.strokeDasharray) {
      path.setAttribute('stroke-dasharray', finalStyle.strokeDasharray);
    }

    // Add arrow marker
    if (finalStyle.arrow && finalStyle.arrow !== 'none') {
      const markerId = this.createArrowMarker(finalStyle.stroke || '#999');
      if (finalStyle.arrow === 'forward' || finalStyle.arrow === 'both') {
        path.setAttribute('marker-end', `url(#${markerId})`);
      }
      if (finalStyle.arrow === 'backward' || finalStyle.arrow === 'both') {
        path.setAttribute('marker-start', `url(#${markerId})`);
      }
    }

    edgeGroup.appendChild(path);

    // Add edge label
    if (finalStyle.label?.text) {
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;

      const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelGroup.setAttribute('transform', `translate(${midX}, ${midY})`);

      const bgColor = 'backgroundColor' in finalStyle.label ? finalStyle.label.backgroundColor : undefined;
      if (bgColor) {
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', '-20');
        bg.setAttribute('y', '-10');
        bg.setAttribute('width', '40');
        bg.setAttribute('height', '20');
        bg.setAttribute('fill', bgColor);
        bg.setAttribute('rx', '3');
        labelGroup.appendChild(bg);
      }

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', (finalStyle.label.fontSize || 10).toString());
      text.setAttribute('fill', finalStyle.label.color || '#666');
      text.textContent = finalStyle.label.text;
      labelGroup.appendChild(text);

      edgeGroup.appendChild(labelGroup);
    }

    this.g.appendChild(edgeGroup);
    this.edgeElements.set(edge.id, edgeGroup);
  }

  private createEdgePath(source: Position, target: Position, curvature: number): string {
    if (curvature === 0) {
      return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    }

    const dx = target.x - source.x;
    const dy = target.y - source.y;

    // Create curved path
    return `M ${source.x} ${source.y} Q ${source.x + dx / 2 + dy * curvature} ${
      source.y + dy / 2 - dx * curvature
    } ${target.x} ${target.y}`;
  }

  private createArrowMarker(color: string): string {
    const markerId = `arrow-${color.replace('#', '')}`;

    // Check if marker already exists
    if (this.svg.querySelector(`#${markerId}`)) {
      return markerId;
    }

    const defs = this.svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    if (!this.svg.querySelector('defs')) {
      this.svg.insertBefore(defs, this.svg.firstChild);
    }

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
    path.setAttribute('fill', color);

    marker.appendChild(path);
    defs.appendChild(marker);

    return markerId;
  }

  private createLabel(
    text: string,
    fontSize: number,
    color: string,
    position: string
  ): SVGTextElement {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', fontSize.toString());
    label.setAttribute('fill', color);
    label.textContent = text;

    switch (position) {
      case 'top':
        label.setAttribute('y', '-25');
        break;
      case 'bottom':
        label.setAttribute('y', '25');
        break;
      case 'center':
        label.setAttribute('dominant-baseline', 'middle');
        break;
    }

    return label;
  }

  private getNodeLabel(node: GraphNode): string {
    if ('labels' in node) {
      return node.labels.join(', ') || String(node.id);
    }
    if ('value' in node) {
      return node.value;
    }
    return String((node as any).id);
  }

  clear(): void {
    while (this.g.firstChild) {
      this.g.removeChild(this.g.firstChild);
    }
    this.nodeElements.clear();
    this.edgeElements.clear();
  }

  getNodeElement(nodeId: string | number): SVGElement | undefined {
    return this.nodeElements.get(nodeId);
  }

  getEdgeElement(edgeId: string | number): SVGElement | undefined {
    return this.edgeElements.get(edgeId);
  }

  getSVG(): SVGSVGElement {
    return this.svg;
  }

  getMainGroup(): SVGGElement {
    return this.g;
  }
}
