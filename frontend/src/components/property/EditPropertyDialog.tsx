import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PropertyService } from "@/services/PropertyService";
import { AdminService } from "@/services/AdminService";
import { FormInput } from "@/components/form/FormInput";
import { FormPhoneInput } from "@/components/form/FormPhoneInput";
import { FormPriceInput } from "@/components/form/FormPriceInput";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextarea } from "@/components/form/FormTextarea";
import { FormCombobox } from "@/components/form/FormCombobox";
import { FormMultiSelect } from "@/components/form/FormMultiSelect";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { propertySchema, type PropertySchema } from "@/dto/PropertyValidation";
import { resolveImageUrl } from "@/utils/imageUrl";
import type { Property } from "@/types/Property";
import {
  PROVINCES,
  DISTRICTS_BY_PROVINCE,
  BTS_MRT_OPTIONS,
} from "@/constants/Locations";
import { usePropertyOptions } from "@/hooks/usePropertyOptions";
import { useMapUrlCoords } from "@/hooks/useMapUrlCoords";
import { MapUrlStatusHint } from "@/components/property/MapUrlStatusHint";

interface Props {
  property: Property;
  open: boolean;
  onClose: () => void;
}

export function EditPropertyDialog({ property, open, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    kindOptions,
    listingOptions,
    petsOptions,
    furnitureOptions,
  } = usePropertyOptions();
  const provinceOptions = PROVINCES.map((p) => ({ value: p, label: p }));

  const { control, handleSubmit, setValue, getValues } =
    useForm<PropertySchema>({
      resolver: zodResolver(propertySchema),
      defaultValues: {
        projectName: property.projectName,
        location: property.location,
        price: String(property.price),
        sizeSqm: property.sizeSqm ? String(property.sizeSqm) : "",
        ownerInfo: property.ownerInfo,
        ownerExtraDetail: "",
        lat: property.lat != null ? String(property.lat) : "",
        lng: property.lng != null ? String(property.lng) : "",

        kind: (property.kind || "condo") as PropertySchema["kind"],
        listing: (property.listing || "rent") as PropertySchema["listing"],
        province: property.province ?? "",
        district: property.district ?? "",
        googleMapUrl: property.googleMapUrl ?? "",
        btsMrt: (property.btsMrt ?? []).join(", "),
        bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
        bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
        floor: property.floor != null ? String(property.floor) : "",
        minContract:
          property.minContract != null ? String(property.minContract) : "12",
        pets: (property.pets || "") as PropertySchema["pets"],
        furniture: (property.furniture || "") as PropertySchema["furniture"],
        adCaption: property.adCaption ?? "",

        ownerName: property.ownerName ?? "",
        ownerPhone: property.ownerPhone ?? "",
        ownerLineId: property.ownerLineId ?? "",
        ownerEmail: property.ownerEmail ?? "",
        ownerFacebook: property.ownerFacebook ?? "",
        ownerWechat: property.ownerWechat ?? "",
        ownerWhatsapp: property.ownerWhatsapp ?? "",
      },
    });

  const listingType = useWatch({ control, name: "listing" });
  const selectedProvince = useWatch({ control, name: "province" });
  const districtOptions = useMemo(() => {
    const list = selectedProvince
      ? (DISTRICTS_BY_PROVINCE[selectedProvince] ?? [])
      : [];
    return list.map((d) => ({ value: d, label: d }));
  }, [selectedProvince]);

  useEffect(() => {
    const current = getValues("district");
    if (current && !districtOptions.find((o) => o.value === current)) {
      setValue("district", "");
    }
  }, [districtOptions, getValues, setValue]);

  const googleMapUrl = useWatch({ control, name: "googleMapUrl" });
  const mapUrlStatus = useMapUrlCoords(googleMapUrl, (lat, lng) => {
    setValue("lat", String(lat), { shouldValidate: true });
    setValue("lng", String(lng), { shouldValidate: true });
  });

  const mutation = useMutation({
    mutationFn: (values: PropertySchema) =>
      PropertyService.edit(
        property.id,
        {
          projectName: values.projectName,
          location: property.location || values.district || "",
          price: Number(values.price),
          sizeSqm: values.sizeSqm ? Number(values.sizeSqm) : undefined,
          ownerInfo: values.ownerInfo ?? "",
          lat: values.lat ? Number(values.lat) : undefined,
          lng: values.lng ? Number(values.lng) : undefined,

          kind: values.kind,
          listing: values.listing,
          province: values.province,
          district: values.district,
          googleMapUrl: values.googleMapUrl,
          btsMrt: values.btsMrt,
          bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
          bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
          floor: values.floor ? Number(values.floor) : undefined,
          minContract: values.minContract
            ? Number(values.minContract)
            : undefined,
          pets: (values.pets || undefined) as PropertySchema["pets"],
          furniture: (values.furniture ||
            undefined) as PropertySchema["furniture"],
          adCaption: values.adCaption,

          ownerName: values.ownerName,
          ownerPhone: values.ownerPhone,
          ownerLineId: values.ownerLineId,
          ownerEmail: values.ownerEmail,
          ownerFacebook: values.ownerFacebook,
          ownerWechat: values.ownerWechat,
          ownerWhatsapp: values.ownerWhatsapp,

          deleteImageIds:
            removedImageIds.length > 0 ? removedImageIds : undefined,
        },
        newImages,
      ),
    onSuccess: () => {
      toast.success(t("property.editSuccess"));
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.DETAIL, property.id],
      });
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.PROPERTIES] });
      setNewImages([]);
      setPreviews([]);
      setRemovedImageIds([]);
      onClose();
    },
    onError: () => toast.error(t("common.error")),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removePending = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("property.editTitle")}: {property.projectName}
          </DialogTitle>
          <DialogDescription>{t("property.editDesc")}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)}
          className="space-y-4"
        >
          <FormInput
            control={control}
            name="projectName"
            label={t("property.projectName")}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormSelect
              control={control}
              name="kind"
              label={t("property.kindLabel")}
              options={kindOptions}
              required
            />
            <FormSelect
              control={control}
              name="listing"
              label={t("property.listingLabel")}
              options={listingOptions}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormPriceInput
              control={control}
              name="price"
              label={t("property.priceLabel")}
              required
            />
            <FormInput
              control={control}
              name="sizeSqm"
              label={t("property.size")}
              type="number"
              min={0}
              step="any"
            />
          </div>
          {(listingType === "rent" || listingType === "both") && (
            <FormInput
              control={control}
              name="minContract"
              label={t("property.minContract")}
              type="number"
              min={0}
              step={1}
            />
          )}
          <FormTextarea
            control={control}
            name="adCaption"
            label={t("property.adCaption")}
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormCombobox
              control={control}
              name="province"
              label={t("property.province")}
              options={provinceOptions}
              required
            />
            <FormCombobox
              control={control}
              name="district"
              label={t("property.district")}
              options={districtOptions}
              placeholder={
                districtOptions.length === 0
                  ? t("property.selectProvinceFirst")
                  : undefined
              }
              disabled={districtOptions.length === 0}
              required
            />
          </div>
          <FormInput
            control={control}
            name="googleMapUrl"
            label={t("property.googleMapUrl")}
            placeholder="https://maps.google.com/..."
          />
          <MapUrlStatusHint status={mapUrlStatus.status} source={mapUrlStatus.source} />
          <FormMultiSelect
            control={control}
            name="btsMrt"
            label={t("property.btsMrt")}
            options={BTS_MRT_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              control={control}
              name="lat"
              label={t("property.lat")}
              type="number"
              placeholder="13.7563"
              step="any"
            />
            <FormInput
              control={control}
              name="lng"
              label={t("property.lng")}
              type="number"
              placeholder="100.5018"
              step="any"
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {t("property.coordsHint")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput
              control={control}
              name="bedrooms"
              label={t("property.bedrooms")}
              type="number"
              min={0}
              step={1}
            />
            <FormInput
              control={control}
              name="bathrooms"
              label={t("property.bathrooms")}
              type="number"
              min={0}
              step={1}
            />
            <FormInput
              control={control}
              name="floor"
              label={t("property.floor")}
              type="number"
              min={0}
              step={1}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormSelect
              control={control}
              name="pets"
              label={t("property.petsLabel")}
              options={petsOptions}
            />
            <FormSelect
              control={control}
              name="furniture"
              label={t("property.furnitureLabel")}
              options={furnitureOptions}
            />
          </div>

          {property.images && property.images.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t("property.existingImages")}
              </p>
              <div className="flex flex-wrap gap-2">
                {property.images
                  .filter((img) => !removedImageIds.includes(img.id))
                  .map((img) => (
                    <div
                      key={img.id}
                      className="relative size-20 rounded-lg overflow-hidden border"
                    >
                      <img
                        src={resolveImageUrl(img.url)}
                        alt={`existing-${img.id}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRemovedImageIds((prev) => [...prev, img.id])
                        }
                        title={t("common.delete")}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
              </div>
              {removedImageIds.length > 0 && (
                <p className="text-xs text-orange-600">
                  {t("property.imagesMarkedForDeletion", {
                    count: removedImageIds.length,
                  })}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("property.addMoreImages")}
            </p>
            <div className="flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative size-20 rounded-lg overflow-hidden border"
                >
                  <img
                    src={src}
                    alt={`new-${i}`}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="size-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="size-5" />
                <span className="text-[10px]">{t("property.addImage")}</span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <p className="text-sm font-medium text-foreground pt-2 border-t">
            {t("property.ownerSection")}
          </p>
          <FormTextarea
            control={control}
            name="ownerInfo"
            label={t("property.ownerInfo")}
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              control={control}
              name="ownerName"
              label={t("property.ownerName")}
            />
            <FormPhoneInput
              control={control}
              name="ownerPhone"
              label={t("property.ownerPhone")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              control={control}
              name="ownerLineId"
              label={t("property.ownerLineId")}
            />
            <FormInput
              control={control}
              name="ownerEmail"
              label={t("property.ownerEmail")}
              type="email"
            />
          </div>
          <FormInput
            control={control}
            name="ownerFacebook"
            label={t("property.ownerFacebook")}
            placeholder="https://facebook.com/..."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              control={control}
              name="ownerWechat"
              label={t("property.ownerWechat")}
            />
            <FormInput
              control={control}
              name="ownerWhatsapp"
              label={t("property.ownerWhatsapp")}
            />
          </div>

          {(property.status === "available" ||
            property.status === "reserved") && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
              {t("property.editReapproveNotice")}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
