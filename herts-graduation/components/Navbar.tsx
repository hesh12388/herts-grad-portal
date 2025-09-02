'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import styles from './css/nav.module.css'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function Navbar() {

  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth > 768) {
            setMobileMenuOpen(false)
        }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    }, [])

  const handleLogin = () => {
    signIn('azure-ad', { callbackUrl: `${window.location.origin}/dashboard`  })
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const callbackParam = searchParams.get('callbackUrl')
    if (errorParam) {
      switch (errorParam) {
        case 'AccessDenied':
          setError('Access denied. Please use your university email to sign in.')
          break
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
          setError('There was a problem signing in. Please try again.')
          break
        default:
          setError(errorParam)
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
      
      // Clean up URL (remove error param)
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('error')
      const newUrl = `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`
      router.replace(newUrl)
    }

    if (callbackParam) {
        signIn('azure-ad', { callbackUrl: `${window.location.origin}${callbackParam}`  })
        setMobileMenuOpen(false)
        // Clean up URL (remove callbackUrl param)
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.delete('callbackUrl')
        const newUrl = `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`
        router.replace(newUrl)
    }
  }, [searchParams, router])


  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div
            className={styles.errorBanner}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          {/* Logo */}
          <Link className={styles.logo} href="/">
            <Image src="/images/logo.png" alt="University Logo" fill />
          </Link>
          
          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
            <div className={styles.navLinks}>
              <button onClick={() => router.push('/')} className={styles.navLink}>
                HOME
              </button>
              {session && (
                <button onClick={() => router.push('/dashboard')} className={styles.navLink}>
                  DASHBOARD
                </button>
              )}
              {session?.user.role === "ADMIN" && (
                <button onClick={() => router.push('/admin')} className={styles.navLink}>
                  ADMIN DASHBOARD
                </button>
              )}
              {session && (
                <span className={styles.userEmail}>{session.user.email}</span>
              )}
            </div>

            {session ? (
                <button onClick={handleLogout} className={styles.button}>
                    <div className={styles.buttonText}>
                            Logout
                    </div>
                    <img width="Auto" height="Auto" alt="" src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6850017a31263293a6805893_apps_white_24dp.svg" loading="lazy" />
                </button>
                ) : (
                <button onClick={handleLogin} className={styles.button}>
                    <div className={styles.buttonText}>
                        Login
                    </div>
                    <img width="Auto" height="Auto" alt="" src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6850017a31263293a6805893_apps_white_24dp.svg" loading="lazy" />
                </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <div className={styles.mobileMenuIcon}>
              <Image 
                src={"/images/menu-grid.png"} 
                alt="Menu" 
                fill 
                />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
         {mobileMenuOpen && (
            <motion.div
                className={styles.mobileMenuOverlay}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <div className={styles.mobileMenuContent}>
                    <button 
                    onClick={() => { router.push('/'); setMobileMenuOpen(false); }} 
                    className={styles.mobileNavLink}
                    >
                    HOME
                    </button>
                    {session && (
                    <button 
                        onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }} 
                        className={styles.mobileNavLink}
                    >
                        DASHBOARD
                    </button>
                    )}
                    {session?.user.role === "ADMIN" && (
                    <button 
                        onClick={() => { router.push('/admin'); setMobileMenuOpen(false); }} 
                        className={styles.mobileNavLink}
                    >
                        ADMIN DASHBOARD
                    </button>
                    )}
                    {session && (
                      <div className={styles.mobileUserEmail}>{session.user.email}</div>
                    )}
                    
                    {session ? (
                        <button onClick={handleLogout} className={styles.mobileButton}>
                            <div className={styles.buttonText}>
                                    Logout
                            </div>
                            <img width="Auto" height="Auto" alt="" src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6850017a31263293a6805893_apps_white_24dp.svg" loading="lazy" />
                        </button>
                        ) : (
                        <button onClick={handleLogin} className={styles.mobileButton}>
                            <div className={styles.buttonText}>
                                Login
                            </div>
                            <img width="Auto" height="Auto" alt="" src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6850017a31263293a6805893_apps_white_24dp.svg" loading="lazy" />
                        </button>
                    )}
                </div>
             </motion.div>
         )}
      </AnimatePresence>
    </>
  )
}