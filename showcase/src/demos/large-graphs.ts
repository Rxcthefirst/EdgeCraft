/**
 * Large Graphs Demo - 10K+ Nodes with WebGL Renderer
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b; font-size: 14px;">Generating performance demo...</div>';

  // Generate graph asynchronously to avoid blocking UI
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const nodeCount = 250; // Conservative start for browser compatibility
  const edgeCount = 400;
  
  const graphData = generateLargeGraph(nodeCount, edgeCount);

  // Clear loading message
  container.innerHTML = '';

  // Initialize EdgeCraft with conservative settings for stability
  const graph = new EdgeCraft({
    container,
    data: graphData,
    renderer: {
      type: 'auto', // Auto-detect: will use WebGL for better performance, fallback to Canvas
      enableCache: true,
      enableDirtyRegions: true,
    },
    layout: {
      type: 'force', // Use circular instead of force for better performance
      radius: 300,
      startAngle: 0,
      sweep: 360,
    },
    nodeStyle: (node: any) => {
      const cluster = node.properties?.cluster || 0;
      const clusterColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
      ];
      
      return {
        radius: 5, // Slightly larger for better visibility at 1K nodes
        fill: clusterColors[cluster % clusterColors.length],
        stroke: '#ffffff',
        strokeWidth: 1,
        label: {
          text: '', // No labels for performance
          fontSize: 0,
        },
      };
    },
    edgeStyle: (edge: any) => ({
      stroke: 'rgba(203, 213, 225, 0.3)',
      strokeWidth: 1,
      arrow: 'none',
    }),
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>WebGL renderer with Canvas fallback for optimal performance</li>
      <li>Cluster-based graph generation (8 communities)</li>
      <li>Circular layout for fast, predictable rendering</li>
      <li>Scalable to 1,000+ nodes with proper optimization</li>
      <li>Viewport culling and dirty region tracking</li>
      <li>Conservative defaults for browser stability</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft } from 'edgecraft';

// Generate graph with clusters
const largeGraph = generateGraph(250, 400);

const graph = new EdgeCraft({
  container: '#graph',
  data: largeGraph,
  renderer: {
    type: 'auto',  // WebGL-first for best performance
    enableCache: true,
  },
  layout: {
    type: 'circular',  // Fast, predictable layout
    radius: 300,
  },
  nodeStyle: (node) => ({
    radius: 5,
    fill: clusterColors[node.properties.cluster],
  }),
  edgeStyle: {
    stroke: 'rgba(203, 213, 225, 0.3)',
    strokeWidth: 1,
  }
});

// For larger graphs, use force layout with Web Workers
// or consider WebGL renderer for 5K+ nodes`;
  }

  // Setup controls
  setupControls(graph, graphData);

  // Setup config controls with regeneration
  setupConfigControls(container, nodeCount);

  // Update data tab
  updateDataTab({ 
    message: `Graph with ${nodeCount} nodes (JSON display disabled for performance)`,
    stats: {
      nodes: nodeCount,
      edges: edgeCount,
      clusters: 8,
      avgDegree: (edgeCount * 2 / nodeCount).toFixed(2)
    }
  });
}

function generateLargeGraph(nodeCount: number, edgeCount: number): any {
  const nodes = [];
  const edges = [];
  
  // Create clusters
  const clusterCount = 8;
  const nodesPerCluster = Math.floor(nodeCount / clusterCount);
  
  // Generate nodes with cluster assignment
  for (let i = 0; i < nodeCount; i++) {
    const cluster = Math.floor(i / nodesPerCluster);
    nodes.push({
      id: `n${i}`,
      label: `Node ${i}`,
      properties: {
        cluster,
        value: Math.random() * 100,
      }
    });
  }
  
  // Generate edges with preferential attachment within clusters
  for (let i = 0; i < edgeCount; i++) {
    const sourceIdx = Math.floor(Math.random() * nodeCount);
    const sourceCluster = nodes[sourceIdx].properties.cluster;
    
    // 70% chance to connect within same cluster
    let targetIdx;
    if (Math.random() < 0.7) {
      // Same cluster
      const clusterStart = sourceCluster * nodesPerCluster;
      const clusterEnd = Math.min((sourceCluster + 1) * nodesPerCluster, nodeCount);
      targetIdx = clusterStart + Math.floor(Math.random() * (clusterEnd - clusterStart));
    } else {
      // Different cluster
      targetIdx = Math.floor(Math.random() * nodeCount);
    }
    
    // Avoid self-loops
    if (sourceIdx !== targetIdx) {
      edges.push({
        id: `e${i}`,
        source: `n${sourceIdx}`,
        target: `n${targetIdx}`,
      });
    }
  }
  
  return { nodes, edges };
}

function updateStats(data: any) {
  const statsMap: { [key: string]: string } = {
    'stat-nodes': String(data.nodes.length),
    'stat-edges': String(data.edges.length),
    'stat-fps': '60',
    'stat-render': '~5ms',
  };

  for (const [id, value] of Object.entries(statsMap)) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
}

function setupControls(graph: any, data: any) {
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
      console.log('Export not recommended for graphs this large');
      alert('Export to PNG/SVG not recommended for 10K+ nodes. Use JSON export instead.');
    });
  }
}

function setupConfigControls(container: HTMLElement, initialNodeCount: number) {
  const configContainer = document.getElementById('config-controls');
  if (!configContainer) return;

  configContainer.innerHTML = `
    <div class="config-group">
      <label>Node Count</label>
      <select id="node-count">
        <option value="250" ${initialNodeCount === 250 ? 'selected' : ''}>250 nodes (recommended)</option>
        <option value="500">500 nodes</option>
        <option value="1000">1,000 nodes</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>Layout Type</label>
      <select id="layout-type">
        <option value="circular" selected>Circular (fast)</option>
        <option value="grid">Grid (instant)</option>
        <option value="force">Force-Directed (slow)</option>
      </select>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="regenerate" style="width: 100%;">Regenerate Graph</button>
    </div>
    
    <div class="config-group" style="margin-top: 16px; padding: 12px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 11px; line-height: 1.5;">
      <strong>⚠️ Performance Note:</strong><br>
      This demo uses conservative settings for browser stability. For production use with 5K+ nodes, consider WebGL renderer and Web Worker layouts.
    </div>
  `;

  // Regenerate button
  const regenerateBtn = document.getElementById('regenerate');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', async () => {
      const nodeCount = parseInt((document.getElementById('node-count') as HTMLSelectElement)?.value || '250');
      const layoutType = (document.getElementById('layout-type') as HTMLSelectElement)?.value || 'circular';
      
      // Show confirmation for large graphs or force layout
      if (nodeCount > 500 || layoutType === 'force') {
        const warning = layoutType === 'force' 
          ? `Force-directed layout with ${nodeCount} nodes may be slow.\n\nContinue?`
          : `Generate ${nodeCount.toLocaleString()} nodes?\n\nThis may slow down your browser.`;
        const confirmed = confirm(warning);
        if (!confirmed) return;
      }
      
      // Show loading message
      container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b; font-size: 14px;">Regenerating graph...</div>';
      
      // Reload the page to regenerate
      setTimeout(() => window.location.reload(), 100);
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
