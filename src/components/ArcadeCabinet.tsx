import { useGameStore } from '../store/gameStore';
import { useGameInput } from '../hooks/useGameInput';
import { useGameLoop } from '../hooks/useGameLoop';
import { useBotPlayer } from '../hooks/useBotPlayer';
import { FlatGrid } from './FlatGrid';
import { RubikCanvas } from './RubikCanvas';
import { TvScreenOverlay } from './TvScreenOverlay';
import { ArcadeHeader } from './ArcadeHeader';
import { HudPanel } from './HudPanel';
import { ControlsCheatSheet } from './ControlsCheatSheet';
import { VirtualControls } from './VirtualControls';
import { TutorialModal } from './TutorialModal';
import { Play, RotateCcw, HelpCircle } from 'lucide-react';

export function ArcadeCabinet() {
  useGameInput();
  useGameLoop();
  useBotPlayer();

  const gameStatus = useGameStore((state) => state.gameStatus);
  const isBotMode = useGameStore((state) => state.isBotMode);
  const score = useGameStore((state) => state.score);
  const startGame = useGameStore((state) => state.startGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const openTutorial = useGameStore((state) => state.openTutorial);
  const screenShake = useGameStore((state) => state.screenShake);

  return (
    <div className="w-full min-h-screen arcade-bg flex flex-col items-center justify-center p-2 sm:p-3 text-white font-pixel select-none overflow-x-hidden md:overflow-y-auto">
      {/* Responsive Multi-Column Arcade Cabinet Chassis */}
      <div className="relative w-full max-w-[420px] md:max-w-[880px] lg:max-w-[960px] bg-[#161922] border-4 border-[#2d3748] rounded-2xl p-2.5 sm:p-3.5 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col items-center my-auto">
        {/* Decorative Corner Rivets */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-400 shadow-inner" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-400 shadow-inner" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-400 shadow-inner" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-400 shadow-inner" />

        {/* Full-Width Arcade Header Marquee */}
        <ArcadeHeader />

        {/* =========================================================================
            RESPONSIVE COCKPIT: Left Wing (HUD), Center (CRT TV Screen), Right Wing (Controls)
            ========================================================================= */}
        <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-2.5 md:gap-4 lg:gap-6 mt-1">
          {/* LEFT WING: Flight Telemetry & Stats Dashboard (Desktop: left sidebar, Mobile: compact top bar) */}
          <div className="w-full md:w-[210px] lg:w-[230px] shrink-0">
            <HudPanel />
          </div>

          {/* CENTER: Arcade CRT Monitor with 1:2 Aspect Ratio */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className="relative h-[min(480px,calc(100vh-140px))] aspect-[1/2] bg-[#0c0f16] crt-screen-bezel overflow-hidden transition-transform duration-75"
              style={
                screenShake > 0
                  ? { transform: `translateY(${screenShake * 1.5}px)` }
                  : undefined
              }
            >
              {/* Strictly Flat 2D Grid with Stacked 2D Blocks (z-0) */}
              <FlatGrid />

              {/* Suspended 3D Rubik's Polycube Falling Overlay (z-10) */}
              {gameStatus === 'PLAYING' && <RubikCanvas />}

              {/* CPU Bot Autoplay Retro Indicator (z-15) */}
              {isBotMode && (
                <div className="absolute top-2 left-2 z-15 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/85 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)] pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[7px] font-bold text-cyan-300 tracking-widest uppercase">
                    BOT AUTOPLAY
                  </span>
                </div>
              )}

              {/* Authentic Retro CRT TV Effect Overlay System (z-20) */}
              <TvScreenOverlay />

              {/* Idle / Attract Mode Overlay */}
              {gameStatus === 'IDLE' && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-30">
                  <div className="text-lg sm:text-xl text-yellow-400 font-bold mb-3 tracking-widest animate-bounce">
                    RUBIK'S<br />TETRIS
                  </div>
                  <p className="text-[7.5px] sm:text-[8px] text-cyan-300 leading-relaxed mb-5 px-1">
                    TWIST THE 3D RUBIK'S CUBE<br />
                    TO FORM THE TARGET ON THE FRONT FACE<br />
                    AND SLAM IT INTO THE 2D GRID!
                  </p>
                  <button
                    onClick={startGame}
                    className="px-3.5 py-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold text-xs rounded border-2 border-white shadow-[0_0_15px_rgba(34,197,94,0.8)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play size={14} /> START GAME
                  </button>
                  <button
                    onClick={openTutorial}
                    className="mt-2.5 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 active:bg-cyan-700 text-cyan-300 font-bold text-[7.5px] rounded border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle size={11} className="text-yellow-400" /> HOW TO PLAY &bull; TUTORIAL
                  </button>
                  <div className="mt-2.5 text-[7px] text-slate-400 animate-pulse">
                    OR PRESS [ENTER]
                  </div>
                </div>
              )}

              {/* Paused Overlay */}
              {gameStatus === 'PAUSED' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-30">
                  <div className="text-base sm:text-lg text-yellow-400 font-bold mb-4 tracking-widest animate-pulse">
                    GAME PAUSED
                  </div>
                  <button
                    onClick={resumeGame}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold text-xs rounded border-2 border-white shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play size={14} /> RESUME (P)
                  </button>
                  <button
                    onClick={openTutorial}
                    className="mt-2 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[7.5px] rounded border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle size={11} className="text-yellow-400" /> HOW TO PLAY
                  </button>
                </div>
              )}

              {/* Game Over Overlay */}
              {gameStatus === 'GAME_OVER' && (
                <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-4 text-center z-30">
                  <div className="text-base sm:text-lg text-red-400 font-bold mb-2 tracking-widest animate-pulse">
                    GAME OVER
                  </div>
                  <div className="text-[9px] text-slate-300 mb-1">FINAL SCORE</div>
                  <div className="text-sm sm:text-base text-yellow-400 font-bold mb-4">
                    {score}
                  </div>
                  <button
                    onClick={startGame}
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-bold text-xs rounded border-2 border-white shadow-[0_0_15px_rgba(250,204,21,0.8)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={14} /> PLAY AGAIN
                  </button>
                  <button
                    onClick={openTutorial}
                    className="mt-2 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[7.5px] rounded border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle size={11} className="text-yellow-400" /> HOW TO PLAY
                  </button>
                  <div className="mt-2.5 text-[7px] text-slate-400">
                    PRESS [ENTER] TO RETRY
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT WING: Cockpit Control Panel & Keybind Shortcuts */}
          <div className="w-full md:w-[220px] lg:w-[245px] shrink-0 flex flex-col gap-2">
            <VirtualControls />
            <ControlsCheatSheet />
          </div>
        </div>

        {/* Step-by-Step Arcade Manual / Tutorial Modal */}
        <TutorialModal />

        {/* Cabinet Bottom Detail: Speaker Grills & Coin Slot */}
        <div className="w-full mt-2.5 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[6.5px] text-slate-500 px-1">
          <span>PORTRAIT ARCADE COCKPIT</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1 bg-slate-600 rounded-sm" />
            <div className="w-1.5 h-1 bg-slate-600 rounded-sm" />
            <div className="w-1.5 h-1 bg-slate-600 rounded-sm" />
          </div>
          <span>FLAT 2D + 3D R3F</span>
        </div>
      </div>
    </div>
  );
}
