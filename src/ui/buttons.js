import { playMenuClick } from '../audio.js';

export function createPixelButton(label, { variant = '', blink = false, className = '' } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = [
    'pixel-btn',
    variant ? `pixel-btn--${variant}` : '',
    blink ? 'pixel-btn--blink' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  btn.textContent = label;

  btn.addEventListener('mousedown', () => btn.classList.add('pressed'));
  btn.addEventListener('mouseup', () => btn.classList.remove('pressed'));
  btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
  btn.addEventListener('touchstart', () => btn.classList.add('pressed'), { passive: true });
  btn.addEventListener('touchend', () => btn.classList.remove('pressed'));

  return btn;
}

export function onButtonClick(btn, handler) {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    playMenuClick();
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 100);
    handler();
  });
}
