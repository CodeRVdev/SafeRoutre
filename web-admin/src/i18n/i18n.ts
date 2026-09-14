import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import filTranslations from './locales/fil.json';

const savedLanguage = localStorage.getItem('saferoute_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    fil: { translation: filTranslations },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React handles escaping automatically
  },
});

export default i18n;
