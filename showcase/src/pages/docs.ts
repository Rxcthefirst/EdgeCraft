/**
 * Render documentation page
 */
export async function renderDocs(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="docs-page">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="logo">
            <a href="/">
              <h1>EdgeCraft</h1>
            </a>
          </div>
          <nav class="nav">
            <a href="/demos">Demos</a>
            <a href="/docs" class="active">Documentation</a>
            <a href="https://github.com/yourusername/edgecraft" target="_blank">GitHub</a>
          </nav>
        </div>
      </header>

      <!-- Docs Content -->
      <div class="docs-container">
        <!-- Sidebar -->
        <aside class="docs-sidebar">
          <nav class="docs-nav">
            <div class="nav-section">
              <h3>Getting Started</h3>
              <ul>
                <li><a href="#installation">Installation</a></li>
                <li><a href="#quick-start">Quick Start</a></li>
                <li><a href="#basic-concepts">Basic Concepts</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Core API</h3>
              <ul>
                <li><a href="#graph-api">Graph</a></li>
                <li><a href="#nodes-edges">Nodes & Edges</a></li>
                <li><a href="#events">Events</a></li>
                <li><a href="#methods">Methods</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Styling</h3>
              <ul>
                <li><a href="#node-styling">Node Styles</a></li>
                <li><a href="#edge-styling">Edge Styles</a></li>
                <li><a href="#dynamic-styling">Dynamic Styling</a></li>
                <li><a href="#themes">Themes</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Layouts</h3>
              <ul>
                <li><a href="#force-layout">Force-Directed</a></li>
                <li><a href="#hierarchical-layout">Hierarchical</a></li>
                <li><a href="#tree-layout">Tree</a></li>
                <li><a href="#radial-layout">Radial Tree</a></li>
                <li><a href="#circular-layout">Circular</a></li>
                <li><a href="#organic-layout">Organic</a></li>
                <li><a href="#grid-layout">Grid</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Advanced Features</h3>
              <ul>
                <li><a href="#edge-bundling">Edge Bundling</a></li>
                <li><a href="#compound-graphs">Compound Graphs</a></li>
                <li><a href="#query-filter">Query & Filter</a></li>
                <li><a href="#path-finding">Path Finding</a></li>
                <li><a href="#spatial-index">Spatial Index</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Performance</h3>
              <ul>
                <li><a href="#renderers">Renderers</a></li>
                <li><a href="#optimization">Optimization Tips</a></li>
                <li><a href="#large-graphs">Large Graphs</a></li>
                <li><a href="#web-workers">Web Workers</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Guides</h3>
              <ul>
                <li><a href="#migration-cytoscape">From Cytoscape.js</a></li>
                <li><a href="#migration-vis">From vis.js</a></li>
                <li><a href="#best-practices">Best Practices</a></li>
              </ul>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="docs-content">
          <article>
            <h1 id="installation">Installation</h1>
            <p>Install EdgeCraft via npm:</p>
            <pre><code>npm install edgecraft</code></pre>

            <h2 id="quick-start">Quick Start</h2>
            <p>Create your first graph visualization in just a few lines:</p>
            <pre><code>import { EdgeCraft } from 'edgecraft';

const graph = new EdgeCraft({
  container: '#graph',
  data: {
    nodes: [
      { id: 1, label: 'Node 1' },
      { id: 2, label: 'Node 2' },
      { id: 3, label: 'Node 3' }
    ],
    edges: [
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  },
  layout: {
    type: 'force'
  }
});</code></pre>

            <h2 id="basic-concepts">Basic Concepts</h2>
            <h3>Graph Models</h3>
            <p>EdgeCraft supports two graph models:</p>
            <ul>
              <li><strong>LPG (Labeled Property Graph)</strong>: Nodes with properties and labeled edges</li>
              <li><strong>RDF (Resource Description Framework)</strong>: Subject-predicate-object triples</li>
            </ul>

            <h3>Rendering Modes</h3>
            <p>EdgeCraft automatically selects the best renderer based on graph size:</p>
            <ul>
              <li><strong>SVG</strong>: &lt; 500 nodes - High quality, DOM manipulation</li>
              <li><strong>Canvas</strong>: 500-5,000 nodes - Good balance of quality and performance</li>
              <li><strong>WebGL</strong>: 5,000+ nodes - Maximum performance with GPU acceleration</li>
            </ul>

            <h2 id="graph">Graph API</h2>
            <h3>Creating Nodes</h3>
            <pre><code>// Add a single node
graph.addNode({
  id: 'node1',
  label: 'My Node',
  properties: {
    type: 'person',
    age: 30
  }
});

// Add multiple nodes
graph.addNodes([
  { id: 'n1', label: 'First' },
  { id: 'n2', label: 'Second' }
]);</code></pre>

            <h3>Creating Edges</h3>
            <pre><code>// Add an edge
graph.addEdge({
  source: 'node1',
  target: 'node2',
  label: 'knows',
  properties: {
    since: 2020
  }
});</code></pre>

            <h2 id="layouts">Layouts</h2>
            <h3 id="force-layout">Force-Directed Layout</h3>
            <pre><code>import { WorkerForceLayout } from 'edgecraft';

const layout = new WorkerForceLayout({
  iterations: 300,
  springLength: 100,
  springStrength: 0.05
});

await layout.execute(graph);</code></pre>

            <h3 id="hierarchical-layout">Hierarchical Layout</h3>
            <pre><code>import { HierarchicalLayout } from 'edgecraft';

const layout = new HierarchicalLayout({
  direction: 'TB', // Top to bottom
  layerSpacing: 100,
  nodeSpacing: 50
});

await layout.execute(graph);</code></pre>

            <h2 id="edge-bundling">Edge Bundling</h2>
            <p>Reduce visual clutter in dense graphs:</p>
            <pre><code>import { EdgeBundling } from 'edgecraft';

const bundler = new EdgeBundling({
  type: 'force-directed',
  strength: 0.85,
  subdivisions: 60
});

const bundledEdges = bundler.bundle(graph);</code></pre>

            <h2 id="compound-graphs">Compound Graphs</h2>
            <p>Create hierarchical groups with collapsible nodes:</p>
            <pre><code>import { CompoundGraph } from 'edgecraft';

const compound = new CompoundGraph(graph);

// Create a group
compound.createGroup('group1', ['node1', 'node2'], {
  label: 'My Group',
  padding: 20
});

// Collapse/expand
compound.collapseGroup('group1');
compound.expandGroup('group1');</code></pre>

            <h2 id="query-filter">Query & Filter</h2>
            <p>Search and filter your graph:</p>
            <pre><code>import { GraphSearch, GraphFilter } from 'edgecraft';

// Search for nodes
const search = new GraphSearch(graph);
const results = search.search('alice', {
  fields: ['label', 'properties.name'],
  fuzzy: true
});

// Filter graph
const filter = new GraphFilter(graph);
const subgraph = filter.filterByProperty('type', 'person');</code></pre>

            <h2 id="node-styling">Node Styling</h2>
            <p>Customize node appearance with static or dynamic styles:</p>
            
            <h3>Basic Node Styling</h3>
            <pre><code>graph.addNode({
  id: 'node1',
  label: 'Styled Node',
  style: {
    fill: '#4CAF50',
    stroke: '#2E7D32',
    strokeWidth: 2,
    radius: 25,
    shape: 'circle', // circle, square, diamond, triangle
    opacity: 1.0
  }
});</code></pre>

            <h3>Label Styling</h3>
            <pre><code>node.style = {
  label: {
    text: 'Custom Label',
    fontSize: 14,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 4,
    borderRadius: 3
  }
};</code></pre>

            <h2 id="edge-styling">Edge Styling</h2>
            <h3>Basic Edge Styling</h3>
            <pre><code>graph.addEdge({
  source: 'n1',
  target: 'n2',
  style: {
    stroke: '#2196F3',
    strokeWidth: 2,
    strokeDasharray: '5,3', // Dashed line
    opacity: 0.8,
    arrow: 'target', // 'source', 'target', 'both', 'none'
    arrowSize: 10,
    curve: 0.5 // 0 = straight, 1 = max curve
  }
});</code></pre>

            <h3>Edge Labels</h3>
            <pre><code>edge.style = {
  label: {
    text: 'KNOWS',
    fontSize: 11,
    color: '#666',
    backgroundColor: 'white',
    position: 0.5 // 0 = source, 1 = target, 0.5 = middle
  }
};</code></pre>

            <h2 id="dynamic-styling">Dynamic Styling</h2>
            <p>Apply styles based on node/edge properties:</p>
            
            <h3>Conditional Styles</h3>
            <pre><code>graph.setNodeStyle((node) => {
  if (node.properties.type === 'important') {
    return {
      fill: '#ff5722',
      radius: 30,
      stroke: '#d32f2f',
      strokeWidth: 3
    };
  }
  return {
    fill: '#9E9E9E',
    radius: 20
  };
});</code></pre>

            <h3>Data-Driven Sizing</h3>
            <pre><code>// Scale node size by degree
graph.setNodeStyle((node) => {
  const degree = graph.degree(node.id);
  return {
    radius: 10 + degree * 3,
    fill: \`hsl(\${degree * 10}, 70%, 50%)\`
  };
});</code></pre>

            <h2 id="themes">Themes</h2>
            <pre><code>// Dark theme
graph.setTheme({
  background: '#1a1a1a',
  nodeDefaults: {
    fill: '#424242',
    stroke: '#616161',
    label: { color: '#e0e0e0' }
  },
  edgeDefaults: {
    stroke: '#757575',
    label: { color: '#bdbdbd' }
  }
});

// Custom color scheme
const colorScale = ['#e3f2fd', '#2196f3', '#0d47a1'];
graph.setNodeStyle((node, index) => ({
  fill: colorScale[index % colorScale.length]
}));</code></pre>

            <h2 id="tree-layout">Tree Layout</h2>
            <p>Organize hierarchical structures using Reingold-Tilford algorithm:</p>
            <pre><code>import { TreeLayout } from 'edgecraft';

const layout = new TreeLayout({
  orientation: 'vertical', // vertical, horizontal
  levelSpacing: 100,
  siblingSpacing: 50,
  subtreeSpacing: 80,
  rootId: 'root' // Optional: specify root node
});

await layout.execute(graph);</code></pre>
            <p><strong>Use Cases:</strong> Organizational charts, file systems, decision trees, taxonomy visualization</p>

            <h2 id="radial-layout">Radial Tree Layout</h2>
            <p>Display hierarchies in a circular pattern:</p>
            <pre><code>import { RadialTreeLayout } from 'edgecraft';

const layout = new RadialTreeLayout({
  centerX: 400,
  centerY: 300,
  innerRadius: 50,
  radiusStep: 80,
  angleStart: 0,
  angleEnd: 360
});

await layout.execute(graph);</code></pre>
            <p><strong>Use Cases:</strong> Social networks, dependency graphs, genealogy trees</p>

            <h2 id="circular-layout">Circular Layout</h2>
            <p>Arrange nodes in circular patterns:</p>
            
            <h3>Simple Circular</h3>
            <pre><code>import { CircularLayout } from 'edgecraft';

const layout = new CircularLayout({
  radius: 200,
  startAngle: 0,
  sweep: 360,
  ordering: 'degree' // 'degree', 'data', 'none'
});

await layout.execute(graph);</code></pre>

            <h3>Hierarchical Circular</h3>
            <pre><code>const layout = new CircularLayout({
  type: 'hierarchical',
  innerRadius: 50,
  radiusStep: 100
});</code></pre>
            <p><strong>Use Cases:</strong> Network topology, ring structures, cyclical processes</p>

            <h2 id="organic-layout">Organic Layout</h2>
            <p>Natural-looking layouts with Barnes-Hut optimization:</p>
            <pre><code>import { OrganicLayout } from 'edgecraft';

const layout = new OrganicLayout({
  attractions: 0.8,
  repulsion: 1.2,
  friction: 0.9,
  iterations: 500,
  theta: 0.5 // Barnes-Hut approximation threshold
});

await layout.execute(graph);</code></pre>
            <p><strong>Performance:</strong> Handles 10,000+ nodes efficiently using quad-tree spatial partitioning</p>

            <h2 id="grid-layout">Grid & Geometric Layouts</h2>
            
            <h3>Grid Layout</h3>
            <pre><code>import { GridLayout } from 'edgecraft';

const layout = new GridLayout({
  columns: 5,
  cellWidth: 100,
  cellHeight: 100,
  marginX: 20,
  marginY: 20
});

await layout.execute(graph);</code></pre>

            <h3>Brick Layout</h3>
            <pre><code>const layout = new GridLayout({
  type: 'brick',
  offset: 0.5 // Offset factor for brick pattern
});</code></pre>

            <h3>Hexagonal Layout</h3>
            <pre><code>const layout = new GridLayout({
  type: 'hexagonal',
  hexSize: 40
});</code></pre>

            <h3>Concentric Layout</h3>
            <pre><code>import { ConcentricLayout } from 'edgecraft';

const layout = new ConcentricLayout({
  minNodeSpacing: 30,
  startAngle: Math.PI / 4,
  sweep: 2 * Math.PI,
  levelComparator: (a, b) => graph.degree(b) - graph.degree(a)
});</code></pre>
            <p><strong>Use Cases:</strong> Timeline visualization, categorical grouping, hierarchical importance</p>

            <h2 id="path-finding">Path Finding</h2>
            <p>Find shortest paths between nodes:</p>
            <pre><code>import { PathFinding } from 'edgecraft';

const pathfinder = new PathFinding(graph);

// Single shortest path
const path = pathfinder.shortestPath('node1', 'node5');
// Returns: ['node1', 'node2', 'node4', 'node5']

// All shortest paths
const allPaths = pathfinder.allShortestPaths('node1', 'node5');

// Dijkstra with weights
const weightedPath = pathfinder.dijkstra('node1', 'node5', {
  weightProperty: 'distance'
});</code></pre>

            <h2 id="performance">Performance Optimization</h2>
            
            <h2 id="renderers">Renderer Selection</h2>
            <p>EdgeCraft automatically chooses the optimal renderer, but you can manually select:</p>
            <pre><code>const graph = new EdgeCraft({
  container: '#graph',
  renderer: 'webgl', // 'svg', 'canvas', 'webgl'
  rendererOptions: {
    pixelRatio: window.devicePixelRatio,
    antialias: true,
    preserveDrawingBuffer: false
  }
});</code></pre>

            <h3>Renderer Comparison</h3>
            <table>
              <tr>
                <th>Renderer</th>
                <th>Max Nodes</th>
                <th>Quality</th>
                <th>Interactivity</th>
              </tr>
              <tr>
                <td>SVG</td>
                <td>~500</td>
                <td>Excellent</td>
                <td>Full DOM access</td>
              </tr>
              <tr>
                <td>Canvas</td>
                <td>~5,000</td>
                <td>Good</td>
                <td>Event-based</td>
              </tr>
              <tr>
                <td>WebGL</td>
                <td>100,000+</td>
                <td>Good</td>
                <td>GPU-accelerated</td>
              </tr>
            </table>

            <h2 id="optimization">Optimization Tips</h2>
            
            <h3>Viewport Culling</h3>
            <p>Automatically enabled for large graphs. Only visible nodes are rendered:</p>
            <pre><code>// Enable aggressive culling
graph.setOption('viewportCulling', {
  enabled: true,
  margin: 100, // Render margin around viewport
  dynamicThreshold: true // Adjust based on performance
});</code></pre>

            <h3>Level of Detail (LOD)</h3>
            <pre><code>graph.setOption('lod', {
  enabled: true,
  levels: {
    high: { maxNodes: 500, renderLabels: true, renderEdges: true },
    medium: { maxNodes: 2000, renderLabels: false, renderEdges: true },
    low: { maxNodes: Infinity, renderLabels: false, renderEdges: false }
  }
});</code></pre>

            <h2 id="large-graphs">Large Graphs</h2>
            
            <h3>Batch Operations</h3>
            <pre><code>// Suspend rendering during bulk updates
graph.suspendRendering();

for (let i = 0; i < 10000; i++) {
  graph.addNode({ id: \`node\${i}\`, label: \`Node \${i}\` });
}

graph.resumeRendering(); // Single render pass</code></pre>

            <h3>Progressive Loading</h3>
            <pre><code>async function loadLargeGraph(nodeCount) {
  const batchSize = 1000;
  
  for (let i = 0; i < nodeCount; i += batchSize) {
    const batch = generateNodes(i, Math.min(i + batchSize, nodeCount));
    graph.addNodes(batch);
    
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}</code></pre>

            <h2 id="web-workers">Web Workers</h2>
            <p>Offload layout computation to background threads:</p>
            <pre><code>import { WorkerForceLayout } from 'edgecraft';

const layout = new WorkerForceLayout({
  iterations: 500,
  workers: 4 // Use 4 worker threads
});

// Layout runs in background, doesn't block UI
await layout.execute(graph);

// Progress updates
layout.on('progress', ({ iteration, energy }) => {
  console.log(\`Iteration \${iteration}, Energy: \${energy}\`);
});</code></pre>

            <h2 id="migration-cytoscape">Migration from Cytoscape.js</h2>
            
            <h3>Initialization</h3>
            <pre><code>// Cytoscape.js
const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: { nodes: [...], edges: [...] },
  style: [...]
});

// EdgeCraft
const graph = new EdgeCraft({
  container: '#cy',
  data: { nodes: [...], edges: [...] }
});</code></pre>

            <h3>Adding Elements</h3>
            <pre><code>// Cytoscape.js
cy.add({ group: 'nodes', data: { id: 'n1' } });

// EdgeCraft
graph.addNode({ id: 'n1' });</code></pre>

            <h3>Selectors</h3>
            <pre><code>// Cytoscape.js
cy.$('node[type = "person"]').addClass('highlight');

// EdgeCraft
graph.getNodes()
  .filter(n => n.properties.type === 'person')
  .forEach(n => n.addClass('highlight'));</code></pre>

            <h2 id="migration-vis">Migration from vis.js</h2>
            
            <h3>Network Creation</h3>
            <pre><code>// vis.js
const network = new vis.Network(container, data, options);

// EdgeCraft
const graph = new EdgeCraft({
  container: container,
  data: data,
  ...options
});</code></pre>

            <h3>Event Handling</h3>
            <pre><code>// vis.js
network.on('click', (params) => {
  console.log(params.nodes);
});

// EdgeCraft
graph.on('nodeClick', (event) => {
  console.log(event.node.id);
});</code></pre>

            <h2 id="best-practices">Best Practices</h2>
            
            <h3>1. Choose the Right Layout</h3>
            <ul>
              <li><strong>Force-Directed:</strong> General-purpose, works well for most graphs</li>
              <li><strong>Hierarchical:</strong> Clear parent-child relationships</li>
              <li><strong>Circular:</strong> Highlighting connectivity patterns</li>
              <li><strong>Grid:</strong> Uniform spacing, categorical data</li>
            </ul>

            <h3>2. Optimize for Scale</h3>
            <ul>
              <li>Use WebGL renderer for &gt;5,000 nodes</li>
              <li>Enable viewport culling</li>
              <li>Implement LOD for varying zoom levels</li>
              <li>Use Web Workers for layout computation</li>
            </ul>

            <h3>3. Progressive Enhancement</h3>
            <ul>
              <li>Load core graph first, add details progressively</li>
              <li>Use lazy loading for node properties</li>
              <li>Implement virtual scrolling for large lists</li>
            </ul>

            <h3>4. Memory Management</h3>
            <pre><code>// Clean up when done
graph.destroy();

// Remove event listeners
graph.off('nodeClick', handler);

// Clear large data structures
graph.clearCache();</code></pre>

            <h3>LOD System</h3>
            <p>Level-of-detail reduces complexity at far zoom levels:</p>
            <pre><code>// Automatically simplifies:
// - Node shapes (circles at distance)
// - Label rendering (hidden when small)
// - Edge details (straight lines at distance)</code></pre>

            <h2>API Reference</h2>
            <p>For complete API documentation, see the <a href="https://github.com/yourusername/edgecraft">GitHub repository</a>.</p>
          </article>
        </main>
      </div>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>&copy; 2025 EdgeCraft. Licensed under MIT.</p>
        </div>
      </footer>
    </div>
  `;

  // Initialize smooth scrolling for anchor links
  initDocNavigation();
}

/**
 * Initialize documentation navigation
 */
function initDocNavigation(): void {
  const links = document.querySelectorAll('.docs-nav a');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href) return;

      const targetId = href.substring(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update active link
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
}
