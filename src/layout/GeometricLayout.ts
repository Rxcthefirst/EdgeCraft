import { Graph } from '../core/Graph';
import { GraphNode } from '../types';

/**
 * Configuration for geometric layouts
 */
export interface GeometricLayoutConfig {
  /**
   * Type of geometric layout
   * @default 'grid'
   */
  type?: 'grid' | 'brick' | 'hexagonal' | 'concentric';

  /**
   * Number of columns (for grid and brick)
   * Auto-calculated if not specified
   * @default undefined
   */
  columns?: number;

  /**
   * Number of rows (for grid)
   * Auto-calculated if not specified
   * @default undefined
   */
  rows?: number;

  /**
   * Horizontal spacing between nodes
   * @default 100
   */
  spacingX?: number;

  /**
   * Vertical spacing between nodes
   * @default 100
   */
  spacingY?: number;

  /**
   * Center X coordinate
   * @default 0
   */
  centerX?: number;

  /**
   * Center Y coordinate
   * @default 0
   */
  centerY?: number;

  /**
   * Alignment within cells
   * @default 'center'
   */
  alignment?: 'start' | 'center' | 'end';

  /**
   * For brick: offset ratio for alternating rows
   * @default 0.5
   */
  brickOffset?: number;

  /**
   * For hexagonal: orientation of hexagons
   * @default 'pointy'
   */
  hexOrientation?: 'pointy' | 'flat';

  /**
   * For concentric: number of concentric rings
   * Auto-calculated if not specified
   * @default undefined
   */
  rings?: number;

  /**
   * For concentric: radius of innermost ring
   * @default 100
   */
  innerRadius?: number;

  /**
   * For concentric: spacing between rings
   * @default 100
   */
  ringSpacing?: number;

  /**
   * Sort nodes before positioning
   * @default 'none'
   */
  sortBy?: 'none' | 'id' | 'degree' | 'label';

  /**
   * Aspect ratio (width/height) for auto-calculation
   * @default 1.5
   */
  aspectRatio?: number;
}

/**
 * Geometric Layout Algorithm
 * 
 * Arranges nodes in regular geometric patterns for clarity and organization.
 * Supports four layout types:
 * 
 * 1. **Grid Layout**: Nodes in rows and columns, like a spreadsheet
 * 2. **Brick Layout**: Offset rows like brickwork for better space utilization
 * 3. **Hexagonal Layout**: Honeycomb pattern for efficient packing
 * 4. **Concentric Layout**: Nodes arranged in concentric rings
 * 
 * Features:
 * - Automatic dimension calculation
 * - Configurable spacing and alignment
 * - Multiple sorting options
 * - Aspect ratio control
 * - Centered positioning
 * 
 * Use Cases:
 * - Matrix visualizations
 * - Aligned network topologies
 * - Periodic table-style displays
 * - Organized comparison views
 * 
 * Time Complexity: O(n) for positioning
 * Space Complexity: O(1) auxiliary space
 * 
 * @example
 * ```typescript
 * // Grid layout
 * const layout = new GeometricLayout({
 *   type: 'grid',
 *   columns: 5,
 *   spacingX: 120,
 *   spacingY: 80
 * });
 * await layout.execute(graph);
 * 
 * // Hexagonal layout
 * const hexLayout = new GeometricLayout({
 *   type: 'hexagonal',
 *   spacingX: 100,
 *   hexOrientation: 'pointy'
 * });
 * await hexLayout.execute(graph);
 * ```
 */
export class GeometricLayout {
  public name = 'geometric';
  private config: Required<GeometricLayoutConfig>;

  constructor(config: GeometricLayoutConfig = {}) {
    this.config = {
      type: config.type ?? 'grid',
      columns: config.columns ?? 0,
      rows: config.rows ?? 0,
      spacingX: config.spacingX ?? 100,
      spacingY: config.spacingY ?? 100,
      centerX: config.centerX ?? 0,
      centerY: config.centerY ?? 0,
      alignment: config.alignment ?? 'center',
      brickOffset: config.brickOffset ?? 0.5,
      hexOrientation: config.hexOrientation ?? 'pointy',
      rings: config.rings ?? 0,
      innerRadius: config.innerRadius ?? 100,
      ringSpacing: config.ringSpacing ?? 100,
      sortBy: config.sortBy ?? 'none',
      aspectRatio: config.aspectRatio ?? 1.5,
    };
  }

  /**
   * Execute the geometric layout algorithm
   */
  public async execute(graph: Graph): Promise<void> {
    const positions = this.compute(graph);
    
    // Apply positions to graph
    for (const [nodeId, position] of positions.entries()) {
      graph.updateNode(nodeId, position as any);
    }
  }

  /**
   * Compute node positions without modifying the graph
   */
  public compute(graph: Graph): Map<string | number, { x: number; y: number }> {
    const positions = new Map<string | number, { x: number; y: number }>();
    const nodes = graph.getAllNodes();
    
    if (nodes.length === 0) {
      return positions;
    }

    // Sort nodes if requested
    const sortedNodes = this.sortNodes(nodes);

    // Choose layout type
    switch (this.config.type) {
      case 'grid':
        this.computeGridLayout(sortedNodes, positions);
        break;
      case 'brick':
        this.computeBrickLayout(sortedNodes, positions);
        break;
      case 'hexagonal':
        this.computeHexagonalLayout(sortedNodes, positions);
        break;
      case 'concentric':
        this.computeConcentricLayout(sortedNodes, positions);
        break;
    }

    return positions;
  }

  /**
   * Grid layout - regular rows and columns
   */
  private computeGridLayout(
    nodes: GraphNode[],
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    const n = nodes.length;
    
    // Calculate dimensions if not specified
    let cols = this.config.columns;
    let rows = this.config.rows;
    
    if (cols === 0 && rows === 0) {
      // Auto-calculate based on aspect ratio
      cols = Math.ceil(Math.sqrt(n * this.config.aspectRatio));
      rows = Math.ceil(n / cols);
    } else if (cols === 0) {
      cols = Math.ceil(n / rows);
    } else if (rows === 0) {
      rows = Math.ceil(n / cols);
    }

    // Calculate total dimensions
    const totalWidth = (cols - 1) * this.config.spacingX;
    const totalHeight = (rows - 1) * this.config.spacingY;

    // Starting position (top-left)
    const startX = this.config.centerX - totalWidth / 2;
    const startY = this.config.centerY - totalHeight / 2;

    // Position each node
    for (let i = 0; i < nodes.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = startX + col * this.config.spacingX;
      const y = startY + row * this.config.spacingY;

      positions.set(nodes[i].id, { x, y });
    }
  }

  /**
   * Brick layout - offset alternating rows
   */
  private computeBrickLayout(
    nodes: GraphNode[],
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    const n = nodes.length;
    
    // Calculate dimensions if not specified
    let cols = this.config.columns;
    
    if (cols === 0) {
      // Auto-calculate based on aspect ratio
      cols = Math.ceil(Math.sqrt(n * this.config.aspectRatio));
    }
    
    const rows = Math.ceil(n / cols);

    // Calculate total dimensions (accounting for offset)
    const offsetX = this.config.spacingX * this.config.brickOffset;
    const totalWidth = (cols - 1) * this.config.spacingX + offsetX;
    const totalHeight = (rows - 1) * this.config.spacingY;

    // Starting position
    const startX = this.config.centerX - totalWidth / 2;
    const startY = this.config.centerY - totalHeight / 2;

    // Position each node
    for (let i = 0; i < nodes.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // Offset every other row
      const rowOffset = (row % 2) * offsetX;

      const x = startX + col * this.config.spacingX + rowOffset;
      const y = startY + row * this.config.spacingY;

      positions.set(nodes[i].id, { x, y });
    }
  }

  /**
   * Hexagonal layout - honeycomb pattern
   */
  private computeHexagonalLayout(
    nodes: GraphNode[],
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    const n = nodes.length;
    
    // Calculate dimensions
    let cols = this.config.columns;
    if (cols === 0) {
      cols = Math.ceil(Math.sqrt(n * this.config.aspectRatio));
    }
    const rows = Math.ceil(n / cols);

    // Hexagon geometry
    const isPointy = this.config.hexOrientation === 'pointy';
    
    let dx: number, dy: number, rowOffset: number;
    
    if (isPointy) {
      // Pointy top hexagons
      dx = this.config.spacingX;
      dy = this.config.spacingY * Math.sqrt(3) / 2;
      rowOffset = this.config.spacingX / 2;
    } else {
      // Flat top hexagons
      dx = this.config.spacingX * Math.sqrt(3) / 2;
      dy = this.config.spacingY;
      rowOffset = this.config.spacingY / 2;
    }

    // Calculate total dimensions
    const totalWidth = (cols - 1) * dx + (isPointy ? rowOffset : 0);
    const totalHeight = (rows - 1) * dy + (isPointy ? 0 : rowOffset);

    // Starting position
    const startX = this.config.centerX - totalWidth / 2;
    const startY = this.config.centerY - totalHeight / 2;

    // Position each node
    for (let i = 0; i < nodes.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      let x: number, y: number;

      if (isPointy) {
        // Pointy top: offset every other row horizontally
        const offset = (row % 2) * rowOffset;
        x = startX + col * dx + offset;
        y = startY + row * dy;
      } else {
        // Flat top: offset every other column vertically
        const offset = (col % 2) * rowOffset;
        x = startX + col * dx;
        y = startY + row * dy + offset;
      }

      positions.set(nodes[i].id, { x, y });
    }
  }

  /**
   * Concentric layout - nodes in concentric rings
   */
  private computeConcentricLayout(
    nodes: GraphNode[],
    positions: Map<string | number, { x: number; y: number }>
  ): void {
    const n = nodes.length;
    
    // Calculate number of rings if not specified
    let rings = this.config.rings;
    if (rings === 0) {
      // Estimate rings needed
      rings = Math.ceil(Math.sqrt(n / Math.PI));
    }

    // Distribute nodes across rings
    const nodesPerRing: number[] = [];
    let remainingNodes = n;
    
    for (let ring = 0; ring < rings; ring++) {
      if (ring === rings - 1) {
        // Last ring gets all remaining nodes
        nodesPerRing.push(remainingNodes);
      } else {
        // Distribute proportionally to circumference
        const radius = this.config.innerRadius + ring * this.config.ringSpacing;
        const circumference = 2 * Math.PI * radius;
        const capacity = Math.max(1, Math.floor(circumference / this.config.spacingX));
        const allocation = Math.min(capacity, Math.ceil(remainingNodes / (rings - ring)));
        
        nodesPerRing.push(allocation);
        remainingNodes -= allocation;
      }
    }

    // Position nodes
    let nodeIndex = 0;
    
    for (let ring = 0; ring < rings; ring++) {
      const count = nodesPerRing[ring];
      const radius = this.config.innerRadius + ring * this.config.ringSpacing;
      
      // Special case: single node in center
      if (ring === 0 && count === 1) {
        positions.set(nodes[nodeIndex].id, {
          x: this.config.centerX,
          y: this.config.centerY,
        });
        nodeIndex++;
        continue;
      }

      // Distribute nodes evenly around ring
      const angleStep = (2 * Math.PI) / count;
      const startAngle = 0; // Start at right (0 radians)

      for (let i = 0; i < count && nodeIndex < n; i++) {
        const angle = startAngle + i * angleStep;
        const x = this.config.centerX + radius * Math.cos(angle);
        const y = this.config.centerY + radius * Math.sin(angle);

        positions.set(nodes[nodeIndex].id, { x, y });
        nodeIndex++;
      }
    }
  }

  /**
   * Sort nodes according to configuration
   */
  private sortNodes(nodes: GraphNode[]): GraphNode[] {
    if (this.config.sortBy === 'none') {
      return [...nodes];
    }
    
    const sorted = [...nodes];
    
    switch (this.config.sortBy) {
      case 'id':
        sorted.sort((a, b) => {
          if (typeof a.id === 'string' && typeof b.id === 'string') {
            return a.id.localeCompare(b.id);
          }
          return Number(a.id) - Number(b.id);
        });
        break;
      
      case 'degree':
        // Would need graph structure to calculate degree
        // For now, keep original order
        break;
      
      case 'label':
        sorted.sort((a, b) => {
          const aLabel = this.getNodeLabel(a);
          const bLabel = this.getNodeLabel(b);
          return aLabel.localeCompare(bLabel);
        });
        break;
    }
    
    return sorted;
  }

  /**
   * Get a node's label (handle both LPG and RDF)
   */
  private getNodeLabel(node: GraphNode): string {
    const nodeAny = node as any;
    
    // LPG: check properties.name or properties.label
    if (nodeAny.properties) {
      return nodeAny.properties.name || nodeAny.properties.label || String(node.id);
    }
    
    // RDF: use URI
    if (nodeAny.uri) {
      return nodeAny.uri;
    }
    
    return String(node.id);
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<GeometricLayoutConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<GeometricLayoutConfig> {
    return { ...this.config };
  }

  /**
   * Calculate optimal grid dimensions for a given number of nodes
   */
  public static calculateGridDimensions(
    nodeCount: number,
    aspectRatio: number = 1.5
  ): { columns: number; rows: number } {
    const columns = Math.ceil(Math.sqrt(nodeCount * aspectRatio));
    const rows = Math.ceil(nodeCount / columns);
    return { columns, rows };
  }

  /**
   * Calculate required rings for concentric layout
   */
  public static calculateRings(
    nodeCount: number,
    innerRadius: number = 100,
    ringSpacing: number = 100,
    nodeSpacing: number = 100
  ): number {
    let rings = 0;
    let totalCapacity = 0;
    
    while (totalCapacity < nodeCount) {
      const radius = innerRadius + rings * ringSpacing;
      const circumference = 2 * Math.PI * radius;
      const capacity = Math.max(1, Math.floor(circumference / nodeSpacing));
      totalCapacity += capacity;
      rings++;
      
      // Safety limit
      if (rings > 100) break;
    }
    
    return rings;
  }
}
