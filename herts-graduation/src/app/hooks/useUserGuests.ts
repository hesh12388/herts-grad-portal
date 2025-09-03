import { useQuery } from '@tanstack/react-query'

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

export function useUserGuests(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-guests', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/guests/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user guests')
      }
      
      const data = await response.json()
      return data.guests as Guest[]
    },
    enabled
  })
}

