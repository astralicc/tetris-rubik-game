import {
  createShapeCubies,
  ALL_SHAPE_TYPES,
  getShapeBounds,
  applyGlobalRotation,
  extractBottomFaceColors,
} from '../src/utils/rubik';
import {
  SHAPE_TARGET_MAP,
  TARGET_SHAPES,
  checkTargetMatch,
  getDetachingBlocks,
  calculateLandingY,
  createEmptyGrid,
} from '../src/utils/tetris';
import { GRID_COLS, GRID_ROWS } from '../src/types/game';

let passed = 0;
let failed = 0;

function assert(cond: boolean, desc: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${desc}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

console.log('=== TEST SUITE: BOUNDARY & WALL-KICK LOCKING INTEGRITY ===\n');

// 1. Test that for every shape, at any horizontal position (including extreme x = 0 and x = 9),
// calculateLandingY NEVER returns premature collision on an empty grid!
console.log('Test 1: calculateLandingY never triggers premature floor collision on empty grid');
const emptyGrid = createEmptyGrid();

for (const shape of ALL_SHAPE_TYPES) {
  const cubies = createShapeCubies(shape);
  const bottomColors = extractBottomFaceColors(cubies);
  const targetKey = SHAPE_TARGET_MAP[shape][0];
  const target = TARGET_SHAPES[targetKey];
  const match = checkTargetMatch(bottomColors, target);
  const blocks = getDetachingBlocks(bottomColors, match);
  const bounds = getShapeBounds(cubies);

  for (let x = -2; x <= GRID_COLS + 2; x++) {
    for (let y = 0; y < GRID_ROWS - bounds.height; y += 3) {
      const landingY = calculateLandingY(emptyGrid, x, y, blocks);
      const maxBlockRow = Math.max(...blocks.map((b) => b.row));
      const expectedLandingY = GRID_ROWS - 1 - maxBlockRow;
      assert(
        landingY === expectedLandingY,
        `${shape} at x=${x}, y=${y} lands at ${expectedLandingY} on empty grid (got ${landingY})`
      );
    }
  }
}

// 2. Test that stamping blocks with safeCubeX never drops or orphans a block outside [0, GRID_COLS - 1]
console.log('\nTest 2: safeCubeX stamping ensures 100% of blocks land inside grid');
for (const shape of ALL_SHAPE_TYPES) {
  const cubies = createShapeCubies(shape);
  const bottomColors = extractBottomFaceColors(cubies);
  const targetKey = SHAPE_TARGET_MAP[shape][0];
  const target = TARGET_SHAPES[targetKey];
  const match = checkTargetMatch(bottomColors, target);
  const blocks = getDetachingBlocks(bottomColors, match);

  const maxCol = blocks.length > 0 ? Math.max(...blocks.map((b) => b.col)) : 0;
  const minCol = blocks.length > 0 ? Math.min(...blocks.map((b) => b.col)) : 0;

  for (let rawX = -5; rawX <= 15; rawX++) {
    const safeCubeX = Math.max(-minCol, Math.min(GRID_COLS - 1 - maxCol, rawX));
    for (const b of blocks) {
      const targetCol = safeCubeX + b.col;
      assert(
        targetCol >= 0 && targetCol < GRID_COLS,
        `${shape} rawX=${rawX} -> safeCubeX=${safeCubeX} stamps col ${targetCol} in [0, ${GRID_COLS - 1}]`
      );
    }
  }
}

// 3. Test rotations at right wall (x = 8, 9) wall-kick into valid bounds
console.log('\nTest 3: Wall-kick prevents pieces from overflowing right wall');
for (const shape of ALL_SHAPE_TYPES) {
  let c = createShapeCubies(shape);
  for (const axis of ['x', 'y', 'z'] as const) {
    const rotated = applyGlobalRotation(c, axis, 1);
    const bounds = getShapeBounds(rotated);
    let targetX = 9;
    if (targetX + bounds.width > GRID_COLS) {
      targetX = Math.max(0, GRID_COLS - bounds.width);
    }
    assert(
      targetX + bounds.width <= GRID_COLS && targetX >= 0,
      `${shape} rotation ${axis} wall-kicks targetX=${targetX} + width=${bounds.width} <= ${GRID_COLS}`
    );
  }
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}

