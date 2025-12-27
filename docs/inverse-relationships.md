# Inverse Relationship System

EdgeCraft now supports **RDF-style inverse relationships** with interactive glyphs, enabling sophisticated knowledge graph visualization similar to Protégé and TopBraid Composer.

## Three Relationship Modes

### 1. Symmetric Relationships
**Example**: `friend ↔ friend`

- **Visual**: Bidirectional arrows, label at midpoint
- **Use case**: Mutual relationships where both directions use same predicate
- **Configuration**:
```javascript
{
  arrow: 'both',
  relationshipMode: 'symmetric',
  label: { text: 'friend' }
}
```

### 2. Inverse Relationships ⭐
**Example**: `employs ↔ employedBy`

- **Visual**: Interactive glyphs at each end showing predicates
- **Use case**: True OWL inverse properties with different predicates
- **Configuration**:
```javascript
{
  arrow: 'none',
  relationshipMode: 'inverse',
  forwardPredicate: 'employs',
  inversePredicate: 'employedBy'
}
```

**Glyph Positioning**:
- Forward glyph: 15% from source node
- Inverse glyph: 85% from target node (15% from end)

**Auto-generation**: If `forwardPredicate` and `inversePredicate` are provided, glyphs are automatically created and rendered.

### 3. Asymmetric Relationships
**Example**: `reportsTo →`

- **Visual**: Single directional arrow, no glyphs
- **Use case**: Single-direction relationships where inverse hasn't been learned yet
- **Configuration**:
```javascript
{
  arrow: 'forward',
  relationshipMode: 'asymmetric'
}
```

## Interactive Glyphs

### Visual Design
- **Shape**: Square badge with rounded corners
- **Size**: 16×16px (configurable via `EdgeGlyphConfig.size`)
- **Content**: Truncated predicate text (first 3 characters)
- **Colors**: Inherits edge stroke color with white stroke border
- **Rotation**: Aligns with edge tangent, stays upright

### Hit Detection
Glyphs are **independently selectable** from the edge body:

- **Glyph click**: Shows predicate-specific details
  - Direction (forward/backward)
  - Predicate name
  - Position along edge
  
- **Edge body click**: Shows full relationship details
  - Both forward and inverse predicates
  - Source and target nodes
  - All edge properties

### Event Metadata
When a glyph is clicked, the edge object includes:
```javascript
edge.__glyphHit = {
  direction: 'forward' | 'backward',
  predicate: 'employs',
  position: 0.15
}
```

## Implementation Details

### Type Extensions

**EdgeStyle**:
```typescript
interface EdgeStyle {
  relationshipMode?: 'symmetric' | 'inverse' | 'asymmetric';
  forwardPredicate?: string;
  inversePredicate?: string;
  glyphs?: EdgeGlyphConfig[];
}
```

**EdgeGlyphConfig**:
```typescript
interface EdgeGlyphConfig {
  position: number;        // 0.0 to 1.0 along edge
  text?: string;           // Display text
  icon?: string;           // Alternative to text
  shape?: 'circle' | 'square' | 'diamond';
  size?: number;
  fill?: string;
  stroke?: string;
  interactive?: boolean;   // Enable hit detection
  tooltip?: string;
  direction?: 'forward' | 'backward';
}
```

### Rendering Pipeline

1. **CanvasRenderer.renderEdge()**:
   - Draws edge path (straight/curved)
   - Renders arrows based on `relationshipMode`
   - Auto-generates glyphs for `inverse` mode
   - Calls `renderGlyph()` for each glyph

2. **CanvasRenderer.renderGlyph()**:
   - Calculates position on bezier/line using `t` parameter
   - Computes tangent angle for rotation
   - Draws shape with fill/stroke
   - Renders truncated text inside

3. **InteractionManager.getGlyphAtPosition()**:
   - Checks all edges with glyphs
   - Calculates glyph world positions
   - Performs distance check (12px threshold)
   - Returns glyph metadata if hit

4. **InteractionManager.getEdgeAtPosition()**:
   - **First** checks for glyph hits
   - If glyph hit, attaches `__glyphHit` metadata
   - Otherwise performs edge body hit detection

## Demo Usage

### Data Structure
```javascript
const edge = {
  id: 'emp1',
  subject: 'john',
  predicate: 'employs',
  object: 'ralph',
  forwardPredicate: 'employs',
  inversePredicate: 'employedBy'
};
```

### Styling Function
```javascript
edgeStyle: (edge) => {
  if (edge.forwardPredicate && edge.inversePredicate) {
    if (edge.forwardPredicate === edge.inversePredicate) {
      // Symmetric
      return {
        arrow: 'both',
        relationshipMode: 'symmetric',
        label: { text: edge.predicate }
      };
    } else {
      // Inverse
      return {
        arrow: 'none',
        relationshipMode: 'inverse',
        forwardPredicate: edge.forwardPredicate,
        inversePredicate: edge.inversePredicate
      };
    }
  }
  
  // Asymmetric (default)
  return {
    arrow: 'forward',
    relationshipMode: 'asymmetric'
  };
}
```

### Event Handling
```javascript
graph.on('edge-click', (event) => {
  const glyphHit = event.target.__glyphHit;
  
  if (glyphHit) {
    console.log('Clicked glyph:', glyphHit.predicate);
    console.log('Direction:', glyphHit.direction);
    // Show predicate-specific details
  } else {
    console.log('Clicked edge body');
    // Show full relationship details
  }
});
```

## Use Cases

### Knowledge Graphs
- **Employment**: `employs ↔ employedBy`
- **Supervision**: `supervises ↔ supervisedBy`
- **Mentorship**: `mentors ↔ mentoredBy`
- **Ownership**: `owns ↔ ownedBy`

### Semantic Web (OWL)
- **Part-Whole**: `hasPart ↔ partOf`
- **Parent-Child**: `hasChild ↔ childOf`
- **Container-Contents**: `contains ↔ containedIn`

### Progressive Learning
1. **Initial State**: Only forward relation known → `asymmetric` mode
2. **After Traversal**: Inverse discovered → upgrade to `inverse` mode
3. **Normalization**: Both directions stored on single edge

## Architecture Benefits

✅ **Visual Clarity**: Single edge = single relationship instance  
✅ **Semantic Precision**: Each direction explicitly labeled  
✅ **UML Alignment**: Matches association end labels  
✅ **RDF/OWL Compatible**: Natural fit for `owl:inverseOf`  
✅ **Interactive**: Glyphs are independently selectable  
✅ **Scalable**: LOD can hide glyphs, show count badges  
✅ **Association Class Ready**: Midpoint available for hexagon attachment  

## Future Enhancements

### Level of Detail (LOD)
- Hide glyph text at low zoom, show only colored squares
- Replace text with icons (→ ←) at medium zoom
- Full predicate names at high zoom

### SPARQL Integration
- Glyph click opens context menu
- Quick SPARQL query builders:
  - "Find all X that employ Y"
  - "Find all Y employed by X"

### Association Classes
- Attach hexagon nodes to edge midpoint
- Represent reified relationships (Employment, Ownership)
- Support n-ary relationships with multiple predicates

### Bundling with Inverses
- If `employs` and `supervises` both exist between John→Ralph
- Render as 2 parallel curved edges
- Each with its own forward/inverse glyphs
- Bundle curvature handled by MultiEdgeBundler

## Testing

Run the **Inverse Relations 🔄** demo to see:
- John employs Ralph (inverse glyphs)
- Mike supervises Lisa (inverse glyphs)
- Ralph friends Sarah (symmetric, both arrows)
- Lisa reportsTo Mike (asymmetric, single arrow)

Click on glyphs vs edge body to see different selection behaviors.

---

**Status**: ✅ Fully Implemented (Canvas Renderer)  
**Next**: WebGL renderer support, SPARQL integration, association class attachment
