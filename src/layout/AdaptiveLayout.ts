/**
 * Adaptive Layout
 * 
 * Preserves existing node positions while incorporating new nodes
 * Similar to Keylines adaptive layout - avoids "randomizing" the graph
 * 
 * Strategy:
 * 1. Keep existing nodes in their current positions (with minor adjustments)
 * 2. Place new nodes near their connected neighbors
 * 3. Run minimal force simulation to settle new nodes
 * 4. Maintain overall graph structure
 */

import { GraphNode, GraphEdge, Position, NodeId } from '../types';
import { Graph } from '../core/Graph';

export interface AdaptiveLayoutConfig {
  /**
   * How much existing nodes can move (0 = frozen, 1 = fully mobile)
   * @default 0.2
   */
  existingNodeMobility?: number;
  
  /**
   * Spacing for new nodes
   * @default 100
   */
  newNodeSpacing?: number;
  
  /**
   * Number of iterations for settling new nodes
   * @default 50
   */
  settleIterations?: number;
  
  /**
   * Force strength
   * @default 0.3
   */
  forceStrength?: number;
  
  /**
   * Link distance
   * @default 100
   */
  linkDistance?: number;
}

export class AdaptiveLayout {
  private config: Required<AdaptiveLayoutConfig>;
  
  constructor(config: AdaptiveLayoutConfig = {}) {
    this.config = {
      existingNodeMobility: config.existingNodeMobility ?? 0.2,
      newNodeSpacing: config.newNodeSpacing ?? 100,
      settleIterations: config.settleIterations ?? 50,
      forceStrength: config.forceStrength ?? 0.3,
      linkDistance: config.linkDistance ?? 100,
    };
  }
  
  /**
   * Compute adaptive layout
   * Keeps existing nodes mostly in place, adds new nodes intelligently
   */
  compute(
    graph: Graph,
    existingPositions: Map<NodeId, Position>,
    newNodes: GraphNode[]
  ): Map<NodeId, Position> {
    const positions = new Map<NodeId, Position>();
    const allNodes = graph.getAllNodes();
    const allEdges = graph.getAllEdges();
    
    // Separate existing and new nodes
    const existingNodeIds = new Set(existingPositions.keys());
    const newNodeIds = new Set(newNodes.map(n => n.id));
    
    // Copy existing positions
    existingPositions.forEach((pos, id) => {
      positions.set(id, { ...pos });
    });
    
    // Place new nodes near their neighbors
    this.placeNewNodes(newNodes, allEdges, positions, newNodeIds, existingNodeIds);
    
    // Run force simulation to settle
    this.settleLayout(allNodes, allEdges, positions, existingNodeIds);
    
    return positions;
  }
  
  /**
   * Place new nodes near their connected neighbors
   */
  private placeNewNodes(
    newNodes: GraphNode[],
    edges: GraphEdge[],
    positions: Map<NodeId, Position>,
    newNodeIds: Set<NodeId>,
    existingNodeIds: Set<NodeId>
  ): void {
    newNodes.forEach(node => {
      // Find connected existing nodes
      const connectedExisting = edges
        .filter(e => {
          const source = this.getSourceId(e);
          const target = this.getTargetId(e);
          
          return (
            (source === node.id && existingNodeIds.has(target)) ||
            (target === node.id && existingNodeIds.has(source))
          );
        })
        .map(e => {
          const source = this.getSourceId(e);
          const target = this.getTargetId(e);
          return source === node.id ? target : source;
        });
      
      if (connectedExisting.length > 0) {
        // Place near connected nodes (average position with offset)
        let sumX = 0;
        let sumY = 0;
        
        connectedExisting.forEach(connectedId => {
          const pos = positions.get(connectedId);
          if (pos) {
            sumX += pos.x;
            sumY += pos.y;
          }
        });
        
        const avgX = sumX / connectedExisting.length;
        const avgY = sumY / connectedExisting.length;
        
        // Add random offset to avoid overlap
        const angle = Math.random() * Math.PI * 2;
        const distance = this.config.newNodeSpacing;
        
        positions.set(node.id, {
          x: avgX + Math.cos(angle) * distance,
          y: avgY + Math.sin(angle) * distance
        });
      } else {
        // No connections - place randomly near center
        const centerX = this.getCenterX(positions);
        const centerY = this.getCenterY(positions);
        const angle = Math.random() * Math.PI * 2;
        const distance = this.config.newNodeSpacing * 2;
        
        positions.set(node.id, {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance
        });
      }
    });
  }
  
  /**
   * Run force simulation to settle the layout
   * Existing nodes have reduced mobility
   */
  private settleLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    positions: Map<NodeId, Position>,
    existingNodeIds: Set<NodeId>
  ): void {
    const velocities = new Map<NodeId, { vx: number; vy: number }>();
    
    // Initialize velocities
    nodes.forEach(node => {
      velocities.set(node.id, { vx: 0, vy: 0 });
    });
    
    // Simulation iterations
    for (let iter = 0; iter < this.config.settleIterations; iter++) {
      const alpha = 1 - (iter / this.config.settleIterations);
      
      // Reset forces
      nodes.forEach(node => {
        const vel = velocities.get(node.id)!;
        vel.vx = 0;
        vel.vy = 0;
      });
      
      // Repulsion forces
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          
          const pos1 = positions.get(node1.id)!;
          const pos2 = positions.get(node2.id)!;
          
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (this.config.linkDistance * this.config.linkDistance) / distSq;
            const fx = (dx / dist) * force * this.config.forceStrength;
            const fy = (dy / dist) * force * this.config.forceStrength;
            
            const vel1 = velocities.get(node1.id)!;
            const vel2 = velocities.get(node2.id)!;
            
            vel1.vx -= fx;
            vel1.vy -= fy;
            vel2.vx += fx;
            vel2.vy += fy;
          }
        }
      }
      
      // Attraction forces (edges)
      edges.forEach(edge => {
        const sourceId = this.getSourceId(edge);
        const targetId = this.getTargetId(edge);
        
        const pos1 = positions.get(sourceId);
        const pos2 = positions.get(targetId);
        
        if (!pos1 || !pos2) return;
        
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const force = (dist - this.config.linkDistance) * this.config.forceStrength;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          const vel1 = velocities.get(sourceId)!;
          const vel2 = velocities.get(targetId)!;
          
          vel1.vx += fx;
          vel1.vy += fy;
          vel2.vx -= fx;
          vel2.vy -= fy;
        }
      });
      
      // Apply velocities with mobility factor
      nodes.forEach(node => {
        const vel = velocities.get(node.id)!;
        const pos = positions.get(node.id)!;
        
        // Reduce movement for existing nodes
        const mobility = existingNodeIds.has(node.id) 
          ? this.config.existingNodeMobility 
          : 1.0;
        
        pos.x += vel.vx * alpha * mobility;
        pos.y += vel.vy * alpha * mobility;
      });
    }
  }
  
  private getCenterX(positions: Map<NodeId, Position>): number {
    if (positions.size === 0) return 0;
    let sum = 0;
    positions.forEach(pos => sum += pos.x);
    return sum / positions.size;
  }
  
  private getCenterY(positions: Map<NodeId, Position>): number {
    if (positions.size === 0) return 0;
    let sum = 0;
    positions.forEach(pos => sum += pos.y);
    return sum / positions.size;
  }
  
  private getSourceId(edge: GraphEdge): NodeId {
    return (edge as any).source || (edge as any).subject;
  }
  
  private getTargetId(edge: GraphEdge): NodeId {
    return (edge as any).target || (edge as any).object;
  }
}
