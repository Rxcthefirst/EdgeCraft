/**
 * RDF Advanced Styling Demo - Finance Ontology with OWL, SKOS, and Association Classes
 * Demonstrates RDF's first-class edge support with rich property modeling
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Clear and setup container
  container.innerHTML = '';
  
  // Create main graph wrapper
  const graphWrapper = document.createElement('div');
  graphWrapper.style.position = 'relative';
  graphWrapper.style.width = '100%';
  graphWrapper.style.height = '100%';
  container.appendChild(graphWrapper);
  
  // Create graph canvas
  const graphCanvas = document.createElement('div');
  graphCanvas.id = 'rdf-graph';
  graphCanvas.style.width = '100%';
  graphCanvas.style.height = '100%';
  graphWrapper.appendChild(graphCanvas);
  
  // Create inspector container
  const inspectorContainer = document.createElement('div');
  inspectorContainer.id = 'rdf-inspector';
  inspectorContainer.style.position = 'absolute';
  inspectorContainer.style.bottom = '16px';
  inspectorContainer.style.right = '16px';
  inspectorContainer.style.zIndex = '100';
  graphWrapper.appendChild(inspectorContainer);

  // Finance domain RDF graph with OWL classes, SKOS concepts, individuals, and association classes
  const graphData = {
    nodes: [
      // OWL Classes (Ontology definitions)
      { 
        id: 'owl:Organization', 
        label: 'Organization\n(OWL Class)', 
        properties: { 
          type: 'owl:Class',
          rdfType: 'http://www.w3.org/2002/07/owl#Class',
          definition: 'An organized body of people with a particular purpose'
        } 
      },
      { 
        id: 'owl:Person', 
        label: 'Person\n(OWL Class)', 
        properties: { 
          type: 'owl:Class',
          rdfType: 'http://www.w3.org/2002/07/owl#Class',
          definition: 'A human being regarded as an individual'
        } 
      },
      { 
        id: 'owl:FinancialInstrument', 
        label: 'Financial\nInstrument\n(OWL Class)', 
        properties: { 
          type: 'owl:Class',
          rdfType: 'http://www.w3.org/2002/07/owl#Class',
          definition: 'A monetary contract between parties'
        } 
      },
      { 
        id: 'owl:Role', 
        label: 'Role\n(OWL Class)', 
        properties: { 
          type: 'owl:Class',
          rdfType: 'http://www.w3.org/2002/07/owl#Class',
          definition: 'A function assumed by an entity in a particular context'
        } 
      },

      // SKOS Concepts (Controlled vocabulary)
      { 
        id: 'skos:InvestmentBanking', 
        label: 'Investment\nBanking\n(SKOS Concept)', 
        properties: { 
          type: 'skos:Concept',
          rdfType: 'http://www.w3.org/2004/02/skos/core#Concept',
          prefLabel: 'Investment Banking',
          altLabel: 'IB',
          definition: 'Financial services for corporations and governments',
          inScheme: 'FinancialSectors'
        } 
      },
      { 
        id: 'skos:AssetManagement', 
        label: 'Asset\nManagement\n(SKOS Concept)', 
        properties: { 
          type: 'skos:Concept',
          rdfType: 'http://www.w3.org/2004/02/skos/core#Concept',
          prefLabel: 'Asset Management',
          definition: 'Investment management of assets',
          inScheme: 'FinancialSectors',
          broader: 'skos:InvestmentBanking'
        } 
      },
      { 
        id: 'skos:RiskManagement', 
        label: 'Risk\nManagement\n(SKOS Concept)', 
        properties: { 
          type: 'skos:Concept',
          rdfType: 'http://www.w3.org/2004/02/skos/core#Concept',
          prefLabel: 'Risk Management',
          definition: 'Identification, evaluation, and prioritization of risks',
          inScheme: 'FinancialSectors'
        } 
      },

      // Individuals (Instances)
      { 
        id: 'ind:GoldmanSachs', 
        label: 'Goldman Sachs', 
        properties: { 
          type: 'individual',
          rdfType: 'owl:Organization',
          name: 'The Goldman Sachs Group, Inc.',
          ticker: 'GS',
          founded: '1869',
          headquarters: 'New York, NY',
          employees: '45000',
          sector: 'skos:InvestmentBanking'
        } 
      },
      { 
        id: 'ind:JPMorgan', 
        label: 'JPMorgan Chase', 
        properties: { 
          type: 'individual',
          rdfType: 'owl:Organization',
          name: 'JPMorgan Chase & Co.',
          ticker: 'JPM',
          founded: '2000',
          headquarters: 'New York, NY',
          employees: '293000',
          sector: 'skos:InvestmentBanking'
        } 
      },
      { 
        id: 'ind:AliceJohnson', 
        label: 'Alice Johnson', 
        properties: { 
          type: 'individual',
          rdfType: 'owl:Person',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@gs.com',
          yearsExperience: '15',
          education: 'MBA, Harvard'
        } 
      },
      { 
        id: 'ind:BobSmith', 
        label: 'Bob Smith', 
        properties: { 
          type: 'individual',
          rdfType: 'owl:Person',
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob.smith@jpmorgan.com',
          yearsExperience: '12',
          education: 'MS Finance, MIT'
        } 
      },
      { 
        id: 'ind:CarolWilliams', 
        label: 'Carol Williams', 
        properties: { 
          type: 'individual',
          rdfType: 'owl:Person',
          firstName: 'Carol',
          lastName: 'Williams',
          email: 'carol.williams@gs.com',
          yearsExperience: '8',
          education: 'MBA, Wharton'
        } 
      },

      // Association Class Nodes (Employment relationships as reified nodes)
      { 
        id: 'emp:E001', 
        label: 'Employment\nE001', 
        properties: { 
          type: 'associationClass',
          rdfType: 'owl:Employment',
          employmentId: 'E001',
          position: 'Managing Director',
          department: 'Investment Banking',
          salary: '$450,000',
          startDate: '2015-03-01',
          status: 'Active',
          bonusEligible: true
        } 
      },
      { 
        id: 'emp:E002', 
        label: 'Employment\nE002', 
        properties: { 
          type: 'associationClass',
          rdfType: 'owl:Employment',
          employmentId: 'E002',
          position: 'Vice President',
          department: 'Risk Management',
          salary: '$280,000',
          startDate: '2018-06-15',
          status: 'Active',
          bonusEligible: true
        } 
      },
      { 
        id: 'emp:E003', 
        label: 'Employment\nE003', 
        properties: { 
          type: 'associationClass',
          rdfType: 'owl:Employment',
          employmentId: 'E003',
          position: 'Associate',
          department: 'Asset Management',
          salary: '$180,000',
          startDate: '2020-09-01',
          status: 'Active',
          bonusEligible: true
        } 
      },

      // Roles
      { 
        id: 'role:MD', 
        label: 'Managing\nDirector', 
        properties: { 
          type: 'individual',
          rdfType: 'owl:Role',
          title: 'Managing Director',
          level: 'Executive',
          responsibilities: 'Strategic direction, client relations'
        } 
      },
      { 
        id: 'role:VP', 
        label: 'Vice\nPresident', 
        properties: { 
          type: 'individual',
          rdfType: 'owl:Role',
          title: 'Vice President',
          level: 'Senior',
          responsibilities: 'Team management, project execution'
        } 
      },
    ],
    edges: [
      // OWL Class hierarchy (rdfs:subClassOf)
      { 
        id: 'e:subclass1', 
        subject: 'owl:Organization', 
        predicate: 'rdfs:subClassOf', 
        object: 'owl:Role',
        properties: {
          type: 'owl:subClassOf',
          label: 'subClassOf',
          definition: 'Organizations can have roles'
        }
      },

      // SKOS Concept hierarchy (skos:broader)
      { 
        id: 'e:broader1', 
        subject: 'skos:AssetManagement', 
        predicate: 'skos:broader', 
        object: 'skos:InvestmentBanking',
        properties: {
          type: 'skos:broader',
          label: 'broader',
          definition: 'Asset Management is a specialization of Investment Banking'
        }
      },

      // Instance type relationships (rdf:type)
      { 
        id: 'e:type1', 
        subject: 'ind:GoldmanSachs', 
        predicate: 'rdf:type', 
        object: 'owl:Organization',
        properties: {
          type: 'rdf:type',
          label: 'type',
          assertedBy: 'System',
          timestamp: '2024-01-15'
        }
      },
      { 
        id: 'e:type2', 
        subject: 'ind:JPMorgan', 
        predicate: 'rdf:type', 
        object: 'owl:Organization',
        properties: {
          type: 'rdf:type',
          label: 'type',
          assertedBy: 'System',
          timestamp: '2024-01-15'
        }
      },
      { 
        id: 'e:type3', 
        subject: 'ind:AliceJohnson', 
        predicate: 'rdf:type', 
        object: 'owl:Person',
        properties: {
          type: 'rdf:type',
          label: 'type',
          assertedBy: 'System',
          timestamp: '2024-01-15'
        }
      },
      { 
        id: 'e:type4', 
        subject: 'ind:BobSmith', 
        predicate: 'rdf:type', 
        object: 'owl:Person',
        properties: {
          type: 'rdf:type',
          label: 'type',
          assertedBy: 'System',
          timestamp: '2024-01-15'
        }
      },
      { 
        id: 'e:type5', 
        subject: 'ind:CarolWilliams', 
        predicate: 'rdf:type', 
        object: 'owl:Person',
        properties: {
          type: 'rdf:type',
          label: 'type',
          assertedBy: 'System',
          timestamp: '2024-01-15'
        }
      },

      // Association Class connections (Employment relationships as reified edges)
      // Person -> Employment
      { 
        id: 'e:employee1', 
        subject: 'ind:AliceJohnson', 
        predicate: 'hasEmployment', 
        object: 'emp:E001',
        properties: {
          type: 'hasEmployment',
          label: 'employed via',
          relationshipType: 'employment'
        }
      },
      { 
        id: 'e:employee2', 
        subject: 'ind:BobSmith', 
        predicate: 'hasEmployment', 
        object: 'emp:E002',
        properties: {
          type: 'hasEmployment',
          label: 'employed via',
          relationshipType: 'employment'
        }
      },
      { 
        id: 'e:employee3', 
        subject: 'ind:CarolWilliams', 
        predicate: 'hasEmployment', 
        object: 'emp:E003',
        properties: {
          type: 'hasEmployment',
          label: 'employed via',
          relationshipType: 'employment'
        }
      },

      // Employment -> Organization
      { 
        id: 'e:employer1', 
        subject: 'emp:E001', 
        predicate: 'withOrganization', 
        object: 'ind:GoldmanSachs',
        properties: {
          type: 'withOrganization',
          label: 'at organization',
          relationshipType: 'employment'
        }
      },
      { 
        id: 'e:employer2', 
        subject: 'emp:E002', 
        predicate: 'withOrganization', 
        object: 'ind:JPMorgan',
        properties: {
          type: 'withOrganization',
          label: 'at organization',
          relationshipType: 'employment'
        }
      },
      { 
        id: 'e:employer3', 
        subject: 'emp:E003', 
        predicate: 'withOrganization', 
        object: 'ind:GoldmanSachs',
        properties: {
          type: 'withOrganization',
          label: 'at organization',
          relationshipType: 'employment'
        }
      },

      // Employment -> Role
      { 
        id: 'e:hasRole1', 
        subject: 'emp:E001', 
        predicate: 'hasRole', 
        object: 'role:MD',
        properties: {
          type: 'hasRole',
          label: 'in role',
          effectiveDate: '2015-03-01'
        }
      },
      { 
        id: 'e:hasRole2', 
        subject: 'emp:E002', 
        predicate: 'hasRole', 
        object: 'role:VP',
        properties: {
          type: 'hasRole',
          label: 'in role',
          effectiveDate: '2018-06-15'
        }
      },

      // Organization sector relationships
      { 
        id: 'e:sector1', 
        subject: 'ind:GoldmanSachs', 
        predicate: 'operatesIn', 
        object: 'skos:InvestmentBanking',
        properties: {
          type: 'operatesIn',
          label: 'operates in',
          primarySector: true,
          since: '1869'
        }
      },
      { 
        id: 'e:sector2', 
        subject: 'ind:JPMorgan', 
        predicate: 'operatesIn', 
        object: 'skos:InvestmentBanking',
        properties: {
          type: 'operatesIn',
          label: 'operates in',
          primarySector: true,
          since: '2000'
        }
      },
      { 
        id: 'e:sector3', 
        subject: 'ind:GoldmanSachs', 
        predicate: 'operatesIn', 
        object: 'skos:AssetManagement',
        properties: {
          type: 'operatesIn',
          label: 'operates in',
          primarySector: false,
          since: '1990'
        }
      },
    ],
  };

  // Initialize EdgeCraft with advanced RDF styling using images and icons
  const graph = new EdgeCraft({
    container: graphCanvas,
    data: graphData,
    renderer: {
      type: 'canvas', // Force Canvas renderer
      enableCache: true,
      enableDirtyRegions: true,
    },
    layout: {
      type: 'hierarchical',
      direction: 'TB',
      levelSpacing: 150,
      nodeSpacing: 80,
    },
    nodeStyle: (node: any) => {
      const nodeType = node.properties?.type;
      
      // OWL Classes - SVG Icons
      if (nodeType === 'owl:Class') {
        return {
          radius: 45,
          fill: '#dbeafe',
          stroke: '#1e40af',
          strokeWidth: 4,
          shape: 'circle',
          image: {
            type: 'svg',
            data: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1e40af">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>`,
            width: 40,
            height: 40,
            scale: 1.0,
          },
          label: {
            text: node.label || '',
            fontSize: 11,
            color: '#1e3a8a',
            position: 'bottom',
            fontWeight: 'bold',
          },
        };
      }
      
      // SKOS Concepts - Font Icons (Material Icons style)
      if (nodeType === 'skos:Concept') {
        return {
          radius: 50,
          fill: '#fef3c7',
          stroke: '#d97706',
          strokeWidth: 3,
          shape: 'circle',
          image: {
            type: 'fonticon',
            fontIcon: {
              family: 'Material Icons',
              character: '💡', // Using emoji as fallback, would use actual font icon in production
              size: 32,
              color: '#d97706',
            },
            width: 40,
            height: 40,
          },
          label: {
            text: node.label || '',
            fontSize: 10,
            color: '#92400e',
            position: 'bottom',
            fontWeight: 'bold',
          },
        };
      }
      
      // Association Classes (Employment) - PNG Icons
      if (nodeType === 'associationClass') {
        return {
          radius: 40,
          fill: '#e9d5ff',
          stroke: '#7c3aed',
          strokeWidth: 3,
          shape: 'circle',
          image: {
            type: 'svg',
            data: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
            </svg>`,
            width: 36,
            height: 36,
          },
          label: {
            text: node.label || '',
            fontSize: 10,
            color: '#5b21b6',
            position: 'bottom',
            fontWeight: 'bold',
          },
        };
      }
      
      // Individuals - Different icons based on rdfType
      if (nodeType === 'individual') {
        if (node.properties.rdfType === 'owl:Organization') {
          return {
            radius: 38,
            fill: '#d1fae5',
            stroke: '#059669',
            strokeWidth: 3,
            shape: 'circle',
            image: {
              type: 'svg',
              data: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
              </svg>`,
              width: 34,
              height: 34,
            },
            label: {
              text: node.label || '',
              fontSize: 11,
              color: '#065f46',
              position: 'bottom',
              fontWeight: 'bold',
            },
          };
        }
        
        if (node.properties.rdfType === 'owl:Person') {
          return {
            radius: 35,
            fill: '#fecaca',
            stroke: '#dc2626',
            strokeWidth: 2,
            shape: 'circle',
            image: {
              type: 'svg',
              data: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>`,
              width: 30,
              height: 30,
            },
            label: {
              text: node.label || '',
              fontSize: 11,
              color: '#7f1d1d',
              position: 'bottom',
              fontWeight: 'normal',
            },
          };
        }
        
        if (node.properties.rdfType === 'owl:Role') {
          return {
            radius: 35,
            fill: '#ddd6fe',
            stroke: '#7c3aed',
            strokeWidth: 2,
            shape: 'circle',
            image: {
              type: 'svg',
              data: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>`,
              width: 30,
              height: 30,
            },
            label: {
              text: node.label || '',
              fontSize: 10,
              color: '#5b21b6',
              position: 'bottom',
            },
          };
        }
      }
      
      // Default styling
      return {
        radius: 30,
        fill: '#f3f4f6',
        stroke: '#6b7280',
        strokeWidth: 2,
        shape: 'circle',
        label: {
          text: node.label || '',
          fontSize: 10,
          color: '#1f2937',
          position: 'bottom',
        },
      };
    },
    edgeStyle: (edge: any) => {
      const edgeType = edge.properties?.type;
      
      // OWL subClassOf relationships
      if (edgeType === 'owl:subClassOf') {
        return {
          stroke: '#1e40af',
          strokeWidth: 3,
          strokeDasharray: '5,5',
          arrow: 'target',
          label: {
            text: 'subClassOf',
            fontSize: 10,
            color: '#1e3a8a',
            backgroundColor: '#ffffff',
          },
        };
      }
      
      // SKOS broader relationships
      if (edgeType === 'skos:broader') {
        return {
          stroke: '#d97706',
          strokeWidth: 2,
          strokeDasharray: '8,4',
          arrow: 'target',
          label: {
            text: 'broader',
            fontSize: 9,
            color: '#92400e',
            backgroundColor: '#fef3c7',
          },
        };
      }
      
      // RDF type relationships
      if (edgeType === 'rdf:type') {
        return {
          stroke: '#6b7280',
          strokeWidth: 2,
          strokeDasharray: '2,2',
          arrow: 'target',
          label: {
            text: 'type',
            fontSize: 8,
            color: '#4b5563',
            backgroundColor: '#f9fafb',
          },
        };
      }
      
      // Employment relationships - hasEmployment
      if (edgeType === 'hasEmployment') {
        return {
          stroke: '#dc2626',
          strokeWidth: 2,
          arrow: 'target',
          label: {
            text: 'employed via',
            fontSize: 9,
            color: '#991b1b',
            backgroundColor: '#fef2f2',
          },
        };
      }
      
      // Employment relationships - withOrganization
      if (edgeType === 'withOrganization') {
        return {
          stroke: '#059669',
          strokeWidth: 2,
          arrow: 'target',
          label: {
            text: 'at org',
            fontSize: 9,
            color: '#065f46',
            backgroundColor: '#f0fdf4',
          },
        };
      }
      
      // Employment relationships - hasRole
      if (edgeType === 'hasRole') {
        return {
          stroke: '#7c3aed',
          strokeWidth: 2,
          arrow: 'target',
          label: {
            text: 'in role',
            fontSize: 9,
            color: '#5b21b6',
            backgroundColor: '#faf5ff',
          },
        };
      }
      
      // Sector relationships
      if (edgeType === 'operatesIn') {
        return {
          stroke: '#d97706',
          strokeWidth: 1.5,
          strokeDasharray: '4,4',
          arrow: 'target',
          label: {
            text: 'operates in',
            fontSize: 8,
            color: '#92400e',
            backgroundColor: '#fffbeb',
          },
        };
      }
      
      // Default edge styling
      return {
        stroke: '#94a3b8',
        strokeWidth: 1.5,
        arrow: 'target',
        label: {
          text: edge.predicate || '',
          fontSize: 9,
          color: '#475569',
          backgroundColor: '#ffffff',
        },
      };
    },
  });

  // Create custom inspector (same as UI components demo)
  const inspector = document.createElement('div');
  inspector.className = 'demo-inspector';
  inspector.innerHTML = `
    <div class="demo-inspector-header">
      <h3>Inspector</h3>
      <p class="demo-inspector-subtitle">Click a node to inspect</p>
    </div>
    <div class="demo-inspector-content">
      <div class="demo-inspector-empty">
        Select a node or edge to view properties
      </div>
    </div>
  `;
  
  // Update inspector on selection
  graph.on('nodeSelected', (event: any) => {
    const node = event.data.node;
    const content = inspector.querySelector('.demo-inspector-content')!;
    const subtitle = inspector.querySelector('.demo-inspector-subtitle')!;
    
    subtitle.textContent = `Node: ${node.id}`;
    
    // Build properties HTML
    let propertiesHTML = '<div class="demo-inspector-section"><h4>PROPERTIES</h4>';
    propertiesHTML += `<div class="demo-inspector-property"><span>ID</span><span>${node.id}</span></div>`;
    
    if (node.label) {
      propertiesHTML += `<div class="demo-inspector-property"><span>Label</span><span>${node.label}</span></div>`;
    }
    
    if (node.properties) {
      Object.entries(node.properties).forEach(([key, value]) => {
        propertiesHTML += `<div class="demo-inspector-property"><span>${key}</span><span>${value}</span></div>`;
      });
    }
    
    propertiesHTML += '</div>';
    content.innerHTML = propertiesHTML;
  });
  
  graph.on('edgeSelected', (event: any) => {
    const edge = event.data.edge;
    const content = inspector.querySelector('.demo-inspector-content')!;
    const subtitle = inspector.querySelector('.demo-inspector-subtitle')!;
    
    subtitle.textContent = `Edge: ${edge.id}`;
    
    // Build properties HTML
    let propertiesHTML = '<div class="demo-inspector-section"><h4>PROPERTIES</h4>';
    propertiesHTML += `<div class="demo-inspector-property"><span>ID</span><span>${edge.id}</span></div>`;
    propertiesHTML += `<div class="demo-inspector-property"><span>Subject</span><span>${edge.subject}</span></div>`;
    propertiesHTML += `<div class="demo-inspector-property"><span>Predicate</span><span>${edge.predicate}</span></div>`;
    propertiesHTML += `<div class="demo-inspector-property"><span>Object</span><span>${edge.object}</span></div>`;
    
    if (edge.properties) {
      Object.entries(edge.properties).forEach(([key, value]) => {
        propertiesHTML += `<div class="demo-inspector-property"><span>${key}</span><span>${value}</span></div>`;
      });
    }
    
    propertiesHTML += '</div>';
    content.innerHTML = propertiesHTML;
  });
  
  graph.on('selectionCleared', () => {
    const content = inspector.querySelector('.demo-inspector-content')!;
    const subtitle = inspector.querySelector('.demo-inspector-subtitle')!;
    subtitle.textContent = 'Click a node to inspect';
    content.innerHTML = '<div class="demo-inspector-empty">Select a node or edge to view properties</div>';
  });
  
  inspectorContainer.appendChild(inspector);

  // Add inspector styles
  const style = document.createElement('style');
  style.textContent = `
    .demo-inspector {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      width: 280px;
      max-height: 400px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .demo-inspector-header {
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
      background: #f9fafb;
    }
    .demo-inspector-header h3 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .demo-inspector-subtitle {
      margin: 0;
      font-size: 12px;
      color: #64748b;
    }
    .demo-inspector-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .demo-inspector-empty {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
      font-size: 13px;
    }
    .demo-inspector-section {
      margin-bottom: 20px;
    }
    .demo-inspector-section:last-child {
      margin-bottom: 0;
    }
    .demo-inspector-section h4 {
      margin: 0 0 12px 0;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .demo-inspector-property {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .demo-inspector-property:last-child {
      border-bottom: none;
    }
    .demo-inspector-property span:first-child {
      color: #64748b;
      font-weight: 500;
    }
    .demo-inspector-property span:last-child {
      color: #1e293b;
    }
  `;
  document.head.appendChild(style);

  // Update features list
  const featureList = document.getElementById('feature-list');
  if (featureList) {
    featureList.innerHTML = `
      <li>OWL Classes with hexagon shapes and thick borders</li>
      <li>SKOS Concepts as diamond shapes</li>
      <li>Association Classes (Employment) as rounded rectangles</li>
      <li>Multiple individual types with distinct shapes</li>
      <li>Rich edge properties with varied arrows and styles</li>
      <li>Multi-line labels on nodes</li>
      <li>Property Inspector for nodes and edges</li>
      <li>Finance domain: Organizations, People, Roles, Employment</li>
    `;
  }

  // Update stats
  updateStats(graphData);

  // Update code example
  const codeExample = document.getElementById('code-example');
  if (codeExample) {
    codeExample.textContent = `import { EdgeCraft, Inspector } from 'edgecraft';

// RDF graph with OWL, SKOS, and association classes
const graph = new EdgeCraft({
  container: '#graph',
  data: rdfData,
  layout: { type: 'hierarchical' },
  nodeStyle: (node) => {
    // OWL Classes - hexagons
    if (node.properties.type === 'owl:Class') {
      return {
        shape: 'hexagon',
        fill: '#dbeafe',
        stroke: '#1e40af',
        strokeWidth: 4,
        label: { text: node.label, fontWeight: 'bold' }
      };
    }
    // SKOS Concepts - diamonds
    if (node.properties.type === 'skos:Concept') {
      return {
        shape: 'diamond',
        fill: '#fef3c7',
        stroke: '#d97706',
        strokeWidth: 3
      };
    }
    // Association Classes - rounded rectangles
    if (node.properties.type === 'associationClass') {
      return {
        shape: 'roundrect',
        fill: '#e9d5ff',
        stroke: '#7c3aed',
        strokeWidth: 3
      };
    }
  },
  edgeStyle: (edge) => ({
    stroke: getEdgeColor(edge.properties.type),
    strokeWidth: 2,
    arrow: 'target',
    label: { text: edge.properties.label }
  })
});

// Add Inspector for property viewing
const inspector = new Inspector({
  container,
  graph,
  position: 'right',
  showProperties: true
});`;
  }

  // Update data tab
  updateDataTab(graphData);

  console.log('RDF Advanced Styling demo loaded with Inspector');
}

function updateStats(data: any): void {
  const statsDiv = document.getElementById('stats');
  if (statsDiv) {
    const owlClasses = data.nodes.filter((n: any) => n.properties?.type === 'owl:Class').length;
    const skosConcepts = data.nodes.filter((n: any) => n.properties?.type === 'skos:Concept').length;
    const individuals = data.nodes.filter((n: any) => n.properties?.type === 'individual').length;
    const associationClasses = data.nodes.filter((n: any) => n.properties?.type === 'associationClass').length;
    
    statsDiv.innerHTML = `
      <div><strong>Total Nodes:</strong> ${data.nodes.length}</div>
      <div><strong>Total Edges:</strong> ${data.edges.length}</div>
      <div><strong>OWL Classes:</strong> ${owlClasses}</div>
      <div><strong>SKOS Concepts:</strong> ${skosConcepts}</div>
      <div><strong>Individuals:</strong> ${individuals}</div>
      <div><strong>Association Classes:</strong> ${associationClasses}</div>
    `;
  }
}

function updateDataTab(data: any): void {
  const dataContent = document.getElementById('data-content');
  if (dataContent) {
    dataContent.innerHTML = `
      <div style="padding: 20px;">
        <h3 style="margin-top: 0; color: #1e293b;">RDF Graph Structure</h3>
        <div style="font-size: 13px; line-height: 1.6; color: #475569;">
          <p><strong>Ontology Layer (OWL):</strong></p>
          <ul>
            <li>Organization, Person, FinancialInstrument, Role classes</li>
            <li>Defines the vocabulary and relationships</li>
          </ul>
          
          <p><strong>Vocabulary Layer (SKOS):</strong></p>
          <ul>
            <li>InvestmentBanking, AssetManagement, RiskManagement concepts</li>
            <li>Hierarchical relationships (broader/narrower)</li>
          </ul>
          
          <p><strong>Data Layer (Individuals):</strong></p>
          <ul>
            <li>Goldman Sachs, JPMorgan (Organizations)</li>
            <li>Alice, Bob, Carol (People)</li>
            <li>Managing Director, Vice President (Roles)</li>
          </ul>
          
          <p><strong>Association Classes (Employment):</strong></p>
          <ul>
            <li>Employment relationships as first-class entities</li>
            <li>Rich properties: position, salary, startDate, status</li>
            <li>Connects Person → Employment → Organization → Role</li>
          </ul>
          
          <p><strong>Click on any node or edge to inspect its properties in the right panel.</strong></p>
        </div>
        
        <h3 style="margin-top: 24px; color: #1e293b;">Sample RDF Triples</h3>
        <pre style="background: #f8fafc; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 11px; color: #334155;"><code># OWL Class hierarchy
owl:Organization rdfs:subClassOf owl:Role .

# SKOS Concept hierarchy  
skos:AssetManagement skos:broader skos:InvestmentBanking .

# Instance typing
ind:GoldmanSachs rdf:type owl:Organization .
ind:AliceJohnson rdf:type owl:Person .

# Association Class (Employment as reified relationship)
ind:AliceJohnson hasEmployment emp:E001 .
emp:E001 withOrganization ind:GoldmanSachs .
emp:E001 hasRole role:MD .
emp:E001 position "Managing Director" .
emp:E001 salary "$450,000" .
emp:E001 startDate "2015-03-01" .</code></pre>
      </div>
    `;
  }
}
