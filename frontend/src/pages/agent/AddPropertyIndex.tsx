import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { ImagePlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PropertyService } from "@/services/PropertyService";
import { FormInput } from "@/components/form/FormInput";
import { FormPriceInput } from "@/components/form/FormPriceInput";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextarea } from "@/components/form/FormTextarea";
import { FormMultiChips } from "@/components/form/FormMultiChips";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/shared/PageTitle";
import { PageContainer } from "@/components/shared/PageContainer";
import { propertySchema, type PropertySchema } from "@/dto/PropertyValidation";
import { ROUTES } from "@/constants/Routes";
import {
  PROVINCES,
  DISTRICTS_BY_PROVINCE,
  BTS_MRT_OPTIONS,
} from "@/constants/Locations";
import { usePropertyOptions } from "@/hooks/usePropertyOptions";
import { parseGoogleMapsUrl } from "@/utils/parseGoogleMapsUrl";

export default function AddPropertyIndex() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showExtraField, setShowExtraField] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    kindOptions,
    listingOptions,
    petsOptions,
    furnitureOptions,
  } = usePropertyOptions();
  const provinceOptions = PROVINCES.map((p) => ({ value: p, label: p }));

  const { control, handleSubmit, setValue } = useForm<PropertySchema>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      projectName: "",
      location: "",
      price: "",
      sizeSqm: "",
      ownerInfo: "",
      ownerExtraDetail: "",
      lat: "",
      lng: "",

      kind: "condo" as const,
      listing: "rent" as const,
      province: "",
      district: "",
      googleMapUrl: "",
      btsMrt: "",
      bedrooms: "",
      bathrooms: "",
      floor: "",
      minContract: "12",
      pets: "" as const,
      furniture: "" as const,
      adCaption: "",

      ownerName: "",
      ownerPhone: "",
      ownerLineId: "",
      ownerEmail: "",
      ownerFacebook: "",
      ownerWechat: "",
      ownerWhatsapp: "",
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
    setValue("district", "");
  }, [selectedProvince, setValue]);

  const googleMapUrl = useWatch({ control, name: "googleMapUrl" });
  useEffect(() => {
    const coords = parseGoogleMapsUrl(googleMapUrl ?? "");
    if (coords) {
      setValue("lat", String(coords.lat), { shouldValidate: true });
      setValue("lng", String(coords.lng), { shouldValidate: true });
    }
  }, [googleMapUrl, setValue]);

  const mutation = useMutation({
    mutationFn: (values: PropertySchema) =>
      PropertyService.createWithImages(
        {
          projectName: values.projectName,
          location: values.location || values.district || "",
          price: Number(values.price),
          sizeSqm: values.sizeSqm ? Number(values.sizeSqm) : undefined,
          ownerInfo: values.ownerInfo,
          ownerExtraDetail: values.ownerExtraDetail ?? "",
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
        },
        images,
      ),
    onSuccess: () => {
      toast.success(t("property.addSuccess"));
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST],
      });
      navigate(ROUTES.AGENT_PROPERTIES);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error(t("property.duplicateError"));
        setShowExtraField(true);
        return;
      }
      toast.error(t("common.error"));
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <PageContainer size="7xl">
      <PageTitle
        title={t("property.addTitle")}
        subtitle={t("property.addSubtitle")}
      />

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("property.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormInput
              control={control}
              name="projectName"
              label={t("property.projectName")}
              placeholder={t("property.projectName")}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormPriceInput
                control={control}
                name="price"
                label={t("property.priceLabel")}
                placeholder="0"
                required
              />
              <FormInput
                control={control}
                name="sizeSqm"
                label={t("property.size")}
                type="number"
                placeholder="0"
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
                placeholder="12"
                min={0}
                step={1}
              />
            )}
            <FormTextarea
              control={control}
              name="adCaption"
              label={t("property.adCaption")}
              placeholder={t("property.adCaption")}
              rows={2}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("property.locationSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                control={control}
                name="province"
                label={t("property.province")}
                options={provinceOptions}
                required
              />
              <FormSelect
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
              name="location"
              label={t("property.location")}
              placeholder={t("property.location")}
            />
            <FormInput
              control={control}
              name="googleMapUrl"
              label={t("property.googleMapUrl")}
              placeholder="https://maps.google.com/..."
            />
            <FormMultiChips
              control={control}
              name="btsMrt"
              label={t("property.btsMrt")}
              options={BTS_MRT_OPTIONS}
            />
            <div className="grid grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("property.specsSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                control={control}
                name="bedrooms"
                label={t("property.bedrooms")}
                type="number"
                placeholder="0"
                min={0}
                step={1}
              />
              <FormInput
                control={control}
                name="bathrooms"
                label={t("property.bathrooms")}
                type="number"
                placeholder="0"
                min={0}
                step={1}
              />
              <FormInput
                control={control}
                name="floor"
                label={t("property.floor")}
                type="number"
                placeholder="0"
                min={0}
                step={1}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("property.ownerSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormTextarea
              control={control}
              name="ownerInfo"
              label={t("property.ownerInfo")}
              placeholder={t("property.ownerInfo")}
              required
              rows={3}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                control={control}
                name="ownerName"
                label={t("property.ownerName")}
              />
              <FormInput
                control={control}
                name="ownerPhone"
                label={t("property.ownerPhone")}
                placeholder={t('common.phonePlaceholder')}
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
              required
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
            {showExtraField && (
              <div className="border-l-4 border-orange-400 pl-4 space-y-2">
                <p className="text-sm font-medium text-orange-700">
                  {t("property.duplicateWarning")}
                </p>
                <FormTextarea
                  control={control}
                  name="ownerExtraDetail"
                  label={t("property.ownerExtraDetail")}
                  placeholder={t("property.ownerExtraDetail")}
                  required
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("property.imagesSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative size-24 rounded-lg overflow-hidden border"
                >
                  <img
                    src={src}
                    alt={`preview-${i}`}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-background/80 border border-border text-foreground rounded-full p-0.5 hover:bg-background backdrop-blur-sm"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="size-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="size-6" />
                <span className="text-xs">{t("property.addImage")}</span>
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
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.AGENT_PROPERTIES)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? t("common.saving")
              : t("property.saveProperty")}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
