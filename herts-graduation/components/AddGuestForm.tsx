'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateGuest } from '@/app/hooks/useGuests'
import styles from './css/addGuest.module.css'

interface AddGuestFormProps {
  onClose: () => void
}

export default function AddGuestForm({ onClose }: AddGuestFormProps) {
  const router = useRouter()
  const createGuest = useCreateGuest()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    governmentId: '',
    phoneNumber: '',
    email: '',
  })
  
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(selectedFile.type)) {
        setErrors(prev => ({ ...prev, file: 'Please upload a PDF or image file (JPEG, JPG, PNG)' }))
        return
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 10MB' }))
        return
      }
      
      setFile(selectedFile)
      setErrors(prev => ({ ...prev, file: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.governmentId.trim()) newErrors.governmentId = 'Government ID is required'
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!file) newErrors.file = 'Government ID document is required'

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation (basic)
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await createGuest.mutateAsync({
        ...formData,
        idImage: file!,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create guest'
      router.push(`/dashboard?error=${encodeURIComponent(errorMessage)}`)
    }
    finally {
      onClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>ADD NEW GUEST</h2>
          <p className={styles.subtitle}>Fill in the guest information and upload their government ID</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* First Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              First Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter first name"
            />
            {errors.firstName && <div className={styles.errorMessage}>{errors.firstName}</div>}
          </div>

          {/* Last Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Last Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter last name"
            />
            {errors.lastName && <div className={styles.errorMessage}>{errors.lastName}</div>}
          </div>

          {/* Government ID */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Government ID Number <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="governmentId"
              value={formData.governmentId}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter government ID number"
            />
            {errors.governmentId && <div className={styles.errorMessage}>{errors.governmentId}</div>}
          </div>

          {/* Phone Number */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Phone Number <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter phone number (e.g., +1234567890)"
            />
            {errors.phoneNumber && <div className={styles.errorMessage}>{errors.phoneNumber}</div>}
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Email Address <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter email address"
            />
            {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
          </div>

          {/* File Upload */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Government ID Document <span className={styles.required}>*</span>
            </label>
            <div className={styles.fileInput}>
              <input
                type="file"
                id="idImage"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="idImage" className={styles.fileInputLabel}>
                <div>📄 Click to upload document</div>
                <div className={styles.fileInputText}>PDF, JPG, PNG (max 10MB)</div>
              </label>
            </div>
            {file && <div className={styles.fileName}>Selected: {file.name}</div>}
            {errors.file && <div className={styles.errorMessage}>{errors.file}</div>}
          </div>
        </form>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.button} ${styles.cancelButton}`}
            disabled={createGuest.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className={`${styles.button} ${styles.submitButton}`}
            disabled={createGuest.isPending}
          >
            {createGuest.isPending && <span className={styles.loadingSpinner}></span>}
            {createGuest.isPending ? 'Creating Guest...' : 'Create Guest'}
          </button>
        </div>
      </div>
    </div>
  )
}