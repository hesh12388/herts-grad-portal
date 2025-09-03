'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCreateGraduate } from '@/app/hooks/useGuests'
import styles from './css/addGraduate.module.css'

interface AddGraduateFormProps {
  onClose: () => void
}

export default function AddGraduateForm({ onClose }: AddGraduateFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const createGraduate = useCreateGraduate()
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    major: '',
    dateOfBirth: '',
    gafIdNumber: '',
    governmentId: '',
  })
  
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(selectedFile.type)) {
        setErrors(prev => ({ ...prev, file: 'Please upload a PDF or image file (JPEG, JPG, PNG)' }))
        return
      }
      
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

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.major.trim()) newErrors.major = 'Major is required'
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    if (!formData.gafIdNumber.trim()) newErrors.gafIdNumber = 'GAF ID number is required'
    if (!formData.governmentId.trim()) newErrors.governmentId = 'Government ID is required'
    if (!file) newErrors.file = 'Government ID document is required'

    // Date validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 16 || age > 100) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await createGraduate.mutateAsync({
        ...formData,
        idImage: file!,
      })
      
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create graduate registration'
      router.push(`/dashboard?error=${encodeURIComponent(errorMessage)}`)
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
          <h2 className={styles.title}>GRADUATE REGISTRATION</h2>
          <p className={styles.subtitle}>Complete your graduation registration and receive your QR code</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Full Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter your full name"
            />
            {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
          </div>

          {/* Major */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Major/Field of Study <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="major"
              value={formData.major}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter your major"
            />
            {errors.major && <div className={styles.errorMessage}>{errors.major}</div>}
          </div>

          {/* Date of Birth */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Date of Birth <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={styles.input}
            />
            {errors.dateOfBirth && <div className={styles.errorMessage}>{errors.dateOfBirth}</div>}
          </div>

          {/* GAF ID Number */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              GAF ID Number <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="gafIdNumber"
              value={formData.gafIdNumber}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter your GAF ID number"
            />
            {errors.gafIdNumber && <div className={styles.errorMessage}>{errors.gafIdNumber}</div>}
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
            disabled={createGraduate.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className={`${styles.button} ${styles.submitButton}`}
            disabled={createGraduate.isPending}
          >
            {createGraduate.isPending && <span className={styles.loadingSpinner}></span>}
            {createGraduate.isPending ? 'Registering...' : 'Complete Registration'}
          </button>
        </div>
      </div>
    </div>
  )
}