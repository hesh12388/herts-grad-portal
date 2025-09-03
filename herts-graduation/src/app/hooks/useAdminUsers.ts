import { useInfiniteQuery } from '@tanstack/react-query'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  _count: {
    guests: number
  },
  graduate:{
    id:string
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
  },
  stats:{
    totalUsers: number,
    totalGuests: number,
    totalGraduates: number
  }
}

export function useAdminUsers(search: string = '') {
  return useInfiniteQuery({
    queryKey: ['admin-users', search],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20'
      })
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      return response.json() as Promise<UsersResponse>
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage 
        ? lastPage.pagination.page + 1 
        : undefined
    },
    initialPageParam: 1,
  })
}