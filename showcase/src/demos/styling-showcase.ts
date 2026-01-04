/**
 * Styling Showcase Demo
 * Demonstrates various node styling capabilities including shapes, colors, borders, icons, and complex nodes
 */
import { EdgeCraft } from 'edgecraft';

export default async function() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Sample data showcasing different node types
  const graphData = {
    nodes: [
      // Basic shapes
      { id: 'circle', label: 'Circle', properties: { category: 'shape', shape: 'circle' } },
      { id: 'square', label: 'Square', properties: { category: 'shape', shape: 'square' } },
      { id: 'triangle', label: 'Triangle', properties: { category: 'shape', shape: 'triangle' } },
      { id: 'diamond', label: 'Diamond', properties: { category: 'shape', shape: 'diamond' } },
      { id: 'hexagon', label: 'Hexagon', properties: { category: 'shape', shape: 'hexagon' } },
      { id: 'star', label: 'Star', properties: { category: 'shape', shape: 'star' } },
      
      // Colored nodes
      { id: 'red', label: 'Red Node', properties: { category: 'color', color: '#ef4444' } },
      { id: 'green', label: 'Green Node', properties: { category: 'color', color: '#10b981' } },
      { id: 'blue', label: 'Blue Node', properties: { category: 'color', color: '#3b82f6' } },
      { id: 'purple', label: 'Purple Node', properties: { category: 'color', color: '#a855f7' } },
      
      // Border styles
      { id: 'thick-border', label: 'Thick Border', properties: { category: 'border', borderWidth: 6 } },
      { id: 'dashed-border', label: 'Dashed', properties: { category: 'border', borderStyle: 'dashed' } },
      { id: 'colored-border', label: 'Colored Border', properties: { category: 'border', borderColor: '#dc2626' } },
      
      // Icon nodes
      { id: 'icon-user', label: '👤\nUser', properties: { category: 'icon', icon: '👤' } },
      { id: 'icon-folder', label: '📁\nFolder', properties: { category: 'icon', icon: '📁' } },
      { id: 'icon-document', label: '📄\nDoc', properties: { category: 'icon', icon: '📄' } },
      { id: 'icon-settings', label: '⚙️\nSettings', properties: { category: 'icon', icon: '⚙️' } },
      
      // Complex nodes with multi-line labels
      { id: 'complex-1', label: 'Complex Node\nLine 2\nLine 3', properties: { category: 'complex', lines: 3 } },
      { id: 'complex-2', label: 'Multi-line\nWith Details', properties: { category: 'complex', lines: 2 } },
      
      // Window node
      { id: 'window-1', label: 'Window Node', properties: { category: 'window', shape: 'window' } },
      { id: 'window-2', label: 'Application\nWindow', properties: { category: 'window', shape: 'window' } },
    ],
    edges: [
      // Connect shape nodes in a row
      { id: 'e1', source: 'circle', target: 'square', label: 'to' },
      { id: 'e2', source: 'square', target: 'triangle', label: 'to' },
      { id: 'e3', source: 'triangle', target: 'diamond', label: 'to' },
      { id: 'e4', source: 'diamond', target: 'hexagon', label: 'to' },
      { id: 'e5', source: 'hexagon', target: 'star', label: 'to' },
      
      // Connect color nodes
      { id: 'e6', source: 'red', target: 'green', label: 'mix' },
      { id: 'e7', source: 'green', target: 'blue', label: 'mix' },
      { id: 'e8', source: 'blue', target: 'purple', label: 'mix' },
      
      // Connect border nodes
      { id: 'e9', source: 'thick-border', target: 'dashed-border', label: 'style' },
      { id: 'e10', source: 'dashed-border', target: 'colored-border', label: 'style' },
      
      // Connect icon nodes
      { id: 'e11', source: 'icon-user', target: 'icon-folder', label: 'has' },
      { id: 'e12', source: 'icon-folder', target: 'icon-document', label: 'contains' },
      { id: 'e13', source: 'icon-document', target: 'icon-settings', label: 'config' },
      
      // Connect complex nodes
      { id: 'e14', source: 'complex-1', target: 'complex-2', label: 'relates' },
      
      // Connect window nodes
      { id: 'e15', source: 'window-1', target: 'window-2', label: 'opens' },
      
      // Cross-category connections
      { id: 'e16', source: 'circle', target: 'red', label: 'example' },
      { id: 'e17', source: 'green', target: 'thick-border', label: 'example' },
      { id: 'e18', source: 'dashed-border', target: 'icon-user', label: 'example' },
      { id: 'e19', source: 'icon-settings', target: 'complex-1', label: 'example' },
      { id: 'e20', source: 'complex-2', target: 'window-1', label: 'example' },
    ],
  };

  // Initialize EdgeCraft with Canvas renderer
  const graph = new EdgeCraft({
    container,
    data: graphData,
    renderer: {
      type: 'canvas',
      enableCache: true,
      enableDirtyRegions: true,
    },
    layout: {
      type: 'force',
      animate: true,
      animationDuration: 1000,
    },
    nodeStyle: {
      radius: (node: any) => {
        // Larger radius for complex nodes and windows
        if (node.properties?.category === 'complex' || node.properties?.category === 'window') {
          return 40;
        }
        return 30;
      },
      fill: (node: any) => {
        // Color nodes use their specific color
        if (node.properties?.color) {
          return node.properties.color;
        }
        
        // Category-based colors
        const categoryColors: Record<string, string> = {
          shape: '#3b82f6',
          color: '#10b981',
          border: '#f59e0b',
          icon: '#8b5cf6',
          complex: '#ec4899',
          window: '#06b6d4',
        };
        
        return categoryColors[node.properties?.category] || '#6b7280';
      },
      stroke: (node: any) => {
        // Use specific border color if provided
        if (node.properties?.borderColor) {
          return node.properties.borderColor;
        }
        // Red border for border category nodes
        if (node.properties?.category === 'border') {
          return '#dc2626';
        }
        return '#ffffff';
      },
      strokeWidth: (node: any) => {
        if (node.properties?.borderWidth) {
          return node.properties.borderWidth;
        }
        return 3;
      },
      strokeDasharray: (node: any) => {
        if (node.properties?.borderStyle === 'dashed') {
          return '5,5';
        }
        return undefined;
      },
      shape: (node: any) => {
        return node.properties?.shape || 'circle';
      },
      icon: (node: any) => {
        // Window nodes get an icon in the header
        if (node.properties?.category === 'window') {
          return node.id === 'window-1' ? '🪟' : '🖥️';
        }
        // Icon nodes use their icon property (but not displayed as we use labels for those)
        return node.properties?.icon;
      },
      window: (node: any) => {
        // Configure window-specific properties for window nodes
        if (node.properties?.category === 'window') {
          return {
            width: 140,
            height: 100,
            headerHeight: 30,
            lines: node.id === 'window-1' 
              ? ['Property: Value', 'Status: Active', 'Count: 42'] 
              : ['Application Window', 'Multi-line content', 'Line 3', 'Line 4']
          };
        }
        return undefined;
      },
      label: {
        visible: true,
        position: (node: any) => {
          // Window nodes should have label at bottom since content is in the window
          if (node.properties?.category === 'window') {
            return 'bottom';
          }
          return 'center';
        },
        fontSize: (node: any) => {
          // Smaller font for complex nodes with multiple lines
          if (node.properties?.lines && node.properties.lines > 2) {
            return 10;
          }
          return 12;
        },
        color: (node: any) => {
          return '#1f2937';
        },
        fontWeight: (node: any) => {
          if (node.properties?.category === 'window') {
            return 'bold';
          }
          return 'normal';
        },
      },
    },
    edgeStyle: {
      stroke: '#94a3b8',
      strokeWidth: 2,
      strokeDasharray: (edge: any) => {
        // Dashed edges for style connections
        if (edge.label === 'style') {
          return '5,5';
        }
        return undefined;
      },
      label: {
        visible: true,
        fontSize: 10,
        color: '#64748b',
        backgroundColor: '#ffffff',
        padding: 2,
      },
    },
    interaction: {
      draggable: true,
      selectable: true,
      zoomable: true,
      pannable: true,
    },
  });

  // Add custom rendering for icon nodes (overlay emoji on node)
  const renderIcon = () => {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // This would be called after the renderer draws
    // For now, icons are handled in the label
  };

  // Add info panel
  const infoPanel = document.createElement('div');
  infoPanel.className = 'demo-info-panel';
  infoPanel.innerHTML = `
    <h3>Styling Showcase</h3>
    <p>This demo demonstrates various node styling capabilities:</p>
    <ul>
      <li><strong>Shapes:</strong> Circle, Square, Triangle, Diamond, Hexagon, Star</li>
      <li><strong>Colors:</strong> Custom fill colors for visual variety</li>
      <li><strong>Borders:</strong> Variable width and stroke styles</li>
      <li><strong>Icons:</strong> Emoji icons overlaid on nodes</li>
      <li><strong>Complex Nodes:</strong> Multi-line labels with adjusted sizing</li>
      <li><strong>Window Nodes:</strong> Specialized shape for application windows</li>
    </ul>
    <p>Drag nodes to rearrange, scroll to zoom, and click to select.</p>
  `;
  container.appendChild(infoPanel);

  // Add legend
  const legend = document.createElement('div');
  legend.className = 'demo-legend';
  legend.innerHTML = `
    <h4>Categories</h4>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #3b82f6;"></span>
      <span>Shapes</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #10b981;"></span>
      <span>Colors</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #f59e0b;"></span>
      <span>Borders</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #8b5cf6;"></span>
      <span>Icons</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #ec4899;"></span>
      <span>Complex</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #06b6d4;"></span>
      <span>Windows</span>
    </div>
  `;
  container.appendChild(legend);

  // Add styles
  const styles = document.createElement('style');
  styles.textContent = `
    .demo-info-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 300px;
      font-size: 14px;
      z-index: 10;
    }

    .demo-info-panel h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
      color: #1f2937;
    }

    .demo-info-panel p {
      margin: 8px 0;
      color: #4b5563;
      line-height: 1.5;
    }

    .demo-info-panel ul {
      margin: 10px 0;
      padding-left: 20px;
    }

    .demo-info-panel li {
      margin: 6px 0;
      color: #4b5563;
    }

    .demo-legend {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-size: 13px;
      z-index: 10;
    }

    .demo-legend h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #1f2937;
      font-weight: 600;
    }

    .legend-item {
      display: flex;
      align-items: center;
      margin: 6px 0;
      color: #4b5563;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      margin-right: 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
  `;
  document.head.appendChild(styles);

  return graph;
}
