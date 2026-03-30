import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import fr from './locales/fr';
import en from './locales/en';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'fr';
const supportedLanguage = ['fr', 'en'].includes(deviceLanguage) ? deviceLanguage : 'fr';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: supportedLanguage,
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
