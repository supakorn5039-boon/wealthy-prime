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
import { AdminService } from "@/services/AdminService";
import { FormInput } from "@/components/form/FormInput";
import { FormPhoneInput } from "@/components/form/FormPhoneInput";
import { FormPriceInput } from "@/components/form/FormPriceInput";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextarea } from "@/components/form/FormTextarea";
import { FormCombobox } from "@/components/form/FormCombobox";
import { FormMultiSelect } from "@/components/form/FormMultiSelect";
import { FormSuggestInput } from "@/components/form/FormSuggestInput";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/shared/PageTitle";
import { PageContainer } from "@/components/shared/PageContainer";
import { addPropertySchema, type PropertySchema } from "@/dto/PropertyValidation";
import { ROUTES } from "@/constants/Routes";
import { PROVINCES, DISTRICTS_BY_PROVINCE, getBtsMrtOptions, localizedProvince, localizedDistrict } from "@/constants/Locations";
import { usePropertyOptions } from "@/hooks/usePropertyOptions";
import { useMapUrlCoords } from "@/hooks/useMapUrlCoords";
import { MapUrlStatusHint } from "@/components/property/MapUrlStatusHint";

export default function AddPropertyIndex() {
  const { t, i18n } = useTranslation();
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
  const provinceOptions = PROVINCES.map((p) => ({ value: p, label: localizedProvince(p, i18n.language) }));

  const { control, handleSubmit, setValue } = useForm<PropertySchema>({
    resolver: zodResolver(addPropertySchema),
    defaultValues: {
      projectName: "",
      location: "",
      rentPrice: "",
      salePrice: "",
      sizeSqm: "",
      ownerInfo: "",
      ownerExtraDetail: "",
      lat: "",
      lng: "",

      kind: "condo" as const,
      listing: "both" as const,
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
      ownerDocumentUrl: "",
    },
  });

  const listingType = useWatch({ control, name: "listing" });

  const selectedProvince = useWatch({ control, name: "province" });
  const districtOptions = useMemo(
    () => (DISTRICTS_BY_PROVINCE[selectedProvince] ?? []).map((d) => ({ value: d, label: localizedDistrict(d, i18n.language) })),
    [selectedProvince, i18n.language],
  );
  const btsMrtOptions = useMemo(() => getBtsMrtOptions(i18n.language), [i18n.language]);

  useEffect(() => {
    setValue("district", "");
  }, [selectedProvince, setValue]);

  const googleMapUrl = useWatch({ control, name: "googleMapUrl" });
  const mapUrlStatus = useMapUrlCoords(googleMapUrl, (lat, lng) => {
    setValue("lat", String(lat), { shouldValidate: true });
    setValue("lng", String(lng), { shouldValidate: true });
  });

  const mutation = useMutation({
    mutationFn: (values: PropertySchema) =>
      PropertyService.createWithImages(
        {
          projectName: values.projectName,
          location: values.location || values.province || "",
          rentPrice: values.rentPrice ? Number(values.rentPrice) : undefined,
          salePrice: values.salePrice ? Number(values.salePrice) : undefined,
          sizeSqm: values.sizeSqm ? Number(values.sizeSqm) : undefined,
          ownerInfo: values.ownerInfo ?? "",
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
          ownerDocumentUrl: values.ownerDocumentUrl,
        },
        images,
      ),
    onSuccess: () => {
      toast.success(t("property.addSuccess"));
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.LIST],
      });
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.PROPERTIES] });
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
        onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("property.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormSuggestInput
              control={control}
              name="projectName"
              label={t("property.projectName")}
              placeholder={t("property.projectName")}
              queryKey={PropertyService.QUERY_KEYS.SUGGEST}
              fetchSuggestions={PropertyService.suggestProjectNames}
              suggestionsTitle={t("property.existingProjects")}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormPriceInput
                control={control}
                name="rentPrice"
                label={t("property.rentPriceLabel")}
                placeholder="0"
              />
              <FormPriceInput
                control={control}
                name="salePrice"
                label={t("property.salePriceLabel")}
                placeholder="0"
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
            <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder={t("property.selectProvinceFirst")}
                disabled={districtOptions.length === 0}
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
              options={btsMrtOptions}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("property.ownerSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <FormTextarea
              control={control}
              name="ownerInfo"
              label={t("property.ownerInfo")}
              placeholder={t("property.ownerInfo")}
              rows={3}
            />
            <FormInput
              control={control}
              name="ownerDocumentUrl"
              label={t("property.ownerDocumentUrl")}
              placeholder="https://drive.google.com/..."
            />
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
