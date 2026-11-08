import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { RubikFace } from '../types/game';

// Base face keys (single outer faces)
const BASE_FACE_KEYS: Record<string, 'U' | 'D' | 'L' | 'R' | 'F' | 'B'> = {
  u: 'U',
  d: 'D',
  l: 'L',
  r: 'R',
  f: 'F',
  b: 'B',
};

// Slice move keys (WCA standard: M = middle, E = equator, S = standing)
const SLICE_KEYS: Record<string, 'M' | 'E' | 'S'> = {
  m: 'M',
  e: 'E',
  s: 'S',
};

export function useGameInput() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const softDrop = useGameStore((state) => state.softDrop);
  const hardDrop = useGameStore((state) => state.hardDrop);
  const executeTwist = useGameStore((state) => state.executeTwist);
  const rotateGlobal = useGameStore((state) => state.rotateGlobal);
  const isWideMode = useGameStore((state) => state.isWideMode);
  const toggleWideMode = useGameStore((state) => state.toggleWideMode);
  const toggleBotMode = useGameStore((state) => state.toggleBotMode);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const startGame = useGameStore((state) => state.startGame);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Tutorial: 'h', 'H', or '?'
      if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        e.preventDefault();
        const { isTutorialOpen, openTutorial, closeTutorial } = useGameStore.getState();
        if (isTutorialOpen) closeTutorial();
        else openTutorial();
        return;
      }

      // Toggle Bot Play Mode: Tab, Backtick, or '0'
      if (e.key === 'Tab' || e.key === '`' || e.key === '0') {
        e.preventDefault();
        toggleBotMode();
        return;
      }

      // Prevent browser scrolling on gaming keys
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      // Pause toggle: Escape or P
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        const { isTutorialOpen, closeTutorial } = useGameStore.getState();
        if (isTutorialOpen) {
          closeTutorial();
          return;
        }
        if (gameStatus === 'PLAYING') pauseGame();
        else if (gameStatus === 'PAUSED') resumeGame();
        return;
      }

      // Enter to start / restart when idle or game over
      if (e.key === 'Enter') {
        if (gameStatus === 'IDLE' || gameStatus === 'GAME_OVER') {
          startGame();
          return;
        }
      }

      if (gameStatus !== 'PLAYING') return;

      const rawKey = e.key;
      const key = rawKey.toLowerCase();
      const hasShift = e.shiftKey;

      // Toggle Wide Mode shortcut: 'w' (without Alt)
      if (key === 'w' && !e.altKey && !e.ctrlKey) {
        toggleWideMode();
        return;
      }

      // 1. Single Face & Wide Moves (U, D, L, R, F, B / Uw, Dw, Lw, Rw, Fw, Bw)
      // Shift + letter gives Prime (') counter-clockwise twist
      if (BASE_FACE_KEYS[key]) {
        const base = BASE_FACE_KEYS[key];
        const isWide = e.altKey || isWideMode;
        const face: RubikFace = isWide ? (`${base}w` as RubikFace) : base;
        const direction: 1 | -1 = hasShift ? -1 : 1;
        if (e.altKey) e.preventDefault();
        executeTwist(face, direction);
        return;
      }

      // 2. Slice Moves (M, E, S)
      if (SLICE_KEYS[key]) {
        const face = SLICE_KEYS[key];
        const direction: 1 | -1 = hasShift ? -1 : 1;
        executeTwist(face, direction);
        return;
      }

      // 3. Whole Cube Rotations: x, y, z
      // In cube notation:
      // x = pitch (around X axis)
      // y = yaw (around Y axis)
      // z = roll (around Z axis)
      if (key === 'x') {
        rotateGlobal('x', hasShift ? -1 : 1);
        return;
      }
      if (key === 'y') {
        rotateGlobal('y', hasShift ? -1 : 1);
        return;
      }
      if (key === 'z') {
        rotateGlobal('z', hasShift ? -1 : 1);
        return;
      }

      // 4. Tetris Movement & Drops: Arrow Keys & Space
      if (e.key === 'ArrowLeft' || key === 'a') {
        moveLeft();
        return;
      }
      if (e.key === 'ArrowRight') {
        moveRight();
        return;
      }
      if (e.key === 'ArrowDown') {
        softDrop();
        return;
      }
      if (e.code === 'Space') {
        hardDrop();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameStatus,
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    executeTwist,
    rotateGlobal,
    isWideMode,
    toggleWideMode,
    toggleBotMode,
    pauseGame,
    resumeGame,
    startGame,
  ]);
}
