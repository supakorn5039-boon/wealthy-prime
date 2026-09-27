import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BEDROOM_ORDER, STUDIO_BEDROOM, DUPLEX_BEDROOM } from '@/constants/Bedrooms'

export function useBedroomOptions(currentValue?: string) {
  const { t, i18n } = useTranslation()
  return useMemo(() => {
    const options = BEDROOM_ORDER.map((v) => ({
      value: v,
      label:
        v === STUDIO_BEDROOM
          ? t('property.studio')
          : v === DUPLEX_BEDROOM
            ? t('property.duplex')
            : v,
    }))
    if (currentValue && !options.some((o) => o.value === currentValue)) {
      options.push({ value: currentValue, label: currentValue })
    }
    return options
  }, [t, i18n.language, currentValue])
}
