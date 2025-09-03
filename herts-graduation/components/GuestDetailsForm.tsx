'use client'

import { useState } from 'react'
import styles from './css/guestDetails.module.css'
import { useDeleteGuest } from '@/app/hooks/useGuests'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import router from 'next/router'

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
    type: string
    status: string
    scannedAt?: string
    createdAt: string
  }
}

interface GuestDetailsModalProps {
  guest: Guest
  onClose: () => void
}

export default function GuestDetailsModal({ guest, onClose }: GuestDetailsModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const deleteGuest = useDeleteGuest()
    
    const confirmDelete = async () => {
        if (!guest) return
        try {
            await deleteGuest.mutateAsync(guest.id)
        } catch (error) {
            router.push(`${window.location.pathname}?error=${encodeURIComponent('Failed to delete guest')}`)
        }
        finally{
            onClose()
        }
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    async function fetchSignedUrl(key: string) {
        const res = await fetch('/api/s3/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
        })
        const data = await res.json()
        return data.url
    }

    const handleViewDocument = async () => {
        const key = guest.idImageUrl.split('.amazonaws.com/')[1]
        const newWindow = window.open('', '_blank')
        const url = await fetchSignedUrl(key)
        if (newWindow) newWindow.location.href = url
    }

    const getStatusClass = (status?: string) => {
        switch (status) {
        case 'VALID':
            return `${styles.statusBadge} ${styles.statusValid}`
        case 'SCANNED':
            return `${styles.statusBadge} ${styles.statusScanned}`
        default:
            return `${styles.statusBadge} ${styles.statusPending}`
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
        {showDeleteConfirm && (
            <ConfirmDeleteModal
                guestName={`${guest.firstName} ${guest.lastName}`}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                isLoading={deleteGuest.isPending}
            />
        )}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>GUEST DETAILS</h2>
          <p className={styles.subtitle}>View guest information and QR code status</p>
        </div>

        <div className={styles.content}>
          {/* Guest ID */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Guest ID</label>
            <div className={styles.value}>
              {guest.id}
              <div className={styles.idText}>{guest.id}</div>
            </div>
          </div>

          {/* First Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>First Name</label>
            <div className={styles.value}>{guest.firstName}</div>
          </div>

          {/* Last Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Last Name</label>
            <div className={styles.value}>{guest.lastName}</div>
          </div>

          {/* Government ID */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Government ID Number</label>
            <div className={styles.value}>{guest.governmentId}</div>
          </div>

          {/* Phone Number */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Phone Number</label>
            <div className={styles.value}>{guest.phoneNumber}</div>
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.value}>{guest.email}</div>
          </div>

          {/* ID Document */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Government ID Document</label>
            <div className={styles.idDocumentSection}>
              <a 
                onClick={handleViewDocument}
                className={styles.idDocumentLink}
              >
                📄 View Document
              </a>
            </div>
          </div>

          {/* QR Code Status */}
          <div className={styles.statusSection}>
            <label className={styles.label}>QR Code Status</label>
            <div className={styles.statusGrid}>
              <div>
                <div className={getStatusClass(guest.qrCode?.status)}>
                  {guest.qrCode?.status || 'PENDING'}
                </div>
                {guest.qrCode && (
                  <div className={styles.metaInfo}>
                    Created: {formatDate(guest.qrCode.createdAt)}
                  </div>
                )}
              </div>
              {guest.qrCode?.scannedAt && (
                <div>
                  <div className={styles.metaInfo}>
                    <strong>Scanned At:</strong><br />
                    {formatDate(guest.qrCode.scannedAt)}
                  </div>
                </div>
              )}
            </div>
            {guest.qrCode && (
              <div className={styles.idText}>
                QR Code ID: {guest.qrCode.code}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Created</label>
            <div className={styles.value}>{formatDate(guest.createdAt)}</div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Last Updated</label>
            <div className={styles.value}>{formatDate(guest.updatedAt)}</div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <div className={styles.closeButtonContainer}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.closeButton}`}
              disabled={deleteGuest.isPending}
            >
              Close
            </button>
          </div>
          
          <div className={styles.deleteButtonContainer}>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className={`${styles.button} ${styles.deleteButton}`}
              disabled={deleteGuest.isPending}
            >
              {deleteGuest.isPending && <span className={styles.loadingSpinner}></span>}
              {deleteGuest.isPending ? 'Deleting...' : 'Delete Guest'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}