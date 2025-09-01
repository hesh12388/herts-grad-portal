'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import styles from '@/app/css/verifyPage.module.css'

interface VerificationResult {
  message: string
  status: 'SUCCESS' | 'INVALID' | 'ERROR' | 'USED'
  guest?: {
    firstName: string
    lastName: string
    governmentId: string
  }
  scannedAt?: string
  error?: string
}

export default function VerifyPage() {
  const params = useParams()
  const qrCodeId = params.qrCodeId as string
  
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyQRCode = async () => {
      try {
        const response = await fetch(`/api/verify/${qrCodeId}`)
        const data = await response.json()
        
        if (response.ok) {
          setResult({
            message: data.message,
            status: 'SUCCESS',
            guest: data.guest,
            scannedAt: data.scannedAt
          })
        } else {
          setResult({
            message: data.error || 'Verification failed',
            status: data.status || 'ERROR',
            scannedAt: data.scannedAt,
            error: data.error
          })
        }
      } catch (error) {
        setResult({
          message: 'Failed to verify QR code',
          status: 'ERROR',
          error: 'Network error occurred'
        })
      } finally {
        setLoading(false)
      }
    }

    if (qrCodeId) {
      verifyQRCode()
    }
  }, [qrCodeId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>VERIFYING QR CODE</h1>
            <p className={styles.subtitle}>Please wait while we verify your QR code</p>
          </div>
          <div className={styles.content}>
            <div className={styles.loadingContent}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Verifying QR code...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorHeader}>
            <h1 className={styles.title}>VERIFICATION ERROR</h1>
            <p className={styles.subtitle}>Unable to process QR code</p>
          </div>
          <div className={styles.content}>
            <div className={styles.errorContent}>
              <div className={styles.errorIcon}>❌</div>
              <p className={styles.errorMessage}>Something went wrong while verifying your QR code.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success State
  if (result.status === 'SUCCESS') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successHeader}>
            <h1 className={styles.title}>ACCESS GRANTED</h1>
            <p className={styles.subtitle}>QR code verified successfully</p>
          </div>
          <div className={styles.content}>
            <div className={styles.successContent}>
              <div className={styles.successIcon}>✅</div>
              <p className={styles.successMessage}>Welcome! Your QR code has been verified.</p>
              
              {result.guest && (
                <div className={styles.guestInfo}>
                  <div className={styles.guestName}>
                    {result.guest.firstName} {result.guest.lastName}
                  </div>
                  <div className={styles.guestDetail}>
                    ID: {result.guest.governmentId}
                  </div>
                  {result.scannedAt && (
                    <div className={styles.timestamp}>
                      Verified at: {formatDate(result.scannedAt)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Already Scanned State
  if (result.status === 'USED') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.warningHeader}>
            <h1 className={styles.title}>ALREADY USED</h1>
            <p className={styles.subtitle}>This QR code has been used</p>
          </div>
          <div className={styles.content}>
            <div className={styles.errorContent}>
              <div className={styles.errorIcon}>⚠️</div>
              <p className={styles.warningMessage}>This QR code has already been scanned.</p>
              
              <div className={styles.warningDetails}>
                <p><strong>Status:</strong> Previously used</p>
                {result.scannedAt && (
                  <p><strong>Original scan time:</strong> {formatDate(result.scannedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error States (INVALID or ERROR)
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.errorHeader}>
          <h1 className={styles.title}>ACCESS DENIED</h1>
          <p className={styles.subtitle}>QR code verification failed</p>
        </div>
        <div className={styles.content}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>❌</div>
            <p className={styles.errorMessage}>
              {result.status === 'INVALID' ? 'Invalid QR code' : result.message}
            </p>
            
            <div className={styles.errorDetails}>
              {result.error && <p>{result.error}</p>}
              <p>Please contact the event organizer if you believe this is an error.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}