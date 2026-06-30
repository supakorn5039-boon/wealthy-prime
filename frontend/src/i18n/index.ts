import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import th from './locales/th.json'
import en from './locales/en.json'
import zh from './locales/zh.json'

const savedLang = localStorage.getItem('wpe-lang') || 'th'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      th: { translation: th },
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: savedLang,
    fallbackLng: 'th',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

export default i18n
