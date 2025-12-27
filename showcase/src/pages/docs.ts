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
                <li><a href="#installation" class="active">Installation</a></li>
                <li><a href="#quick-start">Quick Start</a></li>
                <li><a href="#basic-concepts">Basic Concepts</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Core API</h3>
              <ul>
                <li><a href="#graph">Graph</a></li>
                <li><a href="#nodes-edges">Nodes & Edges</a></li>
                <li><a href="#styling">Styling</a></li>
                <li><a href="#interactions">Interactions</a></li>
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
              </ul>
            </div>

            <div class="nav-section">
              <h3>Advanced Features</h3>
              <ul>
                <li><a href="#edge-bundling">Edge Bundling</a></li>
                <li><a href="#compound-graphs">Compound Graphs</a></li>
                <li><a href="#query-filter">Query & Filter</a></li>
                <li><a href="#spatial-index">Spatial Index</a></li>
              </ul>
            </div>

            <div class="nav-section">
              <h3>Performance</h3>
              <ul>
                <li><a href="#renderers">Renderers</a></li>
                <li><a href="#optimization">Optimization</a></li>
                <li><a href="#large-graphs">Large Graphs</a></li>
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

            <h2 id="performance">Performance Optimization</h2>
            <h3>Viewport Culling</h3>
            <p>Automatically enabled for large graphs. Only visible nodes are rendered:</p>
            <pre><code>// Culling activates at:
// - 200 nodes (Canvas)
// - 500 nodes (WebGL)</code></pre>

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
