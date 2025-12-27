/**
 * Worker-based Force-Directed Layout
 * Runs layout computation in a separate Web Worker thread
 */

import { Graph } from '../core/Graph';
import { Position, LayoutConfig } from '../types';

interface LayoutProgress {
  iteration: number;
  progress: number;
  positions: Map<string | number, Position>;
}

export type LayoutProgressCallback = (progress: LayoutProgress) => void;

export class WorkerForceLayout {
  private worker: Worker | null = null;
  private onProgress?: LayoutProgressCallback;
  private resolvePromise?: (positions: Map<string | number, Position>) => void;
  private rejectPromise?: (error: Error) => void;

  constructor(onProgress?: LayoutProgressCallback) {
    this.onProgress = onProgress;
  }

  /**
   * Compute layout using Web Worker
   */
  async compute(graph: Graph, config: LayoutConfig): Promise<Map<string | number, Position>> {
    // Terminate any existing worker
    this.terminate();

    // Create worker from inline code (avoids separate worker file bundling issues)
    const workerCode = this.getWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);

    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      if (!this.worker) {
        reject(new Error('Failed to create worker'));
        return;
      }

      this.worker.onmessage = (e) => {
        const { type, nodes, iteration, progress } = e.data;

        if (type === 'progress') {
          // Convert worker nodes back to position map
          const positions = new Map<string | number, Position>();
          nodes.forEach((n: any) => {
            positions.set(n.id, { x: n.x, y: n.y });
          });

          if (this.onProgress) {
            this.onProgress({ iteration, progress, positions });
          }
        } else if (type === 'complete') {
          // Final result
          const positions = new Map<string | number, Position>();
          nodes.forEach((n: any) => {
            positions.set(n.id, { x: n.x, y: n.y });
          });

          this.terminate();
          URL.revokeObjectURL(workerUrl);
          
          if (this.resolvePromise) {
            this.resolvePromise(positions);
          }
        } else if (type === 'error') {
          this.terminate();
          URL.revokeObjectURL(workerUrl);
          
          if (this.rejectPromise) {
            this.rejectPromise(new Error(e.data.message));
          }
        }
      };

      this.worker.onerror = (error) => {
        this.terminate();
        URL.revokeObjectURL(workerUrl);
        
        if (this.rejectPromise) {
          this.rejectPromise(new Error(`Worker error: ${error.message}`));
        }
      };

      // Prepare data for worker
      const nodes = graph.getAllNodes().map(n => ({
        id: n.id,
        x: n.position?.x || Math.random() * 800,
        y: n.position?.y || Math.random() * 600
      }));

      const edges = graph.getAllEdges().map(e => ({
        id: e.id,
        source: 'source' in e ? e.source : e.subject,
        target: 'target' in e ? e.target : e.object
      }));

      // Start worker computation
      this.worker.postMessage({
        type: 'start',
        nodes,
        edges,
        config
      });
    });
  }

  /**
   * Stop the worker if running
   */
  terminate(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Get worker code as string (inlined to avoid bundling issues)
   */
  private getWorkerCode(): string {
    return `
      let stopRequested = false;

      self.onmessage = (e) => {
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

      function runForceLayout(nodes, edges, config) {
        const iterations = config.iterations || 300;
        const nodeSpacing = config.nodeSpacing || 100;
        const repulsionStrength = config.repulsionStrength || 5000;
        const attractionStrength = config.attractionStrength || 0.05;
        const damping = config.damping || 0.85;

        const positions = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
        const nodeMap = new Map();
        positions.forEach((n, i) => nodeMap.set(n.id, i));

        for (let iter = 0; iter < iterations; iter++) {
          if (stopRequested) {
            self.postMessage({ type: 'stopped' });
            return;
          }

          const forces = positions.map(() => ({ x: 0, y: 0 }));

          // Repulsive forces
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

          // Attractive forces
          edges.forEach((edge) => {
            const sourceId = edge.source !== undefined ? edge.source : edge.subject;
            const targetId = edge.target !== undefined ? edge.target : edge.object;

            const sourceIdx = nodeMap.get(sourceId);
            const targetIdx = nodeMap.get(targetId);

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

          // Apply forces
          positions.forEach((pos, i) => {
            pos.x += forces[i].x * damping;
            pos.y += forces[i].y * damping;
          });

          // Progress updates
          if (iter % 10 === 0 || iter === iterations - 1) {
            const progress = (iter + 1) / iterations;
            self.postMessage({
              type: 'progress',
              iteration: iter,
              nodes: positions,
              progress
            });
          }
        }

        self.postMessage({
          type: 'complete',
          nodes: positions
        });
      }
    `;
  }
}
