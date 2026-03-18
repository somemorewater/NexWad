import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import Modal from '../components/Modal'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const resolverRef = useRef(null)
  const [modal, setModal] = useState(null)
  const [inputValue, setInputValue] = useState('')

  const close = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result)
    }
    resolverRef.current = null
    setModal(null)
    setInputValue('')
  }, [])

  const alert = useCallback((options = {}) => new Promise((resolve) => {
    resolverRef.current = resolve
    setModal({
      type: 'alert',
      title: options.title || 'Alert',
      message: options.message || '',
      confirmLabel: options.confirmLabel || 'OK',
    })
  }), [])

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    resolverRef.current = resolve
    setModal({
      type: 'confirm',
      title: options.title || 'Confirm',
      message: options.message || '',
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
    })
  }), [])

  const prompt = useCallback((options = {}) => new Promise((resolve) => {
    resolverRef.current = resolve
    setInputValue(options.defaultValue || '')
    setModal({
      type: 'prompt',
      title: options.title || 'Input Required',
      message: options.message || '',
      placeholder: options.placeholder || '',
      confirmLabel: options.confirmLabel || 'Submit',
      cancelLabel: options.cancelLabel || 'Cancel',
      required: Boolean(options.required),
    })
  }), [])

  const value = useMemo(() => ({ alert, confirm, prompt }), [alert, confirm, prompt])

  const handleCancel = () => {
    if (!modal) return
    if (modal.type === 'prompt') return close(null)
    if (modal.type === 'confirm') return close(false)
    return close(true)
  }

  const handleConfirm = () => {
    if (!modal) return
    if (modal.type === 'prompt') {
      if (modal.required && !String(inputValue).trim()) return
      return close(inputValue)
    }
    return close(true)
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        isOpen={Boolean(modal)}
        onClose={handleCancel}
        title={modal?.title}
        closeOnOverlay={modal?.type !== 'prompt'}
        footer={modal ? (
          <>
            {modal.type !== 'alert' && (
              <button className="btn btn-secondary" type="button" onClick={handleCancel}>
                {modal.cancelLabel || 'Cancel'}
              </button>
            )}
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleConfirm}
              disabled={modal.type === 'prompt' && modal.required && !String(inputValue).trim()}
            >
              {modal.confirmLabel || 'OK'}
            </button>
          </>
        ) : null}
      >
        {modal?.message && <p style={{ margin: 0, color: 'var(--nw-gray-700)' }}>{modal.message}</p>}
        {modal?.type === 'prompt' && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <input
              className="form-input"
              placeholder={modal.placeholder || ''}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          </div>
        )}
      </Modal>
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
