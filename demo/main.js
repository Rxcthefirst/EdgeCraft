import { EdgeCraft } from 'edgecraft';
import { socialNetworkData, rdfData, orgChartData, dependencyData, knowledgeGraphData, largeGraphData, advancedEdgesData, inverseRelationshipData } from './data.js';

// Global graph instance
let graph = null;
let nodeCounter = 1;
let currentRenderer = 'auto'; // 'auto', 'canvas', 'webgl'
let nodeDisplayMode = 'simple'; // 'simple', 'detailed' - toggle for advanced node styling
let edgeLabelRotation = true; // true = rotated with edge, false = horizontal

// Initialize the application
function init() {
  // Setup UI event listeners first
  setupLayoutControls();
  setupViewControls();
  setupActionButtons();
  setupExampleButtons();
  setupRendererControls();
  
  // Create initial graph with social network data
  // (this will also setup graph events)
  createGraph(socialNetworkData);
}

// Create graph instance
function createGraph(data, rendererOverride) {
  // Destroy existing graph if any
  if (graph) {
    graph.destroy();
  }
  
  // Assign IDs if needed
  nodeCounter = Math.max(...data.nodes.map(n => typeof n.id === 'number' ? n.id : 0)) + 1;
  
  // Determine renderer configuration
  const rendererType = rendererOverride || currentRenderer;
  const rendererConfig = rendererType === 'auto' ? undefined : { type: rendererType };
  
  // Create new graph
  graph = new EdgeCraft({
    container: '#graph-container',
    data: data,
    layout: { type: 'force', iterations: 300 },
    renderer: rendererConfig,
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
  
  // Update renderer info display
  updateRendererInfo();
  
  // Setup graph event listeners
  setupGraphEvents();
  
  // Start FPS monitoring if canvas renderer
  startFPSMonitoring();
  
  updateInfo();
}


// Dynamic node styling
function getNodeStyle(node) {
  // Check if node is selected (works for both LPGNode and RDFNode)
  const isSelected = node.properties?.selected || node.selected;
  
  // Debug: log when node is selected
  if (isSelected) {
    console.log('[Demo] getNodeStyle called for selected node:', node.id, { 
      propertiesSelected: node.properties?.selected,
      selected: node.selected,
      properties: node.properties 
    });
  }
  
  // Semantic type styling configuration
  const typeConfig = {
    'Person': { color: '#667eea', shape: 'circle' },
    'Organization': { color: '#e67e22', shape: 'rectangle' },
    'Project': { color: '#2ecc71', shape: 'diamond' },
    'Publication': { color: '#3498db', shape: 'rectangle' },
    'Skill': { color: '#9b59b6', shape: 'hexagon' },
    'Company': { color: '#e74c3c', shape: 'rectangle' },
    'Department': { color: '#f39c12', shape: 'diamond' },
    'Package': { color: '#9b59b6', shape: 'rectangle' },
    'Module': { color: '#3498db', shape: 'circle' },
    'Node': { color: '#3498db', shape: 'circle' } // For large graph nodes
  };
  
  const label = node.labels?.[0] || 'Default';
  const config = typeConfig[label] || { color: '#95a5a6', shape: 'circle' };
  
  // Color by cluster for large graphs
  let fill;
  if (label === 'Node' && node.properties?.cluster !== undefined) {
    const clusterColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6', '#34495e', '#16a085'];
    fill = clusterColors[node.properties.cluster % clusterColors.length];
  } else {
    fill = config.color;
  }
  
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
  
  // Build multi-line label for Knowledge Graph nodes
  let labelText;
  if (node.properties?.name) {
    // Multi-line label showing multiple properties
    const lines = [node.properties.name];
    if (node.properties.title) lines.push(node.properties.title);
    if (node.properties.type) lines.push(node.properties.type);
    if (node.properties.status) lines.push(`Status: ${node.properties.status}`);
    if (node.properties.year) lines.push(`Year: ${node.properties.year}`);
    labelText = lines.join('\n');
  } else {
    labelText = node.value || String(node.id);
  }
  
  // Use window mode for Knowledge Graph nodes with rich data
  const useWindowMode = node.properties?.name && nodeDisplayMode === 'detailed';
  
  if (useWindowMode) {
    // Window mode: all content inside a bordered box
    const contentLines = [];
    if (node.properties.title) contentLines.push(node.properties.title);
    if (node.properties.type) contentLines.push(node.properties.type);
    if (node.properties.location) contentLines.push(`📍 ${node.properties.location}`);
    if (node.properties.status) contentLines.push(`⚡ ${node.properties.status}`);
    if (node.properties.budget) contentLines.push(`💰 ${node.properties.budget}`);
    if (node.properties.year) contentLines.push(`📅 ${node.properties.year}`);
    if (node.properties.citations) contentLines.push(`📚 ${node.properties.citations} citations`);
    if (node.properties.email) contentLines.push(`✉️ ${node.properties.email}`);
    
    return {
      fill: isSelected ? adjustBrightness(fill, 1.3) : fill,
      stroke: isSelected ? '#FFD700' : '#2c3e50',
      strokeWidth: isSelected ? 4 : 2,
      shape: 'window',
      displayMode: 'detailed',
      icon: node.properties?.icon,
      window: {
        width: 140,
        height: Math.max(80, 40 + contentLines.length * 15),
        borderRadius: 8,
        padding: 8,
        headerHeight: 35,
        backgroundColor: '#ffffff',
        borderColor: isSelected ? '#FFD700' : config.color,
        borderWidth: isSelected ? 3 : 2,
        lines: [node.properties.name, ...contentLines]
      },
      label: {
        text: '', // No external label in window mode
        fontSize: 11,
        color: '#333',
        position: 'bottom'
      }
    };
  }
  
  // Simple mode: icon inside shape, external label
  return {
    fill: isSelected ? adjustBrightness(fill, 1.3) : fill,
    radius,
    stroke: isSelected ? '#FFD700' : '#2c3e50',
    strokeWidth: isSelected ? 4 : 2,
    shape: config.shape,
    displayMode: 'simple',
    icon: node.properties?.icon, // Icon to render inside the shape
    label: {
      text: labelText,
      fontSize: 11,
      color: '#333',
      position: 'bottom'
    }
  };
}

// Helper function to adjust color brightness
function adjustBrightness(color, factor) {
  if (!color.startsWith('#')) return color;
  
  const hex = color.slice(1);
  const r = Math.min(255, Math.round(parseInt(hex.slice(0, 2), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(hex.slice(2, 4), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(hex.slice(4, 6), 16) * factor));
  
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
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
  
  // Check if edge is selected (works for both LPG and RDF edges)
  const isSelected = edge.properties?.selected || edge.selected;
  
  return {
    stroke: isSelected ? '#FFD700' : stroke,
    strokeWidth: isSelected ? 4 : 2,
    arrow: 'forward',
    curvature: 0.0,
    label: {
      text: label,
      fontSize: isSelected ? 11 : 10,
      color: isSelected ? '#000' : '#666',
      backgroundColor: isSelected ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.9)',
      rotateWithEdge: edgeLabelRotation
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
  
  document.getElementById('load-large').addEventListener('click', () => {
    createGraph(largeGraphData);
  });
  
  document.getElementById('load-advanced-edges').addEventListener('click', () => {
    createGraphWithAdvancedEdges(advancedEdgesData);
  });
  
  // Multi-edge bundling test button
  document.getElementById('load-multi-edge-test').addEventListener('click', () => {
    createMultiEdgeTest();
  });
  
  // Inverse relationship test button
  document.getElementById('load-inverse-relationship-test').addEventListener('click', () => {
    createInverseRelationshipTest();
  });
}

// Create comprehensive multi-edge bundling test
function createMultiEdgeTest() {
  const data = {
    nodes: [
      { id: 'A', label: 'Node A', x: 200, y: 300 },
      { id: 'B', label: 'Node B', x: 600, y: 300 },
      { id: 'C', label: 'Node C', x: 200, y: 500 },
      { id: 'D', label: 'Node D', x: 600, y: 500 }
    ],
    edges: [
      // Test 1: Single edge (should be straight)
      { id: 'single1', source: 'A', target: 'C', label: '1 edge: straight' },
      
      // Test 2: Two edges (both curved symmetrically)
      { id: 'double1', source: 'C', target: 'D', label: '2 edges: curve 1' },
      { id: 'double2', source: 'C', target: 'D', label: '2 edges: curve 2' },
      
      // Test 3: Three edges (center straight, sides curved)
      { id: 'triple1', source: 'A', target: 'B', label: 'Colleague' },
      { id: 'triple2', source: 'A', target: 'B', label: 'Friend' },
      { id: 'triple3', source: 'A', target: 'B', label: 'Neighbor' },
      
      // Test 4: Five edges (demonstrates scaling)
      { id: 'five1', source: 'B', target: 'D', label: 'Edge 1' },
      { id: 'five2', source: 'B', target: 'D', label: 'Edge 2' },
      { id: 'five3', source: 'B', target: 'D', label: 'Edge 3' },
      { id: 'five4', source: 'B', target: 'D', label: 'Edge 4' },
      { id: 'five5', source: 'B', target: 'D', label: 'Edge 5' }
    ]
  };

  if (graph) {
    graph.destroy();
  }

  graph = new EdgeCraft({
    container: '#graph-container',
    width: 1200,
    height: 800,
    renderer: {
      type: 'canvas' // Use Canvas for advanced edge features
    },
    data,
    nodeStyle: (node) => ({
      radius: 40,
      fill: '#4a90e2',
      stroke: '#2c5aa0',
      strokeWidth: 2,
      label: {
        text: node.label,
        fontSize: 12,
        color: '#333'
      }
    }),
    edgeStyle: (edge) => {
      // Color edges by bundle size for easy identification
      const bundleInfo = graph.graph.getEdgeBundleInfo(edge.id);
      const bundleSize = bundleInfo?.bundleSize || 1;
      
      let color;
      if (bundleSize === 1) color = '#95a5a6';      // Gray - single edge
      else if (bundleSize === 2) color = '#3498db';  // Blue - pair
      else if (bundleSize === 3) color = '#e74c3c';  // Red - triple
      else color = '#9b59b6';                        // Purple - many
      
      return {
        stroke: color,
        strokeWidth: 2,
        arrow: {
          position: 'forward',
          size: 10,
          shape: 'triangle',
          filled: true
        },
        label: {
          text: `${edge.label}`,
          fontSize: 9,
          color: '#333',
          backgroundColor: '#fff'
        }
      };
    }
  });

  // Log bundling statistics
  console.log('Multi-Edge Bundling Statistics:');
  console.log(graph.graph.getBundleStatistics());
  
  // Log individual edge bundle info
  data.edges.forEach(edge => {
    const info = graph.graph.getEdgeBundleInfo(edge.id);
    console.log(`${edge.id}:`, info);
  });
}

// Create inverse relationship test with all three modes
function createInverseRelationshipTest() {
  // Import data from data.js
  const data = inverseRelationshipData;
  
  if (graph) {
    graph.destroy();
  }

  graph = new EdgeCraft({
    container: '#graph-container',
    data: data,
    renderer: {
      type: 'canvas' // Use Canvas for glyph support
    },
    layout: {
      type: 'force',
      iterations: 300
    },
    interaction: {
      draggable: true,
      zoomable: true,
      selectable: true,
      hoverable: true,
      showHitboxes: false
    },
    nodeStyle: (node) => {
      const isSelected = node.properties?.selected || node.selected;
      
      return {
        fill: isSelected ? '#667eea' : '#3498db',
        stroke: isSelected ? '#FFD700' : '#2c3e50',
        strokeWidth: isSelected ? 4 : 2,
        radius: 35,
        shape: 'circle',
        icon: node.properties?.role?.substring(0, 1), // First letter of role
        label: {
          text: node.properties?.name || node.id,
          fontSize: 12,
          color: '#333',
          position: 'bottom'
        }
      };
    },
    edgeStyle: (edge) => {
      const isSelected = edge.properties?.selected || edge.selected;
      const predicate = edge.predicate || edge.label || '';
      
      // Determine relationship mode
      let relationshipMode = 'asymmetric';
      let arrow = 'forward';
      
      if (edge.forwardPredicate && edge.inversePredicate) {
        if (edge.forwardPredicate === edge.inversePredicate) {
          // Symmetric: same predicate both directions
          relationshipMode = 'symmetric';
          arrow = 'both';
        } else {
          // Inverse: different predicates (employs/employedBy)
          relationshipMode = 'inverse';
          arrow = 'none'; // No arrows, glyphs will show direction
        }
      } else {
        // Asymmetric: single direction, inverse not modeled
        relationshipMode = 'asymmetric';
        arrow = 'forward';
      }
      
      // Color by predicate type
      const predicateColors = {
        'employs': '#e74c3c',
        'supervises': '#f39c12',
        'mentors': '#2ecc71',
        'friend': '#9b59b6',
        'reportsTo': '#3498db'
      };
      
      const stroke = predicateColors[predicate] || '#95a5a6';
      
      return {
        stroke: isSelected ? '#FFD700' : stroke,
        strokeWidth: isSelected ? 4 : 2,
        arrow: arrow,
        relationshipMode: relationshipMode,
        forwardPredicate: edge.forwardPredicate,
        inversePredicate: edge.inversePredicate,
        label: {
          text: relationshipMode === 'symmetric' ? predicate : '', // Only show label for symmetric
          fontSize: 10,
          color: '#666',
          backgroundColor: 'rgba(255,255,255,0.9)',
          rotateWithEdge: true
        }
      };
    }
  });

  // Setup graph event listeners
  setupGraphEvents();
  
  // Update info panel
  updateInfo();
  updateRendererInfo();
  
  // Display legend explaining relationship modes
  console.log('=== Inverse Relationship Modes ===');
  console.log('Symmetric (friend): Both directions, same predicate, arrows on both ends, no glyphs');
  console.log('Inverse (employs/employedBy): Different predicates, glyphs at ends showing direction');
  console.log('Asymmetric (reportsTo): Single direction only, arrow forward, no glyphs (inverse not yet learned)');
}

// Renderer controls
function setupRendererControls() {
  // Display mode toggle
  ['simple', 'detailed'].forEach(mode => {
    document.getElementById(`display-${mode}`).addEventListener('click', function() {
      // Update active state
      document.querySelectorAll('[id^="display-"]').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Set display mode and re-render
      nodeDisplayMode = mode;
      if (graph) {
        graph.render(); // Re-render with new display mode
      }
    });
  });
  
  // Edge label rotation toggle
  document.getElementById('edge-label-rotated').addEventListener('click', function() {
    document.querySelectorAll('[id^="edge-label-"]').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    edgeLabelRotation = true;
    if (graph) {
      graph.render();
    }
  });
  
  document.getElementById('edge-label-horizontal').addEventListener('click', function() {
    document.querySelectorAll('[id^="edge-label-"]').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    edgeLabelRotation = false;
    if (graph) {
      graph.render();
    }
  });
  
  // Renderer type toggle
  ['auto', 'canvas', 'webgl'].forEach(type => {
    document.getElementById(`renderer-${type}`).addEventListener('click', function() {
      // Update active state
      document.querySelectorAll('[id^="renderer-"]').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Set renderer and recreate graph with override
      currentRenderer = type;
      const currentData = graph.getData();
      
      // Check if this was a knowledge graph (has complex styling)
      const hasComplexNodes = currentData.nodes.some(n => 
        ['Collaboration', 'Authorship', 'Employment'].includes(n.labels?.[0])
      );
      
      if (hasComplexNodes) {
        createGraphWithComplexStyling(currentData);
      } else {
        createGraph(currentData, type);
      }
    });
  });
}

// Update renderer info display
function updateRendererInfo() {
  const info = document.getElementById('renderer-info');
  if (graph && graph.renderer) {
    const actualType = graph.renderer.getType ? graph.renderer.getType() : 'SVG';
    const nodeCount = graph.getAllNodes().length;
    info.textContent = `Active: ${actualType.toUpperCase()} (${nodeCount} nodes)`;
  }
}

// FPS monitoring
let fpsInterval;
function startFPSMonitoring() {
  if (fpsInterval) clearInterval(fpsInterval);
  
  fpsInterval = setInterval(() => {
    if (graph && graph.renderer && graph.renderer.getMetrics) {
      const metrics = graph.renderer.getMetrics();
      document.getElementById('fps-count').textContent = metrics.fps || '--';
    } else {
      document.getElementById('fps-count').textContent = '--';
    }
  }, 500);
}

// Graph events
function setupGraphEvents() {
  // Node click - show details
  graph.on('node-click', (event) => {
    showNodeDetails(event.target);
    updateInfo();
  });
  
  // Edge click - show edge details
  graph.on('edge-click', (event) => {
    // Check if a glyph was clicked
    const glyphHit = event.target.__glyphHit;
    
    if (glyphHit) {
      console.log('=== Glyph Clicked ===');
      console.log('Direction:', glyphHit.direction);
      console.log('Predicate:', glyphHit.predicate);
      console.log('Position:', glyphHit.position);
      console.log('Edge ID:', event.target.id);
      
      // Show glyph-specific details
      showEdgeDetails(event.target, glyphHit);
    } else {
      console.log('=== Edge Body Clicked ===');
      console.log('Edge ID:', event.target.id);
      
      // Show full edge details
      showEdgeDetails(event.target);
    }
    
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
  
  // Toggle details panel when clicking on selected count
  const selectedCountElement = document.getElementById('selected-count').parentElement;
  selectedCountElement.style.cursor = 'pointer';
  selectedCountElement.title = 'Click to show selection details';
  selectedCountElement.addEventListener('click', () => {
    const selectedNodes = graph.getSelectedNodes();
    const selectedEdges = graph.getSelectedEdges();
    
    if (selectedNodes.length > 0) {
      const nodeId = selectedNodes[0];
      const nodeData = graph.getData().nodes.find(n => n.id === nodeId);
      if (nodeData) {
        showNodeDetails(nodeData);
      }
    } else if (selectedEdges.length > 0) {
      const edgeId = selectedEdges[0];
      const edgeData = graph.getData().edges.find(e => e.id === edgeId);
      if (edgeData) {
        showEdgeDetails(edgeData);
      }
    } else {
      hideNodeDetails();
    }
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

// Show edge details panel
function showEdgeDetails(edge, glyphHit) {
  const panel = document.getElementById('node-details');
  const content = document.getElementById('details-content');
  
  let html = '';
  
  if (glyphHit) {
    // Glyph-specific view
    html += `<h4>🎯 Property Glyph</h4>`;
    html += `<p><strong>Direction:</strong> ${glyphHit.direction === 'forward' ? '→' : '←'} ${glyphHit.direction}</p>`;
    html += `<p><strong>Predicate:</strong> <code>${glyphHit.predicate}</code></p>`;
    html += `<p><strong>Position:</strong> ${(glyphHit.position * 100).toFixed(0)}% along edge</p>`;
    html += `<hr style="margin: 12px 0;">`;
    html += `<p style="font-size: 11px; color: #666;">Click elsewhere on edge to see full relationship details</p>`;
  } else {
    // Full edge view
    html += `<h4>Edge Details</h4>`;
  }
  
  html += `<p><strong>ID:</strong> ${edge.id}</p>`;
  
  if (edge.label) {
    html += `<p><strong>Label:</strong> ${edge.label}</p>`;
  }
  
  if (edge.predicate) {
    html += `<p><strong>Predicate:</strong> ${edge.predicate}</p>`;
  }
  
  // Show inverse predicates if present
  if (edge.forwardPredicate && edge.inversePredicate) {
    html += `<p><strong>Forward:</strong> ${edge.forwardPredicate}</p>`;
    html += `<p><strong>Inverse:</strong> ${edge.inversePredicate}</p>`;
  }
  
  const sourceId = edge.source || edge.subject;
  const targetId = edge.target || edge.object;
  html += `<p><strong>Source:</strong> ${sourceId}</p>`;
  html += `<p><strong>Target:</strong> ${targetId}</p>`;
  
  if (edge.properties) {
    html += `<p><strong>Properties:</strong></p>`;
    Object.entries(edge.properties).forEach(([key, value]) => {
      if (key !== 'selected') {
        html += `<p style="margin-left: 15px;">• ${key}: ${value}</p>`;
      }
    });
  }
  
  content.innerHTML = html;
  panel.classList.remove('hidden');
  
  document.getElementById('close-details').onclick = hideNodeDetails;
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
  const selectedCount = graph.getSelectedNodes().length + graph.getSelectedEdges().length;
  document.getElementById('selected-count').textContent = selectedCount;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded
  init();
}

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
  
  // Setup graph event listeners
  setupGraphEvents();
  
  updateInfo();
}

// Complex node styling with icons and multi-line text
function getComplexNodeStyle(node) {
  const label = node.labels?.[0];
  const props = node.properties || {};
  
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
  
  // Build label text with secondary info
  const mainName = props.name || props.title || String(node.id);
  const truncatedName = mainName.length > 20 ? mainName.substring(0, 18) + '...' : mainName;
  
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
  
  const labelText = secondaryInfo ? `${truncatedName}\\n${secondaryInfo}` : truncatedName;
  
  return {
    ...style,
    stroke: '#2c3e50',
    strokeWidth: 3,
    icon: props.icon, // Show emoji icon inside shape
    label: {
      text: labelText,
      fontSize: 11,
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

// NOTE: customizeComplexNodes() removed - labels and icons are now handled
// directly in getComplexNodeStyle() which works with both Canvas and WebGL renderers

// Create graph showcasing advanced edge features
function createGraphWithAdvancedEdges(data) {
  // Destroy existing graph if any
  if (graph) {
    graph.destroy();
  }
  
  graph = new EdgeCraft({
    container: '#graph-container',
    data: data,
    layout: { type: 'force', iterations: 200 },
    renderer: { type: 'canvas' }, // Force canvas for advanced features
    nodeStyle: (node) => {
      const label = node.labels?.[0] || 'Unknown';
      const colors = {
        'State': '#4CAF50',
        'Person': '#2196F3',
        'Car': '#FF5722',
        'Engine': '#9C27B0',
        'Wheel': '#607D8B'
      };
      
      return {
        fill: colors[label] || '#95a5a6',
        radius: 35,
        stroke: '#333',
        strokeWidth: 2,
        shape: label === 'State' ? 'circle' : 'rectangle',
        label: {
          text: node.properties?.name || String(node.id),
          fontSize: 12,
          color: '#333',
          position: 'bottom'
        }
      };
    },
    edgeStyle: (edge) => {
      const edgeId = edge.id;
      
      // Self-loops get special styling
      if (edge.source === edge.target) {
        return {
          stroke: '#FF6B6B',
          strokeWidth: 3,
          arrow: {
            position: 'forward',
            size: 12,
            shape: 'triangle',
            filled: true
          },
          selfLoop: {
            radius: 40,
            angle: edgeId === 'self1' ? 45 : -45,  // Top-right and bottom-right
            clockwise: true
          },
          label: {
            text: edge.label,
            fontSize: 11,
            color: '#333',
            backgroundColor: '#fff'
          }
        };
      }
      
      // Multi-edges between same nodes - automatically handled by MultiEdgeBundler!
      // The bundler will intelligently distribute them with appropriate curvature
      const multiEdgeIds = ['multi1', 'multi2', 'multi3'];
      if (multiEdgeIds.includes(edgeId)) {
        const index = multiEdgeIds.indexOf(edgeId);
        
        return {
          stroke: ['#4CAF50', '#2196F3', '#FF9800'][index],
          strokeWidth: 2,
          arrow: {
            position: 'forward',
            size: 10,
            shape: index === 0 ? 'triangle' : index === 1 ? 'diamond' : 'chevron',
            filled: index !== 2
          },
          // MultiEdgeBundler automatically handles:
          // - 1 edge: straight line (curvature=0)
          // - 2 edges: both curved symmetrically
          // - 3 edges: center straight, two curves on sides (what we have!)
          // - N edges: dynamic curvature scaling
          label: {
            text: edge.label,
            fontSize: 10,
            color: '#333',
            backgroundColor: '#fff'
          }
        };
      }
      
      // Bidirectional edges (friend relationship)
      if (edge.label === 'friend') {
        return {
          stroke: '#9C27B0',
          strokeWidth: 3,
          arrow: {
            position: 'both',  // Arrows on both ends!
            size: 12,
            shape: 'circle',
            filled: true
          },
          label: {
            text: edge.label,
            fontSize: 11,
            color: '#333',
            backgroundColor: '#fff'
          }
        };
      }
      
      // RDF-style inverse relationships (hasPart/partOf)
      if (edge.label === 'hasPart') {
        return {
          stroke: '#00BCD4',
          strokeWidth: 3,
          arrow: {
            position: 'forward',
            size: 12,
            shape: 'diamond',
            filled: true
          },
          label: {
            text: edge.label + ' ➡️',
            fontSize: 11,
            color: '#00BCD4',
            backgroundColor: '#fff'
          }
        };
      }
      
      // Default directed edges (state machine transitions)
      return {
        stroke: '#607D8B',
        strokeWidth: 2,
        arrow: {
          position: 'forward',
          size: 10,
          shape: 'triangle',
          filled: true,
          offset: 35
        },
        label: {
          text: edge.label,
          fontSize: 11,
          color: '#333',
          backgroundColor: '#fff'
        }
      };
    },
    interaction: {
      draggable: true,
      zoomable: true,
      selectable: true,
      hoverable: true
    }
  });
  
  // Setup event listeners
  setupGraphEvents();
  startFPSMonitoring();
  updateInfo();
}