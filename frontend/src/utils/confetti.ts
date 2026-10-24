import confetti from 'canvas-confetti';

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#0A2518', '#FF4E11', '#10B981', '#3B82F6', '#F59E0B'],
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback if window or canvas isn't available
  }
}
