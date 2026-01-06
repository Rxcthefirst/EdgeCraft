import { IRenderer, RendererType, RendererConfig } from './IRenderer';
import { CanvasRenderer } from './CanvasRenderer';
import { WebGLRenderer } from './WebGLRenderer';

/**
 * Factory for creating appropriate renderer based on configuration
 * 
 * Renderer Selection Strategy:
 * - Default: Canvas (stable, well-tested)
 * - WebGL: Disabled for v1.0 (under development)
 * - Explicit: Developer can explicitly request 'canvas' renderer
 * 
 * Usage:
 * - Auto (default): `renderer: { type: 'auto' }` or omit type → uses Canvas
 * - Force Canvas: `renderer: { type: 'canvas' }`
 * - WebGL: Not available in v1.0
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
      // WebGL disabled for v1.0 - fallback to Canvas
      console.warn('WebGL renderer is not available in v1.0. Using Canvas renderer instead.');
      type = 'canvas';
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
   * Auto-detect best renderer
   * Default: Canvas (stable and well-tested for v1.0)
   * Note: WebGL support will be added in a future release
   */
  private static autoDetect(_nodeCount: number): RendererType {
    // Use Canvas as default for v1.0
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
   * v1.0: Canvas is the recommended renderer (stable and well-tested)
   */
  static recommend(_nodeCount: number): {
    type: RendererType;
    reason: string;
  } {
    // Canvas is the default and recommended renderer for v1.0
    if (this.isSupported('canvas')) {
      return {
        type: 'canvas',
        reason: 'Canvas renderer is stable and well-tested (v1.0 default)'
      };
    }
    
    // Fallback (should never reach here in browser environment)
    return {
      type: 'canvas',
      reason: 'Canvas renderer (default)'
    };
  }
}
