/**
 * Bezier Curve Utilities
 * 
 * Provides mathematical functions for working with quadratic and cubic bezier curves,
 * including accurate bounding box calculation for spatial indexing.
 */

import { BoundingBox } from './RTree';

export interface Point {
  x: number;
  y: number;
}

export interface QuadraticBezier {
  start: Point;
  control: Point;
  end: Point;
}

export interface CubicBezier {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

/**
 * Calculate point on quadratic bezier curve at parameter t (0 to 1)
 */
export function getQuadraticBezierPoint(
  start: Point,
  control: Point,
  end: Point,
  t: number
): Point {
  const t1 = 1 - t;
  return {
    x: t1 * t1 * start.x + 2 * t1 * t * control.x + t * t * end.x,
    y: t1 * t1 * start.y + 2 * t1 * t * control.y + t * t * end.y
  };
}

/**
 * Calculate point on cubic bezier curve at parameter t (0 to 1)
 */
export function getCubicBezierPoint(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  t: number
): Point {
  const t1 = 1 - t;
  const t1_2 = t1 * t1;
  const t1_3 = t1_2 * t1;
  const t_2 = t * t;
  const t_3 = t_2 * t;
  
  return {
    x: t1_3 * start.x + 3 * t1_2 * t * control1.x + 3 * t1 * t_2 * control2.x + t_3 * end.x,
    y: t1_3 * start.y + 3 * t1_2 * t * control1.y + 3 * t1 * t_2 * control2.y + t_3 * end.y
  };
}

/**
 * Calculate tangent angle at point on quadratic bezier curve
 */
export function getQuadraticBezierTangent(
  start: Point,
  control: Point,
  end: Point,
  t: number
): { angle: number; dx: number; dy: number } {
  const t1 = 1 - t;
  const dx = 2 * t1 * (control.x - start.x) + 2 * t * (end.x - control.x);
  const dy = 2 * t1 * (control.y - start.y) + 2 * t * (end.y - control.y);
  
  return {
    angle: Math.atan2(dy, dx),
    dx,
    dy
  };
}

/**
 * Calculate tangent angle at point on cubic bezier curve
 */
export function getCubicBezierTangent(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  t: number
): { angle: number; dx: number; dy: number } {
  const t1 = 1 - t;
  const t1_2 = t1 * t1;
  const t_2 = t * t;
  
  const dx = -3 * t1_2 * start.x + 3 * t1_2 * control1.x - 6 * t1 * t * control1.x + 
             6 * t1 * t * control2.x - 3 * t_2 * control2.x + 3 * t_2 * end.x;
  const dy = -3 * t1_2 * start.y + 3 * t1_2 * control1.y - 6 * t1 * t * control1.y + 
             6 * t1 * t * control2.y - 3 * t_2 * control2.y + 3 * t_2 * end.y;
  
  return {
    angle: Math.atan2(dy, dx),
    dx,
    dy
  };
}

/**
 * Calculate accurate bounding box for quadratic bezier curve
 * 
 * This is critical for spatial indexing - we need the actual bounds of the curve,
 * not just the bounds of the control points.
 */
export function getQuadraticBezierBounds(
  start: Point,
  control: Point,
  end: Point,
  strokeWidth: number = 2
): BoundingBox {
  // Start with endpoints
  let minX = Math.min(start.x, end.x);
  let maxX = Math.max(start.x, end.x);
  let minY = Math.min(start.y, end.y);
  let maxY = Math.max(start.y, end.y);

  // Find extrema by solving derivative = 0
  // For quadratic bezier: B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
  // Setting B'(t) = 0 and solving for t
  
  // X extrema
  const tx = (start.x - control.x) / (start.x - 2 * control.x + end.x);
  if (tx > 0 && tx < 1) {
    const extremaPoint = getQuadraticBezierPoint(start, control, end, tx);
    minX = Math.min(minX, extremaPoint.x);
    maxX = Math.max(maxX, extremaPoint.x);
  }
  
  // Y extrema
  const ty = (start.y - control.y) / (start.y - 2 * control.y + end.y);
  if (ty > 0 && ty < 1) {
    const extremaPoint = getQuadraticBezierPoint(start, control, end, ty);
    minY = Math.min(minY, extremaPoint.y);
    maxY = Math.max(maxY, extremaPoint.y);
  }

  // Expand by stroke width / 2 for hit testing
  const padding = strokeWidth / 2;
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + strokeWidth,
    height: (maxY - minY) + strokeWidth
  };
}

/**
 * Calculate accurate bounding box for cubic bezier curve
 */
export function getCubicBezierBounds(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  strokeWidth: number = 2
): BoundingBox {
  // Start with endpoints
  let minX = Math.min(start.x, end.x);
  let maxX = Math.max(start.x, end.x);
  let minY = Math.min(start.y, end.y);
  let maxY = Math.max(start.y, end.y);

  // For cubic bezier, we need to solve cubic equation for extrema
  // This is more complex, so we'll use a sampling approach for now
  // Sample the curve at regular intervals
  const samples = 20;
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const point = getCubicBezierPoint(start, control1, control2, end, t);
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  // Expand by stroke width / 2
  const padding = strokeWidth / 2;
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + strokeWidth,
    height: (maxY - minY) + strokeWidth
  };
}

/**
 * Calculate distance from point to quadratic bezier curve
 * Used for hit testing
 */
export function distanceToQuadraticBezier(
  point: Point,
  start: Point,
  control: Point,
  end: Point,
  samples: number = 20
): number {
  let minDist = Infinity;
  
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const curvePoint = getQuadraticBezierPoint(start, control, end, t);
    const dist = Math.sqrt(
      Math.pow(point.x - curvePoint.x, 2) + 
      Math.pow(point.y - curvePoint.y, 2)
    );
    minDist = Math.min(minDist, dist);
  }
  
  return minDist;
}

/**
 * Calculate distance from point to cubic bezier curve
 */
export function distanceToCubicBezier(
  point: Point,
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  samples: number = 20
): number {
  let minDist = Infinity;
  
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const curvePoint = getCubicBezierPoint(start, control1, control2, end, t);
    const dist = Math.sqrt(
      Math.pow(point.x - curvePoint.x, 2) + 
      Math.pow(point.y - curvePoint.y, 2)
    );
    minDist = Math.min(minDist, dist);
  }
  
  return minDist;
}

/**
 * Check if point is within tolerance of quadratic bezier curve
 */
export function isPointOnQuadraticBezier(
  point: Point,
  start: Point,
  control: Point,
  end: Point,
  tolerance: number = 5
): boolean {
  return distanceToQuadraticBezier(point, start, control, end) <= tolerance;
}

/**
 * Check if point is within tolerance of cubic bezier curve
 */
export function isPointOnCubicBezier(
  point: Point,
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  tolerance: number = 5
): boolean {
  return distanceToCubicBezier(point, start, control1, control2, end) <= tolerance;
}
