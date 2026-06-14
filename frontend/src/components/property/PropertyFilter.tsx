import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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

function presetIdsFromRanges(ranges?: { min?: number; max?: number }[]): string[] {
  if (!ranges) return []
  return ranges
    .map((r) => PRICE_PRESETS.find((p) => p.min === r.min && p.max === r.max)?.id)
    .filter((id): id is string => !!id)
}

// Reusable multi-select dropdown for the filter pill. Renders via portal so
// it can never be clipped or covered by sibling stacking contexts (e.g. the
// Leaflet map below the hero).
interface MultiPickProps<T extends string | number> {
  placeholder: string
  selectedCountLabel: string
  options: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
  disabled?: boolean
  cellClassName?: string
}

function MultiPick<T extends string | number>({
  placeholder,
  selectedCountLabel,
  options,
  selected,
  onToggle,
  disabled,
  cellClassName,
}: MultiPickProps<T>) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 220),
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onClick)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const triggerLabel = (() => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label ?? placeholder
    }
    return selectedCountLabel
  })()

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-14 w-full items-center justify-between px-4 text-sm font-medium hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed',
          selected.length === 0 && 'text-muted-foreground',
          cellClassName,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 1000,
          }}
          className="max-h-80 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
        >
          <div className="p-1">
            {options.map((opt) => {
              const checked = selected.includes(opt.value)
              return (
                <button
                  type="button"
                  key={String(opt.value)}
                  onClick={() => onToggle(opt.value)}
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
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export function PropertyFilter({ onFilter, initialValues }: PropertyFilterProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(initialValues?.search ?? '')
  const [types, setTypes] = useState<PropertyType[]>(initialValues?.types ?? [])
  const [kinds, setKinds] = useState<PropertyKind[]>(initialValues?.kinds ?? [])
  const [priceIds, setPriceIds] = useState<string[]>(presetIdsFromRanges(initialValues?.priceRanges))
  const [provinces, setProvinces] = useState<string[]>(initialValues?.provinces ?? [])
  const [districts, setDistricts] = useState<string[]>(initialValues?.districts ?? [])
  const [stationIds, setStationIds] = useState<number[]>(initialValues?.btsMrtIds ?? [])
  const [stationsOpen, setStationsOpen] = useState(false)
  const stationsTriggerRef = useRef<HTMLButtonElement | null>(null)
  const stationsMenuRef = useRef<HTMLDivElement | null>(null)
  const [stationsPos, setStationsPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => setTypes(initialValues?.types ?? []), [initialValues?.types])
  useEffect(() => setSearch(initialValues?.search ?? ''), [initialValues?.search])
  useEffect(() => setKinds(initialValues?.kinds ?? []), [initialValues?.kinds])
  useEffect(() => setProvinces(initialValues?.provinces ?? []), [initialValues?.provinces])
  useEffect(() => setDistricts(initialValues?.districts ?? []), [initialValues?.districts])
  useEffect(
    () => setPriceIds(presetIdsFromRanges(initialValues?.priceRanges)),
    [initialValues?.priceRanges],
  )
  useEffect(() => setStationIds(initialValues?.btsMrtIds ?? []), [initialValues?.btsMrtIds])

  useLayoutEffect(() => {
    if (!stationsOpen || !stationsTriggerRef.current) return
    const rect = stationsTriggerRef.current.getBoundingClientRect()
    setStationsPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 288,
      width: 288,
    })
  }, [stationsOpen])

  useEffect(() => {
    if (!stationsOpen) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (stationsTriggerRef.current?.contains(t)) return
      if (stationsMenuRef.current?.contains(t)) return
      setStationsOpen(false)
    }
    const onScroll = () => setStationsOpen(false)
    document.addEventListener('mousedown', onClick)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [stationsOpen])

  // Districts: union of all districts across the selected provinces.
  const districtOptions = useMemo(() => {
    if (provinces.length === 0) return [] as string[]
    const set = new Set<string>()
    for (const p of provinces) {
      for (const d of DISTRICTS_BY_PROVINCE[p] ?? []) set.add(d)
    }
    return Array.from(set)
  }, [provinces])

  // Drop selected districts that no longer belong to any selected province.
  useEffect(() => {
    setDistricts((prev) => prev.filter((d) => districtOptions.includes(d)))
  }, [districtOptions])

  const applyFilters = () => {
    const priceRanges = priceIds
      .map((id) => PRICE_PRESETS.find((p) => p.id === id))
      .filter((p): p is (typeof PRICE_PRESETS)[number] => !!p)
      .map((p) => ({ min: p.min, max: p.max }))
    onFilter({
      search: search || undefined,
      types: types.length > 0 ? types : undefined,
      kinds: kinds.length > 0 ? kinds : undefined,
      priceRanges: priceRanges.length > 0 ? priceRanges : undefined,
      provinces: provinces.length > 0 ? provinces : undefined,
      districts: districts.length > 0 ? districts : undefined,
      btsMrtIds: stationIds.length > 0 ? stationIds : undefined,
    })
  }

  const handleReset = () => {
    setSearch('')
    setTypes([])
    setKinds([])
    setPriceIds([])
    setProvinces([])
    setDistricts([])
    setStationIds([])
    onFilter({})
  }

  const hasFilters = Boolean(
    search ||
      types.length ||
      kinds.length ||
      priceIds.length ||
      provinces.length ||
      districts.length ||
      stationIds.length,
  )

  const toggle = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (value: T) =>
      setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]))

  const countLabel = (n: number) => t('home.filterSelectedCount', { count: n })

  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl">
      {/* Vertical dividers only on lg: at sm/mobile the grid wraps and divide-x would draw on partial cells. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-border">
        <MultiPick<PropertyKind>
          placeholder={t('property.kindLabel')}
          selectedCountLabel={countLabel(kinds.length)}
          options={[
            { value: 'condo', label: t('property.kind.condo') },
            { value: 'house', label: t('property.kind.house') },
            { value: 'townhouse', label: t('property.kind.townhouse') },
          ]}
          selected={kinds}
          onToggle={toggle(setKinds)}
        />

        <MultiPick<PropertyType>
          placeholder={t('home.filterType')}
          selectedCountLabel={countLabel(types.length)}
          options={[
            { value: 'buy', label: t('home.filterBuy') },
            { value: 'rent', label: t('home.filterRent') },
          ]}
          selected={types}
          onToggle={toggle(setTypes)}
        />

        <MultiPick<string>
          placeholder={t('home.priceRange')}
          selectedCountLabel={countLabel(priceIds.length)}
          options={PRICE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          selected={priceIds}
          onToggle={toggle(setPriceIds)}
        />

        <MultiPick<string>
          placeholder={t('property.province')}
          selectedCountLabel={countLabel(provinces.length)}
          options={PROVINCES.map((p) => ({ value: p, label: p }))}
          selected={provinces}
          onToggle={toggle(setProvinces)}
        />

        <MultiPick<string>
          placeholder={t('property.district')}
          selectedCountLabel={countLabel(districts.length)}
          options={districtOptions.map((d) => ({ value: d, label: d }))}
          selected={districts}
          onToggle={toggle(setDistricts)}
          disabled={provinces.length === 0}
        />

        <div className="relative">
          <button
            ref={stationsTriggerRef}
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
          {stationsOpen && stationsPos && createPortal(
            <div
              ref={stationsMenuRef}
              style={{
                position: 'absolute',
                top: stationsPos.top,
                left: stationsPos.left,
                width: stationsPos.width,
                zIndex: 1000,
              }}
              className="max-h-96 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
            >
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
                          onClick={() =>
                            setStationIds((prev) =>
                              prev.includes(station.id)
                                ? prev.filter((x) => x !== station.id)
                                : [...prev, station.id],
                            )
                          }
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
            </div>,
            document.body,
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
