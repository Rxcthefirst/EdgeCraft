/**
 * Generic Object Pool
 * 
 * Reuses objects to reduce garbage collection pressure and improve performance.
 * Particularly useful for frequently created/destroyed objects like:
 * - Temporary vectors/points during rendering
 * - Edge curve segments
 * - Transform matrices
 * - Bounding boxes for hit testing
 * 
 * Benefits:
 * - Reduced GC pauses
 * - Consistent frame times
 * - Better memory locality
 * - Faster allocation (O(1) vs heap allocation)
 */

export interface Poolable {
  /**
   * Reset object to default state before returning to pool
   */
  reset?(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[];
  private factory: () => T;
  private maxSize: number;
  private activeCount: number;

  /**
   * Create a new object pool
   * @param factory Function to create new instances
   * @param initialSize Initial pool size (pre-allocate objects)
   * @param maxSize Maximum pool size (prevent unbounded growth)
   */
  constructor(factory: () => T, initialSize: number = 10, maxSize: number = 1000) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.pool = [];
    this.activeCount = 0;

    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * Acquire an object from the pool
   * Creates a new one if pool is empty
   */
  acquire(): T {
    this.activeCount++;
    
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    // Pool exhausted - create new object
    return this.factory();
  }

  /**
   * Return an object to the pool
   * Calls reset() if available to clean up state
   */
  release(obj: T): void {
    if (this.activeCount > 0) {
      this.activeCount--;
    }

    // Reset object state
    if (obj.reset) {
      obj.reset();
    }

    // Only return to pool if under max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // else: let it be garbage collected (pool is full)
  }

  /**
   * Release multiple objects at once
   */
  releaseAll(objects: T[]): void {
    objects.forEach(obj => this.release(obj));
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.pool.length,
      active: this.activeCount,
      total: this.pool.length + this.activeCount,
      maxSize: this.maxSize
    };
  }

  /**
   * Clear the pool (release all inactive objects)
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * Prune pool to target size (remove excess objects)
   */
  prune(targetSize: number): void {
    if (this.pool.length > targetSize) {
      this.pool.length = targetSize;
    }
  }
}

// ============================================================================
// Common Poolable Types
// ============================================================================

/**
 * Poolable 2D Point/Vector
 */
export class PooledPoint implements Poolable {
  x: number = 0;
  y: number = 0;

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
  }

  copy(other: PooledPoint): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }
}

/**
 * Poolable Bounding Box
 */
export class PooledBoundingBox implements Poolable {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;

  set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }

  contains(px: number, py: number): boolean {
    return px >= this.x && 
           px <= this.x + this.width &&
           py >= this.y && 
           py <= this.y + this.height;
  }

  intersects(other: PooledBoundingBox): boolean {
    return !(other.x > this.x + this.width ||
             other.x + other.width < this.x ||
             other.y > this.y + this.height ||
             other.y + other.height < this.y);
  }
}

/**
 * Poolable 2D Transform Matrix (3x3 for 2D affine transforms)
 */
export class PooledMatrix implements Poolable {
  // Matrix elements [a b c d e f] representing:
  // | a c e |
  // | b d f |
  // | 0 0 1 |
  a: number = 1;
  b: number = 0;
  c: number = 0;
  d: number = 1;
  e: number = 0;
  f: number = 0;

  reset(): void {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }

  setIdentity(): this {
    this.reset();
    return this;
  }

  setTranslation(tx: number, ty: number): this {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = tx;
    this.f = ty;
    return this;
  }

  setScale(sx: number, sy: number): this {
    this.a = sx;
    this.b = 0;
    this.c = 0;
    this.d = sy;
    this.e = 0;
    this.f = 0;
    return this;
  }

  setRotation(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.a = cos;
    this.b = sin;
    this.c = -sin;
    this.d = cos;
    this.e = 0;
    this.f = 0;
    return this;
  }

  transformPoint(x: number, y: number, out: PooledPoint): void {
    out.x = this.a * x + this.c * y + this.e;
    out.y = this.b * x + this.d * y + this.f;
  }
}

// ============================================================================
// Global Pool Instances
// ============================================================================

/**
 * Global pool for temporary points/vectors
 * Use for intermediate calculations, then release immediately
 */
export const pointPool = new ObjectPool<PooledPoint>(
  () => new PooledPoint(),
  50,  // Initial size
  500  // Max size
);

/**
 * Global pool for temporary bounding boxes
 * Use for hit testing and spatial queries
 */
export const boundingBoxPool = new ObjectPool<PooledBoundingBox>(
  () => new PooledBoundingBox(),
  20,
  200
);

/**
 * Global pool for temporary matrices
 * Use for transform calculations
 */
export const matrixPool = new ObjectPool<PooledMatrix>(
  () => new PooledMatrix(),
  10,
  100
);
