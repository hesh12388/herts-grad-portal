import styles from './css/delete.module.css'

interface ConfirmDeleteModalProps {
  guestName: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ConfirmDeleteModal({ guestName, onConfirm, onCancel, isLoading }: ConfirmDeleteModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Delete Guest</h2>
        <p className={styles.modalText}>
          Are you sure you want to delete <b>{guestName}</b>? This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button className={styles.modalDelete} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}