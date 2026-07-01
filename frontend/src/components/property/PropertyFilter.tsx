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
import type { PropertyListParams, ListingFilter, PropertyKind } from '@/types/Property'

interface PropertyFilterProps {
  onFilter: (params: PropertyListParams) => void
  initialValues?: PropertyListParams
}

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
  { id: 'lt10k', label: 'น้อยกว่า 10,000', max: 10000 },
  { id: '10k-50k', label: '10,000 - 50,000', min: 10000, max: 50000 },
  { id: '50k-100k', label: '50,000 - 100,000', min: 50000, max: 100000 },
  { id: '100k-300k', label: '100,000 - 300,000', min: 100000, max: 300000 },
  { id: 'gt300k', label: 'มากกว่า 300,000', min: 300000 },
]

function presetIdsFromRanges(ranges?: { min?: number; max?: number }[]): string[] {
  if (!ranges) return []
  return ranges
    .map((r) => PRICE_PRESETS.find((p) => p.min === r.min && p.max === r.max)?.id)
    .filter((id): id is string => !!id)
}

interface MultiPickOption<T> {
  value: T
  label: string
}
interface MultiPickGroup<T> {
  header: string
  options: MultiPickOption<T>[]
}

interface MultiPickProps<T extends string | number> {
  allLabel: string

  placeholder: string
  selectedLabel: string
  selected: T[]
  onToggle: (value: T) => void
  onClear: () => void
  options?: MultiPickOption<T>[]
  groups?: MultiPickGroup<T>[]
  disabled?: boolean
  minWidth?: number
  align?: 'left' | 'right'
}

function MultiPick<T extends string | number>({
  allLabel,
  placeholder,
  selectedLabel,
  selected,
  onToggle,
  onClear,
  options,
  groups,
  disabled,
  minWidth = 220,
  align = 'left',
}: MultiPickProps<T>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const w = Math.max(rect.width, minWidth)
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: align === 'right' ? rect.right + window.scrollX - w : rect.left + window.scrollX,
      width: w,
    })
  }, [open, align, minWidth])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const { flatOptions, filteredOptions, filteredGroups } = useMemo(() => {
    const flat = options ?? groups?.flatMap((g) => g.options) ?? []
    const q = query.trim().toLowerCase()
    const matches = (label: string) => !q || label.toLowerCase().includes(q)
    return {
      flatOptions: flat,
      filteredOptions: options?.filter((o) => matches(o.label)),
      filteredGroups: groups
        ?.map((g) => ({ header: g.header, options: g.options.filter((o) => matches(o.label)) }))
        .filter((g) => g.options.length > 0),
    }
  }, [options, groups, query])
  const triggerText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? flatOptions.find((o) => o.value === selected[0])?.label ?? placeholder
        : selectedLabel
  const allChecked = selected.length === 0

  const checkbox = (checked: boolean) => (
    <span
      className={cn(
        'size-4 rounded border flex items-center justify-center shrink-0',
        checked ? 'bg-primary border-primary' : 'border-input',
      )}
    >
      {checked && <Check className="size-3 text-primary-foreground" />}
    </span>
  )

  const renderItem = (opt: MultiPickOption<T>) => {
    const checked = selected.includes(opt.value)
    return (
      <button
        type="button"
        key={String(opt.value)}
        onClick={() => onToggle(opt.value)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left"
      >
        {checkbox(checked)}
        <span className="truncate">{opt.label}</span>
      </button>
    )
  }

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
        )}
      >
        <span className="truncate">{triggerText}</span>
        <ChevronDown className="size-4 opacity-50 shrink-0 ml-2" />
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
          className="max-h-96 overflow-hidden rounded-md border border-border bg-popover shadow-lg flex flex-col"
        >
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search')}
                className="h-8 w-full rounded border border-input bg-background pl-7 pr-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1">
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left font-medium border-b border-border/60 mb-1"
            >
              {checkbox(allChecked)}
              <span className="truncate">{allLabel}</span>
            </button>
            {filteredOptions?.map(renderItem)}
            {filteredGroups?.map((g) => (
              <div key={g.header}>
                <div className="sticky top-0 z-10 bg-popover px-3 py-1.5 text-xs font-semibold text-primary border-b border-border">
                  {g.header}
                </div>
                {g.options.map(renderItem)}
              </div>
            ))}
            {query && !filteredOptions?.length && !filteredGroups?.length && (
              <p className="px-3 py-2 text-sm text-muted-foreground">{t('common.noResults')}</p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function toggleArray<T>(prev: T[], value: T): T[] {
  return prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
}

export function PropertyFilter({ onFilter, initialValues }: PropertyFilterProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(initialValues?.search ?? '')
  const [types, setTypes] = useState<ListingFilter[]>(initialValues?.types ?? [])
  const [kinds, setKinds] = useState<PropertyKind[]>(initialValues?.kinds ?? [])
  const [priceIds, setPriceIds] = useState<string[]>(presetIdsFromRanges(initialValues?.priceRanges))
  const [provinces, setProvinces] = useState<string[]>(initialValues?.provinces ?? [])
  const [districts, setDistricts] = useState<string[]>(initialValues?.districts ?? [])
  const [stationIds, setStationIds] = useState<number[]>(initialValues?.btsMrtIds ?? [])

  const districtOptions = useMemo(() => {
    if (provinces.length === 0) return [] as string[]
    const set = new Set<string>()
    for (const p of provinces) {
      for (const d of DISTRICTS_BY_PROVINCE[p] ?? []) set.add(d)
    }
    return Array.from(set)
  }, [provinces])

  useEffect(() => {
    setDistricts((prev) => {
      const next = prev.filter((d) => districtOptions.includes(d))
      return next.length === prev.length ? prev : next
    })
  }, [districtOptions])

  const kindOptions = useMemo<MultiPickOption<PropertyKind>[]>(
    () => [
      { value: 'condo', label: t('property.kind.condo') },
      { value: 'house', label: t('property.kind.house') },
      { value: 'townhouse', label: t('property.kind.townhouse') },
    ],
    [t],
  )
  const typeOptions = useMemo<MultiPickOption<ListingFilter>[]>(
    () => [
      { value: 'sell', label: t('property.listing.sell') },
      { value: 'rent', label: t('property.listing.rent') },
      { value: 'both', label: t('property.listing.both') },
    ],
    [t],
  )
  const priceOptions = useMemo<MultiPickOption<string>[]>(
    () => PRICE_PRESETS.map((p) => ({ value: p.id, label: p.label })),
    [],
  )
  const provinceOptions = useMemo<MultiPickOption<string>[]>(
    () => PROVINCES.map((p) => ({ value: p, label: p })),
    [],
  )
  const districtOptionItems = useMemo<MultiPickOption<string>[]>(
    () => districtOptions.map((d) => ({ value: d, label: d })),
    [districtOptions],
  )
  const stationGroups = useMemo<MultiPickGroup<number>[]>(
    () =>
      STATIONS_BY_LINE.map(({ line, stations }) => ({
        header: t(`home.btsMrtLine.${line}`),
        options: stations.map((s) => ({ value: s.id, label: s.name })),
      })),
    [t],
  )

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

  const countLabel = (n: number) => t('home.filterSelectedCount', { count: n })
  const stationCountLabel = t('home.btsMrtSelected', { count: stationIds.length })
  const allLabel = t('home.filterAll')

  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl">

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-border">
        <MultiPick<PropertyKind>
          allLabel={allLabel}
          placeholder={t('home.filterLabel.kind')}
          selectedLabel={countLabel(kinds.length)}
          options={kindOptions}
          selected={kinds}
          onToggle={(v) => setKinds((p) => toggleArray(p, v))}
          onClear={() => setKinds([])}
        />
        <MultiPick<ListingFilter>
          allLabel={allLabel}
          placeholder={t('home.filterLabel.type')}
          selectedLabel={countLabel(types.length)}
          options={typeOptions}
          selected={types}
          onToggle={(v) => setTypes((p) => toggleArray(p, v))}
          onClear={() => setTypes([])}
        />
        <MultiPick<string>
          allLabel={allLabel}
          placeholder={t('home.filterLabel.price')}
          selectedLabel={countLabel(priceIds.length)}
          options={priceOptions}
          selected={priceIds}
          onToggle={(v) => setPriceIds((p) => toggleArray(p, v))}
          onClear={() => setPriceIds([])}
        />
        <MultiPick<string>
          allLabel={allLabel}
          placeholder={t('home.filterLabel.province')}
          selectedLabel={countLabel(provinces.length)}
          options={provinceOptions}
          selected={provinces}
          onToggle={(v) => setProvinces((p) => toggleArray(p, v))}
          onClear={() => setProvinces([])}
        />
        <MultiPick<string>
          allLabel={allLabel}
          placeholder={t('home.filterLabel.district')}
          selectedLabel={countLabel(districts.length)}
          options={districtOptionItems}
          selected={districts}
          onToggle={(v) => setDistricts((p) => toggleArray(p, v))}
          onClear={() => setDistricts([])}
          disabled={provinces.length === 0}
        />
        <MultiPick<number>
          allLabel={allLabel}
          placeholder={t('home.filterLabel.btsMrt')}
          selectedLabel={stationCountLabel}
          groups={stationGroups}
          selected={stationIds}
          onToggle={(v) => setStationIds((p) => toggleArray(p, v))}
          onClear={() => setStationIds([])}
          minWidth={288}
          align="right"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 p-2 border-t border-border">
        <Search className="size-4 ml-3 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          placeholder={t('home.searchPlaceholder')}
          className="flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm py-2 px-1"
        />
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="rounded-full size-9 shrink-0"
            aria-label="reset"
          >
            <X className="size-4" />
          </Button>
        )}
        <Button
          type="button"
          onClick={applyFilters}
          className="rounded-full w-full sm:w-auto px-4 sm:px-7 h-10 bg-primary hover:bg-accent text-primary-foreground tracking-luxury uppercase font-semibold shrink-0"
        >
          {t('common.search')}
        </Button>
      </div>
    </div>
  )
}
