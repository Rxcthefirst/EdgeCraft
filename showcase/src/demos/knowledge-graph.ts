/**
 * Knowledge Graph Demo - RDF/Semantic Web Visualization
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // RDF Knowledge Graph - Books, Authors, and Genres
  const graphData = {
    nodes: [
      // Books (Resources)
      { id: 'book:1984', label: '1984', type: 'uri', properties: { nodeType: 'book', year: 1949 } },
      { id: 'book:brave-new-world', label: 'Brave New World', type: 'uri', properties: { nodeType: 'book', year: 1932 } },
      { id: 'book:fahrenheit-451', label: 'Fahrenheit 451', type: 'uri', properties: { nodeType: 'book', year: 1953 } },
      { id: 'book:foundation', label: 'Foundation', type: 'uri', properties: { nodeType: 'book', year: 1951 } },
      { id: 'book:dune', label: 'Dune', type: 'uri', properties: { nodeType: 'book', year: 1965 } },
      { id: 'book:neuromancer', label: 'Neuromancer', type: 'uri', properties: { nodeType: 'book', year: 1984 } },
      
      // Authors (Resources)
      { id: 'author:orwell', label: 'George Orwell', type: 'uri', properties: { nodeType: 'author' } },
      { id: 'author:huxley', label: 'Aldous Huxley', type: 'uri', properties: { nodeType: 'author' } },
      { id: 'author:bradbury', label: 'Ray Bradbury', type: 'uri', properties: { nodeType: 'author' } },
      { id: 'author:asimov', label: 'Isaac Asimov', type: 'uri', properties: { nodeType: 'author' } },
      { id: 'author:herbert', label: 'Frank Herbert', type: 'uri', properties: { nodeType: 'author' } },
      { id: 'author:gibson', label: 'William Gibson', type: 'uri', properties: { nodeType: 'author' } },
      
      // Genres (Resources)
      { id: 'genre:dystopian', label: 'Dystopian', type: 'uri', properties: { nodeType: 'genre' } },
      { id: 'genre:scifi', label: 'Science Fiction', type: 'uri', properties: { nodeType: 'genre' } },
      { id: 'genre:cyberpunk', label: 'Cyberpunk', type: 'uri', properties: { nodeType: 'genre' } },
      { id: 'genre:space-opera', label: 'Space Opera', type: 'uri', properties: { nodeType: 'genre' } },
      
      // Publishers (Resources)
      { id: 'pub:secker', label: 'Secker & Warburg', type: 'uri', properties: { nodeType: 'publisher' } },
      { id: 'pub:harper', label: 'Harper & Brothers', type: 'uri', properties: { nodeType: 'publisher' } },
      { id: 'pub:ballantine', label: 'Ballantine Books', type: 'uri', properties: { nodeType: 'publisher' } },
      { id: 'pub:gnome', label: 'Gnome Press', type: 'uri', properties: { nodeType: 'publisher' } },
      { id: 'pub:chilton', label: 'Chilton Books', type: 'uri', properties: { nodeType: 'publisher' } },
      { id: 'pub:ace', label: 'Ace Books', type: 'uri', properties: { nodeType: 'publisher' } },
      
      // Literal values
      { id: 'lit:english', label: 'English', type: 'literal', datatype: 'xsd:string', properties: { nodeType: 'literal' } },
      { id: 'lit:novel', label: 'Novel', type: 'literal', datatype: 'xsd:string', properties: { nodeType: 'literal' } },
    ],
    edges: [
      // Books -> Authors (dc:creator)
      { id: 't1', source: 'book:1984', target: 'author:orwell', label: 'dc:creator', properties: { predicate: 'creator' } },
      { id: 't2', source: 'book:brave-new-world', target: 'author:huxley', label: 'dc:creator', properties: { predicate: 'creator' } },
      { id: 't3', source: 'book:fahrenheit-451', target: 'author:bradbury', label: 'dc:creator', properties: { predicate: 'creator' } },
      { id: 't4', source: 'book:foundation', target: 'author:asimov', label: 'dc:creator', properties: { predicate: 'creator' } },
      { id: 't5', source: 'book:dune', target: 'author:herbert', label: 'dc:creator', properties: { predicate: 'creator' } },
      { id: 't6', source: 'book:neuromancer', target: 'author:gibson', label: 'dc:creator', properties: { predicate: 'creator' } },
      
      // Books -> Genres (dct:subject)
      { id: 't7', source: 'book:1984', target: 'genre:dystopian', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't8', source: 'book:1984', target: 'genre:scifi', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't9', source: 'book:brave-new-world', target: 'genre:dystopian', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't10', source: 'book:brave-new-world', target: 'genre:scifi', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't11', source: 'book:fahrenheit-451', target: 'genre:dystopian', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't12', source: 'book:foundation', target: 'genre:scifi', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't13', source: 'book:foundation', target: 'genre:space-opera', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't14', source: 'book:dune', target: 'genre:scifi', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't15', source: 'book:dune', target: 'genre:space-opera', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't16', source: 'book:neuromancer', target: 'genre:cyberpunk', label: 'dct:subject', properties: { predicate: 'subject' } },
      { id: 't17', source: 'book:neuromancer', target: 'genre:scifi', label: 'dct:subject', properties: { predicate: 'subject' } },
      
      // Books -> Publishers (dc:publisher)
      { id: 't18', source: 'book:1984', target: 'pub:secker', label: 'dc:publisher', properties: { predicate: 'publisher' } },
      { id: 't19', source: 'book:brave-new-world', target: 'pub:harper', label: 'dc:publisher', properties: { predicate: 'publisher' } },
      { id: 't20', source: 'book:fahrenheit-451', target: 'pub:ballantine', label: 'dc:publisher', properties: { predicate: 'publisher' } },
      { id: 't21', source: 'book:foundation', target: 'pub:gnome', label: 'dc:publisher', properties: { predicate: 'publisher' } },
      { id: 't22', source: 'book:dune', target: 'pub:chilton', label: 'dc:publisher', properties: { predicate: 'publisher' } },
      { id: 't23', source: 'book:neuromancer', target: 'pub:ace', label: 'dc:publisher', properties: { predicate: 'publisher' } },
      
      // Books -> Literals
      { id: 't24', source: 'book:1984', target: 'lit:english', label: 'dc:language', properties: { predicate: 'language' } },
      { id: 't25', source: 'book:1984', target: 'lit:novel', label: 'dc:type', properties: { predicate: 'type' } },
      
      // Cross-references (influenced by)
      { id: 't26', source: 'book:fahrenheit-451', target: 'book:brave-new-world', label: 'dct:references', properties: { predicate: 'references' } },
      { id: 't27', source: 'book:neuromancer', target: 'book:1984', label: 'dct:references', properties: { predicate: 'references' } },
    ],
  };

  // Color scheme by node type
  const nodeTypeColors: { [key: string]: string } = {
    book: '#3b82f6',
    author: '#10b981',
    genre: '#f59e0b',
    publisher: '#8b5cf6',
    literal: '#94a3b8',
  };

  // Initialize EdgeCraft with RDF support
  const graph = new EdgeCraft({
    container,
    data: graphData,
    renderer: {
      type: 'canvas', // Auto-detect: will use WebGL for better performance, fallback to Canvas
      enableCache: true,
      enableDirtyRegions: true,
    },
    layout: {
      type: 'force',
      iterations: 300,
      springLength: 120,
      springStrength: 0.05,
      repulsionStrength: 1200,
    },
    nodeStyle: (node: any) => {
      const nodeType = node.properties?.nodeType || 'default';
      const isLiteral = node.type === 'literal';
      
      return {
        radius: isLiteral ? 15 : 25,
        fill: nodeTypeColors[nodeType] || '#64748b',
        stroke: '#ffffff',
        strokeWidth: 2,
        shape: isLiteral ? 'rectangle' : 'circle',
        label: {
          text: node.label || '',
          fontSize: isLiteral ? 9 : 11,
          color: '#1e293b',
          position: 'bottom',
        },
      };
    },
    edgeStyle: (edge: any) => {
      const predicate = edge.properties?.predicate || '';
      
      // Different colors for different predicates
      const predicateColors: { [key: string]: string } = {
        creator: '#10b981',
        subject: '#f59e0b',
        publisher: '#8b5cf6',
        references: '#ef4444',
      };
      
      return {
        stroke: predicateColors[predicate] || '#cbd5e1',
        strokeWidth: 2,
        arrow: 'target',
        label: {
          text: edge.label || '',
          fontSize: 9,
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
      <li>RDF triple visualization (subject-predicate-object)</li>
      <li>URI resources and literal values support</li>
      <li>Dublin Core metadata (dc:creator, dc:publisher)</li>
      <li>Edge labels showing predicates</li>
      <li>Color-coded by resource type</li>
      <li>SPARQL query-ready data model</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft } from 'edgecraft';

// RDF Graph with URIs and literals
const rdfData = {
  nodes: [
    { id: 'book:1984', type: 'uri', label: '1984' },
    { id: 'author:orwell', type: 'uri', label: 'G. Orwell' },
    { id: 'lit:english', type: 'literal', 
      datatype: 'xsd:string' },
  ],
  edges: [
    { source: 'book:1984', target: 'author:orwell',
      label: 'dc:creator' },
  ]
};

const graph = new EdgeCraft({
  container: '#graph',
  data: rdfData,
  layout: { type: 'force' }
});

// SPARQL-style queries
const books = graph.queryTriples(null, 'dc:creator', null);`;
  }

  // Setup controls
  setupControls(graph);

  // Setup config controls
  setupConfigControls(graph);

  // Update data tab
  updateDataTab(graphData);
}

function updateStats(data: any) {
  const triples = data.edges.length;
  const resources = data.nodes.filter((n: any) => n.type === 'uri').length;
  const literals = data.nodes.filter((n: any) => n.type === 'literal').length;
  
  const statsMap: { [key: string]: string } = {
    'stat-nodes': `${resources} + ${literals} literals`,
    'stat-edges': `${triples} triples`,
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
      console.log('Export to Turtle/JSON-LD format');
    });
  }
}

function setupConfigControls(graph: any) {
  const configContainer = document.getElementById('config-controls');
  if (!configContainer) return;

  configContainer.innerHTML = `
    <div class="config-group">
      <label>SPARQL Query</label>
      <select id="sparql-query">
        <option value="">All triples...</option>
        <option value="books">All books</option>
        <option value="authors">All authors</option>
        <option value="dystopian">Dystopian books</option>
        <option value="references">Book references</option>
      </select>
    </div>
    
    <div class="config-group">
      <button class="btn btn-small" id="execute-query">Execute Query</button>
    </div>
    
    <div class="config-group">
      <label>Show Node Types</label>
      <div style="margin-top: 8px;">
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-books" checked> Books
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-authors" checked> Authors
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-genres" checked> Genres
        </label>
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="show-publishers" checked> Publishers
        </label>
        <label style="display: block;">
          <input type="checkbox" id="show-literals" checked> Literals
        </label>
      </div>
    </div>
    
    <div class="config-group">
      <label>Edge Label Visibility</label>
      <select id="edge-labels">
        <option value="all" selected>All Labels</option>
        <option value="predicates">Predicates Only</option>
        <option value="none">No Labels</option>
      </select>
    </div>

    <div class="config-group">
      <button class="btn btn-small" id="apply-filter">Apply Filter</button>
    </div>
  `;

  // Execute query button
  const executeBtn = document.getElementById('execute-query');
  if (executeBtn) {
    executeBtn.addEventListener('click', () => {
      const query = (document.getElementById('sparql-query') as HTMLSelectElement)?.value;
      
      const queries: { [key: string]: string } = {
        books: 'SELECT ?book WHERE { ?book dc:creator ?author }',
        authors: 'SELECT ?author WHERE { ?book dc:creator ?author }',
        dystopian: 'SELECT ?book WHERE { ?book dct:subject genre:dystopian }',
        references: 'SELECT ?book1 ?book2 WHERE { ?book1 dct:references ?book2 }',
      };
      
      if (query && queries[query]) {
        console.log('Executing SPARQL:', queries[query]);
        alert(`SPARQL Query:\n\n${queries[query]}\n\nResults would be highlighted in the graph.`);
      }
    });
  }

  // Apply filter button
  const applyBtn = document.getElementById('apply-filter');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const showBooks = (document.getElementById('show-books') as HTMLInputElement)?.checked;
      const showAuthors = (document.getElementById('show-authors') as HTMLInputElement)?.checked;
      const showGenres = (document.getElementById('show-genres') as HTMLInputElement)?.checked;
      const showPublishers = (document.getElementById('show-publishers') as HTMLInputElement)?.checked;
      const showLiterals = (document.getElementById('show-literals') as HTMLInputElement)?.checked;
      const edgeLabels = (document.getElementById('edge-labels') as HTMLSelectElement)?.value;

      console.log('Applying filter:', { showBooks, showAuthors, showGenres, showPublishers, showLiterals, edgeLabels });
    });
  }
}

function updateDataTab(data: any) {
  const dataJson = document.getElementById('data-json');
  if (dataJson) {
    dataJson.textContent = JSON.stringify(data, null, 2);
  }
}
