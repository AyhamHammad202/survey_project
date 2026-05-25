import { COPY } from '../surveySchema.js';
import { IS_DEMO_MODE } from '../config.js';
import {
  getState,
  setState,
  getCurrentQuestion,
  validateCurrentQuestion,
  isLastQuest,
  nextQuest,
  goToVictory,
  startQuest,
  resetSurvey,
} from '../state.js';
import { submitToSheet } from '../sheets.js';
import { playConfirm, playError, toggleSound, resumeAudioContext } from '../audio.js';
import { launchConfetti, transitionScreen } from '../effects.js';
import { createPixelButton, onButtonClick } from './buttons.js';
import { renderProgress } from './progress.js';
import {
  createDialogueBox,
  runTypewriter,
  cancelTypewriter,
  showDialogueError,
  shakeDialogue,
} from './dialogue.js';
import {
  renderMenuOptions,
  bindMenuKeyboard,
  moveMenuFocus,
  confirmMenuFocus,
} from './menu.js';

let unbindKeyboard = null;
let questRenderToken = 0;

export function renderHeader(container) {
  const header = document.createElement('header');
  header.className = 'game-header';

  if (IS_DEMO_MODE) {
    const banner = document.createElement('div');
    banner.className = 'demo-banner';
    banner.textContent = COPY.demoBanner;
    header.appendChild(banner);
  } else {
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    header.appendChild(spacer);
  }

  const soundBtn = document.createElement('button');
  soundBtn.type = 'button';
  soundBtn.className = 'sound-toggle';
  soundBtn.setAttribute('aria-label', 'تبديل الصوت');
  const updateSoundLabel = () => {
    const on = getState().soundOn;
    soundBtn.textContent = on ? '🔊' : '🔇';
    soundBtn.classList.toggle('sound-toggle--off', !on);
  };
  updateSoundLabel();
  soundBtn.addEventListener('click', () => {
    resumeAudioContext();
    const on = toggleSound();
    setState({ soundOn: on });
    updateSoundLabel();
  });
  header.appendChild(soundBtn);

  container.appendChild(header);
}

export function renderWelcome(app, onStart) {
  if (unbindKeyboard) {
    unbindKeyboard();
    unbindKeyboard = null;
  }
  cancelTypewriter();

  const screen = document.createElement('div');
  screen.className = 'screen welcome-screen';

  const title = document.createElement('h1');
  title.className = 'welcome-title';
  title.textContent = 'PIXEL QUEST';

  const tagline = document.createElement('p');
  tagline.className = 'welcome-tagline';
  tagline.textContent = COPY.welcomeTagline;

  const press = document.createElement('p');
  press.className = 'welcome-press';
  press.textContent = COPY.pressStart;

  const startBtn = createPixelButton(COPY.startButton, { blink: true });
  onButtonClick(startBtn, () => {
    resumeAudioContext();
    onStart();
  });

  screen.appendChild(title);
  screen.appendChild(tagline);
  screen.appendChild(press);
  screen.appendChild(startBtn);

  transitionScreen(app, () => app.appendChild(screen));
}

export function renderQuest(app, { onNext, onComplete }) {
  if (unbindKeyboard) {
    unbindKeyboard();
    unbindKeyboard = null;
  }
  cancelTypewriter();

  const token = ++questRenderToken;
  const state = getState();
  const question = getCurrentQuestion();

  const screen = document.createElement('div');
  screen.className = 'screen quest-screen';

  screen.appendChild(renderProgress(state.questIndex));

  const layout = document.createElement('div');
  layout.className = 'quest-layout';

  const avatar = document.createElement('div');
  avatar.className = 'pixel-avatar';
  avatar.setAttribute('aria-hidden', 'true');

  const main = document.createElement('div');
  main.className = 'quest-main';

  const { box, questionEl, errorEl, bodyEl } = createDialogueBox();

  const refreshBody = () => {
    renderMenuOptions(question, bodyEl, () => {
      showDialogueError(errorEl, '');
      setState({ shake: false });
    });
  };

  runTypewriter(questionEl, question.text, () => {
    if (token !== questRenderToken) return;
    setState({ typewriterDone: true });
    refreshBody();
  });

  if (question.type !== 'text') {
    unbindKeyboard = bindMenuKeyboard(question, {
      onFocusChange: () => {
        if (token !== questRenderToken) return;
        refreshBody();
      },
      onChange: () => showDialogueError(errorEl, ''),
    });
  } else {
    refreshBody();
    setState({ typewriterDone: true });
  }

  main.appendChild(box);
  layout.appendChild(avatar);
  layout.appendChild(main);
  screen.appendChild(layout);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const isLast = isLastQuest();
  const btnLabel = isLast ? COPY.confirmButton : COPY.nextButton;
  const nextBtn = createPixelButton(btnLabel, { variant: isLast ? 'yellow' : '' });

  const handleNext = async () => {
    resumeAudioContext();

    if (!validateCurrentQuestion()) {
      playError();
      showDialogueError(errorEl, COPY.validationError);
      shakeDialogue(box);
      setState({ shake: true });
      return;
    }

    showDialogueError(errorEl, '');
    playConfirm();

    if (isLast) {
      nextBtn.disabled = true;
      nextBtn.textContent = COPY.saving;
      setState({ isSubmitting: true });
      try {
        await submitToSheet();
        onComplete();
      } catch (err) {
        setState({ submitError: err.message, isSubmitting: false });
        nextBtn.disabled = false;
        nextBtn.textContent = btnLabel;
        const errBox = document.createElement('div');
        errBox.className = 'submit-error';
        errBox.textContent = `${err.message} — حاول مجدداً`;
        actions.insertBefore(errBox, nextBtn);
        playError();
      }
      return;
    }

    onNext();
  };

  onButtonClick(nextBtn, handleNext);

  const skipTypewriter = () => {
    if (!getState().typewriterDone) {
      cancelTypewriter();
      questionEl.textContent = question.text;
      setState({ typewriterDone: true });
      refreshBody();
    }
  };

  box.addEventListener('click', skipTypewriter);
  questionEl.addEventListener('click', skipTypewriter);

  actions.appendChild(nextBtn);
  screen.appendChild(actions);

  transitionScreen(app, () => app.appendChild(screen));
}

export function renderVictory(app) {
  if (unbindKeyboard) {
    unbindKeyboard();
    unbindKeyboard = null;
  }
  cancelTypewriter();
  launchConfetti();

  const screen = document.createElement('div');
  screen.className = 'screen victory-screen';

  const banner = document.createElement('h1');
  banner.className = 'victory-banner';
  banner.textContent = COPY.victoryBanner;

  const text = document.createElement('p');
  text.className = 'victory-text';
  text.textContent = COPY.victory;

  const continueBtn = createPixelButton(COPY.continueButton, { variant: 'blue' });
  onButtonClick(continueBtn, () => {
    resetSurvey();
    renderWelcome(app, () => {
      startQuest();
      renderQuest(app, questHandlers(app));
    });
  });

  screen.appendChild(banner);
  screen.appendChild(text);
  screen.appendChild(continueBtn);

  transitionScreen(app, () => app.appendChild(screen));
}

export function questHandlers(app) {
  return {
    onNext: () => {
      nextQuest();
      renderQuest(app, questHandlers(app));
    },
    onComplete: () => {
      goToVictory();
      renderVictory(app);
    },
  };
}

function getContentEl() {
  return document.getElementById('game-content');
}

export function initScreens() {
  const headerEl = document.getElementById('game-header');
  const contentEl = getContentEl();
  renderHeader(headerEl);
  renderWelcome(contentEl, () => {
    startQuest();
    renderQuest(contentEl, questHandlers(contentEl));
  });
}
