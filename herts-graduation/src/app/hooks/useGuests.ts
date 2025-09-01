import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Types
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

interface CreateGuestData {
  firstName: string
  lastName: string
  governmentId: string
  phoneNumber: string
  email: string
  idImage: File
}

// Get guests query
export function useGuests() {
  return useQuery({
    queryKey: ['guests'],
    queryFn: async (): Promise<Guest[]> => {
      const response = await fetch('/api/guests')
      if (!response.ok) {
        throw new Error('Failed to fetch guests')
      }
      const data = await response.json()
      return data.guests
    }
  })
}

// Create guest mutation
export function useCreateGuest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateGuestData) => {
      const formData = new FormData()
      formData.append('firstName', data.firstName)
      formData.append('lastName', data.lastName)
      formData.append('governmentId', data.governmentId)
      formData.append('phoneNumber', data.phoneNumber)
      formData.append('email', data.email)
      formData.append('idImage', data.idImage)

      const response = await fetch('/api/guests', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create guest')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['guests'], (old: Guest[] | undefined) => {
        if (!old) return [data.guest]
        return [data.guest, ...old]
      })
    }
  })
}

// Delete guest mutation
export function useDeleteGuest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (guestId: string) => {
      const response = await fetch(`/api/guests?id=${guestId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete guest')
      }

      return response.json()
    },
    onSuccess: (_, guestId) => {
      queryClient.setQueryData(['guests'], (old: Guest[] | undefined) => {
        if (!old) return []
        return old.filter(guest => guest.id !== guestId)
      })
    }
  })
}