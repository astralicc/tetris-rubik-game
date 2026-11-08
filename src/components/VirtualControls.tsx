import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { RubikFace } from '../types/game';
import { ArrowLeft, ArrowRight, ArrowDown, ArrowUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export function VirtualControls() {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const softDrop = useGameStore((state) => state.softDrop);
  const hardDrop = useGameStore((state) => state.hardDrop);
  const executeTwist = useGameStore((state) => state.executeTwist);
  const rotateGlobal = useGameStore((state) => state.rotateGlobal);
  const isWideMode = useGameStore((state) => state.isWideMode);
  const toggleWideMode = useGameStore((state) => state.toggleWideMode);
  const gameStatus = useGameStore((state) => state.gameStatus);

  const [isPrime, setIsPrime] = useState(false);
  const [mobileTab, setMobileTab] = useState<'move' | 'twist' | 'rotate'>('move');
  const [isMobileOpen, setIsMobileOpen] = useState(true);

  if (gameStatus !== 'PLAYING') return null;

  const triggerTwist = (face: RubikFace) => {
    executeTwist(face, isPrime ? -1 : 1);
  };

  const standardFaces: RubikFace[] = ['U', 'D', 'L', 'R', 'F', 'B'];
  const wideFaces: RubikFace[] = ['Uw', 'Dw', 'Lw', 'Rw', 'Fw', 'Bw'];
  const activeFaces = isWideMode ? wideFaces : standardFaces;
  const sliceFaces: RubikFace[] = ['M', 'E', 'S'];

  return (
    <>
      {/* =========================================================================
          MOBILE RESPONSIVE TOUCH CONTROLS (< md): Tabbed & Collapsible
          ========================================================================= */}
      <div className="md:hidden w-full flex flex-col font-pixel text-[8px] select-none mt-1">
        {/* Mobile Header Bar: Tab Switcher & Collapse Button */}
        <div className="flex items-center justify-between bg-black/70 border border-white/20 rounded-t px-1.5 py-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMobileTab('move');
                setIsMobileOpen(true);
              }}
              className={`px-1.5 py-0.5 rounded text-[7px] font-bold transition-colors cursor-pointer ${
                mobileTab === 'move' && isMobileOpen
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              MOVE
            </button>
            <button
              onClick={() => {
                setMobileTab('twist');
                setIsMobileOpen(true);
              }}
              className={`px-1.5 py-0.5 rounded text-[7px] font-bold transition-colors cursor-pointer ${
                mobileTab === 'twist' && isMobileOpen
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              TWISTS
            </button>
            <button
              onClick={() => {
                setMobileTab('rotate');
                setIsMobileOpen(true);
              }}
              className={`px-1.5 py-0.5 rounded text-[7px] font-bold transition-colors cursor-pointer ${
                mobileTab === 'rotate' && isMobileOpen
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              ROTATIONS
            </button>
          </div>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-0.5 text-white/60 hover:text-white cursor-pointer"
            title={isMobileOpen ? 'Hide Touch Controls' : 'Show Touch Controls'}
          >
            {isMobileOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Mobile Tab Content */}
        {isMobileOpen && (
          <div className="bg-black/90 border-x border-b border-white/20 rounded-b p-2">
            {/* Tab 1: 2D Grid Movement */}
            {mobileTab === 'move' && (
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={moveLeft}
                  className="py-2.5 bg-slate-800 active:bg-cyan-600 border border-white/30 rounded flex items-center justify-center text-white cursor-pointer"
                  title="Move Left (◀)"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  onClick={softDrop}
                  className="py-2.5 bg-slate-800 active:bg-cyan-600 border border-white/30 rounded flex items-center justify-center text-white cursor-pointer"
                  title="Soft Drop (▼)"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={moveRight}
                  className="py-2.5 bg-slate-800 active:bg-cyan-600 border border-white/30 rounded flex items-center justify-center text-white cursor-pointer"
                  title="Move Right (▶)"
                >
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={hardDrop}
                  className="py-2.5 bg-red-900/80 active:bg-red-600 border border-red-500/50 rounded flex items-center justify-center text-white font-bold text-[7px] cursor-pointer"
                  title="Hard Drop (▲ / Space)"
                >
                  <ArrowUp size={14} />
                </button>
              </div>
            )}

            {/* Tab 2: Cube Notation Twists */}
            {mobileTab === 'twist' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[6.5px]">
                  <button
                    onClick={toggleWideMode}
                    className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                      isWideMode
                        ? 'bg-cyan-400 text-black border-cyan-300 font-bold'
                        : 'bg-slate-800 text-slate-300 border-white/20'
                    }`}
                  >
                    WIDE {isWideMode ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setIsPrime(!isPrime)}
                    className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                      isPrime
                        ? 'bg-amber-400 text-black border-amber-300 font-bold'
                        : 'bg-slate-800 text-slate-300 border-white/20'
                    }`}
                  >
                    PRIME (') {isPrime ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {activeFaces.map((f) => (
                    <button
                      key={`m-${f}`}
                      onClick={() => triggerTwist(f)}
                      className="py-2 bg-slate-800 active:bg-cyan-600 border border-white/30 rounded text-center font-bold text-white text-[9px] cursor-pointer"
                    >
                      {f}{isPrime ? "'" : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Whole Rotations & Slices */}
            {mobileTab === 'rotate' && (
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => rotateGlobal('x', isPrime ? -1 : 1)}
                    className="py-2 bg-slate-800 active:bg-yellow-500 active:text-black border border-white/30 rounded text-center font-bold text-white text-[8px] cursor-pointer"
                  >
                    x{isPrime ? "'" : ''} (PITCH)
                  </button>
                  <button
                    onClick={() => rotateGlobal('y', isPrime ? -1 : 1)}
                    className="py-2 bg-slate-800 active:bg-yellow-500 active:text-black border border-white/30 rounded text-center font-bold text-white text-[8px] cursor-pointer"
                  >
                    y{isPrime ? "'" : ''} (YAW)
                  </button>
                  <button
                    onClick={() => rotateGlobal('z', isPrime ? -1 : 1)}
                    className="py-2 bg-slate-800 active:bg-yellow-500 active:text-black border border-white/30 rounded text-center font-bold text-white text-[8px] cursor-pointer"
                  >
                    z{isPrime ? "'" : ''} (ROLL)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
                  {sliceFaces.map((s) => (
                    <button
                      key={`m-slice-${s}`}
                      onClick={() => triggerTwist(s)}
                      className="py-1.5 bg-purple-950/80 active:bg-purple-600 border border-purple-500/40 rounded text-center font-bold text-white text-[8px] cursor-pointer"
                    >
                      {s}{isPrime ? "'" : ''} SLICE
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          DESKTOP RIGHT WING CONTROLS (>= md): Complete Ergonomic Control Deck
          ========================================================================= */}
      <div className="hidden md:flex flex-col gap-2 w-full font-pixel text-[8px] select-none">
        {/* D-Pad Movement & Hard Drop Slam */}
        <div className="bg-black/60 p-2 border border-white/20 rounded flex flex-col gap-1">
          <div className="text-[7px] text-slate-300 text-center font-bold">2D MATRIX MOVEMENT</div>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={moveLeft}
              className="py-2 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-white/30 rounded flex items-center justify-center text-white cursor-pointer"
              title="Move Left (◀ / A)"
            >
              <ArrowLeft size={12} />
            </button>
            <button
              onClick={softDrop}
              className="py-2 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-white/30 rounded flex items-center justify-center text-white cursor-pointer"
              title="Soft Drop (▼ / S)"
            >
              <ArrowDown size={12} />
            </button>
            <button
              onClick={moveRight}
              className="py-2 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-white/30 rounded flex items-center justify-center text-white cursor-pointer"
              title="Move Right (▶ / D)"
            >
              <ArrowRight size={12} />
            </button>
            <button
              onClick={hardDrop}
              className="py-2 bg-red-900/60 hover:bg-red-800 active:bg-red-600 border border-red-500/40 rounded flex items-center justify-center text-white font-bold cursor-pointer"
              title="Hard Drop Slam (▲ / Space)"
            >
              <ArrowUp size={12} />
            </button>
          </div>
        </div>

        {/* Cube Face Twists & Slices */}
        <div className="bg-black/60 p-2 border border-white/20 rounded flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[7px] text-slate-300">
            <span>{isWideMode ? 'WIDE MOVES' : 'CUBE TWISTS'}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleWideMode}
                className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  isWideMode
                    ? 'bg-cyan-400 text-black border-cyan-300 font-bold'
                    : 'bg-slate-800 text-slate-300 border-white/20 hover:text-white'
                }`}
                title="Toggle Wide Moves (W / Alt+Key)"
              >
                WIDE {isWideMode ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setIsPrime(!isPrime)}
                className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  isPrime
                    ? 'bg-amber-400 text-black border-amber-300 font-bold'
                    : 'bg-slate-800 text-slate-300 border-white/20 hover:text-white'
                }`}
                title="Toggle Prime Counter-Clockwise Twists"
              >
                PRIME (') {isPrime ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 6 Cube Faces (U, D, L, R, F, B) */}
          <div className="grid grid-cols-6 gap-1">
            {activeFaces.map((f) => (
              <button
                key={`d-${f}`}
                onClick={() => triggerTwist(f)}
                className={`py-1.5 border rounded text-center font-bold text-white transition-colors cursor-pointer ${
                  isWideMode
                    ? 'bg-cyan-950/70 hover:bg-cyan-900 border-cyan-500/40 active:bg-cyan-600'
                    : 'bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border-white/30'
                }`}
              >
                {f}{isPrime ? "'" : ''}
              </button>
            ))}
          </div>

          {/* Slice Moves: M, E, S */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[6.5px] text-purple-300">
            <span>SLICES:</span>
            <div className="grid grid-cols-3 gap-1 w-3/4">
              {sliceFaces.map((s) => (
                <button
                  key={`d-slice-${s}`}
                  onClick={() => triggerTwist(s)}
                  className="py-1 bg-purple-950/70 hover:bg-purple-900 active:bg-purple-600 border border-purple-500/40 rounded text-center font-bold text-white transition-colors cursor-pointer"
                >
                  {s}{isPrime ? "'" : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Whole Cube Rotations: x, y, z */}
        <div className="bg-black/60 p-2 border border-white/20 rounded flex flex-col gap-1">
          <div className="text-[6.5px] text-center text-yellow-400 font-bold">
            WHOLE ROTATIONS (X, Y, Z)
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => rotateGlobal('x', isPrime ? -1 : 1)}
              className="py-1 bg-slate-800 hover:bg-slate-700 border border-white/30 rounded text-[7px] text-white cursor-pointer"
              title="Pitch rotation (X)"
            >
              x{isPrime ? "'" : ''}
            </button>
            <button
              onClick={() => rotateGlobal('y', isPrime ? -1 : 1)}
              className="py-1 bg-slate-800 hover:bg-slate-700 border border-white/30 rounded text-[7px] text-white flex items-center justify-center gap-0.5 cursor-pointer"
              title="Yaw rotation (Y)"
            >
              <RefreshCw size={7} /> y{isPrime ? "'" : ''}
            </button>
            <button
              onClick={() => rotateGlobal('z', isPrime ? -1 : 1)}
              className="py-1 bg-slate-800 hover:bg-slate-700 border border-white/30 rounded text-[7px] text-white cursor-pointer"
              title="Roll rotation (Z)"
            >
              z{isPrime ? "'" : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
