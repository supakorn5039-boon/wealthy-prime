import { Heart } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { WishlistService } from '@/services/WishlistService'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  propertyId: number
  className?: string
}

export function WishlistButton({ propertyId, className }: WishlistButtonProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: wishlist = [] } = useQuery({
    queryKey: [WishlistService.QUERY_KEYS.LIST],
    queryFn: WishlistService.list,
    enabled: !!user,
  })

  const isWishlisted = wishlist.some((p) => p.id === propertyId)

  const addMutation = useMutation({
    mutationFn: () => WishlistService.add(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WishlistService.QUERY_KEYS.LIST] })
      toast.success(t('property.addedToCart'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const removeMutation = useMutation({
    mutationFn: () => WishlistService.remove(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WishlistService.QUERY_KEYS.LIST] })
      toast.success(t('wishlist.removed'))
    },
    onError: () => toast.error(t('common.error')),
  })

  if (!user) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('rounded-full', className)}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        isWishlisted ? removeMutation.mutate() : addMutation.mutate()
      }}
      disabled={addMutation.isPending || removeMutation.isPending}
    >
      <Heart
        className={cn('h-5 w-5 transition-colors', isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground')}
      />
    </Button>
  )
}
