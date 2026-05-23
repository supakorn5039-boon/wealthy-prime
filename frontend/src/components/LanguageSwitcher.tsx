import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const LANGS = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const change = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('wpe-lang', code)
  }

  return (
    <div className="flex items-center border border-gray-200 rounded-full px-1 py-0.5 gap-0.5 bg-white">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => change(lang.code)}
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs font-medium transition-all',
            i18n.language === lang.code
              ? 'bg-gray-800 text-white'
              : 'text-gray-500 hover:text-gray-800'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
