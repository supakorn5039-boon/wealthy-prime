import { Link } from "react-router-dom";
import { MapPin, Maximize2, Star, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyStatusBadge } from "@/components/shared/StatusBadge";
import { WishlistButton } from "@/components/WishlistButton";
import { useCartStore } from "@/hooks/useCartStore";
import { formatPrice } from "@/utils/date";
import { resolveImageUrl } from "@/utils/imageUrl";
import { toast } from "sonner";
import type { Property } from "@/types/Property";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyType: property.type,
      appointmentDate: null,
    });
    openCart();
    toast.success(t("property.addedToCart"));
  };

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/property/${property.id}`}>
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          {property.imageUrls?.[0] ? (
            <img
              src={resolveImageUrl(property.imageUrls[0])}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Maximize2 className="h-10 w-10" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <PropertyStatusBadge status={property.status} />
          </div>
          <div className="absolute top-2 right-2">
            <WishlistButton
              propertyId={property.id}
              className="bg-white/80 hover:bg-white"
            />
          </div>
          <div className="absolute bottom-2 left-2">
            <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">
              {t(`property.${property.type}`)}
            </span>
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/property/${property.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-primary transition-colors">
            {property.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{property.location}</span>
        </div>
        {property.sizeSqm && (
          <div className="flex items-center gap-1 mt-0.5 text-gray-500 text-xs">
            <Maximize2 className="h-3 w-3" />
            <span>
              {property.sizeSqm} {t("property.sqm")}
            </span>
          </div>
        )}
        {property.rating !== undefined && property.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {property.rating.toFixed(1)}
            </span>
            {property.reviewCount !== undefined && (
              <span className="text-xs text-gray-400">
                ({property.reviewCount})
              </span>
            )}
          </div>
        )}
        <div className="mt-3">
          <p className="text-lg font-bold text-primary break-words">
            {formatPrice(property.price)}
            {property.type === "rent" && (
              <span className="ml-1 text-xs font-normal text-gray-500">
                / {t("property.perMonth")} ({property.rentalPeriodMonths} เดือน)
              </span>
            )}
          </p>
        </div>
        {property.status === "available" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {t("property.addToCart")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
