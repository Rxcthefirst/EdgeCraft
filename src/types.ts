/**
 * Core type definitions for EdgeCraft
 */

// ============================================================================
// Common Types
// ============================================================================

export type NodeId = string | number;
export type EdgeId = string | number;

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// ============================================================================
// LPG (Labeled Property Graph) Types
// ============================================================================

export interface LPGNode {
  id: NodeId;
  labels: string[];
  properties: Record<string, any>;
  position?: Position;
}

export interface LPGEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  label: string;
  properties: Record<string, any>;
  directed?: boolean;
}

// ============================================================================
// RDF (Resource Description Framework) Types
// ============================================================================

export type RDFNodeType = 'uri' | 'literal' | 'blank';

export interface RDFNode {
  id: NodeId;
  type: RDFNodeType;
  value: string;
  datatype?: string;
  language?: string;
  position?: Position;
}

export interface RDFTriple {
  id: EdgeId;
  subject: NodeId;
  predicate: string;
  object: NodeId;
}

// ============================================================================
// Association Class Pattern (N-ary relationships)
// ============================================================================

export interface AssociationClass {
  id: NodeId;
  name: string;
  sourceEdges: EdgeId[];
  properties: Record<string, any>;
  position?: Position;
}

// ============================================================================
// Unified Graph Model
// ============================================================================

export type GraphNode = LPGNode | RDFNode;
export type GraphEdge = LPGEdge | RDFTriple;

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  associationClasses?: AssociationClass[];
}

// ============================================================================
// Visual Styling
// ============================================================================

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  shape?: 'circle' | 'rectangle' | 'diamond' | 'hexagon' | 'window';
  icon?: string; // Emoji or text to render inside the shape
  displayMode?: 'simple' | 'detailed'; // Simple: just icon, Detailed: full window
  window?: {
    width?: number;
    height?: number;
    borderRadius?: number;
    padding?: number;
    headerHeight?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    lines?: string[]; // Additional text lines to display in window
  };
  label?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
}

// ============================================================================
// Edge Arrow Configuration
// ============================================================================

export interface ArrowConfig {
  position: 'none' | 'forward' | 'backward' | 'both';
  size?: number;
  shape?: 'triangle' | 'chevron' | 'diamond' | 'circle';
  filled?: boolean;
  offset?: number; // Distance from node edge
}

export interface SelfLoopConfig {
  radius?: number;
  angle?: number; // 0-360 degrees
  clockwise?: boolean;
}

export interface EdgeGlyphConfig {
  position: number; // 0.0 to 1.0 along edge
  text?: string;
  icon?: string;
  shape?: 'circle' | 'square' | 'diamond';
  size?: number;
  fill?: string;
  stroke?: string;
  interactive?: boolean;
  tooltip?: string;
  direction?: 'forward' | 'backward';
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  
  // Enhanced arrow configuration
  arrow?: ArrowConfig | 'none' | 'forward' | 'backward' | 'both';
  
  // Self-loop configuration
  selfLoop?: SelfLoopConfig;
  
  // Multi-edge support
  curvature?: number;         // Curvature amount (0 = straight, 0.2 = default curve)
  parallelOffset?: number;    // Perpendicular offset for multi-edges
  
  // Edge glyphs (for RDF inverse relationships, etc.)
  glyphs?: EdgeGlyphConfig[];
  
  // Inverse relationship predicates (RDF)
  forwardPredicate?: string;   // Predicate from source perspective
  inversePredicate?: string;   // Predicate from target perspective
  
  // Relationship mode
  relationshipMode?: 'symmetric' | 'inverse' | 'asymmetric';
  // symmetric: same predicate both ways (friend/friend) - arrows both, no glyphs
  // inverse: different predicates (employs/employedBy) - glyphs at ends
  // asymmetric: single direction only - arrow forward, no glyphs
  
  // Bidirectional mode
  bidirectional?: 'single' | 'parallel';
  
  label?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    rotateWithEdge?: boolean; // Rotate label to align with edge direction
  };
}

// RDF-specific edge extension
export interface RDFInverseEdge extends RDFTriple {
  inversePredicate?: string;
  inversePropertyURI?: string;
}

export type StyleFunction<T> = (element: T) => Partial<NodeStyle> | Partial<EdgeStyle>;

// ============================================================================
// Layout Configuration
// ============================================================================

export interface LayoutConfig {
  type: 'force' | 'hierarchical' | 'circular' | 'grid' | 'manual';
  iterations?: number;
  spacing?: number;
  nodeSpacing?: number;
  levelSpacing?: number;
  animate?: boolean;
}

// ============================================================================
// Interaction Configuration
// ============================================================================

export interface InteractionConfig {
  draggable?: boolean;
  zoomable?: boolean;
  selectable?: boolean;
  hoverable?: boolean;
  multiSelect?: boolean;
  showHitboxes?: boolean;  // Show visual hitboxes when clicking/hovering
}

// ============================================================================
// Event Types
// ============================================================================

export interface GraphEvent {
  type: string;
  target: GraphNode | GraphEdge | null;
  position: Position;
  originalEvent: Event;
  data?: any; // Optional data payload for custom events
}

export type EventCallback = (event: GraphEvent) => void;

// ============================================================================
// Main Configuration
// ============================================================================

export interface RendererConfig {
  type?: 'svg' | 'canvas' | 'webgl' | 'auto';
  pixelRatio?: number;
  enableCache?: boolean;
  enableDirtyRegions?: boolean;
}

export interface EdgeCraftConfig {
  container: HTMLElement | string;
  data?: GraphData;
  layout?: LayoutConfig;
  interaction?: InteractionConfig;
  nodeStyle?: NodeStyle | StyleFunction<GraphNode>;
  edgeStyle?: EdgeStyle | StyleFunction<GraphEdge>;
  renderer?: RendererConfig;
  width?: number;
  height?: number;
  backgroundColor?: string;
  minZoom?: number;
  maxZoom?: number;
}
