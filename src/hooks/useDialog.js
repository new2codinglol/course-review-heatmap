import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Modal dialog behavior: focus into the dialog on open, trap Tab, close on Esc,
// and restore focus to the opener on close. Attach the returned ref to the
// dialog element (which should also carry role="dialog" aria-modal="true").
export function useDialog(onClose) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const opener = document.activeElement

    // Lock background scroll while the dialog is open. Stacks correctly: an inner
    // dialog captures the already-locked value and restores it for the outer one.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const visibleFocusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null)

    ;(visibleFocusables()[0] || node).focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = visibleFocusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [onClose])

  return ref
}
