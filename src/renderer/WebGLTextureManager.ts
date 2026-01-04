/**
 * WebGL Texture Manager
 * Handles loading and caching of textures from SVG, PNG, and font icons
 */

export interface TextureInfo {
  texture: WebGLTexture;
  width: number;
  height: number;
  ready: boolean;
}

export class WebGLTextureManager {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private textureCache: Map<string, TextureInfo> = new Map();
  private loadingPromises: Map<string, Promise<TextureInfo>> = new Map();
  
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
  }
  
  /**
   * Load a texture from various sources
   */
  async loadTexture(imageConfig: {
    type: 'svg' | 'png' | 'jpg' | 'fonticon';
    url?: string;
    data?: string;
    fontIcon?: {
      family: string;
      character: string;
      size?: number;
      color?: string;
    };
    width?: number;
    height?: number;
  }): Promise<TextureInfo> {
    const cacheKey = this.getCacheKey(imageConfig);
    
    // Return cached texture if available
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }
    
    // Return in-progress loading promise
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }
    
    // Start loading
    const promise = this.loadTextureInternal(imageConfig, cacheKey);
    this.loadingPromises.set(cacheKey, promise);
    
    try {
      const textureInfo = await promise;
      this.textureCache.set(cacheKey, textureInfo);
      return textureInfo;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }
  
  private async loadTextureInternal(
    imageConfig: any,
    cacheKey: string
  ): Promise<TextureInfo> {
    let image: HTMLImageElement;
    
    switch (imageConfig.type) {
      case 'svg':
        image = await this.loadSVG(imageConfig);
        break;
      case 'png':
      case 'jpg':
        image = await this.loadImage(imageConfig.url!);
        break;
      case 'fonticon':
        image = await this.loadFontIcon(imageConfig);
        break;
      default:
        throw new Error(`Unsupported image type: ${imageConfig.type}`);
    }
    
    return this.createTextureFromImage(image);
  }
  
  /**
   * Load SVG and convert to image
   */
  private async loadSVG(config: { data?: string; url?: string; width?: number; height?: number }): Promise<HTMLImageElement> {
    let svgData: string;
    
    if (config.data) {
      svgData = config.data;
    } else if (config.url) {
      const response = await fetch(config.url);
      svgData = await response.text();
    } else {
      throw new Error('SVG config must have data or url');
    }
    
    // Convert SVG to data URL
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    try {
      const image = await this.loadImage(url);
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  
  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      image.src = url;
    });
  }
  
  /**
   * Render font icon to canvas and convert to image
   */
  private async loadFontIcon(config: {
    fontIcon: {
      family: string;
      character: string;
      size?: number;
      color?: string;
    };
    width?: number;
    height?: number;
  }): Promise<HTMLImageElement> {
    const size = config.fontIcon.size || 32;
    const width = config.width || size;
    const height = config.height || size;
    const color = config.fontIcon.color || '#000000';
    
    // Create canvas to render the icon
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw the character/emoji
    ctx.font = `${size}px ${config.fontIcon.family}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.fontIcon.character, width / 2, height / 2);
    
    // Convert canvas to image
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          URL.revokeObjectURL(url);
          resolve(image);
        };
        image.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image from blob'));
        };
        image.src = url;
      });
    });
  }
  
  /**
   * Create WebGL texture from HTMLImageElement
   */
  private createTextureFromImage(image: HTMLImageElement): TextureInfo {
    const gl = this.gl;
    const texture = gl.createTexture();
    
    if (!texture) {
      throw new Error('Failed to create WebGL texture');
    }
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Flip texture vertically (WebGL expects origin at bottom-left, images have origin at top-left)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Upload image data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    // Unbind
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return {
      texture,
      width: image.width,
      height: image.height,
      ready: true,
    };
  }
  
  /**
   * Generate cache key from image config
   */
  private getCacheKey(config: any): string {
    if (config.type === 'svg' && config.data) {
      // Hash the SVG data for cache key
      return `svg:${this.simpleHash(config.data)}`;
    }
    if (config.url) {
      return `${config.type}:${config.url}`;
    }
    if (config.type === 'fonticon') {
      return `fonticon:${config.fontIcon.family}:${config.fontIcon.character}:${config.fontIcon.size || 32}:${config.fontIcon.color || '#000'}`;
    }
    return `unknown:${Date.now()}`;
  }
  
  /**
   * Simple string hash for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
  
  /**
   * Get texture from cache
   */
  getTexture(cacheKey: string): TextureInfo | undefined {
    return this.textureCache.get(cacheKey);
  }
  
  /**
   * Clear all textures
   */
  dispose(): void {
    const gl = this.gl;
    
    for (const textureInfo of this.textureCache.values()) {
      gl.deleteTexture(textureInfo.texture);
    }
    
    this.textureCache.clear();
    this.loadingPromises.clear();
  }
}
