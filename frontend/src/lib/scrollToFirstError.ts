import type { FieldErrors, FieldValues } from 'react-hook-form'

// onInvalid handler for react-hook-form's handleSubmit. Smooth-scrolls the
// first field with aria-invalid="true" into view so users aren't stuck when
// the first error is off-screen (tall dialogs, long pages).
//
// Scoped to the submitted <form> (event.target) so a different form mounted
// elsewhere with stale aria-invalid can't steal the target.
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
