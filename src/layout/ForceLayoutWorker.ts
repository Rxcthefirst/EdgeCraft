/**
 * Web Worker for Force-Directed Layout Computation
 * Offloads expensive layout calculations to a separate thread
 */

interface WorkerNode {
  id: string | number;
  x: number;
  y: number;
}

interface WorkerEdge {
  id: string | number;
  source: string | number;
  target: string | number;
  subject?: string | number;
  object?: string | number;
}

interface LayoutConfig {
  iterations?: number;
  nodeSpacing?: number;
  repulsionStrength?: number;
  attractionStrength?: number;
  damping?: number;
}

interface WorkerMessage {
  type: 'start' | 'stop';
  nodes?: WorkerNode[];
  edges?: WorkerEdge[];
  config?: LayoutConfig;
}

interface ProgressMessage {
  type: 'progress';
  iteration: number;
  nodes: WorkerNode[];
  progress: number;
}

interface CompleteMessage {
  type: 'complete';
  nodes: WorkerNode[];
}

let stopRequested = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, nodes, edges, config } = e.data;

  if (type === 'stop') {
    stopRequested = true;
    return;
  }

  if (type === 'start' && nodes && edges && config) {
    stopRequested = false;
    runForceLayout(nodes, edges, config);
  }
};

function runForceLayout(
  nodes: WorkerNode[],
  edges: WorkerEdge[],
  config: LayoutConfig
): void {
  const iterations = config.iterations || 300;
  const nodeSpacing = config.nodeSpacing || 100;
  const repulsionStrength = config.repulsionStrength || 5000;
  const attractionStrength = config.attractionStrength || 0.05;
  const damping = config.damping || 0.85;

  // Clone nodes to avoid modifying originals
  const positions = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
  const nodeMap = new Map<string | number, number>();
  positions.forEach((n, i) => nodeMap.set(n.id, i));

  for (let iter = 0; iter < iterations; iter++) {
    if (stopRequested) {
      self.postMessage({ type: 'stopped' });
      return;
    }

    // Initialize forces
    const forces = positions.map(() => ({ x: 0, y: 0 }));

    // Calculate repulsive forces between all nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i];
        const pos2 = positions[j];

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distSq = dx * dx + dy * dy + 0.01;
        const dist = Math.sqrt(distSq);

        const force = repulsionStrength / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        forces[i].x -= fx;
        forces[i].y -= fy;
        forces[j].x += fx;
        forces[j].y += fy;
      }
    }

    // Calculate attractive forces for connected nodes
    edges.forEach((edge: any) => {
      const sourceId = 'source' in edge ? edge.source : edge.subject;
      const targetId = 'target' in edge ? edge.target : edge.object;

      const sourceIdx = nodeMap.get(sourceId!);
      const targetIdx = nodeMap.get(targetId!);

      if (sourceIdx === undefined || targetIdx === undefined) return;

      const sourcePos = positions[sourceIdx];
      const targetPos = positions[targetIdx];

      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

      const force = (dist - nodeSpacing) * attractionStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      forces[sourceIdx].x += fx;
      forces[sourceIdx].y += fy;
      forces[targetIdx].x -= fx;
      forces[targetIdx].y -= fy;
    });

    // Apply forces with damping
    positions.forEach((pos, i) => {
      pos.x += forces[i].x * damping;
      pos.y += forces[i].y * damping;
    });

    // Send progress updates every 10 iterations
    if (iter % 10 === 0 || iter === iterations - 1) {
      const progress = (iter + 1) / iterations;
      const message: ProgressMessage = {
        type: 'progress',
        iteration: iter,
        nodes: positions,
        progress
      };
      self.postMessage(message);
    }
  }

  // Send final result
  const message: CompleteMessage = {
    type: 'complete',
    nodes: positions
  };
  self.postMessage(message);
}

// Export empty object for TypeScript
export {};
