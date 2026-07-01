import i18n from '@/i18n'

const LOCALE_MAP: Record<string, string> = {
  th: 'th-TH',
  en: 'en-US',
  zh: 'zh-CN',
}

function currentLocale(): string {
  return LOCALE_MAP[i18n.language] ?? 'th-TH'
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(currentLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(currentLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '-'
  return price.toLocaleString(currentLocale(), {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  })
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}
