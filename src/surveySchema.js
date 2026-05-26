import surveyData from '../questions.json';

const DEFAULT_LIKERT = [
  { labelAr: 'أوافق بشدة', labelEn: 'Strongly agree', value: 'strongly_agree' },
  { labelAr: 'أوافق', labelEn: 'Agree', value: 'agree' },
  { labelAr: 'محايد', labelEn: 'Neutral', value: 'neutral' },
  { labelAr: 'لا أوافق', labelEn: 'Disagree', value: 'disagree' },
  { labelAr: 'لا أوافق بشدة', labelEn: 'Strongly disagree', value: 'strongly_disagree' },
];

const SCALE_TRANSLATIONS = {
  Always: 'دائماً',
  Often: 'غالباً',
  Sometimes: 'أحياناً',
  Rarely: 'نادراً',
  Never: 'أبداً',
};

function getTextByLocale(value) {
  if (!value) return { ar: '', en: '' };
  if (typeof value === 'string') return { ar: value, en: value };
  if (typeof value === 'object') return { ar: value.ar || value.en || '', en: value.en || value.ar || '' };
  const s = String(value);
  return { ar: s, en: s };
}

function normalizeOption(option) {
  if (typeof option === 'string') {
    const labelAr = SCALE_TRANSLATIONS[option] || option;
    return { labelAr, labelEn: option, value: option };
  }
  if (option && typeof option === 'object') {
    const lbl = getTextByLocale(option.label ?? option);
    const value = option.value ?? lbl.en ?? lbl.ar;
    return { labelAr: lbl.ar, labelEn: lbl.en, value };
  }
  const fallback = String(option);
  return { labelAr: fallback, labelEn: fallback, value: fallback };
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map(normalizeOption);
}

function normalizeScale(scale) {
  if (Array.isArray(scale)) return normalizeOptions(scale);
  if (scale === 'likert_5') return DEFAULT_LIKERT;
  return [];
}

function normalizeQuestion(raw) {
  const required = raw.optional !== true;
  const qtxt = getTextByLocale(raw.question || raw.presentation?.text);

  switch (raw.type) {
    case 'intro_scene':
      return {
        id: raw.id,
        type: 'scene',
        required: false,
        textAr: qtxt.ar,
        textEn: qtxt.en,
        actionLabelAr: getTextByLocale(raw.presentation?.action).ar,
        actionLabelEn: getTextByLocale(raw.presentation?.action).en,
      };
    case 'open_world_text':
      return {
        id: raw.id,
        type: 'text',
        required,
        textAr: qtxt.ar,
        textEn: qtxt.en,
        maxLength: raw.max_length || raw.maxLength || 300,
        placeholderAr: raw.placeholder ? getTextByLocale(raw.placeholder).ar : 'اكتب إجابتك هنا...',
        placeholderEn: raw.placeholder ? getTextByLocale(raw.placeholder).en : 'Type your answer...',
      };
    case 'multi_select_mission':
      return {
        id: raw.id,
        type: 'multi',
        required,
        textAr: qtxt.ar,
        textEn: qtxt.en,
        options: normalizeOptions(raw.options),
        maxSelect: raw.max_select || raw.maxSelect || undefined,
      };
    case 'likert_scene':
    case 'frequency_slider':
      return {
        id: raw.id,
        type: 'single',
        required,
        textAr: qtxt.ar,
        textEn: qtxt.en,
        options: normalizeScale(raw.scale),
      };
    case 'single_choice':
    case 'event_choice':
    case 'scenario_choice':
    case 'reaction_test_question':
    case 'reflective_choice':
    default:
      return {
        id: raw.id,
        type: 'single',
        required,
        textAr: qtxt.ar,
        textEn: qtxt.en,
        options: normalizeOptions(raw.options),
      };
  }
}

const introScene = surveyData.questions?.find((q) => q.type === 'intro_scene');
const success = surveyData.success_screen || {};

export const COPY = {
  welcomeTagline: getTextByLocale(surveyData.survey_title),
  startButton: { ar: 'ابدأ التحدي 🚀', en: 'Start Challenge 🚀' },
  pressStart: { ar: introScene?.presentation?.action?.ar || 'PRESS START', en: introScene?.presentation?.action?.en || 'PRESS START' },
  victory: getTextByLocale(success.message),
  victoryBanner: getTextByLocale(success.text),
  continueButton: { ar: 'متابعة', en: 'Continue' },
  nextButton: { ar: 'التالي ▶', en: 'Next ▶' },
  confirmButton: { ar: 'تأكيد ✓', en: 'Confirm ✓' },
  validationError: { ar: '! اختر إجابة للمتابعة', en: 'Please select an answer' },
  saving: { ar: 'جاري الحفظ... 💾', en: 'Saving... 💾' },
  demoBanner: { ar: 'وضع تجريبي — أضف VITE_SHEETS_URL في .env', en: 'Demo mode — set VITE_SHEETS_URL' },
};

export const QUESTIONS = (surveyData.questions || []).map(normalizeQuestion).filter((q) => q?.id && (q.textAr || q.textEn));

export const TOTAL_QUESTS = QUESTIONS.length;
