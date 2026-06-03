// Copies text to the clipboard. Falls back to the deprecated execCommand path
// when navigator.clipboard is unavailable (which happens on http://wealthy.local
// and other non-secure contexts — the modern API is only exposed on HTTPS or
// localhost/127.0.0.1).
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'
  textarea.setAttribute('readonly', '')
  document.body.appendChild(textarea)
  textarea.select()
  try {
    const ok = document.execCommand('copy')
    if (!ok) throw new Error('execCommand copy returned false')
  } finally {
    document.body.removeChild(textarea)
  }
}
