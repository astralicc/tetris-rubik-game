import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { SHAPES_META } from '../utils/rubik';

export function HudPanel() {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const level = useGameStore((state) => state.level);
  const linesCleared = useGameStore((state) => state.linesCleared);
  const currentShape = useGameStore((state) => state.currentShape);
  const nextShape = useGameStore((state) => state.nextShape);
  const targetTetromino = useGameStore((state) => state.targetTetromino);
  const frontFaceColors = useGameStore((state) => state.frontFaceColors);
  const matchResult = useGameStore((state) => state.matchResult);

  // Center target shape in a clean 3x3 box
  const targetPreview3x3 = useMemo(() => {
    const grid = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];
    const m = targetTetromino.matrix;
    const h = m.length;
    const w = m[0]?.length || 0;
    const startR = Math.max(0, Math.floor((3 - h) / 2));
    const startC = Math.max(0, Math.floor((3 - w) / 2));

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (m[r][c] && startR + r < 3 && startC + c < 3) {
          grid[startR + r][startC + c] = true;
        }
      }
    }
    return grid;
  }, [targetTetromino]);

  const frontCols = frontFaceColors[0]?.length || 3;

  return (
    <>
      {/* =========================================================================
          MOBILE COMPACT HUD (< md): Clean, Spacious Dual Telemetry Pods
          ========================================================================= */}
      <div className="md:hidden w-full flex flex-col gap-1 font-pixel select-none">
        {/* Tier 1: Minimalist Arcade Score Bar */}
        <div className="w-full flex items-center justify-between px-2.5 py-1 bg-black/70 border border-white/15 rounded text-[7px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">SCORE</span>
            <span className="text-cyan-400 font-bold">
              {score.toString().padStart(6, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-400">
            <div>
              <span>LVL </span>
              <span className="text-green-400 font-bold">{level}</span>
            </div>
            <div className="border-l border-white/20 pl-2">
              <span>LINES </span>
              <span className="text-purple-400 font-bold">{linesCleared}</span>
            </div>
          </div>
        </div>

        {/* Tier 2: Dual Mission Pods (TARGET vs LANDS) */}
        <div className="grid grid-cols-2 gap-1.5 w-full">
          {/* Target Mission Pod */}
          <div
            className={`flex items-center gap-2 p-1.5 rounded border transition-all ${
              matchResult.isMatch
                ? 'bg-green-950/40 border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                : 'bg-black/65 border-white/15'
            }`}
          >
            {/* 3x3 Target Matrix Preview */}
            <div className="grid grid-cols-3 gap-0.5 p-1 bg-black/90 border border-white/15 rounded shrink-0 shadow-inner">
              {targetPreview3x3.map((row, r) =>
                row.map((active, c) => (
                  <div
                    key={`m-target-${r}-${c}`}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] transition-all"
                    style={{
                      backgroundColor: active ? targetTetromino.color : '#131824',
                      boxShadow: active
                        ? `0 0 5px ${targetTetromino.color}`
                        : 'none',
                    }}
                  />
                ))
              )}
            </div>

            {/* Target Label & Status */}
            <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
              <span className="text-[6.5px] text-slate-400 uppercase tracking-wider">
                TARGET
              </span>
              <span
                className="text-[8px] font-bold truncate leading-tight mt-0.5"
                style={{ color: targetTetromino.color }}
              >
                {targetTetromino.name}
              </span>
              <span className="text-[6px] mt-0.5 truncate">
                {matchResult.isMatch ? (
                  <span className="text-green-400 font-bold">✓ MATCHED</span>
                ) : (
                  <span className="text-slate-500">TWIST FACE</span>
                )}
              </span>
            </div>
          </div>

          {/* Lands Live Pod */}
          <div
            className={`flex items-center gap-2 p-1.5 rounded border transition-all ${
              matchResult.isMatch
                ? 'bg-green-950/40 border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                : 'bg-black/65 border-white/15'
            }`}
          >
            {/* Dynamic Live Front Face Grid */}
            <div
              className="grid gap-0.5 p-1 bg-black/90 border border-white/15 rounded shrink-0 shadow-inner"
              style={{
                gridTemplateColumns: `repeat(${frontCols}, minmax(0, 1fr))`,
              }}
            >
              {frontFaceColors.map((row, r) =>
                row.map((color, c) => {
                  const isPartOfMatch = matchResult.matchedIndices.some(
                    ([mr, mc]) => mr === r && mc === c
                  );

                  return (
                    <div
                      key={`m-front-${r}-${c}`}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] transition-all relative ${
                        isPartOfMatch
                          ? 'ring-1 ring-yellow-400 scale-105 z-10 animate-pulse'
                          : ''
                      }`}
                      style={{
                        backgroundColor: color,
                        boxShadow: isPartOfMatch
                          ? '0 0 6px rgba(250,204,21,0.9)'
                          : 'inset 1px 1px 0 rgba(255,255,255,0.3)',
                      }}
                    />
                  );
                })
              )}
            </div>

            {/* Lands Label & Stamp Status */}
            <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1 text-[6.5px] text-slate-400 uppercase tracking-wider">
                <span>LANDS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <span className="text-[8px] font-bold text-cyan-300 truncate leading-tight mt-0.5">
                {matchResult.isMatch ? (
                  <span className="text-green-400 font-bold">READY</span>
                ) : (
                  'LIVE FACE'
                )}
              </span>
              <span className="text-[6px] mt-0.5 truncate">
                {matchResult.isMatch ? (
                  <span className="text-yellow-400 font-bold animate-pulse">
                    +500 PTS
                  </span>
                ) : (
                  <span className="text-slate-500">DETACHES</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP LEFT WING HUD (>= md): Full Telemetry & Score Cockpit Dashboard
          ========================================================================= */}
      <div className="hidden md:flex flex-col gap-2 w-full font-pixel text-xs select-none">
        {/* Primary Score Board (2x2 LED Grid) */}
        <div className="grid grid-cols-2 gap-2 bg-black/60 p-2.5 border border-white/20 rounded">
          <div>
            <div className="text-[7.5px] text-slate-400 mb-0.5">SCORE</div>
            <div className="text-cyan-400 text-xs font-bold tracking-tight">
              {score.toString().padStart(6, '0')}
            </div>
          </div>
          <div>
            <div className="text-[7.5px] text-slate-400 mb-0.5">HI-SCORE</div>
            <div className="text-yellow-400 text-xs font-bold tracking-tight">
              {highScore.toString().padStart(6, '0')}
            </div>
          </div>
          <div>
            <div className="text-[7.5px] text-slate-400 mb-0.5">LEVEL</div>
            <div className="text-green-400 text-xs font-bold">{level}</div>
          </div>
          <div>
            <div className="text-[7.5px] text-slate-400 mb-0.5">LINES</div>
            <div className="text-purple-400 text-xs font-bold">{linesCleared}</div>
          </div>
        </div>

        {/* Piece Banner: Current Falling Piece & Upcoming Piece */}
        <div className="flex flex-col gap-1 px-2.5 py-1.5 bg-black/50 border border-white/15 rounded text-[7.5px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">ACTIVE:</span>
            <span className="text-cyan-300 font-bold">
              {SHAPES_META[currentShape]?.name || currentShape}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">NEXT:</span>
            <span className="text-yellow-300 font-bold">
              {SHAPES_META[nextShape]?.name || nextShape}
            </span>
          </div>
        </div>

        {/* Target Tetromino Card */}
        <div className="bg-black/70 p-2.5 border border-white/20 rounded flex flex-col items-center justify-between min-h-[115px]">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[7.5px] text-slate-300">TARGET:</span>
            <span
              className="text-[7.5px] px-1.5 py-0.5 rounded font-bold"
              style={{
                color: targetTetromino.color,
                backgroundColor: `${targetTetromino.color}15`,
              }}
            >
              {targetTetromino.name}
            </span>
          </div>

          {/* Centered 3x3 Target Matrix Preview */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/80 border border-white/10 rounded">
            {targetPreview3x3.map((row, r) =>
              row.map((active, c) => (
                <div
                  key={`target-${r}-${c}`}
                  className="w-3.5 h-3.5 rounded-[1px] transition-all"
                  style={{
                    backgroundColor: active ? targetTetromino.color : '#1e293b',
                    boxShadow: active
                      ? `0 0 6px ${targetTetromino.color}`
                      : 'none',
                  }}
                />
              ))
            )}
          </div>

          {/* Match Banner */}
          <div className="mt-1.5 w-full text-center">
            {matchResult.isMatch ? (
              <span className="text-[7px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/40 animate-pulse block font-bold">
                ✓ MATCHED (+500)
              </span>
            ) : (
              <span className="text-[6.5px] text-cyan-400/90 block">
                FORM ON FRONT FACE
              </span>
            )}
          </div>
        </div>

        {/* Live Active Front Face (Lands) Card */}
        <div className="bg-black/70 p-2.5 border border-white/20 rounded flex flex-col items-center justify-between min-h-[115px]">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[7.5px] text-slate-300">FRONT FACE:</span>
            <span className="text-[7px] text-cyan-400 font-bold animate-pulse">
              LIVE (LANDS)
            </span>
          </div>

          {/* Dynamic Live Sticker Matrix */}
          <div
            className="grid gap-1 p-1 bg-black/80 border border-white/10 rounded"
            style={{
              gridTemplateColumns: `repeat(${frontCols}, minmax(0, 1fr))`,
            }}
          >
            {frontFaceColors.map((row, r) =>
              row.map((color, c) => {
                const isPartOfMatch = matchResult.matchedIndices.some(
                  ([mr, mc]) => mr === r && mc === c
                );

                return (
                  <div
                    key={`front-${r}-${c}`}
                    className={`w-3.5 h-3.5 rounded-[1px] transition-all relative ${
                      isPartOfMatch
                        ? 'ring-2 ring-yellow-400 scale-105 z-10 animate-pulse'
                        : ''
                    }`}
                    style={{
                      backgroundColor: color,
                      boxShadow: isPartOfMatch
                        ? '0 0 8px rgba(250,204,21,0.9)'
                        : 'inset 1px 1px 0 rgba(255,255,255,0.3)',
                    }}
                  />
                );
              })
            )}
          </div>

          <div className="mt-1.5 text-[6.5px] text-center w-full">
            {matchResult.isMatch ? (
              <span className="text-yellow-400 font-bold">✓ READY TO STAMP</span>
            ) : (
              <span className="text-slate-400">DETACHES ON LAND</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
