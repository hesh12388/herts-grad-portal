'use client'

import { useState, useMemo } from 'react'
import { useAdminUsers} from '@/app/hooks/useAdminUsers'
import { useUserGuests } from '@/app/hooks/useUserGuests'
import GuestDetailsModal from '../../../components/GuestDetailsForm'
import styles from '@/app/css/admin.module.css'
import { useUserGraduate } from '@/app/hooks/useGuests'
import ViewGraduateDetails from '../../../components/GraduateDetailsForm'

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

export default function AdminPage() {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [selectedGraduate, setSelectedGraduate] = useState<Graduate | null>(null)
  const [isExportingGuests, setIsExportingGuests] = useState(false)
  const [isExportingGraduates, setIsExportingGraduates] = useState(false)
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
  const totalUsers = data?.pages[0]?.stats?.totalUsers || 0
  const totalGuests = data?.pages[0]?.stats?.totalGuests || 0
  const totalGraduates = data?.pages[0]?.stats?.totalGraduates || 0

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

  const handleExportGuests = async () => {
    setIsExportingGuests(true)
    try {
      const res = await fetch('/api/export/guests')
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        alert('Failed to generate guests PDF.')
      }
    } catch (err) {
      alert('Error exporting guests.')
    } finally {
      setIsExportingGuests(false)
    }
  }

  const handleExportGraduates = async () => {
    setIsExportingGraduates(true)
    try {
      const res = await fetch('/api/export/graduates')
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        alert('Failed to generate graduates PDF.')
      }
    } catch (err) {
      alert('Error exporting graduates.')
    } finally {
      setIsExportingGraduates(false)
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
        <div className={styles.searchContainer}>
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
          <div className={styles.exportContainer}>
              <button
                className={styles.exportGuestButton}
                onClick={handleExportGuests}
                disabled={isExportingGuests}
              >
                {isExportingGuests ? (
                  <>
                    Exporting...
                    <span className={styles.exportingSpinner} />
                  </>
                ) : (
                  'Export Guests'
                )}
              </button>
              <button
                className={styles.exportGraduateButton}
                onClick={handleExportGraduates}
                disabled={isExportingGraduates}
              >
                {isExportingGraduates ? (
                  <>
                    Exporting...
                    <span className={styles.exportingSpinner} />
                  </>
                ) : (
                  'Export Graduates'
                )}
              </button>
          </div>
        </div>
        

        {/* Summary Stats */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Total Graduates</div>
            <div className={styles.statValue}>{totalUsers}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Total Guests</div>
            <div className={styles.statValue}>{totalGuests}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>Total Graduates Registered</div>
            <div className={styles.statValue}>{totalGraduates}</div>
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
                  onGuestClick={(guest: Guest) => {setSelectedGuest(guest); setSelectedGraduate(null)}}
                  onGraduateClick={(graduate: Graduate) => {setSelectedGuest(null); setSelectedGraduate(graduate)}}
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
        {selectedGraduate && (
          <ViewGraduateDetails
            graduate={selectedGraduate}
            onClose={() => setSelectedGraduate(null)}
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
  onGraduateClick, 
  getStatusClass 
}: {
  user: User
  isExpanded: boolean
  onToggle: () => void
  onGuestClick: (guest: Guest) => void
  onGraduateClick: (graduate: Graduate) => void
  getStatusClass: (status?: string) => string
}) {
  const { data: guests, isLoading, error } = useUserGuests(user.id, isExpanded)
  const { data: graduate, isLoading: graduateLoading, error: graduateError } = useUserGraduate(user.id, isExpanded)

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
            {user.graduate ? (
              <div className={styles.graduateIndicator}>
                🎓 Registered
              </div>
            ):(
              <div className={styles.notRegisteredIndicator}>
                🎓 Not Registered
              </div>
            )}
            <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
              ▼
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.guestsSection}>
            {/* Graduate Registration Section */}
            <div className={styles.graduateSection}>
              <div className={styles.sectionHeader}>Graduate Registration</div>
              
              {graduateLoading ? (
                <div className={styles.guestsLoading}>Loading graduate registration...</div>
              ) : graduateError ? (
                <div className={styles.guestsError}>Failed to load graduate registration</div>
              ) : graduate ? (
                <div
                  className={styles.graduateItem}
                  onClick={() => onGraduateClick(graduate)}
                >
                  <div className={styles.guestInfo}>
                    <div className={styles.guestName}>
                      🎓 {graduate.name}
                    </div>
                    <div className={styles.guestEmail}>{graduate.major}</div>
                  </div>
                  <div className={getStatusClass(graduate.qrCode?.status)}>
                    {graduate.qrCode?.status || 'PENDING'}
                  </div>
                </div>
              ) : (
                <div className={styles.noRegistration}>
                  No graduate registration completed
                </div>
              )}
            </div>

            {/* Guest Invitations Section */}
            <div className={styles.guestSection}>
              <div className={styles.sectionHeader}>Guest Invitations</div>
              
              {isLoading ? (
                <div className={styles.guestsLoading}>Loading guests...</div>
              ) : error ? (
                <div className={styles.guestsError}>Failed to load guests</div>
              ) : guests && guests.length > 0 ? (
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
              ) : (
                <div className={styles.noGuests}>
                  No guest invitations sent
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
}