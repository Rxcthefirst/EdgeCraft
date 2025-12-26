# Quick Start Guide

Get started with EdgeCraft in 5 minutes!

## Installation

```bash
npm install edgecraft
```

## Basic Usage

### 1. Create an HTML container

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Graph</title>
  <style>
    #graph {
      width: 800px;
      height: 600px;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div id="graph"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

### 2. Initialize EdgeCraft

Create `app.js`:

```javascript
import { EdgeCraft } from 'edgecraft';

const graph = new EdgeCraft({
  container: '#graph',
  data: {
    nodes: [
      { id: 1, labels: ['Person'], properties: { name: 'Alice' } },
      { id: 2, labels: ['Person'], properties: { name: 'Bob' } }
    ],
    edges: [
      { id: 'e1', source: 1, target: 2, label: 'KNOWS', properties: {} }
    ]
  }
});
```

That's it! You now have a working graph visualization.

## Common Patterns

### Adding Interactivity

```javascript
// React to node clicks
graph.on('node-click', (event) => {
  console.log('Clicked:', event.target.properties.name);
});

// Add controls
document.querySelector('#fit-btn').onclick = () => graph.fitView();
document.querySelector('#zoom-in').onclick = () => graph.zoomIn();
```

### Custom Styling

```javascript
const graph = new EdgeCraft({
  container: '#graph',
  data: myData,
  nodeStyle: (node) => ({
    fill: node.labels.includes('Important') ? '#e74c3c' : '#3498db',
    radius: 25,
    label: { text: node.properties.name }
  }),
  edgeStyle: {
    stroke: '#999',
    strokeWidth: 2,
    arrow: 'forward'
  }
});
```

### Different Layouts

```javascript
// Force-directed (default)
graph.setLayout({ type: 'force' });

// Hierarchical (tree-like)
graph.setLayout({ type: 'hierarchical' });

// Circular
graph.setLayout({ type: 'circular' });

// Grid
graph.setLayout({ type: 'grid' });
```

### Dynamic Updates

```javascript
// Add a node
graph.addNode({
  id: 3,
  labels: ['Person'],
  properties: { name: 'Charlie' }
});

// Add an edge
graph.addEdge({
  id: 'e2',
  source: 1,
  target: 3,
  label: 'KNOWS',
  properties: {}
});

// Remove elements
graph.removeNode(2);
graph.removeEdge('e1');
```

### RDF Support

```javascript
const graph = new EdgeCraft({
  container: '#graph',
  data: {
    nodes: [
      { id: 'alice', type: 'uri', value: 'http://example.org/alice' },
      { id: 'bob', type: 'uri', value: 'http://example.org/bob' },
      { id: 'name', type: 'literal', value: 'Alice', datatype: 'xsd:string' }
    ],
    edges: [
      { id: 't1', subject: 'alice', predicate: 'foaf:knows', object: 'bob' },
      { id: 't2', subject: 'alice', predicate: 'foaf:name', object: 'name' }
    ]
  }
});

// Query triples
const knowsRelations = graph.queryTriples(undefined, 'foaf:knows');
```

## Next Steps

- Explore [examples/](examples/) for more complex use cases
- Read the full [API documentation](README.md#api-reference)
- Check out [advanced patterns](README.md) for association classes
- Customize [layouts](README.md#layout-algorithms) for your use case

## Common Issues

### "Container not found"

Make sure your container element exists before creating the graph:

```javascript
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const graph = new EdgeCraft({ container: '#graph', data: myData });
});
```

### Graph not visible

Ensure your container has dimensions:

```css
#graph {
  width: 800px;
  height: 600px;
}
```

### Module import errors

Make sure you're using a module-compatible environment:

```html
<script type="module" src="app.js"></script>
```

Or use a bundler like Vite, Webpack, or Rollup.

## Resources

- [Full Documentation](README.md)
- [Examples](examples/)
- [GitHub Repository](https://github.com/yourusername/edgecraft)
- [Issue Tracker](https://github.com/yourusername/edgecraft/issues)

Happy graphing! 🎨
