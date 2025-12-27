/**
 * Multi-Edge Bundling System
 * 
 * Handles intelligent bundling of multiple edges between the same node pair.
 * Implements sophisticated curvature distribution to prevent visual overlap.
 * 
 * Strategy:
 * - 1 edge: Straight line (curvature = 0)
 * - 2 edges: Both curved symmetrically (one left, one right)
 * - 3 edges: Center straight, two curves on each side
 * - N edges: Dynamic curvature scaling to maintain separation
 */

import { GraphEdge, EdgeId, NodeId } from '../types';

export interface EdgeBundleInfo {
  edgeId: EdgeId;
  curvature: number;        // Curvature amount (0 = straight)
  parallelOffset: number;   // Perpendicular offset from center line
  bundleIndex: number;      // Position in bundle (0 to N-1)
  bundleSize: number;       // Total edges in this bundle
}

export interface BundleConfig {
  /** Base curvature for curved edges (default: 0.2) */
  baseCurvature?: number;
  
  /** Spacing between parallel edges in pixels (default: 25) */
  edgeSpacing?: number;
  
  /** Maximum curvature for heavily bundled edges (default: 0.4) */
  maxCurvature?: number;
  
  /** Threshold for LOD collapse (future feature, default: 10) */
  lodThreshold?: number;
}

/**
 * Generates a unique key for a node pair (order-independent for undirected)
 */
function getNodePairKey(sourceId: NodeId, targetId: NodeId, directed: boolean = true): string {
  if (directed) {
    return `${sourceId}->${targetId}`;
  }
  // For undirected graphs, normalize the order
  return sourceId < targetId ? `${sourceId}<->${targetId}` : `${targetId}<->${sourceId}`;
}

export class MultiEdgeBundler {
  private config: Required<BundleConfig>;
  private edgeBundles: Map<string, EdgeId[]>;
  private bundleInfo: Map<EdgeId, EdgeBundleInfo>;
  private bidirectionalBundleSizes: Map<string, number>;

  constructor(config: BundleConfig = {}) {
    this.config = {
      baseCurvature: config.baseCurvature ?? 0.2,
      edgeSpacing: config.edgeSpacing ?? 25,
      maxCurvature: config.maxCurvature ?? 0.4,
      lodThreshold: config.lodThreshold ?? 10
    };
    
    this.edgeBundles = new Map();
    this.bundleInfo = new Map();
    this.bidirectionalBundleSizes = new Map();
  }

  /**
   * Analyze edges and compute bundle information
   */
  analyzeBundles(edges: GraphEdge[], directed: boolean = true): void {
    this.edgeBundles.clear();
    this.bundleInfo.clear();

    // Group edges by node pair
    edges.forEach(edge => {
      const sourceId = 'source' in edge ? edge.source : (edge as any).subject;
      const targetId = 'target' in edge ? edge.target : (edge as any).object;
      
      // Skip self-loops
      if (sourceId === targetId) {
        return;
      }

      const key = getNodePairKey(sourceId, targetId, directed);
      
      if (!this.edgeBundles.has(key)) {
        this.edgeBundles.set(key, []);
      }
      
      this.edgeBundles.get(key)!.push(edge.id);
    });

    // For directed graphs, check for bidirectional edges and ensure they both get curves
    // if either direction has multiple edges
    if (directed) {
      const bidirectionalAdjustments = new Map<string, number>();
      
      this.edgeBundles.forEach((edgeIds, key) => {
        const [sourceId, targetId] = key.split('->');
        const reverseKey = `${targetId}->${sourceId}`;
        
        if (this.edgeBundles.has(reverseKey)) {
          const forwardCount = edgeIds.length;
          const reverseCount = this.edgeBundles.get(reverseKey)!.length;
          const maxCount = Math.max(forwardCount, reverseCount);
          
          // If either direction has multiple edges, treat both as multi-edge bundles
          if (maxCount > 1) {
            bidirectionalAdjustments.set(key, maxCount);
            bidirectionalAdjustments.set(reverseKey, maxCount);
          }
        }
      });
      
      // Apply bidirectional adjustments
      this.bidirectionalBundleSizes = bidirectionalAdjustments;
    }

    // Calculate bundle info for each edge
    this.edgeBundles.forEach((edgeIds, key) => {
      // Check if we need to adjust for bidirectional edges
      const adjustedBundleSize = this.bidirectionalBundleSizes.get(key);
      this.calculateBundleDistribution(edgeIds, adjustedBundleSize);
    });
  }

  /**
   * Calculate curvature and offset distribution for a bundle of edges
   * 
   * Strategy:
   * - 1 edge: straight (curvature=0, offset=0)
   * - 2 edges: both curved symmetrically (curvature=±baseCurvature, offset=±spacing/2)
   * - 3 edges: center straight, sides curved (one at 0, two at ±baseCurvature)
   * - N edges: symmetric distribution with increasing curvature for outer edges
   */
  private calculateBundleDistribution(edgeIds: EdgeId[], adjustedBundleSize?: number): void {
    const actualSize = edgeIds.length;
    const bundleSize = adjustedBundleSize || actualSize;

    // For single-edge bundles that are part of bidirectional pairs, still apply curvature
    if (actualSize === 1 && bundleSize > 1) {
      // This is a reverse direction edge in a bidirectional bundle
      // Give it a curve so it doesn't overlap with the forward direction
      this.bundleInfo.set(edgeIds[0], {
        edgeId: edgeIds[0],
        curvature: this.config.baseCurvature,
        parallelOffset: this.config.edgeSpacing / 2,
        bundleIndex: 0,
        bundleSize: bundleSize
      });
      return;
    }

    if (bundleSize === 1) {
      // Single edge - straight line
      this.bundleInfo.set(edgeIds[0], {
        edgeId: edgeIds[0],
        curvature: 0,
        parallelOffset: 0,
        bundleIndex: 0,
        bundleSize: 1
      });
      return;
    }

    if (bundleSize === 2) {
      // Two edges - both curved symmetrically
      this.bundleInfo.set(edgeIds[0], {
        edgeId: edgeIds[0],
        curvature: this.config.baseCurvature,
        parallelOffset: -this.config.edgeSpacing / 2,
        bundleIndex: 0,
        bundleSize: 2
      });
      
      this.bundleInfo.set(edgeIds[1], {
        edgeId: edgeIds[1],
        curvature: -this.config.baseCurvature,
        parallelOffset: this.config.edgeSpacing / 2,
        bundleIndex: 1,
        bundleSize: 2
      });
      return;
    }

    // Three or more edges - center straight with symmetric curves
    const isOdd = bundleSize % 2 === 1;
    const centerIndex = Math.floor(bundleSize / 2);

    edgeIds.forEach((edgeId, index) => {
      let curvature: number;
      let offset: number;

      if (isOdd && index === centerIndex) {
        // Center edge is straight
        curvature = 0;
        offset = 0;
      } else {
        // Calculate position relative to center
        const distanceFromCenter = index - centerIndex;
        
        // Scale curvature based on distance from center
        // Further edges get more curvature to maintain separation
        const curvatureScale = Math.abs(distanceFromCenter) / centerIndex;
        curvature = this.config.baseCurvature * curvatureScale;
        
        // Clamp to max curvature
        curvature = Math.min(curvature, this.config.maxCurvature);
        
        // Alternate sign for left/right curves
        curvature *= Math.sign(distanceFromCenter);
        
        // Calculate offset
        offset = distanceFromCenter * this.config.edgeSpacing;
      }

      this.bundleInfo.set(edgeId, {
        edgeId,
        curvature,
        parallelOffset: offset,
        bundleIndex: index,
        bundleSize
      });
    });
  }

  /**
   * Get bundle information for a specific edge
   */
  getBundleInfo(edgeId: EdgeId): EdgeBundleInfo | undefined {
    return this.bundleInfo.get(edgeId);
  }

  /**
   * Get all edges in the same bundle as the given edge
   */
  getBundleEdges(edgeId: EdgeId): EdgeId[] {
    for (const [key, edgeIds] of this.edgeBundles) {
      if (edgeIds.includes(edgeId)) {
        return edgeIds;
      }
    }
    return [edgeId];
  }

  /**
   * Check if an edge is part of a multi-edge bundle
   */
  isMultiEdge(edgeId: EdgeId): boolean {
    const info = this.bundleInfo.get(edgeId);
    return info !== undefined && info.bundleSize > 1;
  }

  /**
   * Get statistics about edge bundling
   */
  getStatistics(): {
    totalBundles: number;
    multiEdgeBundles: number;
    largestBundle: number;
    averageBundleSize: number;
  } {
    const multiEdgeBundles = Array.from(this.edgeBundles.values()).filter(b => b.length > 1);
    const bundleSizes = multiEdgeBundles.map(b => b.length);
    
    return {
      totalBundles: this.edgeBundles.size,
      multiEdgeBundles: multiEdgeBundles.length,
      largestBundle: bundleSizes.length > 0 ? Math.max(...bundleSizes) : 0,
      averageBundleSize: bundleSizes.length > 0 
        ? bundleSizes.reduce((a, b) => a + b, 0) / bundleSizes.length 
        : 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BundleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear all bundle information
   */
  clear(): void {
    this.edgeBundles.clear();
    this.bundleInfo.clear();
  }
}
