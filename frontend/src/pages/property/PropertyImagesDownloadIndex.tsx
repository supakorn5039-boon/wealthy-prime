import { useEffect, useRef } from 'react'
import { generatePath, matchPath, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ROUTES } from '@/constants/Routes'
import { useDownloadPropertyImages } from '@/hooks/useDownloadPropertyImages'

export default function PropertyImagesDownloadIndex() {
  const { t } = useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { mutateAsync } = useDownloadPropertyImages()
  const startedFor = useRef<string | null>(null)

  useEffect(() => {
    if (startedFor.current === id) return
    startedFor.current = id
    mutateAsync(id)
      .catch(() => undefined)
      .finally(() => {
        const stillOnPage =
          matchPath(ROUTES.PROPERTY_IMAGES_DOWNLOAD, window.location.pathname)?.params.id === id
        if (stillOnPage) {
          navigate(generatePath(ROUTES.PROPERTY_DETAIL, { id }), { replace: true })
        }
      })
  }, [id, mutateAsync, navigate])

  return <LoadingSpinner text={t('property.downloadingImages')} />
}
