import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { GRID_COLS, GRID_ROWS } from '../types/game';
import { calculateLandingY, getDetachingBlocks } from '../utils/tetris';

// Helper to convert hex to rgba for reliable transparent styling across all browsers
function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function FlatGrid() {
  const grid = useGameStore((state) => state.grid);
  const cubePosition = useGameStore((state) => state.cubePosition);
  const frontFaceColors = useGameStore((state) => state.frontFaceColors);
  const matchResult = useGameStore((state) => state.matchResult);
  const lastClearedRows = useGameStore((state) => state.lastClearedRows);
  const gameStatus = useGameStore((state) => state.gameStatus);

  // Compute ghost landing projection from active front face
  const detachingBlocks = useMemo(() => {
    return getDetachingBlocks(frontFaceColors, matchResult);
  }, [frontFaceColors, matchResult]);

  const safeCubeX = useMemo(() => {
    if (detachingBlocks.length === 0) return cubePosition.x;
    const maxCol = Math.max(...detachingBlocks.map((b) => b.col));
    const minCol = Math.min(...detachingBlocks.map((b) => b.col));
    return Math.max(-minCol, Math.min(GRID_COLS - 1 - maxCol, cubePosition.x));
  }, [detachingBlocks, cubePosition.x]);

  const landingY = useMemo(() => {
    return calculateLandingY(grid, safeCubeX, cubePosition.y, detachingBlocks);
  }, [grid, safeCubeX, cubePosition.y, detachingBlocks]);

  return (
    <div className="relative w-full h-full bg-[#090c14] overflow-hidden select-none">
      {/* 2D Grid Cells Background & Stacked Blocks */}
      <div
        className="grid w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cellColor, c) => {
            const isClearing = lastClearedRows.includes(r);

            // Check if this cell is part of the ghost landing projection
            let isGhost = false;
            let ghostColor = '#ffffff';

            if (gameStatus === 'PLAYING') {
              for (const b of detachingBlocks) {
                if (landingY + b.row === r && safeCubeX + b.col === c) {
                  isGhost = true;
                  ghostColor = b.color;
                  break;
                }
              }
            }

            return (
              <div
                key={`${r}-${c}`}
                className={`relative border border-slate-800/40 flex items-center justify-center transition-all duration-300 ${
                  isClearing ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse z-10' : ''
                }`}
              >
                {/* Locked 2D Stacked Block */}
                {cellColor && !isClearing && (
                  <div
                    className="w-full h-full rounded-[1px] relative shadow-inner"
                    style={{
                      backgroundColor: cellColor,
                      boxShadow: 'inset 2px 2px 0px rgba(255,255,255,0.4), inset -2px -2px 0px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* Inner retro highlight */}
                    <div className="absolute inset-1 border border-white/20 pointer-events-none" />
                  </div>
                )}

                {/* Ghost / Landing Preview - exactly matches current cube shape's color */}
                {!cellColor && isGhost && (
                  <div
                    className={`w-full h-full rounded-[1px] border-2 transition-all ${
                      matchResult.isMatch ? 'animate-pulse' : ''
                    }`}
                    style={{
                      borderColor: ghostColor,
                      backgroundColor: hexToRgba(ghostColor, matchResult.isMatch ? 0.32 : 0.18),
                      boxShadow: matchResult.isMatch
                        ? `0 0 10px ${hexToRgba(ghostColor, 0.85)}, inset 0 0 4px ${hexToRgba(ghostColor, 0.4)}`
                        : `0 0 5px ${hexToRgba(ghostColor, 0.4)}`,
                    }}
                  >
                    {/* Retro inner matrix texture in the cube's exact color */}
                    <div
                      className="w-full h-full opacity-35 pointer-events-none"
                      style={{
                        backgroundImage: `radial-gradient(circle, ${ghostColor} 1px, transparent 1px)`,
                        backgroundSize: '4px 4px',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
