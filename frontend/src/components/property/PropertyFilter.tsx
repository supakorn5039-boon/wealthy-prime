import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PropertyListParams, PropertyType } from '@/types/Property'

interface PropertyFilterProps {
  onFilter: (params: PropertyListParams) => void
  initialValues?: PropertyListParams
}

export function PropertyFilter({ onFilter, initialValues }: PropertyFilterProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(initialValues?.search ?? '')
  const [type, setType] = useState<PropertyType | ''>(initialValues?.type ?? '')
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice?.toString() ?? '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Keep inputs in sync when filters are updated externally (e.g. Buy/Rent quick toggle on Home).
  useEffect(() => setType(initialValues?.type ?? ''), [initialValues?.type])
  useEffect(() => setSearch(initialValues?.search ?? ''), [initialValues?.search])
  useEffect(() => setMinPrice(initialValues?.minPrice?.toString() ?? ''), [initialValues?.minPrice])
  useEffect(() => setMaxPrice(initialValues?.maxPrice?.toString() ?? ''), [initialValues?.maxPrice])

  const handleApply = () => {
    onFilter({
      search: search || undefined,
      type: (type as PropertyType) || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    })
  }

  const handleReset = () => {
    setSearch('')
    setType('')
    setMinPrice('')
    setMaxPrice('')
    onFilter({})
  }

  const hasFilters = search || type || minPrice || maxPrice

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleApply}>{t('common.search')}</Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={showAdvanced ? 'bg-muted' : ''}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
          <Select value={type} onValueChange={(v) => setType(v as PropertyType | '')}>
            <SelectTrigger>
              <SelectValue placeholder={t('home.filterType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('home.filterAll')}</SelectItem>
              <SelectItem value="buy">{t('home.filterBuy')}</SelectItem>
              <SelectItem value="rent">{t('home.filterRent')}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={t('home.minPrice')}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            type="number"
            placeholder={t('home.maxPrice')}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
