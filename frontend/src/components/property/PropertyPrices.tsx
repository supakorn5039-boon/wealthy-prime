import { useTranslation } from "react-i18next";

import type { Property } from "@/types/Property";
import { formatPrice } from "@/utils/date";

interface PropertyPricesProps {
  property: Pick<Property, "rentPrice" | "salePrice">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const VALUE_SIZE: Record<NonNullable<PropertyPricesProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
};

export function PropertyPrices({
  property,
  size = "md",
  className,
}: PropertyPricesProps) {
  const { t } = useTranslation();

  const rows = [
    {
      key: "rent",
      label: t("property.rentPrice"),
      value: property.rentPrice,
      perMonth: true,
    },
    {
      key: "sale",
      label: t("property.salePrice"),
      value: property.salePrice,
      perMonth: false,
    },
  ];
  const ordered = [...rows].sort(
    (a, b) => Number(b.value != null) - Number(a.value != null),
  );

  return (
    <div className={className}>
      {ordered.map((row) => (
        <div key={row.key} className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {row.label}
          </span>
          <span
            className={
              row.value == null
                ? "text-sm text-muted-foreground"
                : `font-bold text-primary break-words leading-tight tracking-tight ${VALUE_SIZE[size]}`
            }
          >
            {formatPrice(row.value)}
          </span>
          {row.value != null && row.perMonth && (
            <span className="text-xs font-medium text-muted-foreground">
              /{t("property.perMonth")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
