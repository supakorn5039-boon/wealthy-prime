import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Hero } from '@/pages/home/components/Hero'
import { PageContainer } from '@/components/shared/PageContainer'
import type { PropertyListParams, PropertyKind, PropertyType } from '@/types/Property'

type ChipKind = PropertyKind | 'premium'

export default function HomeIndex() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<PropertyListParams>({})
  const [activeKind, setActiveKind] = useState<ChipKind | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.LIST, filters],
    queryFn: () => PropertyService.list(filters),
  })

  const handleSearchChange = (search: string) =>
    setFilters((prev) => ({ ...prev, search: search || undefined }))

  const handleSearchSubmit = () => {
    // search state is already in filters; query auto-refetches via key
  }

  const handleChipClick = (kind: ChipKind) =>
    setActiveKind((prev) => (prev === kind ? '' : kind))

  const handleTypeClick = (type: PropertyType | '') =>
    setFilters((prev) => ({ ...prev, type: type === '' ? undefined : type }))

  const properties = data?.data ?? []
  const filteredProperties = useMemo(() => {
    if (!activeKind) return properties
    if (activeKind === 'premium') {
      return [...properties].sort((a, b) => b.price - a.price)
    }
    return properties.filter((p) => p.kind === activeKind)
  }, [properties, activeKind])

  const hasActiveFilters = !!filters.search || !!activeKind || !!filters.type
  const headingKey = hasActiveFilters ? 'home.searchResultsTitle' : 'home.featuredTitle'

  return (
    <div>
      <Hero
        search={filters.search ?? ''}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        activeKind={activeKind}
        onChipClick={handleChipClick}
        activeType={filters.type ?? ''}
        onTypeClick={handleTypeClick}
      />

      <PageContainer size="7xl" className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t(headingKey)}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {t('home.foundCount', { count: filteredProperties.length })}
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner text={t('common.loading')} />
        ) : filteredProperties.length === 0 ? (
          <EmptyState
            title={t('home.noResults')}
            description={t('home.tryAdjust')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
