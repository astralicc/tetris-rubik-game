import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { computeBotPlan } from '../utils/botAI';
import type { BotPlan } from '../utils/botAI';
import { getShapeBounds } from '../utils/rubik';
import { getDetachingBlocks } from '../utils/tetris';
import { GRID_COLS } from '../types/game';

/**
 * Autonomous speedcuber and Tetris AI bot player.
 * Driven via requestAnimationFrame querying fresh Zustand state directly,
 * completely immune to React render cycle cancellations or interval teardown.
 */
export function useBotPlayer() {
  const isBotMode = useGameStore((state) => state.isBotMode);

  useEffect(() => {
    if (!isBotMode) return;

    let animFrameId: number;
    let currentPlan: BotPlan | null = null;
    let lastPieceSeq = -1;
    let lastActionTime = 0;
    let restartTimer = 0;

    const botLoop = () => {
      const state = useGameStore.getState();

      if (!state.isBotMode) return;

      const now = performance.now();

      // 1. Auto-Start / Auto-Restart when Game Over or Idle
      if (state.gameStatus === 'GAME_OVER' || state.gameStatus === 'IDLE') {
        if (!restartTimer) {
          restartTimer = now;
        } else if (now - restartTimer > 1200) {
          restartTimer = 0;
          currentPlan = null;
          lastPieceSeq = -1;
          state.startGame();
        }
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      restartTimer = 0;

      // 2. Unpause if paused while bot is enabled
      if (state.gameStatus === 'PAUSED') {
        state.resumeGame();
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      if (state.gameStatus !== 'PLAYING') {
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      // 3. Do not act while animations or physics drops are transitioning
      if (
        state.isTwisting ||
        state.isRotatingGlobal ||
        state.isHardDropping ||
        state.isDetaching
      ) {
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      // 4. Generate plan whenever a new piece spawns (detected via pieceSequence)
      if (lastPieceSeq !== state.pieceSequence) {
        lastPieceSeq = state.pieceSequence;
        currentPlan = computeBotPlan(
          state.grid,
          state.cubies,
          state.currentShape,
          state.targetTetromino
        );
        lastActionTime = now + 40; // slight thinking pause
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      if (!currentPlan) {
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      // 5. Phase 1: Execute required Rubik twists & rotations
      if (currentPlan.moves.length > 0) {
        if (now - lastActionTime < 160) {
          animFrameId = requestAnimationFrame(botLoop);
          return;
        }

        const nextMove = currentPlan.moves.shift()!;
        lastActionTime = now;

        if (nextMove.type === 'ROTATE' && nextMove.axis) {
          state.rotateGlobal(nextMove.axis, nextMove.direction);
        } else if (nextMove.type === 'TWIST' && nextMove.face) {
          state.executeTwist(nextMove.face, nextMove.direction);
        }

        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      // 6. Phase 2: Lateral Positioning (X column alignment)
      const bounds = getShapeBounds(state.cubies);
      const blocks = getDetachingBlocks(state.bottomFaceColors, state.matchResult, state.targetTetromino);
      const maxBlockCol = blocks.length > 0 ? Math.max(...blocks.map((b) => b.col)) : bounds.width - 1;
      const pieceWidth = Math.max(bounds.width, maxBlockCol + 1);
      const safeTargetX = Math.max(0, Math.min(GRID_COLS - pieceWidth, currentPlan.targetX));

      if (state.cubePosition.x < safeTargetX) {
        if (now - lastActionTime < 65) {
          animFrameId = requestAnimationFrame(botLoop);
          return;
        }
        state.moveRight();
        lastActionTime = now;
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      if (state.cubePosition.x > safeTargetX) {
        if (now - lastActionTime < 65) {
          animFrameId = requestAnimationFrame(botLoop);
          return;
        }
        state.moveLeft();
        lastActionTime = now;
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      // 7. Phase 3: Slam Hard Drop once perfectly aligned
      if (now - lastActionTime < 85) {
        animFrameId = requestAnimationFrame(botLoop);
        return;
      }

      state.hardDrop();
      lastActionTime = now;
      currentPlan = null;

      animFrameId = requestAnimationFrame(botLoop);
    };

    animFrameId = requestAnimationFrame(botLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isBotMode]);
}
