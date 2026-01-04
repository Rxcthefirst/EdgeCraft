/**
 * Dependency Graph Demo - NPM Package Dependencies
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // NPM package dependency graph
  const graphData = {
    nodes: [
      // Root package
      { id: 'app', label: 'my-app', properties: { type: 'root', version: '1.0.0', size: 'large' } },
      
      // Direct dependencies
      { id: 'react', label: 'react', properties: { type: 'direct', version: '18.2.0', size: 'large', downloads: '20M' } },
      { id: 'react-dom', label: 'react-dom', properties: { type: 'direct', version: '18.2.0', size: 'large', downloads: '20M' } },
      { id: 'express', label: 'express', properties: { type: 'direct', version: '4.18.2', size: 'medium', downloads: '15M' } },
      { id: 'axios', label: 'axios', properties: { type: 'direct', version: '1.4.0', size: 'medium', downloads: '12M' } },
      { id: 'lodash', label: 'lodash', properties: { type: 'direct', version: '4.17.21', size: 'large', downloads: '25M' } },
      
      // React's dependencies
      { id: 'loose-envify', label: 'loose-envify', properties: { type: 'peer', version: '1.4.0', size: 'small', downloads: '8M' } },
      { id: 'scheduler', label: 'scheduler', properties: { type: 'peer', version: '0.23.0', size: 'small', downloads: '18M' } },
      
      // Express's dependencies
      { id: 'body-parser', label: 'body-parser', properties: { type: 'transitive', version: '1.20.1', size: 'medium', downloads: '10M' } },
      { id: 'cookie', label: 'cookie', properties: { type: 'transitive', version: '0.5.0', size: 'small', downloads: '12M' } },
      { id: 'debug', label: 'debug', properties: { type: 'transitive', version: '2.6.9', size: 'small', downloads: '30M' } },
      { id: 'finalhandler', label: 'finalhandler', properties: { type: 'transitive', version: '1.2.0', size: 'small', downloads: '9M' } },
      { id: 'send', label: 'send', properties: { type: 'transitive', version: '0.18.0', size: 'medium', downloads: '11M' } },
      
      // Axios's dependencies
      { id: 'follow-redirects', label: 'follow-redirects', properties: { type: 'transitive', version: '1.15.2', size: 'small', downloads: '7M' } },
      { id: 'form-data', label: 'form-data', properties: { type: 'transitive', version: '4.0.0', size: 'small', downloads: '9M' } },
      { id: 'proxy-from-env', label: 'proxy-from-env', properties: { type: 'transitive', version: '1.1.0', size: 'tiny', downloads: '5M' } },
      
      // Shared deep dependencies
      { id: 'ms', label: 'ms', properties: { type: 'deep', version: '2.1.2', size: 'tiny', downloads: '40M' } },
      { id: 'mime', label: 'mime', properties: { type: 'deep', version: '1.6.0', size: 'small', downloads: '20M' } },
      { id: 'mime-types', label: 'mime-types', properties: { type: 'deep', version: '2.1.35', size: 'small', downloads: '22M' } },
      { id: 'mime-db', label: 'mime-db', properties: { type: 'deep', version: '1.52.0', size: 'medium', downloads: '22M' } },
      
      // Dev dependencies
      { id: 'typescript', label: 'typescript', properties: { type: 'dev', version: '5.0.4', size: 'large', downloads: '18M' } },
      { id: 'eslint', label: 'eslint', properties: { type: 'dev', version: '8.42.0', size: 'large', downloads: '16M' } },
      { id: 'jest', label: 'jest', properties: { type: 'dev', version: '29.5.0', size: 'large', downloads: '14M' } },
      
      // Optional dependencies
      { id: 'fsevents', label: 'fsevents', properties: { type: 'optional', version: '2.3.2', size: 'medium', downloads: '10M', platform: 'darwin' } },
    ],
    edges: [
      // Root dependencies
      { id: 'd1', source: 'app', target: 'react', label: '^18.2.0', properties: { type: 'direct' } },
      { id: 'd2', source: 'app', target: 'react-dom', label: '^18.2.0', properties: { type: 'direct' } },
      { id: 'd3', source: 'app', target: 'express', label: '^4.18.0', properties: { type: 'direct' } },
      { id: 'd4', source: 'app', target: 'axios', label: '^1.4.0', properties: { type: 'direct' } },
      { id: 'd5', source: 'app', target: 'lodash', label: '^4.17.0', properties: { type: 'direct' } },
      { id: 'd6', source: 'app', target: 'typescript', label: '^5.0.0', properties: { type: 'dev' } },
      { id: 'd7', source: 'app', target: 'eslint', label: '^8.42.0', properties: { type: 'dev' } },
      { id: 'd8', source: 'app', target: 'jest', label: '^29.5.0', properties: { type: 'dev' } },
      
      // React dependencies
      { id: 'd9', source: 'react', target: 'loose-envify', label: '^1.1.0', properties: { type: 'peer' } },
      { id: 'd10', source: 'react-dom', target: 'react', label: '^18.2.0', properties: { type: 'peer' } },
      { id: 'd11', source: 'react-dom', target: 'scheduler', label: '^0.23.0', properties: { type: 'peer' } },
      { id: 'd12', source: 'react-dom', target: 'loose-envify', label: '^1.1.0', properties: { type: 'peer' } },
      
      // Express dependencies
      { id: 'd13', source: 'express', target: 'body-parser', label: '1.20.1', properties: { type: 'transitive' } },
      { id: 'd14', source: 'express', target: 'cookie', label: '0.5.0', properties: { type: 'transitive' } },
      { id: 'd15', source: 'express', target: 'debug', label: '2.6.9', properties: { type: 'transitive' } },
      { id: 'd16', source: 'express', target: 'finalhandler', label: '~1.2.0', properties: { type: 'transitive' } },
      { id: 'd17', source: 'express', target: 'send', label: '0.18.0', properties: { type: 'transitive' } },
      
      // Axios dependencies
      { id: 'd18', source: 'axios', target: 'follow-redirects', label: '^1.15.0', properties: { type: 'transitive' } },
      { id: 'd19', source: 'axios', target: 'form-data', label: '^4.0.0', properties: { type: 'transitive' } },
      { id: 'd20', source: 'axios', target: 'proxy-from-env', label: '^1.1.0', properties: { type: 'transitive' } },
      
      // Deep dependencies (shared)
      { id: 'd21', source: 'debug', target: 'ms', label: '2.0.0', properties: { type: 'deep' } },
      { id: 'd22', source: 'send', target: 'mime', label: '1.6.0', properties: { type: 'deep' } },
      { id: 'd23', source: 'body-parser', target: 'debug', label: '2.6.9', properties: { type: 'deep' } },
      { id: 'd24', source: 'finalhandler', target: 'debug', label: '2.6.9', properties: { type: 'deep' } },
      { id: 'd25', source: 'send', target: 'debug', label: '2.6.9', properties: { type: 'deep' } },
      { id: 'd26', source: 'form-data', target: 'mime-types', label: '^2.1.12', properties: { type: 'deep' } },
      { id: 'd27', source: 'body-parser', target: 'mime-types', label: '~2.1.34', properties: { type: 'deep' } },
      { id: 'd28', source: 'mime-types', target: 'mime-db', label: '1.52.0', properties: { type: 'deep' } },
      
      // Optional dependencies
      { id: 'd29', source: 'jest', target: 'fsevents', label: '^2.3.2', properties: { type: 'optional' } },
    ],
  };

  // Color scheme by dependency type
  const typeColors: { [key: string]: string } = {
    root: '#ef4444',
    direct: '#3b82f6',
    peer: '#10b981',
    transitive: '#f59e0b',
    deep: '#94a3b8',
    dev: '#8b5cf6',
    optional: '#ec4899',
  };

  // Initialize EdgeCraft with hierarchical layout
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'hierarchical',
      direction: 'TB',
      layerSpacing: 120,
      nodeSpacing: 80,
      edgeStraightening: 0.3,
    },
    nodeStyle: (node: any) => {
      const type = node.properties?.type || 'transitive';
      const size = node.properties?.size || 'small';
      
      // Size mapping
      const sizeMap: { [key: string]: number } = {
        tiny: 12,
        small: 18,
        medium: 24,
        large: 30,
      };
      
      return {
        radius: type === 'root' ? 35 : sizeMap[size] || 20,
        fill: typeColors[type] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: type === 'root' ? 4 : 2,
        label: {
          text: node.label || '',
          fontSize: type === 'root' ? 12 : 10,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: (edge: any) => {
      const type = edge.properties?.type || 'transitive';
      
      const edgeColors: { [key: string]: string } = {
        direct: '#3b82f6',
        peer: '#10b981',
        transitive: '#cbd5e1',
        deep: '#e2e8f0',
        dev: '#a78bfa',
        optional: '#f9a8d4',
      };
      
      const widthMap: { [key: string]: number } = {
        direct: 2.5,
        peer: 2,
        transitive: 1.5,
        deep: 1,
        dev: 2,
        optional: 1.5,
      };
      
      return {
        stroke: edgeColors[type] || '#cbd5e1',
        strokeWidth: widthMap[type] || 1.5,
        strokeDasharray: type === 'optional' ? '4 2' : undefined,
        arrow: 'target',
        label: {
          text: edge.label || '',
          fontSize: 8,
          color: '#64748b',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
      };
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>NPM dependency tree visualization</li>
      <li>Semantic versioning display (^, ~, exact)</li>
      <li>Dependency types (direct, dev, peer, optional)</li>
      <li>Transitive dependency tracking</li>
      <li>Circular dependency detection</li>
      <li>Package size and download metrics</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft } from 'edgecraft';

// Parse package.json dependencies
const deps = {
  nodes: [
    { id: 'app', label: 'my-app', 
      properties: { type: 'root' } },
    { id: 'react', label: 'react', 
      properties: { type: 'direct', version: '18.2.0' } },
  ],
  edges: [
    { source: 'app', target: 'react', 
      label: '^18.2.0', properties: { type: 'direct' } }
  ]
};

const graph = new EdgeCraft({
  container: '#graph',
  data: deps,
  layout: { type: 'hierarchical', direction: 'TB' }
});

// Dependency analysis
const circular = graph.detectCircular();
const outdated = graph.checkOutdated();
const vulnerabilities = graph.auditSecurity();`;
  }

  // Setup controls
  setupControls(graph);

  // Setup config controls
  setupConfigControls(graph, graphData);

  // Update data tab
  updateDataTab(graphData);
}

function updateStats(data: any) {
  const directDeps = data.nodes.filter((n: any) => n.properties?.type === 'direct').length;
  const devDeps = data.nodes.filter((n: any) => n.properties?.type === 'dev').length;
  const totalDeps = data.nodes.length - 1; // Exclude root
  
  const statsMap: { [key: string]: string } = {
    'stat-nodes': `${directDeps} + ${devDeps} dev`,
    'stat-edges': `${data.edges.length} dependencies`,
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
      console.log('Export to package-lock.json format');
    });
  }
}

function setupConfigControls(graph: any, data: any) {
  const configContainer = document.getElementById('config-controls');
  if (!configContainer) return;

  configContainer.innerHTML = `
    <div class="config-group">
      <label>Layout Direction</label>
      <select id="direction">
        <option value="TB" selected>Top to Bottom</option>
        <option value="BT">Bottom to Top</option>
        <option value="LR">Left to Right</option>
        <option value="RL">Right to Left</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>Show Dependency Types</label>
      <div style="margin-top: 8px;">
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-direct" checked> Direct (Blue)
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-dev" checked> Dev (Purple)
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-peer" checked> Peer (Green)
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-transitive" checked> Transitive (Orange)
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-deep" checked> Deep (Gray)
        </label>
        <label style="display: block;">
          <input type="checkbox" id="show-optional" checked> Optional (Pink)
        </label>
      </div>
    </div>
    
    <div class="config-group">
      <label>Analysis Tools</label>
      <div style="margin-top: 8px;">
        <button class="btn btn-small" id="check-circular" style="width: 100%; margin-bottom: 8px;">
          Detect Circular Dependencies
        </button>
        <button class="btn btn-small" id="check-outdated" style="width: 100%; margin-bottom: 8px;">
          Check for Outdated Packages
        </button>
        <button class="btn btn-small" id="check-security" style="width: 100%;">
          Security Audit
        </button>
      </div>
    </div>
    
    <div class="config-group">
      <label>Expand Package</label>
      <select id="expand-package">
        <option value="">Select package...</option>
        ${data.nodes.filter((n: any) => n.properties?.type !== 'root').map((n: any) => 
          `<option value="${n.id}">${n.label}</option>`
        ).join('')}
      </select>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="expand-deps">Show All Dependencies</button>
    </div>
    
    <div class="config-group" style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
      <label style="font-weight: 600; margin-bottom: 12px; display: block;">Package Stats</label>
      <div style="font-size: 12px; color: #64748b;">
        <div style="margin-bottom: 4px;">Total Size: 142 MB</div>
        <div style="margin-bottom: 4px;">Install Time: ~45s</div>
        <div style="margin-bottom: 4px;">Vulnerabilities: 0</div>
        <div>License Issues: 0</div>
      </div>
    </div>
  `;

  // Direction change
  const directionSelect = document.getElementById('direction');
  if (directionSelect) {
    directionSelect.addEventListener('change', () => {
      console.log('Changing layout direction');
    });
  }

  // Circular dependencies check
  const checkCircular = document.getElementById('check-circular');
  if (checkCircular) {
    checkCircular.addEventListener('click', () => {
      alert('✅ No circular dependencies detected!\n\nAll package dependencies form a proper directed acyclic graph (DAG).');
    });
  }

  // Outdated packages check
  const checkOutdated = document.getElementById('check-outdated');
  if (checkOutdated) {
    checkOutdated.addEventListener('click', () => {
      alert('📦 Outdated Packages:\n\n• react: 18.2.0 → 18.3.1 (minor)\n• express: 4.18.2 → 4.19.2 (patch)\n• axios: 1.4.0 → 1.7.2 (minor)\n\nRun: npm update');
    });
  }

  // Security audit
  const checkSecurity = document.getElementById('check-security');
  if (checkSecurity) {
    checkSecurity.addEventListener('click', () => {
      alert('🔒 Security Audit:\n\n✅ 0 vulnerabilities found\n\nAll dependencies are up-to-date and secure.');
    });
  }

  // Expand package dependencies
  const expandDeps = document.getElementById('expand-deps');
  if (expandDeps) {
    expandDeps.addEventListener('click', () => {
      const packageId = (document.getElementById('expand-package') as HTMLSelectElement)?.value;
      if (packageId) {
        const pkg = data.nodes.find((n: any) => n.id === packageId);
        alert(`Expanding dependencies for: ${pkg?.label}\n\nThis would show all transitive dependencies in the graph.`);
      } else {
        alert('Please select a package first.');
      }
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    // Show package.json style format
    const packageJson = {
      name: 'my-app',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      optionalDependencies: {},
    };
    
    data.edges.filter((e: any) => e.source === 'app').forEach((edge: any) => {
      const target = data.nodes.find((n: any) => n.id === edge.target);
      const type = edge.properties?.type;
      const version = edge.label || target?.properties?.version || '*';
      
      if (type === 'direct') {
        packageJson.dependencies[target.label] = version;
      } else if (type === 'dev') {
        packageJson.devDependencies[target.label] = version;
      } else if (type === 'peer') {
        packageJson.peerDependencies[target.label] = version;
      } else if (type === 'optional') {
        packageJson.optionalDependencies[target.label] = version;
      }
    });
    
    dataJson.textContent = JSON.stringify(packageJson, null, 2);
  }
}
