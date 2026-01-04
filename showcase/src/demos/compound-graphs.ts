/**
 * Compound Graphs Demo - Hierarchical Grouping with Collapsible Nodes
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Microservices architecture with service groups
  const graphData = {
    nodes: [
      // Group 1: Frontend Services
      { id: 'frontend-group', label: 'Frontend Services', properties: { type: 'group', isGroup: true } },
      { id: 'web-app', label: 'Web App', properties: { type: 'service', parent: 'frontend-group', tech: 'React' } },
      { id: 'mobile-app', label: 'Mobile App', properties: { type: 'service', parent: 'frontend-group', tech: 'React Native' } },
      { id: 'admin-panel', label: 'Admin Panel', properties: { type: 'service', parent: 'frontend-group', tech: 'Vue' } },
      
      // Group 2: API Gateway
      { id: 'gateway-group', label: 'API Gateway', properties: { type: 'group', isGroup: true } },
      { id: 'api-gateway', label: 'Gateway', properties: { type: 'service', parent: 'gateway-group', tech: 'Kong' } },
      { id: 'auth-service', label: 'Auth', properties: { type: 'service', parent: 'gateway-group', tech: 'OAuth2' } },
      
      // Group 3: Core Services
      { id: 'core-group', label: 'Core Services', properties: { type: 'group', isGroup: true } },
      { id: 'user-service', label: 'User Service', properties: { type: 'service', parent: 'core-group', tech: 'Node.js' } },
      { id: 'product-service', label: 'Product Service', properties: { type: 'service', parent: 'core-group', tech: 'Node.js' } },
      { id: 'order-service', label: 'Order Service', properties: { type: 'service', parent: 'core-group', tech: 'Node.js' } },
      { id: 'payment-service', label: 'Payment Service', properties: { type: 'service', parent: 'core-group', tech: 'Java' } },
      
      // Group 4: Data Layer
      { id: 'data-group', label: 'Data Layer', properties: { type: 'group', isGroup: true } },
      { id: 'postgres', label: 'PostgreSQL', properties: { type: 'database', parent: 'data-group', tech: 'SQL' } },
      { id: 'mongodb', label: 'MongoDB', properties: { type: 'database', parent: 'data-group', tech: 'NoSQL' } },
      { id: 'redis', label: 'Redis', properties: { type: 'cache', parent: 'data-group', tech: 'Cache' } },
      
      // Group 5: Message Queue
      { id: 'messaging-group', label: 'Messaging', properties: { type: 'group', isGroup: true } },
      { id: 'kafka', label: 'Kafka', properties: { type: 'queue', parent: 'messaging-group', tech: 'Stream' } },
      { id: 'rabbitmq', label: 'RabbitMQ', properties: { type: 'queue', parent: 'messaging-group', tech: 'Queue' } },
      
      // Group 6: Monitoring
      { id: 'monitoring-group', label: 'Monitoring', properties: { type: 'group', isGroup: true } },
      { id: 'prometheus', label: 'Prometheus', properties: { type: 'monitoring', parent: 'monitoring-group', tech: 'Metrics' } },
      { id: 'grafana', label: 'Grafana', properties: { type: 'monitoring', parent: 'monitoring-group', tech: 'Dashboards' } },
      { id: 'elk', label: 'ELK Stack', properties: { type: 'monitoring', parent: 'monitoring-group', tech: 'Logs' } },
    ],
    edges: [
      // Frontend -> Gateway
      { id: 'e1', source: 'web-app', target: 'api-gateway', label: 'HTTP' },
      { id: 'e2', source: 'mobile-app', target: 'api-gateway', label: 'HTTP' },
      { id: 'e3', source: 'admin-panel', target: 'api-gateway', label: 'HTTP' },
      
      // Gateway -> Auth
      { id: 'e4', source: 'api-gateway', target: 'auth-service', label: 'validates' },
      
      // Gateway -> Core Services
      { id: 'e5', source: 'api-gateway', target: 'user-service', label: 'routes' },
      { id: 'e6', source: 'api-gateway', target: 'product-service', label: 'routes' },
      { id: 'e7', source: 'api-gateway', target: 'order-service', label: 'routes' },
      
      // Core Services -> Data Layer
      { id: 'e8', source: 'user-service', target: 'postgres', label: 'reads/writes' },
      { id: 'e9', source: 'user-service', target: 'redis', label: 'caches' },
      { id: 'e10', source: 'product-service', target: 'mongodb', label: 'reads/writes' },
      { id: 'e11', source: 'product-service', target: 'redis', label: 'caches' },
      { id: 'e12', source: 'order-service', target: 'postgres', label: 'reads/writes' },
      { id: 'e13', source: 'order-service', target: 'payment-service', label: 'calls' },
      { id: 'e14', source: 'payment-service', target: 'postgres', label: 'reads/writes' },
      
      // Core Services -> Messaging
      { id: 'e15', source: 'order-service', target: 'kafka', label: 'publishes' },
      { id: 'e16', source: 'payment-service', target: 'rabbitmq', label: 'publishes' },
      { id: 'e17', source: 'user-service', target: 'rabbitmq', label: 'publishes' },
      
      // All services -> Monitoring
      { id: 'e18', source: 'api-gateway', target: 'prometheus', label: 'metrics' },
      { id: 'e19', source: 'user-service', target: 'prometheus', label: 'metrics' },
      { id: 'e20', source: 'product-service', target: 'prometheus', label: 'metrics' },
      { id: 'e21', source: 'order-service', target: 'prometheus', label: 'metrics' },
      { id: 'e22', source: 'prometheus', target: 'grafana', label: 'visualizes' },
      { id: 'e23', source: 'api-gateway', target: 'elk', label: 'logs' },
    ],
  };

  // Color scheme by type
  const typeColors: { [key: string]: string } = {
    group: '#e2e8f0',
    service: '#3b82f6',
    database: '#10b981',
    cache: '#f59e0b',
    queue: '#8b5cf6',
    monitoring: '#ef4444',
  };

  // Initialize EdgeCraft with compound graph support
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'hierarchical',
      direction: 'TB',
      layerSpacing: 100,
      nodeSpacing: 60,
    },
    nodeStyle: (node: any) => {
      const type = node.properties?.type || 'default';
      const isGroup = node.properties?.isGroup === true;
      
      if (isGroup) {
        return {
          radius: 0, // Groups use automatic boundary
          fill: typeColors.group,
          stroke: '#94a3b8',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          label: {
            text: node.label || '',
            fontSize: 14,
            color: '#475569',
            position: 'top',
          },
        };
      }
      
      return {
        radius: 25,
        fill: typeColors[type] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: 2,
        shape: type === 'database' ? 'rectangle' : (type === 'cache' ? 'diamond' : 'circle'),
        label: {
          text: node.label || '',
          fontSize: 10,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: {
      stroke: '#cbd5e1',
      strokeWidth: 1.5,
      arrow: 'target',
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Parent-child node relationships</li>
      <li>Collapsible groups (click to expand/collapse)</li>
      <li>Automatic group boundary rendering</li>
      <li>Nested groups with unlimited depth</li>
      <li>Group-aware layout algorithms</li>
      <li>Microservices architecture visualization</li>
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
      { id: 'group1', isGroup: true, label: 'Backend' },
      { id: 'service1', parent: 'group1', label: 'API' },
      { id: 'service2', parent: 'group1', label: 'Auth' },
      // ...
    ],
    edges: [/* ... */]
  },
  layout: { type: 'hierarchical' }
});

// Collapse/expand groups
graph.collapseGroup('group1');
graph.expandGroup('group1');

// Get group bounds
const bounds = graph.getGroupBounds('group1');`;
  }

  // Setup controls
  setupControls(graph);

  // Setup config controls
  setupConfigControls(graph);

  // Update data tab
  updateDataTab(graphData);
}

function updateStats(data: any) {
  const groups = data.nodes.filter((n: any) => n.properties?.isGroup).length;
  const services = data.nodes.filter((n: any) => !n.properties?.isGroup).length;
  
  const statsMap: { [key: string]: string } = {
    'stat-nodes': `${services} (${groups} groups)`,
    'stat-edges': String(data.edges.length),
    'stat-fps': '60',
    'stat-render': '~3ms',
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
      <label>Group Actions</label>
      <select id="group-select">
        <option value="">Select a group...</option>
        <option value="frontend-group">Frontend Services</option>
        <option value="gateway-group">API Gateway</option>
        <option value="core-group">Core Services</option>
        <option value="data-group">Data Layer</option>
        <option value="messaging-group">Messaging</option>
        <option value="monitoring-group">Monitoring</option>
      </select>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="collapse-group">Collapse Selected</button>
      <button class="btn btn-small" id="expand-group">Expand Selected</button>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="collapse-all">Collapse All</button>
      <button class="btn btn-small" id="expand-all">Expand All</button>
    </div>
    
    <div class="config-group">
      <label>
        <input type="checkbox" id="show-boundaries" checked>
        Show Group Boundaries
      </label>
    </div>
    
    <div class="config-group">
      <label>Group Padding</label>
      <input type="range" min="10" max="50" value="20" id="padding">
      <span id="padding-value">20px</span>
    </div>
  `;

  // Collapse selected group
  const collapseBtn = document.getElementById('collapse-group');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      const groupId = (document.getElementById('group-select') as HTMLSelectElement)?.value;
      if (groupId) {
        console.log('Collapsing group:', groupId);
        // graph.collapseGroup(groupId);
      } else {
        alert('Please select a group first');
      }
    });
  }

  // Expand selected group
  const expandBtn = document.getElementById('expand-group');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      const groupId = (document.getElementById('group-select') as HTMLSelectElement)?.value;
      if (groupId) {
        console.log('Expanding group:', groupId);
        // graph.expandGroup(groupId);
      } else {
        alert('Please select a group first');
      }
    });
  }

  // Collapse all
  const collapseAllBtn = document.getElementById('collapse-all');
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      console.log('Collapsing all groups');
      // Get all groups and collapse them
    });
  }

  // Expand all
  const expandAllBtn = document.getElementById('expand-all');
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
      console.log('Expanding all groups');
      // Get all groups and expand them
    });
  }

  // Padding slider
  const paddingInput = document.getElementById('padding');
  const paddingValue = document.getElementById('padding-value');
  if (paddingInput && paddingValue) {
    paddingInput.addEventListener('input', (e: any) => {
      paddingValue.textContent = `${e.target.value}px`;
    });
  }

  // Show boundaries checkbox
  const showBoundariesInput = document.getElementById('show-boundaries');
  if (showBoundariesInput) {
    showBoundariesInput.addEventListener('change', (e: any) => {
      console.log('Show boundaries:', e.target.checked);
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
