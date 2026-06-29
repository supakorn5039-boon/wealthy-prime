import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormTextarea } from '@/components/form/FormTextarea'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { StarRating } from '@/components/StarRating'
import { ReviewService } from '@/services/ReviewService'
import { reviewSchema, type ReviewSchema } from '@/dto/ReviewValidation'
import type { Review } from '@/types/Review'

interface Props {
  propertyId: number | string
  propertyTitle: string
  existing?: Review | null
  open: boolean
  onClose: () => void
}

export function WriteReviewDialog({ propertyId, propertyTitle, existing, open, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { control, handleSubmit, reset } = useForm<ReviewSchema>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: existing?.rating ?? 0, comment: existing?.comment ?? '' },
  })

  useEffect(() => {
    if (open) {
      reset({ rating: existing?.rating ?? 0, comment: existing?.comment ?? '' })
    }
  }, [open, existing, reset])

  const mutation = useMutation({
    mutationFn: (values: ReviewSchema) =>
      ReviewService.createForProperty({
        propertyId,
        rating: values.rating,
        comment: values.comment ?? '',
      }),
    onSuccess: () => {
      toast.success(t('review.yourReviewSaved'))
      queryClient.invalidateQueries({
        queryKey: [ReviewService.QUERY_KEYS.PROPERTY_REVIEWS, String(propertyId)],
      })
      onClose()
    },
    onError: () => toast.error(t('review.failedToSave')),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? t('review.editYourReview') : t('review.writeReview')}</DialogTitle>
          <DialogDescription>{propertyTitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v), scrollToFirstError)} className="space-y-4">
          <Controller
            control={control}
            name="rating"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5" aria-invalid={!!fieldState.error}>
                <label className="text-sm font-medium text-foreground">
                  {t('review.rating')} <span className="text-red-500">*</span>
                </label>
                <StarRating value={field.value} onChange={field.onChange} size={32} />
                {fieldState.error && (
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
          <FormTextarea
            control={control}
            name="comment"
            label={t('review.comment')}
            placeholder={t('review.commentPlaceholder')}
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('review.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
