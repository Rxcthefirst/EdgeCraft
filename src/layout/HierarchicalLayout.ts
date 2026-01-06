/**
 * Hierarchical (Sugiyama) Layout Algorithm
 * 
 * Implements the classic layered graph drawing algorithm for directed acyclic graphs (DAGs)
 * 
 * Algorithm phases:
 * 1. Cycle Removal - Make graph acyclic by reversing edges
 * 2. Layer Assignment - Assign nodes to horizontal layers
 * 3. Dummy Nodes - Insert dummy nodes for edges spanning multiple layers
 * 4. Crossing Minimization - Reduce edge crossings via barycentric method
 * 5. Coordinate Assignment - Calculate x-coordinates for nodes
 * 6. Edge Routing - Optional orthogonal edge routing
 * 
 * References:
 * - Sugiyama, K., Tagawa, S., & Toda, M. (1981). "Methods for visual understanding of hierarchical system structures"
 * - Gansner, E. R., et al. (1993). "A technique for drawing directed graphs"
 */

import { Graph } from '../core/Graph';
import { GraphNode, GraphEdge, Position } from '../types';

interface LayeredNode {
  id: string | number;
  originalNode?: GraphNode;
  isDummy: boolean;
  layer: number;
  position: number; // Position within layer
  x: number;
  y: number;
  inEdges: string[];
  outEdges: string[];
}

interface LayeredEdge {
  id: string;
  source: string | number;
  target: string | number;
  reversed: boolean; // Track if edge was reversed for cycle removal
  original?: GraphEdge;
}

export interface HierarchicalConfig {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  layerSpacing?: number; // Vertical spacing between layers
  nodeSpacing?: number; // Horizontal spacing between nodes
  edgeSpacing?: number; // Minimum spacing between parallel edges
  crossingReduction?: 'barycentric' | 'median' | 'none';
  crossingIterations?: number;
  dummyNodeSize?: number;
  iterations?: number;
}

export class HierarchicalLayout {
  private nodes: Map<string | number, LayeredNode>;
  private edges: Map<string, LayeredEdge>;
  private layers: LayeredNode[][];
  private reversedEdges: Set<string>;
  private config: HierarchicalConfig;

  constructor(config: HierarchicalConfig = {}) {
    this.nodes = new Map();
    this.edges = new Map();
    this.layers = [];
    this.reversedEdges = new Set();
    this.config = {
      direction: 'TB',
      layerSpacing: 100,
      nodeSpacing: 80,
      edgeSpacing: 10,
      crossingReduction: 'barycentric',
      crossingIterations: 10,
      dummyNodeSize: 5,
      iterations: 1,
      ...config
    };
  }

  /**
   * Main entry point for hierarchical layout
   */
  compute(graph: Graph): Map<string | number, Position> {
    // Initialize data structures
    this.initializeFromGraph(graph);

    // Phase 1: Cycle Removal
    this.removeCycles();

    // Phase 2: Layer Assignment
    this.assignLayers();

    // Phase 3: Add Dummy Nodes
    this.insertDummyNodes();

    // Phase 4: Crossing Minimization
    if (this.config.crossingReduction !== 'none') {
      this.minimizeCrossings();
    }

    // Phase 5: Coordinate Assignment
    this.assignCoordinates();

    // Phase 6: Apply direction transform
    this.applyDirectionTransform();

    // Return positions
    const positions = new Map<string | number, Position>();
    this.nodes.forEach((node, id) => {
      if (!node.isDummy) {
        positions.set(id, { x: node.x, y: node.y });
      }
    });

    return positions;
  }

  /**
   * Initialize nodes and edges from graph
   */
  private initializeFromGraph(graph: Graph): void {
    this.nodes.clear();
    this.edges.clear();
    this.layers = [];
    this.reversedEdges.clear();

    // Create layered nodes
    graph.getAllNodes().forEach(node => {
      this.nodes.set(node.id, {
        id: node.id,
        originalNode: node,
        isDummy: false,
        layer: 0,
        position: 0,
        x: 0,
        y: 0,
        inEdges: [],
        outEdges: []
      });
    });

    // Create layered edges
    graph.getAllEdges().forEach(edge => {
      const sourceId = 'source' in edge ? edge.source : edge.subject;
      const targetId = 'target' in edge ? edge.target : edge.object;

      const edgeId = `${sourceId}->${targetId}`;
      this.edges.set(edgeId, {
        id: edgeId,
        source: sourceId,
        target: targetId,
        reversed: false,
        original: edge
      });

      const sourceNode = this.nodes.get(sourceId);
      const targetNode = this.nodes.get(targetId);

      if (sourceNode && targetNode) {
        sourceNode.outEdges.push(edgeId);
        targetNode.inEdges.push(edgeId);
      }
    });
  }

  /**
   * Phase 1: Remove cycles by reversing edges using DFS
   */
  private removeCycles(): void {
    const visited = new Set<string | number>();
    const inStack = new Set<string | number>();

    const dfs = (nodeId: string | number): void => {
      visited.add(nodeId);
      inStack.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) return;

      // Check outgoing edges
      const outEdgesCopy = [...node.outEdges];
      for (const edgeId of outEdgesCopy) {
        const edge = this.edges.get(edgeId);
        if (!edge) continue;

        const targetId = edge.target;

        if (!visited.has(targetId)) {
          dfs(targetId);
        } else if (inStack.has(targetId)) {
          // Found a cycle - reverse this edge
          this.reverseEdge(edge);
        }
      }

      inStack.delete(nodeId);
    };

    // Run DFS from all unvisited nodes
    this.nodes.forEach((_node, nodeId) => {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    });
  }

  /**
   * Reverse an edge direction
   */
  private reverseEdge(edge: LayeredEdge): void {
    // Swap source and target
    const temp = edge.source;
    edge.source = edge.target;
    edge.target = temp;
    edge.reversed = true;
    this.reversedEdges.add(edge.id);

    // Update node connections
    const sourceNode = this.nodes.get(edge.source);
    const targetNode = this.nodes.get(edge.target);

    if (sourceNode && targetNode) {
      // Remove from old connections
      targetNode.outEdges = targetNode.outEdges.filter(e => e !== edge.id);
      sourceNode.inEdges = sourceNode.inEdges.filter(e => e !== edge.id);

      // Add to new connections
      sourceNode.outEdges.push(edge.id);
      targetNode.inEdges.push(edge.id);
    }
  }

  /**
   * Phase 2: Assign nodes to layers using longest path
   */
  private assignLayers(): void {
    // Calculate layer for each node (longest path from sources)
    const layers = new Map<string | number, number>();

    // Find source nodes (no incoming edges)
    const sources: (string | number)[] = [];
    this.nodes.forEach((node, id) => {
      if (node.inEdges.length === 0) {
        sources.push(id);
        layers.set(id, 0);
      }
    });

    // BFS to assign layers
    const queue = [...sources];
    const visited = new Set<string | number>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) continue;

      const currentLayer = layers.get(nodeId) || 0;

      // Process outgoing edges
      node.outEdges.forEach(edgeId => {
        const edge = this.edges.get(edgeId);
        if (!edge) return;

        const targetId = edge.target;
        const targetLayer = layers.get(targetId) || 0;

        // Target should be at least one layer below source
        if (currentLayer + 1 > targetLayer) {
          layers.set(targetId, currentLayer + 1);
        }

        if (!visited.has(targetId)) {
          queue.push(targetId);
        }
      });
    }

    // Assign layers to nodes
    this.nodes.forEach((node, id) => {
      node.layer = layers.get(id) || 0;
    });

    // Build layer arrays
    const maxLayer = Math.max(...Array.from(layers.values()), 0);
    this.layers = Array.from({ length: maxLayer + 1 }, () => []);

    this.nodes.forEach(node => {
      if (!node.isDummy) {
        this.layers[node.layer].push(node);
      }
    });
  }

  /**
   * Phase 3: Insert dummy nodes for edges spanning multiple layers
   */
  private insertDummyNodes(): void {
    const newEdges: LayeredEdge[] = [];
    const edgesToRemove: string[] = [];

    this.edges.forEach(edge => {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);

      if (!sourceNode || !targetNode) return;

      const layerSpan = Math.abs(targetNode.layer - sourceNode.layer);

      if (layerSpan > 1) {
        // Insert dummy nodes
        edgesToRemove.push(edge.id);

        let prevNodeId: string | number = edge.source;
        const startLayer = Math.min(sourceNode.layer, targetNode.layer);

        for (let i = 1; i < layerSpan; i++) {
          const dummyId = `dummy_${edge.id}_${i}`;
          const dummyNode: LayeredNode = {
            id: dummyId,
            isDummy: true,
            layer: startLayer + i,
            position: 0,
            x: 0,
            y: 0,
            inEdges: [],
            outEdges: []
          };

          this.nodes.set(dummyId, dummyNode);
          this.layers[dummyNode.layer].push(dummyNode);

          // Create edge segment
          const segmentId = `${prevNodeId}->${dummyId}`;
          const segment: LayeredEdge = {
            id: segmentId,
            source: prevNodeId,
            target: dummyId,
            reversed: edge.reversed,
            original: edge.original
          };

          newEdges.push(segment);

          const prevNode = this.nodes.get(prevNodeId);
          if (prevNode) {
            prevNode.outEdges.push(segmentId);
            dummyNode.inEdges.push(segmentId);
          }

          prevNodeId = dummyId;
        }

        // Final segment to target
        const finalId = `${prevNodeId}->${edge.target}`;
        const finalSegment: LayeredEdge = {
          id: finalId,
          source: prevNodeId,
          target: edge.target,
          reversed: edge.reversed,
          original: edge.original
        };

        newEdges.push(finalSegment);

        const prevNode = this.nodes.get(prevNodeId);
        if (prevNode) {
          prevNode.outEdges.push(finalId);
          targetNode.inEdges.push(finalId);
        }
      }
    });

    // Remove long edges and add segments
    edgesToRemove.forEach(id => this.edges.delete(id));
    newEdges.forEach(edge => this.edges.set(edge.id, edge));
  }

  /**
   * Phase 4: Minimize crossings using barycentric method
   */
  private minimizeCrossings(): void {
    const iterations = this.config.crossingIterations || 10;

    for (let iter = 0; iter < iterations; iter++) {
      // Sweep down
      for (let i = 0; i < this.layers.length - 1; i++) {
        this.orderLayerByBarycenter(i + 1, i);
      }

      // Sweep up
      for (let i = this.layers.length - 1; i > 0; i--) {
        this.orderLayerByBarycenter(i - 1, i);
      }
    }
  }

  /**
   * Order a layer based on barycentric values from fixed layer
   */
  private orderLayerByBarycenter(layerToOrder: number, fixedLayer: number): void {
    const layer = this.layers[layerToOrder];
    if (!layer || layer.length <= 1) return;

    // Calculate barycentric value for each node
    const barycenters = layer.map(node => {
      const edges = layerToOrder < fixedLayer ? node.outEdges : node.inEdges;
      
      if (edges.length === 0) return 0;

      let sum = 0;
      let count = 0;

      edges.forEach(edgeId => {
        const edge = this.edges.get(edgeId);
        if (!edge) return;

        const neighborId = layerToOrder < fixedLayer ? edge.target : edge.source;
        const neighbor = this.nodes.get(neighborId);

        if (neighbor && neighbor.layer === fixedLayer) {
          sum += neighbor.position;
          count++;
        }
      });

      return count > 0 ? sum / count : 0;
    });

    // Sort by barycentric values
    const indexed = layer.map((node, i) => ({ node, barycenter: barycenters[i] }));
    indexed.sort((a, b) => a.barycenter - b.barycenter);

    // Update layer and positions
    this.layers[layerToOrder] = indexed.map((item, i) => {
      item.node.position = i;
      return item.node;
    });
  }

  /**
   * Phase 5: Assign x and y coordinates to nodes
   */
  private assignCoordinates(): void {
    const layerSpacing = this.config.layerSpacing || 100;
    const nodeSpacing = this.config.nodeSpacing || 80;

    // Assign y-coordinates based on layers
    this.layers.forEach((layer, layerIndex) => {
      const y = layerIndex * layerSpacing;

      // Center the layer horizontally
      const layerWidth = (layer.length - 1) * nodeSpacing;
      const startX = -layerWidth / 2;

      layer.forEach((node, positionIndex) => {
        node.x = startX + positionIndex * nodeSpacing;
        node.y = y;
      });
    });
  }

  /**
   * Phase 6: Apply direction transform (TB, LR, etc.)
   */
  private applyDirectionTransform(): void {
    const { direction } = this.config;

    if (direction === 'TB') {
      // Already in Top-Bottom, no transform needed
      return;
    }

    this.nodes.forEach(node => {
      const { x, y } = node;

      switch (direction) {
        case 'BT': // Bottom-Top
          node.x = x;
          node.y = -y;
          break;
        case 'LR': // Left-Right
          node.x = y;
          node.y = x;
          break;
        case 'RL': // Right-Left
          node.x = -y;
          node.y = x;
          break;
      }
    });
  }
}
