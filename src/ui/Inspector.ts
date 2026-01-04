import { EdgeCraft } from '../EdgeCraft';
import type { GraphNode, GraphEdge } from '../types';

export interface InspectorConfig {
  container: string | HTMLElement;
  title?: string;
  showProperties?: boolean;
  showStyle?: boolean;
  showMetrics?: boolean;
  editable?: boolean;
  className?: string;
}

/**
 * Inspector Panel Component
 * Property inspector for nodes and edges
 */
export class Inspector {
  private container: HTMLElement;
  private config: InspectorConfig;
  private element: HTMLElement;
  private graph?: EdgeCraft;
  private currentItem: GraphNode | GraphEdge | null = null;

  constructor(config: InspectorConfig) {
    this.config = {
      title: 'Inspector',
      showProperties: true,
      showStyle: true,
      showMetrics: true,
      editable: false,
      ...config
    };

    // Get container element
    if (typeof config.container === 'string') {
      const el = document.querySelector(config.container);
      if (!el) {
        throw new Error(`Inspector container not found: ${config.container}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = config.container;
    }

    this.element = this.createInspector();
    this.container.appendChild(this.element);
  }

  /**
   * Attach the inspector to a graph instance
   */
  attachToGraph(graph: EdgeCraft): void {
    this.graph = graph;

    // Listen for selection events
    graph.on('nodeSelected', (event: any) => {
      this.inspect(event.data.node);
    });

    graph.on('edgeSelected', (event: any) => {
      this.inspect(event.data.edge);
    });

    graph.on('selectionCleared', () => {
      this.clear();
    });
  }

  private createInspector(): HTMLElement {
    const inspector = document.createElement('div');
    inspector.className = `edgecraft-inspector ${this.config.className || ''}`;

    // Header
    const header = document.createElement('div');
    header.className = 'edgecraft-inspector-header';

    const title = document.createElement('h3');
    title.className = 'edgecraft-inspector-title';
    title.textContent = this.config.title || 'Inspector';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'edgecraft-inspector-subtitle';
    subtitle.textContent = 'No selection';
    header.appendChild(subtitle);

    inspector.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'edgecraft-inspector-content';
    
    const empty = document.createElement('div');
    empty.className = 'edgecraft-inspector-empty';
    empty.textContent = 'Select a node or edge to inspect';
    content.appendChild(empty);

    inspector.appendChild(content);

    return inspector;
  }

  /**
   * Inspect an item (node or edge)
   */
  inspect(item: GraphNode | GraphEdge): void {
    this.currentItem = item;
    
    const subtitle = this.element.querySelector('.edgecraft-inspector-subtitle') as HTMLElement;
    const content = this.element.querySelector('.edgecraft-inspector-content') as HTMLElement;
    
    // Update subtitle
    if ('source' in item && 'target' in item) {
      // It's an edge
      subtitle.textContent = `Edge: ${item.id}`;
    } else {
      // It's a node
      subtitle.textContent = `Node: ${item.id}`;
    }

    // Clear content
    content.innerHTML = '';

    // Add sections
    if (this.config.showProperties) {
      content.appendChild(this.createPropertiesSection(item));
    }

    if (this.config.showStyle && item.style) {
      content.appendChild(this.createStyleSection(item.style));
    }

    if (this.config.showMetrics) {
      content.appendChild(this.createMetricsSection(item));
    }
  }

  /**
   * Clear the inspector
   */
  clear(): void {
    this.currentItem = null;
    
    const subtitle = this.element.querySelector('.edgecraft-inspector-subtitle') as HTMLElement;
    const content = this.element.querySelector('.edgecraft-inspector-content') as HTMLElement;
    
    subtitle.textContent = 'No selection';
    content.innerHTML = '';
    
    const empty = document.createElement('div');
    empty.className = 'edgecraft-inspector-empty';
    empty.textContent = 'Select a node or edge to inspect';
    content.appendChild(empty);
  }

  private createPropertiesSection(item: GraphNode | GraphEdge): HTMLElement {
    const section = document.createElement('div');
    section.className = 'edgecraft-inspector-section';

    const title = document.createElement('h4');
    title.className = 'edgecraft-inspector-section-title';
    title.textContent = 'Properties';
    section.appendChild(title);

    // Basic properties
    section.appendChild(this.createProperty('ID', item.id.toString()));
    
    if ('label' in item && item.label) {
      section.appendChild(this.createProperty('Label', item.label));
    }

    if ('labels' in item && item.labels && item.labels.length > 0) {
      section.appendChild(this.createProperty('Labels', item.labels.join(', ')));
    }

    if ('source' in item && 'target' in item) {
      // Edge specific
      section.appendChild(this.createProperty('Source', item.source.toString()));
      section.appendChild(this.createProperty('Target', item.target.toString()));
    }

    // Custom properties
    if (item.properties && Object.keys(item.properties).length > 0) {
      Object.entries(item.properties).forEach(([key, value]) => {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
        section.appendChild(this.createProperty(key, displayValue));
      });
    }

    return section;
  }

  private createStyleSection(style: any): HTMLElement {
    const section = document.createElement('div');
    section.className = 'edgecraft-inspector-section';

    const title = document.createElement('h4');
    title.className = 'edgecraft-inspector-section-title';
    title.textContent = 'Style';
    section.appendChild(title);

    Object.entries(style).forEach(([key, value]) => {
      const displayValue = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      section.appendChild(this.createProperty(key, displayValue));
    });

    return section;
  }

  private createMetricsSection(item: GraphNode | GraphEdge): HTMLElement {
    const section = document.createElement('div');
    section.className = 'edgecraft-inspector-section';

    const title = document.createElement('h4');
    title.className = 'edgecraft-inspector-section-title';
    title.textContent = 'Metrics';
    section.appendChild(title);

    if (!('source' in item)) {
      // Node metrics
      const node = item as GraphNode;

      if (node.x !== undefined && node.y !== undefined) {
        section.appendChild(this.createProperty('Position', `(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`));
      }
    }

    return section;
  }

  private createProperty(key: string, value: string): HTMLElement {
    const property = document.createElement('div');
    property.className = 'edgecraft-inspector-property';

    const keyEl = document.createElement('div');
    keyEl.className = 'edgecraft-inspector-property-key';
    keyEl.textContent = key;
    property.appendChild(keyEl);

    const valueEl = document.createElement('div');
    valueEl.className = 'edgecraft-inspector-property-value';
    valueEl.textContent = value;
    
    if (this.config.editable) {
      valueEl.contentEditable = 'true';
      valueEl.addEventListener('blur', () => {
        // TODO: Handle property updates
        console.log(`Updated ${key} to ${valueEl.textContent}`);
      });
    }
    
    property.appendChild(valueEl);

    return property;
  }

  /**
   * Refresh the inspector with current item
   */
  refresh(): void {
    if (this.currentItem) {
      this.inspect(this.currentItem);
    }
  }

  /**
   * Destroy the inspector
   */
  destroy(): void {
    this.element.remove();
  }
}
