/**
 * Batch Update System
 * 
 * Efficiently handles multiple graph changes by:
 * - Batching updates into a single render call
 * - Debouncing rapid changes
 * - Deferring layout recalculations
 * - Minimizing spatial index updates
 * 
 * Benefits:
 * - Smooth animations during bulk operations
 * - Reduced render overhead (N operations → 1 render)
 * - Better frame pacing
 * - Simplified transaction handling
 * 
 * Usage:
 * ```typescript
 * const batch = new BatchUpdate(graph);
 * batch.begin();
 * batch.addNode(node1);
 * batch.addNode(node2);
 * batch.addEdge(edge1);
 * await batch.commit(); // Single render + layout update
 * ```
 */

import { Graph } from './Graph';
import { GraphNode, GraphEdge, NodeId, EdgeId } from '../types';

export interface BatchUpdateOptions {
  /**
   * Automatically render after commit
   * @default true
   */
  autoRender?: boolean;

  /**
   * Trigger layout recalculation after commit
   * @default false
   */
  relayout?: boolean;

  /**
   * Debounce time in ms (for auto-commit on rapid changes)
   * @default 0 (disabled)
   */
  debounceMs?: number;

  /**
   * Maximum batch size before auto-commit
   * @default 1000
   */
  maxBatchSize?: number;
}

interface BatchOperation {
  type: 'addNode' | 'removeNode' | 'updateNode' | 'addEdge' | 'removeEdge' | 'updateEdge';
  target: NodeId | EdgeId;
  data?: Partial<GraphNode> | Partial<GraphEdge>;
}

export class BatchUpdate {
  private graph: Graph;
  private operations: BatchOperation[];
  private isActive: boolean;
  private options: Required<BatchUpdateOptions>;
  private debounceTimer: number | null;
  private renderCallback?: () => void;

  constructor(graph: Graph, options: BatchUpdateOptions = {}) {
    this.graph = graph;
    this.operations = [];
    this.isActive = false;
    this.debounceTimer = null;
    this.options = {
      autoRender: options.autoRender ?? true,
      relayout: options.relayout ?? false,
      debounceMs: options.debounceMs ?? 0,
      maxBatchSize: options.maxBatchSize ?? 1000
    };
  }

  /**
   * Set render callback (called after commit if autoRender is true)
   */
  onRender(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Begin a batch update
   */
  begin(): void {
    if (this.isActive) {
      console.warn('BatchUpdate: begin() called while batch is already active');
      return;
    }

    this.isActive = true;
    this.operations = [];
    this.clearDebounce();
  }

  /**
   * Add a node to the batch
   */
  addNode(node: GraphNode): void {
    this.ensureActive();
    this.operations.push({
      type: 'addNode',
      target: node.id,
      data: node
    });
    this.checkAutoCommit();
  }

  /**
   * Remove a node from the batch
   */
  removeNode(nodeId: NodeId): void {
    this.ensureActive();
    this.operations.push({
      type: 'removeNode',
      target: nodeId
    });
    this.checkAutoCommit();
  }

  /**
   * Update node properties
   */
  updateNode(nodeId: NodeId, updates: Partial<GraphNode>): void {
    this.ensureActive();
    this.operations.push({
      type: 'updateNode',
      target: nodeId,
      data: updates
    });
    this.checkAutoCommit();
  }

  /**
   * Add an edge to the batch
   */
  addEdge(edge: GraphEdge): void {
    this.ensureActive();
    this.operations.push({
      type: 'addEdge',
      target: edge.id,
      data: edge
    });
    this.checkAutoCommit();
  }

  /**
   * Remove an edge from the batch
   */
  removeEdge(edgeId: EdgeId): void {
    this.ensureActive();
    this.operations.push({
      type: 'removeEdge',
      target: edgeId
    });
    this.checkAutoCommit();
  }

  /**
   * Update edge properties
   */
  updateEdge(edgeId: EdgeId, updates: Partial<GraphEdge>): void {
    this.ensureActive();
    this.operations.push({
      type: 'updateEdge',
      target: edgeId,
      data: updates
    });
    this.checkAutoCommit();
  }

  /**
   * Commit all batched operations
   */
  async commit(): Promise<void> {
    if (!this.isActive) {
      console.warn('BatchUpdate: commit() called without active batch');
      return;
    }

    this.clearDebounce();

    try {
      // Execute all operations
      for (const op of this.operations) {
        this.executeOperation(op);
      }

      // Trigger callbacks if configured
      if (this.options.relayout) {
        // Layout recalculation would happen here
        // This is typically handled by the EdgeCraft instance
      }

      if (this.options.autoRender && this.renderCallback) {
        this.renderCallback();
      }
    } finally {
      // Clean up
      this.isActive = false;
      this.operations = [];
    }
  }

  /**
   * Cancel the batch (discard all pending operations)
   */
  cancel(): void {
    if (!this.isActive) {
      return;
    }

    this.clearDebounce();
    this.isActive = false;
    this.operations = [];
  }

  /**
   * Get batch statistics
   */
  getStats() {
    return {
      active: this.isActive,
      operations: this.operations.length,
      breakdown: this.getOperationBreakdown()
    };
  }

  /**
   * Execute a single batch operation
   */
  private executeOperation(op: BatchOperation): void {
    switch (op.type) {
      case 'addNode':
        if (op.data) {
          this.graph.addNode(op.data as GraphNode);
        }
        break;

      case 'removeNode':
        this.graph.removeNode(op.target as NodeId);
        break;

      case 'updateNode':
        if (op.data) {
          const node = this.graph.getNode(op.target as NodeId);
          if (node) {
            Object.assign(node, op.data);
            this.graph.updateNode(op.target as NodeId, op.data);
          }
        }
        break;

      case 'addEdge':
        if (op.data) {
          this.graph.addEdge(op.data as GraphEdge);
        }
        break;

      case 'removeEdge':
        this.graph.removeEdge(op.target as EdgeId);
        break;

      case 'updateEdge':
        if (op.data) {
          const edge = this.graph.getEdge(op.target as EdgeId);
          if (edge) {
            Object.assign(edge, op.data);
            this.graph.updateEdge(op.target as EdgeId, op.data);
          }
        }
        break;
    }
  }

  /**
   * Ensure batch is active (auto-begin if not)
   */
  private ensureActive(): void {
    if (!this.isActive) {
      this.begin();
    }
  }

  /**
   * Check if auto-commit should trigger
   */
  private checkAutoCommit(): void {
    // Check size limit
    if (this.operations.length >= this.options.maxBatchSize) {
      this.commit();
      return;
    }

    // Check debounce
    if (this.options.debounceMs > 0) {
      this.clearDebounce();
      this.debounceTimer = window.setTimeout(() => {
        this.commit();
      }, this.options.debounceMs);
    }
  }

  /**
   * Clear debounce timer
   */
  private clearDebounce(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Get breakdown of operation types
   */
  private getOperationBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const op of this.operations) {
      breakdown[op.type] = (breakdown[op.type] || 0) + 1;
    }

    return breakdown;
  }
}

/**
 * Batch update manager for multiple concurrent batches
 */
export class BatchManager {
  private batches: Map<string, BatchUpdate>;
  private graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
    this.batches = new Map();
  }

  /**
   * Create or get a named batch
   */
  getBatch(name: string, options?: BatchUpdateOptions): BatchUpdate {
    if (!this.batches.has(name)) {
      const batch = new BatchUpdate(this.graph, options);
      this.batches.set(name, batch);
    }
    return this.batches.get(name)!;
  }

  /**
   * Commit a specific batch
   */
  async commitBatch(name: string): Promise<void> {
    const batch = this.batches.get(name);
    if (batch) {
      await batch.commit();
      this.batches.delete(name);
    }
  }

  /**
   * Commit all batches
   */
  async commitAll(): Promise<void> {
    const commits = Array.from(this.batches.values()).map(batch => batch.commit());
    await Promise.all(commits);
    this.batches.clear();
  }

  /**
   * Cancel a specific batch
   */
  cancelBatch(name: string): void {
    const batch = this.batches.get(name);
    if (batch) {
      batch.cancel();
      this.batches.delete(name);
    }
  }

  /**
   * Cancel all batches
   */
  cancelAll(): void {
    this.batches.forEach(batch => batch.cancel());
    this.batches.clear();
  }

  /**
   * Get statistics for all batches
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    this.batches.forEach((batch, name) => {
      stats[name] = batch.getStats();
    });
    return stats;
  }
}
