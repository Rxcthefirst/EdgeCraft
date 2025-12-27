# Advanced Edge Rendering in EdgeCraft

**Status:** Design Document  
**Version:** 1.0  
**Date:** December 26, 2025

---

## Executive Summary

This document describes EdgeCraft's advanced edge rendering capabilities, designed to support sophisticated graph visualization patterns common in RDF ontologies, knowledge graphs, and complex network analysis. Our implementation goes beyond simple directed edges to support:

1. **Directional Arrows** - Configurable arrow placement (forward, backward, bidirectional)
2. **Self-Loops** - Curved edges connecting a node to itself
3. **Multi-Edges** - Multiple edges between the same node pair
4. **Bidirectional Relationships** - Simultaneous forward and backward edges
5. **RDF Inverse Relationships** - Interactive glyphs representing both sides of inverse properties

These features position EdgeCraft as the **premier open-source library for ontology and knowledge graph visualization**, with capabilities matching or exceeding commercial tools like Keylines.

---

## Problem Statement

### 1. Directed Graphs Require Visual Directionality

**Current State:** EdgeCraft draws undirected edges by default.

**Challenge:** Many graphs are inherently directed:
- Social networks (Alice follows Bob)
- Dependencies (Package A depends on Package B)
- RDF triples (Subject → Predicate → Object)
- Process flows (Step 1 → Step 2)

**User Need:** Clear visual indication of edge direction with configurable arrow placement.

### 2. Self-Referential Relationships

**Current State:** Edges assume distinct source and target nodes.

**Challenge:** Nodes often have relationships with themselves:
- File system loops (symlinks)
- Social networks (self-endorsement)
- RDF reflexive properties (rdfs:subClassOf can be reflexive)

**User Need:** Curved loop edges that don't obscure the node.

### 3. Multiple Relationships Between Same Nodes

**Current State:** Multiple edges overlap, appearing as a single edge.

**Challenge:** Two nodes may have multiple distinct relationships:
- Person A: `knows`, `worksAt`, `marriedTo` → Person B
- Package A: `depends`, `suggests`, `conflicts` → Package B
- RDF: Multiple predicates between same subject/object

**User Need:** Visually distinct curved paths for each edge, avoiding overlaps.

### 4. Bidirectional Relationships

**Current State:** Forward and reverse edges render as two separate lines.

**Challenge:** Some relationships are inherently bidirectional:
- Friendship (symmetric)
- Co-authorship
- Network connections (bidirectional data flow)

**User Need:** Single edge with arrows on both ends, or parallel edges with opposite directions.

### 5. RDF Inverse Properties (The Complex Case)

**Current State:** RDF inverse properties render as separate edges or require manual handling.

**Challenge:** OWL/RDF ontologies define inverse object properties:
```turtle
:hasPart owl:inverseOf :partOf .
:parent owl:inverseOf :child .
:locatedIn owl:inverseOf :contains .
```

When we have:
```turtle
:Car123 :hasPart :Engine456 .
```

We can infer:
```turtle
:Engine456 :partOf :Car123 .
```

**User Need:** 
- Visualize both directions of the relationship on a single edge
- Show both predicates (hasPart AND partOf) with their proper directionality
- Allow interaction with each side independently
- Normalize multi-directional relationships into coherent visual representation

This is what separates EdgeCraft from competitors - **elegant abstractions for complex RDF semantics**.

---

## Proposed Solution

### Architecture Overview

```typescript
// Enhanced EdgeStyle with directional controls
interface EdgeStyle {
  // Existing properties
  stroke?: string;
  strokeWidth?: number;
  
  // NEW: Arrow configuration
  arrow?: ArrowConfig;
  
  // NEW: Self-loop configuration
  selfLoop?: SelfLoopConfig;
  
  // NEW: Multi-edge handling
  parallelOffset?: number;
  
  // NEW: RDF inverse relationship glyphs
  glyphs?: EdgeGlyphConfig[];
}

interface ArrowConfig {
  // Arrow placement
  position: 'forward' | 'backward' | 'both' | 'none';
  
  // Arrow style
  size?: number;           // Arrow head size
  shape?: 'triangle' | 'chevron' | 'diamond' | 'circle';
  filled?: boolean;        // Filled or outline
  
  // Advanced: offset from node (for multi-edges)
  offset?: number;         // Distance from target node
}

interface SelfLoopConfig {
  // Loop geometry
  radius?: number;         // Size of the loop
  angle?: number;          // Position around node (0-360°)
  
  // Visual style
  clockwise?: boolean;     // Direction of curve
}

interface EdgeGlyphConfig {
  // Position on edge
  position: number;        // 0.0 to 1.0 along edge (0.5 = midpoint)
  
  // Glyph content
  text?: string;           // Short label
  icon?: string;           // Unicode icon or emoji
  shape?: 'circle' | 'square' | 'diamond';
  
  // Visual style
  size?: number;
  fill?: string;
  stroke?: string;
  
  // Interaction
  interactive?: boolean;   // Can be clicked/hovered
  tooltip?: string;        // Hover tooltip
  
  // RDF-specific: direction indicator
  direction?: 'forward' | 'backward';  // Which way does this glyph point?
}
```

---

## Implementation Details

### 1. Directional Arrows

#### Canvas Renderer Implementation

```typescript
class CanvasRenderer {
  private renderEdge(ctx: CanvasRenderingContext2D, edge: GraphEdge, style: EdgeStyle): void {
    const source = this.getNodePosition(edge.source);
    const target = this.getNodePosition(edge.target);
    
    // Draw edge line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    
    // Draw arrows
    if (style.arrow) {
      if (style.arrow.position === 'forward' || style.arrow.position === 'both') {
        this.drawArrow(ctx, source, target, style.arrow);
      }
      if (style.arrow.position === 'backward' || style.arrow.position === 'both') {
        this.drawArrow(ctx, target, source, style.arrow);
      }
    }
  }
  
  private drawArrow(
    ctx: CanvasRenderingContext2D, 
    from: Position, 
    to: Position, 
    config: ArrowConfig
  ): void {
    const size = config.size || 10;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    // Calculate arrow tip position (offset from target)
    const offset = config.offset || 0;
    const tipX = to.x - Math.cos(angle) * offset;
    const tipY = to.y - Math.sin(angle) * offset;
    
    // Arrow wings
    const leftAngle = angle + Math.PI - Math.PI / 6;
    const rightAngle = angle + Math.PI + Math.PI / 6;
    
    const leftX = tipX + Math.cos(leftAngle) * size;
    const leftY = tipY + Math.sin(leftAngle) * size;
    const rightX = tipX + Math.cos(rightAngle) * size;
    const rightY = tipY + Math.sin(rightAngle) * size;
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    
    if (config.filled !== false) {
      ctx.fill();
    }
    ctx.stroke();
  }
}
```

#### WebGL Shader for Arrows

```glsl
// Fragment shader for arrow heads
#version 300 es
precision mediump float;

in vec2 v_texCoord;
in vec4 v_color;
in float v_arrowType; // 0=none, 1=forward, 2=backward, 3=both

out vec4 fragColor;

void main() {
  // Calculate if this fragment is part of an arrow
  float dist = length(v_texCoord);
  
  // Arrow shape using distance field
  float arrowShape = 0.0;
  if (v_arrowType == 1.0 || v_arrowType == 3.0) {
    // Forward arrow
    vec2 p = v_texCoord;
    float d = abs(p.y) - p.x * 0.5;
    arrowShape = max(arrowShape, 1.0 - smoothstep(0.0, 0.1, d));
  }
  
  if (v_arrowType == 2.0 || v_arrowType == 3.0) {
    // Backward arrow
    vec2 p = vec2(-v_texCoord.x, v_texCoord.y);
    float d = abs(p.y) - p.x * 0.5;
    arrowShape = max(arrowShape, 1.0 - smoothstep(0.0, 0.1, d));
  }
  
  fragColor = v_color * arrowShape;
}
```

### 2. Self-Loop Edges

#### Geometry Calculation

```typescript
function calculateSelfLoopPath(
  nodePos: Position, 
  nodeRadius: number, 
  config: SelfLoopConfig
): BezierPath {
  const loopRadius = config.radius || 40;
  const angle = (config.angle || 0) * Math.PI / 180;
  const clockwise = config.clockwise !== false;
  
  // Calculate attachment points on node circle
  const startAngle = angle - Math.PI / 4;
  const endAngle = angle + Math.PI / 4;
  
  const start = {
    x: nodePos.x + nodeRadius * Math.cos(startAngle),
    y: nodePos.y + nodeRadius * Math.sin(startAngle)
  };
  
  const end = {
    x: nodePos.x + nodeRadius * Math.cos(endAngle),
    y: nodePos.y + nodeRadius * Math.sin(endAngle)
  };
  
  // Control points for bezier curve (creates loop outside node)
  const controlOffset = loopRadius * (clockwise ? 1 : -1);
  const controlAngle = angle;
  
  const control1 = {
    x: nodePos.x + (nodeRadius + controlOffset) * Math.cos(controlAngle - Math.PI / 3),
    y: nodePos.y + (nodeRadius + controlOffset) * Math.sin(controlAngle - Math.PI / 3)
  };
  
  const control2 = {
    x: nodePos.x + (nodeRadius + controlOffset) * Math.cos(controlAngle + Math.PI / 3),
    y: nodePos.y + (nodeRadius + controlOffset) * Math.sin(controlAngle + Math.PI / 3)
  };
  
  return {
    start,
    control1,
    control2,
    end,
    type: 'cubic-bezier'
  };
}
```

#### Canvas Rendering

```typescript
private renderSelfLoop(
  ctx: CanvasRenderingContext2D, 
  edge: GraphEdge, 
  style: EdgeStyle
): void {
  const node = this.getNodePosition(edge.source);
  const path = calculateSelfLoopPath(node, 30, style.selfLoop || {});
  
  // Draw cubic bezier curve
  ctx.beginPath();
  ctx.moveTo(path.start.x, path.start.y);
  ctx.bezierCurveTo(
    path.control1.x, path.control1.y,
    path.control2.x, path.control2.y,
    path.end.x, path.end.y
  );
  ctx.stroke();
  
  // Draw arrow at end if configured
  if (style.arrow?.position === 'forward' || style.arrow?.position === 'both') {
    // Calculate tangent at end point for arrow direction
    const t = 1.0;
    const tangent = this.getBezierTangent(path, t);
    this.drawArrowAtPoint(ctx, path.end, tangent, style.arrow);
  }
}
```

### 3. Multi-Edge Bundling

#### Parallel Edge Offset Calculation

```typescript
class EdgeBundler {
  /**
   * Calculate offsets for multiple edges between same nodes
   */
  calculateParallelOffsets(edges: GraphEdge[]): Map<string, number> {
    const offsets = new Map<string, number>();
    
    // Group edges by source-target pair
    const edgeGroups = new Map<string, GraphEdge[]>();
    edges.forEach(edge => {
      const key = `${edge.source}-${edge.target}`;
      if (!edgeGroups.has(key)) {
        edgeGroups.set(key, []);
      }
      edgeGroups.get(key)!.push(edge);
    });
    
    // Calculate offsets for each group
    edgeGroups.forEach((group, key) => {
      if (group.length === 1) {
        // Single edge - no offset
        offsets.set(group[0].id, 0);
      } else {
        // Multiple edges - distribute symmetrically
        const spacing = 20; // pixels between parallel edges
        const totalWidth = (group.length - 1) * spacing;
        const startOffset = -totalWidth / 2;
        
        group.forEach((edge, index) => {
          offsets.set(edge.id, startOffset + index * spacing);
        });
      }
    });
    
    return offsets;
  }
  
  /**
   * Calculate bezier curve for offset edge
   */
  calculateOffsetBezier(
    source: Position,
    target: Position,
    offset: number
  ): QuadraticBezierPath {
    // Perpendicular offset direction
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    const perpX = -dy / len;
    const perpY = dx / len;
    
    // Control point offset perpendicular to edge
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    
    const controlX = midX + perpX * offset;
    const controlY = midY + perpY * offset;
    
    return {
      start: source,
      control: { x: controlX, y: controlY },
      end: target,
      type: 'quadratic-bezier'
    };
  }
}
```

### 4. Bidirectional Edges

#### Dual-Arrow Rendering

```typescript
function renderBidirectionalEdge(
  ctx: CanvasRenderingContext2D,
  edge: GraphEdge,
  style: EdgeStyle
): void {
  const source = getNodePosition(edge.source);
  const target = getNodePosition(edge.target);
  
  // Option 1: Single edge with arrows on both ends
  if (style.bidirectional === 'single') {
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    
    // Arrows on both ends
    drawArrow(ctx, source, target, style.arrow!);
    drawArrow(ctx, target, source, style.arrow!);
  }
  
  // Option 2: Parallel edges with opposite directions
  else if (style.bidirectional === 'parallel') {
    const offset = 8; // pixels between parallel edges
    
    // Forward edge (slightly offset)
    const forwardPath = calculateOffsetBezier(source, target, offset / 2);
    renderBezierPath(ctx, forwardPath);
    drawArrowAtBezierEnd(ctx, forwardPath, style.arrow!);
    
    // Backward edge (opposite offset)
    const backwardPath = calculateOffsetBezier(target, source, offset / 2);
    renderBezierPath(ctx, backwardPath);
    drawArrowAtBezierEnd(ctx, backwardPath, style.arrow!);
  }
}
```

### 5. RDF Inverse Relationship Glyphs

#### The Flagship Feature

This is where EdgeCraft truly differentiates itself from competitors. We provide an elegant abstraction for complex RDF semantics.

#### Data Model

```typescript
interface RDFInverseEdge extends GraphEdge {
  // Primary direction
  predicate: string;           // e.g., "hasPart"
  
  // Inverse direction
  inversePredicate?: string;   // e.g., "partOf"
  
  // Optional: OWL inverse property URI
  inversePropertyURI?: string; // e.g., "http://example.org/partOf"
}

interface RDFEdgeStyle extends EdgeStyle {
  // RDF-specific glyph configuration
  showInverseGlyphs?: boolean;
  
  // Glyph styling
  glyphStyle?: {
    size: number;
    shape: 'circle' | 'diamond' | 'hexagon';
    fill: string;
    stroke: string;
    textColor: string;
    fontSize: number;
  };
  
  // Interaction
  onGlyphClick?: (predicate: string, direction: 'forward' | 'backward') => void;
  onGlyphHover?: (predicate: string, direction: 'forward' | 'backward') => void;
}
```

#### Rendering Implementation

```typescript
class RDFEdgeRenderer {
  /**
   * Render edge with bidirectional RDF predicates
   */
  renderRDFInverseEdge(
    ctx: CanvasRenderingContext2D,
    edge: RDFInverseEdge,
    style: RDFEdgeStyle
  ): void {
    const source = this.getNodePosition(edge.source);
    const target = this.getNodePosition(edge.target);
    
    // Draw main edge line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    
    if (!style.showInverseGlyphs || !edge.inversePredicate) {
      // Simple edge with single arrow
      this.drawArrow(ctx, source, target, style.arrow!);
      return;
    }
    
    // Calculate midpoint
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    
    // Edge angle
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    
    // Perpendicular offset for glyph placement
    const offset = 15; // pixels from edge
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    
    // Forward predicate glyph (top/right side)
    const forwardGlyphPos = {
      x: midX + perpX * offset,
      y: midY + perpY * offset
    };
    
    this.renderPredicate Glyph(
      ctx,
      forwardGlyphPos,
      edge.predicate,
      'forward',
      angle,
      style
    );
    
    // Inverse predicate glyph (bottom/left side)
    const inverseGlyphPos = {
      x: midX - perpX * offset,
      y: midY - perpY * offset
    };
    
    this.renderPredicateGlyph(
      ctx,
      inverseGlyphPos,
      edge.inversePredicate,
      'backward',
      angle + Math.PI, // Opposite direction
      style
    );
    
    // Store glyph positions for interaction handling
    this.glyphHitAreas.set(`${edge.id}-forward`, {
      center: forwardGlyphPos,
      radius: style.glyphStyle?.size || 12,
      predicate: edge.predicate,
      direction: 'forward'
    });
    
    this.glyphHitAreas.set(`${edge.id}-inverse`, {
      center: inverseGlyphPos,
      radius: style.glyphStyle?.size || 12,
      predicate: edge.inversePredicate,
      direction: 'backward'
    });
  }
  
  /**
   * Render individual predicate glyph with label
   */
  private renderPredicateGlyph(
    ctx: CanvasRenderingContext2D,
    position: Position,
    label: string,
    direction: 'forward' | 'backward',
    angle: number,
    style: RDFEdgeStyle
  ): void {
    const glyphSize = style.glyphStyle?.size || 12;
    const shape = style.glyphStyle?.shape || 'diamond';
    
    ctx.save();
    ctx.translate(position.x, position.y);
    
    // Draw glyph shape
    ctx.fillStyle = style.glyphStyle?.fill || '#4a90e2';
    ctx.strokeStyle = style.glyphStyle?.stroke || '#2c5aa0';
    ctx.lineWidth = 2;
    
    if (shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(glyphSize, 0);
      ctx.lineTo(0, glyphSize);
      ctx.lineTo(-glyphSize, 0);
      ctx.lineTo(0, -glyphSize);
      ctx.closePath();
    } else if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, glyphSize, 0, Math.PI * 2);
    } else if (shape === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hexAngle = (Math.PI / 3) * i - Math.PI / 2;
        const x = glyphSize * Math.cos(hexAngle);
        const y = glyphSize * Math.sin(hexAngle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
    
    ctx.fill();
    ctx.stroke();
    
    // Draw directional indicator (small arrow inside glyph)
    const arrowSize = glyphSize * 0.4;
    const arrowAngle = direction === 'forward' ? 0 : Math.PI;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-arrowSize, 0);
    ctx.lineTo(arrowSize, 0);
    ctx.moveTo(arrowSize * 0.5, -arrowSize * 0.5);
    ctx.lineTo(arrowSize, 0);
    ctx.lineTo(arrowSize * 0.5, arrowSize * 0.5);
    ctx.stroke();
    
    // Draw label next to glyph
    ctx.restore();
    
    // Position label perpendicular to edge
    const labelOffset = glyphSize + 5;
    const perpAngle = angle + Math.PI / 2;
    const labelX = position.x + Math.cos(perpAngle) * labelOffset;
    const labelY = position.y + Math.sin(perpAngle) * labelOffset;
    
    ctx.font = `${style.glyphStyle?.fontSize || 10}px Arial`;
    ctx.fillStyle = style.glyphStyle?.textColor || '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.formatPredicateLabel(label), labelX, labelY);
  }
  
  /**
   * Format predicate label (abbreviate if needed)
   */
  private formatPredicateLabel(predicate: string): string {
    // Remove namespace prefix if present
    const parts = predicate.split(/[:#]/);
    const label = parts[parts.length - 1];
    
    // CamelCase to space-separated
    return label.replace(/([A-Z])/g, ' $1').trim();
  }
  
  /**
   * Handle clicks on glyphs
   */
  handleGlyphClick(position: Position): void {
    for (const [key, hitArea] of this.glyphHitAreas) {
      const dist = Math.sqrt(
        Math.pow(position.x - hitArea.center.x, 2) +
        Math.pow(position.y - hitArea.center.y, 2)
      );
      
      if (dist <= hitArea.radius) {
        // Glyph clicked
        if (this.style.onGlyphClick) {
          this.style.onGlyphClick(hitArea.predicate, hitArea.direction);
        }
        
        // Show tooltip or modal with predicate details
        this.showPredicateDetails(hitArea.predicate, hitArea.direction);
        break;
      }
    }
  }
}
```

---

## API Examples

### 1. Basic Directed Edge

```typescript
const graph = new EdgeCraft({
  container: '#graph',
  edgeStyle: {
    arrow: {
      position: 'forward',  // Arrow points from source to target
      size: 12,
      shape: 'triangle',
      filled: true
    }
  }
});
```

### 2. Self-Loop

```typescript
graph.addEdge({
  id: 'self-loop-1',
  source: 'node-1',
  target: 'node-1',  // Same as source
  label: 'self-reference'
});

// Style self-loops
graph.setEdgeStyle('self-loop-1', {
  selfLoop: {
    radius: 50,
    angle: 45,  // Position at 45° from node
    clockwise: true
  },
  arrow: {
    position: 'forward'
  }
});
```

### 3. Multiple Edges Between Nodes

```typescript
// Add multiple relationships
graph.addEdge({ id: 'e1', source: 'A', target: 'B', label: 'knows' });
graph.addEdge({ id: 'e2', source: 'A', target: 'B', label: 'worksAt' });
graph.addEdge({ id: 'e3', source: 'A', target: 'B', label: 'manages' });

// Automatically bundles as parallel bezier curves
// Or manually configure:
graph.setEdgeStyle('e1', { parallelOffset: -20 });
graph.setEdgeStyle('e2', { parallelOffset: 0 });
graph.setEdgeStyle('e3', { parallelOffset: 20 });
```

### 4. Bidirectional Edge

```typescript
graph.addEdge({
  id: 'bidirectional-1',
  source: 'A',
  target: 'B',
  label: 'friend'
});

graph.setEdgeStyle('bidirectional-1', {
  arrow: {
    position: 'both',  // Arrows on both ends
    size: 10
  },
  bidirectional: 'single'  // Single edge with two arrows
});
```

### 5. RDF Inverse Relationship (The Showcase Feature)

```typescript
// Create RDF graph with inverse properties
const rdfGraph = new EdgeCraft({
  container: '#rdf-graph',
  edgeStyle: (edge) => {
    if (edge.inversePredicate) {
      return {
        showInverseGlyphs: true,
        glyphStyle: {
          size: 14,
          shape: 'diamond',
          fill: '#667eea',
          stroke: '#5a67d8',
          textColor: '#2d3748',
          fontSize: 11
        },
        onGlyphClick: (predicate, direction) => {
          console.log(`Clicked ${direction} predicate: ${predicate}`);
          // Open SPARQL query editor, show predicate details, etc.
        }
      };
    }
    return { arrow: { position: 'forward' } };
  }
});

// Add inverse relationship
rdfGraph.addEdge({
  id: 'hasPart-rel',
  source: 'Car123',
  target: 'Engine456',
  predicate: 'hasPart',
  inversePredicate: 'partOf',
  inversePropertyURI: 'http://example.org/ontology#partOf'
});

// The edge will render with two interactive glyphs:
// - Top/right: "has Part" pointing forward →
// - Bottom/left: "part Of" pointing backward ←
```

### 6. Complex RDF Pattern: Association Class with Inverse

```typescript
// Model an OWL association class with inverse relationships
rdfGraph.addEdge({
  id: 'employment-rel',
  source: 'Person:Alice',
  target: 'Company:Acme',
  predicate: 'employedBy',
  inversePredicate: 'employs',
  associationClass: {
    id: 'Employment:123',
    properties: {
      startDate: '2023-01-15',
      position: 'Senior Engineer',
      salary: 120000
    }
  }
});

// Renders as:
// [Person:Alice] ←employs— [Employment:123] —employedBy→ [Company:Acme]
// With interactive glyphs on each segment
```

---

## Competitive Advantage

### vs. Cytoscape.js

| Feature | Cytoscape.js | EdgeCraft |
|---------|--------------|-----------|
| Basic arrows | ✅ | ✅ |
| Self-loops | ✅ | ✅ |
| Multi-edges | ⚠️ (manual offset) | ✅ (automatic bundling) |
| Bidirectional | ⚠️ (two edges) | ✅ (single edge with dual arrows) |
| RDF inverse glyphs | ❌ | ✅ **Unique feature** |
| Interactive predicates | ❌ | ✅ **Unique feature** |

### vs. Keylines

| Feature | Keylines | EdgeCraft |
|---------|----------|-----------|
| Basic arrows | ✅ | ✅ |
| Self-loops | ✅ | ✅ |
| Multi-edges | ✅ | ✅ |
| Bidirectional | ✅ | ✅ |
| RDF inverse glyphs | ❌ | ✅ **Unique feature** |
| Open source | ❌ (£5k+/year) | ✅ Free |

---

## Implementation Roadmap

### Phase 1: Basic Directional Features (Week 1-2)
- [x] Arrow rendering in Canvas renderer
- [ ] Arrow rendering in WebGL renderer
- [ ] Self-loop geometry calculations
- [ ] Self-loop rendering
- [ ] Basic arrow configuration API

### Phase 2: Multi-Edge Support (Week 3)
- [ ] Edge bundler service
- [ ] Parallel edge offset calculation
- [ ] Automatic multi-edge detection
- [ ] Bezier curve rendering for offset edges

### Phase 3: Bidirectional Support (Week 4)
- [ ] Bidirectional edge detection
- [ ] Dual-arrow rendering
- [ ] Parallel bidirectional edges
- [ ] API for bidirectional configuration

### Phase 4: RDF Inverse Glyphs (Week 5-6)
- [ ] Glyph rendering system
- [ ] Interactive glyph hit detection
- [ ] Predicate label formatting
- [ ] RDF edge data model
- [ ] Inverse property normalization
- [ ] Glyph click/hover handlers
- [ ] Tooltip system for predicates

### Phase 5: Advanced RDF Features (Week 7-8)
- [ ] Association class visualization
- [ ] OWL property chains
- [ ] Subsetting/redefining relationships
- [ ] Facet/facet-of patterns
- [ ] SPARQL query integration

---

## Testing Strategy

### Unit Tests
```typescript
describe('Arrow Rendering', () => {
  it('should render forward arrow', () => {
    const edge = { source: 'A', target: 'B' };
    const style = { arrow: { position: 'forward' } };
    const result = renderEdge(edge, style);
    expect(result.hasArrow).toBe(true);
    expect(result.arrowDirection).toBe('forward');
  });
});

describe('Self-Loop Geometry', () => {
  it('should calculate self-loop bezier path', () => {
    const path = calculateSelfLoopPath({ x: 100, y: 100 }, 30, {});
    expect(path.type).toBe('cubic-bezier');
    expect(path.start).not.toEqual(path.end);
  });
});

describe('RDF Inverse Glyphs', () => {
  it('should render glyphs for inverse predicates', () => {
    const edge = {
      source: 'A',
      target: 'B',
      predicate: 'hasPart',
      inversePredicate: 'partOf'
    };
    const glyphs = renderRDFGlyphs(edge);
    expect(glyphs).toHaveLength(2);
    expect(glyphs[0].direction).toBe('forward');
    expect(glyphs[1].direction).toBe('backward');
  });
});
```

### Visual Regression Tests
- Arrow shapes at various angles
- Self-loop curves at different positions
- Multi-edge bundling patterns
- RDF glyph rendering
- Interactive glyph hover states

### Performance Tests
- 10,000 edges with arrows (target: 60fps)
- 1,000 self-loops
- 500 multi-edge bundles

---

## Documentation Updates Needed

1. **Edge Styling Guide**
   - Arrow configuration examples
   - Self-loop patterns
   - Multi-edge handling

2. **RDF Visualization Guide** (New!)
   - Inverse property modeling
   - Association classes
   - OWL patterns
   - SPARQL integration

3. **API Reference**
   - `ArrowConfig` interface
   - `SelfLoopConfig` interface
   - `EdgeGlyphConfig` interface
   - `RDFEdgeStyle` interface

4. **Interactive Examples**
   - Directed graph demo
   - Self-referential graph
   - Multi-relationship visualization
   - **RDF ontology explorer** (showcase)

---

## Conclusion

These advanced edge rendering features position EdgeCraft as the premier choice for:

1. **Knowledge graph visualization** - RDF inverse glyphs are game-changing
2. **Ontology exploration** - OWL patterns made visual
3. **Complex network analysis** - Multi-edges, self-loops handled elegantly
4. **Semantic web applications** - First-class RDF support

The **RDF inverse relationship glyphs** are EdgeCraft's killer feature - no other open-source (or even commercial) library provides this level of sophistication for RDF visualization. This alone will attract the semantic web community and position EdgeCraft as the standard tool for ontology visualization.

**Estimated impact on competitive position:**
- Current: 6.5/10
- After implementation: **8.5/10** (leap-frog competitors in RDF/ontology space)
- Market differentiation: **High** (unique features, open source advantage)
