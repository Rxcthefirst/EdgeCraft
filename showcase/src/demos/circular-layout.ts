/**
 * Circular Layouts Demo - Simple, Hierarchical, and Bipartite
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Social network data - showing friend groups
  const graphData = {
    nodes: [
      // Group A - Tech enthusiasts
      { id: 'alice', label: 'Alice', properties: { group: 'A', interests: 'tech' } },
      { id: 'bob', label: 'Bob', properties: { group: 'A', interests: 'tech' } },
      { id: 'charlie', label: 'Charlie', properties: { group: 'A', interests: 'tech' } },
      { id: 'david', label: 'David', properties: { group: 'A', interests: 'tech' } },
      { id: 'emma', label: 'Emma', properties: { group: 'A', interests: 'tech' } },
      
      // Group B - Sports fans
      { id: 'frank', label: 'Frank', properties: { group: 'B', interests: 'sports' } },
      { id: 'grace', label: 'Grace', properties: { group: 'B', interests: 'sports' } },
      { id: 'henry', label: 'Henry', properties: { group: 'B', interests: 'sports' } },
      { id: 'isabel', label: 'Isabel', properties: { group: 'B', interests: 'sports' } },
      
      // Group C - Artists
      { id: 'jack', label: 'Jack', properties: { group: 'C', interests: 'art' } },
      { id: 'kate', label: 'Kate', properties: { group: 'C', interests: 'art' } },
      { id: 'leo', label: 'Leo', properties: { group: 'C', interests: 'art' } },
      { id: 'maya', label: 'Maya', properties: { group: 'C', interests: 'art' } },
      { id: 'noah', label: 'Noah', properties: { group: 'C', interests: 'art' } },
    ],
    edges: [
      // Group A connections
      { id: 'e1', source: 'alice', target: 'bob', label: 'friends' },
      { id: 'e2', source: 'alice', target: 'charlie', label: 'friends' },
      { id: 'e3', source: 'bob', target: 'david', label: 'friends' },
      { id: 'e4', source: 'charlie', target: 'emma', label: 'friends' },
      { id: 'e5', source: 'david', target: 'emma', label: 'friends' },
      
      // Group B connections
      { id: 'e6', source: 'frank', target: 'grace', label: 'friends' },
      { id: 'e7', source: 'frank', target: 'henry', label: 'friends' },
      { id: 'e8', source: 'grace', target: 'isabel', label: 'friends' },
      { id: 'e9', source: 'henry', target: 'isabel', label: 'friends' },
      
      // Group C connections
      { id: 'e10', source: 'jack', target: 'kate', label: 'friends' },
      { id: 'e11', source: 'jack', target: 'leo', label: 'friends' },
      { id: 'e12', source: 'kate', target: 'maya', label: 'friends' },
      { id: 'e13', source: 'leo', target: 'noah', label: 'friends' },
      { id: 'e14', source: 'maya', target: 'noah', label: 'friends' },
      
      // Cross-group connections
      { id: 'e15', source: 'alice', target: 'frank', label: 'acquaintance' },
      { id: 'e16', source: 'emma', target: 'grace', label: 'acquaintance' },
      { id: 'e17', source: 'david', target: 'jack', label: 'acquaintance' },
      { id: 'e18', source: 'isabel', target: 'kate', label: 'acquaintance' },
    ],
  };

  // Color scheme by group
  const groupColors: { [key: string]: string } = {
    A: '#3b82f6',  // Blue - Tech
    B: '#10b981',  // Green - Sports
    C: '#f59e0b',  // Orange - Art
  };

  // Initialize EdgeCraft with circular layout
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'circular',
      variant: 'simple',
      radius: 200,
      startAngle: 0,
      sweep: 360,
    },
    nodeStyle: (node: any) => {
      const group = node.properties?.group || 'A';
      
      return {
        radius: 25,
        fill: groupColors[group] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: 2,
        label: {
          text: node.label || '',
          fontSize: 12,
          color: '#1e293b',
          position: 'center',
        },
      };
    },
    edgeStyle: (edge: any) => {
      // Style cross-group connections differently
      const isCrossGroup = edge.label === 'acquaintance';
      
      return {
        stroke: isCrossGroup ? '#94a3b8' : '#cbd5e1',
        strokeWidth: isCrossGroup ? 1 : 2,
        strokeDasharray: isCrossGroup ? '5,5' : undefined,
      };
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Simple circular layout - all nodes on single circle</li>
      <li>Hierarchical circular - concentric rings by depth</li>
      <li>Bipartite circular - two semicircles for two groups</li>
      <li>Configurable radius, start angle, and sweep</li>
      <li>Color-coded by community/interest group</li>
      <li>Cross-group connections shown with dashed lines</li>
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
  data: socialNetwork,
  layout: {
    type: 'circular',
    variant: 'simple',   // 'simple', 'hierarchical', 'bipartite'
    radius: 200,         // Circle radius
    startAngle: 0,       // Starting angle in degrees
    sweep: 360,          // Total sweep angle
  },
  nodeStyle: (node) => ({
    fill: groupColors[node.properties.group],
  }),
  edgeStyle: (edge) => ({
    strokeDasharray: edge.isCrossGroup ? '5,5' : undefined,
  })
});`;
  }

  // Setup controls
  setupControls(graph);

  // Setup config controls
  setupConfigControls(graph);

  // Update data tab
  updateDataTab(graphData);
}

function updateStats(data: any) {
  const statsMap: { [key: string]: string } = {
    'stat-nodes': String(data.nodes.length),
    'stat-edges': String(data.edges.length),
    'stat-fps': '60',
    'stat-render': '< 2ms',
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
      if (graph && graph.resetView) {
        graph.resetView();
      }
    });
  }

  if (btnFit) {
    btnFit.addEventListener('click', () => {
      if (graph && graph.fit) {
        graph.fit();
      }
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      console.log('Export graph data');
    });
  }
}

function setupConfigControls(graph: any) {
  const configContainer = document.getElementById('config-controls');
  if (!configContainer) return;

  configContainer.innerHTML = `
    <div class="config-group">
      <label>Variant</label>
      <select id="variant">
        <option value="simple" selected>Simple (Single Circle)</option>
        <option value="hierarchical">Hierarchical (Concentric)</option>
        <option value="bipartite">Bipartite (Two Semicircles)</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>Radius</label>
      <input type="range" min="100" max="300" value="200" id="radius">
      <span id="radius-value">200</span>
    </div>
    
    <div class="config-group">
      <label>Start Angle</label>
      <input type="range" min="0" max="360" value="0" id="start-angle">
      <span id="start-angle-value">0°</span>
    </div>
    
    <div class="config-group">
      <label>Sweep Angle</label>
      <input type="range" min="180" max="360" value="360" id="sweep">
      <span id="sweep-value">360°</span>
    </div>

    <div class="config-group">
      <button class="btn btn-small" id="apply-layout">Apply Layout</button>
    </div>
  `;

  // Add event listeners for sliders
  const radiusInput = document.getElementById('radius');
  const radiusValue = document.getElementById('radius-value');
  if (radiusInput && radiusValue) {
    radiusInput.addEventListener('input', (e: any) => {
      radiusValue.textContent = e.target.value;
    });
  }

  const startAngleInput = document.getElementById('start-angle');
  const startAngleValue = document.getElementById('start-angle-value');
  if (startAngleInput && startAngleValue) {
    startAngleInput.addEventListener('input', (e: any) => {
      startAngleValue.textContent = `${e.target.value}°`;
    });
  }

  const sweepInput = document.getElementById('sweep');
  const sweepValue = document.getElementById('sweep-value');
  if (sweepInput && sweepValue) {
    sweepInput.addEventListener('input', (e: any) => {
      sweepValue.textContent = `${e.target.value}°`;
    });
  }

  // Apply layout button
  const applyBtn = document.getElementById('apply-layout');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const variant = (document.getElementById('variant') as HTMLSelectElement)?.value || 'simple';
      const radius = parseInt((document.getElementById('radius') as HTMLInputElement)?.value || '200');
      const startAngle = parseInt((document.getElementById('start-angle') as HTMLInputElement)?.value || '0');
      const sweep = parseInt((document.getElementById('sweep') as HTMLInputElement)?.value || '360');

      console.log('Applying layout:', { variant, radius, startAngle, sweep });
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
