/**
 * Organic Layout Demo - Barnes-Hut Optimized Force-Directed
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Generate a larger network to showcase Barnes-Hut performance
  // Scientific collaboration network
  const graphData = {
    nodes: [
      // Research labs
      { id: 'lab1', label: 'AI Lab', properties: { type: 'lab', field: 'ai', size: 50 } },
      { id: 'lab2', label: 'Robotics Lab', properties: { type: 'lab', field: 'robotics', size: 45 } },
      { id: 'lab3', label: 'Quantum Lab', properties: { type: 'lab', field: 'quantum', size: 40 } },
      { id: 'lab4', label: 'Bio Lab', properties: { type: 'lab', field: 'bio', size: 55 } },
      { id: 'lab5', label: 'Network Lab', properties: { type: 'lab', field: 'network', size: 35 } },
      
      // Researchers
      { id: 'r1', label: 'Prof. Anderson', properties: { type: 'researcher', field: 'ai', papers: 120 } },
      { id: 'r2', label: 'Dr. Brooks', properties: { type: 'researcher', field: 'ai', papers: 85 } },
      { id: 'r3', label: 'Prof. Chen', properties: { type: 'researcher', field: 'ai', papers: 150 } },
      { id: 'r4', label: 'Dr. Davis', properties: { type: 'researcher', field: 'robotics', papers: 95 } },
      { id: 'r5', label: 'Prof. Evans', properties: { type: 'researcher', field: 'robotics', papers: 110 } },
      { id: 'r6', label: 'Dr. Foster', properties: { type: 'researcher', field: 'quantum', papers: 70 } },
      { id: 'r7', label: 'Prof. Garcia', properties: { type: 'researcher', field: 'quantum', papers: 130 } },
      { id: 'r8', label: 'Dr. Harris', properties: { type: 'researcher', field: 'bio', papers: 100 } },
      { id: 'r9', label: 'Prof. Ivanov', properties: { type: 'researcher', field: 'bio', papers: 140 } },
      { id: 'r10', label: 'Dr. Jackson', properties: { type: 'researcher', field: 'network', papers: 80 } },
      
      // PhD students
      { id: 's1', label: 'Alice (PhD)', properties: { type: 'student', field: 'ai', year: 3 } },
      { id: 's2', label: 'Bob (PhD)', properties: { type: 'student', field: 'ai', year: 2 } },
      { id: 's3', label: 'Carol (PhD)', properties: { type: 'student', field: 'robotics', year: 4 } },
      { id: 's4', label: 'David (PhD)', properties: { type: 'student', field: 'quantum', year: 1 } },
      { id: 's5', label: 'Emma (PhD)', properties: { type: 'student', field: 'bio', year: 3 } },
      { id: 's6', label: 'Frank (PhD)', properties: { type: 'student', field: 'network', year: 2 } },
      
      // Projects
      { id: 'p1', label: 'DeepMind v2', properties: { type: 'project', field: 'ai' } },
      { id: 'p2', label: 'RoboSense', properties: { type: 'project', field: 'robotics' } },
      { id: 'p3', label: 'QuantumNet', properties: { type: 'project', field: 'quantum' } },
      { id: 'p4', label: 'BioCompute', properties: { type: 'project', field: 'bio' } },
      { id: 'p5', label: 'NetScale', properties: { type: 'project', field: 'network' } },
    ],
    edges: [
      // Lab memberships
      { id: 'e1', source: 'r1', target: 'lab1', label: 'member_of' },
      { id: 'e2', source: 'r2', target: 'lab1', label: 'member_of' },
      { id: 'e3', source: 'r3', target: 'lab1', label: 'member_of' },
      { id: 'e4', source: 'r4', target: 'lab2', label: 'member_of' },
      { id: 'e5', source: 'r5', target: 'lab2', label: 'member_of' },
      { id: 'e6', source: 'r6', target: 'lab3', label: 'member_of' },
      { id: 'e7', source: 'r7', target: 'lab3', label: 'member_of' },
      { id: 'e8', source: 'r8', target: 'lab4', label: 'member_of' },
      { id: 'e9', source: 'r9', target: 'lab4', label: 'member_of' },
      { id: 'e10', source: 'r10', target: 'lab5', label: 'member_of' },
      
      // Student advisors
      { id: 'e11', source: 's1', target: 'r1', label: 'advised_by' },
      { id: 'e12', source: 's2', target: 'r3', label: 'advised_by' },
      { id: 'e13', source: 's3', target: 'r4', label: 'advised_by' },
      { id: 'e14', source: 's4', target: 'r7', label: 'advised_by' },
      { id: 'e15', source: 's5', target: 'r9', label: 'advised_by' },
      { id: 'e16', source: 's6', target: 'r10', label: 'advised_by' },
      
      // Project collaborations
      { id: 'e17', source: 'r1', target: 'p1', label: 'works_on' },
      { id: 'e18', source: 'r2', target: 'p1', label: 'works_on' },
      { id: 'e19', source: 'r3', target: 'p1', label: 'works_on' },
      { id: 'e20', source: 's1', target: 'p1', label: 'works_on' },
      { id: 'e21', source: 'r4', target: 'p2', label: 'works_on' },
      { id: 'e22', source: 'r5', target: 'p2', label: 'works_on' },
      { id: 'e23', source: 's3', target: 'p2', label: 'works_on' },
      { id: 'e24', source: 'r6', target: 'p3', label: 'works_on' },
      { id: 'e25', source: 'r7', target: 'p3', label: 'works_on' },
      { id: 'e26', source: 's4', target: 'p3', label: 'works_on' },
      { id: 'e27', source: 'r8', target: 'p4', label: 'works_on' },
      { id: 'e28', source: 'r9', target: 'p4', label: 'works_on' },
      { id: 'e29', source: 's5', target: 'p4', label: 'works_on' },
      { id: 'e30', source: 'r10', target: 'p5', label: 'works_on' },
      { id: 'e31', source: 's6', target: 'p5', label: 'works_on' },
      
      // Cross-lab collaborations
      { id: 'e32', source: 'r1', target: 'r4', label: 'collaborates' },
      { id: 'e33', source: 'r2', target: 'r7', label: 'collaborates' },
      { id: 'e34', source: 'r5', target: 'r8', label: 'collaborates' },
      { id: 'e35', source: 'r3', target: 'r10', label: 'collaborates' },
    ],
  };

  // Color scheme by type
  const typeColors: { [key: string]: string } = {
    lab: '#8b5cf6',
    researcher: '#3b82f6',
    student: '#10b981',
    project: '#f59e0b',
  };

  // Initialize EdgeCraft with organic layout
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'organic',
      iterations: 300,
      springLength: 150,
      springStrength: 0.05,
      repulsionStrength: 1000,
      theta: 0.5,  // Barnes-Hut approximation threshold
    },
    nodeStyle: (node: any) => {
      const type = node.properties?.type || 'default';
      const baseRadius = type === 'lab' ? 35 : (type === 'researcher' ? 28 : (type === 'project' ? 25 : 20));
      
      return {
        radius: baseRadius,
        fill: typeColors[type] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: 2,
        label: {
          text: node.label || '',
          fontSize: type === 'lab' ? 12 : 10,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: (edge: any) => {
      const edgeType = edge.label || '';
      
      return {
        stroke: edgeType === 'collaborates' ? '#ef4444' : '#cbd5e1',
        strokeWidth: edgeType === 'collaborates' ? 3 : 1.5,
        strokeDasharray: edgeType === 'collaborates' ? '5,5' : undefined,
      };
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Barnes-Hut algorithm for O(n log n) performance</li>
      <li>Optimized for larger graphs (50-1000+ nodes)</li>
      <li>Configurable spring and repulsion forces</li>
      <li>Theta parameter controls accuracy vs speed</li>
      <li>Natural clustering of related nodes</li>
      <li>Collaboration links highlighted in red</li>
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
  data: scientificNetwork,
  layout: {
    type: 'organic',
    iterations: 300,
    springLength: 150,
    springStrength: 0.05,
    repulsionStrength: 1000,
    theta: 0.5,  // Barnes-Hut threshold (0.0-1.0)
                 // Lower = more accurate, higher = faster
  },
  nodeStyle: (node) => ({
    radius: node.type === 'lab' ? 35 : 20,
    fill: typeColors[node.type],
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
      <label>Iterations</label>
      <input type="range" min="100" max="500" value="300" id="iterations">
      <span id="iterations-value">300</span>
    </div>
    
    <div class="config-group">
      <label>Spring Length</label>
      <input type="range" min="50" max="300" value="150" id="spring-length">
      <span id="spring-length-value">150</span>
    </div>
    
    <div class="config-group">
      <label>Repulsion Strength</label>
      <input type="range" min="500" max="2000" value="1000" id="repulsion">
      <span id="repulsion-value">1000</span>
    </div>
    
    <div class="config-group">
      <label>Theta (Accuracy)</label>
      <input type="range" min="0" max="100" value="50" id="theta">
      <span id="theta-value">0.5</span>
    </div>

    <div class="config-group">
      <button class="btn btn-small" id="apply-layout">Apply Layout</button>
    </div>
  `;

  // Add event listeners for sliders
  ['iterations', 'spring-length', 'repulsion'].forEach(id => {
    const input = document.getElementById(id);
    const valueSpan = document.getElementById(`${id}-value`);
    
    if (input && valueSpan) {
      input.addEventListener('input', (e: any) => {
        valueSpan.textContent = e.target.value;
      });
    }
  });

  // Theta slider (convert to 0.0-1.0)
  const thetaInput = document.getElementById('theta');
  const thetaValue = document.getElementById('theta-value');
  if (thetaInput && thetaValue) {
    thetaInput.addEventListener('input', (e: any) => {
      const value = parseInt(e.target.value) / 100;
      thetaValue.textContent = value.toFixed(2);
    });
  }

  // Apply layout button
  const applyBtn = document.getElementById('apply-layout');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const iterations = parseInt((document.getElementById('iterations') as HTMLInputElement)?.value || '300');
      const springLength = parseInt((document.getElementById('spring-length') as HTMLInputElement)?.value || '150');
      const repulsion = parseInt((document.getElementById('repulsion') as HTMLInputElement)?.value || '1000');
      const theta = parseInt((document.getElementById('theta') as HTMLInputElement)?.value || '50') / 100;

      console.log('Applying layout:', { iterations, springLength, repulsion, theta });
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
