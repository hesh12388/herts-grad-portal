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
    type: string
    status: string
    scannedAt?: string
    createdAt: string
  }
}

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

interface CreateGuestData {
  firstName: string
  lastName: string
  governmentId: string
  phoneNumber: string
  email: string
  idImage: File
}

interface CreateGraduateData {
  name: string
  major: string
  dateOfBirth: string
  gafIdNumber: string
  governmentId: string
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
    onSuccess: (data, guestId) => {
      queryClient.setQueryData(['guests'], (old: Guest[] | undefined) => {
        if (!old) return []
        return old.filter(guest => guest.id !== guestId)
      })

      queryClient.setQueryData(['user-guests', data.userId], (old: Guest[] | undefined) => {
        if (!old) return []
        return old.filter(guest => guest.id !== guestId)
      })
    }
  })
}

export function useGraduate() {
  return useQuery({
    queryKey: ['graduate'],
    queryFn: async (): Promise<Graduate | null> => {
      const response = await fetch('/api/graduates')
      if (!response.ok) {
        throw new Error('Failed to fetch graduate')
      }
      const data = await response.json()
      return data.graduate
    }
  })
}

export function useCreateGraduate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateGraduateData) => {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('major', data.major)
      formData.append('dateOfBirth', data.dateOfBirth)
      formData.append('gafIdNumber', data.gafIdNumber)
      formData.append('governmentId', data.governmentId)
      formData.append('idImage', data.idImage)

      const response = await fetch('/api/graduates', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create graduate registration')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Update the graduate query cache
      queryClient.setQueryData(['graduate'], data.graduate)
    }
  })
}

export function useUserGraduate(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-graduate', userId],
    queryFn: async () => {
      const response = await fetch(`/api/graduates/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user graduate')
      }
      
      const data = await response.json()
      return data.graduate as Graduate | null
    },
    enabled
  })
}