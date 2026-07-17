import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'luxstay_lang',
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

// Apply direction on startup
const applyDirection = (lang) => {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir  = dir;
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);
};

applyDirection(i18n.language);

i18n.on('languageChanged', applyDirection);

export default i18n;
export { applyDirection };
