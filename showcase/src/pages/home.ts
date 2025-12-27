/**
 * Render the home page
 */
export async function renderHome(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="home-page">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="logo">
            <h1>EdgeCraft</h1>
            <span class="tagline">Advanced Graph Visualization</span>
          </div>
          <nav class="nav">
            <a href="/demos">Demos</a>
            <a href="/docs">Documentation</a>
            <a href="https://github.com/yourusername/edgecraft" target="_blank">GitHub</a>
          </nav>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h2>Visualize Complex Relationships</h2>
            <p>
              EdgeCraft is a high-performance graph visualization library for building
              interactive network diagrams, knowledge graphs, and data visualization applications.
            </p>
            <div class="cta-buttons">
              <a href="/demos" class="btn btn-primary">Explore Demos</a>
              <a href="/docs" class="btn btn-secondary">Read Documentation</a>
            </div>
          </div>
          <div class="hero-visual">
            <div id="hero-graph" class="graph-preview"></div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features">
        <div class="container">
          <h2 class="section-title">Why EdgeCraft?</h2>
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3>High Performance</h3>
              <p>WebGL rendering supports 10,000+ nodes at 60fps with automatic LOD</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3>Beautiful Layouts</h3>
              <p>9 professional algorithms: Force, Hierarchical, Tree, Radial, Circular, and more</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3>Flexible API</h3>
              <p>TypeScript-first with intuitive APIs for maximum developer productivity</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌐</div>
              <h3>Dual Graph Support</h3>
              <p>Native support for both LPG and RDF graph models</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3>Advanced Features</h3>
              <p>Edge bundling, compound graphs, spatial indexing, and more</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📦</div>
              <h3>Open Source</h3>
              <p>MIT licensed - use it anywhere, contribute and customize freely</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Use Cases -->
      <section class="use-cases">
        <div class="container">
          <h2 class="section-title">Perfect For</h2>
          <div class="use-case-list">
            <div class="use-case">
              <h3>Knowledge Graphs</h3>
              <p>Visualize complex ontologies and semantic networks with RDF support</p>
            </div>
            <div class="use-case">
              <h3>Social Networks</h3>
              <p>Explore connections and communities with force-directed layouts</p>
            </div>
            <div class="use-case">
              <h3>Dependency Analysis</h3>
              <p>Map software dependencies with hierarchical and tree layouts</p>
            </div>
            <div class="use-case">
              <h3>Network Topology</h3>
              <p>Monitor infrastructure with real-time updates and spatial indexing</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <h2>Ready to Get Started?</h2>
          <p>Install EdgeCraft and build your first graph visualization in minutes</p>
          <div class="code-block">
            <code>npm install edgecraft</code>
          </div>
          <a href="/demos" class="btn btn-primary">See Examples</a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>&copy; 2025 EdgeCraft. Licensed under MIT.</p>
          <div class="footer-links">
            <a href="https://github.com/yourusername/edgecraft">GitHub</a>
            <a href="https://twitter.com/edgecraft">Twitter</a>
            <a href="/docs">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Initialize hero graph
  initHeroGraph();
}

/**
 * Initialize the hero graph visualization
 */
function initHeroGraph(): void {
  // This will be implemented to show a live EdgeCraft demo
  const container = document.getElementById('hero-graph');
  if (!container) return;

  // TODO: Add actual EdgeCraft visualization
  container.innerHTML = '<div class="placeholder">Interactive Graph Demo</div>';
}
