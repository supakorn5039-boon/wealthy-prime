import { useTranslation } from "react-i18next";
import type { MapUrlStatus } from "@/hooks/useMapUrlCoords";
import type { GeocodeResult } from "@/types/Geocode";

interface MapUrlStatusHintProps {
  status: MapUrlStatus;
  source: GeocodeResult["source"] | null;
}

export function MapUrlStatusHint({ status, source }: MapUrlStatusHintProps) {
  const { t } = useTranslation();

  if (status === "resolving") {
    return (
      <p className="text-xs text-muted-foreground -mt-2">
        {t("property.resolvingMapUrl")}
      </p>
    );
  }

  if (status === "found" && source === "geocode") {
    return (
      <p className="text-xs text-amber-600 -mt-2">
        {t("property.mapUrlApprox")}
      </p>
    );
  }

  if (status === "notfound") {
    return (
      <p className="text-xs text-amber-600 -mt-2">
        {t("property.mapUrlNoCoords")}
      </p>
    );
  }

  return null;
}
