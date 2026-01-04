/**
 * WebGL Shape Rendering System
 * Generates triangle geometry for complex node shapes
 * Calculates edge attachment points for proper arrow placement
 */

export interface ShapeGeometry {
  vertices: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
}

export class WebGLShapeRenderer {
  /**
   * Generate triangle geometry for a shape
   */
  static generateShapeGeometry(
    shape: 'circle' | 'rectangle' | 'diamond' | 'hexagon' | 'star' | 'roundrect',
    size: number,
    strokeWidth: number
  ): ShapeGeometry {
    switch (shape) {
      case 'circle':
        return this.generateCircle(size, strokeWidth);
      case 'rectangle':
        return this.generateRectangle(size, strokeWidth);
      case 'diamond':
        return this.generateDiamond(size, strokeWidth);
      case 'hexagon':
        return this.generateHexagon(size, strokeWidth);
      case 'star':
        return this.generateStar(size, strokeWidth);
      case 'roundrect':
        return this.generateRoundedRectangle(size, strokeWidth);
      default:
        return this.generateCircle(size, strokeWidth);
    }
  }

  /**
   * Calculate the point where an edge should attach to a node shape
   * This ensures arrows touch the shape boundary, not the center
   */
  static calculateEdgeAttachmentPoint(
    nodeX: number,
    nodeY: number,
    nodeSize: number,
    nodeShape: string,
    edgeX: number,
    edgeY: number
  ): { x: number; y: number } {
    const dx = edgeX - nodeX;
    const dy = edgeY - nodeY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      return { x: nodeX, y: nodeY };
    }
    
    const radius = nodeSize / 2;
    
    switch (nodeShape) {
      case 'circle':
        return {
          x: nodeX + Math.cos(angle) * radius,
          y: nodeY + Math.sin(angle) * radius
        };
        
      case 'rectangle':
      case 'roundrect': {
        // Rectangle edge intersection
        const absX = Math.abs(Math.cos(angle));
        const absY = Math.abs(Math.sin(angle));
        
        if (absX > absY) {
          // Hit left or right edge
          const edgeRadius = radius / absX;
          return {
            x: nodeX + Math.cos(angle) * edgeRadius,
            y: nodeY + Math.sin(angle) * edgeRadius
          };
        } else {
          // Hit top or bottom edge
          const edgeRadius = radius / absY;
          return {
            x: nodeX + Math.cos(angle) * edgeRadius,
            y: nodeY + Math.sin(angle) * edgeRadius
          };
        }
      }
        
      case 'diamond': {
        // Diamond is rotated square
        const rotAngle = angle + Math.PI / 4;
        const absX = Math.abs(Math.cos(rotAngle));
        const absY = Math.abs(Math.sin(rotAngle));
        
        const edgeRadius = radius / Math.max(absX, absY);
        return {
          x: nodeX + Math.cos(angle) * edgeRadius,
          y: nodeY + Math.sin(angle) * edgeRadius
        };
      }
        
      case 'hexagon': {
        // Hexagon has 6 sides at 60° intervals
        const hexAngle = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const sideAngle = Math.floor(hexAngle / (Math.PI / 3)) * (Math.PI / 3);
        const nextSideAngle = sideAngle + Math.PI / 3;
        
        // Interpolate between two sides
        const t = (hexAngle - sideAngle) / (Math.PI / 3);
        const interpAngle = sideAngle + t * (Math.PI / 3);
        
        const edgeRadius = radius / Math.cos((hexAngle - interpAngle));
        return {
          x: nodeX + Math.cos(angle) * edgeRadius,
          y: nodeY + Math.sin(angle) * edgeRadius
        };
      }
        
      case 'star': {
        // Star shape with 5 points
        const starAngle = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const pointAngle = Math.floor(starAngle / (Math.PI * 2 / 5)) * (Math.PI * 2 / 5);
        const nextPointAngle = pointAngle + Math.PI * 2 / 5;
        
        // Outer points vs inner valleys
        const isPoint = (starAngle - pointAngle) < (Math.PI / 5);
        const effectiveRadius = isPoint ? radius : radius * 0.4;
        
        return {
          x: nodeX + Math.cos(angle) * effectiveRadius,
          y: nodeY + Math.sin(angle) * effectiveRadius
        };
      }
        
      default:
        return {
          x: nodeX + Math.cos(angle) * radius,
          y: nodeY + Math.sin(angle) * radius
        };
    }
  }

  /**
   * Generate circle geometry
   */
  private static generateCircle(size: number, strokeWidth: number): ShapeGeometry {
    const segments = 32;
    const radius = size / 2;
    const innerRadius = radius - strokeWidth;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Fill circle (if no stroke, or for filled area)
    vertices.push(0, 0); // Center
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
    }
    
    // Indices for fill
    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1);
    }
    
    // Stroke ring
    if (strokeWidth > 0) {
      const fillVertCount = vertices.length / 2;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        // Inner edge
        vertices.push(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius
        );
        // Outer edge
        vertices.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        );
      }
      
      // Indices for stroke ring
      for (let i = 0; i < segments; i++) {
        const base = fillVertCount + i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length / 2
    };
  }

  /**
   * Generate rectangle geometry
   */
  private static generateRectangle(size: number, strokeWidth: number): ShapeGeometry {
    const halfSize = size / 2;
    const innerHalfSize = halfSize - strokeWidth;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Fill rectangle
    if (strokeWidth < halfSize) {
      vertices.push(
        -innerHalfSize, -innerHalfSize,
        innerHalfSize, -innerHalfSize,
        innerHalfSize, innerHalfSize,
        -innerHalfSize, innerHalfSize
      );
      indices.push(0, 1, 2, 0, 2, 3);
    }
    
    // Stroke
    if (strokeWidth > 0) {
      const base = vertices.length / 2;
      
      // Outer quad
      vertices.push(
        -halfSize, -halfSize,
        halfSize, -halfSize,
        halfSize, halfSize,
        -halfSize, halfSize
      );
      
      // Inner quad
      vertices.push(
        -innerHalfSize, -innerHalfSize,
        innerHalfSize, -innerHalfSize,
        innerHalfSize, innerHalfSize,
        -innerHalfSize, innerHalfSize
      );
      
      // Stroke quads (4 sides)
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        indices.push(
          base + i, base + next, base + 4 + next,
          base + i, base + 4 + next, base + 4 + i
        );
      }
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length / 2
    };
  }

  /**
   * Generate diamond geometry
   */
  private static generateDiamond(size: number, strokeWidth: number): ShapeGeometry {
    const halfSize = size / 2;
    const innerHalfSize = halfSize - strokeWidth / Math.sqrt(2);
    
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Fill diamond
    if (strokeWidth < halfSize) {
      vertices.push(
        0, -innerHalfSize,  // Top
        innerHalfSize, 0,   // Right
        0, innerHalfSize,   // Bottom
        -innerHalfSize, 0   // Left
      );
      indices.push(0, 1, 2, 0, 2, 3);
    }
    
    // Stroke
    if (strokeWidth > 0) {
      const base = vertices.length / 2;
      
      // Outer diamond
      vertices.push(
        0, -halfSize,
        halfSize, 0,
        0, halfSize,
        -halfSize, 0
      );
      
      // Inner diamond
      vertices.push(
        0, -innerHalfSize,
        innerHalfSize, 0,
        0, innerHalfSize,
        -innerHalfSize, 0
      );
      
      // Stroke quads
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        indices.push(
          base + i, base + next, base + 4 + next,
          base + i, base + 4 + next, base + 4 + i
        );
      }
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length / 2
    };
  }

  /**
   * Generate hexagon geometry
   */
  private static generateHexagon(size: number, strokeWidth: number): ShapeGeometry {
    const radius = size / 2;
    const innerRadius = radius - strokeWidth;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Fill hexagon
    vertices.push(0, 0); // Center
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      vertices.push(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
    }
    
    // Fill indices
    for (let i = 1; i < 6; i++) {
      indices.push(0, i, i + 1);
    }
    indices.push(0, 6, 1);
    
    // Stroke
    if (strokeWidth > 0) {
      const base = vertices.length / 2;
      
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        // Inner
        vertices.push(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius
        );
        // Outer
        vertices.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        );
      }
      
      // Stroke quads
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        const vi = base + i * 2;
        const vn = base + next * 2;
        indices.push(
          vi, vi + 1, vn + 1,
          vi, vn + 1, vn
        );
      }
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length / 2
    };
  }

  /**
   * Generate star geometry (5-pointed)
   */
  private static generateStar(size: number, strokeWidth: number): ShapeGeometry {
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const strokeOuter = outerRadius - strokeWidth;
    const strokeInner = Math.max(0, innerRadius - strokeWidth);
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const points = 5;
    
    // Center
    vertices.push(0, 0);
    
    // Fill star
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? strokeOuter : strokeInner;
      vertices.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      );
    }
    
    // Fill indices
    for (let i = 1; i <= points * 2; i++) {
      indices.push(0, i, (i % (points * 2)) + 1);
    }
    
    // Stroke (simplified - just outline)
    if (strokeWidth > 0) {
      const base = vertices.length / 2;
      
      for (let i = 0; i < points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const innerR = i % 2 === 0 ? strokeOuter : strokeInner;
        const outerR = i % 2 === 0 ? outerRadius : innerRadius;
        
        vertices.push(
          Math.cos(angle) * innerR,
          Math.sin(angle) * innerR
        );
        vertices.push(
          Math.cos(angle) * outerR,
          Math.sin(angle) * outerR
        );
      }
      
      // Stroke quads
      for (let i = 0; i < points * 2; i++) {
        const next = (i + 1) % (points * 2);
        const vi = base + i * 2;
        const vn = base + next * 2;
        indices.push(
          vi, vi + 1, vn + 1,
          vi, vn + 1, vn
        );
      }
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length / 2
    };
  }

  /**
   * Generate rounded rectangle geometry
   */
  private static generateRoundedRectangle(size: number, strokeWidth: number): ShapeGeometry {
    const halfSize = size / 2;
    const cornerRadius = size * 0.2;
    const innerHalfSize = halfSize - strokeWidth;
    const innerCornerRadius = Math.max(0, cornerRadius - strokeWidth);
    
    const segments = 8; // Segments per corner
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Center
    vertices.push(0, 0);
    
    // Generate fill with rounded corners
    const corners = [
      { x: innerHalfSize - innerCornerRadius, y: -innerHalfSize + innerCornerRadius, startAngle: -Math.PI / 2 },
      { x: innerHalfSize - innerCornerRadius, y: innerHalfSize - innerCornerRadius, startAngle: 0 },
      { x: -innerHalfSize + innerCornerRadius, y: innerHalfSize - innerCornerRadius, startAngle: Math.PI / 2 },
      { x: -innerHalfSize + innerCornerRadius, y: -innerHalfSize + innerCornerRadius, startAngle: Math.PI }
    ];
    
    for (const corner of corners) {
      for (let i = 0; i <= segments; i++) {
        const angle = corner.startAngle + (i / segments) * (Math.PI / 2);
        vertices.push(
          corner.x + Math.cos(angle) * innerCornerRadius,
          corner.y + Math.sin(angle) * innerCornerRadius
        );
      }
    }
    
    // Fill indices
    const totalPoints = corners.length * (segments + 1);
    for (let i = 1; i < totalPoints; i++) {
      indices.push(0, i, i + 1);
    }
    indices.push(0, totalPoints, 1);
    
    // Stroke (simplified)
    if (strokeWidth > 0) {
      const base = vertices.length / 2;
      
      const outerCorners = [
        { x: halfSize - cornerRadius, y: -halfSize + cornerRadius, startAngle: -Math.PI / 2 },
        { x: halfSize - cornerRadius, y: halfSize - cornerRadius, startAngle: 0 },
        { x: -halfSize + cornerRadius, y: halfSize - cornerRadius, startAngle: Math.PI / 2 },
        { x: -halfSize + cornerRadius, y: -halfSize + cornerRadius, startAngle: Math.PI }
      ];
      
      for (let c = 0; c < corners.length; c++) {
        for (let i = 0; i <= segments; i++) {
          const angle = corners[c].startAngle + (i / segments) * (Math.PI / 2);
          
          // Inner
          vertices.push(
            corners[c].x + Math.cos(angle) * innerCornerRadius,
            corners[c].y + Math.sin(angle) * innerCornerRadius
          );
          
          // Outer
          vertices.push(
            outerCorners[c].x + Math.cos(angle) * cornerRadius,
            outerCorners[c].y + Math.sin(angle) * cornerRadius
          );
        }
      }
      
      // Stroke quads
      const strokePoints = corners.length * (segments + 1);
      for (let i = 0; i < strokePoints; i++) {
        const next = (i + 1) % strokePoints;
        const vi = base + i * 2;
        const vn = base + next * 2;
        indices.push(
          vi, vi + 1, vn + 1,
          vi, vn + 1, vn
        );
      }
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length / 2
    };
  }

  /**
   * Generate arrow geometry
   */
  static generateArrowGeometry(
    size: number,
    shape: 'triangle' | 'chevron' | 'diamond' | 'circle' = 'triangle'
  ): ShapeGeometry {
    const vertices: number[] = [];
    const indices: number[] = [];
    
    switch (shape) {
      case 'triangle':
        vertices.push(
          0, 0,           // Tip
          -size, size/2,  // Bottom left
          -size, -size/2  // Top left
        );
        indices.push(0, 1, 2);
        break;
        
      case 'chevron':
        vertices.push(
          0, 0,
          -size * 0.7, size/2,
          -size * 0.5, 0,
          -size * 0.7, -size/2
        );
        indices.push(0, 1, 2, 0, 2, 3);
        break;
        
      case 'diamond':
        vertices.push(
          0, 0,
          -size * 0.5, size/3,
          -size, 0,
          -size * 0.5, -size/3
        );
        indices.push(0, 1, 2, 0, 2, 3);
        break;
        
      case 'circle': {
        const segments = 16;
        const radius = size / 2;
        vertices.push(0, 0);
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          vertices.push(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
          );
        }
        for (let i = 1; i <= segments; i++) {
          indices.push(0, i, i + 1);
        }
        break;
      }
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length / 2
    };
  }
}
