import { EdgeCraft } from 'edgecraft';
import { socialNetworkData, rdfData, orgChartData, dependencyData, knowledgeGraphData } from './data.js';

// Global graph instance
let graph = null;
let nodeCounter = 1;

// Initialize the application
function init() {
  // Setup UI event listeners first
  setupLayoutControls();
  setupViewControls();
  setupActionButtons();
  setupExampleButtons();
  
  // Create initial graph with social network data
  // (this will also setup graph events)
  createGraph(socialNetworkData);
}

// Create graph instance
function createGraph(data) {
  // Destroy existing graph if any
  if (graph) {
    graph.destroy();
  }
  
  // Assign IDs if needed
  nodeCounter = Math.max(...data.nodes.map(n => typeof n.id === 'number' ? n.id : 0)) + 1;
  
  // Create new graph
  graph = new EdgeCraft({
    container: '#graph-container',
    data: data,
    layout: { type: 'force', iterations: 300 },
    nodeStyle: getNodeStyle,
    edgeStyle: getEdgeStyle,
    interaction: {
      draggable: true,
      zoomable: true,
      selectable: true,
      hoverable: true,
      multiSelect: true
    }
  });
  
  // Setup graph event listeners
  setupGraphEvents();
  
  updateInfo();
}

// Dynamic node styling
function getNodeStyle(node) {
  // Different colors for different node types
  const typeColors = {
    'Person': '#667eea',
    'Company': '#e74c3c',
    'Project': '#2ecc71',
    'Department': '#f39c12',
    'Package': '#9b59b6',
    'Module': '#3498db'
  };
  
  const label = node.labels?.[0] || 'Default';
  const fill = typeColors[label] || '#95a5a6';
  
  // Size based on connections (safely check if graph exists)
  let degree = 0;
  if (graph) {
    try {
      degree = graph.getConnectedEdges(node.id).length;
    } catch (e) {
      degree = 0;
    }
  }
  const radius = 20 + Math.min(degree * 3, 20);
  
  return {
    fill,
    radius,
    stroke: '#2c3e50',
    strokeWidth: 2,
    shape: label === 'Company' || label === 'Package' ? 'rectangle' : 'circle',
    label: {
      text: node.properties?.name || node.value || String(node.id),
      fontSize: 12,
      color: '#333',
      position: 'bottom'
    }
  };
}

// Edge styling
function getEdgeStyle(edge) {
  const relationColors = {
    'KNOWS': '#667eea',
    'WORKS_AT': '#e74c3c',
    'MANAGES': '#f39c12',
    'REPORTS_TO': '#3498db',
    'DEPENDS_ON': '#9b59b6',
    'CONTRIBUTES_TO': '#2ecc71'
  };
  
  const label = edge.label || edge.predicate || '';
  const stroke = relationColors[label] || '#95a5a6';
  
  return {
    stroke,
    strokeWidth: 2,
    arrow: 'forward',
    label: {
      text: label,
      fontSize: 10,
      color: '#666',
      backgroundColor: 'rgba(255,255,255,0.9)'
    }
  };
}

// Layout controls
function setupLayoutControls() {
  const layoutButtons = {
    'layout-force': 'force',
    'layout-hierarchical': 'hierarchical',
    'layout-circular': 'circular',
    'layout-grid': 'grid'
  };
  
  Object.entries(layoutButtons).forEach(([buttonId, layoutType]) => {
    document.getElementById(buttonId).addEventListener('click', () => {
      // Update active button
      document.querySelectorAll('[id^="layout-"]').forEach(btn => btn.classList.remove('active'));
      document.getElementById(buttonId).classList.add('active');
      
      // Apply layout
      graph.setLayout({ type: layoutType, iterations: 300, nodeSpacing: 100 });
    });
  });
}

// View controls
function setupViewControls() {
  document.getElementById('fit-view').addEventListener('click', () => {
    graph.fitView();
  });
  
  document.getElementById('center-view').addEventListener('click', () => {
    graph.centerView();
  });
  
  document.getElementById('zoom-in').addEventListener('click', () => {
    graph.zoomIn();
  });
  
  document.getElementById('zoom-out').addEventListener('click', () => {
    graph.zoomOut();
  });
  
  document.getElementById('reset-zoom').addEventListener('click', () => {
    graph.resetZoom();
  });
}

// Action buttons
function setupActionButtons() {
  document.getElementById('add-node').addEventListener('click', addRandomNode);
  document.getElementById('add-edge').addEventListener('click', addRandomEdge);
  document.getElementById('clear-selection').addEventListener('click', () => {
    graph.clearSelection();
    updateInfo();
  });
  document.getElementById('export-json').addEventListener('click', exportJSON);
}

// Example buttons
function setupExampleButtons() {
  document.getElementById('load-social').addEventListener('click', () => {
    createGraph(socialNetworkData);
  });
  
  document.getElementById('load-rdf').addEventListener('click', () => {
    createGraph(rdfData);
  });
  
  document.getElementById('load-org').addEventListener('click', () => {
    createGraph(orgChartData);
  });
  
  document.getElementById('load-dependencies').addEventListener('click', () => {
    createGraph(dependencyData);
  });
  
  document.getElementById('load-knowledge').addEventListener('click', () => {
    createGraphWithComplexStyling(knowledgeGraphData);
  });
}

// Graph events
function setupGraphEvents() {
  // Node click - show details
  graph.on('node-click', (event) => {
    showNodeDetails(event.target);
    updateInfo();
  });
  
  // Node hover - could add tooltips here
  graph.on('node-mouseenter', (event) => {
    console.log('Hovering:', event.target.properties?.name || event.target.id);
  });
  
  // Background click - hide details
  graph.on('background-click', () => {
    hideNodeDetails();
    updateInfo();
  });
}

// Show node details panel
function showNodeDetails(node) {
  const panel = document.getElementById('node-details');
  const content = document.getElementById('details-content');
  
  let html = `<p><strong>ID:</strong> ${node.id}</p>`;
  
  if (node.labels) {
    html += `<p><strong>Labels:</strong> ${node.labels.join(', ')}</p>`;
  }
  
  if (node.type) {
    html += `<p><strong>Type:</strong> ${node.type}</p>`;
  }
  
  if (node.value) {
    html += `<p><strong>Value:</strong> ${node.value}</p>`;
  }
  
  if (node.properties) {
    html += `<p><strong>Properties:</strong></p>`;
    Object.entries(node.properties).forEach(([key, value]) => {
      html += `<p style="margin-left: 15px;">• ${key}: ${value}</p>`;
    });
  }
  
  const degree = graph.getConnectedEdges(node.id).length;
  html += `<p><strong>Connections:</strong> ${degree}</p>`;
  
  content.innerHTML = html;
  panel.classList.remove('hidden');
  
  document.getElementById('close-details').onclick = hideNodeDetails;
}

// Hide node details panel
function hideNodeDetails() {
  document.getElementById('node-details').classList.add('hidden');
}

// Add random node
function addRandomNode() {
  const types = ['Person', 'Company', 'Project', 'Department'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const newNode = {
    id: nodeCounter++,
    labels: [type],
    properties: { name: `${type} ${nodeCounter - 1}` }
  };
  
  graph.addNode(newNode);
  
  // Connect to a random existing node
  const nodes = graph.getAllNodes();
  if (nodes.length > 1) {
    const randomNode = nodes[Math.floor(Math.random() * (nodes.length - 1))];
    
    graph.addEdge({
      id: `e${Date.now()}`,
      source: randomNode.id,
      target: newNode.id,
      label: 'CONNECTED_TO',
      properties: {}
    });
  }
  
  updateInfo();
}

// Add random edge
function addRandomEdge() {
  const nodes = graph.getAllNodes();
  if (nodes.length < 2) {
    alert('Need at least 2 nodes to create an edge!');
    return;
  }
  
  const node1 = nodes[Math.floor(Math.random() * nodes.length)];
  let node2 = nodes[Math.floor(Math.random() * nodes.length)];
  
  // Make sure we don't connect a node to itself
  while (node2.id === node1.id && nodes.length > 1) {
    node2 = nodes[Math.floor(Math.random() * nodes.length)];
  }
  
  const labels = ['KNOWS', 'CONNECTED_TO', 'RELATED_TO', 'LINKS_TO'];
  const label = labels[Math.floor(Math.random() * labels.length)];
  
  graph.addEdge({
    id: `e${Date.now()}`,
    source: node1.id,
    target: node2.id,
    label,
    properties: {}
  });
  
  updateInfo();
}

// Export graph as JSON
function exportJSON() {
  const json = graph.toJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'graph-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Update info panel
function updateInfo() {
  document.getElementById('node-count').textContent = graph.getAllNodes().length;
  document.getElementById('edge-count').textContent = graph.getAllEdges().length;
  document.getElementById('selected-count').textContent = graph.getSelectedNodes().length;
}

// Initialize on load
init();

// Create graph with complex multi-line styling
function createGraphWithComplexStyling(data) {
  // Destroy existing graph if any
  if (graph) {
    graph.destroy();
  }
  
  nodeCounter = Math.max(...data.nodes.map(n => typeof n.id === 'number' ? n.id : 0)) + 1;
  
  // Create new graph with custom complex styling
  graph = new EdgeCraft({
    container: '#graph-container',
    data: data,
    layout: { type: 'force', iterations: 400, nodeSpacing: 150 },
    nodeStyle: getComplexNodeStyle,
    edgeStyle: getComplexEdgeStyle,
    interaction: {
      draggable: true,
      zoomable: true,
      selectable: true,
      hoverable: true,
      multiSelect: true
    }
  });
  
  // Custom rendering for multi-line labels and icons
  customizeComplexNodes();
  
  // Setup graph event listeners
  setupGraphEvents();
  
  updateInfo();
}

// Complex node styling with icons and multi-line text
function getComplexNodeStyle(node) {
  const label = node.labels?.[0];
  
  // Color scheme based on node type
  const typeStyles = {
    'Person': { fill: '#667eea', shape: 'circle', radius: 40 },
    'Organization': { fill: '#f39c12', shape: 'rectangle', radius: 45 },
    'Project': { fill: '#2ecc71', shape: 'rectangle', radius: 40 },
    'Publication': { fill: '#e74c3c', shape: 'rectangle', radius: 35 },
    'Skill': { fill: '#9b59b6', shape: 'diamond', radius: 30 },
    'Collaboration': { fill: '#3498db', shape: 'hexagon', radius: 35 },
    'Authorship': { fill: '#1abc9c', shape: 'hexagon', radius: 35 },
    'Employment': { fill: '#e67e22', shape: 'hexagon', radius: 35 }
  };
  
  const style = typeStyles[label] || { fill: '#95a5a6', shape: 'circle', radius: 30 };
  
  return {
    ...style,
    stroke: '#2c3e50',
    strokeWidth: 3,
    label: {
      text: '', // We'll add custom multi-line labels manually
      fontSize: 0,
      color: '#333',
      position: 'bottom'
    }
  };
}

// Complex edge styling
function getComplexEdgeStyle(edge) {
  const relationColors = {
    'PARTICIPATES_IN': '#3498db',
    'ON_PROJECT': '#3498db',
    'AUTHORED': '#e74c3c',
    'PAPER': '#e74c3c',
    'HAS_EMPLOYMENT': '#e67e22',
    'AT_ORGANIZATION': '#e67e22',
    'ADVISED_BY': '#9b59b6',
    'WORKS_AT': '#f39c12',
    'FUNDED_BY': '#2ecc71',
    'HAS_SKILL': '#1abc9c'
  };
  
  const label = edge.label || '';
  const stroke = relationColors[label] || '#95a5a6';
  
  // Association edges are dashed
  const isDashed = ['PARTICIPATES_IN', 'ON_PROJECT', 'AUTHORED', 'PAPER', 'HAS_EMPLOYMENT', 'AT_ORGANIZATION'].includes(label);
  
  return {
    stroke,
    strokeWidth: isDashed ? 3 : 2,
    strokeDasharray: isDashed ? '8,4' : undefined,
    arrow: 'forward',
    label: {
      text: label.replace(/_/g, ' '),
      fontSize: 9,
      color: '#666',
      backgroundColor: 'rgba(255,255,255,0.95)'
    }
  };
}

// Add custom multi-line labels and icons to nodes
function customizeComplexNodes() {
  const nodes = graph.getAllNodes();
  
  nodes.forEach(node => {
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
    if (!nodeElement) return;
    
    const label = node.labels?.[0];
    const props = node.properties || {};
    
    // Remove default label if exists
    const existingLabels = nodeElement.querySelectorAll('text');
    existingLabels.forEach(l => l.remove());
    
    // Add icon (emoji)
    if (props.icon) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('dominant-baseline', 'middle');
      icon.setAttribute('font-size', '24');
      icon.setAttribute('y', '0');
      icon.textContent = props.icon;
      nodeElement.appendChild(icon);
    }
    
    // Create multi-line label below node
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('transform', 'translate(0, 50)');
    
    // Main name/title (bold)
    const mainText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    mainText.setAttribute('text-anchor', 'middle');
    mainText.setAttribute('font-size', '12');
    mainText.setAttribute('font-weight', 'bold');
    mainText.setAttribute('fill', '#2c3e50');
    mainText.setAttribute('y', '0');
    
    // Truncate long text
    const mainName = props.name || props.title || String(node.id);
    mainText.textContent = mainName.length > 20 ? mainName.substring(0, 18) + '...' : mainName;
    labelGroup.appendChild(mainText);
    
    // Add secondary info line
    let secondaryInfo = '';
    if (label === 'Person' && props.title) {
      secondaryInfo = props.title;
    } else if (label === 'Organization' && props.type) {
      secondaryInfo = props.type;
    } else if (label === 'Project' && props.status) {
      secondaryInfo = `Status: ${props.status}`;
    } else if (label === 'Publication' && props.year) {
      secondaryInfo = `${props.year} • ${props.citations} citations`;
    } else if (label === 'Skill' && props.level) {
      secondaryInfo = props.level;
    } else if (['Collaboration', 'Authorship', 'Employment'].includes(label) && props.role) {
      secondaryInfo = props.role;
    }
    
    if (secondaryInfo) {
      const secondaryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      secondaryText.setAttribute('text-anchor', 'middle');
      secondaryText.setAttribute('font-size', '10');
      secondaryText.setAttribute('fill', '#7f8c8d');
      secondaryText.setAttribute('y', '14');
      secondaryText.textContent = secondaryInfo.length > 25 ? secondaryInfo.substring(0, 23) + '...' : secondaryInfo;
      labelGroup.appendChild(secondaryText);
    }
    
    // Add tertiary info line for associations
    if (['Collaboration', 'Authorship', 'Employment'].includes(label)) {
      let tertiaryInfo = '';
      if (props.startDate) tertiaryInfo = `Since: ${props.startDate}`;
      else if (props.contribution) tertiaryInfo = `Contribution: ${props.contribution}`;
      else if (props.orderPosition) tertiaryInfo = `Position: ${props.orderPosition}`;
      
      if (tertiaryInfo) {
        const tertiaryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tertiaryText.setAttribute('text-anchor', 'middle');
        tertiaryText.setAttribute('font-size', '9');
        tertiaryText.setAttribute('fill', '#95a5a6');
        tertiaryText.setAttribute('y', '26');
        tertiaryText.textContent = tertiaryInfo;
        labelGroup.appendChild(tertiaryText);
      }
    }
    
    nodeElement.appendChild(labelGroup);
  });
}
