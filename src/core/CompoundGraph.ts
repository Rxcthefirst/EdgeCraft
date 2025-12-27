/**
 * Compound Graph System (Combo Nodes / Hierarchical Groups)
 * 
 * Provides support for parent-child node relationships and collapsible groups.
 * 
 * Features:
 * - Hierarchical node grouping (unlimited nesting depth)
 * - Collapsible/expandable groups
 * - Automatic group boundary calculation
 * - Group styling and rendering
 * - Recursive group operations
 * - Group-aware layout algorithms
 * 
 * Use cases:
 * - Organizational hierarchies
 * - Software architecture diagrams (packages, modules)
 * - Network topologies (subnets, clusters)
 * - File system trees
 * - Entity-relationship groupings
 */

import { Graph } from './Graph';
import { GraphNode, NodeId, Position } from '../types';

export interface GroupConfig {
  /**
   * Padding inside group boundary
   * @default 20
   */
  padding?: number;

  /**
   * Minimum group width
   * @default 100
   */
  minWidth?: number;

  /**
   * Minimum group height
   * @default 100
   */
  minHeight?: number;

  /**
   * Whether to show group labels
   * @default true
   */
  showLabels?: boolean;

  /**
   * Label position
   * @default 'top'
   */
  labelPosition?: 'top' | 'bottom' | 'center';

  /**
   * Whether groups can overlap
   * @default false
   */
  allowOverlap?: boolean;
}

export interface GroupBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
}

export class CompoundGraph {
  private graph: Graph;
  private config: Required<GroupConfig>;
  private groupHierarchy: Map<NodeId, Set<NodeId>>; // parent -> children
  private nodeParent: Map<NodeId, NodeId>; // child -> parent

  constructor(graph: Graph, config: GroupConfig = {}) {
    this.graph = graph;
    this.config = {
      padding: config.padding ?? 20,
      minWidth: config.minWidth ?? 100,
      minHeight: config.minHeight ?? 100,
      showLabels: config.showLabels ?? true,
      labelPosition: config.labelPosition ?? 'top',
      allowOverlap: config.allowOverlap ?? false
    };

    this.groupHierarchy = new Map();
    this.nodeParent = new Map();
    this.buildHierarchy();
  }

  /**
   * Build parent-child hierarchy from graph nodes
   */
  private buildHierarchy(): void {
    this.groupHierarchy.clear();
    this.nodeParent.clear();

    this.graph.getAllNodes().forEach(node => {
      const nodeAny = node as any;
      
      if (nodeAny.parent) {
        // Add to parent's children
        if (!this.groupHierarchy.has(nodeAny.parent)) {
          this.groupHierarchy.set(nodeAny.parent, new Set());
        }
        this.groupHierarchy.get(nodeAny.parent)!.add(node.id);
        
        // Track parent reference
        this.nodeParent.set(node.id, nodeAny.parent);
      }

      // Initialize group if this is a group node
      if (nodeAny.isGroup && !this.groupHierarchy.has(node.id)) {
        this.groupHierarchy.set(node.id, new Set());
      }
    });
  }

  /**
   * Create a new group and add nodes to it
   */
  createGroup(groupId: NodeId, nodeIds: NodeId[], properties?: Record<string, any>): void {
    // Create group node
    const groupNode: any = {
      id: groupId,
      labels: ['Group'],
      properties: properties || {},
      isGroup: true,
      collapsed: false
    };

    this.graph.addNode(groupNode);

    // Add nodes to group
    nodeIds.forEach(nodeId => {
      this.addToGroup(nodeId, groupId);
    });

    this.buildHierarchy();
  }

  /**
   * Add a node to a group
   */
  addToGroup(nodeId: NodeId, groupId: NodeId): void {
    const node = this.graph.getNode(nodeId);
    if (!node) return;

    const nodeAny = node as any;
    nodeAny.parent = groupId;

    this.graph.updateNode(nodeId, { parent: groupId } as any);
    this.buildHierarchy();
  }

  /**
   * Remove a node from its group
   */
  removeFromGroup(nodeId: NodeId): void {
    const node = this.graph.getNode(nodeId);
    if (!node) return;

    const nodeAny = node as any;
    delete nodeAny.parent;

    this.graph.updateNode(nodeId, { parent: undefined } as any);
    this.buildHierarchy();
  }

  /**
   * Get all children of a group (direct children only)
   */
  getChildren(groupId: NodeId): NodeId[] {
    return Array.from(this.groupHierarchy.get(groupId) || []);
  }

  /**
   * Get all descendants of a group (recursive)
   */
  getDescendants(groupId: NodeId): NodeId[] {
    const descendants: NodeId[] = [];
    const queue = [groupId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = this.getChildren(current);

      descendants.push(...children);
      queue.push(...children);
    }

    return descendants;
  }

  /**
   * Get parent of a node
   */
  getParent(nodeId: NodeId): NodeId | undefined {
    return this.nodeParent.get(nodeId);
  }

  /**
   * Get all ancestors of a node (path to root)
   */
  getAncestors(nodeId: NodeId): NodeId[] {
    const ancestors: NodeId[] = [];
    let current = this.getParent(nodeId);

    while (current !== undefined) {
      ancestors.push(current);
      current = this.getParent(current);
    }

    return ancestors;
  }

  /**
   * Check if a node is a group
   */
  isGroup(nodeId: NodeId): boolean {
    const node = this.graph.getNode(nodeId);
    if (!node) return false;

    const nodeAny = node as any;
    return nodeAny.isGroup === true;
  }

  /**
   * Check if a group is collapsed
   */
  isCollapsed(groupId: NodeId): boolean {
    const node = this.graph.getNode(groupId);
    if (!node) return false;

    const nodeAny = node as any;
    return nodeAny.collapsed === true;
  }

  /**
   * Collapse a group (hide children)
   */
  collapseGroup(groupId: NodeId): void {
    const node = this.graph.getNode(groupId);
    if (!node) return;

    const nodeAny = node as any;
    nodeAny.collapsed = true;

    this.graph.updateNode(groupId, { collapsed: true } as any);

    // Hide all descendants
    const descendants = this.getDescendants(groupId);
    descendants.forEach(id => {
      const descendant = this.graph.getNode(id);
      if (descendant) {
        (descendant as any).hidden = true;
      }
    });
  }

  /**
   * Expand a group (show children)
   */
  expandGroup(groupId: NodeId): void {
    const node = this.graph.getNode(groupId);
    if (!node) return;

    const nodeAny = node as any;
    nodeAny.collapsed = false;

    this.graph.updateNode(groupId, { collapsed: false } as any);

    // Show direct children (not descendants of collapsed children)
    const children = this.getChildren(groupId);
    children.forEach(id => {
      const child = this.graph.getNode(id);
      if (child) {
        (child as any).hidden = false;

        // If child is a collapsed group, don't show its descendants
        const childAny = child as any;
        if (childAny.isGroup && !childAny.collapsed) {
          this.expandGroup(id);
        }
      }
    });
  }

  /**
   * Toggle group collapsed state
   */
  toggleGroup(groupId: NodeId): void {
    if (this.isCollapsed(groupId)) {
      this.expandGroup(groupId);
    } else {
      this.collapseGroup(groupId);
    }
  }

  /**
   * Calculate bounding box for a group based on child positions
   */
  getGroupBounds(groupId: NodeId): GroupBounds | null {
    const children = this.getChildren(groupId);
    if (children.length === 0) {
      return null;
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    children.forEach(childId => {
      const child = this.graph.getNode(childId);
      if (!child) return;

      const childAny = child as any;
      const x = childAny.x ?? 0;
      const y = childAny.y ?? 0;
      const radius = 20; // Default node radius

      minX = Math.min(minX, x - radius);
      minY = Math.min(minY, y - radius);
      maxX = Math.max(maxX, x + radius);
      maxY = Math.max(maxY, y + radius);

      // Recursively include nested group bounds
      if (this.isGroup(childId) && !this.isCollapsed(childId)) {
        const childBounds = this.getGroupBounds(childId);
        if (childBounds) {
          minX = Math.min(minX, childBounds.x);
          minY = Math.min(minY, childBounds.y);
          maxX = Math.max(maxX, childBounds.x + childBounds.width);
          maxY = Math.max(maxY, childBounds.y + childBounds.height);
        }
      }
    });

    const padding = this.config.padding;
    const width = Math.max(maxX - minX + padding * 2, this.config.minWidth);
    const height = Math.max(maxY - minY + padding * 2, this.config.minHeight);

    return {
      x: minX - padding,
      y: minY - padding,
      width,
      height,
      padding
    };
  }

  /**
   * Update group positions based on child positions
   */
  updateGroupPositions(): void {
    // Process groups from deepest to shallowest
    const groups = Array.from(this.groupHierarchy.keys());
    const depths = new Map<NodeId, number>();

    // Calculate depth for each group
    groups.forEach(groupId => {
      depths.set(groupId, this.getDepth(groupId));
    });

    // Sort by depth (deepest first)
    groups.sort((a, b) => (depths.get(b) || 0) - (depths.get(a) || 0));

    // Update positions
    groups.forEach(groupId => {
      const bounds = this.getGroupBounds(groupId);
      if (bounds) {
        const group = this.graph.getNode(groupId);
        if (group) {
          (group as any).x = bounds.x + bounds.width / 2;
          (group as any).y = bounds.y + bounds.height / 2;
          (group as any).width = bounds.width;
          (group as any).height = bounds.height;
        }
      }
    });
  }

  /**
   * Get depth of a group in the hierarchy
   */
  private getDepth(groupId: NodeId): number {
    let depth = 0;
    const descendants = this.getDescendants(groupId);

    descendants.forEach(id => {
      if (this.isGroup(id)) {
        const childDepth = this.getDepth(id) + 1;
        depth = Math.max(depth, childDepth);
      }
    });

    return depth;
  }

  /**
   * Get all root groups (groups with no parent)
   */
  getRootGroups(): NodeId[] {
    const roots: NodeId[] = [];

    this.groupHierarchy.forEach((children, groupId) => {
      if (!this.nodeParent.has(groupId)) {
        roots.push(groupId);
      }
    });

    return roots;
  }

  /**
   * Get hierarchy statistics
   */
  getStats() {
    const groups = Array.from(this.groupHierarchy.keys());
    const depths = groups.map(id => this.getDepth(id));

    return {
      totalGroups: groups.length,
      rootGroups: this.getRootGroups().length,
      maxDepth: Math.max(...depths, 0),
      totalNodes: this.nodeParent.size,
      collapsedGroups: groups.filter(id => this.isCollapsed(id)).length
    };
  }

  /**
   * Extract subgraph for a group and its descendants
   */
  extractGroupSubgraph(groupId: NodeId): Graph {
    const subgraph = new Graph();
    const nodeIds = [groupId, ...this.getDescendants(groupId)];

    // Add nodes
    nodeIds.forEach(id => {
      const node = this.graph.getNode(id);
      if (node) {
        subgraph.addNode({ ...node });
      }
    });

    // Add edges between nodes in the subgraph
    this.graph.getAllEdges().forEach(edge => {
      const sourceId = 'source' in edge ? edge.source : edge.subject;
      const targetId = 'target' in edge ? edge.target : edge.object;

      if (nodeIds.includes(sourceId) && nodeIds.includes(targetId)) {
        subgraph.addEdge({ ...edge });
      }
    });

    return subgraph;
  }

  /**
   * Move entire group (group + all descendants)
   */
  moveGroup(groupId: NodeId, dx: number, dy: number): void {
    const nodeIds = [groupId, ...this.getDescendants(groupId)];

    nodeIds.forEach(id => {
      const node = this.graph.getNode(id);
      if (node) {
        const nodeAny = node as any;
        if (nodeAny.x !== undefined && nodeAny.y !== undefined) {
          nodeAny.x += dx;
          nodeAny.y += dy;
        }
      }
    });
  }
}
