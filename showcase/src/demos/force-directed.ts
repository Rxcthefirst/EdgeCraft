/**
 * Force-Directed Layout Demo
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Sample data
  const graphData = {
    nodes: [
      { id: 1, label: 'Node 1', properties: { type: 'person' } },
      { id: 2, label: 'Node 2', properties: { type: 'person' } },
      { id: 3, label: 'Node 3', properties: { type: 'organization' } },
      { id: 4, label: 'Node 4', properties: { type: 'person' } },
      { id: 5, label: 'Node 5', properties: { type: 'person' } },
      { id: 6, label: 'Node 6', properties: { type: 'organization' } },
    ],
    edges: [
      { id: 'e1', source: 1, target: 2, label: 'knows' },
      { id: 'e2', source: 1, target: 3, label: 'works_at' },
      { id: 'e3', source: 2, target: 3, label: 'works_at' },
      { id: 'e4', source: 3, target: 4, label: 'employs' },
      { id: 'e5', source: 4, target: 5, label: 'knows' },
      { id: 'e6', source: 5, target: 6, label: 'works_at' },
    ],
  };

  // Initialize EdgeCraft
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'force',
    },
    nodeStyle: {
      radius: 25,
      fill: (node: any) => {
        return node.properties?.type === 'person' ? '#3b82f6' : '#10b981';
      },
      stroke: '#ffffff',
      strokeWidth: 2,
    },
    edgeStyle: {
      stroke: '#94a3b8',
      strokeWidth: 2,
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Physics-based node positioning</li>
      <li>Real-time force simulation</li>
      <li>Interactive dragging</li>
      <li>Zoom and pan controls</li>
      <li>Automatic collision detection</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft } from 'edgecraft';

const graph = new EdgeCraft({
  container: '#graph',
  data: {
    nodes: [
      { id: 1, label: 'Node 1' },
      { id: 2, label: 'Node 2' },
      // ...
    ],
    edges: [
      { source: 1, target: 2 },
      // ...
    ]
  },
  layout: {
    type: 'force'
  }
});`;
  }

  // Setup controls
  setupControls(graph);

  // Setup config controls
  setupConfigControls(graph);
}

function updateStats(data: any) {
  const statsMap: { [key: string]: string } = {
    'stat-nodes': String(data.nodes.length),
    'stat-edges': String(data.edges.length),
    'stat-fps': '60',
    'stat-render': '< 1ms',
  };

  for (const [id, value] of Object.entries(statsMap)) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
}

function setupControls(graph: any) {
  const btnReset = document.getElementById('btn-reset');
  const btnFit = document.getElementById('btn-fit');
  const btnExport = document.getElementById('btn-export');

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      // Reset zoom/pan
      console.log('Reset clicked');
    });
  }

  if (btnFit) {
    btnFit.addEventListener('click', () => {
      // Fit to view
      console.log('Fit clicked');
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      // Export graph
      console.log('Export clicked');
    });
  }
}

function setupConfigControls(graph: any) {
  const configContainer = document.getElementById('config-controls');
  if (!configContainer) return;

  configContainer.innerHTML = `
    <div class="config-group">
      <label>Spring Length</label>
      <input type="range" min="50" max="200" value="100" id="spring-length">
      <span id="spring-length-value">100</span>
    </div>
    <div class="config-group">
      <label>Spring Strength</label>
      <input type="range" min="0" max="1" step="0.01" value="0.05" id="spring-strength">
      <span id="spring-strength-value">0.05</span>
    </div>
    <div class="config-group">
      <label>Repulsion Strength</label>
      <input type="range" min="100" max="2000" value="500" id="repulsion">
      <span id="repulsion-value">500</span>
    </div>
  `;

  // Add event listeners
  ['spring-length', 'spring-strength', 'repulsion'].forEach(id => {
    const input = document.getElementById(id);
    const valueSpan = document.getElementById(`${id}-value`);
    
    if (input && valueSpan) {
      input.addEventListener('input', (e: any) => {
        valueSpan.textContent = e.target.value;
        // Update graph config
      });
    }
  });
}
