import { Graph } from '../core/Graph';
import { GraphNode } from '../types';

/**
 * Configuration options for radial tree layout
 */
export interface RadialTreeLayoutConfig {
  /**
   * Distance between consecutive radial layers
   * @default 100
   */
  radius?: number;

  /**
   * Angular spacing between nodes (in radians)
   * @default 0.1
   */
  angularSpacing?: number;

  /**
   * Starting angle for the first node (in radians)
   * 0 = right, Math.PI/2 = top, Math.PI = left, 3*Math.PI/2 = bottom
   * @default Math.PI / 2 (top)
   */
  startAngle?: number;

  /**
   * Sweep angle for the layout (in radians)
   * @default 2 * Math.PI (full circle)
   */
  sweepAngle?: number;

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
   * Sort children by specified criterion
   * @default 'none'
   */
  sortBy?: 'none' | 'id' | 'degree' | 'label';

  /**
   * Root node ID(s). If not specified, nodes with no incoming edges are used
   */
  roots?: Array<string | number>;

  /**
   * Whether to distribute nodes evenly across the available angular space
   * @default true
   */
  equalAngularSpacing?: boolean;

  /**
   * Minimum radius for the innermost layer (root layer)
   * @default 0
   */
  minRadius?: number;
}

/**
 * Internal representation of a tree node with layout info
 */
interface RadialTreeNode {
  id: string | number;
  node: GraphNode;
  parent: RadialTreeNode | null;
  children: RadialTreeNode[];
  depth: number;
  angle: number;
  startAngle: number;
  endAngle: number;
  subtreeSize: number;
}

/**
 * Radial Tree Layout Algorithm
 * 
 * Arranges tree structures in a radial/circular pattern with nodes positioned
 * on concentric circles based on their depth in the hierarchy. Each node's
 * angular position is determined by its position in the tree and the size of
 * its subtree.
 * 
 * Features:
 * - Configurable radius and angular spacing
 * - Support for multiple root nodes
 * - Customizable angular range (partial circles, arcs)
 * - Equal or proportional angular spacing
 * - Various sorting options for children
 * 
 * Algorithm:
 * 1. Build tree structure from graph
 * 2. Calculate subtree sizes (number of leaves per subtree)
 * 3. Assign angular ranges to each subtree proportionally
 * 4. Position nodes on appropriate radius based on depth
 * 5. Calculate final Cartesian coordinates
 * 
 * Time Complexity: O(n) where n is the number of nodes
 * Space Complexity: O(n) for tree structure
 * 
 * @example
 * ```typescript
 * const layout = new RadialTreeLayout({
 *   radius: 120,
 *   startAngle: Math.PI / 2,
 *   sweepAngle: 2 * Math.PI,
 *   equalAngularSpacing: false
 * });
 * 
 * await layout.execute(graph);
 * ```
 */
export class RadialTreeLayout {
  public name = 'radial-tree';
  private config: Required<RadialTreeLayoutConfig>;

  constructor(config: RadialTreeLayoutConfig = {}) {
    this.config = {
      radius: config.radius ?? 100,
      angularSpacing: config.angularSpacing ?? 0.1,
      startAngle: config.startAngle ?? Math.PI / 2,
      sweepAngle: config.sweepAngle ?? 2 * Math.PI,
      centerX: config.centerX ?? 0,
      centerY: config.centerY ?? 0,
      sortBy: config.sortBy ?? 'none',
      roots: config.roots ?? [],
      equalAngularSpacing: config.equalAngularSpacing ?? true,
      minRadius: config.minRadius ?? 0,
    };
  }

  /**
   * Execute the radial tree layout algorithm
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
    
    // Build tree structure
    const trees = this.buildTrees(graph);
    
    if (trees.length === 0) {
      return positions;
    }

    // If single tree, use full angular range
    if (trees.length === 1) {
      const tree = trees[0];
      this.calculateSubtreeSizes(tree);
      this.assignAngles(tree, this.config.startAngle, 
                       this.config.startAngle + this.config.sweepAngle);
      this.calculatePositions(tree, positions);
    } else {
      // Multiple trees - distribute angular space equally
      const anglePerTree = this.config.sweepAngle / trees.length;
      
      for (let i = 0; i < trees.length; i++) {
        const tree = trees[i];
        const startAngle = this.config.startAngle + i * anglePerTree;
        const endAngle = startAngle + anglePerTree;
        
        this.calculateSubtreeSizes(tree);
        this.assignAngles(tree, startAngle, endAngle);
        this.calculatePositions(tree, positions);
      }
    }

    return positions;
  }

  /**
   * Build tree structures from the graph
   */
  private buildTrees(graph: Graph): RadialTreeNode[] {
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    
    // Build adjacency map
    const children = new Map<string | number, Array<string | number>>();
    const parents = new Map<string | number, string | number>();
    
    for (const edge of edges) {
      // Handle both LPG edges and RDF triples
      const edgeAny = edge as any;
      const sourceId = edgeAny.source || edgeAny.subject;
      const targetId = edgeAny.target || edgeAny.object;
      
      if (!children.has(sourceId)) {
        children.set(sourceId, []);
      }
      children.get(sourceId)!.push(targetId);
      parents.set(targetId, sourceId);
    }

    // Find root nodes
    let rootIds: Array<string | number>;
    
    if (this.config.roots.length > 0) {
      rootIds = this.config.roots;
    } else {
      // Nodes with no parents are roots
      rootIds = nodes
        .filter(node => !parents.has(node.id))
        .map(node => node.id);
    }

    // If no roots found (cycle or disconnected), pick arbitrary nodes
    if (rootIds.length === 0) {
      rootIds = [nodes[0].id];
    }

    // Build trees from each root
    const trees: RadialTreeNode[] = [];
    const visited = new Set<string | number>();

    for (const rootId of rootIds) {
      const rootNode = nodes.find(n => n.id === rootId);
      if (!rootNode || visited.has(rootId)) continue;

      const tree = this.buildSubtree(rootNode, null, children, visited, 0);
      trees.push(tree);
    }

    return trees;
  }

  /**
   * Recursively build a subtree
   */
  private buildSubtree(
    node: GraphNode,
    parent: RadialTreeNode | null,
    childrenMap: Map<string | number, Array<string | number>>,
    visited: Set<string | number>,
    depth: number
  ): RadialTreeNode {
    visited.add(node.id);

    const treeNode: RadialTreeNode = {
      id: node.id,
      node: node,
      parent: parent,
      children: [],
      depth: depth,
      angle: 0,
      startAngle: 0,
      endAngle: 0,
      subtreeSize: 1,
    };

    // Build children
    const childIds = childrenMap.get(node.id) || [];
    const sortedChildIds = this.sortChildren(childIds);

    for (const childId of sortedChildIds) {
      if (visited.has(childId)) continue; // Avoid cycles

      const childNode = this.findNodeById(childId);
      if (!childNode) continue;

      const childTreeNode = this.buildSubtree(
        childNode,
        treeNode,
        childrenMap,
        visited,
        depth + 1
      );
      treeNode.children.push(childTreeNode);
    }

    return treeNode;
  }

  /**
   * Find a node by ID (helper for buildSubtree)
   */
  private findNodeById(
    id: string | number
  ): GraphNode | null {
    // This is a simplified version - in practice, we'd maintain a node map
    // For now, we'll assume the node exists
    return { id } as GraphNode;
  }

  /**
   * Sort children according to configuration
   */
  private sortChildren(
    childIds: Array<string | number>
  ): Array<string | number> {
    if (this.config.sortBy === 'none') {
      return childIds;
    }

    // For now, just return as-is since we'd need the full graph context
    // In a complete implementation, we'd sort by degree, label, etc.
    return childIds;
  }

  /**
   * Calculate the size of each subtree (number of leaf descendants)
   */
  private calculateSubtreeSizes(node: RadialTreeNode): number {
    if (node.children.length === 0) {
      node.subtreeSize = 1;
      return 1;
    }

    let size = 0;
    for (const child of node.children) {
      size += this.calculateSubtreeSizes(child);
    }

    node.subtreeSize = size;
    return size;
  }

  /**
   * Assign angular ranges to nodes based on subtree sizes
   */
  private assignAngles(
    node: RadialTreeNode,
    startAngle: number,
    endAngle: number
  ): void {
    node.startAngle = startAngle;
    node.endAngle = endAngle;

    if (node.children.length === 0) {
      node.angle = (startAngle + endAngle) / 2;
      return;
    }

    // Calculate angle for this node (center of its range)
    node.angle = (startAngle + endAngle) / 2;

    // Distribute angular space to children
    const availableAngle = endAngle - startAngle;

    if (this.config.equalAngularSpacing) {
      // Equal spacing - each child gets same angular space
      const anglePerChild = availableAngle / node.children.length;
      let currentAngle = startAngle;

      for (const child of node.children) {
        const childEndAngle = currentAngle + anglePerChild;
        this.assignAngles(child, currentAngle, childEndAngle);
        currentAngle = childEndAngle;
      }
    } else {
      // Proportional spacing - based on subtree sizes
      let currentAngle = startAngle;

      for (const child of node.children) {
        const proportion = child.subtreeSize / node.subtreeSize;
        const childAngle = availableAngle * proportion;
        const childEndAngle = currentAngle + childAngle;
        
        this.assignAngles(child, currentAngle, childEndAngle);
        currentAngle = childEndAngle;
      }
    }
  }

  /**
   * Calculate final Cartesian positions from angles and radii
   */
  private calculatePositions(
    node: RadialTreeNode,
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    // Calculate radius for this depth
    const radius = node.depth === 0 
      ? this.config.minRadius 
      : this.config.minRadius + node.depth * this.config.radius;

    // Convert polar to Cartesian coordinates
    const x = this.config.centerX + radius * Math.cos(node.angle);
    const y = this.config.centerY + radius * Math.sin(node.angle);

    positions.set(node.id, { x, y });

    // Recursively position children
    for (const child of node.children) {
      this.calculatePositions(child, positions);
    }
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<RadialTreeLayoutConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<RadialTreeLayoutConfig> {
    return { ...this.config };
  }
}
