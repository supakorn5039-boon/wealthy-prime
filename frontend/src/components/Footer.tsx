import { Link } from 'react-router-dom'
import { Crown, Phone, Mail, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/constants/Routes'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Crown className="h-5 w-5 text-amber-400" />
            <span>Wealthy Prime Estate</span>
          </div>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            {t('footer.tagline')}
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-3">{t('footer.quickLinks')}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to={ROUTES.HOME} className="hover:text-white">{t('nav.home')}</Link></li>
            <li><Link to={ROUTES.HOME} className="hover:text-white">{t('nav.search')}</Link></li>
            <li><Link to={ROUTES.MAP} className="hover:text-white">{t('nav.map')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-3">{t('footer.contact')}</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> LINE: @wealthyprime</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 02-XXX-XXXX</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@wealthyprime.com</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-3">{t('footer.forAgents')}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to={ROUTES.LOGIN} className="hover:text-white">{t('nav.login')}</Link></li>
            <li><Link to={ROUTES.REGISTER} className="hover:text-white">{t('footer.registerAgent')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {year} Wealthy Prime Estate. {t('footer.rightsReserved')}</p>
          <p>{t('footer.tagShort')}</p>
        </div>
      </div>
    </footer>
  )
}
