/**
 * Core Graph data structure supporting both LPG and RDF models
 */

import {
  GraphData,
  GraphNode,
  GraphEdge,
  NodeId,
  EdgeId,
  LPGNode,
  LPGEdge,
  RDFNode,
  RDFTriple,
  AssociationClass,
} from '../types';
import { RTree, BoundingBox, Point } from './RTree';

export class Graph {
  private nodes: Map<NodeId, GraphNode>;
  private edges: Map<EdgeId, GraphEdge>;
  private associationClasses: Map<NodeId, AssociationClass>;
  private adjacencyList: Map<NodeId, Set<EdgeId>>;
  private spatialIndex: RTree;

  constructor(data?: GraphData) {
    this.nodes = new Map();
    this.edges = new Map();
    this.associationClasses = new Map();
    this.adjacencyList = new Map();
    this.spatialIndex = new RTree();

    if (data) {
      this.setData(data);
    }
  }

  // ============================================================================
  // Data Management
  // ============================================================================

  setData(data: GraphData): void {
    this.clear();

    data.nodes.forEach((node) => this.addNode(node));
    data.edges.forEach((edge) => this.addEdge(edge));
    data.associationClasses?.forEach((ac) => this.addAssociationClass(ac));
  }

  getData(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      associationClasses: Array.from(this.associationClasses.values()),
    };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.associationClasses.clear();
    this.adjacencyList.clear();
    this.spatialIndex.clear();
  }

  // ============================================================================
  // Node Operations
  // ============================================================================

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
    
    // Add to spatial index
    this.spatialIndex.insert({
      id: node.id,
      type: 'node',
      bounds: this.calculateNodeBounds(node)
    });
  }

  removeNode(nodeId: NodeId): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove all connected edges
    const connectedEdges = this.getConnectedEdges(nodeId);
    connectedEdges.forEach((edge) => this.removeEdge(edge.id));

    this.nodes.delete(nodeId);
    this.adjacencyList.delete(nodeId);
    this.spatialIndex.remove(nodeId);
    return true;
  }

  getNode(nodeId: NodeId): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  hasNode(nodeId: NodeId): boolean {
    return this.nodes.has(nodeId);
  }

  updateNode(nodeId: NodeId, updates: Partial<GraphNode>): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const updatedNode = { ...node, ...updates };
    this.nodes.set(nodeId, updatedNode);
    
    // Update spatial index if position changed
    if (updates.hasOwnProperty('x') || updates.hasOwnProperty('y')) {
      this.spatialIndex.remove(nodeId);
      this.spatialIndex.insert({
        id: nodeId,
        type: 'node',
        bounds: this.calculateNodeBounds(updatedNode)
      });
    }
    
    return true;
  }

  // ============================================================================
  // Edge Operations
  // ============================================================================

  addEdge(edge: GraphEdge): void {
    const sourceId = this.getSourceId(edge);
    const targetId = this.getTargetId(edge);

    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      throw new Error('Cannot add edge: source or target node does not exist');
    }

    this.edges.set(edge.id, edge);
    this.adjacencyList.get(sourceId)?.add(edge.id);
    this.adjacencyList.get(targetId)?.add(edge.id);
    
    // Add to spatial index
    this.spatialIndex.insert({
      id: edge.id,
      type: 'edge',
      bounds: this.calculateEdgeBounds(edge)
    });
  }

  updateEdge(edgeId: EdgeId, updates: Partial<GraphEdge>): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;

    const updatedEdge = { ...edge, ...updates };
    this.edges.set(edgeId, updatedEdge);
    
    // Update spatial index - edges move when their connected nodes move
    this.spatialIndex.remove(edgeId);
    this.spatialIndex.insert({
      id: edgeId,
      type: 'edge',
      bounds: this.calculateEdgeBounds(updatedEdge)
    });
    
    return true;
  }

  removeEdge(edgeId: EdgeId): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;

    const sourceId = this.getSourceId(edge);
    const targetId = this.getTargetId(edge);

    this.adjacencyList.get(sourceId)?.delete(edgeId);
    this.adjacencyList.get(targetId)?.delete(edgeId);

    this.edges.delete(edgeId);
    this.spatialIndex.remove(edgeId);
    return true;
  }

  getEdge(edgeId: EdgeId): GraphEdge | undefined {
    return this.edges.get(edgeId);
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  hasEdge(edgeId: EdgeId): boolean {
    return this.edges.has(edgeId);
  }

  // ============================================================================
  // Association Class Operations
  // ============================================================================

  addAssociationClass(ac: AssociationClass): void {
    this.associationClasses.set(ac.id, ac);
  }

  removeAssociationClass(acId: NodeId): boolean {
    return this.associationClasses.delete(acId);
  }

  getAssociationClass(acId: NodeId): AssociationClass | undefined {
    return this.associationClasses.get(acId);
  }

  getAllAssociationClasses(): AssociationClass[] {
    return Array.from(this.associationClasses.values());
  }

  // ============================================================================
  // Graph Queries
  // ============================================================================

  getConnectedEdges(nodeId: NodeId): GraphEdge[] {
    const edgeIds = this.adjacencyList.get(nodeId);
    if (!edgeIds) return [];

    return Array.from(edgeIds)
      .map((id) => this.edges.get(id))
      .filter((edge): edge is GraphEdge => edge !== undefined);
  }

  getNeighbors(nodeId: NodeId): GraphNode[] {
    const edges = this.getConnectedEdges(nodeId);
    const neighborIds = new Set<NodeId>();

    edges.forEach((edge) => {
      const sourceId = this.getSourceId(edge);
      const targetId = this.getTargetId(edge);

      if (sourceId === nodeId) {
        neighborIds.add(targetId);
      }
      if (targetId === nodeId) {
        neighborIds.add(sourceId);
      }
    });

    return Array.from(neighborIds)
      .map((id) => this.nodes.get(id))
      .filter((node): node is GraphNode => node !== undefined);
  }

  getOutgoingEdges(nodeId: NodeId): GraphEdge[] {
    return this.getConnectedEdges(nodeId).filter(
      (edge) => this.getSourceId(edge) === nodeId
    );
  }

  getIncomingEdges(nodeId: NodeId): GraphEdge[] {
    return this.getConnectedEdges(nodeId).filter(
      (edge) => this.getTargetId(edge) === nodeId
    );
  }

  // ============================================================================
  // Type-specific Queries
  // ============================================================================

  getLPGNodes(): LPGNode[] {
    return this.getAllNodes().filter(this.isLPGNode);
  }

  getRDFNodes(): RDFNode[] {
    return this.getAllNodes().filter(this.isRDFNode);
  }

  getLPGEdges(): LPGEdge[] {
    return this.getAllEdges().filter(this.isLPGEdge);
  }

  getRDFTriples(): RDFTriple[] {
    return this.getAllEdges().filter(this.isRDFTriple);
  }

  // ============================================================================
  // RDF-specific Operations
  // ============================================================================

  queryTriples(
    subject?: NodeId,
    predicate?: string,
    object?: NodeId
  ): RDFTriple[] {
    return this.getRDFTriples().filter((triple) => {
      if (subject !== undefined && triple.subject !== subject) return false;
      if (predicate !== undefined && triple.predicate !== predicate) return false;
      if (object !== undefined && triple.object !== object) return false;
      return true;
    });
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getNodeCount(): number {
    return this.nodes.size;
  }

  getEdgeCount(): number {
    return this.edges.size;
  }

  getDegree(nodeId: NodeId): number {
    return this.adjacencyList.get(nodeId)?.size ?? 0;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private getSourceId(edge: GraphEdge): NodeId {
    if (this.isLPGEdge(edge)) {
      return edge.source;
    }
    return edge.subject;
  }

  private getTargetId(edge: GraphEdge): NodeId {
    if (this.isLPGEdge(edge)) {
      return edge.target;
    }
    return edge.object;
  }

  private isLPGNode(node: GraphNode): node is LPGNode {
    return 'labels' in node;
  }

  private isRDFNode(node: GraphNode): node is RDFNode {
    return 'type' in node && 'value' in node;
  }

  private isLPGEdge(edge: GraphEdge): edge is LPGEdge {
    return 'source' in edge && 'target' in edge;
  }

  private isRDFTriple(edge: GraphEdge): edge is RDFTriple {
    return 'subject' in edge && 'predicate' in edge && 'object' in edge;
  }

  // ============================================================================
  // Spatial Query Methods
  // ============================================================================

  /**
   * Query nodes within a bounding box (viewport culling)
   */
  getNodesInBounds(bounds: BoundingBox): GraphNode[] {
    const items = this.spatialIndex.query(bounds);
    return items
      .filter(item => item.type === 'node')
      .map(item => this.nodes.get(item.id))
      .filter((n): n is GraphNode => n !== undefined);
  }

  /**
   * Query edges within a bounding box
   */
  getEdgesInBounds(bounds: BoundingBox): GraphEdge[] {
    const items = this.spatialIndex.query(bounds);
    return items
      .filter(item => item.type === 'edge')
      .map(item => this.edges.get(item.id))
      .filter((e): e is GraphEdge => e !== undefined);
  }

  /**
   * Find nodes near a point
   */
  getNodesNearPoint(point: Point, maxDistance: number = 50): GraphNode[] {
    const queryBox: BoundingBox = {
      x: point.x - maxDistance,
      y: point.y - maxDistance,
      width: maxDistance * 2,
      height: maxDistance * 2
    };
    return this.getNodesInBounds(queryBox);
  }

  /**
   * Find edges near a point
   */
  getEdgesNearPoint(point: Point, maxDistance: number = 10): GraphEdge[] {
    const queryBox: BoundingBox = {
      x: point.x - maxDistance,
      y: point.y - maxDistance,
      width: maxDistance * 2,
      height: maxDistance * 2
    };
    return this.getEdgesInBounds(queryBox);
  }

  /**
   * Find k nearest nodes to a point
   */
  getNearestNodes(point: Point, k: number = 1, maxDistance: number = Infinity): GraphNode[] {
    const items = this.spatialIndex.nearest(point, k, maxDistance);
    return items.map(item => this.nodes.get(item.id)).filter((n): n is GraphNode => n !== undefined);
  }

  /**
   * Calculate bounding box for a node
   */
  private calculateNodeBounds(node: GraphNode): BoundingBox {
    const x = (node as any).x || 0;
    const y = (node as any).y || 0;
    // Use larger default radius to account for styled nodes
    // Max radius in typical use is ~50px, use 60px for safety margin
    const radius = 60;
    
    return {
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2
    };
  }

  /**
   * Calculate bounding box for an edge
   */
  private calculateEdgeBounds(edge: GraphEdge): BoundingBox {
    const sourceId = this.getSourceId(edge);
    const targetId = this.getTargetId(edge);
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    
    if (!source || !target) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const sx = (source as any).x || 0;
    const sy = (source as any).y || 0;
    const tx = (target as any).x || 0;
    const ty = (target as any).y || 0;
    
    // Add tolerance for edge hit detection (10px on each side)
    const tolerance = 10;
    
    const minX = Math.min(sx, tx) - tolerance;
    const minY = Math.min(sy, ty) - tolerance;
    const maxX = Math.max(sx, tx) + tolerance;
    const maxY = Math.max(sy, ty) + tolerance;
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**   * Rebuild spatial index (call after bulk position updates)
   */
  rebuildSpatialIndex(): void {
    this.spatialIndex.clear();
    this.nodes.forEach(node => {
      this.spatialIndex.insert({
        id: node.id,
        type: 'node',
        bounds: this.calculateNodeBounds(node)
      });
    });
    this.edges.forEach(edge => {
      this.spatialIndex.insert({
        id: edge.id,
        type: 'edge',
        bounds: this.calculateEdgeBounds(edge)
      });
    });
  }

  /**   * Get spatial index debug info
   */
  getSpatialIndexDebugInfo(): any {
    return this.spatialIndex.getDebugInfo();
  }
}
