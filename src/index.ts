/**
 * EdgeCraft - Advanced Graph Visualization Library
 * Main entry point
 */

export { EdgeCraft } from './EdgeCraft';
export { Graph } from './core/Graph';
export { RTree } from './core/RTree';
export type { BoundingBox, Point, SpatialItem } from './core/RTree';
export { MultiEdgeBundler } from './core/MultiEdgeBundler';
export type { EdgeBundleInfo, BundleConfig } from './core/MultiEdgeBundler';
export { ObjectPool, PooledPoint, PooledBoundingBox, PooledMatrix } from './core/ObjectPool';
export { pointPool, boundingBoxPool, matrixPool } from './core/ObjectPool';
export type { Poolable } from './core/ObjectPool';
export { BatchUpdate, BatchManager } from './core/BatchUpdate';
export type { BatchUpdateOptions } from './core/BatchUpdate';
export { CompoundGraph } from './core/CompoundGraph';
export type { GroupConfig, GroupBounds } from './core/CompoundGraph';
export { EdgeBundling } from './core/EdgeBundling';
export type { EdgeBundlingConfig, BundledEdge } from './core/EdgeBundling';
export { TimeSeriesManager } from './core/TimeSeriesManager';
export type { TimeSnapshot, TimeSeriesConfig, TimeSeriesState } from './core/TimeSeriesManager';
export { GraphFilter, GraphSearch, PathFinder, NeighborhoodExplorer } from './core/GraphQuery';
export type { 
  FilterOptions, SearchOptions, SearchResult, 
  PathOptions, Path, NeighborhoodOptions, Neighborhood 
} from './core/GraphQuery';
export { WorkerForceLayout } from './layout/WorkerForceLayout';
export { HierarchicalLayout } from './layout/HierarchicalLayout';
export { TreeLayout } from './layout/TreeLayout';
export { OrganicLayout } from './layout/OrganicLayout';
export { RadialTreeLayout } from './layout/RadialTreeLayout';
export { CircularLayout } from './layout/CircularLayout';
export { GeometricLayout } from './layout/GeometricLayout';
export { LayoutAnimator } from './layout/LayoutAnimator';
export type { AnimationConfig, NodeTransition } from './layout/LayoutAnimator';
export { AdaptiveLayout } from './layout/AdaptiveLayout';
export type { AdaptiveLayoutConfig } from './layout/AdaptiveLayout';
export type { LayoutProgressCallback } from './layout/WorkerForceLayout';
export type { HierarchicalConfig } from './layout/HierarchicalLayout';
export type { TreeLayoutConfig } from './layout/TreeLayout';
export type { OrganicLayoutConfig } from './layout/OrganicLayout';
export type { RadialTreeLayoutConfig } from './layout/RadialTreeLayout';
export type { CircularLayoutConfig } from './layout/CircularLayout';
export type { GeometricLayoutConfig } from './layout/GeometricLayout';
export * from './core/BezierUtils';
export * from './types';

// UI Components - Disabled for v1.0 (under development)
// export * from './ui';

// Data Import/Export - Disabled for v1.0 (type issues to be resolved)
// export * from './io';

// Version
export const VERSION = '1.0.0';
