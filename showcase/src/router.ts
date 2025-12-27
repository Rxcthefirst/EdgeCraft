/**
 * Simple client-side router
 */
export class Router {
  private routes: Map<string, () => Promise<void>> = new Map();
  private currentPath: string = '/';

  constructor() {
    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('click', (e) => this.handleLinkClick(e));
  }

  /**
   * Register a route
   */
  public route(path: string, handler: () => Promise<void>): void {
    this.routes.set(path, handler);
  }

  /**
   * Navigate to a path
   */
  public navigate(path: string): void {
    if (path === this.currentPath) return;
    
    history.pushState(null, '', path);
    this.handleRoute();
  }

  /**
   * Handle route changes
   */
  private async handleRoute(): Promise<void> {
    const path = window.location.pathname;
    this.currentPath = path;

    // Find matching route
    let handler = this.routes.get(path);
    
    // Try pattern matching for dynamic routes
    if (!handler) {
      for (const [pattern, h] of this.routes) {
        if (this.matchPath(pattern, path)) {
          handler = h;
          break;
        }
      }
    }

    // Fallback to home
    if (!handler) {
      handler = this.routes.get('/');
    }

    if (handler) {
      await handler();
    }
  }

  /**
   * Match path pattern (supports /demos/:id)
   */
  private matchPath(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    return patternParts.every((part, i) => {
      return part.startsWith(':') || part === pathParts[i];
    });
  }

  /**
   * Handle link clicks
   */
  private handleLinkClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const link = target.closest('a');

    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) {
      return;
    }

    e.preventDefault();
    this.navigate(href);
  }

  /**
   * Start the router
   */
  public start(): void {
    this.handleRoute();
  }

  /**
   * Get route parameter
   */
  public getParam(name: string): string | null {
    const path = window.location.pathname;
    const parts = path.split('/');
    
    // Simple implementation - for demo/:id pattern
    if (path.startsWith('/demo/')) {
      if (name === 'id') {
        return parts[2] || null;
      }
    }
    
    return null;
  }
}

export const router = new Router();
