/**
 * Strictly-typed definitions for Hybrid Tetris-Rubik's Game
 */

export type TetrisColor = string; // Hex color string (e.g. '#EF4444')

export type GridCell = TetrisColor | null;

export type TetrisGrid = GridCell[][]; // 20 rows x 10 cols

export const GRID_ROWS = 20;
export const GRID_COLS = 10;

export type CubeShapeType = '3x3' | '2x2' | 'L_SHAPE' | '2x2x1' | '1x1x2';

export interface CubeShapeMeta {
  type: CubeShapeType;
  name: string;
  width: number;
  height: number;
  depth: number;
}

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface TetrominoDefinition {
  type: TetrominoType;
  name: string;
  color: string;
  // 3x3 (or NxM) boolean matrix representing the required pattern
  matrix: boolean[][];
}

export type RubikFace =
  | 'U'
  | 'D'
  | 'L'
  | 'R'
  | 'F'
  | 'B'
  | 'M'
  | 'E'
  | 'S'
  | 'Uw'
  | 'Dw'
  | 'Lw'
  | 'Rw'
  | 'Fw'
  | 'Bw';

export type RotationAxis = 'x' | 'y' | 'z';

export interface LayerTwist {
  face: RubikFace;
  direction: 1 | -1; // 1 = clockwise (looking at face), -1 = counter-clockwise (prime)
  axis: RotationAxis;
  sliceIndex: number; // coordinate threshold/value for slice
}

export interface GlobalRotation {
  axis: RotationAxis;
  direction: 1 | -1;
  targetX: number;
  timestamp: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CubieFaceInfo {
  faceIndex: number; // 0: +X, 1: -X, 2: +Y, 3: -Y, 4: +Z, 5: -Z
  initialColor: string;
  currentNormal: [number, number, number];
}

export interface CubieData {
  id: number;
  initialPos: [number, number, number];
  currentPos: [number, number, number];
  rotation: [number, number, number, number]; // Quaternion [x, y, z, w]
  faceColors: [string, string, string, string, string, string]; // [+X, -X, +Y, -Y, +Z, -Z]
}

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  life: number; // 0 to 1
  size: number;
}
