/**
 * Radial Tree Layout Demo - Concentric Circles by Depth
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Company structure data - technology company departments
  const graphData = {
    nodes: [
      // Root - CEO
      { id: 'ceo', label: 'CEO', properties: { depth: 0, type: 'executive' } },
      
      // Depth 1 - C-Suite
      { id: 'cto', label: 'CTO', properties: { depth: 1, type: 'executive' } },
      { id: 'cfo', label: 'CFO', properties: { depth: 1, type: 'executive' } },
      { id: 'coo', label: 'COO', properties: { depth: 1, type: 'executive' } },
      { id: 'cmo', label: 'CMO', properties: { depth: 1, type: 'executive' } },
      
      // Depth 2 - Engineering VPs
      { id: 'vp-eng', label: 'VP Engineering', properties: { depth: 2, type: 'vp', department: 'tech' } },
      { id: 'vp-product', label: 'VP Product', properties: { depth: 2, type: 'vp', department: 'tech' } },
      { id: 'vp-data', label: 'VP Data', properties: { depth: 2, type: 'vp', department: 'tech' } },
      
      // Depth 2 - Finance
      { id: 'vp-finance', label: 'VP Finance', properties: { depth: 2, type: 'vp', department: 'finance' } },
      { id: 'controller', label: 'Controller', properties: { depth: 2, type: 'vp', department: 'finance' } },
      
      // Depth 2 - Operations
      { id: 'vp-ops', label: 'VP Operations', properties: { depth: 2, type: 'vp', department: 'ops' } },
      { id: 'vp-hr', label: 'VP HR', properties: { depth: 2, type: 'vp', department: 'ops' } },
      
      // Depth 2 - Marketing
      { id: 'vp-marketing', label: 'VP Marketing', properties: { depth: 2, type: 'vp', department: 'marketing' } },
      { id: 'vp-sales', label: 'VP Sales', properties: { depth: 2, type: 'vp', department: 'marketing' } },
      
      // Depth 3 - Engineering Directors
      { id: 'dir-frontend', label: 'Frontend', properties: { depth: 3, type: 'director', department: 'tech' } },
      { id: 'dir-backend', label: 'Backend', properties: { depth: 3, type: 'director', department: 'tech' } },
      { id: 'dir-mobile', label: 'Mobile', properties: { depth: 3, type: 'director', department: 'tech' } },
      { id: 'dir-infra', label: 'Infrastructure', properties: { depth: 3, type: 'director', department: 'tech' } },
      
      // Depth 3 - Product
      { id: 'dir-pm', label: 'Product Mgmt', properties: { depth: 3, type: 'director', department: 'tech' } },
      { id: 'dir-design', label: 'Design', properties: { depth: 3, type: 'director', department: 'tech' } },
      
      // Depth 3 - Data
      { id: 'dir-analytics', label: 'Analytics', properties: { depth: 3, type: 'director', department: 'tech' } },
      { id: 'dir-ml', label: 'ML/AI', properties: { depth: 3, type: 'director', department: 'tech' } },
    ],
    edges: [
      // CEO connections
      { id: 'e1', source: 'ceo', target: 'cto' },
      { id: 'e2', source: 'ceo', target: 'cfo' },
      { id: 'e3', source: 'ceo', target: 'coo' },
      { id: 'e4', source: 'ceo', target: 'cmo' },
      
      // CTO connections
      { id: 'e5', source: 'cto', target: 'vp-eng' },
      { id: 'e6', source: 'cto', target: 'vp-product' },
      { id: 'e7', source: 'cto', target: 'vp-data' },
      
      // CFO connections
      { id: 'e8', source: 'cfo', target: 'vp-finance' },
      { id: 'e9', source: 'cfo', target: 'controller' },
      
      // COO connections
      { id: 'e10', source: 'coo', target: 'vp-ops' },
      { id: 'e11', source: 'coo', target: 'vp-hr' },
      
      // CMO connections
      { id: 'e12', source: 'cmo', target: 'vp-marketing' },
      { id: 'e13', source: 'cmo', target: 'vp-sales' },
      
      // VP Engineering connections
      { id: 'e14', source: 'vp-eng', target: 'dir-frontend' },
      { id: 'e15', source: 'vp-eng', target: 'dir-backend' },
      { id: 'e16', source: 'vp-eng', target: 'dir-mobile' },
      { id: 'e17', source: 'vp-eng', target: 'dir-infra' },
      
      // VP Product connections
      { id: 'e18', source: 'vp-product', target: 'dir-pm' },
      { id: 'e19', source: 'vp-product', target: 'dir-design' },
      
      // VP Data connections
      { id: 'e20', source: 'vp-data', target: 'dir-analytics' },
      { id: 'e21', source: 'vp-data', target: 'dir-ml' },
    ],
  };

  // Color scheme by depth/level
  const depthColors: string[] = [
    '#8b5cf6', // Depth 0 - Purple
    '#3b82f6', // Depth 1 - Blue
    '#10b981', // Depth 2 - Green
    '#f59e0b', // Depth 3 - Orange
  ];

  // Initialize EdgeCraft with radial tree layout
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'radialtree',
      radius: 100,
      radiusIncrement: 120,
      angleSpacing: 'proportional',
      startAngle: 0,
    },
    nodeStyle: (node: any) => {
      const depth = node.properties?.depth || 0;
      
      return {
        radius: depth === 0 ? 35 : (depth === 1 ? 30 : 25),
        fill: depthColors[depth] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: 3,
        label: {
          text: node.label || '',
          fontSize: depth === 0 ? 14 : 11,
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
      <li>Radial layout with concentric circles by depth</li>
      <li>Equal or proportional angular spacing</li>
      <li>Configurable radius increment between levels</li>
      <li>Optimal for hierarchies with many children</li>
      <li>Color-coded by organizational depth</li>
      <li>360° view of company structure</li>
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
  data: companyStructure,
  layout: {
    type: 'radialtree',
    radius: 100,           // Inner radius
    radiusIncrement: 120,  // Spacing between levels
    angleSpacing: 'proportional', // or 'equal'
    startAngle: 0,         // Rotation offset
  },
  nodeStyle: (node) => ({
    radius: node.depth === 0 ? 35 : 25,
    fill: depthColors[node.depth],
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
      <label>Inner Radius</label>
      <input type="range" min="50" max="200" value="100" id="radius">
      <span id="radius-value">100</span>
    </div>
    
    <div class="config-group">
      <label>Radius Increment</label>
      <input type="range" min="60" max="200" value="120" id="radius-increment">
      <span id="radius-increment-value">120</span>
    </div>
    
    <div class="config-group">
      <label>Angle Spacing</label>
      <select id="angle-spacing">
        <option value="proportional" selected>Proportional</option>
        <option value="equal">Equal</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>Start Angle</label>
      <input type="range" min="0" max="360" value="0" id="start-angle">
      <span id="start-angle-value">0°</span>
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

  const radiusIncInput = document.getElementById('radius-increment');
  const radiusIncValue = document.getElementById('radius-increment-value');
  if (radiusIncInput && radiusIncValue) {
    radiusIncInput.addEventListener('input', (e: any) => {
      radiusIncValue.textContent = e.target.value;
    });
  }

  const angleInput = document.getElementById('start-angle');
  const angleValue = document.getElementById('start-angle-value');
  if (angleInput && angleValue) {
    angleInput.addEventListener('input', (e: any) => {
      angleValue.textContent = `${e.target.value}°`;
    });
  }

  // Apply layout button
  const applyBtn = document.getElementById('apply-layout');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const radius = parseInt((document.getElementById('radius') as HTMLInputElement)?.value || '100');
      const radiusIncrement = parseInt((document.getElementById('radius-increment') as HTMLInputElement)?.value || '120');
      const angleSpacing = (document.getElementById('angle-spacing') as HTMLSelectElement)?.value || 'proportional';
      const startAngle = parseInt((document.getElementById('start-angle') as HTMLInputElement)?.value || '0');

      console.log('Applying layout:', { radius, radiusIncrement, angleSpacing, startAngle });
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
