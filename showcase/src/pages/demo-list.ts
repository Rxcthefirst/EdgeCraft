export interface Demo {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
}

export const demos: Demo[] = [
  {
    id: 'force-directed',
    title: 'Force-Directed Layout',
    description: 'Classic spring-based layout with real-time physics simulation',
    category: 'Layouts',
  },
  {
    id: 'displaying-hierarchies',
    title: 'Displaying Hierarchies',
    description: 'Sugiyama algorithm for organizational charts and DAGs',
    category: 'Layouts',
  },
  {
    id: 'tree-layout',
    title: 'Tree Layout',
    description: 'Reingold-Tilford algorithm for tidy trees - file system example',
    category: 'Layouts',
  },
  {
    id: 'radial-tree',
    title: 'Radial Tree Layout',
    description: 'Circular tree layout with concentric layers - company structure',
    category: 'Layouts',
  },
  {
    id: 'circular-layout',
    title: 'Circular Layouts',
    description: 'Simple, hierarchical, and bipartite circular arrangements - social network',
    category: 'Layouts',
  },
  {
    id: 'organic-layout',
    title: 'Organic Layout',
    description: 'Barnes-Hut optimized force-directed layout - collaboration network',
    category: 'Layouts',
  },
  {
    id: 'edge-bundling',
    title: 'Edge Bundling',
    description: 'Hierarchical and FDEB algorithms - network topology',
    category: 'Advanced',
  },
  {
    id: 'compound-graphs',
    title: 'Compound Graphs',
    description: 'Hierarchical grouping with collapsible nodes - microservices',
    category: 'Advanced',
  },
  {
    id: 'ui-components',
    title: 'UI Components',
    description: 'Interactive toolbar, legend, minimap, inspector, and context menu',
    category: 'Advanced',
  },
  {
    id: 'styling-showcase',
    title: 'Styling Showcase',
    description: 'Node shapes, colors, borders, icons, multi-line labels, and window nodes',
    category: 'Advanced',
  },
  {
    id: 'large-graphs',
    title: 'Large Graphs (10K+ nodes)',
    description: 'WebGL rendering with LOD and viewport culling',
    category: 'Performance',
  },
  {
    id: 'knowledge-graph',
    title: 'Knowledge Graph',
    description: 'RDF visualization with semantic relationships',
    category: 'Use Cases',
  },
  {
    id: 'rdf-advanced-styling',
    title: 'RDF Advanced Styling',
    description: 'OWL, SKOS, association classes with rich styling and property inspector',
    category: 'Use Cases',
  },
  {
    id: 'social-network',
    title: 'Social Network',
    description: 'Community detection and influence analysis',
    category: 'Use Cases',
  },
  {
    id: 'dependency-graph',
    title: 'Dependency Graph',
    description: 'Software package dependencies with filtering',
    category: 'Use Cases',
  },
  {
    id: 'time-series',
    title: 'Time Series',
    description: 'Temporal graph visualization with timeline animation and playback controls',
    category: 'Advanced',
  },
  {
    id: 'animated-adaptive',
    title: 'Animated Adaptive Layout',
    description: 'Smooth layout transitions with adaptive positioning that preserves existing nodes',
    category: 'Advanced',
  },
];

/**
 * Render the demo list page
 */
export async function renderDemoList(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  // Group demos by category
  const categories = Array.from(new Set(demos.map(d => d.category)));
  
  const categoryHTML = categories.map(category => {
    const categoryDemos = demos.filter(d => d.category === category);
    
    const demoCards = categoryDemos.map(demo => `
      <a href="/demo/${demo.id}" class="demo-card">
        <div class="demo-thumbnail">
          ${demo.thumbnail || '<div class="demo-placeholder">📊</div>'}
        </div>
        <div class="demo-info">
          <h3>${demo.title}</h3>
          <p>${demo.description}</p>
        </div>
      </a>
    `).join('');

    return `
      <div class="demo-category">
        <h2 class="category-title">${category}</h2>
        <div class="demo-grid">
          ${demoCards}
        </div>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div class="demo-list-page">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="logo">
            <a href="/">
              <h1>EdgeCraft</h1>
            </a>
          </div>
          <nav class="nav">
            <a href="/demos" class="active">Demos</a>
            <a href="/docs">Documentation</a>
            <a href="https://github.com/yourusername/edgecraft" target="_blank">GitHub</a>
          </nav>
        </div>
      </header>

      <!-- Content -->
      <main class="main-content">
        <div class="container">
          <div class="page-header">
            <h1>Demos & Examples</h1>
            <p>Explore EdgeCraft's capabilities through interactive demonstrations</p>
          </div>

          ${categoryHTML}
        </div>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>&copy; 2025 EdgeCraft. Licensed under MIT.</p>
        </div>
      </footer>
    </div>
  `;
}
