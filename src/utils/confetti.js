export function fireConfetti() {
  try {
    const confetti = require("canvas-confetti");
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#ff6b00", "#00c853", "#ffd700", "#ff4757", "#2ed573"];

    const frame = () => {
      confetti.default({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti.default({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  } catch (e) {
    console.log("Confetti not available");
  }
}

export function fireSingleConfetti() {
  try {
    const confetti = require("canvas-confetti");
    confetti.default({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff6b00", "#00c853", "#ffd700"],
    });
  } catch (e) {}
}
