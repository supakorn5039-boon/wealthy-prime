import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { WishlistService } from '@/services/WishlistService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'

export default function WishlistIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: [WishlistService.QUERY_KEYS.LIST],
    queryFn: WishlistService.list,
  })

  const removeMutation = useMutation({
    mutationFn: WishlistService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WishlistService.QUERY_KEYS.LIST] })
      toast.success(t('wishlist.removed'))
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <PageContainer size="7xl">
      <PageTitle title={t('wishlist.title')} subtitle={t('wishlist.count', { count: wishlist.length })} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : wishlist.length === 0 ? (
        <EmptyState
          title={t('wishlist.empty')}
          description={t('wishlist.emptyHint')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wishlist.map((property) => (
            <div key={property.id} className="relative">
              <PropertyCard property={property} />
              <button
                onClick={() => removeMutation.mutate(property.id)}
                className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/80 transition-colors"
                title={t('wishlist.remove')}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
