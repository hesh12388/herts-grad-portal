'use client'

import styles from './css/graduateDetails.module.css'

interface Graduate {
  id: string
  name: string
  major: string
  dateOfBirth: string
  gafIdNumber: string
  governmentId: string
  idImageUrl: string
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

interface ViewGraduateDetailsProps {
  graduate: Graduate
  onClose: () => void
}

export default function ViewGraduateDetails({ graduate, onClose }: ViewGraduateDetailsProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
        const key = graduate.idImageUrl.split('.amazonaws.com/')[1]
        const newWindow = window.open('', '_blank')
        const url = await fetchSignedUrl(key)
        if (newWindow) newWindow.location.href = url
    }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>GRADUATE REGISTRATION DETAILS</h2>
          <p className={styles.subtitle}>View your graduation registration and QR code status</p>
        </div>

        <div className={styles.content}>
          {/* Graduate ID */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Registration ID</label>
            <div className={styles.value}>
              {graduate.id}
              <div className={styles.idText}>{graduate.id}</div>
            </div>
          </div>

          {/* Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Full Name</label>
            <div className={styles.value}>{graduate.name}</div>
          </div>

          {/* Major */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Major/Field of Study</label>
            <div className={styles.value}>{graduate.major}</div>
          </div>

          {/* Date of Birth */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Date of Birth</label>
            <div className={styles.value}>{formatDate(graduate.dateOfBirth)}</div>
          </div>

          {/* GAF ID Number */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>GAF ID Number</label>
            <div className={styles.value}>{graduate.gafIdNumber}</div>
          </div>

          {/* Government ID */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Government ID Number</label>
            <div className={styles.value}>{graduate.governmentId}</div>
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
                <div className={getStatusClass(graduate.qrCode?.status)}>
                  {graduate.qrCode?.status || 'PENDING'}
                </div>
                {graduate.qrCode && (
                  <div className={styles.metaInfo}>
                    Created: {formatDateTime(graduate.qrCode.createdAt)}
                  </div>
                )}
              </div>
              {graduate.qrCode?.scannedAt && (
                <div>
                  <div className={styles.metaInfo}>
                    <strong>Scanned At:</strong><br />
                    {formatDateTime(graduate.qrCode.scannedAt)}
                  </div>
                </div>
              )}
            </div>
            {graduate.qrCode && (
              <div className={styles.idText}>
                QR Code ID: {graduate.qrCode.code}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Registration Date</label>
            <div className={styles.value}>{formatDateTime(graduate.createdAt)}</div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Last Updated</label>
            <div className={styles.value}>{formatDateTime(graduate.updatedAt)}</div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <div className={styles.closeButtonContainer}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.closeButton}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}