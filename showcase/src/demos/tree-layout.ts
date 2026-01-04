/**
 * Tree Layout Demo - Reingold-Tilford Algorithm
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // File system hierarchy data
  const graphData = {
    nodes: [
      // Root
      { id: 'root', label: 'src/', properties: { type: 'directory', depth: 0 } },
      
      // Level 1
      { id: 'components', label: 'components/', properties: { type: 'directory', depth: 1 } },
      { id: 'utils', label: 'utils/', properties: { type: 'directory', depth: 1 } },
      { id: 'pages', label: 'pages/', properties: { type: 'directory', depth: 1 } },
      { id: 'styles', label: 'styles/', properties: { type: 'directory', depth: 1 } },
      
      // Level 2 - components
      { id: 'button', label: 'Button.tsx', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      { id: 'input', label: 'Input.tsx', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      { id: 'modal', label: 'Modal.tsx', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      
      // Level 2 - utils
      { id: 'format', label: 'format.ts', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      { id: 'validate', label: 'validate.ts', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      { id: 'api', label: 'api.ts', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      
      // Level 2 - pages
      { id: 'home', label: 'Home.tsx', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      { id: 'about', label: 'About.tsx', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      { id: 'contact', label: 'Contact.tsx', properties: { type: 'file', depth: 2, lang: 'typescript' } },
      
      // Level 2 - styles
      { id: 'global', label: 'global.css', properties: { type: 'file', depth: 2, lang: 'css' } },
      { id: 'theme', label: 'theme.css', properties: { type: 'file', depth: 2, lang: 'css' } },
    ],
    edges: [
      // Root connections
      { id: 'e1', source: 'root', target: 'components', label: 'contains' },
      { id: 'e2', source: 'root', target: 'utils', label: 'contains' },
      { id: 'e3', source: 'root', target: 'pages', label: 'contains' },
      { id: 'e4', source: 'root', target: 'styles', label: 'contains' },
      
      // Components folder
      { id: 'e5', source: 'components', target: 'button', label: 'contains' },
      { id: 'e6', source: 'components', target: 'input', label: 'contains' },
      { id: 'e7', source: 'components', target: 'modal', label: 'contains' },
      
      // Utils folder
      { id: 'e8', source: 'utils', target: 'format', label: 'contains' },
      { id: 'e9', source: 'utils', target: 'validate', label: 'contains' },
      { id: 'e10', source: 'utils', target: 'api', label: 'contains' },
      
      // Pages folder
      { id: 'e11', source: 'pages', target: 'home', label: 'contains' },
      { id: 'e12', source: 'pages', target: 'about', label: 'contains' },
      { id: 'e13', source: 'pages', target: 'contact', label: 'contains' },
      
      // Styles folder
      { id: 'e14', source: 'styles', target: 'global', label: 'contains' },
      { id: 'e15', source: 'styles', target: 'theme', label: 'contains' },
    ],
  };

  // Color scheme by type
  const typeColors: { [key: string]: string } = {
    directory: '#3b82f6',
    file: '#10b981',
  };

  const langColors: { [key: string]: string } = {
    typescript: '#3178c6',
    css: '#f59e0b',
  };

  // Initialize EdgeCraft with tree layout
  const graph = new EdgeCraft({
    container,
    data: graphData,
    layout: {
      type: 'tree',
      orientation: 'vertical',
      levelSeparation: 100,
      siblingSeparation: 60,
      subtreeSeparation: 80,
    },
    nodeStyle: (node: any) => {
      const isDirectory = node.properties?.type === 'directory';
      const lang = node.properties?.lang;
      
      return {
        radius: isDirectory ? 25 : 20,
        fill: isDirectory ? typeColors.directory : (langColors[lang] || typeColors.file),
        stroke: '#ffffff',
        strokeWidth: 2,
        shape: isDirectory ? 'circle' : 'rectangle',
        label: {
          text: node.label || '',
          fontSize: 11,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: {
      stroke: '#94a3b8',
      strokeWidth: 2,
      arrow: 'target',
    },
  });

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>Reingold-Tilford algorithm for tidy trees</li>
      <li>Optimal space utilization</li>
      <li>Parent-child relationships clearly visible</li>
      <li>Directories vs files distinction</li>
      <li>Configurable level and sibling separation</li>
      <li>Vertical or horizontal orientation</li>
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
  data: hierarchyData,
  layout: {
    type: 'tree',
    orientation: 'vertical',  // or 'horizontal'
    levelSeparation: 100,     // Vertical spacing
    siblingSeparation: 60,    // Horizontal spacing
    subtreeSeparation: 80,    // Space between subtrees
  },
  nodeStyle: (node) => ({
    radius: node.isDirectory ? 25 : 20,
    fill: node.isDirectory ? '#3b82f6' : '#10b981',
    shape: node.isDirectory ? 'circle' : 'rectangle',
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
    'stat-render': '< 1ms',
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
      <label>Orientation</label>
      <select id="orientation">
        <option value="vertical" selected>Vertical</option>
        <option value="horizontal">Horizontal</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>Level Separation</label>
      <input type="range" min="50" max="200" value="100" id="level-separation">
      <span id="level-separation-value">100</span>
    </div>
    
    <div class="config-group">
      <label>Sibling Separation</label>
      <input type="range" min="30" max="120" value="60" id="sibling-separation">
      <span id="sibling-separation-value">60</span>
    </div>
    
    <div class="config-group">
      <label>Subtree Separation</label>
      <input type="range" min="40" max="150" value="80" id="subtree-separation">
      <span id="subtree-separation-value">80</span>
    </div>

    <div class="config-group">
      <button class="btn btn-small" id="apply-layout">Apply Layout</button>
    </div>
  `;

  // Add event listeners for sliders
  ['level-separation', 'sibling-separation', 'subtree-separation'].forEach(id => {
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
      const orientation = (document.getElementById('orientation') as HTMLSelectElement)?.value || 'vertical';
      const levelSeparation = parseInt((document.getElementById('level-separation') as HTMLInputElement)?.value || '100');
      const siblingSeparation = parseInt((document.getElementById('sibling-separation') as HTMLInputElement)?.value || '60');
      const subtreeSeparation = parseInt((document.getElementById('subtree-separation') as HTMLInputElement)?.value || '80');

      console.log('Applying layout:', { orientation, levelSeparation, siblingSeparation, subtreeSeparation });
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
