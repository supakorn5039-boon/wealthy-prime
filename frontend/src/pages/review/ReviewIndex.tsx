import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReviewService } from '@/services/ReviewService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormTextarea } from '@/components/form/FormTextarea'
import { StarRating } from '@/components/StarRating'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { reviewSchema, type ReviewSchema } from '@/dto/ReviewValidation'

export default function ReviewIndex() {
  const { t } = useTranslation()
  const { token } = useParams<{ token: string }>()
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: [ReviewService.QUERY_KEYS.TOKEN_REVIEW, token],
    queryFn: () => ReviewService.getByToken(token!),
    enabled: !!token,
    retry: false,
  })

  const { control, handleSubmit } = useForm<ReviewSchema>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: ReviewSchema) =>
      ReviewService.create({
        propertyId: data!.propertyId,
        rating: values.rating,
        comment: values.comment ?? '',
        token: token!,
      }),
    onSuccess: () => {
      toast.success(t('review.thankYou'))
      setSubmitted(true)
    },
    onError: () => toast.error(t('review.linkExpired')),
  })

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />

  if (error || !data) {
    return (
      <div className="w-full max-w-md px-4">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">{t('review.invalidLink')}</p>
            <p className="text-sm text-gray-400 mt-2">{t('review.requestNewLink')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md px-4">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4 fill-yellow-400" />
            <p className="text-xl font-bold">{t('review.thankYou')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('review.willBeShown')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Crown className="h-7 w-7" />
          <span className="text-xl font-bold">Wealthy Prime Estate</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('review.leaveReview')}</CardTitle>
          <CardDescription>{data.propertyTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <Controller
              control={control}
              name="rating"
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {t('review.rating')} <span className="text-red-500">*</span>
                  </label>
                  <StarRating value={field.value} onChange={field.onChange} size={32} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )}
            />
            <FormTextarea control={control} name="comment" label={t('review.comment')} placeholder={t('review.commentPlaceholder')} rows={4} />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('review.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
