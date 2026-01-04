import { IRenderer, RendererType, RendererConfig } from './IRenderer';
import { CanvasRenderer } from './CanvasRenderer';
import { WebGLRenderer } from './WebGLRenderer';

/**
 * Factory for creating appropriate renderer based on configuration
 * 
 * Renderer Selection Strategy (Keylines-style):
 * - Default: WebGL (best performance, GPU-accelerated)
 * - Fallback: Canvas if WebGL not supported
 * - Explicit: Developer can force 'canvas' renderer if needed
 * 
 * Usage:
 * - Auto (default): `renderer: { type: 'auto' }` or omit type
 * - Force WebGL: `renderer: { type: 'webgl' }` (falls back to Canvas if not supported)
 * - Force Canvas: `renderer: { type: 'canvas' }`
 */
export class RendererFactory {
  /**
   * Create a renderer based on configuration and graph size
   * Default behavior (like Keylines):
   * - Try WebGL first for best performance
   * - Fallback to Canvas if WebGL not supported
   * - Allow explicit 'canvas' choice if developer prefers it
   */
  static create(config: RendererConfig, nodeCount: number = 0): IRenderer {
    let type: RendererType;

    if (config.type === 'canvas') {
      // Explicit Canvas choice - respect developer's preference
      type = 'canvas';
    } else if (config.type === 'webgl') {
      // Explicit WebGL choice - try WebGL, fallback to Canvas if not supported
      if (this.isSupported('webgl')) {
        type = 'webgl';
      } else {
        console.warn('WebGL not supported in this environment. Falling back to Canvas renderer.');
        type = 'canvas';
      }
    } else {
      // Auto mode (default): Try WebGL first, fallback to Canvas
      type = this.autoDetect(nodeCount);
    }

    switch (type) {
      case 'canvas':
        return new CanvasRenderer(config.container, {
          width: config.width,
          height: config.height,
          pixelRatio: config.pixelRatio,
          enableCache: config.enableCache,
          enableDirtyRegions: config.enableDirtyRegions
        });

      case 'webgl':
        return new WebGLRenderer(config.container, {
          width: config.width,
          height: config.height,
          pixelRatio: config.pixelRatio,
          webgl2: true
        });

      case 'svg':
        // SVG renderer removed - use Canvas instead
        console.warn('SVG renderer is deprecated. Using Canvas renderer instead.');
        return new CanvasRenderer(config.container, {
          width: config.width,
          height: config.height,
          pixelRatio: config.pixelRatio,
          enableCache: config.enableCache,
          enableDirtyRegions: config.enableDirtyRegions
        });

      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }
  }

  /**
   * Auto-detect best renderer (Keylines-style behavior)
   * Default: Always try WebGL first (best performance)
   * Fallback: Canvas if WebGL not supported
   */
  private static autoDetect(_nodeCount: number): RendererType {
    // Try WebGL first (like Keylines)
    if (this.isSupported('webgl')) {
      return 'webgl';
    }
    
    // Fallback to Canvas if WebGL not supported
    console.warn('WebGL not supported. Using Canvas renderer.');
    return 'canvas';
  }

  /**
   * Check if a renderer type is supported in the current environment
   */
  static isSupported(type: RendererType): boolean {
    switch (type) {
      case 'canvas':
        if (typeof document === 'undefined') return false;
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('2d');

      case 'webgl':
        if (typeof document === 'undefined') return false;
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        return !!gl;

      case 'svg':
        // SVG deprecated - always return false
        return false;

      default:
        return false;
    }
  }

  /**
   * Get recommended renderer for current environment and graph size
   * Follows Keylines pattern: WebGL preferred, Canvas fallback
   */
  static recommend(_nodeCount: number): {
    type: RendererType;
    reason: string;
  } {
    // Always prefer WebGL for best performance (like Keylines)
    if (this.isSupported('webgl')) {
      return {
        type: 'webgl',
        reason: 'WebGL provides best performance with GPU acceleration'
      };
    }
    
    // Fallback to Canvas if WebGL not supported
    if (this.isSupported('canvas')) {
      return {
        type: 'canvas',
        reason: 'WebGL not supported - using Canvas renderer'
      };
    }
    
    // Last resort fallback
    return {
      type: 'canvas',
      reason: 'Canvas fallback (performance may be limited)'
    };
  }
}
