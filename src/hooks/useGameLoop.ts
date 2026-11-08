import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameLoop() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const tick = useGameStore((state) => state.tick);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (gameStatus !== 'PLAYING') {
      lastTimeRef.current = null;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (lastTimeRef.current !== null) {
        const delta = Math.min(100, timestamp - lastTimeRef.current); // Cap at 100ms to avoid huge jumps
        tick(delta);
      }
      lastTimeRef.current = timestamp;
      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [gameStatus, tick]);
}

