import { EdgeCraft } from '../EdgeCraft';

export interface ToolbarAction {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  onClick?: () => void;
  menu?: ToolbarMenuItem[];
  disabled?: boolean;
  type?: 'button' | 'separator' | 'dropdown';
}

export interface ToolbarMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface ToolbarConfig {
  container: string | HTMLElement;
  actions: (ToolbarAction | 'separator')[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Toolbar Component
 * Pre-built toolbar with customizable actions, icons, and keyboard shortcuts
 */
export class Toolbar {
  private container: HTMLElement;
  private config: ToolbarConfig;
  private element: HTMLElement;
  private graph?: EdgeCraft;
  private activeDropdown: HTMLElement | null = null;

  constructor(config: ToolbarConfig) {
    this.config = config;
    
    // Get container element
    if (typeof config.container === 'string') {
      const el = document.querySelector(config.container);
      if (!el) {
        throw new Error(`Toolbar container not found: ${config.container}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = config.container;
    }

    this.element = this.createToolbar();
    this.container.appendChild(this.element);
    this.attachEventListeners();
  }

  /**
   * Attach the toolbar to a graph instance
   */
  attachToGraph(graph: EdgeCraft): void {
    this.graph = graph;
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = `edgecraft-toolbar ${this.config.className || ''}`;
    toolbar.setAttribute('data-position', this.config.position || 'top');

    this.config.actions.forEach((action) => {
      if (action === 'separator') {
        toolbar.appendChild(this.createSeparator());
      } else {
        toolbar.appendChild(this.createButton(action));
      }
    });

    return toolbar;
  }

  private createButton(action: ToolbarAction): HTMLElement {
    const button = document.createElement('button');
    button.className = 'edgecraft-toolbar-button';
    button.setAttribute('data-action-id', action.id);
    
    if (action.disabled) {
      button.disabled = true;
      button.classList.add('disabled');
    }

    if (action.tooltip) {
      button.title = action.tooltip;
    }

    // Add icon if provided
    if (action.icon) {
      const icon = document.createElement('span');
      icon.className = `edgecraft-icon edgecraft-icon-${action.icon}`;
      icon.innerHTML = this.getIcon(action.icon);
      button.appendChild(icon);
    }

    // Add label if provided
    if (action.label) {
      const label = document.createElement('span');
      label.className = 'edgecraft-toolbar-label';
      label.textContent = action.label;
      button.appendChild(label);
    }

    // Add dropdown indicator if menu exists
    if (action.menu && action.menu.length > 0) {
      button.classList.add('has-dropdown');
      const dropdown = this.createDropdown(action.menu);
      button.appendChild(dropdown);
    }

    // Attach click handler
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (action.menu && action.menu.length > 0) {
        this.toggleDropdown(button);
      } else if (action.onClick) {
        action.onClick();
      }
    });

    return button;
  }

  private createSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.className = 'edgecraft-toolbar-separator';
    return separator;
  }

  private createDropdown(items: ToolbarMenuItem[]): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'edgecraft-toolbar-dropdown';

    items.forEach((item) => {
      const menuItem = document.createElement('button');
      menuItem.className = 'edgecraft-toolbar-dropdown-item';
      
      if (item.disabled) {
        menuItem.disabled = true;
        menuItem.classList.add('disabled');
      }

      if (item.icon) {
        const icon = document.createElement('span');
        icon.className = `edgecraft-icon edgecraft-icon-${item.icon}`;
        icon.innerHTML = this.getIcon(item.icon);
        menuItem.appendChild(icon);
      }

      const label = document.createElement('span');
      label.textContent = item.label;
      menuItem.appendChild(label);

      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        item.onClick();
        this.closeAllDropdowns();
      });

      dropdown.appendChild(menuItem);
    });

    return dropdown;
  }

  private toggleDropdown(button: HTMLElement): void {
    const dropdown = button.querySelector('.edgecraft-toolbar-dropdown') as HTMLElement;
    
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('open');
    
    // Close all dropdowns first
    this.closeAllDropdowns();

    if (!isOpen) {
      dropdown.classList.add('open');
      this.activeDropdown = dropdown;
    }
  }

  private closeAllDropdowns(): void {
    const dropdowns = this.element.querySelectorAll('.edgecraft-toolbar-dropdown.open');
    dropdowns.forEach((dropdown) => dropdown.classList.remove('open'));
    this.activeDropdown = null;
  }

  private attachEventListeners(): void {
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });
  }

  /**
   * Update an action's state
   */
  updateAction(actionId: string, updates: Partial<ToolbarAction>): void {
    const button = this.element.querySelector(`[data-action-id="${actionId}"]`) as HTMLButtonElement;
    
    if (!button) return;

    if (updates.disabled !== undefined) {
      button.disabled = updates.disabled;
      if (updates.disabled) {
        button.classList.add('disabled');
      } else {
        button.classList.remove('disabled');
      }
    }

    if (updates.label) {
      const labelEl = button.querySelector('.edgecraft-toolbar-label');
      if (labelEl) {
        labelEl.textContent = updates.label;
      }
    }
  }

  /**
   * Add a new action to the toolbar
   */
  addAction(action: ToolbarAction | 'separator', position?: number): void {
    const element = action === 'separator' 
      ? this.createSeparator()
      : this.createButton(action);

    if (position !== undefined && position < this.element.children.length) {
      this.element.insertBefore(element, this.element.children[position]);
    } else {
      this.element.appendChild(element);
    }
  }

  /**
   * Remove an action from the toolbar
   */
  removeAction(actionId: string): void {
    const button = this.element.querySelector(`[data-action-id="${actionId}"]`);
    if (button) {
      button.remove();
    }
  }

  /**
   * Get SVG icon markup
   */
  private getIcon(name: string): string {
    const icons: Record<string, string> = {
      'fit-view': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>',
      'zoom-in': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6m-3-3h6"/></svg>',
      'zoom-out': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/></svg>',
      'download': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
      'upload': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
      'layout': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
      'filter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>',
      'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
      'settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>',
      'undo': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-9 9"/></svg>',
      'redo': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 019 9"/></svg>',
      'lock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      'unlock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>',
      'image': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    };

    return icons[name] || '';
  }

  /**
   * Destroy the toolbar
   */
  destroy(): void {
    this.closeAllDropdowns();
    this.element.remove();
  }
}

/**
 * Create a default toolbar with common actions
 */
export function createDefaultToolbar(graph: EdgeCraft, container: string | HTMLElement): Toolbar {
  const toolbar = new Toolbar({
    container,
    actions: [
      {
        id: 'fit',
        icon: 'fit-view',
        tooltip: 'Fit to view',
        onClick: () => graph.fit()
      },
      {
        id: 'zoom-in',
        icon: 'zoom-in',
        tooltip: 'Zoom in',
        onClick: () => graph.zoom(1.2)
      },
      {
        id: 'zoom-out',
        icon: 'zoom-out',
        tooltip: 'Zoom out',
        onClick: () => graph.zoom(0.8)
      },
      'separator',
      {
        id: 'export',
        icon: 'download',
        tooltip: 'Export',
        menu: [
          { label: 'Export as PNG', onClick: () => graph.export('png') },
          { label: 'Export as SVG', onClick: () => graph.export('svg') },
          { label: 'Export as JSON', onClick: () => graph.export('json') }
        ]
      },
      {
        id: 'layout',
        icon: 'layout',
        tooltip: 'Change layout',
        menu: [
          { label: 'Force-Directed', onClick: () => graph.layout({ type: 'force' }) },
          { label: 'Hierarchical', onClick: () => graph.layout({ type: 'hierarchical' }) },
          { label: 'Circular', onClick: () => graph.layout({ type: 'circular' }) },
          { label: 'Grid', onClick: () => graph.layout({ type: 'grid' }) }
        ]
      }
    ]
  });

  toolbar.attachToGraph(graph);
  return toolbar;
}
