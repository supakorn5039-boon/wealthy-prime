import { Link } from 'react-router-dom'
import { Phone, Mail, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/constants/Routes'
import { Logo } from '@/components/Logo'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-background text-muted-foreground border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Logo size={32} />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-luxury text-primary">WEALTHY PRIME</p>
              <p className="text-[10px] tracking-luxury text-muted-foreground">ESTATE CO., LTD.</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t('footer.tagline')}
          </p>
        </div>

        <div>
          <h3 className="text-foreground font-semibold text-sm mb-3 tracking-luxury uppercase">{t('footer.quickLinks')}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to={ROUTES.HOME} className="hover:text-primary transition-colors">{t('nav.home')}</Link></li>
            <li><Link to={ROUTES.HOME} className="hover:text-primary transition-colors">{t('nav.search')}</Link></li>
            <li><Link to={ROUTES.MAP} className="hover:text-primary transition-colors">{t('nav.map')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-foreground font-semibold text-sm mb-3 tracking-luxury uppercase">{t('footer.contact')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> LINE: @wealthyprime</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 02-XXX-XXXX</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@wealthyprimeestate.com</li>
          </ul>
        </div>

        <div>
          <h3 className="text-foreground font-semibold text-sm mb-3 tracking-luxury uppercase">{t('footer.forAgents')}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to={ROUTES.LOGIN} className="hover:text-primary transition-colors">{t('nav.login')}</Link></li>
            <li><Link to={ROUTES.REGISTER} className="hover:text-primary transition-colors">{t('footer.registerAgent')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <p>© {year} Wealthy Prime Estate Co., Ltd. {t('footer.rightsReserved')}</p>
          <p>{t('footer.tagShort')}</p>
        </div>
      </div>
    </footer>
  )
}
