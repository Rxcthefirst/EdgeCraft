import { EdgeCraft } from '../EdgeCraft';
import type { GraphNode, GraphEdge } from '../types';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: (context: ContextMenuContext) => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

export interface ContextMenuContext {
  type: 'node' | 'edge' | 'background';
  node?: GraphNode;
  edge?: GraphEdge;
  position: { x: number; y: number };
}

export interface ContextMenuConfig {
  nodeActions?: ContextMenuItem[];
  edgeActions?: ContextMenuItem[];
  backgroundActions?: ContextMenuItem[];
  className?: string;
}

/**
 * Context Menu Component
 * Right-click menus for nodes, edges, and background
 */
export class ContextMenu {
  private config: ContextMenuConfig;
  private element: HTMLElement;
  private graph?: EdgeCraft;
  private currentContext?: ContextMenuContext;

  constructor(config: ContextMenuConfig = {}) {
    this.config = {
      nodeActions: this.getDefaultNodeActions(),
      edgeActions: this.getDefaultEdgeActions(),
      backgroundActions: this.getDefaultBackgroundActions(),
      ...config
    };

    this.element = this.createContextMenu();
    document.body.appendChild(this.element);
    this.attachEventListeners();
  }

  /**
   * Attach the context menu to a graph instance
   */
  attachToGraph(graph: EdgeCraft): void {
    this.graph = graph;

    // Listen for right-click events
    graph.on('nodeRightClick', (event: any) => {
      this.show({
        type: 'node',
        node: event.node,
        position: { x: event.clientX, y: event.clientY }
      });
    });

    graph.on('edgeRightClick', (event: any) => {
      this.show({
        type: 'edge',
        edge: event.edge,
        position: { x: event.clientX, y: event.clientY }
      });
    });

    graph.on('backgroundRightClick', (event: any) => {
      this.show({
        type: 'background',
        position: { x: event.clientX, y: event.clientY }
      });
    });
  }

  private createContextMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = `edgecraft-context-menu ${this.config.className || ''}`;
    menu.style.position = 'fixed';
    menu.style.display = 'none';
    return menu;
  }

  private attachEventListeners(): void {
    // Close menu on outside click
    document.addEventListener('click', () => {
      this.hide();
    });

    // Close menu on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });

    // Prevent context menu from closing when clicking inside it
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Show the context menu
   */
  show(context: ContextMenuContext): void {
    this.currentContext = context;
    this.element.innerHTML = '';

    // Get appropriate actions
    let actions: ContextMenuItem[] = [];
    switch (context.type) {
      case 'node':
        actions = this.config.nodeActions || [];
        break;
      case 'edge':
        actions = this.config.edgeActions || [];
        break;
      case 'background':
        actions = this.config.backgroundActions || [];
        break;
    }

    // Create menu items
    actions.forEach((action) => {
      if (action.separator) {
        this.element.appendChild(this.createSeparator());
      } else {
        this.element.appendChild(this.createMenuItem(action, context));
      }
    });

    // Position menu
    this.element.style.left = `${context.position.x}px`;
    this.element.style.top = `${context.position.y}px`;
    this.element.style.display = 'block';
    this.element.classList.add('open');

    // Adjust position if menu goes off-screen
    setTimeout(() => {
      const rect = this.element.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.element.style.left = `${window.innerWidth - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        this.element.style.top = `${window.innerHeight - rect.height}px`;
      }
    }, 0);
  }

  /**
   * Hide the context menu
   */
  hide(): void {
    this.element.style.display = 'none';
    this.element.classList.remove('open');
    this.currentContext = undefined;
  }

  private createMenuItem(action: ContextMenuItem, context: ContextMenuContext): HTMLElement {
    const item = document.createElement('button');
    item.className = 'edgecraft-context-menu-item';

    if (action.disabled) {
      item.classList.add('disabled');
      item.disabled = true;
    }

    if (action.icon) {
      const icon = document.createElement('span');
      icon.className = 'edgecraft-icon';
      icon.innerHTML = this.getIcon(action.icon);
      item.appendChild(icon);
    }

    const label = document.createElement('span');
    label.className = 'edgecraft-context-menu-label';
    label.textContent = action.label;
    item.appendChild(label);

    if (action.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'edgecraft-context-menu-shortcut';
      shortcut.textContent = action.shortcut;
      item.appendChild(shortcut);
    }

    item.addEventListener('click', () => {
      if (!action.disabled) {
        action.onClick(context);
        this.hide();
      }
    });

    return item;
  }

  private createSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.className = 'edgecraft-context-menu-separator';
    return separator;
  }

  private getDefaultNodeActions(): ContextMenuItem[] {
    return [
      {
        label: 'Select Node',
        onClick: (context) => {
          if (context.node && this.graph) {
            this.graph.selectNode(context.node.id);
          }
        }
      },
      {
        label: 'Hide Node',
        onClick: (context) => {
          if (context.node && this.graph) {
            this.graph.hideNode(context.node.id);
          }
        }
      },
      {
        label: 'Delete Node',
        onClick: (context) => {
          if (context.node && this.graph) {
            this.graph.removeNode(context.node.id);
          }
        }
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Expand Neighbors',
        onClick: (context) => {
          if (context.node && this.graph) {
            const neighbors = this.graph.getNeighbors(context.node.id);
            neighbors.forEach((n: any) => this.graph!.showNode(n.id));
          }
        }
      }
    ];
  }

  private getDefaultEdgeActions(): ContextMenuItem[] {
    return [
      {
        label: 'Select Edge',
        onClick: (context) => {
          if (context.edge && this.graph) {
            this.graph.selectEdge(context.edge.id);
          }
        }
      },
      {
        label: 'Hide Edge',
        onClick: (context) => {
          if (context.edge && this.graph) {
            this.graph.hideEdge(context.edge.id);
          }
        }
      },
      {
        label: 'Delete Edge',
        onClick: (context) => {
          if (context.edge && this.graph) {
            this.graph.removeEdge(context.edge.id);
          }
        }
      }
    ];
  }

  private getDefaultBackgroundActions(): ContextMenuItem[] {
    return [
      {
        label: 'Fit to View',
        shortcut: 'Ctrl+0',
        onClick: () => {
          if (this.graph) {
            this.graph.fit();
          }
        }
      },
      {
        label: 'Select All',
        shortcut: 'Ctrl+A',
        onClick: () => {
          if (this.graph) {
            this.graph.selectAll();
          }
        }
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Export as PNG',
        onClick: () => {
          if (this.graph) {
            this.graph.export('png');
          }
        }
      }
    ];
  }

  private getIcon(name: string): string {
    // Simple icon set (can be extended)
    const icons: Record<string, string> = {
      'eye': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      'trash': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    };
    return icons[name] || '';
  }

  /**
   * Destroy the context menu
   */
  destroy(): void {
    this.element.remove();
  }
}
