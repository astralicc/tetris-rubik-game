import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export function ControlsCheatSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full font-pixel text-[8px] select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 bg-black/60 border border-white/20 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={10} className="text-yellow-400" />
          KEYBIND SHORTCUTS
        </span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div className="bg-black/90 border-x border-b border-white/20 p-2 space-y-2 text-slate-300 rounded-b max-h-[170px] overflow-y-auto">
          <div>
            <div className="text-green-400 font-bold mb-1 text-[7.5px]">🧩 CUBE NOTATION</div>
            <div className="grid grid-cols-3 gap-1 text-[7px] leading-relaxed">
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">U</kbd> Up</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">D</kbd> Down</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">L</kbd> Left</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">R</kbd> Right</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">F</kbd> Front</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">B</kbd> Back</div>
            </div>
            <div className="text-[6.5px] text-amber-300 mt-0.5">
              *Hold Shift for Prime (') twists (counter-clockwise)
            </div>
          </div>

          <div>
            <div className="text-purple-400 font-bold mb-1 text-[7.5px]">🍰 SLICES & WIDE</div>
            <div className="grid grid-cols-3 gap-1 text-[7px] leading-relaxed">
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">M</kbd> Mid</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">E</kbd> Eq</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">S</kbd> Stand</div>
            </div>
            <div className="text-[6.5px] text-cyan-300 mt-0.5">
              <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">W</kbd> Toggle Wide Mode or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Alt+Key</kbd>
            </div>
          </div>

          <div>
            <div className="text-yellow-400 font-bold mb-1 text-[7.5px]">🔄 WHOLE ROTATION</div>
            <div className="grid grid-cols-3 gap-1 text-[7px] leading-relaxed">
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">X</kbd> Pitch</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Y</kbd> Yaw</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Z</kbd> Roll</div>
            </div>
          </div>

          <div>
            <div className="text-cyan-400 font-bold mb-1 text-[7.5px]">🕹️ MATRIX MOVES</div>
            <div className="grid grid-cols-2 gap-1 text-[7px] leading-relaxed">
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">◀ / A</kbd> Left</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">▶ / D</kbd> Right</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">▼ / S</kbd> Soft Drop</div>
              <div><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Space</kbd> Slam</div>
            </div>
          </div>

          <div>
            <div className="text-emerald-400 font-bold mb-0.5 text-[7.5px]">🤖 BOT & MANUAL</div>
            <div className="text-[7px] leading-relaxed">
              <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Tab / 0</kbd> Bot Autoplay &bull; <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">H / ?</kbd> Manual
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
