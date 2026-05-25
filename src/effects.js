const COLORS = ["#4ade80", "#60a5fa", "#facc15", "#ef4444", "#f2f2f2"];

export function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 100,
    size: 4 + Math.floor(Math.random() * 2) * 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vy: 2 + Math.random() * 4,
    vx: (Math.random() - 0.5) * 3,
  }));

  let frame = 0;
  const maxFrames = 120;

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    });
    frame += 1;
    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  tick();
}

function mountDissolveOverlay() {
  document.querySelectorAll(".pixel-dissolve").forEach((el) => el.remove());
  const overlay = document.createElement("div");
  overlay.className = "pixel-dissolve pixel-dissolve--in";
  document.body.appendChild(overlay);
  return overlay;
}

export function transitionScreen(container, renderFn) {
  const overlay = mountDissolveOverlay();
  const current = container.querySelector(".screen");
  const inDuration = 180;
  const outDuration = 220;
  if (current) {
    current.classList.add("screen--exit");
  }

  setTimeout(() => {
    container.innerHTML = "";
    renderFn();
    overlay.classList.remove("pixel-dissolve--in");
    overlay.classList.add("pixel-dissolve--out");
    setTimeout(() => overlay.remove(), outDuration);
  }, inDuration);
}
