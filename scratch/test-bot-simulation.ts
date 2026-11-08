import {
  ALL_SHAPE_TYPES,
  applyGlobalRotation,
  applyTwistToCubies,
  extractBottomFaceColors,
  generateScrambledShape,
} from '../src/utils/rubik';
import {
  SHAPE_TARGET_MAP,
  TARGET_SHAPES,
  checkTargetMatch,
  getDetachingBlocks,
  calculateLandingY,
  clearFullLines,
  createEmptyGrid,
} from '../src/utils/tetris';
import { GRID_ROWS } from '../src/types/game';
import type { TetrisGrid } from '../src/types/game';
import { computeBotPlan } from './test-bot-search';

console.log('Simulating 15 consecutive bot drops on 2D Tetris board...');
let grid = createEmptyGrid();
let totalLines = 0;
let totalMatches = 0;

for (let drop = 1; drop <= 15; drop++) {
  const shape = ALL_SHAPE_TYPES[(drop - 1) % ALL_SHAPE_TYPES.length];
  const { cubies } = generateScrambledShape(shape, 3);
  const targetKey = SHAPE_TARGET_MAP[shape][0];
  const target = TARGET_SHAPES[targetKey];

  const plan = computeBotPlan(grid, cubies, shape, target);

  // Apply moves
  let currentCubies = cubies;
  for (const move of plan.moves) {
    if (move.type === 'ROTATE') {
      currentCubies = applyGlobalRotation(currentCubies, move.axis!, move.direction);
    } else if (move.type === 'TWIST') {
      currentCubies = applyTwistToCubies(currentCubies, { face: move.face!, direction: move.direction, axis: 'x', sliceIndex: 0 }, shape);
    }
  }

  const faceColors = extractBottomFaceColors(currentCubies);
  const match = checkTargetMatch(faceColors, target);
  if (match.isMatch) totalMatches++;

  const blocks = getDetachingBlocks(faceColors, match);
  const landingY = calculateLandingY(grid, plan.targetX, 0, blocks);

  if (landingY <= 0) {
    console.log(`Drop #${drop}: Board filled / topped out!`);
    break;
  }

  // Stamp
  const newGrid: TetrisGrid = grid.map((r) => [...r]);
  for (const b of blocks) {
    const r = landingY + b.row;
    const c = plan.targetX + b.col;
    if (r >= 0 && r < GRID_ROWS) {
      newGrid[r][c] = b.color;
    }
  }

  const clearRes = clearFullLines(newGrid);
  grid = clearRes.newGrid;
  totalLines += clearRes.linesCleared;

  console.log(`Drop #${drop}: Shape=${shape}, moves=${plan.moves.length}, targetX=${plan.targetX}, landingY=${landingY}, linesCleared=${clearRes.linesCleared}, matched=${match.isMatch}`);
}

console.log(`\nSimulation complete! Total lines cleared: ${totalLines}, Total matches: ${totalMatches}`);

