import surveyData from '../questions.json';

const DEFAULT_LIKERT = [
  { label: 'أوافق بشدة', value: 'strongly_agree' },
  { label: 'أوافق', value: 'agree' },
  { label: 'محايد', value: 'neutral' },
  { label: 'لا أوافق', value: 'disagree' },
  { label: 'لا أوافق بشدة', value: 'strongly_disagree' },
];

const SCALE_TRANSLATIONS = {
  Always: 'دائماً',
  Often: 'غالباً',
  Sometimes: 'أحياناً',
  Rarely: 'نادراً',
  Never: 'أبداً',
};

function getArabicText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.ar || value.en || '';
  }
  return String(value);
}

function normalizeOption(option) {
  if (typeof option === 'string') {
    const label = SCALE_TRANSLATIONS[option] || option;
    return { label, value: option };
  }
  if (option && typeof option === 'object') {
    const label = getArabicText(option.label ?? option);
    const value = option.value ?? label;
    return { label, value };
  }
  const fallback = String(option);
  return { label: fallback, value: fallback };
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
  const questionText = getArabicText(raw.question || raw.presentation?.text);

  switch (raw.type) {
    case 'intro_scene':
      return {
        id: raw.id,
        type: 'scene',
        required: false,
        text: getArabicText(raw.presentation?.text || raw.question),
        actionLabel: raw.presentation?.action || '',
      };
    case 'open_world_text':
      return {
        id: raw.id,
        type: 'text',
        required,
        text: questionText,
        maxLength: raw.max_length || 300,
        placeholder: 'اكتب إجابتك هنا...',
      };
    case 'multi_select_mission':
      return {
        id: raw.id,
        type: 'multi',
        required,
        text: questionText,
        options: normalizeOptions(raw.options),
        maxSelect: raw.max_select || undefined,
      };
    case 'likert_scene':
    case 'frequency_slider':
      return {
        id: raw.id,
        type: 'single',
        required,
        text: questionText,
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
        text: questionText,
        options: normalizeOptions(raw.options),
      };
  }
}

const introScene = surveyData.questions?.find((q) => q.type === 'intro_scene');
const success = surveyData.success_screen || {};

export const COPY = {
  welcomeTagline: getArabicText(surveyData.survey_title) ||
    'لعبتَ آلاف الساعات.. فماذا علمتك الحياة الرقمية؟ 🎮',
  startButton: 'ابدأ التحدي 🚀',
  pressStart: introScene?.presentation?.action || 'PRESS START',
  victory: getArabicText(success.message) || 'تم تسجيل إجاباتك بنجاح! 🏆',
  victoryBanner: getArabicText(success.text) || 'VICTORY',
  continueButton: 'CONTINUE',
  nextButton: 'التالي ▶',
  confirmButton: 'تأكيد ✓',
  validationError: '! اختر إجابة للمتابعة',
  saving: 'جاري الحفظ... 💾',
  demoBanner: 'وضع تجريبي — أضف VITE_SHEETS_URL في .env',
};

export const QUESTIONS = (surveyData.questions || [])
  .map(normalizeQuestion)
  .filter((q) => q?.id && q?.text);

export const TOTAL_QUESTS = QUESTIONS.length;
