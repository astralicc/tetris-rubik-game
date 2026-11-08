import confetti from 'canvas-confetti';

/**
 * Dedicated, crash-proof confetti controller.
 * Disables Web Workers (useWorker: false) to prevent the well-known canvas-confetti
 * bug where rapid concurrent triggers freeze particles on an OffscreenCanvas.
 */

let confettiCannon: confetti.CreateTypes | null = null;

function getCannon(): confetti.CreateTypes | null {
  if (typeof window === 'undefined') return null;

  if (!confettiCannon) {
    try {
      // useWorker: false forces main-thread requestAnimationFrame rendering,
      // avoiding OffscreenCanvas desynchronization when lines are cleared in rapid succession.
      confettiCannon = confetti.create(undefined, {
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
 * Triggers a crisp retro celebration burst when one or more lines are cleared.
 */
export function fireLineClearConfetti(linesCleared: number) {
  const cannon = getCannon();
  if (!cannon) return;

  const count = Math.min(linesCleared * 25, 75);

  try {
    cannon({
      particleCount: count,
      spread: 65,
      startVelocity: 35,
      ticks: 120, // ~2 seconds life so particles don't accumulate during rapid drops
      decay: 0.92,
      gravity: 1.1,
      origin: { x: 0.5, y: 0.65 },
      colors: [
        '#06b6d4', // Cyan
        '#eab308', // Yellow
        '#22c55e', // Emerald Green
        '#a855f7', // Purple
        '#ef4444', // Red
        '#ec4899', // Pink
      ],
      zIndex: 100,
    });
  } catch (err) {
    // Graceful fallback if graphics context is briefly unavailable
    console.warn('[Confetti] Failed to fire burst:', err);
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

  // Double check and remove any orphaned canvas-confetti elements if present
  if (typeof document !== 'undefined') {
    try {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach((c) => {
        // canvas-confetti creates canvases with pointer-events: none and fixed position
        if (
          c.style.position === 'fixed' &&
          c.style.pointerEvents === 'none' &&
          c.style.zIndex === '100'
        ) {
          c.remove();
        }
      });
    } catch {
      // ignore
    }
  }
}
