import { subscribe } from './state.js';
import { initScreens } from './ui/screens.js';


function resizeConfettiCanvas() {
  const canvas = document.getElementById('confetti-canvas');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

initScreens();

subscribe(() => {
  /* reactive hook for future extensions */
});
