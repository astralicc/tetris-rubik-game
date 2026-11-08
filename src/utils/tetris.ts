import {
  GRID_ROWS,
  GRID_COLS,
} from '../types/game';
import type {
  TetrisGrid,
  TetrominoDefinition,
  CubeShapeType,
} from '../types/game';

// Classic Tetromino and Shape definitions
export const TARGET_SHAPES: Record<string, TetrominoDefinition> = {
  T: {
    type: 'T',
    name: 'T-Shape',
    color: '#A855F7', // Purple
    matrix: [
      [true, true, true],
      [false, true, false],
    ],
  },
  L: {
    type: 'L',
    name: 'L-Shape',
    color: '#F97316', // Orange
    matrix: [
      [true, false],
      [true, false],
      [true, true],
    ],
  },
  J: {
    type: 'J',
    name: 'J-Shape',
    color: '#3B82F6', // Blue
    matrix: [
      [false, true],
      [false, true],
      [true, true],
    ],
  },
  S: {
    type: 'S',
    name: 'S-Shape',
    color: '#22C55E', // Green
    matrix: [
      [false, true, true],
      [true, true, false],
    ],
  },
  Z: {
    type: 'Z',
    name: 'Z-Shape',
    color: '#EF4444', // Red
    matrix: [
      [true, true, false],
      [false, true, true],
    ],
  },
  O: {
    type: 'O',
    name: 'Square',
    color: '#EAB308', // Yellow
    matrix: [
      [true, true],
      [true, true],
    ],
  },
  I: {
    type: 'I',
    name: 'Bar',
    color: '#06B6D4', // Cyan
    matrix: [
      [true],
      [true],
      [true],
    ],
  },
  DOMINO: {
    type: 'I',
    name: 'Domino',
    color: '#EC4899', // Pink
    matrix: [
      [true, true],
    ],
  },
  CORNER: {
    type: 'L',
    name: 'Corner',
    color: '#10B981', // Emerald
    matrix: [
      [true, false],
      [true, true],
    ],
  },
  SINGLE: {
    type: 'O',
    name: 'Single',
    color: '#F59E0B', // Amber
    matrix: [
      [true],
    ],
  },
};

// Shape-specific target mappings
export const SHAPE_TARGET_MAP: Record<CubeShapeType, string[]> = {
  // 3x3 gets real 4-block classic Tetrominoes that fit on a 3x3 face
  '3x3': ['T', 'L', 'J', 'S', 'Z', 'O'],
  // 2x2 Pocket Cube matches full 4-block 2x2 Square (O)
  '2x2': ['O'],
  // 3D L-Shape matches full 4-block L/J-tetromino
  'L_SHAPE': ['L', 'J'],
  // 2x2x1 Slim matches full 4-block 2x2 Square (O)
  '2x2x1': ['O'],
  // 1x1x2 Tower matches full 2-block Domino
  '1x1x2': ['DOMINO'],
};

export function getRandomTargetForShape(shape: CubeShapeType): TetrominoDefinition {
  const allowed = SHAPE_TARGET_MAP[shape] || SHAPE_TARGET_MAP['3x3'];
  const key = allowed[Math.floor(Math.random() * allowed.length)];
  return TARGET_SHAPES[key] || TARGET_SHAPES.T;
}

export function createEmptyGrid(): TetrisGrid {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => null)
  );
}

export function rotateMatrix90(matrix: boolean[][]): boolean[][] {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const result: boolean[][] = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => false)
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

export function reflectMatrix(matrix: boolean[][]): boolean[][] {
  return matrix.map((row) => [...row].reverse());
}

export function getAllRotations(matrix: boolean[][]): boolean[][][] {
  const r0 = matrix;
  const r90 = rotateMatrix90(r0);
  const r180 = rotateMatrix90(r90);
  const r270 = rotateMatrix90(r180);

  const m0 = reflectMatrix(matrix);
  const m90 = rotateMatrix90(m0);
  const m180 = rotateMatrix90(m90);
  const m270 = rotateMatrix90(m180);

  return [r0, r90, r180, r270, m0, m90, m180, m270];
}

export function normalizeMatrix(matrix: boolean[][]): boolean[][] {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  let minR = rows, maxR = -1, minC = cols, maxC = -1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  if (maxR === -1) {
    return [[false]];
  }

  const h = maxR - minR + 1;
  const w = maxC - minC + 1;
  const normalized: boolean[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => false)
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c]) {
        normalized[r - minR][c - minC] = true;
      }
    }
  }

  return normalized;
}

export interface MatchResult {
  isMatch: boolean;
  matchedColor: string | null;
  matchedIndices: [number, number][]; // [row, col] on the front face
}

/**
 * Checks if the front face contains the target tetromino in any valid position or rotation.
 * Finds any placement where all active cells of the tetromino share the same color.
 */
export function checkTargetMatch(
  frontColors: string[][],
  target: TetrominoDefinition
): MatchResult {
  const rows = frontColors.length;
  const cols = frontColors[0]?.length || 0;

  const rotations = getAllRotations(target.matrix).map(normalizeMatrix);

  for (const rot of rotations) {
    const rotH = rot.length;
    const rotW = rot[0]?.length || 0;

    // Slide this rotation across all valid offsets (dr, dc) in the front face
    for (let dr = 0; dr <= rows - rotH; dr++) {
      for (let dc = 0; dc <= cols - rotW; dc++) {
        const placementCoords: [number, number][] = [];
        for (let r = 0; r < rotH; r++) {
          for (let c = 0; c < rotW; c++) {
            if (rot[r][c]) {
              placementCoords.push([dr + r, dc + c]);
            }
          }
        }

        if (placementCoords.length === 0) continue;

        // Check if all these cells have the same valid color
        const firstCoord = placementCoords[0];
        const color = frontColors[firstCoord[0]][firstCoord[1]];
        if (!color || color === '#111827') continue;

        const allMatch = placementCoords.every(
          ([r, c]) => frontColors[r][c] === color
        );

        if (allMatch) {
          return {
            isMatch: true,
            matchedColor: color,
            matchedIndices: placementCoords,
          };
        }
      }
    }
  }

  return {
    isMatch: false,
    matchedColor: null,
    matchedIndices: [],
  };
}

/**
 * Gets the active blocks that will detach and lock into the 2D grid from the front face.
 * Guaranteed to return a clean Tetris piece (at most 4 blocks for 3x3) so boards stay playable!
 */
export function getDetachingBlocks(
  frontColors: string[][],
  matchResult: MatchResult
): { row: number; col: number; color: string }[] {
  const rows = frontColors.length;
  const cols = frontColors[0]?.length || 0;

  // Collect all active non-empty cells on the front face
  const activeCells: { row: number; col: number; color: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = frontColors[r][c];
      if (color && color !== '#111827') {
        activeCells.push({ row: r, col: c, color });
      }
    }
  }

  // Small polycube footprints (<= 4 cubies: 1x1x2, 2x2, 2x2x1, L_SHAPE)
  // ALWAYS detach ALL active cells so the piece never fractures or leaves stray blocks!
  if (activeCells.length <= 4 && activeCells.length > 0) {
    return activeCells.map((cell) => ({
      ...cell,
      color: matchResult.isMatch && matchResult.matchedColor ? matchResult.matchedColor : cell.color,
    }));
  }

  // For 3x3: If target tetromino is matched, return those exact 4 cells!
  if (matchResult.isMatch && matchResult.matchedColor && matchResult.matchedIndices.length > 0) {
    return matchResult.matchedIndices.map(([r, c]) => ({
      row: r,
      col: c,
      color: frontColors[r][c],
    }));
  }

  // For 3x3: Find dominant color on front face, capped at 4 blocks!
  const counts: Record<string, [number, number][]> = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = frontColors[r][c];
      if (!color || color === '#111827') continue;
      if (!counts[color]) counts[color] = [];
      counts[color].push([r, c]);
    }
  }

  let dominantColor: string | null = null;
  let maxCount = 0;
  for (const [color, list] of Object.entries(counts)) {
    if (list.length > maxCount) {
      maxCount = list.length;
      dominantColor = color;
    }
  }

  if (dominantColor && counts[dominantColor]) {
    // Cap at 4 blocks to always produce a classic tetromino footprint!
    const capped = counts[dominantColor].slice(0, 4);
    return capped.map(([r, c]) => ({
      row: r,
      col: c,
      color: dominantColor!,
    }));
  }

  // Default 4-block piece
  return [
    { row: 0, col: 0, color: '#EF4444' },
    { row: 0, col: 1, color: '#EF4444' },
    { row: 1, col: 0, color: '#EF4444' },
    { row: 1, col: 1, color: '#EF4444' },
  ];
}

/**
 * Calculates the lowest valid landing row (Y) for the detaching blocks.
 */
export function calculateLandingY(
  grid: TetrisGrid,
  cubeX: number,
  currentY: number,
  blocks: { row: number; col: number; color: string }[]
): number {
  if (blocks.length === 0) return GRID_ROWS - 1;

  // Safe horizontal clamping so horizontal boundaries never falsely trigger vertical floor collision
  const maxCol = Math.max(...blocks.map((b) => b.col));
  const minCol = Math.min(...blocks.map((b) => b.col));
  const safeX = Math.max(-minCol, Math.min(GRID_COLS - 1 - maxCol, cubeX));

  const startY = Math.max(0, Math.floor(currentY));

  for (let testY = startY; testY <= GRID_ROWS; testY++) {
    let collides = false;
    for (const b of blocks) {
      const gridCol = safeX + b.col;
      const gridRow = testY + b.row;

      // Vertical Floor collision
      if (gridRow >= GRID_ROWS) {
        collides = true;
        break;
      }

      // Check collision with existing locked blocks
      if (gridRow >= 0 && gridCol >= 0 && gridCol < GRID_COLS && grid[gridRow][gridCol] !== null) {
        collides = true;
        break;
      }
    }

    if (collides) {
      return Math.max(0, testY - 1);
    }
  }

  return GRID_ROWS - 1;
}

/**
 * Checks for and clears completed rows.
 */
export function clearFullLines(grid: TetrisGrid): {
  newGrid: TetrisGrid;
  linesCleared: number;
  clearedRowIndices: number[];
} {
  const clearedRowIndices: number[] = [];
  const remainingRows: (string | null)[][] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const isFull = grid[r].every((cell) => cell !== null);
    if (isFull) {
      clearedRowIndices.push(r);
    } else {
      remainingRows.push([...grid[r]]);
    }
  }

  const linesCleared = clearedRowIndices.length;

  if (linesCleared === 0) {
    return { newGrid: grid, linesCleared: 0, clearedRowIndices: [] };
  }

  const newEmptyRows = Array.from({ length: linesCleared }, () =>
    Array.from({ length: GRID_COLS }, () => null)
  );

  const newGrid: TetrisGrid = [...newEmptyRows, ...remainingRows];

  return {
    newGrid,
    linesCleared,
    clearedRowIndices,
  };
}

/**
 * Calculates score earned for clearing lines and matching target.
 */
export function calculateScore(
  linesCleared: number,
  level: number,
  targetMatched: boolean
): number {
  let score = 0;
  switch (linesCleared) {
    case 1:
      score += 100 * level;
      break;
    case 2:
      score += 300 * level;
      break;
    case 3:
      score += 500 * level;
      break;
    case 4:
      score += 800 * level;
      break;
    default:
      if (linesCleared > 4) {
        score += 1000 * level;
      }
  }

  if (targetMatched) {
    score += 500 * level;
  }

  return score;
}
