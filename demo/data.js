// Sample data for different graph types

const socialNetworkData = {
  nodes: [
    { id: 1, labels: ['Person'], properties: { name: 'Alice', age: 30, role: 'Engineer' } },
    { id: 2, labels: ['Person'], properties: { name: 'Bob', age: 35, role: 'Manager' } },
    { id: 3, labels: ['Person'], properties: { name: 'Charlie', age: 28, role: 'Designer' } },
    { id: 4, labels: ['Person'], properties: { name: 'Diana', age: 32, role: 'Engineer' } },
    { id: 5, labels: ['Person'], properties: { name: 'Eve', age: 29, role: 'Engineer' } },
    { id: 6, labels: ['Company'], properties: { name: 'Tech Corp', employees: 500 } },
    { id: 7, labels: ['Company'], properties: { name: 'StartupXYZ', employees: 50 } },
    { id: 8, labels: ['Project'], properties: { name: 'EdgeCraft', status: 'active' } },
    { id: 9, labels: ['Project'], properties: { name: 'GraphDB', status: 'completed' } }
  ],
  edges: [
    { id: 'e1', source: 1, target: 2, label: 'KNOWS', properties: { since: 2015 } },
    { id: 'e2', source: 2, target: 3, label: 'KNOWS', properties: { since: 2018 } },
    { id: 'e3', source: 1, target: 3, label: 'KNOWS', properties: { since: 2020 } },
    { id: 'e4', source: 1, target: 4, label: 'KNOWS', properties: { since: 2019 } },
    { id: 'e5', source: 4, target: 5, label: 'KNOWS', properties: { since: 2021 } },
    { id: 'e6', source: 1, target: 6, label: 'WORKS_AT', properties: { role: 'Senior Engineer' } },
    { id: 'e7', source: 2, target: 6, label: 'WORKS_AT', properties: { role: 'Engineering Manager' } },
    { id: 'e8', source: 4, target: 6, label: 'WORKS_AT', properties: { role: 'Engineer' } },
    { id: 'e9', source: 5, target: 6, label: 'WORKS_AT', properties: { role: 'Engineer' } },
    { id: 'e10', source: 3, target: 7, label: 'WORKS_AT', properties: { role: 'Lead Designer' } },
    { id: 'e11', source: 1, target: 8, label: 'CONTRIBUTES_TO', properties: {} },
    { id: 'e12', source: 4, target: 8, label: 'CONTRIBUTES_TO', properties: {} },
    { id: 'e13', source: 2, target: 9, label: 'CONTRIBUTES_TO', properties: {} }
  ]
};

const rdfData = {
  nodes: [
    { id: 'alice', type: 'uri', value: 'http://example.org/alice' },
    { id: 'bob', type: 'uri', value: 'http://example.org/bob' },
    { id: 'charlie', type: 'uri', value: 'http://example.org/charlie' },
    { id: 'name_alice', type: 'literal', value: 'Alice Johnson', datatype: 'xsd:string' },
    { id: 'name_bob', type: 'literal', value: 'Bob Smith', datatype: 'xsd:string' },
    { id: 'name_charlie', type: 'literal', value: 'Charlie Brown', datatype: 'xsd:string' },
    { id: 'age_alice', type: 'literal', value: '30', datatype: 'xsd:integer' },
    { id: 'age_bob', type: 'literal', value: '35', datatype: 'xsd:integer' },
    { id: 'email_alice', type: 'literal', value: 'alice@example.org', datatype: 'xsd:string' }
  ],
  edges: [
    { id: 't1', subject: 'alice', predicate: 'foaf:knows', object: 'bob' },
    { id: 't2', subject: 'bob', predicate: 'foaf:knows', object: 'charlie' },
    { id: 't3', subject: 'alice', predicate: 'foaf:knows', object: 'charlie' },
    { id: 't4', subject: 'alice', predicate: 'foaf:name', object: 'name_alice' },
    { id: 't5', subject: 'bob', predicate: 'foaf:name', object: 'name_bob' },
    { id: 't6', subject: 'charlie', predicate: 'foaf:name', object: 'name_charlie' },
    { id: 't7', subject: 'alice', predicate: 'foaf:age', object: 'age_alice' },
    { id: 't8', subject: 'bob', predicate: 'foaf:age', object: 'age_bob' },
    { id: 't9', subject: 'alice', predicate: 'foaf:mbox', object: 'email_alice' }
  ]
};
// Inverse Relationship Demo Data
const inverseRelationshipData = {
  nodes: [
    { id: 'john', type: 'uri', value: 'http://example.org/john', properties: { name: 'John Smith', role: 'CEO' } },
    { id: 'ralph', type: 'uri', value: 'http://example.org/ralph', properties: { name: 'Ralph Jones', role: 'Engineer' } },
    { id: 'sarah', type: 'uri', value: 'http://example.org/sarah', properties: { name: 'Sarah Lee', role: 'Designer' } },
    { id: 'mike', type: 'uri', value: 'http://example.org/mike', properties: { name: 'Mike Brown', role: 'Manager' } },
    { id: 'lisa', type: 'uri', value: 'http://example.org/lisa', properties: { name: 'Lisa Davis', role: 'Engineer' } },
    { id: 'company', type: 'uri', value: 'http://example.org/techcorp', properties: { name: 'TechCorp Inc' } }
  ],
  edges: [
    // Inverse relationship: employs <-> employedBy
    { 
      id: 'emp1', 
      subject: 'john', 
      predicate: 'employs', 
      object: 'ralph',
      forwardPredicate: 'employs',
      inversePredicate: 'employedBy'
    },
    { 
      id: 'emp2', 
      subject: 'john', 
      predicate: 'employs', 
      object: 'sarah',
      forwardPredicate: 'employs',
      inversePredicate: 'employedBy'
    },
    
    // Inverse relationship: supervises <-> supervisedBy
    { 
      id: 'sup1', 
      subject: 'mike', 
      predicate: 'supervises', 
      object: 'ralph',
      forwardPredicate: 'supervises',
      inversePredicate: 'supervisedBy'
    },
    { 
      id: 'sup2', 
      subject: 'mike', 
      predicate: 'supervises', 
      object: 'lisa',
      forwardPredicate: 'supervises',
      inversePredicate: 'supervisedBy'
    },
    
    // Symmetric relationship: friend (both directions, same predicate)
    { 
      id: 'friend1', 
      subject: 'ralph', 
      predicate: 'friend', 
      object: 'sarah'
    },
    
    // Asymmetric relationship: reports to (single direction, inverse not yet learned)
    { 
      id: 'report1', 
      subject: 'lisa', 
      predicate: 'reportsTo', 
      object: 'mike'
    },
    
    // Multiple relationships between same nodes
    { 
      id: 'mentor1', 
      subject: 'john', 
      predicate: 'mentors', 
      object: 'mike',
      forwardPredicate: 'mentors',
      inversePredicate: 'mentoredBy'
    }
  ]
};
const orgChartData = {
  nodes: [
    { id: 1, labels: ['Person'], properties: { name: 'CEO Sarah', title: 'Chief Executive Officer' } },
    { id: 2, labels: ['Person'], properties: { name: 'CTO Mike', title: 'Chief Technology Officer' } },
    { id: 3, labels: ['Person'], properties: { name: 'CFO Lisa', title: 'Chief Financial Officer' } },
    { id: 4, labels: ['Person'], properties: { name: 'Dev Lead John', title: 'Development Lead' } },
    { id: 5, labels: ['Person'], properties: { name: 'QA Lead Emma', title: 'QA Lead' } },
    { id: 6, labels: ['Person'], properties: { name: 'Designer Tom', title: 'Senior Designer' } },
    { id: 7, labels: ['Person'], properties: { name: 'Dev Alice', title: 'Software Engineer' } },
    { id: 8, labels: ['Person'], properties: { name: 'Dev Bob', title: 'Software Engineer' } },
    { id: 9, labels: ['Person'], properties: { name: 'QA Jane', title: 'QA Engineer' } },
    { id: 10, labels: ['Department'], properties: { name: 'Engineering', budget: '5M' } },
    { id: 11, labels: ['Department'], properties: { name: 'Finance', budget: '2M' } }
  ],
  edges: [
    { id: 'e1', source: 2, target: 1, label: 'REPORTS_TO', properties: {} },
    { id: 'e2', source: 3, target: 1, label: 'REPORTS_TO', properties: {} },
    { id: 'e3', source: 4, target: 2, label: 'REPORTS_TO', properties: {} },
    { id: 'e4', source: 5, target: 2, label: 'REPORTS_TO', properties: {} },
    { id: 'e5', source: 6, target: 2, label: 'REPORTS_TO', properties: {} },
    { id: 'e6', source: 7, target: 4, label: 'REPORTS_TO', properties: {} },
    { id: 'e7', source: 8, target: 4, label: 'REPORTS_TO', properties: {} },
    { id: 'e8', source: 9, target: 5, label: 'REPORTS_TO', properties: {} },
    { id: 'e9', source: 2, target: 10, label: 'MANAGES', properties: {} },
    { id: 'e10', source: 3, target: 11, label: 'MANAGES', properties: {} }
  ]
};

const dependencyData = {
  nodes: [
    { id: 1, labels: ['Package'], properties: { name: 'edgecraft', version: '0.1.0' } },
    { id: 2, labels: ['Package'], properties: { name: 'd3-force', version: '3.0.0' } },
    { id: 3, labels: ['Package'], properties: { name: 'd3-selection', version: '3.0.0' } },
    { id: 4, labels: ['Package'], properties: { name: 'd3-zoom', version: '3.0.0' } },
    { id: 5, labels: ['Package'], properties: { name: 'd3-drag', version: '3.0.0' } },
    { id: 6, labels: ['Package'], properties: { name: 'typescript', version: '5.3.3' } },
    { id: 7, labels: ['Package'], properties: { name: 'rollup', version: '4.9.1' } },
    { id: 8, labels: ['Module'], properties: { name: 'Graph.ts', lines: 250 } },
    { id: 9, labels: ['Module'], properties: { name: 'Renderer.ts', lines: 320 } },
    { id: 10, labels: ['Module'], properties: { name: 'LayoutEngine.ts', lines: 280 } },
    { id: 11, labels: ['Module'], properties: { name: 'EdgeCraft.ts', lines: 180 } }
  ],
  edges: [
    { id: 'e1', source: 1, target: 2, label: 'DEPENDS_ON', properties: {} },
    { id: 'e2', source: 1, target: 3, label: 'DEPENDS_ON', properties: {} },
    { id: 'e3', source: 1, target: 4, label: 'DEPENDS_ON', properties: {} },
    { id: 'e4', source: 1, target: 5, label: 'DEPENDS_ON', properties: {} },
    { id: 'e5', source: 1, target: 6, label: 'DEPENDS_ON', properties: { type: 'dev' } },
    { id: 'e6', source: 1, target: 7, label: 'DEPENDS_ON', properties: { type: 'dev' } },
    { id: 'e7', source: 11, target: 8, label: 'IMPORTS', properties: {} },
    { id: 'e8', source: 11, target: 9, label: 'IMPORTS', properties: {} },
    { id: 'e9', source: 11, target: 10, label: 'IMPORTS', properties: {} },
    { id: 'e10', source: 9, target: 3, label: 'USES', properties: {} },
    { id: 'e11', source: 10, target: 2, label: 'USES', properties: {} }
  ]
};

// Advanced example with association classes and complex node styling
const knowledgeGraphData = {
  nodes: [
    // People
    { id: 'person1', labels: ['Person'], properties: { 
      name: 'Dr. Alice Chen', 
      title: 'Lead Researcher',
      email: 'alice@university.edu',
      icon: '👩‍🔬'
    }},
    { id: 'person2', labels: ['Person'], properties: { 
      name: 'Prof. Bob Smith', 
      title: 'Department Head',
      email: 'bob@university.edu',
      icon: '👨‍🏫'
    }},
    { id: 'person3', labels: ['Person'], properties: { 
      name: 'Carol Johnson', 
      title: 'PhD Candidate',
      email: 'carol@university.edu',
      icon: '👩‍🎓'
    }},
    
    // Organizations
    { id: 'org1', labels: ['Organization'], properties: { 
      name: 'MIT Research Lab',
      type: 'Research Institution',
      location: 'Cambridge, MA',
      icon: '🏛️'
    }},
    { id: 'org2', labels: ['Organization'], properties: { 
      name: 'TechCorp Inc',
      type: 'Corporate Partner',
      employees: '5000+',
      icon: '🏢'
    }},
    
    // Projects
    { id: 'proj1', labels: ['Project'], properties: { 
      name: 'AI Ethics Framework',
      status: 'Active',
      budget: '$2M',
      icon: '🤖'
    }},
    { id: 'proj2', labels: ['Project'], properties: { 
      name: 'Graph Visualization',
      status: 'Completed',
      duration: '2 years',
      icon: '📊'
    }},
    
    // Publications
    { id: 'pub1', labels: ['Publication'], properties: { 
      title: 'Machine Learning in Healthcare',
      year: '2024',
      citations: '152',
      icon: '📄'
    }},
    { id: 'pub2', labels: ['Publication'], properties: { 
      title: 'Graph Theory Applications',
      year: '2023',
      citations: '89',
      icon: '📄'
    }},
    
    // Skills/Topics
    { id: 'skill1', labels: ['Skill'], properties: { 
      name: 'Machine Learning',
      level: 'Expert',
      icon: '🧠'
    }},
    { id: 'skill2', labels: ['Skill'], properties: { 
      name: 'Data Visualization',
      level: 'Advanced',
      icon: '📈'
    }},
    
    // Association Classes (N-ary relationships)
    { id: 'collab1', labels: ['Collaboration'], properties: {
      role: 'Principal Investigator',
      startDate: '2023-01',
      contribution: '40%',
      icon: '🤝'
    }},
    { id: 'collab2', labels: ['Collaboration'], properties: {
      role: 'Co-Investigator',
      startDate: '2023-01',
      contribution: '30%',
      icon: '🤝'
    }},
    { id: 'authorship1', labels: ['Authorship'], properties: {
      role: 'First Author',
      orderPosition: 1,
      icon: '✍️'
    }},
    { id: 'employment1', labels: ['Employment'], properties: {
      position: 'Senior Researcher',
      startDate: '2020-06',
      type: 'Full-time',
      icon: '💼'
    }}
  ],
  edges: [
    // Person to Collaboration associations
    { id: 'e1', source: 'person1', target: 'collab1', label: 'PARTICIPATES_IN', properties: {} },
    { id: 'e2', source: 'collab1', target: 'proj1', label: 'ON_PROJECT', properties: {} },
    { id: 'e3', source: 'person2', target: 'collab2', label: 'PARTICIPATES_IN', properties: {} },
    { id: 'e4', source: 'collab2', target: 'proj1', label: 'ON_PROJECT', properties: {} },
    
    // Authorship associations
    { id: 'e5', source: 'person1', target: 'authorship1', label: 'AUTHORED', properties: {} },
    { id: 'e6', source: 'authorship1', target: 'pub1', label: 'PAPER', properties: {} },
    
    // Employment associations
    { id: 'e7', source: 'person1', target: 'employment1', label: 'HAS_EMPLOYMENT', properties: {} },
    { id: 'e8', source: 'employment1', target: 'org1', label: 'AT_ORGANIZATION', properties: {} },
    
    // Direct relationships
    { id: 'e9', source: 'person3', target: 'person1', label: 'ADVISED_BY', properties: {} },
    { id: 'e10', source: 'person2', target: 'org1', label: 'WORKS_AT', properties: {} },
    { id: 'e11', source: 'proj2', target: 'org2', label: 'FUNDED_BY', properties: {} },
    { id: 'e12', source: 'person2', target: 'pub2', label: 'AUTHORED', properties: {} },
    { id: 'e13', source: 'person1', target: 'skill1', label: 'HAS_SKILL', properties: {} },
    { id: 'e14', source: 'person1', target: 'skill2', label: 'HAS_SKILL', properties: {} },
    { id: 'e15', source: 'person3', target: 'skill2', label: 'HAS_SKILL', properties: {} }
  ],
  associationClasses: [
    {
      id: 'collab1',
      name: 'Collaboration',
      sourceEdges: ['e1', 'e2'],
      properties: {
        role: 'Principal Investigator',
        startDate: '2023-01',
        contribution: '40%'
      }
    },
    {
      id: 'collab2',
      name: 'Collaboration',
      sourceEdges: ['e3', 'e4'],
      properties: {
        role: 'Co-Investigator',
        startDate: '2023-01',
        contribution: '30%'
      }
    },
    {
      id: 'authorship1',
      name: 'Authorship',
      sourceEdges: ['e5', 'e6'],
      properties: {
        role: 'First Author',
        orderPosition: 1
      }
    },
    {
      id: 'employment1',
      name: 'Employment',
      sourceEdges: ['e7', 'e8'],
      properties: {
        position: 'Senior Researcher',
        startDate: '2020-06',
        type: 'Full-time'
      }
    }
  ]
};

// Large graph for testing Canvas renderer performance (1000 nodes)
const largeGraphData = {
  nodes: [],
  edges: []
};

// Generate 1000 nodes in clusters
for (let i = 0; i < 1000; i++) {
  const cluster = Math.floor(i / 100);
  largeGraphData.nodes.push({
    id: i,
    labels: ['Node'],
    properties: {
      name: `Node ${i}`,
      cluster: cluster,
      value: Math.random() * 100
    }
  });
}

// Generate edges - each node connects to 2-5 other nodes
for (let i = 0; i < 1000; i++) {
  const edgeCount = 2 + Math.floor(Math.random() * 4);
  for (let j = 0; j < edgeCount; j++) {
    const target = Math.floor(Math.random() * 1000);
    if (target !== i) {
      largeGraphData.edges.push({
        id: `e${i}_${j}`,
        source: i,
        target: target,
        label: 'CONNECTS',
        properties: { weight: Math.random() }
      });
    }
  }
}

// Advanced Edge Features Demo Data
const advancedEdgesData = {
  nodes: [
    { id: 1, labels: ['State'], properties: { name: 'Idle', color: '#4CAF50' } },
    { id: 2, labels: ['State'], properties: { name: 'Processing', color: '#2196F3' } },
    { id: 3, labels: ['State'], properties: { name: 'Error', color: '#F44336' } },
    { id: 4, labels: ['State'], properties: { name: 'Complete', color: '#9C27B0' } },
    { id: 5, labels: ['Person'], properties: { name: 'Alice' } },
    { id: 6, labels: ['Person'], properties: { name: 'Bob' } },
    { id: 7, labels: ['Car'], properties: { name: 'Tesla Model 3' } },
    { id: 8, labels: ['Engine'], properties: { name: 'Electric Motor' } },
    { id: 9, labels: ['Wheel'], properties: { name: 'Front Left' } }
  ],
  edges: [
    // Multiple self-loops on same node (demonstrates bundling)
    { id: 'self1', source: 1, target: 1, label: 'wait', properties: {} },
    { id: 'self1b', source: 1, target: 1, label: 'idle', properties: {} },
    { id: 'self1c', source: 1, target: 1, label: 'ready', properties: {} },
    { id: 'self2', source: 3, target: 3, label: 'retry', properties: {} },
    { id: 'self2b', source: 3, target: 3, label: 'log', properties: {} },
    
    // Directed edges (state machine)
    { id: 'e1', source: 1, target: 2, label: 'start', properties: {} },
    { id: 'e2', source: 2, target: 4, label: 'success', properties: {} },
    { id: 'e3', source: 2, target: 3, label: 'error', properties: {} },
    { id: 'e4', source: 3, target: 1, label: 'reset', properties: {} },
    { id: 'e5', source: 4, target: 1, label: 'reset', properties: {} },
    
    // Bidirectional relationships
    { id: 'bi1', source: 5, target: 6, label: 'friend', properties: {} },
    { id: 'bi2', source: 6, target: 5, label: 'friend', properties: {} },
    
    // Multiple edges between same nodes (parallel relationships)
    { id: 'multi1', source: 5, target: 6, label: 'colleague', properties: {} },
    { id: 'multi2', source: 5, target: 6, label: 'neighbor', properties: {} },
    { id: 'multi3', source: 5, target: 6, label: 'classmate', properties: {} },
    
    // RDF-style inverse relationships (part-whole)
    { id: 'part1', source: 7, target: 8, label: 'hasPart', properties: { inverse: 'partOf' } },
    { id: 'part2', source: 7, target: 9, label: 'hasPart', properties: { inverse: 'partOf' } }
  ]
};

export { socialNetworkData, rdfData, orgChartData, dependencyData, knowledgeGraphData, largeGraphData, advancedEdgesData, inverseRelationshipData };

