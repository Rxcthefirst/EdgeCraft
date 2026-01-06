/**
 * Time Series Manager
 * 
 * Manages temporal graph data and animation over time
 * 
 * Features:
 * - Timeline-based graph evolution
 * - Snapshot management (discrete time points)
 * - Animation playback with speed control
 * - Node/edge appearance, disappearance, and property changes over time
 * - Time-based filtering and querying
 * 
 * Usage:
 * ```typescript
 * const timeSeries = new TimeSeriesManager(edgeCraftInstance);
 * 
 * // Add snapshots at different timestamps
 * timeSeries.addSnapshot(0, initialGraphData);
 * timeSeries.addSnapshot(1000, updatedGraphData);
 * 
 * // Play animation
 * timeSeries.play();
 * 
 * // Jump to specific time
 * timeSeries.seekTo(500);
 * ```
 */

import { GraphData, GraphNode, GraphEdge } from '../types';

export interface TimeSnapshot {
  timestamp: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  label?: string; // Optional label for this time point (e.g., "Q1 2024")
}

export interface TimeSeriesConfig {
  /**
   * Playback speed multiplier
   * @default 1.0
   */
  speed?: number;
  
  /**
   * Loop animation when reaching the end
   * @default false
   */
  loop?: boolean;
  
  /**
   * Smooth interpolation between snapshots
   * @default true
   */
  interpolate?: boolean;
  
  /**
   * Duration of transition between snapshots (ms)
   * @default 500
   */
  transitionDuration?: number;
  
  /**
   * Auto-play on initialization
   * @default false
   */
  autoPlay?: boolean;
}

export interface TimeSeriesState {
  isPlaying: boolean;
  currentTime: number;
  minTime: number;
  maxTime: number;
  currentSnapshot: number;
}

type TimeSeriesCallback = (state: TimeSeriesState) => void;

export class TimeSeriesManager {
  private snapshots: Map<number, TimeSnapshot>;
  private currentTime: number;
  private isPlaying: boolean;
  private config: Required<TimeSeriesConfig>;
  private animationFrameId: number | null;
  private lastFrameTime: number;
  private callbacks: Set<TimeSeriesCallback>;
  private graphUpdateCallback?: (data: GraphData) => void;
  
  constructor(config: TimeSeriesConfig = {}) {
    this.snapshots = new Map();
    this.currentTime = 0;
    this.isPlaying = false;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.callbacks = new Set();
    
    this.config = {
      speed: config.speed ?? 1.0,
      loop: config.loop ?? false,
      interpolate: config.interpolate ?? true,
      transitionDuration: config.transitionDuration ?? 500,
      autoPlay: config.autoPlay ?? false,
    };
  }
  
  /**
   * Set callback to update the graph
   */
  onGraphUpdate(callback: (data: GraphData) => void): void {
    this.graphUpdateCallback = callback;
  }
  
  /**
   * Add a callback for state changes
   */
  onChange(callback: TimeSeriesCallback): void {
    this.callbacks.add(callback);
  }
  
  /**
   * Remove a callback
   */
  offChange(callback: TimeSeriesCallback): void {
    this.callbacks.delete(callback);
  }
  
  /**
   * Notify all callbacks of state change
   */
  private notifyChange(): void {
    const state = this.getState();
    this.callbacks.forEach(cb => cb(state));
  }
  
  /**
   * Add a snapshot at a specific timestamp
   */
  addSnapshot(timestamp: number, nodes: GraphNode[], edges: GraphEdge[], label?: string): void {
    this.snapshots.set(timestamp, { timestamp, nodes, edges, label });
    
    // If this is the first snapshot, set current time to it
    if (this.snapshots.size === 1) {
      this.currentTime = timestamp;
      this.updateGraph();
    }
  }
  
  /**
   * Add multiple snapshots at once
   */
  addSnapshots(snapshots: TimeSnapshot[]): void {
    snapshots.forEach(snapshot => {
      this.addSnapshot(snapshot.timestamp, snapshot.nodes, snapshot.edges, snapshot.label);
    });
  }
  
  /**
   * Remove a snapshot
   */
  removeSnapshot(timestamp: number): void {
    this.snapshots.delete(timestamp);
  }
  
  /**
   * Clear all snapshots
   */
  clear(): void {
    this.stop();
    this.snapshots.clear();
    this.currentTime = 0;
  }
  
  /**
   * Get sorted list of timestamps
   */
  getTimestamps(): number[] {
    return Array.from(this.snapshots.keys()).sort((a, b) => a - b);
  }
  
  /**
   * Get snapshot at specific timestamp
   */
  getSnapshot(timestamp: number): TimeSnapshot | undefined {
    return this.snapshots.get(timestamp);
  }
  
  /**
   * Get all snapshots sorted by timestamp
   */
  getAllSnapshots(): TimeSnapshot[] {
    return this.getTimestamps().map(t => this.snapshots.get(t)!);
  }
  
  /**
   * Get current state
   */
  getState(): TimeSeriesState {
    const timestamps = this.getTimestamps();
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      minTime: timestamps.length > 0 ? timestamps[0] : 0,
      maxTime: timestamps.length > 0 ? timestamps[timestamps.length - 1] : 0,
      currentSnapshot: this.getCurrentSnapshotIndex(),
    };
  }
  
  /**
   * Get index of current snapshot
   */
  private getCurrentSnapshotIndex(): number {
    const timestamps = this.getTimestamps();
    if (timestamps.length === 0) return -1;
    
    // Find the snapshot at or before current time
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] <= this.currentTime) {
        return i;
      }
    }
    return 0;
  }
  
  /**
   * Get snapshot data for current time (with interpolation if enabled)
   */
  private getCurrentGraphData(): GraphData {
    const timestamps = this.getTimestamps();
    
    if (timestamps.length === 0) {
      return { nodes: [], edges: [] };
    }
    
    // Find the two snapshots to interpolate between
    let beforeIndex = -1;
    let afterIndex = -1;
    
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] <= this.currentTime) {
        beforeIndex = i;
      }
      if (timestamps[i] >= this.currentTime && afterIndex === -1) {
        afterIndex = i;
      }
    }
    
    // If at or before first snapshot
    if (beforeIndex === -1) {
      const snapshot = this.snapshots.get(timestamps[0])!;
      return { nodes: snapshot.nodes, edges: snapshot.edges };
    }
    
    // If at or after last snapshot
    if (afterIndex === -1 || afterIndex === beforeIndex) {
      const snapshot = this.snapshots.get(timestamps[beforeIndex])!;
      return { nodes: snapshot.nodes, edges: snapshot.edges };
    }
    
    // Interpolate between two snapshots
    const beforeSnapshot = this.snapshots.get(timestamps[beforeIndex])!;
    const afterSnapshot = this.snapshots.get(timestamps[afterIndex])!;
    
    if (!this.config.interpolate) {
      // No interpolation - just use the before snapshot
      return { nodes: beforeSnapshot.nodes, edges: beforeSnapshot.edges };
    }
    
    // Calculate interpolation factor
    const totalDuration = timestamps[afterIndex] - timestamps[beforeIndex];
    const elapsed = this.currentTime - timestamps[beforeIndex];
    const t = totalDuration > 0 ? elapsed / totalDuration : 0;
    
    // Interpolate nodes
    const nodeMap = new Map<string | number, GraphNode>();
    
    // Add all nodes from before snapshot
    beforeSnapshot.nodes.forEach(node => {
      nodeMap.set(node.id, { ...node });
    });
    
    // Merge/interpolate with after snapshot
    afterSnapshot.nodes.forEach(afterNode => {
      const beforeNode = nodeMap.get(afterNode.id);
      
      if (beforeNode) {
        // Node exists in both - interpolate properties
        const interpolated = { ...afterNode };
        
        // Interpolate position if both have x,y
        if ('x' in beforeNode && 'y' in beforeNode && 'x' in afterNode && 'y' in afterNode) {
          (interpolated as any).x = (beforeNode as any).x + ((afterNode as any).x - (beforeNode as any).x) * t;
          (interpolated as any).y = (beforeNode as any).y + ((afterNode as any).y - (beforeNode as any).y) * t;
        }
        
        nodeMap.set(afterNode.id, interpolated);
      } else if (t > 0.5) {
        // Node appears in after snapshot - add it if we're past halfway
        nodeMap.set(afterNode.id, { ...afterNode });
      }
    });
    
    // Handle disappearing nodes (fade them out before halfway point)
    beforeSnapshot.nodes.forEach(beforeNode => {
      if (!afterSnapshot.nodes.find(n => n.id === beforeNode.id)) {
        if (t < 0.5) {
          // Keep node until halfway, with reduced opacity
          const node = nodeMap.get(beforeNode.id);
          // @ts-ignore - RDF nodes don't have properties, but we use it for animation state
          if (node && node.properties) {
            // @ts-ignore
            node.properties = { ...node.properties, _opacity: 1 - (t * 2) };
          }
        } else {
          // Remove node after halfway
          nodeMap.delete(beforeNode.id);
        }
      }
    });
    
    // For edges, use a simpler approach - show edges from current snapshot
    const currentSnapshotIndex = Math.round(t) === 0 ? beforeIndex : afterIndex;
    const currentSnapshot = this.snapshots.get(timestamps[currentSnapshotIndex])!;
    
    return {
      nodes: Array.from(nodeMap.values()),
      edges: currentSnapshot.edges,
    };
  }
  
  /**
   * Update the graph with current time data
   */
  private updateGraph(): void {
    if (this.graphUpdateCallback) {
      const data = this.getCurrentGraphData();
      this.graphUpdateCallback(data);
    }
  }
  
  /**
   * Seek to specific time
   */
  seekTo(timestamp: number): void {
    const timestamps = this.getTimestamps();
    if (timestamps.length === 0) return;
    
    // Clamp to valid range
    this.currentTime = Math.max(
      timestamps[0],
      Math.min(timestamp, timestamps[timestamps.length - 1])
    );
    
    this.updateGraph();
    this.notifyChange();
  }
  
  /**
   * Go to next snapshot
   */
  next(): void {
    const timestamps = this.getTimestamps();
    if (timestamps.length === 0) return;
    
    const currentIndex = this.getCurrentSnapshotIndex();
    if (currentIndex < timestamps.length - 1) {
      this.seekTo(timestamps[currentIndex + 1]);
    }
  }
  
  /**
   * Go to previous snapshot
   */
  previous(): void {
    const timestamps = this.getTimestamps();
    if (timestamps.length === 0) return;
    
    const currentIndex = this.getCurrentSnapshotIndex();
    if (currentIndex > 0) {
      this.seekTo(timestamps[currentIndex - 1]);
    }
  }
  
  /**
   * Go to first snapshot
   */
  goToStart(): void {
    const timestamps = this.getTimestamps();
    if (timestamps.length > 0) {
      this.seekTo(timestamps[0]);
    }
  }
  
  /**
   * Go to last snapshot
   */
  goToEnd(): void {
    const timestamps = this.getTimestamps();
    if (timestamps.length > 0) {
      this.seekTo(timestamps[timestamps.length - 1]);
    }
  }
  
  /**
   * Start playing animation
   */
  play(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animate();
    this.notifyChange();
  }
  
  /**
   * Pause animation
   */
  pause(): void {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.notifyChange();
  }
  
  /**
   * Stop animation and reset to start
   */
  stop(): void {
    this.pause();
    this.goToStart();
  }
  
  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isPlaying) return;
    
    const now = performance.now();
    const deltaMs = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Update current time based on speed
    const timestamps = this.getTimestamps();
    if (timestamps.length === 0) {
      this.pause();
      return;
    }
    
    this.currentTime += deltaMs * this.config.speed;
    
    const maxTime = timestamps[timestamps.length - 1];
    
    // Handle end of timeline
    if (this.currentTime >= maxTime) {
      if (this.config.loop) {
        this.currentTime = timestamps[0];
      } else {
        this.currentTime = maxTime;
        this.pause();
      }
    }
    
    this.updateGraph();
    this.notifyChange();
    
    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };
  
  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.1, Math.min(speed, 10));
    this.notifyChange();
  }
  
  /**
   * Get current speed
   */
  getSpeed(): number {
    return this.config.speed;
  }
  
  /**
   * Set loop mode
   */
  setLoop(loop: boolean): void {
    this.config.loop = loop;
    this.notifyChange();
  }
  
  /**
   * Get loop mode
   */
  getLoop(): boolean {
    return this.config.loop;
  }
  
  /**
   * Set interpolation mode
   */
  setInterpolation(interpolate: boolean): void {
    this.config.interpolate = interpolate;
    this.updateGraph();
    this.notifyChange();
  }
  
  /**
   * Get interpolation mode
   */
  getInterpolation(): boolean {
    return this.config.interpolate;
  }
  
  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.stop();
    this.snapshots.clear();
    this.callbacks.clear();
    this.graphUpdateCallback = undefined;
  }
}
