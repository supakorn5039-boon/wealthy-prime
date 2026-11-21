import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { saveBlob } from '@/utils/saveBlob'

export function useDownloadPropertyImages() {
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number | string) => PropertyService.downloadImagesArchive(id),
    onSuccess: ({ blob, filename }) => saveBlob(blob, filename),
    onError: (error) => {
      const noImages = axios.isAxiosError(error) && error.response?.status === 404
      toast.error(noImages ? t('property.noImagesToDownload') : t('common.error'))
    },
  })
}
