import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Bot,
  Play,
  RotateCw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export function TutorialModal() {
  const isTutorialOpen = useGameStore((state) => state.isTutorialOpen);
  const closeTutorial = useGameStore((state) => state.closeTutorial);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const startGame = useGameStore((state) => state.startGame);
  const resumeGame = useGameStore((state) => state.resumeGame);

  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const handleFinish = useCallback(() => {
    closeTutorial();
    if (gameStatus === 'IDLE' || gameStatus === 'GAME_OVER') {
      startGame();
    } else if (gameStatus === 'PAUSED') {
      resumeGame();
    }
  }, [closeTutorial, gameStatus, startGame, resumeGame]);

  // Keyboard navigation within the tutorial
  useEffect(() => {
    if (!isTutorialOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTutorial();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (step < totalSteps - 1) {
          setStep((s) => s + 1);
        } else {
          handleFinish();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 0) {
          setStep((s) => s - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTutorialOpen, step, closeTutorial, handleFinish]);

  if (!isTutorialOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs select-none">
      {/* Central Arcade Manual Chassis */}
      <div className="relative w-full max-w-[370px] bg-[#0c101a] border-2 border-cyan-400 rounded-xl p-4 shadow-[0_0_50px_rgba(6,182,212,0.5)] flex flex-col font-pixel text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
          <div className="flex items-center gap-1.5 text-yellow-400 text-[9px] tracking-widest font-bold">
            <HelpCircle size={14} className="text-yellow-400 animate-pulse" />
            <span>HOW TO PLAY</span>
          </div>
          <button
            onClick={closeTutorial}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            title="Close Tutorial (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between text-[7px] text-cyan-300 font-bold mt-2.5 mb-2">
          <span>STEP {step + 1} OF {totalSteps}</span>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${step === idx
                  ? 'bg-yellow-400 scale-125 shadow-[0_0_6px_rgba(250,204,21,0.9)]'
                  : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                aria-label={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Slide Content Area */}
        <div className="min-h-[220px] flex flex-col justify-between py-1">
          {/* SLIDE 0: THE REVOLUTIONARY HYBRID */}
          {step === 0 && (
            <div className="space-y-2.5">
              <div className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                <span>🎲 3D RUBIK + 2D TETRIS</span>
              </div>
              <p className="text-[8px] text-slate-300 leading-relaxed">
                Welcome to <strong className="text-white">Rubik's Tetris</strong>! Instead of ordinary flat tetrominoes, you control a falling <span className="text-cyan-300 font-bold">3D Rubik's Polycube</span>!
              </p>

              {/* Visual Diagram: 3D Front Face -> 2D Grid Stamping */}
              <div className="bg-black/60 p-2.5 rounded border border-white/10 flex items-center justify-around gap-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="grid grid-cols-2 gap-0.5 p-1 bg-slate-900 border border-cyan-400/80 rounded shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                    <div className="w-4 h-4 bg-emerald-500 rounded-[1px]" />
                    <div className="w-4 h-4 bg-emerald-500 rounded-[1px]" />
                    <div className="w-4 h-4 bg-emerald-500 rounded-[1px]" />
                    <div className="w-4 h-4 bg-emerald-500 rounded-[1px]" />
                  </div>
                  <span className="text-[6.5px] text-cyan-300">FRONT FACE</span>
                </div>

                <div className="text-xs text-yellow-400 font-bold animate-pulse">
                  ➔ LANDS ➔
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="grid grid-cols-4 gap-0.5 p-1 bg-slate-900 border border-slate-700 rounded">
                    <div className="w-3.5 h-3.5 border border-slate-800" />
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-[1px]" />
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-[1px]" />
                    <div className="w-3.5 h-3.5 border border-slate-800" />
                  </div>
                  <span className="text-[6.5px] text-emerald-400">2D MATRIX</span>
                </div>
              </div>

              <p className="text-[7.5px] text-slate-300 leading-relaxed">
                The <strong className="text-cyan-300">Front Face</strong> facing the camera detaches and stamps into the 2D grid when it lands. Stack lines and clear rows to score!
              </p>
            </div>
          )}

          {/* SLIDE 1: MATCHING THE TARGET */}
          {step === 1 && (
            <div className="space-y-2.5">
              <div className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>MATCH THE TARGET FOR +500!</span>
              </div>
              <p className="text-[8px] text-slate-300 leading-relaxed">
                Check the top HUD for the active <strong className="text-amber-400">TARGET</strong> tetromino (e.g. T, L, Square, Domino).
              </p>

              {/* Target vs Front Face Preview */}
              <div className="bg-black/60 p-2.5 rounded border border-emerald-500/40 flex items-center justify-between gap-3">
                <div className="flex flex-col items-center gap-1 w-1/2 border-r border-white/10 pr-2">
                  <span className="text-[6.5px] text-amber-300 font-bold">TARGET: T-SHAPE</span>
                  <div className="grid grid-cols-3 gap-0.5 p-1 bg-slate-950 border border-amber-500/40 rounded">
                    <div className="w-3 h-3 bg-purple-500" />
                    <div className="w-3 h-3 bg-purple-500" />
                    <div className="w-3 h-3 bg-purple-500" />
                    <div className="w-3 h-3" />
                    <div className="w-3 h-3 bg-purple-500" />
                    <div className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 w-1/2 pl-1">
                  <span className="text-[6.5px] text-emerald-300 font-bold">✓ MATCHED (+500)</span>
                  <div className="px-2 py-1 bg-emerald-950/80 border border-emerald-400 rounded text-[7px] text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse">
                    READY TO STAMP
                  </div>
                </div>
              </div>

              <p className="text-[7.5px] text-slate-300 leading-relaxed">
                Twist layers until your Front Face matches the target's shape in a uniform color. You earn <strong className="text-yellow-400">+500 BONUS POINTS</strong> and stamp a classic 4-block piece!
              </p>
            </div>
          )}

          {/* SLIDE 2: SPEEDCUBING TWISTS */}
          {step === 2 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                <RotateCw size={14} className="text-cyan-400" />
                <span>SPEEDCUBING TWISTS & TURNS</span>
              </div>
              <p className="text-[7.5px] text-slate-300 leading-relaxed">
                Use standard WCA speedcubing notation to twist and solve:
              </p>

              <div className="grid grid-cols-2 gap-1.5 text-[7px] bg-black/60 p-2 rounded border border-white/10">
                <div className="space-y-1">
                  <div className="text-cyan-300 font-bold text-[7.5px]">OUTER FACES:</div>
                  <div><kbd className="px-1 bg-slate-800 text-white border border-white/20 rounded">U</kbd> Up &bull; <kbd className="px-1 bg-slate-800 text-white border border-white/20 rounded">D</kbd> Down</div>
                  <div><kbd className="px-1 bg-slate-800 text-white border border-white/20 rounded">L</kbd> Left &bull; <kbd className="px-1 bg-slate-800 text-white border border-white/20 rounded">R</kbd> Right</div>
                  <div><kbd className="px-1 bg-slate-800 text-white border border-white/20 rounded">F</kbd> Front &bull; <kbd className="px-1 bg-slate-800 text-white border border-white/20 rounded">B</kbd> Back</div>
                </div>

                <div className="space-y-1 border-l border-white/10 pl-2">
                  <div className="text-yellow-300 font-bold text-[7.5px]">WHOLE CUBE 3D:</div>
                  <div><kbd className="px-1 bg-slate-800 text-yellow-400 border border-white/20 rounded">X</kbd> Pitch (Up/Down)</div>
                  <div><kbd className="px-1 bg-slate-800 text-yellow-400 border border-white/20 rounded">Y</kbd> Yaw (Left/Right)</div>
                  <div><kbd className="px-1 bg-slate-800 text-yellow-400 border border-white/20 rounded">Z</kbd> Roll (Roll face)</div>
                </div>
              </div>

              <div className="text-[6.5px] text-amber-300 bg-amber-950/30 border border-amber-500/30 p-1.5 rounded">
                💡 Hold <kbd className="px-1 bg-slate-800 text-white rounded">Shift</kbd> for counter-clockwise Prime (') turns (e.g. <kbd className="px-1 bg-slate-800 text-white rounded">R'</kbd>, <kbd className="px-1 bg-slate-800 text-white rounded">U'</kbd>).
              </div>
            </div>
          )}

          {/* SLIDE 3: TETRIS CONTROLS & DROPS */}
          {step === 3 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                <Gamepad2 size={14} className="text-emerald-400" />
                <span>POSITIONING & DROPS</span>
              </div>
              <p className="text-[7.5px] text-slate-300 leading-relaxed">
                Move and position the polycube on the 10-column grid:
              </p>

              <div className="space-y-1.5 bg-black/60 p-2.5 rounded border border-white/10 text-[7px]">
                <div className="flex items-center justify-between">
                  <span>MOVE LEFT / RIGHT:</span>
                  <div className="flex gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 border border-white/20 rounded font-bold">◀</kbd>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 border border-white/20 rounded font-bold">▶</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>SOFT DROP:</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-yellow-300 border border-white/20 rounded font-bold">▼ / S</kbd>
                </div>

                <div className="flex items-center justify-between">
                  <span>HARD DROP (SLAM):</span>
                  <kbd className="px-1.5 py-0.5 bg-red-900 text-white border border-red-400 rounded font-bold animate-pulse">▲ / Space</kbd>
                </div>
              </div>

              <p className="text-[7.5px] text-slate-300 leading-relaxed">
                Watch the <strong className="text-yellow-400">Ghost Landing Outline</strong> on the grid showing exactly where your blocks will stamp!
              </p>
            </div>
          )}

          {/* SLIDE 4: PRO TIPS & BOT MODE */}
          {step === 4 && (
            <div className="space-y-2.5">
              <div className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                <Bot size={14} className="text-cyan-400" />
                <span>PRO TIPS & BOT AUTOPLAY</span>
              </div>

              <div className="space-y-1.5 text-[7.5px] text-slate-300">
                <div className="flex items-start gap-1.5 bg-black/50 p-1.5 rounded border border-white/10">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span><strong className="text-white">Unmatched pieces still land safely!</strong> If you run out of time, the piece still detaches its dominant color cells cleanly.</span>
                </div>

                <div className="flex items-start gap-1.5 bg-black/50 p-1.5 rounded border border-white/10">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span><strong className="text-white">Rotate in 3D:</strong> Press <kbd className="px-1 bg-slate-800 text-yellow-400 rounded">X</kbd>, <kbd className="px-1 bg-slate-800 text-yellow-400 rounded">Y</kbd>, or <kbd className="px-1 bg-slate-800 text-yellow-400 rounded">Z</kbd> to inspect other faces—the target might already be waiting on another side!</span>
                </div>

                <div className="flex items-start gap-1.5 bg-cyan-950/40 p-1.5 rounded border border-cyan-400/40">
                  <span className="text-cyan-300 font-bold">3.</span>
                  <span><strong className="text-cyan-300">Watch the Bot Play:</strong> Press <kbd className="px-1 bg-slate-800 text-white rounded">Tab</kbd>, <kbd className="px-1 bg-slate-800 text-white rounded">0</kbd>, or click <strong className="text-yellow-400">[BOT]</strong> to see the AI solve and play autonomously!</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions & Navigation Bar */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-cyan-500/30 text-[8px]">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={`px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1 ${step === 0
              ? 'opacity-30 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 border-white/30 text-white'
              }`}
          >
            <ChevronLeft size={12} /> PREV
          </button>

          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold rounded border border-white shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all flex items-center gap-1"
            >
              NEXT <ChevronRight size={12} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold rounded border border-white shadow-[0_0_15px_rgba(34,197,94,0.9)] transition-all flex items-center gap-1 animate-bounce"
            >
              <Play size={12} /> START PLAYING
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
