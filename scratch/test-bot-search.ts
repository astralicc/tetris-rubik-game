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
  createEmptyGrid,
} from '../src/utils/tetris';
import { GRID_COLS, GRID_ROWS } from '../src/types/game';
import type { RubikFace, RotationAxis, TetrisGrid, CubieData, TetrominoDefinition, CubeShapeType } from '../src/types/game';

interface BotMove {
  type: 'TWIST' | 'ROTATE';
  face?: RubikFace;
  axis?: RotationAxis;
  direction: 1 | -1;
}

interface EvaluationResult {
  moves: BotMove[];
  targetX: number;
  score: number;
  isMatch: boolean;
}

const ROTATION_CANDIDATES: BotMove[] = [
  { type: 'ROTATE', axis: 'z', direction: 1 },
  { type: 'ROTATE', axis: 'z', direction: -1 },
  { type: 'ROTATE', axis: 'x', direction: 1 },
  { type: 'ROTATE', axis: 'x', direction: -1 },
  { type: 'ROTATE', axis: 'y', direction: 1 },
  { type: 'ROTATE', axis: 'y', direction: -1 },
];

const TWIST_FACES: RubikFace[] = ['U', 'D', 'L', 'R', 'F', 'B'];

function evaluateGrid(grid: TetrisGrid): {
  linesCleared: number;
  aggregateHeight: number;
  holes: number;
  bumpiness: number;
  maxHeight: number;
} {
  const colHeights = new Array(GRID_COLS).fill(0);
  let holes = 0;

  for (let c = 0; c < GRID_COLS; c++) {
    let foundBlock = false;
    for (let r = 0; r < GRID_ROWS; r++) {
      if (grid[r][c] !== null) {
        if (!foundBlock) {
          colHeights[c] = GRID_ROWS - r;
          foundBlock = true;
        }
      } else if (foundBlock) {
        holes++;
      }
    }
  }

  let fullLines = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    if (grid[r].every((cell) => cell !== null)) {
      fullLines++;
    }
  }

  let bumpiness = 0;
  for (let c = 0; c < GRID_COLS - 1; c++) {
    bumpiness += Math.abs(colHeights[c] - colHeights[c + 1]);
  }

  const aggregateHeight = colHeights.reduce((a, b) => a + b, 0);
  const maxHeight = Math.max(...colHeights);

  return {
    linesCleared: fullLines,
    aggregateHeight,
    holes,
    bumpiness,
    maxHeight,
  };
}

function evaluatePlacement(
  grid: TetrisGrid,
  cubies: CubieData[],
  target: TetrominoDefinition,
  moves: BotMove[]
): { bestX: number; bestScore: number; isMatch: boolean } {
  const faceColors = extractBottomFaceColors(cubies);
  const match = checkTargetMatch(faceColors, target);
  const blocks = getDetachingBlocks(faceColors, match);

  if (blocks.length === 0) return { bestX: 4, bestScore: -9999, isMatch: false };

  const minCol = Math.min(...blocks.map((b) => b.col));
  const maxCol = Math.max(...blocks.map((b) => b.col));

  const minSafeX = -minCol;
  const maxSafeX = GRID_COLS - 1 - maxCol;

  let bestX = Math.max(0, minSafeX);
  let bestScore = -Infinity;

  for (let testX = minSafeX; testX <= maxSafeX; testX++) {
    const landingY = calculateLandingY(grid, testX, 0, blocks);

    // Simulate stamping
    const simGrid: TetrisGrid = grid.map((row) => [...row]);
    let outOfBounds = false;
    for (const b of blocks) {
      const r = landingY + b.row;
      const c = testX + b.col;
      if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) {
        outOfBounds = true;
        break;
      }
      simGrid[r][c] = b.color;
    }

    if (outOfBounds) continue;

    const stats = evaluateGrid(simGrid);

    // Dellacherie evaluation function
    let score = 0;
    score += stats.linesCleared * 250;
    score -= stats.holes * 12.0;
    score -= stats.aggregateHeight * 0.8;
    score -= stats.bumpiness * 0.5;
    score -= stats.maxHeight * 1.5;

    if (match.isMatch) {
      score += 500;
    }

    // Small penalty for move count so bot prefers simpler actions
    score -= moves.length * 8;

    if (score > bestScore) {
      bestScore = score;
      bestX = testX;
    }
  }

  return { bestX, bestScore, isMatch: match.isMatch };
}

export function computeBotPlan(
  grid: TetrisGrid,
  cubies: CubieData[],
  shape: CubeShapeType,
  target: TetrominoDefinition
): EvaluationResult {
  const startTime = Date.now();
  let bestPlan: EvaluationResult = {
    moves: [],
    targetX: 4,
    score: -Infinity,
    isMatch: false,
  };

  // 1. Evaluate base orientation
  const baseEval = evaluatePlacement(grid, cubies, target, []);
  bestPlan = {
    moves: [],
    targetX: baseEval.bestX,
    score: baseEval.bestScore,
    isMatch: baseEval.isMatch,
  };

  // 2. Evaluate single global rotations
  for (const rot of ROTATION_CANDIDATES) {
    const rotated = applyGlobalRotation(cubies, rot.axis!, rot.direction);
    const rEval = evaluatePlacement(grid, rotated, target, [rot]);
    if (rEval.bestScore > bestPlan.score) {
      bestPlan = {
        moves: [rot],
        targetX: rEval.bestX,
        score: rEval.bestScore,
        isMatch: rEval.isMatch,
      };
    }
  }

  // 3. Evaluate double global rotations (e.g. pitch + roll to explore all 24 faces)
  for (const rot1 of ROTATION_CANDIDATES) {
    const c1 = applyGlobalRotation(cubies, rot1.axis!, rot1.direction);
    for (const rot2 of ROTATION_CANDIDATES) {
      // Don't undo rot1
      if (rot1.axis === rot2.axis && rot1.direction === -rot2.direction) continue;
      const c2 = applyGlobalRotation(c1, rot2.axis!, rot2.direction);
      const r2Eval = evaluatePlacement(grid, c2, target, [rot1, rot2]);
      if (r2Eval.bestScore > bestPlan.score) {
        bestPlan = {
          moves: [rot1, rot2],
          targetX: r2Eval.bestX,
          score: r2Eval.bestScore,
          isMatch: r2Eval.isMatch,
        };
      }
    }
  }

  // 4. If not yet matched, try single twist moves
  if (!bestPlan.isMatch && (shape === '3x3' || shape === '2x2' || shape === '2x2x1')) {
    for (const face of TWIST_FACES) {
      for (const dir of [1, -1] as const) {
        const twistMove: BotMove = { type: 'TWIST', face, direction: dir };
        const twisted = applyTwistToCubies(cubies, { face, direction: dir, axis: 'x', sliceIndex: 0 }, shape);
        const tEval = evaluatePlacement(grid, twisted, target, [twistMove]);
        if (tEval.bestScore > bestPlan.score) {
          bestPlan = {
            moves: [twistMove],
            targetX: tEval.bestX,
            score: tEval.bestScore,
            isMatch: tEval.isMatch,
          };
        }

        // Also check if twist + rotation gives match
        if (tEval.isMatch) continue; // already matched

        for (const rot of ROTATION_CANDIDATES) {
          const twistedAndRotated = applyGlobalRotation(twisted, rot.axis!, rot.direction);
          const trEval = evaluatePlacement(grid, twistedAndRotated, target, [twistMove, rot]);
          if (trEval.isMatch && trEval.bestScore > bestPlan.score) {
            bestPlan = {
              moves: [twistMove, rot],
              targetX: trEval.bestX,
              score: trEval.bestScore,
              isMatch: true,
            };
            break;
          }
        }
      }
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`Plan computed in ${elapsed}ms: moves=${bestPlan.moves.length}, targetX=${bestPlan.targetX}, score=${bestPlan.score.toFixed(1)}, isMatch=${bestPlan.isMatch}`);
  return bestPlan;
}

console.log('Testing Bot Plan Search across shapes...');
const grid = createEmptyGrid();
for (const shape of ALL_SHAPE_TYPES) {
  const { cubies } = generateScrambledShape(shape, 3);
  const targetKey = SHAPE_TARGET_MAP[shape][0];
  const target = TARGET_SHAPES[targetKey];
  const plan = computeBotPlan(grid, cubies, shape, target);
  console.log(`✓ ${shape} -> target: ${target.name}, plan moves: ${plan.moves.length}, targetX: ${plan.targetX}`);
}
