# Rubik's Tetris (tetris-rubik-game) 🕹️🧩

> A hybrid retro arcade puzzle game combining **3D Rubik's Cube mechanics** with classic **2D Flat Tetris**.

Twist, slice, and orient falling 3D Rubik polycubes to match target tetromino shapes on the front face, then slam them down to stamp colored blocks onto the 2D grid and clear lines!

![Rubik's Tetris](public/vite.svg)

---

## 🎮 Core Gameplay

1. **3D Falling Polycube:**
   - As pieces fall down the arcade matrix, manipulate them using authentic Rubik speedcubing moves (Layer twists, Slices, Wide turns, and Whole-cube rotations).
2. **Target Matching:**
   - Your HUD displays a designated **Target Tetromino** (Square, Bar, T-Shape, L-Shape, etc.).
   - Twist the cube layers so the stickers on the **Front Face (Lands)** match the target shape.
3. **Stamping & Line Clears:**
   - Matching the target grants a **+500 point bonus** and detaches the tetromino cleanly upon landing.
   - Stack blocks, complete rows, clear lines, and climb levels with dynamic retro sound effects and CRT scanlines!
4. **AI Bot Autoplay Mode:**
   - Toggle the built-in Pierre Dellacherie heuristic AI bot (`Tab` or `0`) to watch an autonomous speedcuber play the game in real time.

---

## ⌨️ Controls & Keybinds

### 🕹️ 2D Tetris Grid Movement
| Key | Action |
| --- | --- |
| `◀` / `A` | Move Left |
| `▶` / `D` | Move Right |
| `▼` / `S` | Soft Drop |
| `▲` / `Space` | Hard Drop Slam |

### 🧩 WCA Rubik's Cube Layer Twists
| Key | Layer / Twist | With `Shift` (Prime `'`) |
| --- | --- | --- |
| `U` | Up Layer | Counter-Clockwise (`U'`) |
| `D` | Down Layer | Counter-Clockwise (`D'`) |
| `L` | Left Layer | Counter-Clockwise (`L'`) |
| `R` | Right Layer | Counter-Clockwise (`R'`) |
| `F` | Front Layer | Counter-Clockwise (`F'`) |
| `B` | Back Layer | Counter-Clockwise (`B'`) |

### 🍰 Slice & Wide Moves
| Key | Action |
| --- | --- |
| `M` | Middle Slice (follows L) |
| `E` | Equator Slice (follows D) |
| `S` | Standing Slice (follows F) |
| `W` or `Alt+Key` | Toggle Wide Mode (`Uw`, `Dw`, `Lw`, `Rw`, `Fw`, `Bw`) |

### 🔄 Whole Cube Rotations
| Key | Rotation |
| --- | --- |
| `X` | Pitch Rotation (around X axis) |
| `Y` | Yaw Rotation (around Y axis) |
| `Z` | Roll Rotation (around Z axis) |
| `Shift + X/Y/Z` | Inverse Whole Rotation |

### 🛠️ Arcade Cockpit Controls
| Key | Action |
| --- | --- |
| `Tab` / `0` / `` ` `` | Toggle Bot Autoplay Mode |
| `H` / `?` | Open How to Play Tutorial Manual |
| `P` / `Esc` | Pause / Resume Game |
| `Enter` | Start / Restart Game |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation
```bash
git clone https://github.com/astralicc/tetris-rubik-game.git
cd tetris-rubik-game
npm install
```

### Development
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Linting & Type-Checking
```bash
npm run lint
npx tsc --noEmit
```

---

## 🛠️ Built With
- **React 19** & **TypeScript**
- **Three.js** & **@react-three/fiber** / **@react-three/drei** (Hardware-accelerated 3D WebGL rendering)
- **Tailwind CSS v4** (Pixel-perfect responsive arcade cockpit interface)
- **Zustand** (Predictable, high-frequency game state management)
- **Web Audio API** (Procedural 8-bit chiptune sound synthesis)
- **Oxlint** & **Vite**

---

## 📄 License
MIT
