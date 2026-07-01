import type { FieldErrors, FieldValues } from 'react-hook-form'

export function scrollToFirstError<T extends FieldValues>(
  _errors: FieldErrors<T>,
  event?: React.BaseSyntheticEvent,
) {
  const root: ParentNode = (event?.target as HTMLElement | undefined) ?? document
  requestAnimationFrame(() => {
    const el = root.querySelector<HTMLElement>('[aria-invalid="true"]')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}
