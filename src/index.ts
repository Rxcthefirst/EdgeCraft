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
export * from './core/BezierUtils';
export * from './types';

// Version
export const VERSION = '0.1.0';
