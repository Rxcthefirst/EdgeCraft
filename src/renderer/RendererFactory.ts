import { IRenderer, RendererType, RendererConfig } from './IRenderer';
import { CanvasRenderer } from './CanvasRenderer';
import { WebGLRenderer } from './WebGLRenderer';

/**
 * Factory for creating appropriate renderer based on graph size and configuration
 * Canvas-only approach like Keylines (no SVG for production)
 */
export class RendererFactory {
  /**
   * Create a renderer based on configuration and graph size
   */
  static create(config: RendererConfig, nodeCount: number = 0): IRenderer {
    const type = config.type === 'auto' || !config.type
      ? this.autoDetect(nodeCount)
      : config.type;

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
   * Auto-detect best renderer based on graph size (Canvas/WebGL only)
   * - Canvas: < 5000 nodes (excellent performance with dirty regions)
   * - WebGL: 5000+ nodes (GPU acceleration for massive graphs)
   */
  private static autoDetect(nodeCount: number): RendererType {
    if (nodeCount < 5000) {
      return 'canvas';
    } else {
      return 'webgl';
    }
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
   */
  static recommend(nodeCount: number): {
    type: RendererType;
    reason: string;
  } {
    if (nodeCount < 5000) {
      if (this.isSupported('canvas')) {
        return {
          type: 'canvas',
          reason: 'Canvas provides excellent performance for graphs up to 5000 nodes'
        };
      } else {
        return {
          type: 'canvas',
          reason: 'Canvas is the only supported renderer'
        };
      }
    } else {
      if (this.isSupported('webgl')) {
        return {
          type: 'webgl',
          reason: 'WebGL required for large graphs (GPU acceleration)'
        };
      } else if (this.isSupported('canvas')) {
        return {
          type: 'canvas',
          reason: 'WebGL not supported, using Canvas (may be slow for large graphs)'
        };
      } else {
        return {
          type: 'canvas',
          reason: 'Canvas fallback (performance may be limited)'
        };
      }
    }
  }
}
