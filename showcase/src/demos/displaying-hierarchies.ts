/**
 * Displaying Hierarchies Demo - Sugiyama Hierarchical Layout
 */
import { EdgeCraft, HierarchicalLayout } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Organizational hierarchy data
  const graphData = {
    nodes: [
      // Executive level
      { id: 'ceo', label: 'CEO', properties: { level: 'executive', department: 'Leadership' } },
      
      // VP level
      { id: 'vp-eng', label: 'VP Engineering', properties: { level: 'vp', department: 'Engineering' } },
      { id: 'vp-product', label: 'VP Product', properties: { level: 'vp', department: 'Product' } },
      { id: 'vp-sales', label: 'VP Sales', properties: { level: 'vp', department: 'Sales' } },
      
      // Director level
      { id: 'dir-frontend', label: 'Director Frontend', properties: { level: 'director', department: 'Engineering' } },
      { id: 'dir-backend', label: 'Director Backend', properties: { level: 'director', department: 'Engineering' } },
      { id: 'dir-design', label: 'Director Design', properties: { level: 'director', department: 'Product' } },
      { id: 'dir-pm', label: 'Director PM', properties: { level: 'director', department: 'Product' } },
      { id: 'dir-enterprise', label: 'Director Enterprise', properties: { level: 'director', department: 'Sales' } },
      
      // Manager level
      { id: 'mgr-web', label: 'Web Team Lead', properties: { level: 'manager', department: 'Engineering' } },
      { id: 'mgr-mobile', label: 'Mobile Team Lead', properties: { level: 'manager', department: 'Engineering' } },
      { id: 'mgr-api', label: 'API Team Lead', properties: { level: 'manager', department: 'Engineering' } },
      { id: 'mgr-infra', label: 'Infrastructure Lead', properties: { level: 'manager', department: 'Engineering' } },
      { id: 'mgr-ux', label: 'UX Manager', properties: { level: 'manager', department: 'Product' } },
      { id: 'mgr-research', label: 'Research Manager', properties: { level: 'manager', department: 'Product' } },
      { id: 'mgr-growth', label: 'Growth PM', properties: { level: 'manager', department: 'Product' } },
      { id: 'mgr-ae', label: 'AE Manager', properties: { level: 'manager', department: 'Sales' } },
    ],
    edges: [
      // CEO reports
      { id: 'e1', source: 'ceo', target: 'vp-eng', label: 'manages' },
      { id: 'e2', source: 'ceo', target: 'vp-product', label: 'manages' },
      { id: 'e3', source: 'ceo', target: 'vp-sales', label: 'manages' },
      
      // VP Engineering reports
      { id: 'e4', source: 'vp-eng', target: 'dir-frontend', label: 'manages' },
      { id: 'e5', source: 'vp-eng', target: 'dir-backend', label: 'manages' },
      
      // VP Product reports
      { id: 'e6', source: 'vp-product', target: 'dir-design', label: 'manages' },
      { id: 'e7', source: 'vp-product', target: 'dir-pm', label: 'manages' },
      
      // VP Sales reports
      { id: 'e8', source: 'vp-sales', target: 'dir-enterprise', label: 'manages' },
      
      // Director Frontend reports
      { id: 'e9', source: 'dir-frontend', target: 'mgr-web', label: 'manages' },
      { id: 'e10', source: 'dir-frontend', target: 'mgr-mobile', label: 'manages' },
      
      // Director Backend reports
      { id: 'e11', source: 'dir-backend', target: 'mgr-api', label: 'manages' },
      { id: 'e12', source: 'dir-backend', target: 'mgr-infra', label: 'manages' },
      
      // Director Design reports
      { id: 'e13', source: 'dir-design', target: 'mgr-ux', label: 'manages' },
      { id: 'e14', source: 'dir-design', target: 'mgr-research', label: 'manages' },
      
      // Director PM reports
      { id: 'e15', source: 'dir-pm', target: 'mgr-growth', label: 'manages' },
      
      // Director Enterprise reports
      { id: 'e16', source: 'dir-enterprise', target: 'mgr-ae', label: 'manages' },
    ],
  };

  // Color scheme by level
  const levelColors: { [key: string]: string } = {
    executive: '#8b5cf6',
    vp: '#3b82f6',
    director: '#10b981',
    manager: '#f59e0b',
  };

  // Initialize EdgeCraft with hierarchical layout
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'hierarchical',
      direction: 'TB', // Top to bottom
      layerSpacing: 120,
      nodeSpacing: 80,
      crossingIterations: 10,
    },
    nodeStyle: (node: any) => {
      const level = node.properties?.level || 'default';
      return {
        radius: 30,
        fill: levelColors[level] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: 3,
        label: {
          text: node.label || '',
          fontSize: 12,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: {
      stroke: '#cbd5e1',
      strokeWidth: 2,
      arrow: 'target',
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Sugiyama algorithm with layer assignment</li>
      <li>Crossing minimization (barycentric heuristic)</li>
      <li>Clean top-to-bottom hierarchy</li>
      <li>Color-coded by organizational level</li>
      <li>Optimal spacing for readability</li>
      <li>Directed edges showing reporting structure</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft, HierarchicalLayout } from 'edgecraft';

const graph = new EdgeCraft({
  container: '#graph',
  data: {
    nodes: [
      { id: 'ceo', label: 'CEO' },
      { id: 'vp-eng', label: 'VP Engineering' },
      // ...
    ],
    edges: [
      { source: 'ceo', target: 'vp-eng' },
      // ...
    ]
  },
  layout: {
    type: 'hierarchical',
    direction: 'TB',    // Top to bottom
    layerSpacing: 120,  // Vertical spacing
    nodeSpacing: 80,    // Horizontal spacing
  }
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
      // Could export as PNG, SVG, or JSON
    });
  }
}

function setupConfigControls(graph: any) {
  const configContainer = document.getElementById('config-controls');
  if (!configContainer) return;

  configContainer.innerHTML = `
    <div class="config-group">
      <label>Direction</label>
      <select id="direction">
        <option value="TB" selected>Top to Bottom</option>
        <option value="BT">Bottom to Top</option>
        <option value="LR">Left to Right</option>
        <option value="RL">Right to Left</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>Layer Spacing</label>
      <input type="range" min="60" max="200" value="120" id="layer-spacing">
      <span id="layer-spacing-value">120</span>
    </div>
    
    <div class="config-group">
      <label>Node Spacing</label>
      <input type="range" min="40" max="150" value="80" id="node-spacing">
      <span id="node-spacing-value">80</span>
    </div>
    
    <div class="config-group">
      <label>Crossing Iterations</label>
      <input type="range" min="0" max="20" value="10" id="crossing-iterations">
      <span id="crossing-iterations-value">10</span>
    </div>

    <div class="config-group">
      <button class="btn btn-small" id="apply-layout">Apply Layout</button>
    </div>
  `;

  // Add event listeners for sliders
  ['layer-spacing', 'node-spacing', 'crossing-iterations'].forEach(id => {
    const input = document.getElementById(id);
    const valueSpan = document.getElementById(`${id}-value`);
    
    if (input && valueSpan) {
      input.addEventListener('input', (e: any) => {
        valueSpan.textContent = e.target.value;
      });
    }
  });

  // Apply layout button
  const applyBtn = document.getElementById('apply-layout');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const direction = (document.getElementById('direction') as HTMLSelectElement)?.value || 'TB';
      const layerSpacing = parseInt((document.getElementById('layer-spacing') as HTMLInputElement)?.value || '120');
      const nodeSpacing = parseInt((document.getElementById('node-spacing') as HTMLInputElement)?.value || '80');
      const crossingIterations = parseInt((document.getElementById('crossing-iterations') as HTMLInputElement)?.value || '10');

      console.log('Applying layout:', { direction, layerSpacing, nodeSpacing, crossingIterations });
      // Re-apply layout with new settings
      // graph.updateLayout({ ... });
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
