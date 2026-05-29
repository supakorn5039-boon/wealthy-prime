import { useState, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { FormInput } from '@/components/form/FormInput'
import { FormSelect } from '@/components/form/FormSelect'
import { FormTextarea } from '@/components/form/FormTextarea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { propertySchema, type PropertySchema } from '@/dto/PropertyValidation'
import type { Property } from '@/types/Property'

interface Props {
  property: Property
  open: boolean
  onClose: () => void
}

export function EditPropertyDialog({ property, open, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newImages, setNewImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const typeOptions = [
    { value: 'buy', label: t('property.buy') },
    { value: 'rent', label: t('property.rent') },
  ]

  const { control, handleSubmit } = useForm<PropertySchema>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property.title,
      projectName: property.projectName,
      location: property.location,
      price: String(property.price),
      type: property.type,
      sizeSqm: property.sizeSqm ? String(property.sizeSqm) : '',
      ownerInfo: property.ownerInfo,
      ownerExtraDetail: '',
      rentalPeriodMonths: property.rentalPeriodMonths ? String(property.rentalPeriodMonths) : '',
    },
  })

  const propertyType = useWatch({ control, name: 'type' })

  const mutation = useMutation({
    mutationFn: (values: PropertySchema) =>
      PropertyService.edit(
        property.id,
        {
          title: values.title,
          projectName: values.projectName,
          location: values.location,
          price: Number(values.price),
          type: values.type,
          sizeSqm: values.sizeSqm ? Number(values.sizeSqm) : undefined,
          ownerInfo: values.ownerInfo,
          rentalPeriodMonths: values.rentalPeriodMonths ? Number(values.rentalPeriodMonths) : undefined,
        },
        newImages,
      ),
    onSuccess: () => {
      toast.success(t('property.editSuccess'))
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST] })
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.LIST] })
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.DETAIL, property.id] })
      setNewImages([])
      setPreviews([])
      onClose()
    },
    onError: () => toast.error(t('common.error')),
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setNewImages((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removePending = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('property.editTitle')}: {property.title}</DialogTitle>
          <DialogDescription>{t('property.editDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <FormInput control={control} name="title" label={t('property.title')} required />
          <FormInput control={control} name="projectName" label={t('property.projectName')} required />
          <FormInput control={control} name="location" label={t('property.location')} required />
          <div className="grid grid-cols-2 gap-3">
            <FormInput control={control} name="price" label={t('property.priceLabel')} type="number" min={0} step="any" required />
            <FormInput control={control} name="sizeSqm" label={t('property.size')} type="number" min={0} step="any" />
          </div>
          <FormSelect control={control} name="type" label={t('property.typeCol')} options={typeOptions} required />
          {propertyType === 'rent' && (
            <FormInput control={control} name="rentalPeriodMonths" label={t('property.rentalPeriod')} type="number" min={1} step={1} />
          )}
          <FormTextarea control={control} name="ownerInfo" label={t('property.ownerInfo')} required rows={3} />

          {property.imageUrls && property.imageUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('property.existingImages')}</p>
              <div className="flex flex-wrap gap-2">
                {property.imageUrls.map((url, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={url} alt={`existing-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('property.addMoreImages')}</p>
            <div className="flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={src} alt={`new-${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px]">{t('property.addImage')}</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
          </div>

          {(property.status === 'available' || property.status === 'reserved') && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
              {t('property.editReapproveNotice')}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
