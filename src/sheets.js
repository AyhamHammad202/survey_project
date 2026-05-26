import { SHEETS_URL, IS_DEMO_MODE } from './config.js';
import { QUESTIONS } from './surveySchema.js';
import { getState, backupAnswersLocally } from './state.js';

export function buildPayload() {
  const { answers } = getState();
  const row = { timestamp: new Date().toISOString() };
  QUESTIONS.forEach((q) => {
    const val = answers[q.id];
    if (q.type === 'multi' && Array.isArray(val)) {
      row[q.id] = val.join(' | ');
    } else {
      row[q.id] = val ?? '';
    }
  });
  // include any additional answers (e.g., survey_rating or free-form keys)
  Object.keys(answers || {}).forEach((k) => {
    if (row[k] === undefined) {
      const v = answers[k];
      if (Array.isArray(v)) row[k] = v.join(' | ');
      else row[k] = v ?? '';
    }
  });
  return row;
}

export async function submitToSheet() {
  const payload = buildPayload();
  backupAnswersLocally();
  console.log('[Pixel Survey] Submission:', payload);

  if (IS_DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, demo: true };
  }

  const res = await fetch(SHEETS_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { success: res.ok, raw: text };
  }

  if (!res.ok && !data?.success) {
    throw new Error(data?.error || 'فشل الإرسال');
  }

  return { ok: true, data };
}
