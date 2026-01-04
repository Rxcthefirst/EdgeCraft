import { EdgeCraft } from '../EdgeCraft';
import type { GraphNode, GraphEdge } from '../types';

export interface LegendConfig {
  container: string | HTMLElement;
  title?: string;
  showNodeTypes?: boolean;
  showEdgeTypes?: boolean;
  showSizeScale?: boolean;
  showColorScale?: boolean;
  interactive?: boolean; // Click to filter
  className?: string;
}

export interface LegendItem {
  type: 'node' | 'edge';
  label: string;
  color?: string;
  shape?: string;
  count?: number;
  visible?: boolean;
}

/**
 * Legend Component
 * Auto-generated legend showing node types, edge types, and scales
 */
export class Legend {
  private container: HTMLElement;
  private config: LegendConfig;
  private element: HTMLElement;
  private graph?: EdgeCraft;
  private items: Map<string, LegendItem> = new Map();

  constructor(config: LegendConfig) {
    this.config = {
      showNodeTypes: true,
      showEdgeTypes: true,
      showSizeScale: false,
      showColorScale: false,
      interactive: true,
      ...config
    };

    // Get container element
    if (typeof config.container === 'string') {
      const el = document.querySelector(config.container);
      if (!el) {
        throw new Error(`Legend container not found: ${config.container}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = config.container;
    }

    this.element = this.createLegend();
    this.container.appendChild(this.element);
  }

  /**
   * Attach the legend to a graph instance
   */
  attachToGraph(graph: EdgeCraft): void {
    this.graph = graph;
    this.update();

    // Listen for graph changes
    graph.on('dataUpdated', () => this.update());
  }

  private createLegend(): HTMLElement {
    const legend = document.createElement('div');
    legend.className = `edgecraft-legend ${this.config.className || ''}`;

    if (this.config.title) {
      const title = document.createElement('h3');
      title.className = 'edgecraft-legend-title';
      title.textContent = this.config.title;
      legend.appendChild(title);
    }

    return legend;
  }

  /**
   * Update legend based on current graph data
   */
  update(): void {
    if (!this.graph) return;

    this.items.clear();
    
    // Clear existing content (except title)
    const title = this.element.querySelector('.edgecraft-legend-title');
    this.element.innerHTML = '';
    if (title) {
      this.element.appendChild(title);
    }

    // Add node types section
    if (this.config.showNodeTypes) {
      const nodeTypes = this.extractNodeTypes();
      if (nodeTypes.size > 0) {
        this.element.appendChild(this.createSection('Nodes', Array.from(nodeTypes.values())));
      }
    }

    // Add edge types section
    if (this.config.showEdgeTypes) {
      const edgeTypes = this.extractEdgeTypes();
      if (edgeTypes.size > 0) {
        this.element.appendChild(this.createSection('Edges', Array.from(edgeTypes.values())));
      }
    }
  }

  private extractNodeTypes(): Map<string, LegendItem> {
    const types = new Map<string, LegendItem>();
    
    if (!this.graph) return types;

    const nodes = this.graph.getNodes();
    
    nodes.forEach((node: GraphNode) => {
      // Get node type from labels or properties
      const type = node.labels?.[0] || 
                   node.properties?.type || 
                   'Node';
      
      if (!types.has(type)) {
        types.set(type, {
          type: 'node',
          label: type,
          color: this.getNodeColor(node),
          shape: this.getNodeShape(node),
          count: 1,
          visible: true
        });
      } else {
        const item = types.get(type)!;
        item.count = (item.count || 0) + 1;
      }
    });

    return types;
  }

  private extractEdgeTypes(): Map<string, LegendItem> {
    const types = new Map<string, LegendItem>();
    
    if (!this.graph) return types;

    const edges = this.graph.getEdges();
    
    edges.forEach((edge: GraphEdge) => {
      // Get edge type from label or type property
      const type = edge.label || 
                   edge.properties?.type || 
                   'Edge';
      
      if (!types.has(type)) {
        types.set(type, {
          type: 'edge',
          label: type,
          color: this.getEdgeColor(edge),
          count: 1,
          visible: true
        });
      } else {
        const item = types.get(type)!;
        item.count = (item.count || 0) + 1;
      }
    });

    return types;
  }

  private getNodeColor(node: GraphNode): string {
    // Try to extract color from node style
    if (node.style?.fill) {
      return node.style.fill as string;
    }
    // Default color based on type
    return this.hashColor(node.labels?.[0] || 'default');
  }

  private getNodeShape(node: GraphNode): string {
    return node.style?.shape as string || 'circle';
  }

  private getEdgeColor(edge: GraphEdge): string {
    if (edge.style?.stroke) {
      return edge.style.stroke as string;
    }
    return this.hashColor(edge.label || 'default');
  }

  private hashColor(str: string): string {
    // Simple hash to generate consistent colors
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = hash % 360;
    return `hsl(${h}, 65%, 55%)`;
  }

  private createSection(title: string, items: LegendItem[]): HTMLElement {
    const section = document.createElement('div');
    section.className = 'edgecraft-legend-section';

    const sectionTitle = document.createElement('h4');
    sectionTitle.className = 'edgecraft-legend-section-title';
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);

    items.forEach((item) => {
      const itemEl = this.createItem(item);
      section.appendChild(itemEl);
      this.items.set(`${item.type}-${item.label}`, item);
    });

    return section;
  }

  private createItem(item: LegendItem): HTMLElement {
    const itemEl = document.createElement('div');
    itemEl.className = 'edgecraft-legend-item';
    itemEl.setAttribute('data-type', item.type);
    itemEl.setAttribute('data-label', item.label);

    if (!item.visible) {
      itemEl.classList.add('disabled');
    }

    // Create symbol
    const symbol = document.createElement('div');
    symbol.className = `edgecraft-legend-symbol ${item.shape || 'square'}`;
    if (item.color) {
      symbol.style.backgroundColor = item.color;
    }
    itemEl.appendChild(symbol);

    // Create label
    const label = document.createElement('span');
    label.className = 'edgecraft-legend-label';
    label.textContent = item.label;
    itemEl.appendChild(label);

    // Create count
    if (item.count !== undefined) {
      const count = document.createElement('span');
      count.className = 'edgecraft-legend-count';
      count.textContent = item.count.toString();
      itemEl.appendChild(count);
    }

    // Add click handler for filtering
    if (this.config.interactive) {
      itemEl.style.cursor = 'pointer';
      itemEl.addEventListener('click', () => {
        this.toggleItem(item);
        itemEl.classList.toggle('disabled');
      });
    }

    return itemEl;
  }

  private toggleItem(item: LegendItem): void {
    if (!this.graph) return;

    item.visible = !item.visible;

    if (item.type === 'node') {
      // Filter nodes by type
      const nodes = this.graph.getNodes();
      nodes.forEach((node: GraphNode) => {
        const nodeType = node.labels?.[0] || node.properties?.type || 'Node';
        if (nodeType === item.label) {
          // Toggle visibility
          if (item.visible) {
            this.graph!.showNode(node.id);
          } else {
            this.graph!.hideNode(node.id);
          }
        }
      });
    } else {
      // Filter edges by type
      const edges = this.graph.getEdges();
      edges.forEach((edge: GraphEdge) => {
        const edgeType = edge.label || edge.properties?.type || 'Edge';
        if (edgeType === item.label) {
          // Toggle visibility
          if (item.visible) {
            this.graph!.showEdge(edge.id);
          } else {
            this.graph!.hideEdge(edge.id);
          }
        }
      });
    }
  }

  /**
   * Add a custom legend item
   */
  addItem(item: LegendItem): void {
    const key = `${item.type}-${item.label}`;
    this.items.set(key, item);
    this.update();
  }

  /**
   * Remove a legend item
   */
  removeItem(type: string, label: string): void {
    const key = `${type}-${label}`;
    this.items.delete(key);
    this.update();
  }

  /**
   * Clear all legend items
   */
  clear(): void {
    this.items.clear();
    const title = this.element.querySelector('.edgecraft-legend-title');
    this.element.innerHTML = '';
    if (title) {
      this.element.appendChild(title);
    }
  }

  /**
   * Destroy the legend
   */
  destroy(): void {
    this.element.remove();
  }
}
