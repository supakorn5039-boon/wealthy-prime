import { useTranslation } from 'react-i18next'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80'

interface HeroProps {
  children?: React.ReactNode
}

export function Hero({ children }: HeroProps) {
  const { t } = useTranslation()

  return (
    <section
      className="relative w-full min-h-[560px] bg-cover bg-center"
      style={{ backgroundImage: `url(${HERO_IMAGE})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background" />

      <div
        className="pointer-events-none absolute hidden lg:block border-2 border-primary top-[14%] right-[8%] w-80 h-80"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-12 flex flex-col text-foreground">
        <span className="gold-divider mb-5" aria-hidden />
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-2xl whitespace-pre-line tracking-luxury uppercase">
          {t('home.heroTitle')}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md">
          {t('home.heroSubtitle')}
        </p>

        {children && <div className="mt-10 w-full max-w-6xl mx-auto">{children}</div>}
      </div>
    </section>
  )
}
