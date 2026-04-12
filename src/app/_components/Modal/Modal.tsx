'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  children: React.ReactNode
  confirmText?: string
  cancelText?: string
  loadingText?: string
  confirmVariant?: 'danger' | 'primary'
  isLoading?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  loadingText = 'Chwileczkę...',
  confirmVariant = 'danger',
  isLoading = false
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelector('button')
      focusable?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const confirmClass = confirmVariant === 'danger' 
    ? styles.btnConfirm 
    : `${styles.btnConfirm} ${styles.btnPrimary}`

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.body}>
          {children}
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              type="button"
              className={confirmClass}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? loadingText : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}