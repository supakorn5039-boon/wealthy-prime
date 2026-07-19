import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  PROVINCES,
  BTS_MRT_STATIONS,
  type BtsMrtLine,
  type BtsMrtStation,
} from '@/constants/Locations'
import type { PropertyListParams, ListingFilter, PropertyKind, PetPolicy, PropertyStatus } from '@/types/Property'

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

type Availability = 'available' | 'not_available'
type ListingChoice = 'sell' | 'rent' | 'sell_and_rent'

const DEFAULT_LISTING_CHOICE: ListingChoice = 'sell_and_rent'
const NOT_AVAILABLE_STATUSES: PropertyStatus[] = ['reserved', 'sold', 'unavailable', 'owner_update']
const BEDROOM_CHOICES = [1, 2, 3, 4, 5] as const
const BATHROOM_CHOICES = Array.from({ length: 10 }, (_, i) => i + 1)
const SHEET_BREAKPOINT = 640

function parseNum(s: string): number | undefined {
  const trimmed = s.replace(/,/g, '').trim()
  if (trimmed === '') return undefined
  const v = Number(trimmed)
  return Number.isFinite(v) && v >= 0 ? v : undefined
}

function availabilityFromStatuses(statuses?: PropertyStatus[]): Availability | undefined {
  if (!statuses || statuses.length === 0) return undefined
  if (statuses.length === 1 && statuses[0] === 'available') return 'available'
  return 'not_available'
}

function listingChoiceToTypes(choice: ListingChoice): ListingFilter[] | undefined {
  if (choice === 'sell') return ['sell']
  if (choice === 'rent') return ['rent']
  return undefined
}

function listingChoiceFromTypes(types?: ListingFilter[]): ListingChoice {
  if (!types || types.length !== 1) return DEFAULT_LISTING_CHOICE
  if (types[0] === 'sell') return 'sell'
  if (types[0] === 'rent') return 'rent'
  return DEFAULT_LISTING_CHOICE
}

function stationIdsMatching(query: string): number[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return BTS_MRT_STATIONS.filter((s) => s.name.toLowerCase().includes(q)).map((s) => s.id)
}

function toggleArray<T>(prev: T[], value: T): T[] {
  return prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
}

interface FilterOption<T> {
  value: T
  label: string
}
interface FilterGroup<T> {
  header: string
  options: FilterOption<T>[]
}

interface FilterDropdownProps {
  label: string
  active?: boolean
  minWidth?: number
  align?: 'left' | 'right'
  sheetTitle?: string
  fullWidth?: boolean
  triggerClassName?: string
  children: (close: () => void) => ReactNode
}

function FilterDropdown({
  label,
  active,
  minWidth = 240,
  align = 'left',
  sheetTitle,
  fullWidth,
  triggerClassName,
  children,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const asSheet = window.innerWidth < SHEET_BREAKPOINT
    setSheet(asSheet)
    if (asSheet) {
      setPosition(null)
      return
    }
    const rect = triggerRef.current.getBoundingClientRect()
    const width = Math.max(rect.width, minWidth)
    const desired = align === 'right' ? rect.right - width : rect.left
    const maxLeft = Math.max(8, window.innerWidth - width - 8)
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: Math.min(Math.max(desired, 8), maxLeft) + window.scrollX,
      width,
    })
  }, [open, align, minWidth])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
          fullWidth ? 'flex w-full justify-center' : 'inline-flex shrink-0',
          active
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-input text-foreground hover:bg-muted',
          triggerClassName,
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={cn('size-4 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
      </button>

      {open && sheet && createPortal(
        <div className="fixed inset-0 z-[1200] flex items-end bg-black/40">
          <div
            ref={panelRef}
            className="w-full max-h-[85vh] flex flex-col rounded-t-2xl border-t border-border bg-popover shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">{sheetTitle ?? label}</span>
              <button type="button" onClick={close} aria-label="close" className="rounded-full p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="overflow-y-auto">{children(close)}</div>
          </div>
        </div>,
        document.body,
      )}

      {open && !sheet && position && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 1200,
          }}
          className="max-h-[70vh] flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
        >
          <div className="overflow-y-auto">{children(close)}</div>
        </div>,
        document.body,
      )}
    </>
  )
}

function OptionCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'size-4 rounded border flex items-center justify-center shrink-0',
        checked ? 'bg-primary border-primary' : 'border-input',
      )}
    >
      {checked && <Check className="size-3 text-primary-foreground" />}
    </span>
  )
}

interface MultiPickPanelProps<T extends string | number> {
  allLabel: string
  selected: T[]
  onToggle: (value: T) => void
  onClear: () => void
  options?: FilterOption<T>[]
  groups?: FilterGroup<T>[]
  searchable?: boolean
}

function MultiPickPanel<T extends string | number>({
  allLabel,
  selected,
  onToggle,
  onClear,
  options,
  groups,
  searchable = true,
}: MultiPickPanelProps<T>) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const { filteredOptions, filteredGroups } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (label: string) => !q || label.toLowerCase().includes(q)
    return {
      filteredOptions: options?.filter((o) => matches(o.label)),
      filteredGroups: groups
        ?.map((g) => ({ header: g.header, options: g.options.filter((o) => matches(o.label)) }))
        .filter((g) => g.options.length > 0),
    }
  }, [options, groups, query])

  const renderItem = (opt: FilterOption<T>) => (
    <button
      type="button"
      key={String(opt.value)}
      onClick={() => onToggle(opt.value)}
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left"
    >
      <OptionCheckbox checked={selected.includes(opt.value)} />
      <span className="truncate">{opt.label}</span>
    </button>
  )

  return (
    <>
      {searchable && (
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
      )}
      <div className="p-1">
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left font-medium border-b border-border/60 mb-1"
        >
          <OptionCheckbox checked={selected.length === 0} />
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
    </>
  )
}

interface SinglePickPanelProps<T> {
  options: FilterOption<T>[]
  value: T
  onSelect: (value: T) => void
}

function SinglePickPanel<T extends string | number>({ options, value, onSelect }: SinglePickPanelProps<T>) {
  return (
    <div className="p-1">
      {options.map((opt) => (
        <button
          type="button"
          key={String(opt.value)}
          onClick={() => onSelect(opt.value)}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 rounded text-sm text-left hover:bg-muted',
            opt.value === value && 'text-primary font-medium',
          )}
        >
          <span className="truncate">{opt.label}</span>
          {opt.value === value && <Check className="size-4 shrink-0" />}
        </button>
      ))}
    </div>
  )
}

interface RangePanelProps {
  min: string
  max: string
  onMin: (value: string) => void
  onMax: (value: string) => void
}

function RangeInputs({ min, max, onMin, onMax }: RangePanelProps) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-3">
      <input
        inputMode="numeric"
        value={min}
        onChange={(e) => onMin(e.target.value)}
        placeholder={t('home.rangeMin')}
        className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <input
        inputMode="numeric"
        value={max}
        onChange={(e) => onMax(e.target.value)}
        placeholder={t('home.rangeMax')}
        className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-border/60 last:border-b-0">
      <p className="mb-2.5 text-center text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  )
}

interface ChoiceRowProps<T> {
  options: FilterOption<T>[]
  isSelected: (value: T) => boolean
  onToggle: (value: T) => void
  wrap?: boolean
}

function ChoiceRow<T extends string | number>({ options, isSelected, onToggle, wrap }: ChoiceRowProps<T>) {
  return (
    <div className={cn('flex gap-2', wrap ? 'flex-wrap justify-center' : 'justify-center')}>
      {options.map((opt) => (
        <button
          type="button"
          key={String(opt.value)}
          onClick={() => onToggle(opt.value)}
          className={cn(
            'h-10 min-w-10 flex-1 rounded-lg border px-3 text-sm font-medium transition-colors',
            isSelected(opt.value)
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-input text-foreground hover:bg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function PropertyFilter({ onFilter, initialValues }: PropertyFilterProps) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState(initialValues?.search ?? '')
  const [listingChoice, setListingChoice] = useState<ListingChoice>(
    listingChoiceFromTypes(initialValues?.types),
  )
  const [kinds, setKinds] = useState<PropertyKind[]>(initialValues?.kinds ?? [])
  const [minBedrooms, setMinBedrooms] = useState<number | undefined>(initialValues?.minBedrooms)
  const [priceMin, setPriceMin] = useState(initialValues?.priceRanges?.[0]?.min?.toString() ?? '')
  const [priceMax, setPriceMax] = useState(initialValues?.priceRanges?.[0]?.max?.toString() ?? '')
  const [bathrooms, setBathrooms] = useState<number | undefined>(initialValues?.bathrooms)
  const [sizeMin, setSizeMin] = useState(initialValues?.sizeMin?.toString() ?? '')
  const [sizeMax, setSizeMax] = useState(initialValues?.sizeMax?.toString() ?? '')
  const [floorMin, setFloorMin] = useState(initialValues?.floorMin?.toString() ?? '')
  const [floorMax, setFloorMax] = useState(initialValues?.floorMax?.toString() ?? '')
  const [availability, setAvailability] = useState<Availability | undefined>(
    availabilityFromStatuses(initialValues?.statuses),
  )
  const [provinces, setProvinces] = useState<string[]>(initialValues?.provinces ?? [])
  const [stationIds, setStationIds] = useState<number[]>(initialValues?.btsMrtIds ?? [])
  const [pets, setPets] = useState<PetPolicy[]>(initialValues?.pets ?? [])

  const listingOptions = useMemo<FilterOption<ListingChoice>[]>(
    () => [
      { value: 'sell_and_rent', label: t('property.listing.both') },
      { value: 'sell', label: t('property.listing.sell') },
      { value: 'rent', label: t('property.listing.rent') },
    ],
    [t],
  )
  const kindOptions = useMemo<FilterOption<PropertyKind>[]>(
    () => [
      { value: 'condo', label: t('property.kind.condo') },
      { value: 'house', label: t('property.kind.house') },
      { value: 'townhouse', label: t('property.kind.townhouse') },
      { value: 'land', label: t('property.kind.land') },
      { value: 'commercial', label: t('property.kind.commercial') },
    ],
    [t],
  )
  const bedroomOptions = useMemo<FilterOption<number>[]>(
    () => [
      { value: 0, label: t('home.filterAll') },
      ...BEDROOM_CHOICES.map((n) => ({ value: n, label: `${n}+` })),
    ],
    [t],
  )
  const petsOptions = useMemo<FilterOption<PetPolicy>[]>(
    () => [
      { value: 'not_allowed', label: t('property.pets.not_allowed') },
      { value: 'allowed', label: t('property.pets.allowed') },
    ],
    [t],
  )
  const availabilityOptions = useMemo<FilterOption<Availability>[]>(
    () => [
      { value: 'not_available', label: t('property.status.unavailable') },
      { value: 'available', label: t('property.status.available') },
    ],
    [t],
  )
  const bathroomOptions = useMemo<FilterOption<number>[]>(
    () => BATHROOM_CHOICES.map((n) => ({ value: n, label: String(n) })),
    [],
  )
  const provinceOptions = useMemo<FilterOption<string>[]>(
    () => PROVINCES.map((p) => ({ value: p, label: p })),
    [],
  )
  const stationGroups = useMemo<FilterGroup<number>[]>(
    () =>
      STATIONS_BY_LINE.map(({ line, stations }) => ({
        header: t(`home.btsMrtLine.${line}`),
        options: stations.map((s) => ({ value: s.id, label: s.name })),
      })),
    [t],
  )

  const applyFilters = () => {
    const query = search.trim()
    const stationIdMatches = stationIdsMatching(query)
    const priceMinValue = parseNum(priceMin)
    const priceMaxValue = parseNum(priceMax)
    const priceRanges =
      priceMinValue != null || priceMaxValue != null
        ? [{ min: priceMinValue, max: priceMaxValue }]
        : undefined
    const statuses =
      availability === 'available'
        ? (['available'] as PropertyStatus[])
        : availability === 'not_available'
          ? NOT_AVAILABLE_STATUSES
          : undefined

    onFilter({
      search: query || undefined,
      searchStationIds: stationIdMatches.length > 0 ? stationIdMatches : undefined,
      types: listingChoiceToTypes(listingChoice),
      kinds: kinds.length > 0 ? kinds : undefined,
      minBedrooms,
      priceRanges,
      bathrooms,
      sizeMin: parseNum(sizeMin),
      sizeMax: parseNum(sizeMax),
      floorMin: parseNum(floorMin),
      floorMax: parseNum(floorMax),
      statuses,
      provinces: provinces.length > 0 ? provinces : undefined,
      btsMrtIds: stationIds.length > 0 ? stationIds : undefined,
      pets: pets.length > 0 ? pets : undefined,
    })
  }

  const handleReset = () => {
    setSearch('')
    setListingChoice(DEFAULT_LISTING_CHOICE)
    setKinds([])
    setMinBedrooms(undefined)
    setPriceMin('')
    setPriceMax('')
    setBathrooms(undefined)
    setSizeMin('')
    setSizeMax('')
    setFloorMin('')
    setFloorMax('')
    setAvailability(undefined)
    setProvinces([])
    setStationIds([])
    setPets([])
    onFilter({})
  }

  const moreCount =
    (bathrooms != null ? 1 : 0) +
    (pets.length > 0 ? 1 : 0) +
    (sizeMin || sizeMax ? 1 : 0) +
    (floorMin || floorMax ? 1 : 0) +
    (availability ? 1 : 0)

  const hasFilters = Boolean(
    search ||
      listingChoice !== DEFAULT_LISTING_CHOICE ||
      kinds.length ||
      minBedrooms != null ||
      priceMin ||
      priceMax ||
      provinces.length ||
      stationIds.length ||
      moreCount > 0,
  )

  const countLabel = (n: number) => t('home.filterSelectedCount', { count: n })
  const allLabel = t('home.filterAll')

  const priceLabel = (() => {
    if (!priceMin && !priceMax) return t('home.filterLabel.price')
    const compact = (raw: string, fallback: string) => {
      const n = parseNum(raw)
      if (n == null) return fallback
      return new Intl.NumberFormat(i18n.language, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
    }
    return `${compact(priceMin, t('home.rangeMin'))} – ${compact(priceMax, t('home.rangeMax'))}`
  })()
  const bedLabel = minBedrooms != null ? `${t('home.filterLabel.bed')} ${minBedrooms}+` : t('home.filterLabel.bed')
  const provinceLabel =
    provinces.length === 0
      ? t('home.filterLabel.province')
      : provinces.length === 1
        ? provinces[0]
        : countLabel(provinces.length)
  const kindLabel =
    kinds.length === 0
      ? t('home.filterLabel.kind')
      : kinds.length === 1
        ? kindOptions.find((o) => o.value === kinds[0])?.label ?? t('home.filterLabel.kind')
        : countLabel(kinds.length)
  const stationLabel =
    stationIds.length === 0
      ? t('home.filterLabel.btsMrt')
      : t('home.btsMrtSelected', { count: stationIds.length })
  const moreLabel =
    moreCount > 0 ? `${t('home.filterMore')} (${moreCount})` : t('home.filterMore')

  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl p-2 sm:p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex flex-1 min-w-0 items-center gap-2 rounded-full border border-input bg-background px-3 h-11">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder={t('home.searchPlaceholder')}
            className="flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="reset"
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
          <FilterDropdown
            label={listingOptions.find((o) => o.value === listingChoice)?.label ?? ''}
            active={listingChoice !== DEFAULT_LISTING_CHOICE}
            align="right"
            minWidth={180}
            sheetTitle={t('home.filterLabel.type')}
            triggerClassName="h-11 flex-1 justify-center sm:flex-none sm:justify-start"
          >
            {(close) => (
              <SinglePickPanel
                options={listingOptions}
                value={listingChoice}
                onSelect={(v) => {
                  setListingChoice(v)
                  close()
                }}
              />
            )}
          </FilterDropdown>

          <Button
            type="button"
            onClick={applyFilters}
            className="rounded-full px-5 sm:px-7 h-11 flex-1 sm:flex-none bg-primary hover:bg-accent text-primary-foreground tracking-luxury uppercase font-semibold shrink-0"
          >
            {t('home.heroSearchCta')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
        <FilterDropdown label={priceLabel} active={Boolean(priceMin || priceMax)} minWidth={300} fullWidth>
          {() => (
            <PanelSection title={t('home.filterLabel.price')}>
              <RangeInputs min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax} />
            </PanelSection>
          )}
        </FilterDropdown>

        <FilterDropdown label={bedLabel} active={minBedrooms != null} minWidth={180} fullWidth>
          {(close) => (
            <SinglePickPanel
              options={bedroomOptions}
              value={minBedrooms ?? 0}
              onSelect={(v) => {
                setMinBedrooms(v === 0 ? undefined : v)
                close()
              }}
            />
          )}
        </FilterDropdown>

        <FilterDropdown label={provinceLabel} active={provinces.length > 0} minWidth={260} fullWidth>
          {() => (
            <MultiPickPanel
              allLabel={allLabel}
              options={provinceOptions}
              selected={provinces}
              onToggle={(v) => setProvinces((p) => toggleArray(p, v))}
              onClear={() => setProvinces([])}
            />
          )}
        </FilterDropdown>

        <FilterDropdown label={kindLabel} active={kinds.length > 0} minWidth={240} fullWidth>
          {() => (
            <MultiPickPanel
              allLabel={allLabel}
              options={kindOptions}
              selected={kinds}
              onToggle={(v) => setKinds((p) => toggleArray(p, v))}
              onClear={() => setKinds([])}
              searchable={false}
            />
          )}
        </FilterDropdown>

        <FilterDropdown label={stationLabel} active={stationIds.length > 0} minWidth={300} fullWidth>
          {() => (
            <MultiPickPanel
              allLabel={allLabel}
              groups={stationGroups}
              selected={stationIds}
              onToggle={(v) => setStationIds((p) => toggleArray(p, v))}
              onClear={() => setStationIds([])}
            />
          )}
        </FilterDropdown>

        <FilterDropdown
          label={moreLabel}
          active={moreCount > 0}
          fullWidth
          minWidth={360}
          align="right"
          sheetTitle={t('home.filterMore')}
        >
          {(close) => (
            <div className="flex flex-col">
              <div className="flex-1">
                <PanelSection title={t('home.filterLabel.bath')}>
                  <ChoiceRow
                    options={bathroomOptions}
                    isSelected={(v) => bathrooms === v}
                    onToggle={(v) => setBathrooms(bathrooms === v ? undefined : v)}
                    wrap
                  />
                </PanelSection>
                <PanelSection title={t('home.filterLabel.pets')}>
                  <ChoiceRow
                    options={petsOptions}
                    isSelected={(v) => pets.includes(v)}
                    onToggle={(v) => setPets((p) => toggleArray(p, v))}
                  />
                </PanelSection>
                <PanelSection title={t('home.filterLabel.size')}>
                  <RangeInputs min={sizeMin} max={sizeMax} onMin={setSizeMin} onMax={setSizeMax} />
                </PanelSection>
                <PanelSection title={t('home.filterLabel.floor')}>
                  <RangeInputs min={floorMin} max={floorMax} onMin={setFloorMin} onMax={setFloorMax} />
                </PanelSection>
                <PanelSection title={t('home.filterLabel.status')}>
                  <ChoiceRow
                    options={availabilityOptions}
                    isSelected={(v) => availability === v}
                    onToggle={(v) => setAvailability(availability === v ? undefined : v)}
                  />
                </PanelSection>
              </div>
              <div className="sticky bottom-0 border-t border-border bg-popover p-3">
                <Button
                  type="button"
                  onClick={() => {
                    applyFilters()
                    close()
                  }}
                  className="w-full h-11 rounded-lg bg-primary hover:bg-accent text-primary-foreground font-semibold"
                >
                  {t('home.filterApply')}
                </Button>
              </div>
            </div>
          )}
        </FilterDropdown>
      </div>
    </div>
  )
}
