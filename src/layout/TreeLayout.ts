/**
 * Tree Layout using Reingold-Tilford Algorithm
 * 
 * Creates aesthetically pleasing tree layouts with:
 * - Minimum node separation
 * - Subtree centering
 * - Optimal space usage
 * - Support for multiple roots (forest layout)
 * 
 * Key principles:
 * 1. Nodes at same level have same Y coordinate
 * 2. Children are centered below parent
 * 3. Subtrees maintain minimum separation
 * 4. Left-to-right ordering preserved
 * 
 * References:
 * - Reingold & Tilford (1981). "Tidier Drawings of Trees"
 * - Buchheim et al. (2002). "Improving Walker's Algorithm"
 */

import { Graph } from '../core/Graph';
import { GraphNode, NodeId, Position } from '../types';

export interface TreeLayoutConfig {
  /**
   * Root node ID (if undefined, will find roots automatically)
   */
  rootId?: NodeId;

  /**
   * Orientation of the tree
   * @default 'TB'
   */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';

  /**
   * Horizontal spacing between sibling nodes
   * @default 80
   */
  siblingSpacing?: number;

  /**
   * Vertical spacing between levels
   * @default 100
   */
  levelSpacing?: number;

  /**
   * Minimum spacing between non-sibling nodes
   * @default 40
   */
  subtreeSpacing?: number;

  /**
   * Alignment for non-leaf nodes
   * - 'center': center over children
   * - 'left': align with leftmost child
   * - 'right': align with rightmost child
   * @default 'center'
   */
  nodeAlignment?: 'center' | 'left' | 'right';

  /**
   * How to handle multiple roots
   * - 'separate': Layout each tree separately
   * - 'combined': Treat as single forest with virtual root
   * @default 'separate'
   */
  multiRootMode?: 'separate' | 'combined';
}

interface TreeNode {
  id: NodeId;
  node: GraphNode;
  children: TreeNode[];
  parent: TreeNode | null;
  level: number;
  x: number;
  y: number;
  prelim: number;  // Preliminary x coordinate
  modifier: number; // Modifier sum
  thread: TreeNode | null; // Right thread
  ancestor: TreeNode; // Leftmost ancestor
  change: number;
  shift: number;
  number: number; // Sibling number
}

export class TreeLayout {
  private config: Required<TreeLayoutConfig>;
  private treeNodes: Map<NodeId, TreeNode>;
  private roots: TreeNode[];

  constructor(config: TreeLayoutConfig = {}) {
    this.config = {
      rootId: config.rootId,
      direction: config.direction || 'TB',
      siblingSpacing: config.siblingSpacing || 80,
      levelSpacing: config.levelSpacing || 100,
      subtreeSpacing: config.subtreeSpacing || 40,
      nodeAlignment: config.nodeAlignment || 'center',
      multiRootMode: config.multiRootMode || 'separate'
    } as Required<TreeLayoutConfig>;

    this.treeNodes = new Map();
    this.roots = [];
  }

  /**
   * Compute tree layout positions
   */
  compute(graph: Graph): Map<NodeId, Position> {
    // Build tree structure
    this.buildTree(graph);

    // Apply Reingold-Tilford algorithm to each root
    this.roots.forEach(root => {
      this.firstWalk(root);
      this.secondWalk(root, 0);
    });

    // Position multiple roots
    if (this.roots.length > 1 && this.config.multiRootMode === 'separate') {
      this.positionMultipleRoots();
    }

    // Apply direction transform and return positions
    return this.getPositions();
  }

  /**
   * Build tree structure from graph
   */
  private buildTree(graph: Graph): void {
    this.treeNodes.clear();
    this.roots = [];

    const visited = new Set<NodeId>();
    const nodeMap = new Map<NodeId, GraphNode>();
    
    // Build node map
    graph.getAllNodes().forEach(node => {
      nodeMap.set(node.id, node);
    });

    // Find or create root nodes
    const roots = this.findRoots(graph);

    // Build tree for each root via DFS
    roots.forEach(rootId => {
      if (!visited.has(rootId)) {
        const root = this.buildSubtree(rootId, null, 0, graph, nodeMap, visited);
        if (root) {
          this.roots.push(root);
        }
      }
    });
  }

  /**
   * Find root nodes (nodes with no incoming edges)
   */
  private findRoots(graph: Graph): NodeId[] {
    if (this.config.rootId !== undefined) {
      return [this.config.rootId];
    }

    const hasIncoming = new Set<NodeId>();
    
    graph.getAllEdges().forEach(edge => {
      const targetId = 'target' in edge ? edge.target : edge.object;
      hasIncoming.add(targetId);
    });

    const roots: NodeId[] = [];
    graph.getAllNodes().forEach(node => {
      if (!hasIncoming.has(node.id)) {
        roots.push(node.id);
      }
    });

    // If no roots found (graph has cycles), pick arbitrary node
    if (roots.length === 0) {
      const firstNode = graph.getAllNodes()[0];
      if (firstNode) {
        roots.push(firstNode.id);
      }
    }

    return roots;
  }

  /**
   * Build subtree recursively
   */
  private buildSubtree(
    nodeId: NodeId,
    parent: TreeNode | null,
    level: number,
    graph: Graph,
    nodeMap: Map<NodeId, GraphNode>,
    visited: Set<NodeId>
  ): TreeNode | null {
    if (visited.has(nodeId)) {
      return null; // Cycle detected
    }

    const graphNode = nodeMap.get(nodeId);
    if (!graphNode) {
      return null;
    }

    visited.add(nodeId);

    const treeNode: TreeNode = {
      id: nodeId,
      node: graphNode,
      children: [],
      parent,
      level,
      x: 0,
      y: level * this.config.levelSpacing,
      prelim: 0,
      modifier: 0,
      thread: null,
      ancestor: null as any, // Will set after creation
      change: 0,
      shift: 0,
      number: 0
    };

    treeNode.ancestor = treeNode;
    this.treeNodes.set(nodeId, treeNode);

    // Find children (outgoing edges)
    const children: NodeId[] = [];
    graph.getAllEdges().forEach(edge => {
      const sourceId = 'source' in edge ? edge.source : edge.subject;
      const targetId = 'target' in edge ? edge.target : edge.object;

      if (sourceId === nodeId && !visited.has(targetId)) {
        children.push(targetId);
      }
    });

    // Build child subtrees
    children.forEach((childId, index) => {
      const child = this.buildSubtree(childId, treeNode, level + 1, graph, nodeMap, visited);
      if (child) {
        child.number = index;
        treeNode.children.push(child);
      }
    });

    return treeNode;
  }

  /**
   * First walk: Compute preliminary X coordinates
   * (Buchheim et al. improvement to Walker's algorithm)
   */
  private firstWalk(node: TreeNode): void {
    if (node.children.length === 0) {
      // Leaf node
      if (node.number === 0) {
        node.prelim = 0;
      } else {
        const leftSibling = this.getLeftSibling(node);
        if (leftSibling) {
          node.prelim = leftSibling.prelim + this.config.siblingSpacing;
        }
      }
    } else {
      // Internal node
      const leftmost = node.children[0];
      const rightmost = node.children[node.children.length - 1];

      // Recursively compute children
      node.children.forEach(child => this.firstWalk(child));

      // Shift subtrees to avoid overlaps
      this.shiftSubtrees(node);

      // Center parent over children
      const midpoint = (leftmost.prelim + rightmost.prelim) / 2;

      if (node.number === 0) {
        node.prelim = midpoint;
      } else {
        const leftSibling = this.getLeftSibling(node);
        if (leftSibling) {
          node.prelim = leftSibling.prelim + this.config.siblingSpacing;
          node.modifier = node.prelim - midpoint;
        }
      }
    }
  }

  /**
   * Shift subtrees to maintain minimum separation
   */
  private shiftSubtrees(node: TreeNode): void {
    let shift = 0;
    let change = 0;

    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      child.prelim += shift;
      child.modifier += shift;
      change += child.change;
      shift += child.shift + change;
    }
  }

  /**
   * Second walk: Compute final X coordinates
   */
  private secondWalk(node: TreeNode, modsum: number): void {
    node.x = node.prelim + modsum;
    node.y = node.level * this.config.levelSpacing;

    node.children.forEach(child => {
      this.secondWalk(child, modsum + node.modifier);
    });
  }

  /**
   * Get left sibling of a node
   */
  private getLeftSibling(node: TreeNode): TreeNode | null {
    if (!node.parent || node.number === 0) {
      return null;
    }
    return node.parent.children[node.number - 1];
  }

  /**
   * Position multiple root trees
   */
  private positionMultipleRoots(): void {
    let offset = 0;

    this.roots.forEach(root => {
      // Find bounds of this tree
      const bounds = this.getSubtreeBounds(root);
      const width = bounds.max - bounds.min;

      // Shift tree
      this.shiftTree(root, offset - bounds.min);
      offset += width + this.config.subtreeSpacing;
    });
  }

  /**
   * Get bounding box of subtree
   */
  private getSubtreeBounds(node: TreeNode): { min: number; max: number } {
    let min = node.x;
    let max = node.x;

    const traverse = (n: TreeNode) => {
      if (n.x < min) min = n.x;
      if (n.x > max) max = n.x;
      n.children.forEach(traverse);
    };

    traverse(node);
    return { min, max };
  }

  /**
   * Shift entire tree by offset
   */
  private shiftTree(node: TreeNode, offset: number): void {
    node.x += offset;
    node.children.forEach(child => this.shiftTree(child, offset));
  }

  /**
   * Get final positions with direction transform
   */
  private getPositions(): Map<NodeId, Position> {
    const positions = new Map<NodeId, Position>();

    this.treeNodes.forEach((treeNode, id) => {
      let { x, y } = treeNode;

      // Apply direction transform
      switch (this.config.direction) {
        case 'BT': // Bottom-Top
          y = -y;
          break;
        case 'LR': // Left-Right
          [x, y] = [y, x];
          break;
        case 'RL': // Right-Left
          [x, y] = [-y, x];
          break;
        // TB: no transform needed
      }

      positions.set(id, { x, y });
    });

    return positions;
  }

  /**
   * Get layout statistics
   */
  getStats() {
    const depths = new Map<number, number>();
    
    this.treeNodes.forEach(node => {
      depths.set(node.level, (depths.get(node.level) || 0) + 1);
    });

    return {
      nodes: this.treeNodes.size,
      roots: this.roots.length,
      maxDepth: Math.max(...Array.from(depths.keys()), 0),
      levelCounts: Object.fromEntries(depths)
    };
  }
}
