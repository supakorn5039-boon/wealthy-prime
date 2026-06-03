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
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/60" />

      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center text-white">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-xl whitespace-pre-line">
          {t('home.heroTitle')}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-white/80 max-w-md">
          {t('home.heroSubtitle')}
        </p>

        <div className="mt-6 inline-flex items-center bg-white/10 backdrop-blur border border-white/20 rounded-full p-1 self-start">
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

        <div className="mt-4 flex items-center gap-2 bg-white rounded-full p-1.5 max-w-2xl shadow-lg">
          <Search className="h-5 w-5 ml-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={t('home.heroSearchPlaceholder')}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-sm py-2"
          />
          <button
            onClick={handleSubmit}
            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-6 py-2.5 shrink-0"
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
                  'rounded-full text-xs sm:text-sm font-medium px-4 py-1.5 border transition-colors',
                  isActive
                    ? 'bg-white text-slate-900 border-white'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
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
        'rounded-full text-sm font-semibold px-6 py-2 transition-colors',
        active ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'
      )}
    >
      {children}
    </button>
  )
}
