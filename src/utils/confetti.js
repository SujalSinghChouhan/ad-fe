import confetti from "canvas-confetti";

export function fireConfetti() {
  if (!confetti) return;
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ["#ff6b00", "#00c853", "#ffd700", "#ff4757", "#2ed573"];
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function fireSingleConfetti() {
  if (!confetti) return;
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#ff6b00", "#00c853", "#ffd700"] });
}
