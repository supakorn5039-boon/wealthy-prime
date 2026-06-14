import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  PROVINCES,
  DISTRICTS_BY_PROVINCE,
  BTS_MRT_STATIONS,
  type BtsMrtLine,
  type BtsMrtStation,
} from '@/constants/Locations'
import type { PropertyListParams, PropertyType, PropertyKind } from '@/types/Property'

interface PropertyFilterProps {
  onFilter: (params: PropertyListParams) => void
  initialValues?: PropertyListParams
}

// Stations grouped by line, preserving the array order so headers render in the listing order.
const STATIONS_BY_LINE: readonly { line: BtsMrtLine; stations: readonly BtsMrtStation[] }[] = (() => {
  const order: BtsMrtLine[] = []
  const grouped = new Map<BtsMrtLine, BtsMrtStation[]>()
  for (const s of BTS_MRT_STATIONS) {
    if (!grouped.has(s.line)) {
      grouped.set(s.line, [])
      order.push(s.line)
    }
    grouped.get(s.line)!.push(s)
  }
  return order.map((line) => ({ line, stations: grouped.get(line)! }))
})()

const PRICE_PRESETS: readonly { id: string; label: string; min?: number; max?: number }[] = [
  { id: 'lt5k', label: 'น้อยกว่า 5,000', max: 5000 },
  { id: '5k-10k', label: '5,000 - 10,000', min: 5000, max: 10000 },
  { id: '10k-20k', label: '10,000 - 20,000', min: 10000, max: 20000 },
  { id: '20k-30k', label: '20,000 - 30,000', min: 20000, max: 30000 },
  { id: '30k-50k', label: '30,000 - 50,000', min: 30000, max: 50000 },
  { id: 'gt50k', label: 'มากกว่า 50,000', min: 50000 },
]

function presetIdFor(min?: number, max?: number): string {
  return PRICE_PRESETS.find((p) => p.min === min && p.max === max)?.id ?? ''
}

// Trigger styling that removes the default Select border so the dropdowns blend into the pill.
const cellTrigger =
  'h-14 w-full border-0 bg-transparent rounded-none px-4 text-sm font-medium hover:bg-muted/40 focus:ring-0 focus:ring-offset-0'

export function PropertyFilter({ onFilter, initialValues }: PropertyFilterProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(initialValues?.search ?? '')
  const [type, setType] = useState<PropertyType | ''>(initialValues?.type ?? '')
  const [kind, setKind] = useState<PropertyKind | ''>(initialValues?.kind ?? '')
  const [pricePreset, setPricePreset] = useState<string>(
    presetIdFor(initialValues?.minPrice, initialValues?.maxPrice),
  )
  const [province, setProvince] = useState(initialValues?.province ?? '')
  const [district, setDistrict] = useState(initialValues?.district ?? '')
  const [stationIds, setStationIds] = useState<number[]>(initialValues?.btsMrtIds ?? [])
  const [stationsOpen, setStationsOpen] = useState(false)

  const stationsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setType(initialValues?.type ?? ''), [initialValues?.type])
  useEffect(() => setSearch(initialValues?.search ?? ''), [initialValues?.search])
  useEffect(() => setKind(initialValues?.kind ?? ''), [initialValues?.kind])
  useEffect(() => setProvince(initialValues?.province ?? ''), [initialValues?.province])
  useEffect(() => setDistrict(initialValues?.district ?? ''), [initialValues?.district])
  useEffect(
    () => setPricePreset(presetIdFor(initialValues?.minPrice, initialValues?.maxPrice)),
    [initialValues?.minPrice, initialValues?.maxPrice],
  )
  useEffect(() => setStationIds(initialValues?.btsMrtIds ?? []), [initialValues?.btsMrtIds])

  useEffect(() => {
    if (!stationsOpen) return
    const onClick = (e: MouseEvent) => {
      if (stationsRef.current && !stationsRef.current.contains(e.target as Node)) {
        setStationsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [stationsOpen])

  const districtOptions = useMemo(
    () => (province ? DISTRICTS_BY_PROVINCE[province] ?? [] : []),
    [province],
  )

  useEffect(() => {
    if (district && !districtOptions.includes(district)) setDistrict('')
  }, [province, district])

  const applyFilters = () => {
    const preset = PRICE_PRESETS.find((p) => p.id === pricePreset)
    onFilter({
      search: search || undefined,
      type: (type as PropertyType) || undefined,
      kind: (kind as PropertyKind) || undefined,
      minPrice: preset?.min,
      maxPrice: preset?.max,
      province: province || undefined,
      district: district || undefined,
      btsMrtIds: stationIds.length > 0 ? stationIds : undefined,
    })
  }

  const handleReset = () => {
    setSearch('')
    setType('')
    setKind('')
    setPricePreset('')
    setProvince('')
    setDistrict('')
    setStationIds([])
    onFilter({})
  }

  const hasFilters = Boolean(
    search || type || kind || pricePreset || province || district || stationIds.length > 0,
  )

  const toggleStation = (id: number) => {
    setStationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl">
      {/* Vertical dividers only on lg: at sm/mobile the grid wraps and divide-x would draw on partial cells. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-border">
        <Select
          value={kind || 'all'}
          onValueChange={(v) => setKind(v === 'all' ? '' : (v as PropertyKind))}
        >
          <SelectTrigger className={cellTrigger}>
            <SelectValue placeholder={t('property.kindLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('home.filterAll')}</SelectItem>
            <SelectItem value="condo">{t('property.kind.condo')}</SelectItem>
            <SelectItem value="house">{t('property.kind.house')}</SelectItem>
            <SelectItem value="townhouse">{t('property.kind.townhouse')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={type || 'all'}
          onValueChange={(v) => setType(v === 'all' ? '' : (v as PropertyType))}
        >
          <SelectTrigger className={cellTrigger}>
            <SelectValue placeholder={t('home.filterType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('home.filterAll')}</SelectItem>
            <SelectItem value="buy">{t('home.filterBuy')}</SelectItem>
            <SelectItem value="rent">{t('home.filterRent')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={pricePreset || 'all'}
          onValueChange={(v) => setPricePreset(v === 'all' ? '' : v)}
        >
          <SelectTrigger className={cellTrigger}>
            <SelectValue placeholder={t('home.priceRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('home.filterAll')}</SelectItem>
            {PRICE_PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={province || 'all'} onValueChange={(v) => setProvince(v === 'all' ? '' : v)}>
          <SelectTrigger className={cellTrigger}>
            <SelectValue placeholder={t('property.province')} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">{t('home.filterAll')}</SelectItem>
            {PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={district || 'all'}
          onValueChange={(v) => setDistrict(v === 'all' ? '' : v)}
          disabled={!province}
        >
          <SelectTrigger className={cellTrigger}>
            <SelectValue placeholder={t('property.district')} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">{t('home.filterAll')}</SelectItem>
            {districtOptions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div ref={stationsRef} className="relative">
          <button
            type="button"
            onClick={() => setStationsOpen((v) => !v)}
            className={cn(
              'flex h-14 w-full items-center justify-between px-4 text-sm font-medium hover:bg-muted/40',
              stationIds.length === 0 && 'text-muted-foreground',
            )}
          >
            <span className="truncate">
              {stationIds.length === 0
                ? t('home.btsMrtPlaceholder')
                : t('home.btsMrtSelected', { count: stationIds.length })}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
          </button>
          {stationsOpen && (
            <div className="absolute right-0 z-50 mt-1 w-72 max-h-96 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
              {STATIONS_BY_LINE.map(({ line, stations }) => (
                <div key={line}>
                  <div className="sticky top-0 z-10 bg-popover px-3 py-1.5 text-xs font-semibold text-primary border-b border-border">
                    {t(`home.btsMrtLine.${line}`)}
                  </div>
                  <div className="p-1">
                    {stations.map((station) => {
                      const checked = stationIds.includes(station.id)
                      return (
                        <button
                          type="button"
                          key={station.id}
                          onClick={() => toggleStation(station.id)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left"
                        >
                          <span
                            className={cn(
                              'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                              checked ? 'bg-primary border-primary' : 'border-input',
                            )}
                          >
                            {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                          </span>
                          <span className="truncate">{station.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 border-t border-border">
        <Search className="h-4 w-4 ml-3 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          placeholder={t('home.searchPlaceholder')}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm py-2 px-1"
        />
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="rounded-full h-9 w-9 shrink-0"
            aria-label="reset"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          onClick={applyFilters}
          className="rounded-full px-7 h-10 bg-primary hover:bg-accent text-primary-foreground tracking-luxury uppercase font-semibold shrink-0"
        >
          {t('common.search')}
        </Button>
      </div>
    </div>
  )
}
