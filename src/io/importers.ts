/**
 * Data Import/Export Utilities
 * Support for various graph formats
 */

import type { GraphData, GraphNode, GraphEdge } from '../types';

/**
 * GraphML Importer
 */
export class GraphMLImporter {
  static fromString(xmlString: string): GraphData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Parse nodes
    const nodeElements = doc.querySelectorAll('node');
    nodeElements.forEach((nodeEl) => {
      const id = nodeEl.getAttribute('id')!;
      const node: GraphNode = {
        id,
        labels: [],
        properties: {}
      };
      
      // Parse data elements
      const dataElements = nodeEl.querySelectorAll('data');
      dataElements.forEach((dataEl) => {
        const key = dataEl.getAttribute('key')!;
        const value = dataEl.textContent || '';
        
        if (key === 'label') {
          node.label = value;
        } else {
          node.properties![key] = value;
        }
      });
      
      nodes.push(node);
    });
    
    // Parse edges
    const edgeElements = doc.querySelectorAll('edge');
    edgeElements.forEach((edgeEl) => {
      const id = edgeEl.getAttribute('id') || `edge-${edges.length}`;
      const source = edgeEl.getAttribute('source')!;
      const target = edgeEl.getAttribute('target')!;
      
      const edge: GraphEdge = {
        id,
        source,
        target,
        properties: {}
      };
      
      // Parse data elements
      const dataElements = edgeEl.querySelectorAll('data');
      dataElements.forEach((dataEl) => {
        const key = dataEl.getAttribute('key')!;
        const value = dataEl.textContent || '';
        
        if (key === 'label') {
          edge.label = value;
        } else {
          edge.properties![key] = value;
        }
      });
      
      edges.push(edge);
    });
    
    return { nodes, edges };
  }
}

/**
 * GEXF Importer
 */
export class GEXFImporter {
  static fromString(xmlString: string): GraphData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Parse nodes
    const nodeElements = doc.querySelectorAll('node');
    nodeElements.forEach((nodeEl) => {
      const id = nodeEl.getAttribute('id')!;
      const label = nodeEl.getAttribute('label') || id;
      
      const node: GraphNode = {
        id,
        label,
        labels: [],
        properties: {}
      };
      
      // Parse attributes
      const attValues = nodeEl.querySelectorAll('attvalue');
      attValues.forEach((attEl) => {
        const key = attEl.getAttribute('for')!;
        const value = attEl.getAttribute('value')!;
        node.properties![key] = value;
      });
      
      nodes.push(node);
    });
    
    // Parse edges
    const edgeElements = doc.querySelectorAll('edge');
    edgeElements.forEach((edgeEl) => {
      const id = edgeEl.getAttribute('id') || `edge-${edges.length}`;
      const source = edgeEl.getAttribute('source')!;
      const target = edgeEl.getAttribute('target')!;
      const label = edgeEl.getAttribute('label');
      
      const edge: GraphEdge = {
        id,
        source,
        target,
        properties: {}
      };
      
      if (label) {
        edge.label = label;
      }
      
      // Parse attributes
      const attValues = edgeEl.querySelectorAll('attvalue');
      attValues.forEach((attEl) => {
        const key = attEl.getAttribute('for')!;
        const value = attEl.getAttribute('value')!;
        edge.properties![key] = value;
      });
      
      edges.push(edge);
    });
    
    return { nodes, edges };
  }
}

/**
 * CSV Importer
 */
export class CSVImporter {
  static fromNodesCsv(csv: string): GraphNode[] {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const nodes: GraphNode[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const node: GraphNode = {
        id: values[0],
        labels: [],
        properties: {}
      };
      
      for (let j = 1; j < headers.length; j++) {
        const key = headers[j];
        const value = values[j];
        
        if (key === 'label') {
          node.label = value;
        } else if (key === 'labels') {
          node.labels = value.split(';');
        } else {
          node.properties![key] = value;
        }
      }
      
      nodes.push(node);
    }
    
    return nodes;
  }
  
  static fromEdgesCsv(csv: string): GraphEdge[] {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const edges: GraphEdge[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      // First two columns should be source and target
      const edge: GraphEdge = {
        id: `edge-${i}`,
        source: values[0],
        target: values[1],
        properties: {}
      };
      
      for (let j = 2; j < headers.length; j++) {
        const key = headers[j];
        const value = values[j];
        
        if (key === 'label') {
          edge.label = value;
        } else if (key === 'id') {
          edge.id = value;
        } else {
          edge.properties![key] = value;
        }
      }
      
      edges.push(edge);
    }
    
    return edges;
  }
}

/**
 * JSON-LD Importer (for RDF)
 */
export class JSONLDImporter {
  static fromString(jsonString: string): GraphData {
    const data = JSON.parse(jsonString);
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Handle @graph array
    const items = data['@graph'] || (Array.isArray(data) ? data : [data]);
    
    items.forEach((item: any) => {
      const id = item['@id'] || item.id;
      
      if (!id) return;
      
      // Create node
      const node: GraphNode = {
        id,
        labels: item['@type'] ? [item['@type']] : [],
        properties: {}
      };
      
      // Extract properties and relationships
      Object.entries(item).forEach(([key, value]) => {
        if (key === '@id' || key === '@type') return;
        
        // Check if value is a reference
        if (typeof value === 'object' && value !== null && '@id' in value) {
          // Create edge
          edges.push({
            id: `${id}-${key}-${value['@id']}`,
            source: id,
            target: value['@id'],
            label: key,
            properties: {}
          });
        } else {
          // Add as property
          node.properties![key] = value;
        }
      });
      
      nodes.push(node);
    });
    
    return { nodes, edges };
  }
}

/**
 * Cypher Query Result Importer (Neo4j)
 */
export class CypherImporter {
  static fromResult(result: any): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();
    
    result.records.forEach((record: any) => {
      record._fields.forEach((field: any) => {
        // Handle nodes
        if (field.labels) {
          const id = field.identity.toString();
          if (!nodeMap.has(id)) {
            const node: GraphNode = {
              id,
              labels: field.labels,
              properties: field.properties
            };
            nodes.push(node);
            nodeMap.set(id, node);
          }
        }
        
        // Handle relationships (edges)
        if (field.type) {
          const edge: GraphEdge = {
            id: field.identity.toString(),
            source: field.start.toString(),
            target: field.end.toString(),
            label: field.type,
            properties: field.properties
          };
          edges.push(edge);
        }
      });
    });
    
    return { nodes, edges };
  }
}

/**
 * Exporters
 */

export class GraphMLExporter {
  static toString(data: GraphData): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    xml += '  <graph id="G" edgedefault="directed">\n';
    
    // Export nodes
    data.nodes.forEach((node) => {
      xml += `    <node id="${node.id}">\n`;
      if (node.label) {
        xml += `      <data key="label">${node.label}</data>\n`;
      }
      if (node.properties) {
        Object.entries(node.properties).forEach(([key, value]) => {
          xml += `      <data key="${key}">${value}</data>\n`;
        });
      }
      xml += '    </node>\n';
    });
    
    // Export edges
    data.edges.forEach((edge) => {
      xml += `    <edge id="${edge.id}" source="${edge.source}" target="${edge.target}">\n`;
      if (edge.label) {
        xml += `      <data key="label">${edge.label}</data>\n`;
      }
      if (edge.properties) {
        Object.entries(edge.properties).forEach(([key, value]) => {
          xml += `      <data key="${key}">${value}</data>\n`;
        });
      }
      xml += '    </edge>\n';
    });
    
    xml += '  </graph>\n';
    xml += '</graphml>';
    
    return xml;
  }
}

export class JSONExporter {
  static toString(data: GraphData): string {
    return JSON.stringify(data, null, 2);
  }
}

export class CSVExporter {
  static nodesToCsv(nodes: GraphNode[]): string {
    if (nodes.length === 0) return '';
    
    // Get all unique property keys
    const keys = new Set<string>(['id', 'label']);
    nodes.forEach(node => {
      if (node.properties) {
        Object.keys(node.properties).forEach(key => keys.add(key));
      }
    });
    
    const headers = Array.from(keys);
    let csv = headers.join(',') + '\n';
    
    nodes.forEach(node => {
      const values = headers.map(key => {
        if (key === 'id') return node.id;
        if (key === 'label') return node.label || '';
        return node.properties?.[key] || '';
      });
      csv += values.join(',') + '\n';
    });
    
    return csv;
  }
  
  static edgesToCsv(edges: GraphEdge[]): string {
    if (edges.length === 0) return '';
    
    // Get all unique property keys
    const keys = new Set<string>(['source', 'target', 'label']);
    edges.forEach(edge => {
      if (edge.properties) {
        Object.keys(edge.properties).forEach(key => keys.add(key));
      }
    });
    
    const headers = Array.from(keys);
    let csv = headers.join(',') + '\n';
    
    edges.forEach(edge => {
      const values = headers.map(key => {
        if (key === 'source') return edge.source;
        if (key === 'target') return edge.target;
        if (key === 'label') return edge.label || '';
        return edge.properties?.[key] || '';
      });
      csv += values.join(',') + '\n';
    });
    
    return csv;
  }
}

/**
 * Unified Importer
 */
export class Importers {
  static fromGraphML(xml: string): GraphData {
    return GraphMLImporter.fromString(xml);
  }
  
  static fromGEXF(xml: string): GraphData {
    return GEXFImporter.fromString(xml);
  }
  
  static fromCSV(nodesCsv: string, edgesCsv: string): GraphData {
    return {
      nodes: CSVImporter.fromNodesCsv(nodesCsv),
      edges: CSVImporter.fromEdgesCsv(edgesCsv)
    };
  }
  
  static fromJSONLD(json: string): GraphData {
    return JSONLDImporter.fromString(json);
  }
  
  static fromCypher(result: any): GraphData {
    return CypherImporter.fromResult(result);
  }
  
  static fromJSON(json: string): GraphData {
    return JSON.parse(json);
  }
}

/**
 * Unified Exporter
 */
export class Exporters {
  static toGraphML(data: GraphData): string {
    return GraphMLExporter.toString(data);
  }
  
  static toJSON(data: GraphData): string {
    return JSONExporter.toString(data);
  }
  
  static toCSV(data: GraphData): { nodes: string; edges: string } {
    return {
      nodes: CSVExporter.nodesToCsv(data.nodes),
      edges: CSVExporter.edgesToCsv(data.edges)
    };
  }
}
