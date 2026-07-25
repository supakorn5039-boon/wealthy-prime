import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  MapPin,
  Star,
  Home as HomeIcon,
  Bed,
  Bath,
  Maximize2,
  Train,
  PawPrint,
} from "lucide-react";
import { PropertyService } from "@/services/PropertyService";
import { PropertyStatusBadge } from "@/components/shared/StatusBadge";
import { WishlistButton } from "@/components/WishlistButton";
import { ImageWatermark } from "@/components/property/ImageWatermark";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Hero } from "@/pages/home/components/Hero";
import { PropertyFilter } from "@/components/property/PropertyFilter";
import { PageContainer } from "@/components/shared/PageContainer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyPrices } from "@/components/property/PropertyPrices";
import { formatBtsMrt } from "@/utils/btsMrt";
import { resolveImageUrl } from "@/utils/imageUrl";
import { cn } from "@/lib/utils";
import {
  FlyTo,
  MapStatusLegend,
  buildStatusIconResolver,
} from "@/components/property/propertyMap";
import type { Property, PropertyListParams } from "@/types/Property";

const iconFor = buildStatusIconResolver(28);

interface PropertyRowProps {
  property: Property;
  active: boolean;
  onHover: (p: Property) => void;
}

function PropertyRow({ property, active, onHover }: PropertyRowProps) {
  const { t, i18n } = useTranslation();
  const petAllowed = property.pets === "allowed";

  return (
    <Link
      to={`/property/${property.id}`}
      onMouseEnter={() => onHover(property)}
      className={cn(
        "group flex gap-3 bg-card rounded-md border overflow-hidden transition-all",
        active ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/60",
      )}
    >
      <div className="relative w-40 sm:w-48 h-32 sm:h-36 shrink-0 bg-muted overflow-hidden">
        {property.imageUrls?.[0] ? (
          <>
            <img
              src={resolveImageUrl(property.imageUrls[0])}
              alt={property.projectName}
              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <ImageWatermark compact />
          </>
        ) : (
          <div className="size-full flex items-center justify-center text-muted-foreground">
            <Maximize2 className="size-8" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>

      <div className="flex-1 min-w-0 py-2 pr-3 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
              {property.projectName}
            </h3>
            <PropertyPrices
              property={property}
              size="sm"
              className="mt-0.5"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {petAllowed && (
              <span className="inline-flex items-center gap-0.5 bg-background/80 border border-primary/40 text-primary text-[10px] font-medium rounded-full px-2 py-0.5 backdrop-blur-sm">
                <PawPrint className="size-2.5" />
                Pet
              </span>
            )}
            <WishlistButton
              propertyId={property.id}
              className="bg-background/80 hover:bg-background border border-border backdrop-blur-sm"
            />
          </div>
        </div>

        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
          <div className="flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          {formatBtsMrt(property.btsMrt, i18n.language) && (
            <div className="flex items-center gap-1">
              <Train className="size-3 shrink-0" />
              <span className="line-clamp-1">{formatBtsMrt(property.btsMrt, i18n.language)}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="size-3.5" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" /> {property.bathrooms}
            </span>
          )}
          {property.sizeSqm != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="size-3.5" /> {property.sizeSqm}{" "}
              {t("property.sqm")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomeIndex() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PropertyListParams>({});
  const [selected, setSelected] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.LIST, filters],
    queryFn: () => PropertyService.list(filters),
  });

  const filteredProperties = data?.data ?? [];

  const mappable = useMemo(
    () => filteredProperties.filter((p) => p.lat != null && p.lng != null),
    [filteredProperties],
  );

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.kinds?.length ||
      filters.types?.length ||
      filters.provinces?.length ||
      filters.districts?.length ||
      filters.priceRanges?.length ||
      filters.btsMrtIds?.length ||
      filters.pets?.length ||
      filters.minBedrooms != null ||
      filters.maxBedrooms != null ||
      filters.bathrooms != null ||
      filters.sizeMin != null ||
      filters.sizeMax != null ||
      filters.floorMin != null ||
      filters.floorMax != null ||
      filters.statuses?.length,
  );
  const headingKey = hasActiveFilters
    ? "home.searchResultsTitle"
    : "home.featuredTitle";

  function handleRowHover(p: Property) {
    setHovered(p.id);
    if (p.lat != null && p.lng != null) setFlyTarget([p.lat, p.lng]);
  }

  function handleMarkerClick(p: Property) {
    setSelected(p);
    setModalOpen(true);
    setHovered(p.id);
    if (p.lat != null && p.lng != null) setFlyTarget([p.lat, p.lng]);
  }

  return (
    <div>
      <Hero>
        <PropertyFilter
          initialValues={filters}
          onFilter={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        />
      </Hero>

      <PageContainer size="8xl" className="space-y-4">
        {isLoading ? (
          <LoadingSpinner text={t("common.loading")} />
        ) : filteredProperties.length === 0 ? (
          <>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-luxury uppercase">
                {t(headingKey)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("home.foundCount", { count: filteredProperties.length })}
              </p>
            </div>
            <EmptyState
              title={t("home.noResults")}
              description={t("home.tryAdjust")}
            />
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 space-y-3">
              <div className="pb-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {t(headingKey)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("home.foundCount", { count: filteredProperties.length })}
                </p>
              </div>
              {filteredProperties.map((p) => (
                <PropertyRow
                  key={p.id}
                  property={p}
                  active={hovered === p.id}
                  onHover={handleRowHover}
                />
              ))}
            </div>

            <div className="order-first lg:order-last">
              <div className="lg:sticky lg:top-4">
                <div className="isolate rounded-md overflow-hidden border border-border h-[320px] lg:h-[calc(100vh-6rem)]">
                  <MapContainer
                    center={[13.7563, 100.5018]}
                    zoom={12}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom
                    attributionControl={false}
                  >
                    <TileLayer detectRetina url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {flyTarget && (
                      <FlyTo position={flyTarget} key={flyTarget.join(",")} />
                    )}
                    {mappable.map((p) => (
                      <Marker
                        key={p.id}
                        position={[p.lat!, p.lng!]}
                        icon={iconFor(p.status)}
                        eventHandlers={{ click: () => handleMarkerClick(p) }}
                      >
                        <Popup>
                          <div className="text-sm font-medium">{p.projectName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            <PropertyPrices property={p} size="sm" />
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <MapStatusLegend className="hidden lg:flex" />
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base leading-snug pr-6">
                  {selected.projectName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-1">
                <div className="flex items-center gap-2">
                  <PropertyStatusBadge status={selected.status} />
                  <Badge variant="outline" className="text-xs capitalize">
                    {t(`property.${selected.type}`)}
                  </Badge>
                </div>
                <PropertyPrices property={selected} size="md" />
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="line-clamp-1">{selected.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HomeIcon className="size-3.5 shrink-0" />
                    <span>{selected.projectName}</span>
                  </div>
                </div>
                {selected.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="size-4 fill-primary text-primary" />
                    <span className="font-medium text-foreground">
                      {selected.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({selected.reviewCount} {t("property.reviews")})
                    </span>
                  </div>
                )}
                <Link
                  to={`/property/${selected.id}`}
                  onClick={() => setModalOpen(false)}
                >
                  <Button className="w-full mt-1">{t("map.view")} →</Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
