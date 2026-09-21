import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BEDROOM_COUNTS, STUDIO_BEDROOM } from '@/constants/Bedrooms'

export function useBedroomOptions(currentValue?: string) {
  const { t, i18n } = useTranslation()
  return useMemo(() => {
    const options = [
      { value: STUDIO_BEDROOM, label: t('property.studio') },
      ...BEDROOM_COUNTS.map((n) => ({ value: String(n), label: String(n) })),
    ]
    if (currentValue && !options.some((o) => o.value === currentValue)) {
      options.push({ value: currentValue, label: currentValue })
    }
    return options
  }, [t, i18n.language, currentValue])
}
