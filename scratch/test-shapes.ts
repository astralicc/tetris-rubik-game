import {
  createShapeCubies,
  ALL_SHAPE_TYPES,
  getShapeBounds,
  applyGlobalRotation,
  applyTwistToCubies,
  extractFrontFaceColors,
  SHAPES_META,
  RUBIK_COLORS,
} from '../src/utils/rubik';
import {
  SHAPE_TARGET_MAP,
  TARGET_SHAPES,
  checkTargetMatch,
  getDetachingBlocks,
  calculateLandingY,
  createEmptyGrid,
} from '../src/utils/tetris';
import type { CubeShapeType, RubikFace } from '../src/types/game';

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

console.log('=== TEST SUITE: CUBE SHAPES, TARGETS & DETACHMENT ===\n');

// 1. Target mappings
console.log('Test 1: Target Shape Mappings');
for (const shape of ALL_SHAPE_TYPES) {
  const targets = SHAPE_TARGET_MAP[shape];
  assert(targets && targets.length > 0, `${shape} has valid targets`);

  for (const tKey of targets) {
    const tDef = TARGET_SHAPES[tKey];
    assert(!!tDef, `${shape} target '${tKey}' is defined in TARGET_SHAPES`);

    // Count active blocks in target matrix
    const count = tDef.matrix.reduce(
      (sum, row) => sum + row.filter(Boolean).length,
      0
    );

    if (shape === '1x1x2') {
      assert(count === 2, `1x1x2 target '${tKey}' has exactly 2 blocks (got ${count})`);
    } else if (shape === '3x3' || shape === '2x2' || shape === '2x2x1' || shape === 'L_SHAPE') {
      assert(count === 4, `${shape} target '${tKey}' has exactly 4 blocks (got ${count})`);
    }
  }
}

// 2. Shape bounds and initial cubie count
console.log('\nTest 2: Initial Shape Creation & Bounds');
const EXPECTED_CUBIE_COUNTS: Record<CubeShapeType, number> = {
  '3x3': 27,
  '2x2': 8,
  'L_SHAPE': 4,
  '2x2x1': 4,
  '1x1x2': 2,
};

const EXPECTED_FRONT_FACE_CELLS: Record<CubeShapeType, number> = {
  '3x3': 9,
  '2x2': 4,
  'L_SHAPE': 4,
  '2x2x1': 4,
  '1x1x2': 2,
};

for (const shape of ALL_SHAPE_TYPES) {
  const cubies = createShapeCubies(shape);
  assert(
    cubies.length === EXPECTED_CUBIE_COUNTS[shape],
    `${shape} spawns with ${EXPECTED_CUBIE_COUNTS[shape]} cubies (got ${cubies.length})`
  );

  const bounds = getShapeBounds(cubies);
  const meta = SHAPES_META[shape];
  assert(
    bounds.width === meta.width && bounds.height === meta.height && bounds.depth === meta.depth,
    `${shape} bounds match meta: ${meta.width}x${meta.height}x${meta.depth} (got ${bounds.width}x${bounds.height}x${bounds.depth})`
  );

  const frontFace = extractFrontFaceColors(cubies);
  const nonDarkCount = frontFace.flat().filter((c) => c && c !== '#111827').length;
  assert(
    nonDarkCount === EXPECTED_FRONT_FACE_CELLS[shape],
    `${shape} front face has ${EXPECTED_FRONT_FACE_CELLS[shape]} visible cells (got ${nonDarkCount})`
  );
}

// 3. Detaching blocks must never orphan or drop partial cubies for polycubes
console.log('\nTest 3: Detaching Blocks Integrity (Matched & Unmatched)');
for (const shape of ALL_SHAPE_TYPES) {
  const cubies = createShapeCubies(shape);
  const frontFace = extractFrontFaceColors(cubies);
  const targetKey = SHAPE_TARGET_MAP[shape][0];
  const target = TARGET_SHAPES[targetKey];

  // Test UNMATCHED detachment
  const unmatchedResult = { isMatch: false, matchedColor: null, matchedIndices: [] };
  const unmatchedDetached = getDetachingBlocks(frontFace, unmatchedResult);
  const expectedUnmatched = EXPECTED_FRONT_FACE_CELLS[shape] === 9 ? 4 : EXPECTED_FRONT_FACE_CELLS[shape];

  assert(
    unmatchedDetached.length === expectedUnmatched,
    `${shape} UNMATCHED detaches full ${expectedUnmatched} blocks (got ${unmatchedDetached.length})`
  );

  // Test MATCHED detachment
  const matchedFrontFace: string[][] = frontFace.map((row) =>
    row.map((c) => (c !== '#111827' ? RUBIK_COLORS.F : '#111827'))
  );
  const match = checkTargetMatch(matchedFrontFace, target);
  assert(match.isMatch, `${shape} matches target '${target.name}' with uniform color`);

  const matchedDetached = getDetachingBlocks(matchedFrontFace, match);
  const expectedMatched = shape === '1x1x2' ? 2 : 4;
  assert(
    matchedDetached.length === expectedMatched,
    `${shape} MATCHED detaches full ${expectedMatched} blocks (got ${matchedDetached.length})`
  );
}

// 4. In-Plane & 3D Rotations and Twists
console.log('\nTest 4: Rotation & Twisting Integrity');
const FACES: RubikFace[] = ['U', 'D', 'L', 'R', 'F', 'B'];

for (const shape of ALL_SHAPE_TYPES) {
  // Test in-plane 2D rotation (roll / Z-axis) for 4 full 90-deg cycles
  let rollCubies = createShapeCubies(shape);
  for (let rot = 1; rot <= 4; rot++) {
    rollCubies = applyGlobalRotation(rollCubies, 'z', 1);
    const bounds = getShapeBounds(rollCubies);
    assert(!isNaN(bounds.width) && !isNaN(bounds.height), `${shape} 90-deg Z roll #${rot} has valid bounds`);

    const frontFace = extractFrontFaceColors(rollCubies);
    const nonDark = frontFace.flat().filter((c) => c && c !== '#111827').length;
    assert(
      nonDark === EXPECTED_FRONT_FACE_CELLS[shape],
      `${shape} maintains full ${EXPECTED_FRONT_FACE_CELLS[shape]} front face cells after Z roll #${rot}`
    );

    // And detaching blocks always returns the full shape
    const detached = getDetachingBlocks(frontFace, { isMatch: false, matchedColor: null, matchedIndices: [] });
    const expected = shape === '3x3' ? 4 : EXPECTED_FRONT_FACE_CELLS[shape];
    assert(
      detached.length === expected,
      `${shape} detached blocks count is ${expected} after Z roll #${rot}`
    );
  }

  // Test layer twists
  let twistCubies = createShapeCubies(shape);
  for (const face of FACES) {
    const twist = { face, direction: 1 as const, axis: 'y' as const, sliceIndex: 0 };
    twistCubies = applyTwistToCubies(twistCubies, twist, shape);
    const bounds = getShapeBounds(twistCubies);
    assert(!isNaN(bounds.width), `${shape} twist ${face} preserves coordinates without NaN`);
  }
}

// 5. Landing Y Collision Detection
console.log('\nTest 5: Collision Detection with Stacked Blocks');
const grid = createEmptyGrid();
grid[17][2] = '#EF4444';
grid[17][3] = '#EF4444';

const testBlocks = [
  { row: 0, col: 0, color: '#22C55E' },
  { row: 0, col: 1, color: '#22C55E' },
];
const landingY = calculateLandingY(grid, 1, 0, testBlocks);
assert(
  landingY === 16,
  `Landing Y stops at row 16 before colliding with row 17 obstacle (got ${landingY})`
);

// 6. Slice Moves & Wide Moves
console.log('\nTest 6: Slice Moves (M, E, S) & Wide Moves (Uw, Dw, Lw, Rw, Fw, Bw)');
const ALL_NEW_MOVES: RubikFace[] = ['M', 'E', 'S', 'Uw', 'Dw', 'Lw', 'Rw', 'Fw', 'Bw'];

// Verify 4 quarter turns on 3x3 returns to original positions
const orig3x3 = createShapeCubies('3x3');
for (const move of ALL_NEW_MOVES) {
  let c = orig3x3;
  for (let step = 0; step < 4; step++) {
    c = applyTwistToCubies(c, { face: move, direction: 1, axis: 'x', sliceIndex: 0 }, '3x3');
  }
  const maxDiff = c.reduce((max, cubie, i) => {
    const orig = orig3x3[i].currentPos;
    const cur = cubie.currentPos;
    const diff = Math.max(
      Math.abs(orig[0] - cur[0]),
      Math.abs(orig[1] - cur[1]),
      Math.abs(orig[2] - cur[2])
    );
    return Math.max(max, diff);
  }, 0);

  assert(maxDiff < 0.001, `3x3: 4 quarter turns of ${move} returns to exact original positions (maxDiff: ${maxDiff})`);
}

// Verify polycubes remain intact under all new moves
for (const shape of ALL_SHAPE_TYPES) {
  for (const move of ALL_NEW_MOVES) {
    let c = createShapeCubies(shape);
    c = applyTwistToCubies(c, { face: move, direction: 1, axis: 'x', sliceIndex: 0 }, shape);
    const bounds = getShapeBounds(c);
    assert(!isNaN(bounds.width) && bounds.width > 0, `${shape} after ${move} has valid bounds without NaN`);
  }
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
