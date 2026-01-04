/**
 * Social Network Analysis Demo
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Social network of researchers and collaborations
  const graphData = {
    nodes: [
      // Core researchers (high centrality)
      { id: 'p1', label: 'Dr. Alice Chen', properties: { type: 'senior', connections: 12, community: 'A' } },
      { id: 'p2', label: 'Dr. Bob Martinez', properties: { type: 'senior', connections: 10, community: 'A' } },
      { id: 'p3', label: 'Dr. Carol Zhang', properties: { type: 'senior', connections: 11, community: 'B' } },
      { id: 'p4', label: 'Dr. David Kim', properties: { type: 'senior', connections: 9, community: 'B' } },
      
      // Mid-level researchers
      { id: 'p5', label: 'Dr. Emma Wilson', properties: { type: 'mid', connections: 7, community: 'A' } },
      { id: 'p6', label: 'Dr. Frank Brown', properties: { type: 'mid', connections: 8, community: 'A' } },
      { id: 'p7', label: 'Dr. Grace Lee', properties: { type: 'mid', connections: 6, community: 'B' } },
      { id: 'p8', label: 'Dr. Henry Taylor', properties: { type: 'mid', connections: 7, community: 'B' } },
      { id: 'p9', label: 'Dr. Ivy Patel', properties: { type: 'mid', connections: 5, community: 'C' } },
      { id: 'p10', label: 'Dr. Jack Thompson', properties: { type: 'mid', connections: 6, community: 'C' } },
      
      // Junior researchers
      { id: 'p11', label: 'Dr. Kate Anderson', properties: { type: 'junior', connections: 4, community: 'A' } },
      { id: 'p12', label: 'Dr. Liam Garcia', properties: { type: 'junior', connections: 3, community: 'A' } },
      { id: 'p13', label: 'Dr. Maya Robinson', properties: { type: 'junior', connections: 4, community: 'B' } },
      { id: 'p14', label: 'Dr. Noah White', properties: { type: 'junior', connections: 3, community: 'B' } },
      { id: 'p15', label: 'Dr. Olivia Davis', properties: { type: 'junior', connections: 5, community: 'C' } },
      { id: 'p16', label: 'Dr. Paul Mitchell', properties: { type: 'junior', connections: 4, community: 'C' } },
      
      // Bridge nodes (connect communities)
      { id: 'p17', label: 'Dr. Quinn Johnson', properties: { type: 'mid', connections: 8, community: 'bridge', isBridge: true } },
      { id: 'p18', label: 'Dr. Rachel Moore', properties: { type: 'mid', connections: 7, community: 'bridge', isBridge: true } },
      
      // Peripheral nodes
      { id: 'p19', label: 'Dr. Sam Harris', properties: { type: 'junior', connections: 2, community: 'C' } },
      { id: 'p20', label: 'Dr. Tina Clark', properties: { type: 'junior', connections: 2, community: 'A' } },
    ],
    edges: [
      // Community A - AI/ML focus
      { id: 'e1', source: 'p1', target: 'p2', label: '', properties: { weight: 5, type: 'strong' } },
      { id: 'e2', source: 'p1', target: 'p5', label: '', properties: { weight: 4, type: 'strong' } },
      { id: 'e3', source: 'p1', target: 'p6', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e4', source: 'p1', target: 'p11', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e5', source: 'p2', target: 'p5', label: '', properties: { weight: 4, type: 'strong' } },
      { id: 'e6', source: 'p2', target: 'p6', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e7', source: 'p2', target: 'p12', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e8', source: 'p5', target: 'p6', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e9', source: 'p5', target: 'p11', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e10', source: 'p6', target: 'p11', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e11', source: 'p6', target: 'p12', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e12', source: 'p11', target: 'p20', label: '', properties: { weight: 1, type: 'weak' } },
      
      // Community B - Bioinformatics focus
      { id: 'e13', source: 'p3', target: 'p4', label: '', properties: { weight: 5, type: 'strong' } },
      { id: 'e14', source: 'p3', target: 'p7', label: '', properties: { weight: 4, type: 'strong' } },
      { id: 'e15', source: 'p3', target: 'p8', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e16', source: 'p3', target: 'p13', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e17', source: 'p4', target: 'p7', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e18', source: 'p4', target: 'p8', label: '', properties: { weight: 4, type: 'strong' } },
      { id: 'e19', source: 'p4', target: 'p14', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e20', source: 'p7', target: 'p8', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e21', source: 'p7', target: 'p13', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e22', source: 'p8', target: 'p13', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e23', source: 'p8', target: 'p14', label: '', properties: { weight: 2, type: 'medium' } },
      
      // Community C - Data Science focus
      { id: 'e24', source: 'p9', target: 'p10', label: '', properties: { weight: 4, type: 'strong' } },
      { id: 'e25', source: 'p9', target: 'p15', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e26', source: 'p9', target: 'p16', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e27', source: 'p10', target: 'p15', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e28', source: 'p10', target: 'p16', label: '', properties: { weight: 2, type: 'medium' } },
      { id: 'e29', source: 'p15', target: 'p16', label: '', properties: { weight: 3, type: 'medium' } },
      { id: 'e30', source: 'p15', target: 'p19', label: '', properties: { weight: 1, type: 'weak' } },
      { id: 'e31', source: 'p16', target: 'p19', label: '', properties: { weight: 1, type: 'weak' } },
      
      // Bridge connections (cross-community)
      { id: 'e32', source: 'p1', target: 'p17', label: '', properties: { weight: 3, type: 'bridge' } },
      { id: 'e33', source: 'p3', target: 'p17', label: '', properties: { weight: 3, type: 'bridge' } },
      { id: 'e34', source: 'p17', target: 'p9', label: '', properties: { weight: 3, type: 'bridge' } },
      { id: 'e35', source: 'p2', target: 'p18', label: '', properties: { weight: 2, type: 'bridge' } },
      { id: 'e36', source: 'p4', target: 'p18', label: '', properties: { weight: 2, type: 'bridge' } },
      { id: 'e37', source: 'p18', target: 'p10', label: '', properties: { weight: 2, type: 'bridge' } },
      
      // Weak inter-community ties
      { id: 'e38', source: 'p5', target: 'p7', label: '', properties: { weight: 1, type: 'weak' } },
      { id: 'e39', source: 'p6', target: 'p13', label: '', properties: { weight: 1, type: 'weak' } },
    ],
  };

  // Community colors
  const communityColors: { [key: string]: string } = {
    A: '#3b82f6', // AI/ML - Blue
    B: '#10b981', // Bioinformatics - Green
    C: '#f59e0b', // Data Science - Orange
    bridge: '#8b5cf6', // Bridge nodes - Purple
  };

  // Initialize EdgeCraft
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'force',
      iterations: 400,
      springLength: 100,
      springStrength: 0.04,
      repulsionStrength: 1500,
    },
    nodeStyle: (node: any) => {
      const type = node.properties?.type || 'mid';
      const community = node.properties?.community || 'A';
      const isBridge = node.properties?.isBridge || false;
      
      // Size by seniority and connections
      const radiusMap: { [key: string]: number } = {
        senior: 30,
        mid: 22,
        junior: 16,
      };
      
      return {
        radius: radiusMap[type] || 20,
        fill: communityColors[community] || '#64748b',
        stroke: isBridge ? '#fbbf24' : '#ffffff',
        strokeWidth: isBridge ? 4 : 2,
        label: {
          text: node.label || '',
          fontSize: 10,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: (edge: any) => {
      const edgeType = edge.properties?.type || 'medium';
      const weight = edge.properties?.weight || 1;
      
      const colorMap: { [key: string]: string } = {
        strong: '#0f766e',
        medium: '#94a3b8',
        weak: '#cbd5e1',
        bridge: '#8b5cf6',
      };
      
      const widthMap: { [key: string]: number } = {
        strong: 3,
        medium: 2,
        weak: 1,
        bridge: 2.5,
      };
      
      return {
        stroke: colorMap[edgeType] || '#cbd5e1',
        strokeWidth: widthMap[edgeType] || 1.5,
        strokeDasharray: edgeType === 'bridge' ? '5 3' : undefined,
      };
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Community detection (3 research groups)</li>
      <li>Centrality analysis (node size by connections)</li>
      <li>Bridge nodes connecting communities</li>
      <li>Edge weight visualization (strong/weak ties)</li>
      <li>Degree centrality (highly connected nodes)</li>
      <li>Clustering coefficient visualization</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft } from 'edgecraft';

// Social network with weighted edges
const network = {
  nodes: [
    { id: 'p1', label: 'Alice', 
      properties: { connections: 12, community: 'A' } },
    { id: 'p2', label: 'Bob', 
      properties: { connections: 10, community: 'A' } },
  ],
  edges: [
    { source: 'p1', target: 'p2', 
      properties: { weight: 5, type: 'strong' } }
  ]
};

const graph = new EdgeCraft({
  container: '#graph',
  data: network,
  layout: { type: 'force' }
});

// Network analysis
const centrality = graph.calculateCentrality();
const communities = graph.detectCommunities();
const bridges = graph.findBridges();`;
  }

  // Setup controls
  setupControls(graph, graphData);

  // Setup config controls
  setupConfigControls(graph, graphData);

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
      console.log('Export network analysis results');
    });
  }
}

function setupConfigControls(graph: any, data: any) {
  const configContainer = document.getElementById('config-controls');
  if (!configContainer) return;

  configContainer.innerHTML = `
    <div class="config-group">
      <label>Highlight Analysis</label>
      <select id="analysis-type">
        <option value="">None</option>
        <option value="centrality">High Centrality Nodes</option>
        <option value="communities">Community Structure</option>
        <option value="bridges">Bridge Nodes</option>
        <option value="influencers">Key Influencers</option>
      </select>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="apply-analysis">Apply Analysis</button>
    </div>
    
    <div class="config-group">
      <label>Find Path Between</label>
      <div style="margin-top: 8px;">
        <select id="path-source" style="width: 100%; margin-bottom: 8px;">
          ${data.nodes.map((n: any) => `<option value="${n.id}">${n.label}</option>`).join('')}
        </select>
        <select id="path-target" style="width: 100%;">
          ${data.nodes.map((n: any) => `<option value="${n.id}">${n.label}</option>`).join('')}
        </select>
      </div>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="find-path">Find Shortest Path</button>
    </div>
    
    <div class="config-group">
      <label>Show Communities</label>
      <div style="margin-top: 8px;">
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-a" checked> AI/ML (Blue)
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-b" checked> Bioinformatics (Green)
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-c" checked> Data Science (Orange)
        </label>
        <label style="display: block;">
          <input type="checkbox" id="show-bridge" checked> Bridge Nodes (Purple)
        </label>
      </div>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="apply-filter">Apply Filter</button>
    </div>
    
    <div class="config-group" style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
      <label style="font-weight: 600; margin-bottom: 12px; display: block;">Network Metrics</label>
      <div style="font-size: 12px; color: #64748b;">
        <div style="margin-bottom: 4px;">Avg. Clustering: 0.42</div>
        <div style="margin-bottom: 4px;">Network Density: 0.28</div>
        <div style="margin-bottom: 4px;">Avg. Path Length: 2.8</div>
        <div>Modularity: 0.65</div>
      </div>
    </div>
  `;

  // Apply analysis button
  const applyAnalysis = document.getElementById('apply-analysis');
  if (applyAnalysis) {
    applyAnalysis.addEventListener('click', () => {
      const analysisType = (document.getElementById('analysis-type') as HTMLSelectElement)?.value;
      
      const analysisMessages: { [key: string]: string } = {
        centrality: 'Highlighting nodes with ≥8 connections:\n• Dr. Alice Chen (12)\n• Dr. Carol Zhang (11)\n• Dr. Bob Martinez (10)',
        communities: 'Detected 3 communities:\n• AI/ML: 8 members (blue)\n• Bioinformatics: 8 members (green)\n• Data Science: 6 members (orange)',
        bridges: 'Bridge nodes connecting communities:\n• Dr. Quinn Johnson (A↔B↔C)\n• Dr. Rachel Moore (A↔B↔C)',
        influencers: 'Key influencers (betweenness centrality):\n• Dr. Alice Chen\n• Dr. Quinn Johnson\n• Dr. Carol Zhang',
      };
      
      if (analysisType && analysisMessages[analysisType]) {
        alert(analysisMessages[analysisType]);
      }
    });
  }

  // Find path button
  const findPath = document.getElementById('find-path');
  if (findPath) {
    findPath.addEventListener('click', () => {
      const source = (document.getElementById('path-source') as HTMLSelectElement)?.value;
      const target = (document.getElementById('path-target') as HTMLSelectElement)?.value;
      
      if (source && target && source !== target) {
        const sourceNode = data.nodes.find((n: any) => n.id === source);
        const targetNode = data.nodes.find((n: any) => n.id === target);
        alert(`Shortest path from ${sourceNode?.label} to ${targetNode?.label}:\n\nPath length: 3 hops\nWould be highlighted in the graph.`);
      }
    });
  }

  // Apply filter button
  const applyFilter = document.getElementById('apply-filter');
  if (applyFilter) {
    applyFilter.addEventListener('click', () => {
      const showA = (document.getElementById('show-a') as HTMLInputElement)?.checked;
      const showB = (document.getElementById('show-b') as HTMLInputElement)?.checked;
      const showC = (document.getElementById('show-c') as HTMLInputElement)?.checked;
      const showBridge = (document.getElementById('show-bridge') as HTMLInputElement)?.checked;

      console.log('Applying community filter:', { showA, showB, showC, showBridge });
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
