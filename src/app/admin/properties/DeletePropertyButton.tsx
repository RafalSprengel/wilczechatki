'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProperty } from '@/actions/adminPropertyActions'
import Button from '@/app/_components/UI/Button/Button'
import Modal from '@/app/_components/Modal/Modal'
import styles from './page.module.css'

interface DeletePropertyButtonProps {
  propertyId: string
  propertyName: string
}

export default function DeletePropertyButton({
  propertyId,
  propertyName,
}: DeletePropertyButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteProperty(propertyId)
      router.refresh()
      setShowConfirm(false)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Wystąpił nieznany błąd.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => {
          setError(null)
          setShowConfirm(true)
        }}
      >
        🗑️ Usuń
      </Button>
      
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Potwierdź usunięcie"
        confirmText="Tak, usuń"
        loadingText="Usuwanie"
        cancelText="Anuluj"
        confirmVariant="danger"
        isLoading={isDeleting}
      >
        <p>
          Czy na pewno chcesz trwale usunąć domek "<b>{propertyName}</b>"?
          Tej operacji nie można cofnąć.
        </p>
        {error && <p style={{ color: '#ef4444', marginTop: '12px' }}>{error}</p>}
      </Modal>
    </>
  )
}