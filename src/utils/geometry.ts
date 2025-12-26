/**
 * Geometry utilities for edge hit detection
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Calculate distance from a point to a line segment
 */
export function distanceToLineSegment(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) {
    // Line segment is actually a point
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }
  
  // Calculate projection of point onto line
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t)); // Clamp to segment
  
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  
  const pdx = point.x - projX;
  const pdy = point.y - projY;
  
  return Math.sqrt(pdx * pdx + pdy * pdy);
}

/**
 * Calculate distance from a point to a quadratic Bezier curve
 * Uses adaptive sampling for accuracy
 */
export function distanceToQuadraticBezier(
  point: Point2D,
  start: Point2D,
  control: Point2D,
  end: Point2D,
  samples: number = 20
): number {
  let minDist = Infinity;
  
  // Sample points along the curve
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const curvePoint = getQuadraticBezierPoint(start, control, end, t);
    
    const dx = point.x - curvePoint.x;
    const dy = point.y - curvePoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
    }
  }
  
  return minDist;
}

/**
 * Calculate distance from a point to a cubic Bezier curve
 * Uses adaptive sampling for accuracy
 */
export function distanceToCubicBezier(
  point: Point2D,
  start: Point2D,
  control1: Point2D,
  control2: Point2D,
  end: Point2D,
  samples: number = 30
): number {
  let minDist = Infinity;
  
  // Sample points along the curve
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const curvePoint = getCubicBezierPoint(start, control1, control2, end, t);
    
    const dx = point.x - curvePoint.x;
    const dy = point.y - curvePoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
    }
  }
  
  return minDist;
}

/**
 * Get a point on a quadratic Bezier curve at parameter t
 */
export function getQuadraticBezierPoint(
  start: Point2D,
  control: Point2D,
  end: Point2D,
  t: number
): Point2D {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  
  return {
    x: uu * start.x + 2 * u * t * control.x + tt * end.x,
    y: uu * start.y + 2 * u * t * control.y + tt * end.y
  };
}

/**
 * Get a point on a cubic Bezier curve at parameter t
 */
export function getCubicBezierPoint(
  start: Point2D,
  control1: Point2D,
  control2: Point2D,
  end: Point2D,
  t: number
): Point2D {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const ttt = tt * t;
  const uuu = uu * u;
  
  return {
    x: uuu * start.x + 3 * uu * t * control1.x + 3 * u * tt * control2.x + ttt * end.x,
    y: uuu * start.y + 3 * uu * t * control1.y + 3 * u * tt * control2.y + ttt * end.y
  };
}

/**
 * Calculate control point for a quadratic Bezier curve
 * This creates a natural-looking curve for graph edges
 */
export function calculateBezierControlPoint(
  start: Point2D,
  end: Point2D,
  curvature: number = 0.3
): Point2D {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Perpendicular vector
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return { x: midX, y: midY };
  
  // Normalize perpendicular
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Offset control point perpendicular to the line
  const offset = length * curvature;
  
  return {
    x: midX + perpX * offset,
    y: midY + perpY * offset
  };
}
