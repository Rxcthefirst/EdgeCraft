/**
 * Layout algorithms for graph visualization
 */

import { Graph } from '../core/Graph';
import { GraphNode, Position, LayoutConfig } from '../types';
import { RadialTreeLayout } from './RadialTreeLayout';
import { TreeLayout } from './TreeLayout';
import { OrganicLayout } from './OrganicLayout';
import { GeometricLayout } from './GeometricLayout';

export interface LayoutEngine {
  compute(graph: Graph, config: LayoutConfig): Map<string | number, Position>;
}

export class ForceDirectedLayout implements LayoutEngine {
  compute(graph: Graph, config: LayoutConfig): Map<string | number, Position> {
    const positions = new Map<string | number, Position>();
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    // Initialize positions
    nodes.forEach((node) => {
      const existingPos = node.position;
      positions.set(node.id, existingPos || {
        x: Math.random() * 800,
        y: Math.random() * 600,
      });
    });

    const iterations = config.iterations || 300;
    const nodeSpacing = config.nodeSpacing || 100;

    // Force simulation parameters
    const repulsionStrength = 5000;
    const attractionStrength = 0.05;
    const damping = 0.85;

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string | number, { x: number; y: number }>();

      // Initialize forces
      nodes.forEach((node) => {
        forces.set(node.id, { x: 0, y: 0 });
      });

      // Calculate repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          const pos1 = positions.get(node1.id)!;
          const pos2 = positions.get(node2.id)!;

          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const distSq = dx * dx + dy * dy + 0.01; // Avoid division by zero
          const dist = Math.sqrt(distSq);

          const force = repulsionStrength / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          const f1 = forces.get(node1.id)!;
          const f2 = forces.get(node2.id)!;

          f1.x -= fx;
          f1.y -= fy;
          f2.x += fx;
          f2.y += fy;
        }
      }

      // Calculate attractive forces for connected nodes
      edges.forEach((edge) => {
        const sourceId = 'source' in edge ? edge.source : edge.subject;
        const targetId = 'target' in edge ? edge.target : edge.object;

        const sourcePos = positions.get(sourceId);
        const targetPos = positions.get(targetId);

        if (!sourcePos || !targetPos) return;

        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

        const force = (dist - nodeSpacing) * attractionStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const sourceForce = forces.get(sourceId)!;
        const targetForce = forces.get(targetId)!;

        sourceForce.x += fx;
        sourceForce.y += fy;
        targetForce.x -= fx;
        targetForce.y -= fy;
      });

      // Apply forces with damping
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!;
        const force = forces.get(node.id)!;

        pos.x += force.x * damping;
        pos.y += force.y * damping;
      });
    }

    return positions;
  }
}

export class HierarchicalLayout implements LayoutEngine {
  compute(graph: Graph, config: LayoutConfig): Map<string | number, Position> {
    const positions = new Map<string | number, Position>();
    const nodes = graph.getAllNodes();
    const levelSpacing = config.levelSpacing || 150;
    const nodeSpacing = config.nodeSpacing || 100;

    // Simple top-down hierarchical layout
    const levels = this.assignLevels(graph);
    const maxLevel = Math.max(...Array.from(levels.values()));

    // Group nodes by level
    const nodesByLevel: GraphNode[][] = [];
    for (let i = 0; i <= maxLevel; i++) {
      nodesByLevel.push([]);
    }

    nodes.forEach((node) => {
      const level = levels.get(node.id) || 0;
      nodesByLevel[level].push(node);
    });

    // Position nodes
    nodesByLevel.forEach((levelNodes, level) => {
      const levelWidth = (levelNodes.length - 1) * nodeSpacing;
      const startX = -levelWidth / 2;

      levelNodes.forEach((node, index) => {
        positions.set(node.id, {
          x: startX + index * nodeSpacing,
          y: level * levelSpacing,
        });
      });
    });

    return positions;
  }

  private assignLevels(graph: Graph): Map<string | number, number> {
    const levels = new Map<string | number, number>();
    const visited = new Set<string | number>();
    const nodes = graph.getAllNodes();

    // Find root nodes (nodes with no incoming edges)
    const roots = nodes.filter((node) => graph.getIncomingEdges(node.id).length === 0);

    if (roots.length === 0 && nodes.length > 0) {
      // If no roots, pick the first node
      roots.push(nodes[0]);
    }

    // BFS to assign levels
    const queue: Array<{ nodeId: string | number; level: number }> = [];
    roots.forEach((root) => {
      queue.push({ nodeId: root.id, level: 0 });
    });

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      levels.set(nodeId, level);

      const outgoingEdges = graph.getOutgoingEdges(nodeId);
      outgoingEdges.forEach((edge) => {
        const targetId = 'target' in edge ? edge.target : edge.object;
        if (!visited.has(targetId)) {
          queue.push({ nodeId: targetId, level: level + 1 });
        }
      });
    }

    // Assign level 0 to any unvisited nodes
    nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    return levels;
  }
}

export class CircularLayout implements LayoutEngine {
  compute(graph: Graph, _config: LayoutConfig): Map<string | number, Position> {
    const positions = new Map<string | number, Position>();
    const nodes = graph.getAllNodes();
    const radius = 300;

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      positions.set(node.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });

    return positions;
  }
}

export class GridLayout implements LayoutEngine {
  compute(graph: Graph, config: LayoutConfig): Map<string | number, Position> {
    const positions = new Map<string | number, Position>();
    const nodes = graph.getAllNodes();
    const spacing = config.nodeSpacing || 100;

    const cols = Math.ceil(Math.sqrt(nodes.length));

    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      positions.set(node.id, {
        x: col * spacing,
        y: row * spacing,
      });
    });

    return positions;
  }
}

export function getLayoutEngine(type: string): LayoutEngine {
  switch (type) {
    case 'force':
      return new ForceDirectedLayout();
    case 'hierarchical':
      return new HierarchicalLayout();
    case 'circular':
      return new CircularLayout();
    case 'grid':
      return new GridLayout();
    case 'radialtree':
    case 'radial-tree':
    case 'radial':
      return {
        compute: (graph: Graph, config: LayoutConfig) => {
          const layout = new RadialTreeLayout(config as any);
          return layout.compute(graph);
        }
      };
    case 'tree':
      return {
        compute: (graph: Graph, config: LayoutConfig) => {
          const layout = new TreeLayout(config);
          return layout.compute(graph);
        }
      };
    case 'organic':
      return {
        compute: (graph: Graph, config: LayoutConfig) => {
          const layout = new OrganicLayout(config);
          return layout.compute(graph);
        }
      };
    case 'geometric':
      return {
        compute: (graph: Graph, config: LayoutConfig) => {
          const layout = new GeometricLayout(config as any);
          return layout.compute(graph);
        }
      };
    default:
      return new ForceDirectedLayout();
  }
}
