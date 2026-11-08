import { create } from 'zustand';
import {
  GRID_COLS,
  GRID_ROWS,
} from '../types/game';
import type {
  CubieData,
  GameStatus,
  LayerTwist,
  GlobalRotation,
  Particle,
  RotationAxis,
  TetrisGrid,
  TetrominoDefinition,
  CubeShapeType,
  RubikFace,
} from '../types/game';
import { sound } from '../utils/audio';
import {
  ALL_SHAPE_TYPES,
  applyGlobalRotation,
  applyTwistToCubies,
  extractBottomFaceColors,
  generateScrambledShape,
  getShapeBounds,
  getTwistRotation,
  SHAPES_META,
} from '../utils/rubik';
import {
  calculateLandingY,
  calculateScore,
  checkTargetMatch,
  clearFullLines,
  createEmptyGrid,
  getDetachingBlocks,
  getRandomTargetForShape,
} from '../utils/tetris';
import type { MatchResult } from '../utils/tetris';
import { fireLineClearConfetti, resetConfetti } from '../utils/confettiHelper';

interface SliceGlowData {
  axis: RotationAxis;
  sliceCoord: number;
  timestamp: number;
  isWide?: boolean;
}

let lineClearTimer: ReturnType<typeof setTimeout> | null = null;

export interface GameState {
  // Flat 2D Board State
  grid: TetrisGrid;
  score: number;
  highScore: number;
  level: number;
  linesCleared: number;
  gameStatus: GameStatus;

  // Active Falling 3D Polycube State
  currentShape: CubeShapeType;
  nextShape: CubeShapeType;
  cubePosition: { x: number; y: number }; // x: 0..(GRID_COLS - width), y: 0..20
  cubies: CubieData[];
  bottomFaceColors: string[][]; // Colors currently facing the 2D board
  frontFaceColors: string[][]; // Front face colors facing player that detach and lock
  targetTetromino: TetrominoDefinition;
  nextTargetTetromino: TetrominoDefinition;
  matchResult: MatchResult;

  // Animation & Visual Effects
  activeTwist: LayerTwist | null;
  isTwisting: boolean;
  activeGlobalRotation: GlobalRotation | null;
  isRotatingGlobal: boolean;
  isHardDropping: boolean;
  hardDropTargetY: number | null;
  screenShake: number;
  sliceGlow: SliceGlowData | null;
  particles: Particle[];
  lastClearedRows: number[];
  isDetaching: boolean;
  isWideMode: boolean;
  isBotMode: boolean;
  pieceSequence: number;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;

  // Game Loop Controls
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  toggleBotMode: () => void;
  setBotMode: (enabled: boolean) => void;

  // Movement & Drops
  moveLeft: () => void;
  moveRight: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  finishHardDrop: () => void;
  tick: (deltaTime: number) => void;

  // Cube Twists & Whole Cube Rotations
  executeTwist: (face: RubikFace, direction?: 1 | -1) => void;
  finishTwist: () => void;
  rotateGlobal: (axis: RotationAxis, direction?: 1 | -1) => void;
  finishGlobalRotation: () => void;
  toggleWideMode: () => void;

  // Board Mechanics
  lockAndDetach: () => void;
  clearParticles: () => void;
  triggerScreenShake: (amount?: number) => void;
  spawnImpactParticles: (color?: string) => void;
}

function getRandomShape(): CubeShapeType {
  return ALL_SHAPE_TYPES[Math.floor(Math.random() * ALL_SHAPE_TYPES.length)];
}

const INITIAL_HIGH_SCORE = typeof window !== 'undefined'
  ? parseInt(localStorage.getItem('rubik_tetris_highscore') || '0', 10)
  : 0;

const INITIAL_TUTORIAL_SEEN = typeof window !== 'undefined'
  ? localStorage.getItem('rubik_tetris_tutorial_seen') === 'true'
  : false;

export const useGameStore = create<GameState>((set, get) => {
  const initialShape = '3x3';
  const initialNextShape = getRandomShape();
  const initialTarget = getRandomTargetForShape(initialShape);
  const initialNextTarget = getRandomTargetForShape(initialNextShape);
  const { cubies: scrambledCubies } = generateScrambledShape(initialShape, 3);
  const initialBottomColors = extractBottomFaceColors(scrambledCubies);
  const initialMatch = checkTargetMatch(initialBottomColors, initialTarget);

  return {
    grid: createEmptyGrid(),
    score: 0,
    highScore: INITIAL_HIGH_SCORE,
    level: 1,
    linesCleared: 0,
    gameStatus: 'IDLE',

    currentShape: initialShape,
    nextShape: initialNextShape,
    cubePosition: { x: 3, y: 0 },
    cubies: scrambledCubies,
    bottomFaceColors: initialBottomColors,
    frontFaceColors: initialBottomColors,
    targetTetromino: initialTarget,
    nextTargetTetromino: initialNextTarget,
    matchResult: initialMatch,

    activeTwist: null,
    isTwisting: false,
    activeGlobalRotation: null,
    isRotatingGlobal: false,
    isHardDropping: false,
    hardDropTargetY: null,
    screenShake: 0,
    sliceGlow: null,
    particles: [],
    lastClearedRows: [],
    isDetaching: false,
    isWideMode: false,
    isBotMode: false,
    pieceSequence: 1,
    isTutorialOpen: !INITIAL_TUTORIAL_SEEN,

    openTutorial: () => {
      const wasPlaying = get().gameStatus === 'PLAYING';
      if (wasPlaying) {
        set({ gameStatus: 'PAUSED', isTutorialOpen: true });
      } else {
        set({ isTutorialOpen: true });
      }
    },

    closeTutorial: () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rubik_tetris_tutorial_seen', 'true');
      }
      set({ isTutorialOpen: false });
    },

    toggleBotMode: () => {
      const nextState = !get().isBotMode;
      set({ isBotMode: nextState });
      if (nextState && (get().gameStatus === 'IDLE' || get().gameStatus === 'GAME_OVER')) {
        get().startGame();
      } else if (nextState && get().gameStatus === 'PAUSED') {
        get().resumeGame();
      }
    },

    setBotMode: (enabled: boolean) => {
      set({ isBotMode: enabled });
      if (enabled && (get().gameStatus === 'IDLE' || get().gameStatus === 'GAME_OVER')) {
        get().startGame();
      }
    },

    startGame: () => {
      resetConfetti();
      if (lineClearTimer) {
        clearTimeout(lineClearTimer);
        lineClearTimer = null;
      }

      const shape = getRandomShape();
      const nShape = getRandomShape();
      const target = getRandomTargetForShape(shape);
      const nextTarget = getRandomTargetForShape(nShape);
      const { cubies } = generateScrambledShape(shape, 3);
      const bottomColors = extractBottomFaceColors(cubies);
      const match = checkTargetMatch(bottomColors, target);

      const bounds = getShapeBounds(cubies);
      const startX = Math.max(0, Math.min(GRID_COLS - bounds.width, Math.floor((GRID_COLS - bounds.width) / 2)));

      set({
        grid: createEmptyGrid(),
        score: 0,
        level: 1,
        linesCleared: 0,
        pieceSequence: (get().pieceSequence || 0) + 1,
        gameStatus: 'PLAYING',
        currentShape: shape,
        nextShape: nShape,
        cubePosition: { x: startX, y: 0 },
        cubies,
        bottomFaceColors: bottomColors,
        frontFaceColors: bottomColors,
        targetTetromino: target,
        nextTargetTetromino: nextTarget,
        matchResult: match,
        particles: [],
        lastClearedRows: [],
        isDetaching: false,
        isRotatingGlobal: false,
        activeGlobalRotation: null,
        isHardDropping: false,
        hardDropTargetY: null,
        screenShake: 0,
      });
    },

    pauseGame: () => {
      if (get().gameStatus === 'PLAYING') {
        set({ gameStatus: 'PAUSED' });
      }
    },

    resumeGame: () => {
      if (get().gameStatus === 'PAUSED') {
        set({ gameStatus: 'PLAYING' });
      }
    },

    restartGame: () => {
      get().startGame();
    },

    moveLeft: () => {
      const { cubePosition, gameStatus, isDetaching, isHardDropping, isTwisting, isRotatingGlobal } = get();
      if (gameStatus !== 'PLAYING' || isDetaching || isHardDropping || isTwisting || isRotatingGlobal) return;
      if (cubePosition.x > 0) {
        sound.playMove();
        set({ cubePosition: { ...cubePosition, x: cubePosition.x - 1 } });
      }
    },

    moveRight: () => {
      const {
        cubePosition,
        gameStatus,
        isDetaching,
        isHardDropping,
        isTwisting,
        isRotatingGlobal,
        cubies,
        bottomFaceColors,
        matchResult,
        targetTetromino,
      } = get();
      if (gameStatus !== 'PLAYING' || isDetaching || isHardDropping || isTwisting || isRotatingGlobal) return;
      const bounds = getShapeBounds(cubies);
      const blocks = getDetachingBlocks(bottomFaceColors, matchResult, targetTetromino);
      const maxBlockCol = blocks.length > 0 ? Math.max(...blocks.map((b) => b.col)) : bounds.width - 1;
      const pieceWidth = Math.max(bounds.width, maxBlockCol + 1);
      if (cubePosition.x < GRID_COLS - pieceWidth) {
        sound.playMove();
        set({ cubePosition: { ...cubePosition, x: cubePosition.x + 1 } });
      }
    },

    softDrop: () => {
      const {
        cubePosition,
        gameStatus,
        grid,
        bottomFaceColors,
        matchResult,
        targetTetromino,
        isDetaching,
        isHardDropping,
        isTwisting,
        isRotatingGlobal,
      } = get();
      if (gameStatus !== 'PLAYING' || isDetaching || isHardDropping || isTwisting || isRotatingGlobal) return;

      const blocks = getDetachingBlocks(bottomFaceColors, matchResult, targetTetromino);
      const landingY = calculateLandingY(grid, cubePosition.x, cubePosition.y, blocks);

      if (cubePosition.y < landingY) {
        sound.playMove();
        set((state) => ({
          cubePosition: { ...state.cubePosition, y: Math.min(landingY, state.cubePosition.y + 1) },
          score: state.score + 1,
        }));
      } else {
        get().lockAndDetach();
      }
    },

    hardDrop: () => {
      const {
        cubePosition,
        gameStatus,
        grid,
        bottomFaceColors,
        matchResult,
        targetTetromino,
        isDetaching,
        isHardDropping,
        isTwisting,
        isRotatingGlobal,
      } = get();
      if (gameStatus !== 'PLAYING' || isDetaching || isHardDropping || isTwisting || isRotatingGlobal) return;

      const blocks = getDetachingBlocks(bottomFaceColors, matchResult, targetTetromino);
      const landingY = calculateLandingY(grid, cubePosition.x, cubePosition.y, blocks);
      const dropDistance = Math.max(0, Math.floor(landingY - cubePosition.y));

      // Trigger high-speed physical drop transition
      set((state) => ({
        isHardDropping: true,
        hardDropTargetY: landingY,
        score: state.score + dropDistance * 2,
      }));
    },

    finishHardDrop: () => {
      const { hardDropTargetY, cubePosition } = get();
      const finalY = hardDropTargetY !== null ? hardDropTargetY : cubePosition.y;
      set({
        cubePosition: { ...cubePosition, y: finalY },
        isHardDropping: false,
        hardDropTargetY: null,
      });
      get().lockAndDetach();
    },

    triggerScreenShake: (amount = 2) => {
      set({ screenShake: amount });
      setTimeout(() => {
        set({ screenShake: 0 });
      }, 130);
    },

    spawnImpactParticles: (color = '#FACC15') => {
      const { currentShape } = get();
      const meta = SHAPES_META[currentShape] || { width: 3, height: 3, depth: 3 };
      const newParticles: Particle[] = [];
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI / 8) * i;
        const speed = 2.0 + Math.random() * 2.5;
        newParticles.push({
          id: Math.random() + i,
          x: (Math.random() - 0.5) * (meta.width * 0.9),
          y: -meta.height / 2 + 0.1,
          z: (Math.random() - 0.5) * (meta.depth * 0.9),
          vx: Math.cos(angle) * speed,
          vy: Math.abs(Math.sin(angle)) * speed * 0.6 + 0.8,
          vz: (Math.random() - 0.5) * 3,
          color,
          life: 1.0,
          size: Math.random() * 0.14 + 0.08,
        });
      }
      set((state) => ({ particles: [...state.particles, ...newParticles] }));
    },

    tick: (deltaTime: number) => {
      const {
        gameStatus,
        level,
        cubePosition,
        grid,
        bottomFaceColors,
        matchResult,
        targetTetromino,
        isDetaching,
        isHardDropping,
        isTwisting,
        isRotatingGlobal,
      } = get();
      if (
        gameStatus !== 'PLAYING' ||
        isDetaching ||
        isHardDropping ||
        isTwisting ||
        isRotatingGlobal
      ) {
        return;
      }

      const dropSpeed = 0.8 + level * 0.25; // rows per second
      const nextY = cubePosition.y + dropSpeed * (deltaTime / 1000);

      const blocks = getDetachingBlocks(bottomFaceColors, matchResult, targetTetromino);
      const landingY = calculateLandingY(grid, cubePosition.x, cubePosition.y, blocks);

      if (nextY >= landingY) {
        set({ cubePosition: { ...cubePosition, y: landingY } });
        get().lockAndDetach();
      } else {
        set({ cubePosition: { ...cubePosition, y: nextY } });
      }
    },

    executeTwist: (face, direction = 1) => {
      const { isTwisting, isRotatingGlobal, gameStatus, currentShape, cubies, cubePosition } = get();
      if (isTwisting || isRotatingGlobal || gameStatus !== 'PLAYING') return;

      sound.playTwist();

      const { sliceAxis } = getTwistRotation(face, direction, currentShape);
      const isWide = face.endsWith('w');
      const isSlice = face === 'M' || face === 'E' || face === 'S';

      let sliceCoord = 0;
      if (isWide) {
        if (face === 'Uw' || face === 'Rw' || face === 'Fw') sliceCoord = 0.5;
        else if (face === 'Dw' || face === 'Lw' || face === 'Bw') sliceCoord = -0.5;
      } else if (!isSlice) {
        if (face === 'U' || face === 'R' || face === 'F') sliceCoord = 1.0;
        else if (face === 'D' || face === 'L' || face === 'B') sliceCoord = -1.0;
      }

      const twist: LayerTwist = {
        face,
        direction,
        axis: sliceAxis,
        sliceIndex: sliceCoord,
      };

      // Retro pixel particle burst along slice
      const newParticles: Particle[] = [];
      const particleColors = ['#00FFFF', '#FF0055', '#FFEA00', '#00FF66', '#FFFFFF'];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: Math.random() + i,
          x: (Math.random() - 0.5) * 2.5,
          y: (Math.random() - 0.5) * 2.5,
          z: (Math.random() - 0.5) * 2.5,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 + 1.2,
          vz: (Math.random() - 0.5) * 4,
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          life: 1.0,
          size: Math.random() * 0.15 + 0.08,
        });
      }

      const predictedCubies = applyTwistToCubies(cubies, twist, currentShape);
      const bounds = getShapeBounds(predictedCubies);
      let safeX = cubePosition.x;
      if (safeX + bounds.width > GRID_COLS) {
        safeX = Math.max(0, GRID_COLS - bounds.width);
      } else if (safeX < 0) {
        safeX = 0;
      }

      set({
        isTwisting: true,
        cubePosition: { ...cubePosition, x: safeX },
        activeTwist: twist,
        sliceGlow: {
          axis: twist.axis,
          sliceCoord,
          timestamp: Date.now(),
          isWide,
        },
        particles: newParticles,
      });
    },

    finishTwist: () => {
      const { activeTwist, cubies, targetTetromino, currentShape, cubePosition } = get();
      if (!activeTwist) return;

      const updatedCubies = applyTwistToCubies(cubies, activeTwist, currentShape);
      const bounds = getShapeBounds(updatedCubies);
      let safeX = cubePosition.x;
      if (safeX + bounds.width > GRID_COLS) {
        safeX = Math.max(0, GRID_COLS - bounds.width);
      } else if (safeX < 0) {
        safeX = 0;
      }

      const newBottomColors = extractBottomFaceColors(updatedCubies);
      const match = checkTargetMatch(newBottomColors, targetTetromino);

      if (match.isMatch && !get().matchResult.isMatch) {
        sound.playMatch();
      }

      set({
        cubies: updatedCubies,
        cubePosition: { ...cubePosition, x: safeX },
        bottomFaceColors: newBottomColors,
        frontFaceColors: newBottomColors,
        matchResult: match,
        isTwisting: false,
        activeTwist: null,
      });
    },

    rotateGlobal: (axis: RotationAxis, direction = 1) => {
      const { cubies, isTwisting, isRotatingGlobal, gameStatus, cubePosition } = get();
      if (isTwisting || isRotatingGlobal || gameStatus !== 'PLAYING') return;

      sound.playMove();

      // Wall kick: calculate safe boundary position for the rotated piece
      const predictedCubies = applyGlobalRotation(cubies, axis, direction);
      const bounds = getShapeBounds(predictedCubies);

      let targetX = cubePosition.x;
      if (targetX + bounds.width > GRID_COLS) {
        targetX = Math.max(0, GRID_COLS - bounds.width);
      } else if (targetX < 0) {
        targetX = 0;
      }

      set({
        isRotatingGlobal: true,
        cubePosition: { ...cubePosition, x: targetX },
        activeGlobalRotation: {
          axis,
          direction,
          targetX,
          timestamp: Date.now(),
        },
      });
    },

    finishGlobalRotation: () => {
      const { activeGlobalRotation, cubies, targetTetromino, cubePosition } = get();
      if (!activeGlobalRotation) return;

      const { axis, direction, targetX } = activeGlobalRotation;
      const updatedCubies = applyGlobalRotation(cubies, axis, direction);
      const newBottomColors = extractBottomFaceColors(updatedCubies);
      const match = checkTargetMatch(newBottomColors, targetTetromino);

      if (match.isMatch && !get().matchResult.isMatch) {
        sound.playMatch();
      }

      set({
        cubies: updatedCubies,
        cubePosition: { ...cubePosition, x: targetX },
        bottomFaceColors: newBottomColors,
        frontFaceColors: newBottomColors,
        matchResult: match,
        isRotatingGlobal: false,
        activeGlobalRotation: null,
      });
    },

    toggleWideMode: () => {
      set((state) => ({ isWideMode: !state.isWideMode }));
    },

    lockAndDetach: () => {
      const {
        grid,
        cubePosition,
        bottomFaceColors,
        matchResult,
        targetTetromino,
        score,
        highScore,
        level,
        linesCleared,
        nextShape,
        nextTargetTetromino,
        pieceSequence,
      } = get();

      sound.playDrop();

      const blocks = getDetachingBlocks(bottomFaceColors, matchResult, targetTetromino);
      const maxCol = blocks.length > 0 ? Math.max(...blocks.map((b) => b.col)) : 0;
      const minCol = blocks.length > 0 ? Math.min(...blocks.map((b) => b.col)) : 0;
      const safeCubeX = Math.max(-minCol, Math.min(GRID_COLS - 1 - maxCol, cubePosition.x));

      const landingY = Math.round(calculateLandingY(grid, safeCubeX, cubePosition.y, blocks));

      const newGrid: TetrisGrid = grid.map((row) => [...row]);
      for (const b of blocks) {
        const targetRow = landingY + b.row;
        const targetCol = safeCubeX + b.col;
        if (
          targetRow >= 0 &&
          targetRow < GRID_ROWS &&
          targetCol >= 0 &&
          targetCol < GRID_COLS
        ) {
          newGrid[targetRow][targetCol] = b.color;
        }
      }

      const clearResult = clearFullLines(newGrid);
      const addedScore = calculateScore(clearResult.linesCleared, level, matchResult.isMatch);
      const newScore = score + addedScore;
      const newLinesCleared = linesCleared + clearResult.linesCleared;
      const newLevel = Math.floor(newLinesCleared / 10) + 1;
      const newHighScore = Math.max(highScore, newScore);

      if (typeof window !== 'undefined') {
        localStorage.setItem('rubik_tetris_highscore', String(newHighScore));
      }

      if (clearResult.linesCleared > 0) {
        sound.playLineClear();
        fireLineClearConfetti(clearResult.linesCleared);
      }

      // Spawn next piece
      const spawnedShape = nextShape;
      const upcomingShape = getRandomShape();
      const spawnedTarget = nextTargetTetromino;
      const upcomingTarget = getRandomTargetForShape(upcomingShape);

      const { cubies: nextScrambledCubies } = generateScrambledShape(spawnedShape, 3);
      const nextBottomColors = extractBottomFaceColors(nextScrambledCubies);
      const nextMatch = checkTargetMatch(nextBottomColors, spawnedTarget);

      const nextBounds = getShapeBounds(nextScrambledCubies);
      const startX = Math.max(0, Math.min(GRID_COLS - nextBounds.width, Math.floor((GRID_COLS - nextBounds.width) / 2)));

      const spawnBlocks = getDetachingBlocks(nextBottomColors, nextMatch, spawnedTarget);
      const spawnLandingY = calculateLandingY(clearResult.newGrid, startX, 0, spawnBlocks);
      const isGameOver = spawnLandingY <= 0;

      if (isGameOver) {
        sound.playGameOver();
        resetConfetti();
      }

      // If full lines were cleared, display white effect and disappear after 1.5 seconds
      if (clearResult.clearedRowIndices.length > 0) {
        if (lineClearTimer) {
          clearTimeout(lineClearTimer);
        }
        lineClearTimer = setTimeout(() => {
          set({ lastClearedRows: [] });
          lineClearTimer = null;
        }, 400);
      }

      set({
        grid: clearResult.newGrid,
        score: newScore,
        highScore: newHighScore,
        level: newLevel,
        linesCleared: newLinesCleared,
        pieceSequence: pieceSequence + 1,
        gameStatus: isGameOver ? 'GAME_OVER' : 'PLAYING',
        currentShape: spawnedShape,
        nextShape: upcomingShape,
        cubePosition: { x: startX, y: 0 },
        cubies: nextScrambledCubies,
        bottomFaceColors: nextBottomColors,
        frontFaceColors: nextBottomColors,
        targetTetromino: spawnedTarget,
        nextTargetTetromino: upcomingTarget,
        matchResult: nextMatch,
        lastClearedRows: clearResult.clearedRowIndices.length > 0
          ? clearResult.clearedRowIndices
          : get().lastClearedRows,
        isDetaching: false,
        isRotatingGlobal: false,
        activeGlobalRotation: null,
        isHardDropping: false,
        hardDropTargetY: null,
      });
    },

    clearParticles: () => {
      set({ particles: [] });
    },
  };
});
