import { getState, saveSoundPreference } from './state.js';

let audioCtx = null;
let musicTimer = null;
let musicStep = 0;

const NOTE_FREQ = {
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
};

const MUSIC_SEQUENCE = [
  'C4',
  null,
  'D4',
  null,
  'E4',
  null,
  'G4',
  null,
  'A4',
  null,
  'G4',
  null,
  'E4',
  null,
  'D4',
  null,
  'C4',
  null,
  'E4',
  null,
  'G4',
  null,
  'A4',
  null,
  'G4',
  null,
  'E4',
  null,
  'D4',
  null,
  'C4',
  null,
];

const BASS_SEQUENCE = [
  'C3',
  null,
  null,
  null,
  'A2',
  null,
  null,
  null,
  'F2',
  null,
  null,
  null,
  'G2',
  null,
  null,
  null,
];

const MUSIC_STEP_MS = 240;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'square', volume = 0.08, force = false) {
  if (!force && !getState().soundOn) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    /* audio unavailable */
  }
}

function beep(freq, duration, type = 'square', volume = 0.08, force = false) {
  playTone(freq, duration, type, volume, force);
}

export function playMenuClick(force = false) {
  beep(440, 0.05, 'square', 0.08, force);
}

export function playConfirm() {
  beep(523, 0.06);
  setTimeout(() => beep(659, 0.08), 60);
}

export function playCursorMove() {
  beep(330, 0.03, 'square', 0.04);
}

export function playTypingBlip() {
  beep(800, 0.012, 'square', 0.03);
}

export function playError() {
  beep(180, 0.12, 'sawtooth', 0.06);
}

function playMusicStep() {
  const note = MUSIC_SEQUENCE[musicStep % MUSIC_SEQUENCE.length];
  if (note) {
    playTone(NOTE_FREQ[note], MUSIC_STEP_MS / 1000, 'triangle', 0.03);
  }
  const bass = BASS_SEQUENCE[musicStep % BASS_SEQUENCE.length];
  if (bass) {
    playTone(NOTE_FREQ[bass], MUSIC_STEP_MS / 1000, 'square', 0.02);
  }
  musicStep += 1;
}

function startBackgroundMusic() {
  if (musicTimer) return;
  musicStep = 0;
  musicTimer = setInterval(() => {
    if (!getState().soundOn) return;
    playMusicStep();
  }, MUSIC_STEP_MS);
}

function stopBackgroundMusic() {
  if (!musicTimer) return;
  clearInterval(musicTimer);
  musicTimer = null;
}

function syncBackgroundMusic(forceState) {
  const enabled = typeof forceState === 'boolean' ? forceState : getState().soundOn;
  if (enabled) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
}

export function toggleSound() {
  const next = !getState().soundOn;
  saveSoundPreference(next);
  if (next) playMenuClick(true);
  syncBackgroundMusic(next);
  return next;
}

export function resumeAudioContext() {
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
  syncBackgroundMusic();
}
