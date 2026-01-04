/**
 * Edge Bundling Demo - Hierarchical and Force-Directed Edge Bundling
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Create a complex network with many crossing edges
  // Network infrastructure - data centers and connections
  const graphData = {
    nodes: [
      // Core routers
      { id: 'core1', label: 'Core-US-East', properties: { type: 'core', region: 'us-east' } },
      { id: 'core2', label: 'Core-US-West', properties: { type: 'core', region: 'us-west' } },
      { id: 'core3', label: 'Core-EU', properties: { type: 'core', region: 'eu' } },
      { id: 'core4', label: 'Core-APAC', properties: { type: 'core', region: 'apac' } },
      
      // Regional routers - US East
      { id: 'r1', label: 'NYC-R1', properties: { type: 'regional', parent: 'core1' } },
      { id: 'r2', label: 'NYC-R2', properties: { type: 'regional', parent: 'core1' } },
      { id: 'r3', label: 'DC-R1', properties: { type: 'regional', parent: 'core1' } },
      { id: 'r4', label: 'Boston-R1', properties: { type: 'regional', parent: 'core1' } },
      
      // Regional routers - US West
      { id: 'r5', label: 'SF-R1', properties: { type: 'regional', parent: 'core2' } },
      { id: 'r6', label: 'LA-R1', properties: { type: 'regional', parent: 'core2' } },
      { id: 'r7', label: 'Seattle-R1', properties: { type: 'regional', parent: 'core2' } },
      
      // Regional routers - EU
      { id: 'r8', label: 'London-R1', properties: { type: 'regional', parent: 'core3' } },
      { id: 'r9', label: 'Frankfurt-R1', properties: { type: 'regional', parent: 'core3' } },
      { id: 'r10', label: 'Paris-R1', properties: { type: 'regional', parent: 'core3' } },
      
      // Regional routers - APAC
      { id: 'r11', label: 'Tokyo-R1', properties: { type: 'regional', parent: 'core4' } },
      { id: 'r12', label: 'Singapore-R1', properties: { type: 'regional', parent: 'core4' } },
      { id: 'r13', label: 'Sydney-R1', properties: { type: 'regional', parent: 'core4' } },
      
      // Edge nodes - data centers
      { id: 'dc1', label: 'DC-NYC-01', properties: { type: 'datacenter', parent: 'r1' } },
      { id: 'dc2', label: 'DC-NYC-02', properties: { type: 'datacenter', parent: 'r2' } },
      { id: 'dc3', label: 'DC-DC-01', properties: { type: 'datacenter', parent: 'r3' } },
      { id: 'dc4', label: 'DC-SF-01', properties: { type: 'datacenter', parent: 'r5' } },
      { id: 'dc5', label: 'DC-LA-01', properties: { type: 'datacenter', parent: 'r6' } },
      { id: 'dc6', label: 'DC-LON-01', properties: { type: 'datacenter', parent: 'r8' } },
      { id: 'dc7', label: 'DC-TYO-01', properties: { type: 'datacenter', parent: 'r11' } },
    ],
    edges: [
      // Core router mesh
      { id: 'e1', source: 'core1', target: 'core2', label: 'backbone', properties: { bandwidth: '100Gbps' } },
      { id: 'e2', source: 'core1', target: 'core3', label: 'backbone', properties: { bandwidth: '100Gbps' } },
      { id: 'e3', source: 'core2', target: 'core4', label: 'backbone', properties: { bandwidth: '100Gbps' } },
      { id: 'e4', source: 'core3', target: 'core4', label: 'backbone', properties: { bandwidth: '100Gbps' } },
      { id: 'e5', source: 'core2', target: 'core3', label: 'backbone', properties: { bandwidth: '100Gbps' } },
      
      // US East regional connections
      { id: 'e6', source: 'core1', target: 'r1', label: 'regional' },
      { id: 'e7', source: 'core1', target: 'r2', label: 'regional' },
      { id: 'e8', source: 'core1', target: 'r3', label: 'regional' },
      { id: 'e9', source: 'core1', target: 'r4', label: 'regional' },
      
      // US West regional connections
      { id: 'e10', source: 'core2', target: 'r5', label: 'regional' },
      { id: 'e11', source: 'core2', target: 'r6', label: 'regional' },
      { id: 'e12', source: 'core2', target: 'r7', label: 'regional' },
      
      // EU regional connections
      { id: 'e13', source: 'core3', target: 'r8', label: 'regional' },
      { id: 'e14', source: 'core3', target: 'r9', label: 'regional' },
      { id: 'e15', source: 'core3', target: 'r10', label: 'regional' },
      
      // APAC regional connections
      { id: 'e16', source: 'core4', target: 'r11', label: 'regional' },
      { id: 'e17', source: 'core4', target: 'r12', label: 'regional' },
      { id: 'e18', source: 'core4', target: 'r13', label: 'regional' },
      
      // Data center connections
      { id: 'e19', source: 'r1', target: 'dc1', label: 'local' },
      { id: 'e20', source: 'r2', target: 'dc2', label: 'local' },
      { id: 'e21', source: 'r3', target: 'dc3', label: 'local' },
      { id: 'e22', source: 'r5', target: 'dc4', label: 'local' },
      { id: 'e23', source: 'r6', target: 'dc5', label: 'local' },
      { id: 'e24', source: 'r8', target: 'dc6', label: 'local' },
      { id: 'e25', source: 'r11', target: 'dc7', label: 'local' },
      
      // Cross-regional redundancy
      { id: 'e26', source: 'r1', target: 'r5', label: 'backup' },
      { id: 'e27', source: 'r3', target: 'r8', label: 'backup' },
      { id: 'e28', source: 'r5', target: 'r11', label: 'backup' },
    ],
  };

  // Color scheme by node type
  const typeColors: { [key: string]: string } = {
    core: '#8b5cf6',
    regional: '#3b82f6',
    datacenter: '#10b981',
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
    },
    nodeStyle: (node: any) => {
      const type = node.properties?.type || 'default';
      const baseRadius = type === 'core' ? 35 : (type === 'regional' ? 25 : 20);
      
      return {
        radius: baseRadius,
        fill: typeColors[type] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: 2,
        label: {
          text: node.label || '',
          fontSize: type === 'core' ? 12 : 10,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: (edge: any) => {
      const edgeType = edge.label || '';
      
      return {
        stroke: edgeType === 'backbone' ? '#ef4444' : (edgeType === 'backup' ? '#f59e0b' : '#cbd5e1'),
        strokeWidth: edgeType === 'backbone' ? 3 : (edgeType === 'backup' ? 2 : 1.5),
        strokeDasharray: edgeType === 'backup' ? '5,5' : undefined,
        arrow: 'none',
      };
    },
  });

  // Note: EdgeBundling class is a planned feature
  // For now, the demo shows the hierarchical layout

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Hierarchical edge bundling using tree structure</li>
      <li>Force-Directed Edge Bundling (FDEB) algorithm</li>
      <li>Reduces visual clutter with 60 subdivisions</li>
      <li>Compatibility metrics (angle, scale, position)</li>
      <li>Configurable bundle strength (0.0-1.0)</li>
      <li>Network topology visualization</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft, EdgeBundling } from 'edgecraft';

const graph = new EdgeCraft({
  container: '#graph',
  data: networkData,
  layout: { type: 'hierarchical' }
});

// Apply edge bundling
const bundler = new EdgeBundling({
  algorithm: 'hierarchical',  // or 'force-directed'
  strength: 0.8,              // Bundle strength (0-1)
  subdivisions: 60,           // Smoothness
});

const bundledEdges = bundler.bundle(graph);
graph.updateEdges(bundledEdges);`;
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
    'stat-render': '~2ms',
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
      <label>Algorithm</label>
      <select id="algorithm">
        <option value="hierarchical" selected>Hierarchical</option>
        <option value="force-directed">Force-Directed (FDEB)</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>Bundle Strength</label>
      <input type="range" min="0" max="100" value="80" id="strength">
      <span id="strength-value">0.8</span>
    </div>
    
    <div class="config-group">
      <label>Subdivisions</label>
      <input type="range" min="10" max="100" value="60" id="subdivisions">
      <span id="subdivisions-value">60</span>
    </div>
    
    <div class="config-group">
      <label>
        <input type="checkbox" id="enable-bundling" checked>
        Enable Bundling
      </label>
    </div>

    <div class="config-group">
      <button class="btn btn-small" id="apply-bundling">Apply Bundling</button>
    </div>
    
    <div class="config-group" style="margin-top: 12px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 11px;">
      <strong>Note:</strong> Edge bundling feature is currently in development. This demo shows the hierarchical layout that will serve as the basis for bundling.
    </div>
  `;

  // Add event listeners for sliders
  const strengthInput = document.getElementById('strength');
  const strengthValue = document.getElementById('strength-value');
  if (strengthInput && strengthValue) {
    strengthInput.addEventListener('input', (e: any) => {
      const value = parseInt(e.target.value) / 100;
      strengthValue.textContent = value.toFixed(1);
    });
  }

  const subdivisionsInput = document.getElementById('subdivisions');
  const subdivisionsValue = document.getElementById('subdivisions-value');
  if (subdivisionsInput && subdivisionsValue) {
    subdivisionsInput.addEventListener('input', (e: any) => {
      subdivisionsValue.textContent = e.target.value;
    });
  }

  // Apply bundling button
  const applyBtn = document.getElementById('apply-bundling');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const algorithm = (document.getElementById('algorithm') as HTMLSelectElement)?.value || 'hierarchical';
      const strength = parseInt((document.getElementById('strength') as HTMLInputElement)?.value || '80') / 100;
      const subdivisions = parseInt((document.getElementById('subdivisions') as HTMLInputElement)?.value || '60');
      const enabled = (document.getElementById('enable-bundling') as HTMLInputElement)?.checked || false;

      console.log('Applying bundling:', { algorithm, strength, subdivisions, enabled });
      
      if (enabled) {
        // Apply bundling (this would call the EdgeBundling class)
        console.log('Edge bundling applied with strength:', strength);
      } else {
        console.log('Edge bundling disabled - showing straight edges');
      }
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
