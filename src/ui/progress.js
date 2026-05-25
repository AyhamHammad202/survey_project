import { TOTAL_QUESTS } from '../surveySchema.js';

export function renderProgress(questIndex) {
  const wrap = document.createElement('div');
  wrap.className = 'progress-hud';

  const label = document.createElement('div');
  label.className = 'progress-label';
  label.textContent = `QUEST ${questIndex + 1} / ${TOTAL_QUESTS}`;

  const gems = document.createElement('div');
  gems.className = 'progress-gems';
  gems.setAttribute('aria-hidden', 'true');
  const gemCount = 5;
  const filled = Math.max(1, Math.ceil(((questIndex + 1) / TOTAL_QUESTS) * gemCount));
  for (let i = 0; i < gemCount; i += 1) {
    const gem = document.createElement('span');
    gem.className = 'progress-gem';
    if (i < filled) gem.classList.add('progress-gem--on');
    gems.appendChild(gem);
  }

  const bar = document.createElement('div');
  bar.className = 'hp-bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuenow', String(questIndex + 1));
  bar.setAttribute('aria-valuemin', '1');
  bar.setAttribute('aria-valuemax', String(TOTAL_QUESTS));

  const fill = document.createElement('div');
  fill.className = 'hp-bar__fill';
  const pct = ((questIndex + 1) / TOTAL_QUESTS) * 100;
  fill.style.width = `${pct}%`;

  bar.appendChild(fill);
  wrap.appendChild(label);
  wrap.appendChild(gems);
  wrap.appendChild(bar);
  return wrap;
}
