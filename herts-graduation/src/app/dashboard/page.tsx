'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGuests, useDeleteGuest } from '@/app/hooks/useGuests'
import styles from '@/app/css/dashboard.module.css'
import AddGuestForm from '../../../components/AddGuestForm'
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal'
import GuestDetailsForm from '../../../components/GuestDetailsForm'

interface Guest {
  id: string
  firstName: string
  lastName: string
  governmentId: string
  idImageUrl: string
  phoneNumber: string
  email: string
  createdAt: string
  updatedAt: string
  qrCode?: {
    id: string
    code: string
    status: string
    scannedAt?: string
    createdAt: string
  }
}

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showAddForm, setShowAddForm] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  
  const { data: guests, isLoading, isError } = useGuests()
  const deleteGuest = useDeleteGuest()

  const handleDeleteGuest = (guest: Guest) => {
    setGuestToDelete(guest)
  }

  const confirmDelete = async () => {
    if (!guestToDelete) return
    try {
      await deleteGuest.mutateAsync(guestToDelete.id)
      setGuestToDelete(null)
    } catch (error) {
      router.push(`/dashboard?error=${encodeURIComponent('Failed to delete guest')}`)
    }
    finally{
      setGuestToDelete(null)
    }
  }

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'VALID':
        return `${styles.statusBadge} ${styles.statusValid}`
      case 'USED':
        return `${styles.statusBadge} ${styles.statusScanned}`
      default:
        return `${styles.statusBadge} ${styles.statusPending}`
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading guests...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    router.push('/dashboard?error=Failed to load guests')
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>GUEST MANAGEMENT</h1>
          <p className={styles.subtitle}>Manage your event guests and their QR codes</p>
        </div>

        {/* Add Guest Button */}
        <div className={styles.addButtonContainer}>
          <button
            className={styles.addButton}
            onClick={() => setShowAddForm(true)}
          >
            ADD NEW GUEST
          </button>
        </div>

        {/* Guests Table */}
        <div className={styles.tableContainer}>
          {guests && guests.length > 0 ? (
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeaderCell}>Name</th>
                  <th className={styles.tableHeaderCell}>Contact</th>
                  <th className={styles.tableHeaderCell}>Government ID</th>
                  <th className={styles.tableHeaderCell}>QR Status</th>
                  <th className={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {guests.map((guest) => (
                  <tr key={guest.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.guestName}>
                        {guest.firstName} {guest.lastName}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.guestEmail}>{guest.email}</div>
                      <div className={styles.guestPhone}>{guest.phoneNumber}</div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.governmentId}>{guest.governmentId}</span>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={getStatusClass(guest.qrCode?.status)}>
                        {guest.qrCode?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <button
                        className={`${styles.actionButton} ${styles.viewButton}`}
                        onClick={() => setSelectedGuest(guest)}
                      >
                        View
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDeleteGuest(guest)}
                        disabled={deleteGuest.isPending}
                      >
                        {deleteGuest.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>No guests added yet.</p>
              <button
                className={styles.emptyStateButton}
                onClick={() => setShowAddForm(true)}
              >
                Add your first guest
              </button>
            </div>
          )}
        </div>
      </div>

        {/* Add Guest Form Modal */}
        {showAddForm && (
            <AddGuestForm onClose={() => setShowAddForm(false)} />
        )}

        {guestToDelete && (
            <ConfirmDeleteModal
            guestName={`${guestToDelete.firstName} ${guestToDelete.lastName}`}
            onConfirm={confirmDelete}
            onCancel={() => setGuestToDelete(null)}
            isLoading={deleteGuest.isPending}
            />
        )}

        {/* Guest Details Modal */}
        {selectedGuest && (
            <GuestDetailsForm
                guest={selectedGuest}
                onClose={() => setSelectedGuest(null)}
            />
        )}
    </div>
  )
}