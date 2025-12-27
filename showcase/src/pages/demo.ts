import { router } from '../router';
import { demos } from './demo-list';

/**
 * Render individual demo page
 */
export async function renderDemo(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  const demoId = router.getParam('id');
  const demo = demos.find(d => d.id === demoId);

  if (!demo) {
    app.innerHTML = '<div class="error">Demo not found</div>';
    return;
  }

  app.innerHTML = `
    <div class="demo-page">
      <!-- Header -->
      <header class="header compact">
        <div class="container">
          <div class="logo">
            <a href="/">
              <h1>EdgeCraft</h1>
            </a>
          </div>
          <nav class="nav">
            <a href="/demos">← Back to Demos</a>
            <a href="/docs">Documentation</a>
          </nav>
        </div>
      </header>

      <!-- Demo Content -->
      <div class="demo-container">
        <!-- Left Panel: Visualization -->
        <div class="demo-panel demo-visualization">
          <div id="graph-container" class="graph-container"></div>
          <div class="demo-controls">
            <button class="btn btn-small" id="btn-reset">Reset</button>
            <button class="btn btn-small" id="btn-fit">Fit View</button>
            <button class="btn btn-small" id="btn-export">Export</button>
          </div>
        </div>

        <!-- Right Panel: Tabbed Interface -->
        <div class="demo-panel demo-sidebar">
          <!-- Tab Headers -->
          <div class="tab-headers">
            <button class="tab-header active" data-tab="info">
              <span class="tab-icon">ℹ️</span>
              <span class="tab-label">Info</span>
            </button>
            <button class="tab-header" data-tab="code">
              <span class="tab-icon">💻</span>
              <span class="tab-label">Code</span>
            </button>
            <button class="tab-header" data-tab="config">
              <span class="tab-icon">⚙️</span>
              <span class="tab-label">Settings</span>
            </button>
            <button class="tab-header" data-tab="data">
              <span class="tab-icon">📊</span>
              <span class="tab-label">Data</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Info Tab -->
            <div class="tab-pane active" data-tab="info">
              <h2>${demo.title}</h2>
              <p class="demo-description">${demo.description}</p>
              
              <div class="info-section">
                <h3>Features</h3>
                <ul id="feature-list">
                  <li>Loading...</li>
                </ul>
              </div>

              <div class="info-section">
                <h3>Performance</h3>
                <div class="stats">
                  <div class="stat">
                    <span class="stat-label">Nodes:</span>
                    <span class="stat-value" id="stat-nodes">-</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Edges:</span>
                    <span class="stat-value" id="stat-edges">-</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">FPS:</span>
                    <span class="stat-value" id="stat-fps">-</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Render Time:</span>
                    <span class="stat-value" id="stat-render">-</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Code Tab -->
            <div class="tab-pane" data-tab="code">
              <h3>Implementation</h3>
              <pre><code id="code-example">// Loading...</code></pre>
              <button class="btn btn-small" id="btn-copy-code">Copy Code</button>
            </div>

            <!-- Config Tab -->
            <div class="tab-pane" data-tab="config">
              <h3>Configuration</h3>
              <div id="config-controls">
                <!-- Dynamic controls will be inserted here -->
              </div>
            </div>

            <!-- Data Tab -->
            <div class="tab-pane" data-tab="data">
              <h3>Graph Data</h3>
              <div class="data-controls">
                <button class="btn btn-small" id="btn-load-sample">Load Sample Data</button>
                <button class="btn btn-small" id="btn-generate-random">Generate Random</button>
                <button class="btn btn-small" id="btn-import-json">Import JSON</button>
              </div>
              <div class="data-preview">
                <pre><code id="data-json">// No data loaded</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize tabs
  initTabs();

  // Load the specific demo
  await loadDemo(demoId);
}

/**
 * Initialize tab switching
 */
function initTabs(): void {
  const headers = document.querySelectorAll('.tab-header');
  const panes = document.querySelectorAll('.tab-pane');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const tabId = header.getAttribute('data-tab');

      // Update active states
      headers.forEach(h => h.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      header.classList.add('active');
      const targetPane = document.querySelector(`.tab-pane[data-tab="${tabId}"]`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
}

/**
 * Load specific demo
 */
async function loadDemo(demoId: string): Promise<void> {
  try {
    // Dynamically import demo module
    const demoModule = await import(`../demos/${demoId}.ts`);
    
    if (demoModule && demoModule.default) {
      await demoModule.default();
    }
  } catch (error) {
    console.error(`Failed to load demo: ${demoId}`, error);
    
    // Show placeholder
    const container = document.getElementById('graph-container');
    if (container) {
      container.innerHTML = `
        <div class="demo-placeholder">
          <h3>Demo: ${demoId}</h3>
          <p>This demo is under construction.</p>
        </div>
      `;
    }
  }
}
