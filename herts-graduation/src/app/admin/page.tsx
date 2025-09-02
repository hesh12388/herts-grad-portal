'use client'

import { useState, useMemo } from 'react'
import { useAdminUsers} from '@/app/hooks/useAdminUsers'
import { useUserGuests } from '@/app/hooks/useUserGuests'
import GuestDetailsModal from '../../../components/GuestDetailsForm'
import styles from '@/app/css/admin.module.css'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  _count: {
    guests: number
  }
}

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

export default function AdminPage() {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useAdminUsers(searchTerm)

  // Flatten all users from all pages
  const allUsers = useMemo(() => {
    return data?.pages.flatMap(page => page.users) || []
  }, [data])

  // Calculate summary stats
  const totalUsers = data?.pages[0]?.pagination.totalCount || 0
  const totalGuests = allUsers.reduce((sum, user) => sum + user._count.guests, 0)

  const handleUserToggle = (userId: string) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          Failed to load admin dashboard. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>ADMIN DASHBOARD</h1>
          <p className={styles.subtitle}>Manage users and their guests</p>
        </div>

        {/* Search */}
        <form 
        className={styles.searchSection} 
        onSubmit={e => {
            e.preventDefault()
            setSearchTerm(searchInput)
        }}>
            <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
                Search
            </button>
        </form>

        {/* Summary Stats */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Total Users</div>
            <div className={styles.statValue}>{totalUsers}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Total Guests</div>
            <div className={styles.statValue}>{totalGuests}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Avg Guests/User</div>
            <div className={styles.statValue}>
              {totalUsers > 0 ? (totalGuests / totalUsers).toFixed(1) : '0'}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className={styles.usersSection}>
          {allUsers.length > 0 ? (
            <>
              {allUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isExpanded={expandedUsers.has(user.id)}
                  onToggle={() => handleUserToggle(user.id)}
                  onGuestClick={setSelectedGuest}
                  getStatusClass={getStatusClass}
                />
              ))}
              
              {/* Load More Button */}
              {hasNextPage && (
                <div className={styles.loadMoreContainer}>
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className={styles.loadMoreButton}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More Users'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noGuests}>
              No users found matching your search.
            </div>
          )}
        </div>

        {/* Guest Details Modal */}
        {selectedGuest && (
          <GuestDetailsModal
            guest={selectedGuest}
            onClose={() => setSelectedGuest(null)}
          />
        )}
      </div>
    </div>
  )
}

function UserCard({ 
  user, 
  isExpanded, 
  onToggle, 
  onGuestClick, 
  getStatusClass 
}: {
  user: User
  isExpanded: boolean
  onToggle: () => void
  onGuestClick: (guest: Guest) => void
  getStatusClass: (status?: string) => string
}) {
  const { data: guests, isLoading, error } = useUserGuests(user.id, isExpanded)

  return (
    <div className={styles.userCard}>
      <div className={styles.userHeader} onClick={onToggle}>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.name || 'Unknown User'}</div>
          <div className={styles.userEmail}>{user.email}</div>
        </div>
        <div className={styles.userStats}>
          <div className={styles.guestCount}>
            {guests ? guests.length : user._count.guests} guests
          </div>
          <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
            ▼
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.guestsSection}>
          {isLoading && (
            <div className={styles.guestsLoading}>Loading guests...</div>
          )}
          
          {error && (
            <div className={styles.guestsError}>Failed to load guests</div>
          )}
          
          {guests && guests.length > 0 && (
            <div className={styles.guestsList}>
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className={styles.guestItem}
                  onClick={() => onGuestClick(guest)}
                >
                  <div className={styles.guestInfo}>
                    <div className={styles.guestName}>
                      {guest.firstName} {guest.lastName}
                    </div>
                    <div className={styles.guestEmail}>{guest.email}</div>
                  </div>
                  <div className={getStatusClass(guest.qrCode?.status)}>
                    {guest.qrCode?.status || 'PENDING'}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {guests && guests.length === 0 && (
            <div className={styles.noGuests}>No guests registered yet</div>
          )}
        </div>
      )}
    </div>
  )
}