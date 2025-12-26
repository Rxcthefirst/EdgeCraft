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
  shape?: 'circle' | 'rectangle' | 'diamond' | 'hexagon';
  label?: {
    text?: string;
    fontSize?: number;
    color?: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  arrow?: 'none' | 'forward' | 'backward' | 'both';
  label?: {
    text?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
  };
  curvature?: number;
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
}

// ============================================================================
// Event Types
// ============================================================================

export interface GraphEvent {
  type: string;
  target: GraphNode | GraphEdge | null;
  position: Position;
  originalEvent: Event;
}

export type EventCallback = (event: GraphEvent) => void;

// ============================================================================
// Main Configuration
// ============================================================================

export interface EdgeCraftConfig {
  container: HTMLElement | string;
  data?: GraphData;
  layout?: LayoutConfig;
  interaction?: InteractionConfig;
  nodeStyle?: NodeStyle | StyleFunction<GraphNode>;
  edgeStyle?: EdgeStyle | StyleFunction<GraphEdge>;
  width?: number;
  height?: number;
  backgroundColor?: string;
  minZoom?: number;
  maxZoom?: number;
}
