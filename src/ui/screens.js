import { COPY, QUESTIONS } from "../surveySchema.js";
import { IS_DEMO_MODE } from "../config.js";
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
  toggleLang,
} from "../state.js";
import { submitToSheet } from "../sheets.js";
import {
  playConfirm,
  playError,
  toggleSound,
  resumeAudioContext,
} from "../audio.js";
import { launchConfetti, transitionScreen } from "../effects.js";
import { createPixelButton, onButtonClick } from "./buttons.js";
import { renderProgress } from "./progress.js";
import {
  createDialogueBox,
  runTypewriter,
  cancelTypewriter,
  showDialogueError,
  shakeDialogue,
} from "./dialogue.js";
import {
  renderMenuOptions,
  bindMenuKeyboard,
  moveMenuFocus,
  confirmMenuFocus,
} from "./menu.js";

let unbindKeyboard = null;
let questRenderToken = 0;

export function renderHeader(container) {
  const header = document.createElement("header");
  header.className = "game-header";

  const lang = getState().lang || "ar";
  if (IS_DEMO_MODE) {
    const banner = document.createElement("div");
    banner.className = "demo-banner";
    banner.textContent = COPY.demoBanner[lang] || "";
    header.appendChild(banner);
  } else {
    const spacer = document.createElement("div");
    spacer.style.flex = "1";
    header.appendChild(spacer);
  }

  const soundBtn = document.createElement("button");
  soundBtn.type = "button";
  soundBtn.className = "sound-toggle";
  soundBtn.setAttribute("aria-label", "تبديل الصوت");
  const updateSoundLabel = () => {
    const on = getState().soundOn;
    soundBtn.textContent = on ? "🔊" : "🔇";
    soundBtn.classList.toggle("sound-toggle--off", !on);
  };
  updateSoundLabel();
  soundBtn.addEventListener("click", () => {
    resumeAudioContext();
    const on = toggleSound();
    setState({ soundOn: on });
    updateSoundLabel();
  });
  header.appendChild(soundBtn);

  const langBtn = document.createElement("button");
  langBtn.type = "button";
  langBtn.className = "lang-toggle";
  langBtn.setAttribute("aria-label", "تبديل اللغة");
  const updateLangLabel = () => {
    const l = getState().lang || "ar";
    langBtn.textContent = l === "ar" ? "EN" : "ع";
  };
  updateLangLabel();
  langBtn.addEventListener("click", () => {
    const next = toggleLang();
    setState({ lang: next });
    updateLangLabel();
    const content = document.getElementById("game-content");
    const current = getState().screen;
    if (current === "welcome")
      renderWelcome(content, () => {
        startQuest();
        renderQuest(content, questHandlers(content));
      });
    if (current === "quest") renderQuest(content, questHandlers(content));
    if (current === "victory") renderVictory(content);
  });
  header.appendChild(langBtn);

  container.appendChild(header);
}

export function renderWelcome(app, onStart) {
  if (unbindKeyboard) {
    unbindKeyboard();
    unbindKeyboard = null;
  }
  cancelTypewriter();

  // Check for previous submission
  const STORAGE_KEY = "pixel-survey-answers"; // same as in state.js
  const backup = localStorage.getItem(STORAGE_KEY);
  let hasBackup = false;
  let backupTimestamp = null;
  if (backup) {
    try {
      const parsed = JSON.parse(backup);
      hasBackup = true;
      backupTimestamp = parsed.timestamp;
    } catch (e) {
      console.warn("Failed to parse survey backup", e);
    }
  }

  const screen = document.createElement("div");
  screen.className = "screen welcome-screen";

  const title = document.createElement("h1");
  title.className = "welcome-title";
  title.textContent = "PIXEL QUEST";

  const tagline = document.createElement("p");
  tagline.className = "welcome-tagline";
  const lang = getState().lang || "ar";
  tagline.textContent = COPY.welcomeTagline[lang];

  const press = document.createElement("p");
  press.className = "welcome-press";
  press.textContent = COPY.pressStart[lang];

  // If there is a backup, show a message
  if (hasBackup) {
    const message = document.createElement("p");
    message.className = "welcome-backup-message";
    const dateOptions = { year: "numeric", month: "short", day: "numeric" };
    const date = new Date(backupTimestamp).toLocaleDateString(
      lang,
      dateOptions,
    );
    message.textContent =
      lang === "ar"
        ? `لقد أكملت الاستبيان سابقًا في ${date}.`
        : `You previously completed the survey on ${date}.`;
    screen.appendChild(message);
  }

  const startBtnText = hasBackup
    ? lang === "ar"
      ? "إعادة التحدي 🚀"
      : "Retake Challenge 🚀"
    : COPY.startButton[lang];
  const startBtn = createPixelButton(startBtnText, { blink: true });
  onButtonClick(startBtn, () => {
    resumeAudioContext();
    if (hasBackup) {
      resetSurvey();
    }
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
  const lang = getState().lang || "ar";
  const qText =
    lang === "en"
      ? question.textEn || question.text
      : question.textAr || question.text;
  const hasMenu =
    Array.isArray(question.options) && question.options.length > 0;

  const screen = document.createElement("div");
  screen.className = "screen quest-screen";

  screen.appendChild(renderProgress(state.questIndex));

  const layout = document.createElement("div");
  layout.className = "quest-layout";

  const avatar = document.createElement("div");
  avatar.className = "pixel-avatar";
  avatar.setAttribute("aria-hidden", "true");

  const main = document.createElement("div");
  main.className = "quest-main";

  const { box, questionEl, errorEl, bodyEl } = createDialogueBox();

  const refreshBody = () => {
    renderMenuOptions(question, bodyEl, () => {
      showDialogueError(errorEl, "");
      setState({ shake: false });
    });
  };

  runTypewriter(questionEl, qText, () => {
    if (token !== questRenderToken) return;
    setState({ typewriterDone: true });
    refreshBody();
  });

  if (hasMenu) {
    unbindKeyboard = bindMenuKeyboard(question, {
      onFocusChange: () => {
        if (token !== questRenderToken) return;
        refreshBody();
      },
      onChange: () => showDialogueError(errorEl, ""),
    });
  } else {
    refreshBody();
    setState({ typewriterDone: true });
  }

  main.appendChild(box);
  layout.appendChild(avatar);
  layout.appendChild(main);
  screen.appendChild(layout);

  const actions = document.createElement("div");
  actions.className = "actions";

  const isLast = isLastQuest();
  const defaultLabel = isLast
    ? COPY.confirmButton[lang]
    : COPY.nextButton[lang];
  const actionLabel =
    question.type === "scene"
      ? lang === "en"
        ? question.actionLabelEn
        : question.actionLabelAr
      : null;
  const btnLabel = actionLabel || defaultLabel;
  const nextBtn = createPixelButton(btnLabel, {
    variant: isLast ? "yellow" : "",
  });

  const handleNext = async () => {
    resumeAudioContext();

    if (!validateCurrentQuestion()) {
      playError();
      showDialogueError(
        errorEl,
        COPY.validationError[lang] || COPY.validationError.ar,
      );
      shakeDialogue(box);
      setState({ shake: true });
      return;
    }

    showDialogueError(errorEl, "");
    playConfirm();

    if (isLast) {
      // Show review screen before submitting
      renderReview(app, async () => {
        nextBtn.disabled = true;
        nextBtn.textContent = COPY.saving[lang] || COPY.saving.ar;
        setState({ isSubmitting: true });
        try {
          await submitToSheet();
          onComplete();
        } catch (err) {
          setState({ submitError: err.message, isSubmitting: false });
          nextBtn.disabled = false;
          nextBtn.textContent = btnLabel;
          const errBox = document.createElement("div");
          errBox.className = "submit-error";
          errBox.textContent = `${err.message} — ${lang === "ar" ? "حاول مجدداً" : "try again"}`;
          actions.insertBefore(errBox, nextBtn);
          playError();
        }
      });
      return;
    }

    onNext();
  };

  onButtonClick(nextBtn, handleNext);

  const skipTypewriter = () => {
    if (!getState().typewriterDone) {
      cancelTypewriter();
      questionEl.textContent = qText;
      setState({ typewriterDone: true });
      refreshBody();
    }
  };

  box.addEventListener("click", skipTypewriter);
  questionEl.addEventListener("click", skipTypewriter);

  actions.appendChild(nextBtn);
  screen.appendChild(actions);

  transitionScreen(app, () => app.appendChild(screen));
}

export function renderReview(app, onConfirm) {
  const lang = getState().lang || "ar";
  const screen = document.createElement("div");
  screen.className = "screen review-screen";

  const title = document.createElement("h2");
  title.className = "review-title";
  title.textContent = lang === "ar" ? "راجع إجاباتك" : "Review your answers";
  screen.appendChild(title);

  const list = document.createElement("div");
  list.className = "review-list";

  const state = getState();
  const answers = state.answers || {};

  QUESTIONS.forEach((q) => {
    const row = document.createElement("div");
    row.className = "review-row";
    const qLabel = lang === "en" ? q.textEn || "" : q.textAr || "";
    const qEl = document.createElement("div");
    qEl.className = "review-q";
    qEl.textContent = qLabel;

    const aEl = document.createElement("div");
    aEl.className = "review-a";
    const val = answers[q.id];
    if (val == null || (Array.isArray(val) && val.length === 0) || val === "") {
      aEl.textContent = lang === "ar" ? "— لم يجب" : "— no answer";
    } else if (q.type === "text") {
      aEl.textContent = String(val);
    } else if (q.type === "multi") {
      const labels = (val || []).map((v) => {
        const opt = q.options.find((o) => o.value === v) || {};
        return lang === "en" ? opt.labelEn || v : opt.labelAr || v;
      });
      aEl.textContent = labels.join(" ، ");
    } else {
      const opt = (q.options || []).find((o) => o.value === val) || {};
      aEl.textContent =
        lang === "en" ? opt.labelEn || String(val) : opt.labelAr || String(val);
    }

    row.appendChild(qEl);
    row.appendChild(aEl);
    list.appendChild(row);
  });

  screen.appendChild(list);

  // // Rating
  // const ratingWrap = document.createElement("div");
  // ratingWrap.className = "review-rating";
  // const ratingLabel = document.createElement("div");
  // Rating
  const ratingWrap = document.createElement("div");
  ratingWrap.className = "review-rating";
  const ratingLabel = document.createElement("div");
  ratingLabel.className = "rating-label";
  ratingLabel.textContent =
    lang === "ar" ? "قيّم الاستبيان" : "Rate this survey";
  ratingWrap.appendChild(ratingLabel);

  const stars = document.createElement("div");
  stars.className = "rating-stars";
  const current = state.answers?.survey_rating || 0;
  for (let i = 1; i <= 5; i += 1) {
    const s = document.createElement("button");
    s.type = "button";
    s.className = "star" + (i <= current ? " on" : "");
    s.textContent = "★";
    s.addEventListener("click", () => {
      setState({ answers: { ...getState().answers, survey_rating: i } });
      // re-render review to update stars
      renderReview(app, onConfirm);
    });
    stars.appendChild(s);
  }
  ratingWrap.appendChild(stars);

  // Share section
  const shareSection = document.createElement("div");
  shareSection.className = "review-share-section";
  shareSection.style.marginTop = "20px";
  const shareBtn = createPixelButton(lang === "ar" ? "مشاركة" : "Share", {
    variant: "blue",
  });
  onButtonClick(shareBtn, async () => {
    const shareData = {
      title: lang === "ar" ? "نتيجتي في الاستبيان" : "My survey result",
      text: window.location.href,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(
        `${shareData.title} - ${shareData.url}`,
      );
      alert(lang === "ar" ? "تم نسخ رابط المشاركة" : "Share link copied");
    }
  });
  shareSection.appendChild(shareBtn);

  const actions = document.createElement("div");
  actions.className = "review-actions";
  actions.style.display = "flex";
  actions.style.gap = "12px";
  actions.style.justifyContent = "center";
  actions.style.flexWrap = "wrap";
  const confirmBtn = createPixelButton(
    COPY.confirmButton[getState().lang || "ar"] ||
      (lang === "ar" ? "تأكيد" : "Confirm"),
    { variant: "green" },
  );
  onButtonClick(confirmBtn, () => {
    onConfirm();
  });

  const editBtn = createPixelButton(lang === "ar" ? "تعديل" : "Edit", {
    variant: "blue",
  });
  onButtonClick(editBtn, () => {
    // go back to first question for editing
    setState({ screen: "quest", questIndex: 0 });
    renderQuest(app, questHandlers(app));
  });

  actions.appendChild(confirmBtn);
  actions.appendChild(editBtn);

  screen.appendChild(actions);
  screen.appendChild(shareSection);
  screen.appendChild(ratingWrap);
  screen.appendChild(shareSection);
  screen.appendChild(ratingWrap);

  transitionScreen(app, () => app.appendChild(screen));
}

export function renderVictory(app) {
  if (unbindKeyboard) {
    unbindKeyboard();
    unbindKeyboard = null;
  }
  cancelTypewriter();
  launchConfetti();

  const screen = document.createElement("div");
  screen.className = "screen victory-screen";

  const lang = getState().lang || "ar";
  const banner = document.createElement("h1");
  banner.className = "victory-banner";
  banner.textContent = COPY.victoryBanner[lang] || "";

  const text = document.createElement("p");
  text.className = "victory-text";
  text.textContent = COPY.victory[lang] || "";

  const continueBtn = createPixelButton(COPY.continueButton[lang] || "", {
    variant: "blue",
  });
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
  return document.getElementById("game-content");
}

export function initScreens() {
  const headerEl = document.getElementById("game-header");
  const contentEl = getContentEl();
  renderHeader(headerEl);
  renderWelcome(contentEl, () => {
    startQuest();
    renderQuest(contentEl, questHandlers(contentEl));
  });
}
