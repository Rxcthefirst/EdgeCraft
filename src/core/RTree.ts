/**
 * R-tree Spatial Index Implementation
 * 
 * An R-tree is a balanced tree data structure for spatial indexing.
 * It groups nearby objects using their bounding rectangles, enabling
 * fast queries like point intersection and range search.
 * 
 * Performance: O(log n) for insert, delete, and search operations.
 * 
 * Based on:
 * - Guttman, A. (1984) "R-Trees: A Dynamic Index Structure for Spatial Searching"
 * - Inspired by rbush JavaScript library (Vladimir Agafonkin)
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SpatialItem {
  id: string | number;
  type: 'node' | 'edge';  // Distinguish between nodes and edges
  bounds: BoundingBox;
}

interface RTreeNode {
  bounds: BoundingBox;
  isLeaf: boolean;
  children: RTreeNode[];
  items: SpatialItem[];
  height: number;
}

export class RTree {
  private root!: RTreeNode; // Initialized in clear()
  private maxEntries: number;
  private minEntries: number;

  constructor(maxEntries: number = 9) {
    this.maxEntries = Math.max(4, maxEntries);
    this.minEntries = Math.max(2, Math.ceil(this.maxEntries * 0.4));
    this.clear();
  }

  /**
   * Clear all items from the tree
   */
  clear(): void {
    this.root = {
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      isLeaf: true,
      children: [],
      items: [],
      height: 1
    };
  }

  /**
   * Insert an item into the tree
   */
  insert(item: SpatialItem): void {
    this.insertItem(item, this.root, this.root.height - 1);
  }

  /**
   * Remove an item from the tree by ID
   */
  remove(id: string | number): boolean {
    const item = this.findItem(id, this.root);
    if (!item) return false;

    const node = this.findNodeForItem(item, this.root);
    if (!node) return false;

    // Remove item from leaf
    const index = node.items.findIndex(i => i.id === id);
    if (index !== -1) {
      node.items.splice(index, 1);
      this.updateBounds(node);
      return true;
    }

    return false;
  }

  /**
   * Query all items that intersect with the given bounding box
   */
  query(bounds: BoundingBox): SpatialItem[] {
    const results: SpatialItem[] = [];
    this.queryNode(bounds, this.root, results);
    return results;
  }

  /**
   * Find k nearest items to a given point
   */
  nearest(point: Point, k: number = 1, maxDistance: number = Infinity): SpatialItem[] {
    if (this.root.items.length === 0 && this.root.children.length === 0) {
      return [];
    }

    const queue: Array<{ node: RTreeNode; dist: number; isItem?: boolean; item?: SpatialItem }> = [];
    const results: Array<{ item: SpatialItem; dist: number }> = [];

    // Start with root
    queue.push({
      node: this.root,
      dist: this.minDistanceToBox(point, this.root.bounds)
    });

    while (queue.length > 0) {
      // Sort queue by distance (closest first)
      queue.sort((a, b) => a.dist - b.dist);
      const current = queue.shift()!;

      // If we have k results and current is farther than kth result, we're done
      if (results.length >= k && current.dist > results[k - 1].dist) {
        break;
      }

      // If this is an item, add to results
      if (current.isItem && current.item) {
        results.push({ item: current.item, dist: current.dist });
        results.sort((a, b) => a.dist - b.dist);
        if (results.length > k) {
          results.pop();
        }
        continue;
      }

      // Add children/items to queue
      const node = current.node;
      if (node.isLeaf) {
        for (const item of node.items) {
          const dist = this.distanceToPoint(point, item.bounds);
          if (dist <= maxDistance) {
            queue.push({ node, dist, isItem: true, item });
          }
        }
      } else {
        for (const child of node.children) {
          const dist = this.minDistanceToBox(point, child.bounds);
          if (dist <= maxDistance) {
            queue.push({ node: child, dist });
          }
        }
      }
    }

    return results.map(r => r.item);
  }

  /**
   * Get all items in the tree
   */
  all(): SpatialItem[] {
    return this.collectAllItems(this.root);
  }

  /**
   * Get the total number of items in the tree
   */
  count(): number {
    return this.countItems(this.root);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private insertItem(item: SpatialItem, node: RTreeNode, level: number): void {
    if (node.isLeaf) {
      node.items.push(item);
      this.updateBounds(node);
      
      if (node.items.length > this.maxEntries) {
        this.split(node);
      }
    } else {
      // Find the best child to insert into
      const childIndex = this.chooseSubtree(item.bounds, node);
      this.insertItem(item, node.children[childIndex], level - 1);
      this.updateBounds(node);

      if (node.children[childIndex].items && 
          node.children[childIndex].items.length > this.maxEntries) {
        this.split(node.children[childIndex]);
      }
    }
  }

  private split(node: RTreeNode): void {
    const seeds = this.pickSeeds(node);
    const group1 = this.createNode(node.isLeaf, node.height);
    const group2 = this.createNode(node.isLeaf, node.height);

    if (node.isLeaf) {
      group1.items.push(seeds.item1 as SpatialItem);
      group2.items.push(seeds.item2 as SpatialItem);

      // Distribute remaining items (filter out nulls)
      const remaining = node.items.filter(
        item => item != null && item !== seeds.item1 && item !== seeds.item2
      );

      for (const item of remaining) {
        const area1 = this.enlargement(group1.bounds, item.bounds);
        const area2 = this.enlargement(group2.bounds, item.bounds);

        if (area1 < area2) {
          group1.items.push(item);
        } else {
          group2.items.push(item);
        }
      }
    } else {
      group1.children.push(seeds.item1 as RTreeNode);
      group2.children.push(seeds.item2 as RTreeNode);

      const remaining = node.children.filter(
        child => child != null && child !== seeds.item1 && child !== seeds.item2
      );

      for (const child of remaining) {
        const area1 = this.enlargement(group1.bounds, child.bounds);
        const area2 = this.enlargement(group2.bounds, child.bounds);

        if (area1 < area2) {
          group1.children.push(child);
        } else {
          group2.children.push(child);
        }
      }
    }

    this.updateBounds(group1);
    this.updateBounds(group2);

    // Replace node with new groups
    if (node === this.root) {
      this.root = this.createNode(false, node.height + 1);
      this.root.children = [group1, group2];
      this.updateBounds(this.root);
    } else {
      // This would need parent tracking - simplified version
      node.children = [group1, group2];
      node.items = [];
      node.isLeaf = false;
      this.updateBounds(node);
    }
  }

  private pickSeeds(node: RTreeNode): { item1: any; item2: any } {
    let maxWaste = -1;
    let item1: any = null;
    let item2: any = null;

    // Filter out null items/children
    const items = (node.isLeaf ? node.items : node.children).filter(item => item != null);

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const bounds1 = this.getBounds(items[i]);
        const bounds2 = this.getBounds(items[j]);
        const combined = this.combineBounds(bounds1, bounds2);
        const waste = this.area(combined) - this.area(bounds1) - this.area(bounds2);

        if (waste > maxWaste) {
          maxWaste = waste;
          item1 = items[i];
          item2 = items[j];
        }
      }
    }

    return { item1, item2 };
  }

  private chooseSubtree(bounds: BoundingBox, node: RTreeNode): number {
    let minEnlargement = Infinity;
    let minArea = Infinity;
    let bestIndex = 0;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const enlargement = this.enlargement(child.bounds, bounds);
      const area = this.area(child.bounds);

      if (enlargement < minEnlargement || 
          (enlargement === minEnlargement && area < minArea)) {
        minEnlargement = enlargement;
        minArea = area;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  private queryNode(bounds: BoundingBox, node: RTreeNode, results: SpatialItem[]): void {
    if (!this.intersects(bounds, node.bounds)) {
      return;
    }

    if (node.isLeaf) {
      for (const item of node.items) {
        if (this.intersects(bounds, item.bounds)) {
          results.push(item);
        }
      }
    } else {
      for (const child of node.children) {
        this.queryNode(bounds, child, results);
      }
    }
  }

  private findItem(id: string | number, node: RTreeNode): SpatialItem | null {
    if (node.isLeaf) {
      return node.items.find(item => item.id === id) || null;
    }

    for (const child of node.children) {
      const found = this.findItem(id, child);
      if (found) return found;
    }

    return null;
  }

  private findNodeForItem(item: SpatialItem, node: RTreeNode): RTreeNode | null {
    if (node.isLeaf) {
      return node.items.some(i => i.id === item.id) ? node : null;
    }

    for (const child of node.children) {
      const found = this.findNodeForItem(item, child);
      if (found) return found;
    }

    return null;
  }

  private updateBounds(node: RTreeNode): void {
    if (node.isLeaf) {
      // Filter out any null/undefined items
      const validItems = node.items.filter(item => item != null);
      if (validItems.length === 0) {
        node.bounds = { x: 0, y: 0, width: 0, height: 0 };
      } else {
        node.bounds = validItems.reduce(
          (acc, item) => this.combineBounds(acc, item.bounds),
          validItems[0].bounds
        );
      }
    } else {
      // Filter out any null/undefined children
      const validChildren = node.children.filter(child => child != null);
      if (validChildren.length === 0) {
        node.bounds = { x: 0, y: 0, width: 0, height: 0 };
      } else {
        node.bounds = validChildren.reduce(
          (acc, child) => this.combineBounds(acc, child.bounds),
          validChildren[0].bounds
        );
      }
    }
  }

  private createNode(isLeaf: boolean, height: number): RTreeNode {
    return {
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      isLeaf,
      children: [],
      items: [],
      height
    };
  }

  private collectAllItems(node: RTreeNode): SpatialItem[] {
    if (node.isLeaf) {
      return [...node.items];
    }

    const items: SpatialItem[] = [];
    for (const child of node.children) {
      items.push(...this.collectAllItems(child));
    }
    return items;
  }

  private countItems(node: RTreeNode): number {
    if (node.isLeaf) {
      return node.items.length;
    }

    let count = 0;
    for (const child of node.children) {
      count += this.countItems(child);
    }
    return count;
  }

  // ============================================================================
  // Geometry Helpers
  // ============================================================================

  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x > b.x + b.width ||
      b.x > a.x + a.width ||
      a.y > b.y + b.height ||
      b.y > a.y + a.height
    );
  }

  private combineBounds(a: BoundingBox, b: BoundingBox): BoundingBox {
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxX = Math.max(a.x + a.width, b.x + b.width);
    const maxY = Math.max(a.y + a.height, b.y + b.height);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private area(bounds: BoundingBox): number {
    return bounds.width * bounds.height;
  }

  private enlargement(original: BoundingBox, addition: BoundingBox): number {
    const combined = this.combineBounds(original, addition);
    return this.area(combined) - this.area(original);
  }

  private getBounds(item: any): BoundingBox {
    if (!item) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return item.bounds || item;
  }

  private minDistanceToBox(point: Point, box: BoundingBox): number {
    const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
    const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
    return Math.sqrt(dx * dx + dy * dy);
  }

  private distanceToPoint(point: Point, box: BoundingBox): number {
    // Distance to center of box
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get debug info about the tree structure
   */
  getDebugInfo(): any {
    return {
      height: this.root.height,
      itemCount: this.count(),
      root: this.serializeNode(this.root)
    };
  }

  private serializeNode(node: RTreeNode): any {
    return {
      bounds: node.bounds,
      isLeaf: node.isLeaf,
      itemCount: node.isLeaf ? node.items.length : node.children.length,
      children: node.isLeaf ? undefined : node.children.map(c => this.serializeNode(c))
    };
  }
}
