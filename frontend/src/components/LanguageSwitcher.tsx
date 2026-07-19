import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const LANGS = [
  { code: 'th', label: 'ไทย', short: 'TH' },
  { code: 'en', label: 'EN', short: 'EN' },
  { code: 'zh', label: '中文', short: 'ZH' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const change = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('wpe-lang', code)
  }

  return (
    <div className="flex items-center border border-border rounded-full px-1 py-0.5 gap-0.5 bg-card">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => change(lang.code)}
          className={cn(
            'px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
            i18n.language === lang.code
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="sm:hidden">{lang.short}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </button>
      ))}
    </div>
  )
}
