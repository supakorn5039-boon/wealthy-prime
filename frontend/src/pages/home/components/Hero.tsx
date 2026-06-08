import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { PropertyKind, PropertyType } from '@/types/Property'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80'

type ChipKind = PropertyKind | 'premium'

interface HeroProps {
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  activeKind: ChipKind | ''
  onChipClick: (kind: ChipKind) => void
  activeType: PropertyType | ''
  onTypeClick: (type: PropertyType | '') => void
}

const CHIPS: { kind: ChipKind; labelKey: string }[] = [
  { kind: 'condo', labelKey: 'home.chip.condo' },
  { kind: 'house', labelKey: 'home.chip.house' },
  { kind: 'townhouse', labelKey: 'home.chip.townhouse' },
  { kind: 'premium', labelKey: 'home.chip.premium' },
]

export function Hero({
  search,
  onSearchChange,
  onSearchSubmit,
  activeKind,
  onChipClick,
  activeType,
  onTypeClick,
}: HeroProps) {
  const { t } = useTranslation()
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => setLocalSearch(search), [search])

  const handleSubmit = () => {
    onSearchChange(localSearch)
    onSearchSubmit()
  }

  return (
    <section
      className="relative w-full h-[560px] bg-cover bg-center"
      style={{ backgroundImage: `url(${HERO_IMAGE})` }}
    >
      {/* Dark luxury overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background" />

      <div
        className="pointer-events-none absolute hidden lg:block border-2 border-primary top-[14%] right-[8%] w-80 h-80"
        aria-hidden
      />

      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center text-foreground">
        <span className="gold-divider mb-5" aria-hidden />
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-2xl whitespace-pre-line tracking-luxury uppercase">
          {t('home.heroTitle')}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md">
          {t('home.heroSubtitle')}
        </p>

        <div className="mt-6 inline-flex items-center bg-background/40 backdrop-blur border border-border rounded-md p-1 self-start">
          <TypeButton active={activeType === ''} onClick={() => onTypeClick('')}>
            {t('home.filterAll')}
          </TypeButton>
          <TypeButton active={activeType === 'buy'} onClick={() => onTypeClick('buy')}>
            {t('home.filterBuy')}
          </TypeButton>
          <TypeButton active={activeType === 'rent'} onClick={() => onTypeClick('rent')}>
            {t('home.filterRent')}
          </TypeButton>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-md p-1.5 max-w-2xl shadow-lg">
          <Search className="h-5 w-5 ml-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={t('home.heroSearchPlaceholder')}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm py-2"
          />
          <button
            onClick={handleSubmit}
            className="rounded-md bg-primary hover:bg-accent text-primary-foreground text-sm font-semibold px-6 py-2.5 shrink-0 tracking-luxury uppercase transition-colors"
          >
            {t('home.heroSearchCta')}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 max-w-2xl">
          {CHIPS.map((chip) => {
            const isActive = activeKind === chip.kind
            return (
              <button
                key={chip.kind}
                onClick={() => onChipClick(chip.kind)}
                className={cn(
                  'rounded-md text-xs sm:text-sm font-medium px-4 py-1.5 border transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background/40 border-border text-foreground/80 hover:bg-muted'
                )}
              >
                {t(chip.labelKey)}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md text-sm font-semibold px-6 py-2 tracking-luxury uppercase transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}
