import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { FormInput } from '@/components/form/FormInput'
import { FormSelect } from '@/components/form/FormSelect'
import { FormTextarea } from '@/components/form/FormTextarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTitle } from '@/components/shared/PageTitle'
import { propertySchema, type PropertySchema } from '@/dto/PropertyValidation'
import { ROUTES } from '@/constants/Routes'

export default function AddPropertyIndex() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [showExtraField, setShowExtraField] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const typeOptions = [
    { value: 'buy', label: t('property.buy') },
    { value: 'rent', label: t('property.rent') },
  ]

  const { control, handleSubmit } = useForm<PropertySchema>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      projectName: '',
      location: '',
      price: '',
      type: 'buy' as const,
      sizeSqm: '',
      ownerInfo: '',
      ownerExtraDetail: '',
      rentalPeriodMonths: '',
    },
  })

  const propertyType = useWatch({ control, name: 'type' })

  const mutation = useMutation({
    mutationFn: (values: PropertySchema) =>
      PropertyService.createWithImages(
        {
          title: values.title,
          projectName: values.projectName,
          location: values.location,
          price: Number(values.price),
          type: values.type,
          sizeSqm: values.sizeSqm ? Number(values.sizeSqm) : undefined,
          ownerInfo: values.ownerInfo,
          ownerExtraDetail: values.ownerExtraDetail ?? '',
          rentalPeriodMonths: values.rentalPeriodMonths ? Number(values.rentalPeriodMonths) : undefined,
        },
        images,
      ),
    onSuccess: () => {
      toast.success(t('property.addSuccess'))
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST] })
      navigate(ROUTES.AGENT_PROPERTIES)
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error(t('property.duplicateError'))
        setShowExtraField(true)
        return
      }
      toast.error(t('common.error'))
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageTitle title={t('property.addTitle')} subtitle={t('property.addSubtitle')} />

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('property.basicInfo')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormInput control={control} name="title" label={t('property.title')} placeholder={t('property.title')} required />
            <FormInput control={control} name="projectName" label={t('property.projectName')} placeholder={t('property.projectName')} required />
            <FormInput control={control} name="location" label={t('property.location')} placeholder={t('property.location')} required />
            <div className="grid grid-cols-2 gap-4">
              <FormInput control={control} name="price" label={t('property.priceLabel')} type="number" placeholder="0" required />
              <FormInput control={control} name="sizeSqm" label={t('property.size')} type="number" placeholder="0" />
            </div>
            <FormSelect control={control} name="type" label={t('property.typeCol')} options={typeOptions} required />
            {propertyType === 'rent' && (
              <FormInput control={control} name="rentalPeriodMonths" label={t('property.rentalPeriod')} type="number" placeholder="12" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('property.ownerSection')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormTextarea control={control} name="ownerInfo" label={t('property.ownerInfo')} placeholder={t('property.ownerInfo')} required rows={3} />
            {showExtraField && (
              <div className="border-l-4 border-orange-400 pl-4 space-y-2">
                <p className="text-sm font-medium text-orange-700">
                  {t('property.duplicateWarning')}
                </p>
                <FormTextarea
                  control={control}
                  name="ownerExtraDetail"
                  label={t('property.ownerExtraDetail')}
                  placeholder={t('property.ownerExtraDetail')}
                  required
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('property.imagesSection')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">{t('property.addImage')}</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.AGENT_PROPERTIES)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('property.saveProperty')}
          </Button>
        </div>
      </form>
    </div>
  )
}
