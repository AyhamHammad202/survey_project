import { playTypingBlip } from '../audio.js';
import { getState } from '../state.js';

let typewriterTimer = null;

export function cancelTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
}

export function runTypewriter(element, fullText, onComplete) {
  cancelTypewriter();
  element.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  element.appendChild(cursor);

  let i = 0;
  const speed = 28;

  typewriterTimer = setInterval(() => {
    if (getState().soundOn && i > 0 && i % 3 === 0) {
      playTypingBlip();
    }

    if (i < fullText.length) {
      const ch = document.createTextNode(fullText[i]);
      element.insertBefore(ch, cursor);
      i += 1;
    } else {
      cancelTypewriter();
      cursor.remove();
      onComplete?.();
    }
  }, speed);
}

export function createDialogueBox() {
  const box = document.createElement('div');
  box.className = 'dialogue-box';

  ['tl', 'tr', 'bl', 'br'].forEach((pos) => {
    const c = document.createElement('span');
    c.className = `dialogue-box__corner dialogue-box__corner--${pos}`;
    box.appendChild(c);
  });

  const questionEl = document.createElement('div');
  questionEl.className = 'dialogue-question';
  box.appendChild(questionEl);

  const errorEl = document.createElement('div');
  errorEl.className = 'dialogue-error';
  errorEl.hidden = true;
  box.appendChild(errorEl);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'dialogue-body';
  box.appendChild(bodyEl);

  return { box, questionEl, errorEl, bodyEl };
}

export function showDialogueError(errorEl, message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

export function shakeDialogue(box) {
  box.classList.remove('dialogue-box--shake');
  void box.offsetWidth;
  box.classList.add('dialogue-box--shake');
}
