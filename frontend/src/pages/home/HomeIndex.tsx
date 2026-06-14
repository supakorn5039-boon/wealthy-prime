import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import { formatPrice } from "@/utils/date";
import { formatBtsMrt } from "@/utils/btsMrt";
import { resolveImageUrl } from "@/utils/imageUrl";
import { cn } from "@/lib/utils";
import type { Property, PropertyListParams } from "@/types/Property";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_COLOR: Record<string, string> = {
  available: "#22c55e",
  reserved: "#f59e0b",
  pending_approve: "#6366f1",
  sold: "#ef4444",
  rented: "#64748b",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:28px;height:28px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap();
  map.flyTo(position, 15, { duration: 1 });
  return null;
}

interface PropertyRowProps {
  property: Property;
  active: boolean;
  onHover: (p: Property) => void;
}

function PropertyRow({ property, active, onHover }: PropertyRowProps) {
  const { t } = useTranslation();
  const isRent = property.type === "rent";
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
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <ImageWatermark compact />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Maximize2 className="h-8 w-8" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>

      <div className="flex-1 min-w-0 py-2 pr-3 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-bold text-primary leading-tight">
              ฿{formatPrice(property.price).replace(/^฿/, "")}
              {isRent && (
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  /{t("property.perMonth")}
                </span>
              )}
            </p>
            <h3 className="font-semibold text-foreground text-sm mt-0.5 line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {petAllowed && (
              <span className="inline-flex items-center gap-0.5 bg-background/80 border border-primary/40 text-primary text-[10px] font-medium rounded-full px-2 py-0.5 backdrop-blur-sm">
                <PawPrint className="h-2.5 w-2.5" />
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
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          {formatBtsMrt(property.btsMrt) && (
            <div className="flex items-center gap-1">
              <Train className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{formatBtsMrt(property.btsMrt)}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {property.bathrooms}
            </span>
          )}
          {property.sizeSqm != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" /> {property.sizeSqm}{" "}
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

  const mappable = filteredProperties.filter(
    (p) => p.lat != null && p.lng != null,
  );

  const hasActiveFilters = Boolean(
    filters.search || filters.kind || filters.type || filters.province ||
      filters.district || filters.minPrice || filters.maxPrice ||
      (filters.btsMrtIds && filters.btsMrtIds.length > 0),
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
            {/* List: 50% on lg+. Heading lives inside so the map column can fill its full half. */}
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

            {/* Map: 50% on lg+, sticky to viewport. Mobile shows it above the list. */}
            <div className="order-first lg:order-last">
              <div className="lg:sticky lg:top-4">
                <div className="rounded-md overflow-hidden border border-border h-[320px] lg:h-[calc(100vh-6rem)]">
                  <MapContainer
                    center={[13.7563, 100.5018]}
                    zoom={12}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {flyTarget && (
                      <FlyTo position={flyTarget} key={flyTarget.join(",")} />
                    )}
                    {mappable.map((p) => (
                      <Marker
                        key={p.id}
                        position={[p.lat!, p.lng!]}
                        icon={makeIcon(STATUS_COLOR[p.status] ?? "#6366f1")}
                        eventHandlers={{ click: () => handleMarkerClick(p) }}
                      >
                        <Popup>
                          <div className="text-sm font-medium">{p.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatPrice(p.price)}
                            {p.type === "rent" && (
                              <span className="ml-1">
                                / {t("property.perMonth")}
                              </span>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <div className="hidden lg:flex flex-wrap gap-3 mt-2 px-1">
                  {Object.entries(STATUS_COLOR).map(([status, color]) => (
                    <div
                      key={status}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: color }}
                      />
                      {t(`property.status.${status}`)}
                    </div>
                  ))}
                </div>
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
                  {selected.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-1">
                <div className="flex items-center gap-2">
                  <PropertyStatusBadge status={selected.status} />
                  <Badge variant="outline" className="text-xs capitalize">
                    {t(`property.${selected.type}`)}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(selected.price)}
                  {selected.type === "rent" && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      /{t("property.perMonth")}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{selected.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HomeIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{selected.projectName}</span>
                  </div>
                </div>
                {selected.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-primary text-primary" />
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
