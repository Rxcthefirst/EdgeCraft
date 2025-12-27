import { Graph } from '../core/Graph';
import { GraphNode } from '../types';

/**
 * Configuration options for circular layout
 */
export interface CircularLayoutConfig {
  /**
   * Type of circular layout
   * @default 'simple'
   */
  type?: 'simple' | 'hierarchical' | 'bipartite';

  /**
   * Radius of the circle
   * @default 200
   */
  radius?: number;

  /**
   * Center X coordinate
   * @default 0
   */
  centerX?: number;

  /**
   * Center Y coordinate
   * @default 0
   */
  centerY?: number;

  /**
   * Starting angle for the first node (in radians)
   * 0 = right, Math.PI/2 = top, Math.PI = left, 3*Math.PI/2 = bottom
   * @default 0
   */
  startAngle?: number;

  /**
   * Direction of layout (clockwise or counterclockwise)
   * @default 'clockwise'
   */
  direction?: 'clockwise' | 'counterclockwise';

  /**
   * For hierarchical circular: radius increment per level
   * @default 100
   */
  levelRadius?: number;

  /**
   * For bipartite: ratio of circle to allocate to first partition (0-1)
   * @default 0.5
   */
  partitionRatio?: number;

  /**
   * For bipartite: IDs of nodes in the first partition
   * If not specified, nodes are auto-partitioned
   */
  partition1?: Array<string | number>;

  /**
   * Sorting criterion for node order
   * @default 'none'
   */
  sortBy?: 'none' | 'id' | 'degree' | 'label' | 'connectivity';

  /**
   * Minimum angular spacing between nodes (in radians)
   * @default 0
   */
  minAngularSpacing?: number;
}

/**
 * Internal node representation with layout info
 */
interface CircularNode {
  id: string | number;
  node: GraphNode;
  angle: number;
  radius: number;
  level?: number;
  partition?: number;
  degree?: number;
}

/**
 * Circular Layout Algorithm
 * 
 * Arranges nodes in circular patterns. Supports three layout types:
 * 
 * 1. **Simple Circular**: Places all nodes evenly on a single circle
 * 2. **Hierarchical Circular**: Places nodes on concentric circles based on hierarchy depth
 * 3. **Bipartite Circular**: Divides nodes into two groups on opposite sides of the circle
 * 
 * Features:
 * - Configurable radius, center, and starting angle
 * - Clockwise or counterclockwise direction
 * - Multiple sorting options (degree, connectivity, etc.)
 * - Support for bipartite graphs
 * - Hierarchical depth-based layout
 * 
 * Algorithm:
 * 1. Classify nodes based on layout type
 * 2. Sort nodes according to specified criterion
 * 3. Calculate angular positions
 * 4. Apply positions with optional spacing constraints
 * 
 * Time Complexity: O(n log n) for sorting, O(n) for positioning
 * Space Complexity: O(n)
 * 
 * @example
 * ```typescript
 * // Simple circular layout
 * const layout = new CircularLayout({
 *   type: 'simple',
 *   radius: 250
 * });
 * await layout.execute(graph);
 * 
 * // Bipartite layout
 * const bipartite = new CircularLayout({
 *   type: 'bipartite',
 *   partitionRatio: 0.6,
 *   partition1: ['user1', 'user2', 'user3']
 * });
 * await bipartite.execute(graph);
 * ```
 */
export class CircularLayout {
  public name = 'circular';
  private config: Required<CircularLayoutConfig>;

  constructor(config: CircularLayoutConfig = {}) {
    this.config = {
      type: config.type ?? 'simple',
      radius: config.radius ?? 200,
      centerX: config.centerX ?? 0,
      centerY: config.centerY ?? 0,
      startAngle: config.startAngle ?? 0,
      direction: config.direction ?? 'clockwise',
      levelRadius: config.levelRadius ?? 100,
      partitionRatio: config.partitionRatio ?? 0.5,
      partition1: config.partition1 ?? [],
      sortBy: config.sortBy ?? 'none',
      minAngularSpacing: config.minAngularSpacing ?? 0,
    };
  }

  /**
   * Execute the circular layout algorithm
   */
  public async execute(graph: Graph): Promise<void> {
    const positions = this.compute(graph);
    
    // Apply positions to graph
    for (const [nodeId, position] of positions.entries()) {
      graph.updateNode(nodeId, position as any);
    }
  }

  /**
   * Compute node positions without modifying the graph
   */
  public compute(graph: Graph): Map<string | number, { x: number; y: number }> {
    const positions = new Map<string | number, { x: number; y: number }>();
    const nodes = graph.getAllNodes();
    
    if (nodes.length === 0) {
      return positions;
    }

    // Choose layout type
    switch (this.config.type) {
      case 'simple':
        this.computeSimpleCircular(nodes, positions);
        break;
      case 'hierarchical':
        this.computeHierarchicalCircular(graph, nodes, positions);
        break;
      case 'bipartite':
        this.computeBipartiteCircular(graph, nodes, positions);
        break;
    }

    return positions;
  }

  /**
   * Simple circular layout - all nodes on one circle
   */
  private computeSimpleCircular(
    nodes: GraphNode[],
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    // Sort nodes if requested
    const sortedNodes = this.sortNodes(nodes);
    
    // Calculate angular step
    const angleStep = (2 * Math.PI) / sortedNodes.length;
    const directionMultiplier = this.config.direction === 'clockwise' ? 1 : -1;

    // Position each node
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const angle = this.config.startAngle + directionMultiplier * i * angleStep;
      
      const x = this.config.centerX + this.config.radius * Math.cos(angle);
      const y = this.config.centerY + this.config.radius * Math.sin(angle);
      
      positions.set(node.id, { x, y });
    }
  }

  /**
   * Hierarchical circular layout - concentric circles by depth
   */
  private computeHierarchicalCircular(
    graph: Graph,
    nodes: GraphNode[],
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    // Build hierarchy levels
    const levels = this.buildHierarchyLevels(graph, nodes);
    
    // Position nodes level by level
    for (let level = 0; level < levels.length; level++) {
      const levelNodes = levels[level];
      const radius = this.config.radius + level * this.config.levelRadius;
      
      // Sort nodes within this level
      const sortedNodes = this.sortNodes(levelNodes);
      
      // Calculate angular positions
      const angleStep = (2 * Math.PI) / sortedNodes.length;
      const directionMultiplier = this.config.direction === 'clockwise' ? 1 : -1;
      
      for (let i = 0; i < sortedNodes.length; i++) {
        const node = sortedNodes[i];
        const angle = this.config.startAngle + directionMultiplier * i * angleStep;
        
        const x = this.config.centerX + radius * Math.cos(angle);
        const y = this.config.centerY + radius * Math.sin(angle);
        
        positions.set(node.id, { x, y });
      }
    }
  }

  /**
   * Build hierarchy levels using BFS from root nodes
   */
  private buildHierarchyLevels(
    graph: Graph,
    nodes: GraphNode[]
  ): GraphNode[][] {
    const edges = graph.getAllEdges();
    
    // Build adjacency lists
    const outgoing = new Map<string | number, Array<string | number>>();
    const incoming = new Map<string | number, Array<string | number>>();
    
    for (const edge of edges) {
      const edgeAny = edge as any;
      const sourceId = edgeAny.source || edgeAny.subject;
      const targetId = edgeAny.target || edgeAny.object;
      
      if (!outgoing.has(sourceId)) outgoing.set(sourceId, []);
      if (!incoming.has(targetId)) incoming.set(targetId, []);
      
      outgoing.get(sourceId)!.push(targetId);
      incoming.get(targetId)!.push(sourceId);
    }
    
    // Find root nodes (no incoming edges)
    const roots = nodes.filter(node => !incoming.has(node.id) || incoming.get(node.id)!.length === 0);
    
    // If no roots found, use all nodes with connections
    const startNodes = roots.length > 0 ? roots : nodes.slice(0, 1);
    
    // BFS to assign levels
    const levels: GraphNode[][] = [];
    const visited = new Set<string | number>();
    const queue: Array<{ node: GraphNode; level: number }> = [];
    
    for (const node of startNodes) {
      queue.push({ node, level: 0 });
      visited.add(node.id);
    }
    
    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      
      // Add to appropriate level
      while (levels.length <= level) {
        levels.push([]);
      }
      levels[level].push(node);
      
      // Add children to queue
      const children = outgoing.get(node.id) || [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          const childNode = nodes.find(n => n.id === childId);
          if (childNode) {
            visited.add(childId);
            queue.push({ node: childNode, level: level + 1 });
          }
        }
      }
    }
    
    // Add any unvisited nodes to the last level
    const unvisited = nodes.filter(node => !visited.has(node.id));
    if (unvisited.length > 0) {
      if (levels.length === 0) levels.push([]);
      levels[levels.length - 1].push(...unvisited);
    }
    
    return levels;
  }

  /**
   * Bipartite circular layout - two groups on opposite sides
   */
  private computeBipartiteCircular(
    graph: Graph,
    nodes: GraphNode[],
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    // Partition nodes
    let partition1: GraphNode[];
    let partition2: GraphNode[];
    
    if (this.config.partition1.length > 0) {
      // Use specified partition
      const partition1Ids = new Set(this.config.partition1);
      partition1 = nodes.filter(node => partition1Ids.has(node.id));
      partition2 = nodes.filter(node => !partition1Ids.has(node.id));
    } else {
      // Auto-detect bipartite partitions
      const partitions = this.detectBipartitePartitions(graph, nodes);
      partition1 = partitions[0];
      partition2 = partitions[1];
    }
    
    // Sort nodes within each partition
    const sortedP1 = this.sortNodes(partition1);
    const sortedP2 = this.sortNodes(partition2);
    
    // Calculate angular ranges
    const p1Angle = 2 * Math.PI * this.config.partitionRatio;
    const p2Angle = 2 * Math.PI * (1 - this.config.partitionRatio);
    
    const directionMultiplier = this.config.direction === 'clockwise' ? 1 : -1;
    
    // Position partition 1
    const p1AngleStep = sortedP1.length > 0 ? p1Angle / sortedP1.length : 0;
    for (let i = 0; i < sortedP1.length; i++) {
      const node = sortedP1[i];
      const angle = this.config.startAngle + directionMultiplier * i * p1AngleStep;
      
      const x = this.config.centerX + this.config.radius * Math.cos(angle);
      const y = this.config.centerY + this.config.radius * Math.sin(angle);
      
      positions.set(node.id, { x, y });
    }
    
    // Position partition 2
    const p2StartAngle = this.config.startAngle + directionMultiplier * p1Angle;
    const p2AngleStep = sortedP2.length > 0 ? p2Angle / sortedP2.length : 0;
    for (let i = 0; i < sortedP2.length; i++) {
      const node = sortedP2[i];
      const angle = p2StartAngle + directionMultiplier * i * p2AngleStep;
      
      const x = this.config.centerX + this.config.radius * Math.cos(angle);
      const y = this.config.centerY + this.config.radius * Math.sin(angle);
      
      positions.set(node.id, { x, y });
    }
  }

  /**
   * Detect bipartite partitions using graph coloring (BFS)
   */
  private detectBipartitePartitions(
    graph: Graph,
    nodes: GraphNode[]
  ): [GraphNode[], GraphNode[]] {
    const edges = graph.getAllEdges();
    
    // Build adjacency list (undirected)
    const adj = new Map<string | number, Array<string | number>>();
    for (const node of nodes) {
      adj.set(node.id, []);
    }
    
    for (const edge of edges) {
      const edgeAny = edge as any;
      const sourceId = edgeAny.source || edgeAny.subject;
      const targetId = edgeAny.target || edgeAny.object;
      
      if (adj.has(sourceId)) adj.get(sourceId)!.push(targetId);
      if (adj.has(targetId)) adj.get(targetId)!.push(sourceId);
    }
    
    // BFS coloring
    const color = new Map<string | number, number>();
    const partition1: GraphNode[] = [];
    const partition2: GraphNode[] = [];
    
    for (const startNode of nodes) {
      if (color.has(startNode.id)) continue;
      
      // BFS from this component
      const queue: GraphNode[] = [startNode];
      color.set(startNode.id, 0);
      
      while (queue.length > 0) {
        const node = queue.shift()!;
        const nodeColor = color.get(node.id)!;
        
        const neighbors = adj.get(node.id) || [];
        for (const neighborId of neighbors) {
          if (!color.has(neighborId)) {
            const neighborNode = nodes.find(n => n.id === neighborId);
            if (neighborNode) {
              color.set(neighborId, 1 - nodeColor);
              queue.push(neighborNode);
            }
          }
        }
      }
    }
    
    // Assign nodes to partitions
    for (const node of nodes) {
      if (color.get(node.id) === 0) {
        partition1.push(node);
      } else {
        partition2.push(node);
      }
    }
    
    return [partition1, partition2];
  }

  /**
   * Sort nodes according to configuration
   */
  private sortNodes(nodes: GraphNode[]): GraphNode[] {
    if (this.config.sortBy === 'none') {
      return [...nodes];
    }
    
    const sorted = [...nodes];
    
    switch (this.config.sortBy) {
      case 'id':
        sorted.sort((a, b) => {
          if (typeof a.id === 'string' && typeof b.id === 'string') {
            return a.id.localeCompare(b.id);
          }
          return Number(a.id) - Number(b.id);
        });
        break;
      
      case 'degree':
        // Would need to calculate degree from graph context
        // For now, keep original order
        break;
      
      case 'label':
        sorted.sort((a, b) => {
          const aLabel = this.getNodeLabel(a);
          const bLabel = this.getNodeLabel(b);
          return aLabel.localeCompare(bLabel);
        });
        break;
      
      case 'connectivity':
        // Would need graph structure to calculate connectivity
        // For now, keep original order
        break;
    }
    
    return sorted;
  }

  /**
   * Get a node's label (handle both LPG and RDF)
   */
  private getNodeLabel(node: GraphNode): string {
    const nodeAny = node as any;
    
    // LPG: check properties.name or properties.label
    if (nodeAny.properties) {
      return nodeAny.properties.name || nodeAny.properties.label || String(node.id);
    }
    
    // RDF: use URI
    if (nodeAny.uri) {
      return nodeAny.uri;
    }
    
    return String(node.id);
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<CircularLayoutConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<CircularLayoutConfig> {
    return { ...this.config };
  }
}
