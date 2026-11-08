import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Bot, HelpCircle } from 'lucide-react';
import { sound } from '../utils/audio';

export function ArcadeHeader() {
  const isBotMode = useGameStore((state) => state.isBotMode);
  const toggleBotMode = useGameStore((state) => state.toggleBotMode);
  const openTutorial = useGameStore((state) => state.openTutorial);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const restartGame = useGameStore((state) => state.restartGame);
  const gameStatus = useGameStore((state) => state.gameStatus);

  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="w-full pb-2 mb-2 border-b border-slate-700/60 flex items-center justify-between px-1 select-none font-pixel text-white">
      {/* Left Marquee Branding */}
      <div className="flex items-center gap-2">
        <span className="text-[7px] text-slate-400 tracking-widest hidden lg:inline">
          ★ ARCHETYPE 1989 ★
        </span>
        <span className="text-[8px] sm:text-[9px] font-bold text-yellow-400 tracking-wider">
          RUBIK'S TETRIS
        </span>
      </div>

      {/* Center Arcade Coin Flasher */}
      {/* <div className="text-[7px] text-yellow-400/90 font-bold animate-pulse hidden md:block">
        INSERT 1 COIN &bull; CREDIT 01
      </div> */}

      {/* Right Controls Tray */}
      <div className="flex items-center gap-1.5 text-white/80">
        <button
          onClick={openTutorial}
          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-yellow-400/20 hover:text-yellow-400 border border-white/20 text-white/80 transition-colors flex items-center gap-1 cursor-pointer"
          title="How to Play & Tutorial (H / ?)"
        >
          <HelpCircle size={12} className="text-yellow-400" />
          <span className="text-[7px] hidden sm:inline">HOW TO PLAY</span>
        </button>

        <button
          onClick={toggleBotMode}
          className={`px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all cursor-pointer ${isBotMode
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] font-bold animate-pulse'
              : 'hover:text-cyan-400 hover:bg-white/10 text-white/80 border-white/20'
            }`}
          title="Toggle Bot Autoplay (Tab / 0)"
        >
          <Bot size={12} />
          <span className="text-[7px]">{isBotMode ? 'BOT ON' : 'BOT'}</span>
        </button>

        <button
          onClick={handleToggleSound}
          className="p-1 hover:text-cyan-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>

        {gameStatus === 'PLAYING' && (
          <button
            onClick={pauseGame}
            className="p-1 hover:text-yellow-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Pause (P/Esc)"
          >
            <Pause size={13} />
          </button>
        )}
        {gameStatus === 'PAUSED' && (
          <button
            onClick={resumeGame}
            className="p-1 hover:text-green-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Resume (P/Esc)"
          >
            <Play size={13} />
          </button>
        )}
        <button
          onClick={restartGame}
          className="p-1 hover:text-red-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Restart"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}

