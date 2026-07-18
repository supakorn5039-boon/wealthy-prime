import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Maximize2, Bed, Bath, Train, Pencil, PawPrint } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PropertyStatusBadge } from "@/components/shared/StatusBadge";
import { WishlistButton } from "@/components/WishlistButton";
import { EditPropertyDialog } from "@/components/property/EditPropertyDialog";
import { useAuthStore } from "@/store/authStore";
import { PropertyPrices } from "@/components/property/PropertyPrices";
import { formatBtsMrt } from "@/utils/btsMrt";
import { resolveImageUrl } from "@/utils/imageUrl";
import { ImageWatermark } from "@/components/property/ImageWatermark";
import type { Property } from "@/types/Property";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [editOpen, setEditOpen] = useState(false);

  const canEdit =
    !!user &&
    (user.role === "admin" ||
      (user.role === "agent" && property.agentId === user.id));

  const petAllowed = property.pets === "allowed";
  const btsMrtText = formatBtsMrt(property.btsMrt);

  return (
    <div className="group bg-card rounded-md overflow-hidden border border-border hover:border-primary/60 transition-colors">
      <Link to={`/property/${property.id}`} className="block">
        <div className="relative aspect-video bg-muted overflow-hidden">
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
              <Maximize2 className="size-10" />
            </div>
          )}

          <div className="absolute top-2 left-2">
            <PropertyStatusBadge status={property.status} />
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {petAllowed && (
              <span className="inline-flex items-center gap-1 bg-background/80 border border-primary/40 text-primary text-xs font-medium rounded-full px-2.5 py-1 backdrop-blur-sm">
                <PawPrint className="size-3" />
                Pet OK
              </span>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditOpen(true);
                }}
                title={t("common.edit")}
                className="bg-background/80 hover:bg-background border border-border rounded-full p-1.5 text-foreground hover:text-primary backdrop-blur-sm transition-colors"
              >
                <Pencil className="size-4" />
              </button>
            )}
            <WishlistButton
              propertyId={property.id}
              className="bg-background/80 hover:bg-background border border-border backdrop-blur-sm"
            />
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/property/${property.id}`} className="block">
          <h3 className="font-semibold text-foreground text-base line-clamp-1 hover:text-primary transition-colors">
            {property.projectName}
          </h3>
          <PropertyPrices property={property} size="md" className="mt-1" />
        </Link>

        <div className="flex items-center gap-1 mt-2 text-muted-foreground text-xs">
          <MapPin className="size-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        {btsMrtText && (
          <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
            <Train className="size-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{btsMrtText}</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 text-muted-foreground text-xs">
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
              <Maximize2 className="size-3.5" /> {property.sizeSqm} {t("property.sqm")}
            </span>
          )}
        </div>
      </div>

      {canEdit && editOpen && (
        <EditPropertyDialog
          property={property}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
