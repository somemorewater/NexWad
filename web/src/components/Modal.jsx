import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  )
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg'
  closeOnOverlay = true,
}) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null

  const sizeClass = size === 'lg' ? 'modal--lg' : size === 'sm' ? 'modal--sm' : ''

  return createPortal(
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={closeOnOverlay ? (e) => { if (e.target === overlayRef.current) onClose?.() } : undefined}
    >
      <div className={`modal ${sizeClass}`} role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="modal__header">
            <h2 className="modal__title">{title}</h2>
            <button className="modal__close" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
