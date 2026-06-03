import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Maximize2, Bed, Bath, Train, Pencil, PawPrint } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PropertyStatusBadge } from "@/components/shared/StatusBadge";
import { WishlistButton } from "@/components/WishlistButton";
import { EditPropertyDialog } from "@/components/property/EditPropertyDialog";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/utils/date";
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

  const isRent = property.type === "rent";
  const petAllowed = property.pets === "allowed";

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/property/${property.id}`} className="block">
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
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
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Maximize2 className="h-10 w-10" />
            </div>
          )}

          <div className="absolute top-2 left-2">
            <PropertyStatusBadge status={property.status} />
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {petAllowed && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-medium rounded-full px-2.5 py-1">
                <PawPrint className="h-3 w-3" />
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
                className="bg-white/90 hover:bg-white rounded-full p-1.5 text-gray-700 hover:text-primary shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <WishlistButton
              propertyId={property.id}
              className="bg-white/90 hover:bg-white"
            />
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/property/${property.id}`} className="block">
          <p className="text-xl font-bold text-slate-900 break-words leading-tight">
            ฿{formatPrice(property.price).replace(/^฿/, "")}
            {isRent && (
              <span className="ml-1 text-xs font-medium text-slate-500">
                /{t("property.perMonth")}
              </span>
            )}
          </p>
          <h3 className="font-semibold text-slate-800 text-sm mt-1 line-clamp-1 hover:text-primary transition-colors">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        {property.btsMrt && (
          <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
            <Train className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{property.btsMrt}</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-slate-500 text-xs">
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
              <Maximize2 className="h-3.5 w-3.5" /> {property.sizeSqm} {t("property.sqm")}
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
