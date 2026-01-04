# EdgeCraft 🎨

**Advanced Graph Visualization Library for RDF and LPG**

EdgeCraft is a powerful, modern graph visualization library designed for building sophisticated network diagrams with support for both Resource Description Framework (RDF) and Labeled Property Graph (LPG) models. It combines the simplicity of Cytoscape with the power of D3, offering advanced features like association classes, multiple layout algorithms, and a clean, intuitive API.

## ✨ Features

- **Dual Graph Model Support**: Native support for both RDF triples and LPG structures
- **Advanced Patterns**: Association classes for n-ary relationships
- **Multiple Layout Algorithms**: Force-directed, hierarchical, circular, and grid layouts
- **Rich Interactions**: Drag, zoom, pan, select with customizable behaviors
- **Flexible Styling**: Function-based styling for dynamic visual properties
- **TypeScript First**: Fully typed API with excellent IDE support
- **Performance Optimized**: Efficient rendering for large graphs
- **Extensible Architecture**: Easy to extend with custom layouts and renderers

## 📦 Installation

```bash
npm install edgecraft
```

Or with yarn:

```bash
yarn add edgecraft
```

## 🚀 Quick Start

```typescript
import { EdgeCraft } from 'edgecraft';

// Create a simple graph
const graph = new EdgeCraft({
  container: '#graph-container',
  data: {
    nodes: [
      { id: 1, labels: ['Person'], properties: { name: 'Alice' } },
      { id: 2, labels: ['Person'], properties: { name: 'Bob' } },
      { id: 3, labels: ['Company'], properties: { name: 'Tech Corp' } }
    ],
    edges: [
      { id: 'e1', source: 1, target: 2, label: 'KNOWS', properties: { since: 2020 } },
      { id: 'e2', source: 1, target: 3, label: 'WORKS_AT', properties: { role: 'Engineer' } }
    ]
  },
  layout: { type: 'force' }
});
```

## 📚 Examples

### LPG (Labeled Property Graph)

```typescript
import { EdgeCraft, LPGNode, LPGEdge } from 'edgecraft';

const nodes: LPGNode[] = [
  { id: 'alice', labels: ['Person'], properties: { name: 'Alice', age: 30 } },
  { id: 'bob', labels: ['Person'], properties: { name: 'Bob', age: 35 } },
  { id: 'techcorp', labels: ['Company'], properties: { name: 'Tech Corp' } }
];

const edges: LPGEdge[] = [
  { 
    id: 'e1', 
    source: 'alice', 
    target: 'bob', 
    label: 'KNOWS',
    properties: { since: 2015 },
    directed: true
  },
  { 
    id: 'e2', 
    source: 'alice', 
    target: 'techcorp', 
    label: 'WORKS_AT',
    properties: { position: 'Senior Engineer', since: 2020 }
  }
];

const graph = new EdgeCraft({
  container: '#graph',
  data: { nodes, edges },
  layout: { type: 'force', iterations: 500 },
  nodeStyle: (node) => ({
    fill: node.labels.includes('Person') ? '#4a90e2' : '#e74c3c',
    radius: 25,
    label: {
      text: node.properties.name,
      fontSize: 14,
      position: 'bottom'
    }
  }),
  edgeStyle: {
    stroke: '#95a5a6',
    strokeWidth: 2,
    arrow: 'forward'
  }
});
```

### RDF (Resource Description Framework)

```typescript
import { EdgeCraft, RDFNode, RDFTriple } from 'edgecraft';

const nodes: RDFNode[] = [
  { id: 'alice', type: 'uri', value: 'http://example.org/alice' },
  { id: 'bob', type: 'uri', value: 'http://example.org/bob' },
  { id: 'name1', type: 'literal', value: 'Alice', datatype: 'xsd:string' },
  { id: 'name2', type: 'literal', value: 'Bob', datatype: 'xsd:string' }
];

const triples: RDFTriple[] = [
  { id: 't1', subject: 'alice', predicate: 'foaf:knows', object: 'bob' },
  { id: 't2', subject: 'alice', predicate: 'foaf:name', object: 'name1' },
  { id: 't3', subject: 'bob', predicate: 'foaf:name', object: 'name2' }
];

const graph = new EdgeCraft({
  container: '#rdf-graph',
  data: { nodes, edges: triples },
  layout: { type: 'hierarchical' },
  nodeStyle: (node) => ({
    fill: node.type === 'uri' ? '#3498db' : '#f39c12',
    shape: node.type === 'uri' ? 'circle' : 'rectangle',
    radius: node.type === 'uri' ? 20 : 15
  })
});
```

### Custom Styling

```typescript
const graph = new EdgeCraft({
  container: '#graph',
  data: myData,
  nodeStyle: (node) => {
    // Dynamic styling based on node properties
    const degree = graph.getConnectedEdges(node.id).length;
    return {
      fill: degree > 5 ? '#e74c3c' : '#3498db',
      radius: 10 + degree * 2,
      stroke: '#2c3e50',
      strokeWidth: 2,
      label: {
        text: node.properties?.name || node.id,
        fontSize: 12,
        color: '#fff'
      }
    };
  },
  edgeStyle: (edge) => ({
    stroke: edge.properties?.weight > 0.5 ? '#e74c3c' : '#95a5a6',
    strokeWidth: 1 + (edge.properties?.weight || 0) * 3,
    strokeDasharray: edge.properties?.type === 'temporary' ? '5,5' : undefined,
    arrow: 'forward',
    label: {
      text: edge.label,
      fontSize: 10,
      color: '#7f8c8d',
      backgroundColor: 'rgba(255,255,255,0.8)'
    }
  })
});
```

### Event Handling

```typescript
// Node click
graph.on('node-click', (event) => {
  console.log('Clicked node:', event.target);
  console.log('Node position:', event.position);
});

// Node hover
graph.on('node-mouseenter', (event) => {
  console.log('Hovering over:', event.target);
});

// Drag events
graph.on('node-dragstart', (event) => {
  console.log('Started dragging:', event.target);
});

graph.on('node-drag', (event) => {
  console.log('Dragging:', event.target, 'to', event.position);
});

graph.on('node-dragend', (event) => {
  console.log('Finished dragging:', event.target);
});

// Background click
graph.on('background-click', () => {
  graph.clearSelection();
});
```

### Dynamic Updates

```typescript
// Add nodes dynamically
graph.addNode({
  id: 'new-node',
  labels: ['Person'],
  properties: { name: 'Charlie' }
});

// Add edges
graph.addEdge({
  id: 'e-new',
  source: 'alice',
  target: 'new-node',
  label: 'KNOWS',
  properties: {}
});

// Remove elements
graph.removeNode('bob');
graph.removeEdge('e1');

// Update layout
graph.setLayout({ type: 'circular' });

// Query the graph
const neighbors = graph.getNeighbors('alice');
const allEdges = graph.getConnectedEdges('alice');
```

### View Control

```typescript
// Fit entire graph in view
graph.fitView();

// Center the graph
graph.centerView();

// Zoom controls
graph.zoomIn();
graph.zoomOut();
graph.resetZoom();

// Selection
graph.selectNode('alice');
const selected = graph.getSelectedNodes();
graph.clearSelection();
```

## 🎨 Layout Algorithms

### Force-Directed Layout

Simulates physical forces between nodes for organic-looking graphs.

```typescript
graph.setLayout({
  type: 'force',
  iterations: 300,
  nodeSpacing: 100
});
```

### Hierarchical Layout

Arranges nodes in levels, ideal for trees and DAGs.

```typescript
graph.setLayout({
  type: 'hierarchical',
  levelSpacing: 150,
  nodeSpacing: 100
});
```

### Circular Layout

Places nodes in a circle, great for showing relationships.

```typescript
graph.setLayout({
  type: 'circular'
});
```

### Grid Layout

Arranges nodes in a regular grid pattern.

```typescript
graph.setLayout({
  type: 'grid',
  nodeSpacing: 100
});
```

## 🔧 Configuration Options

```typescript
interface EdgeCraftConfig {
  container: HTMLElement | string;        // Container element or selector
  data?: GraphData;                        // Initial graph data
  layout?: LayoutConfig;                   // Layout algorithm config
  interaction?: InteractionConfig;         // Interaction settings
  nodeStyle?: NodeStyle | StyleFunction;   // Node visual styling
  edgeStyle?: EdgeStyle | StyleFunction;   // Edge visual styling
  renderer?: RendererConfig;               // Renderer configuration (see below)
  width?: number;                          // Canvas width
  height?: number;                         // Canvas height
  backgroundColor?: string;                // Background color
  minZoom?: number;                        // Minimum zoom level
  maxZoom?: number;                        // Maximum zoom level
}
```

### Renderer Configuration

EdgeCraft uses a **WebGL-first** approach (like Keylines) for optimal performance:

```typescript
// Default behavior: WebGL with Canvas fallback
const graph = new EdgeCraft({
  container: '#graph',
  data: myData
  // Automatically uses WebGL if supported, falls back to Canvas
});

// Explicit WebGL (with Canvas fallback if not supported)
const graph = new EdgeCraft({
  container: '#graph',
  data: myData,
  renderer: {
    type: 'webgl'  // Tries WebGL, auto-falls back to Canvas
  }
});

// Force Canvas renderer (useful for testing or specific requirements)
const graph = new EdgeCraft({
  container: '#graph',
  data: myData,
  renderer: {
    type: 'canvas',  // Explicitly use Canvas renderer
    enableCache: true,
    enableDirtyRegions: true  // Optimize Canvas performance
  }
});

// Renderer with additional options
const graph = new EdgeCraft({
  container: '#graph',
  data: myData,
  renderer: {
    type: 'auto',  // Default: WebGL-first with Canvas fallback
    pixelRatio: window.devicePixelRatio,  // For high-DPI displays
    enableCache: true,  // Cache rendered elements (Canvas only)
    enableDirtyRegions: true  // Only re-render changed areas (Canvas only)
  }
});
```

**Renderer Types:**
- **`'auto'` (default)**: Tries WebGL first, falls back to Canvas if not supported
- **`'webgl'`**: Explicitly requests WebGL (falls back to Canvas if not available)
- **`'canvas'`**: Forces Canvas renderer (good for compatibility or debugging)

**Why WebGL-first?**
- 🚀 GPU-accelerated rendering for better performance
- 📊 Handles large graphs (10,000+ nodes) efficiently
- ⚡ Smooth animations and interactions
- 🔄 Automatic fallback ensures compatibility

## 📖 API Reference

### Graph Management

- `setData(data: GraphData): void` - Replace entire graph
- `getData(): GraphData` - Get current graph data
- `addNode(node: GraphNode): void` - Add a node
- `removeNode(nodeId): boolean` - Remove a node
- `addEdge(edge: GraphEdge): void` - Add an edge
- `removeEdge(edgeId): boolean` - Remove an edge

### Queries

- `getNode(nodeId): GraphNode | undefined` - Get node by ID
- `getEdge(edgeId): GraphEdge | undefined` - Get edge by ID
- `getAllNodes(): GraphNode[]` - Get all nodes
- `getAllEdges(): GraphEdge[]` - Get all edges
- `getNeighbors(nodeId): GraphNode[]` - Get adjacent nodes
- `getConnectedEdges(nodeId): GraphEdge[]` - Get connected edges
- `queryTriples(subject?, predicate?, object?): RDFTriple[]` - RDF query

### View Control

- `fitView(): void` - Fit graph to view
- `centerView(): void` - Center the graph
- `zoomIn(): void` - Zoom in
- `zoomOut(): void` - Zoom out
- `resetZoom(): void` - Reset zoom to 100%

### Events

- `on(eventType: string, callback): void` - Register event listener
- `off(eventType: string, callback): void` - Remove event listener

### Selection

- `selectNode(nodeId): void` - Select a node
- `clearSelection(): void` - Clear selection
- `getSelectedNodes(): NodeId[]` - Get selected nodes

### Export

- `toJSON(): string` - Export graph as JSON
- `fromJSON(json: string): void` - Import graph from JSON
- `exportSVG(): string` - Export as SVG string

## 🔍 RDF-Specific Features

EdgeCraft provides excellent support for semantic web applications:

```typescript
// Query triples by pattern
const aliceTriples = graph.queryTriples('alice');
const nameTriples = graph.queryTriples(undefined, 'foaf:name');
const allKnows = graph.queryTriples(undefined, 'foaf:knows');

// Add triples programmatically
graph.addTriple('alice', 'foaf:knows', 'charlie');

// Work with different node types
const uriNodes = graph.getRDFNodes().filter(n => n.type === 'uri');
const literals = graph.getRDFNodes().filter(n => n.type === 'literal');
```

## 🏗️ Association Classes

Support for n-ary relationships:

```typescript
const data = {
  nodes: [
    { id: 'alice', labels: ['Person'], properties: { name: 'Alice' } },
    { id: 'bob', labels: ['Person'], properties: { name: 'Bob' } },
    { id: 'project', labels: ['Project'], properties: { name: 'EdgeCraft' } }
  ],
  edges: [
    { id: 'e1', source: 'alice', target: 'membership1', label: 'HAS_ROLE', properties: {} },
    { id: 'e2', source: 'membership1', target: 'project', label: 'ON_PROJECT', properties: {} }
  ],
  associationClasses: [
    {
      id: 'membership1',
      name: 'ProjectMembership',
      sourceEdges: ['e1', 'e2'],
      properties: { role: 'Lead Developer', since: '2023' }
    }
  ]
};
```

## 🎯 Use Cases

- **Knowledge Graphs**: Visualize semantic web data and ontologies
- **Social Networks**: Display relationships between people and entities
- **Data Lineage**: Track data flow and transformations
- **Dependency Graphs**: Visualize software dependencies and relationships
- **Organization Charts**: Display hierarchical structures
- **Mind Maps**: Create and visualize concept relationships
- **Network Diagrams**: Infrastructure and system architecture visualization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [GitHub Repository](https://github.com/yourusername/edgecraft)
- [Documentation](https://edgecraft.dev)
- [Examples](https://edgecraft.dev/examples)
- [Issue Tracker](https://github.com/yourusername/edgecraft/issues)

## 🙏 Acknowledgments

EdgeCraft builds upon the excellent work of:
- D3.js for force simulation and interactions
- The graph visualization community

---

Made with ❤️ for the graph visualization community#   E d g e C r a f t 
 
 