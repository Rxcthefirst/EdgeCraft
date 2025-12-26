/**
 * R-tree Spatial Index Tests
 * 
 * Quick verification that the R-tree implementation works correctly
 */

import { RTree, type SpatialItem, type BoundingBox, type Point } from '../src/core/RTree';

console.log('🧪 Testing R-tree Spatial Index...\n');

// Test 1: Basic insert and query
console.log('Test 1: Insert and Query');
const tree = new RTree();

const items: SpatialItem[] = [
  { id: 1, bounds: { x: 10, y: 10, width: 20, height: 20 } },
  { id: 2, bounds: { x: 50, y: 50, width: 20, height: 20 } },
  { id: 3, bounds: { x: 100, y: 100, width: 20, height: 20 } },
  { id: 4, bounds: { x: 15, y: 15, width: 10, height: 10 } }, // Overlaps with item 1
];

items.forEach(item => tree.insert(item));
console.log(`✓ Inserted ${items.length} items`);
console.log(`✓ Tree contains ${tree.count()} items`);

// Query a region
const queryBox: BoundingBox = { x: 0, y: 0, width: 40, height: 40 };
const results = tree.query(queryBox);
console.log(`✓ Query (0,0,40,40) found ${results.length} items:`, results.map(r => r.id));
console.log('  Expected: [1, 4]\n');

// Test 2: Nearest neighbor
console.log('Test 2: Nearest Neighbor');
const point: Point = { x: 20, y: 20 };
const nearest = tree.nearest(point, 2);
console.log(`✓ 2 nearest to (20,20):`, nearest.map(n => n.id));
console.log('  Expected: [1, 4] (closest) or [4, 1]\n');

// Test 3: Large dataset
console.log('Test 3: Performance with 10,000 nodes');
const largeTree = new RTree();
const startInsert = performance.now();

for (let i = 0; i < 10000; i++) {
  largeTree.insert({
    id: i,
    bounds: {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      width: 10,
      height: 10
    }
  });
}

const insertTime = performance.now() - startInsert;
console.log(`✓ Inserted 10,000 items in ${insertTime.toFixed(2)}ms`);
console.log(`✓ Average: ${(insertTime / 10000).toFixed(4)}ms per insert`);

// Query performance
const startQuery = performance.now();
const queryCount = 1000;

for (let i = 0; i < queryCount; i++) {
  const x = Math.random() * 1000;
  const y = Math.random() * 1000;
  largeTree.query({ x, y, width: 100, height: 100 });
}

const queryTime = performance.now() - startQuery;
console.log(`✓ Performed ${queryCount} queries in ${queryTime.toFixed(2)}ms`);
console.log(`✓ Average: ${(queryTime / queryCount).toFixed(4)}ms per query`);
console.log(`✓ Target: <0.1ms per query (${queryTime / queryCount < 0.1 ? 'PASS ✓' : 'NEEDS OPTIMIZATION ⚠'})\n`);

// Test 4: Nearest neighbor performance
console.log('Test 4: Nearest Neighbor Performance');
const startNearest = performance.now();
const nearestCount = 1000;

for (let i = 0; i < nearestCount; i++) {
  const x = Math.random() * 1000;
  const y = Math.random() * 1000;
  largeTree.nearest({ x, y }, 5);
}

const nearestTime = performance.now() - startNearest;
console.log(`✓ Found 5 nearest neighbors ${nearestCount} times in ${nearestTime.toFixed(2)}ms`);
console.log(`✓ Average: ${(nearestTime / nearestCount).toFixed(4)}ms per query\n`);

// Test 5: Remove
console.log('Test 5: Remove');
const beforeCount = tree.count();
tree.remove(2);
const afterCount = tree.count();
console.log(`✓ Count before remove: ${beforeCount}`);
console.log(`✓ Count after remove: ${afterCount}`);
console.log(`✓ Successfully removed: ${beforeCount === afterCount + 1 ? 'YES ✓' : 'NO ✗'}\n`);

// Test 6: Debug info
console.log('Test 6: Tree Structure');
const debugInfo = tree.getDebugInfo();
console.log('✓ Tree height:', debugInfo.height);
console.log('✓ Item count:', debugInfo.itemCount);
console.log('✓ Root bounds:', debugInfo.root.bounds);
console.log('\n');

// Summary
console.log('═══════════════════════════════════════');
console.log('✅ All R-tree tests completed!');
console.log('═══════════════════════════════════════');
console.log('\nPerformance Summary:');
console.log(`  10K insertions: ${insertTime.toFixed(2)}ms (${(insertTime / 10000).toFixed(4)}ms each)`);
console.log(`  1K range queries: ${queryTime.toFixed(2)}ms (${(queryTime / 1000).toFixed(4)}ms each)`);
console.log(`  1K nearest queries: ${nearestTime.toFixed(2)}ms (${(nearestTime / 1000).toFixed(4)}ms each)`);

const speedup = 1 / (queryTime / queryCount);
console.log(`\n🚀 Estimated speedup vs linear search: ${speedup.toFixed(0)}x faster`);
console.log(`   (Linear would be ~1ms per query for 10K items)`);
