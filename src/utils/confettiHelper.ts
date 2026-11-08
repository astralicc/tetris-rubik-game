import confetti from 'canvas-confetti';

/**
 * 8-Bit Retro Pixel-Art Confetti Controller
 * Renders crisp, axis-aligned square pixel particles with flat 2D physics,
 * matching 1980s retro arcade CRT aesthetics.
 */

let confettiCannon: confetti.CreateTypes | null = null;
let pixelCanvas: HTMLCanvasElement | null = null;

const RETRO_PIXEL_PALETTE = [
  '#00f0ff', // Retro Neon Cyan (I-Piece)
  '#ffe600', // Arcade Yellow (O-Piece)
  '#00ff66', // 8-Bit Neon Green (S-Piece)
  '#ff0055', // Arcade Red / Crimson (Z-Piece)
  '#ff7700', // Warm Arcade Orange (L-Piece)
  '#a855f7', // Electric Violet (T-Piece)
  '#ffffff', // Pure White Pixel Flash
];

function getOrCreatePixelCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  if (!pixelCanvas || !document.body.contains(pixelCanvas)) {
    pixelCanvas = document.createElement('canvas');
    pixelCanvas.id = 'retro-pixel-confetti-canvas';
    pixelCanvas.style.position = 'fixed';
    pixelCanvas.style.top = '0px';
    pixelCanvas.style.left = '0px';
    pixelCanvas.style.width = '100vw';
    pixelCanvas.style.height = '100vh';
    pixelCanvas.style.pointerEvents = 'none';
    pixelCanvas.style.zIndex = '150';
    // Force nearest-neighbor pixelated rendering for razor-sharp particle edges
    pixelCanvas.style.imageRendering = 'pixelated';

    const ctx = pixelCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }

    document.body.appendChild(pixelCanvas);
    confettiCannon = null; // Rebind cannon to newly created canvas
  }

  return pixelCanvas;
}

function getCannon(): confetti.CreateTypes | null {
  if (typeof window === 'undefined') return null;

  if (!confettiCannon) {
    try {
      const canvas = getOrCreatePixelCanvas();
      // useWorker: false forces main-thread requestAnimationFrame rendering,
      // avoiding OffscreenCanvas desynchronization when lines are cleared in rapid succession.
      confettiCannon = confetti.create(canvas || undefined, {
        resize: true,
        useWorker: false,
        disableForReducedMotion: true,
      });
    } catch {
      confettiCannon = null;
    }
  }

  return confettiCannon;
}

/**
 * Triggers a crisp retro pixel-art burst when one or more lines are cleared.
 * Exclusively uses flat square pixels (no circular particles, no 3D wobbling sheets).
 */
export function fireLineClearConfetti(linesCleared: number) {
  const cannon = getCannon();
  if (!cannon) return;

  const isTetris = linesCleared >= 4;

  try {
    // 1. Chunky Pixel Cubies (Primary Explosion)
    cannon({
      particleCount: Math.min(linesCleared * 18, 55),
      spread: isTetris ? 85 : 65,
      startVelocity: isTetris ? 40 : 34,
      ticks: 110, // ~1.8s snappy life
      decay: 0.91,
      gravity: 1.15,
      scalar: 1.25, // Chunky 12-14px pixel blocks
      flat: true, // Rigid 2D sprites (no 3D tilt/wobble)
      shapes: ['square'], // Strict square pixels only
      origin: { x: 0.5, y: 0.65 },
      colors: RETRO_PIXEL_PALETTE,
      zIndex: 150,
    });

    // 2. Micro Pixel Sparks (Accompanying High-Velocity Debris)
    cannon({
      particleCount: Math.min(linesCleared * 14, 40),
      spread: isTetris ? 95 : 75,
      startVelocity: isTetris ? 46 : 38,
      ticks: 85, // ~1.4s life
      decay: 0.89,
      gravity: 1.25,
      scalar: 0.65, // Sharp 6px micro pixels
      flat: true,
      shapes: ['square'],
      origin: { x: 0.5, y: 0.65 },
      colors: RETRO_PIXEL_PALETTE,
      zIndex: 150,
    });

    // 3. For a full 4-line TETRIS clear: Epic dual side-cannons
    if (isTetris) {
      // Left side pixel salvo
      cannon({
        particleCount: 25,
        angle: 60,
        spread: 45,
        startVelocity: 42,
        ticks: 90,
        decay: 0.9,
        gravity: 1.1,
        scalar: 1.1,
        flat: true,
        shapes: ['square'],
        origin: { x: 0.25, y: 0.7 },
        colors: RETRO_PIXEL_PALETTE,
        zIndex: 150,
      });

      // Right side pixel salvo
      cannon({
        particleCount: 25,
        angle: 120,
        spread: 45,
        startVelocity: 42,
        ticks: 90,
        decay: 0.9,
        gravity: 1.1,
        scalar: 1.1,
        flat: true,
        shapes: ['square'],
        origin: { x: 0.75, y: 0.7 },
        colors: RETRO_PIXEL_PALETTE,
        zIndex: 150,
      });
    }
  } catch (err) {
    console.warn('[Confetti] Failed to fire pixel burst:', err);
  }
}

/**
 * Immediately cancels any running animation and cleans up DOM canvases.
 */
export function resetConfetti() {
  if (confettiCannon) {
    try {
      confettiCannon.reset();
    } catch {
      // ignore
    }
  }

  if (pixelCanvas && pixelCanvas.parentElement) {
    try {
      pixelCanvas.remove();
    } catch {
      // ignore
    }
    pixelCanvas = null;
    confettiCannon = null;
  }
}

