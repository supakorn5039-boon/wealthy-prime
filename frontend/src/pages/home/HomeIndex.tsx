import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { PropertyFilter } from '@/components/property/PropertyFilter'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import type { PropertyListParams } from '@/types/Property'

export default function HomeIndex() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<PropertyListParams>({})

  const { data, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.LIST, filters],
    queryFn: () => PropertyService.list(filters),
  })

  const handleFilter = useCallback((params: PropertyListParams) => {
    setFilters(params)
  }, [])

  const properties = data?.data ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageTitle
        title={t('home.title')}
        subtitle={t('home.subtitle')}
      />

      <PropertyFilter onFilter={handleFilter} initialValues={filters} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : properties.length === 0 ? (
        <EmptyState
          title={t('home.noResults')}
          description={t('home.tryAdjust')}
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">{t('home.foundCount', { count: data?.meta?.total ?? properties.length })}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
