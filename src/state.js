import { QUESTIONS, TOTAL_QUESTS } from './surveySchema.js';

const STORAGE_KEY = 'pixel-survey-answers';
const SOUND_KEY = 'pixel-survey-sound';

export function loadSoundPreference() {
  const stored = localStorage.getItem(SOUND_KEY);
  return stored === null ? true : stored === 'true';
}

export function saveSoundPreference(on) {
  localStorage.setItem(SOUND_KEY, String(on));
}

export function createInitialState() {
  return {
    screen: 'welcome',
    questIndex: 0,
    answers: {},
    soundOn: loadSoundPreference(),
    menuFocus: 0,
    typewriterDone: false,
    isSubmitting: false,
    submitError: null,
    shake: false,
  };
}

let state = createInitialState();
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

export function setState(partial) {
  state = { ...state, ...partial };
  emit();
}

export function resetSurvey() {
  state = createInitialState();
  emit();
}

export function getCurrentQuestion() {
  return QUESTIONS[state.questIndex];
}

export function getAnswer(id) {
  return state.answers[id];
}

export function setAnswer(id, value) {
  setState({
    answers: { ...state.answers, [id]: value },
    submitError: null,
  });
}

export function validateCurrentQuestion() {
  const q = getCurrentQuestion();
  const answer = state.answers[q.id];

  if (!q.required) return true;

  if (q.type === 'text') return true;

  if (q.type === 'multi') {
    return Array.isArray(answer) && answer.length > 0;
  }

  return answer !== undefined && answer !== null && answer !== '';
}

export function validateAllRequired() {
  return QUESTIONS.every((q) => {
    if (!q.required) return true;
    const answer = state.answers[q.id];
    if (q.type === 'multi') return Array.isArray(answer) && answer.length > 0;
    if (q.type === 'text') return true;
    return answer !== undefined && answer !== '';
  });
}

export function goToWelcome() {
  setState({ screen: 'welcome', questIndex: 0, menuFocus: 0, typewriterDone: false });
}

export function startQuest() {
  setState({
    screen: 'quest',
    questIndex: 0,
    menuFocus: 0,
    typewriterDone: false,
    shake: false,
  });
}

export function goToVictory() {
  setState({ screen: 'victory', isSubmitting: false, submitError: null });
}

export function nextQuest() {
  if (state.questIndex >= TOTAL_QUESTS - 1) return false;
  setState({
    questIndex: state.questIndex + 1,
    menuFocus: 0,
    typewriterDone: false,
    shake: false,
  });
  return true;
}

export function isLastQuest() {
  return state.questIndex >= TOTAL_QUESTS - 1;
}

export function backupAnswersLocally() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      answers: state.answers,
    })
  );
}
