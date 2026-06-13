import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search, SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  PROVINCES,
  DISTRICTS_BY_PROVINCE,
  BTS_MRT_STATIONS,
  type BtsMrtLine,
} from '@/constants/Locations'
import type { PropertyListParams, PropertyType, PropertyKind } from '@/types/Property'

interface PropertyFilterProps {
  onFilter: (params: PropertyListParams) => void
  initialValues?: PropertyListParams
}

// Derived from the typed station list — stays in sync if new lines are added.
const LINES: readonly BtsMrtLine[] = Array.from(
  new Set(BTS_MRT_STATIONS.map((s) => s.line)),
)

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
  const [lines, setLines] = useState<BtsMrtLine[]>([])
  const [linesOpen, setLinesOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const linesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setType(initialValues?.type ?? ''), [initialValues?.type])
  useEffect(() => setSearch(initialValues?.search ?? ''), [initialValues?.search])
  useEffect(() => setKind(initialValues?.kind ?? ''), [initialValues?.kind])
  useEffect(() => setProvince(initialValues?.province ?? ''), [initialValues?.province])
  useEffect(() => setDistrict(initialValues?.district ?? ''), [initialValues?.district])
  useEffect(
    () => setPricePreset(presetIdFor(initialValues?.minPrice, initialValues?.maxPrice)),
    [initialValues?.minPrice, initialValues?.maxPrice],
  )

  // Close the BTS dropdown when clicking outside.
  useEffect(() => {
    if (!linesOpen) return
    const onClick = (e: MouseEvent) => {
      if (linesRef.current && !linesRef.current.contains(e.target as Node)) setLinesOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [linesOpen])

  const districtOptions = useMemo(
    () => (province ? DISTRICTS_BY_PROVINCE[province] ?? [] : []),
    [province],
  )

  useEffect(() => {
    if (district && !districtOptions.includes(district)) setDistrict('')
  }, [province, districtOptions, district])

  // Expand selected lines → station IDs for the wire param.
  const btsMrtIds = useMemo(
    () =>
      lines.length === 0
        ? []
        : BTS_MRT_STATIONS.filter((s) => lines.includes(s.line)).map((s) => s.id),
    [lines],
  )

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
      btsMrtIds: btsMrtIds.length > 0 ? btsMrtIds : undefined,
    })
  }

  const handleReset = () => {
    setSearch('')
    setType('')
    setKind('')
    setPricePreset('')
    setProvince('')
    setDistrict('')
    setLines([])
    onFilter({})
  }

  const hasFilters =
    search || type || kind || pricePreset || province || district || lines.length > 0

  const toggleLine = (line: BtsMrtLine) => {
    setLines((prev) => (prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]))
  }

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="pl-9"
          />
        </div>
        <Button onClick={applyFilters}>{t('common.search')}</Button>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t">
          {/* Property kind */}
          <Select
            value={kind || 'all'}
            onValueChange={(v) => setKind(v === 'all' ? '' : (v as PropertyKind))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('property.kindLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('home.filterAll')}</SelectItem>
              <SelectItem value="condo">{t('property.kind.condo')}</SelectItem>
              <SelectItem value="house">{t('property.kind.house')}</SelectItem>
              <SelectItem value="townhouse">{t('property.kind.townhouse')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Listing buy/rent */}
          <Select
            value={type || 'all'}
            onValueChange={(v) => setType(v === 'all' ? '' : (v as PropertyType))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('home.filterType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('home.filterAll')}</SelectItem>
              <SelectItem value="buy">{t('home.filterBuy')}</SelectItem>
              <SelectItem value="rent">{t('home.filterRent')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Price range preset */}
          <Select
            value={pricePreset || 'all'}
            onValueChange={(v) => setPricePreset(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
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

          {/* Province */}
          <Select
            value={province || 'all'}
            onValueChange={(v) => setProvince(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
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

          {/* District */}
          <Select
            value={district || 'all'}
            onValueChange={(v) => setDistrict(v === 'all' ? '' : v)}
            disabled={!province}
          >
            <SelectTrigger>
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

          {/* BTS / MRT line multi-select — custom popover */}
          <div ref={linesRef} className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinesOpen((v) => !v)}
              className={cn('w-full justify-start font-normal', lines.length === 0 && 'text-muted-foreground')}
            >
              {lines.length === 0
                ? t('home.btsMrtPlaceholder')
                : t('home.btsMrtSelected', { count: lines.length })}
            </Button>
            {linesOpen && (
              <div className="absolute z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-md">
                {LINES.map((line) => {
                  const checked = lines.includes(line)
                  return (
                    <button
                      type="button"
                      key={line}
                      onClick={() => toggleLine(line)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left"
                    >
                      <span
                        className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center',
                          checked ? 'bg-primary border-primary' : 'border-input',
                        )}
                      >
                        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                      </span>
                      <span>{t(`home.btsMrtLine.${line}`)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
