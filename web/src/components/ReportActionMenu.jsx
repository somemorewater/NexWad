import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import toast from 'react-hot-toast'

export default function ReportActionMenu({
  onReport,
  entityLabel = 'content',
  buttonClassName = 'post-card__menu-btn',
  buttonAriaLabel,
  dropdownClassName = 'nw-menu__dropdown',
  stopPropagation = true,
}) {
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const handleTrigger = (event) => {
    if (stopPropagation) event.stopPropagation()
    setOpen((prev) => !prev)
  }

  const handleMenuAction = (event, action) => {
    if (stopPropagation) event.stopPropagation()
    setOpen(false)
    if (action === 'report') setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setReason('')
    setSubmitting(false)
  }

  const submitReport = async () => {
    const value = reason.trim()
    if (!value) {
      toast.error('Please add a reason')
      return
    }
    if (!onReport) return

    setSubmitting(true)
    try {
      await onReport(value)
      toast.success(`Reported ${entityLabel}`)
      closeModal()
    } catch (err) {
      toast.error(err?.error || err?.message || `Could not report ${entityLabel}`)
      setSubmitting(false)
    }
  }

  return (
    <div
      className="nw-menu"
      ref={wrapRef}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      <button
        type="button"
        className={buttonClassName}
        onClick={handleTrigger}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={buttonAriaLabel || `Open ${entityLabel} actions`}
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>

      {open && (
        <div className={dropdownClassName} role="menu">
          <button type="button" className="nw-menu__item nw-menu__item--danger" onClick={(e) => handleMenuAction(e, 'report')} role="menuitem">
            Report
          </button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={`Report ${entityLabel}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={submitReport} disabled={submitting || !reason.trim()}>
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Reason</label>
          <textarea
            className="form-textarea"
            rows={4}
            maxLength={500}
            placeholder={`Why are you reporting this ${entityLabel}?`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="caption" style={{ textAlign: 'right', marginTop: 6 }}>{reason.length}/500</div>
        </div>
      </Modal>
    </div>
  )
}
