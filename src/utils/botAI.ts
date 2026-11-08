import {
  getShapeBounds,
  applyGlobalRotation,
  applyTwistToCubies,
  extractBottomFaceColors,
} from './rubik';
import {
  checkTargetMatch,
  getDetachingBlocks,
  calculateLandingY,
} from './tetris';
import { GRID_COLS, GRID_ROWS } from '../types/game';
import type {
  RubikFace,
  RotationAxis,
  TetrisGrid,
  CubieData,
  TetrominoDefinition,
  CubeShapeType,
} from '../types/game';

export interface BotMove {
  type: 'TWIST' | 'ROTATE';
  face?: RubikFace;
  axis?: RotationAxis;
  direction: 1 | -1;
}

export interface BotPlan {
  moves: BotMove[];
  targetX: number;
  expectedScore: number;
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

/**
 * Classic Dellacherie / El-Tetris heuristic evaluation of a simulated Tetris board.
 */
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

/**
 * Simulates landing and evaluates the best horizontal landing column for a given cubie orientation.
 */
function evaluatePlacement(
  grid: TetrisGrid,
  cubies: CubieData[],
  target: TetrominoDefinition,
  moves: BotMove[]
): { bestX: number; bestScore: number; isMatch: boolean } {
  const faceColors = extractBottomFaceColors(cubies);
  const match = checkTargetMatch(faceColors, target);
  const blocks = getDetachingBlocks(faceColors, match, target);

  if (blocks.length === 0) return { bestX: 3, bestScore: -9999, isMatch: false };

  const bounds = getShapeBounds(cubies);
  const maxBlockCol = Math.max(...blocks.map((b) => b.col));
  const pieceWidth = Math.max(bounds.width, maxBlockCol + 1);
  const maxSafeX = Math.max(0, GRID_COLS - pieceWidth);

  let bestX = 0;
  let bestScore = -Infinity;

  for (let testX = 0; testX <= maxSafeX; testX++) {
    const landingY = calculateLandingY(grid, testX, 0, blocks);

    // If piece cannot spawn or causes immediate top-out, heavily penalize
    if (landingY <= 0) continue;

    // Simulate stamping onto board
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

    // Dellacherie evaluation score
    let score = 0;
    score += stats.linesCleared * 300;
    score -= stats.holes * 15.0;
    score -= stats.aggregateHeight * 0.7;
    score -= stats.bumpiness * 0.4;
    score -= stats.maxHeight * 1.8;

    if (stats.maxHeight > 14) {
      score -= (stats.maxHeight - 14) * 12.0;
    }

    if (match.isMatch) {
      score += 500;
    }

    // Move count penalty so simpler plans with fewer rotations are preferred
    score -= moves.length * 8;

    if (score > bestScore) {
      bestScore = score;
      bestX = testX;
    }
  }

  return { bestX, bestScore, isMatch: match.isMatch };
}

/**
 * Computes the optimal Rubik sequence (rotations/twists) and landing column X for the current falling piece.
 */
export function computeBotPlan(
  grid: TetrisGrid,
  cubies: CubieData[],
  shape: CubeShapeType,
  target: TetrominoDefinition
): BotPlan {
  let bestPlan: BotPlan = {
    moves: [],
    targetX: 3,
    expectedScore: -Infinity,
    isMatch: false,
  };

  // 1. Evaluate base orientation
  const baseEval = evaluatePlacement(grid, cubies, target, []);
  bestPlan = {
    moves: [],
    targetX: baseEval.bestX,
    expectedScore: baseEval.bestScore,
    isMatch: baseEval.isMatch,
  };

  // 2. Evaluate single global rotations (roll, pitch, yaw)
  for (const rot of ROTATION_CANDIDATES) {
    const rotated = applyGlobalRotation(cubies, rot.axis!, rot.direction);
    const rEval = evaluatePlacement(grid, rotated, target, [rot]);
    if (rEval.bestScore > bestPlan.expectedScore) {
      bestPlan = {
        moves: [rot],
        targetX: rEval.bestX,
        expectedScore: rEval.bestScore,
        isMatch: rEval.isMatch,
      };
    }
  }

  // 3. Evaluate double global rotations (e.g. pitch + roll to explore all 24 orientations)
  for (const rot1 of ROTATION_CANDIDATES) {
    const c1 = applyGlobalRotation(cubies, rot1.axis!, rot1.direction);
    for (const rot2 of ROTATION_CANDIDATES) {
      if (rot1.axis === rot2.axis && rot1.direction === -rot2.direction) continue; // Skip redundant opposite turn
      const c2 = applyGlobalRotation(c1, rot2.axis!, rot2.direction);
      const r2Eval = evaluatePlacement(grid, c2, target, [rot1, rot2]);
      if (r2Eval.bestScore > bestPlan.expectedScore) {
        bestPlan = {
          moves: [rot1, rot2],
          targetX: r2Eval.bestX,
          expectedScore: r2Eval.bestScore,
          isMatch: r2Eval.isMatch,
        };
      }
    }
  }

  // 4. If not yet matched, try single layer twist moves for twistable shapes
  if (!bestPlan.isMatch && (shape === '3x3' || shape === '2x2' || shape === '2x2x1')) {
    for (const face of TWIST_FACES) {
      for (const dir of [1, -1] as const) {
        const twistMove: BotMove = { type: 'TWIST', face, direction: dir };
        const twisted = applyTwistToCubies(cubies, { face, direction: dir, axis: 'x', sliceIndex: 0 }, shape);
        const tEval = evaluatePlacement(grid, twisted, target, [twistMove]);
        if (tEval.bestScore > bestPlan.expectedScore) {
          bestPlan = {
            moves: [twistMove],
            targetX: tEval.bestX,
            expectedScore: tEval.bestScore,
            isMatch: tEval.isMatch,
          };
        }

        // Also check if twist + rotation gives match
        if (tEval.isMatch) continue;

        for (const rot of ROTATION_CANDIDATES) {
          const twistedAndRotated = applyGlobalRotation(twisted, rot.axis!, rot.direction);
          const trEval = evaluatePlacement(grid, twistedAndRotated, target, [twistMove, rot]);
          if (trEval.isMatch && trEval.bestScore > bestPlan.expectedScore) {
            bestPlan = {
              moves: [twistMove, rot],
              targetX: trEval.bestX,
              expectedScore: trEval.bestScore,
              isMatch: true,
            };
            break;
          }
        }
      }
    }
  }

  return bestPlan;
}

