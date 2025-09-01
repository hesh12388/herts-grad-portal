'use client'

import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import styles from '@/app/css/home.module.css'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleRegisterGuests = () => {
    if (session) {
      router.push('/dashboard')
    } else {
      signIn('azure-ad', { callbackUrl: `${window.location.origin}/dashboard` })
    }
  }

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <img 
            src="/images/home-background.png" 
            alt="University Campus" 
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} />
        </div>
        
        <div className={styles.heroContent}>
            <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>
                GRADUATION
                <br />
                REGISTRATION
                </h1>
                <p className={styles.heroSubtitle}>
                Register your guests for the upcoming graduation ceremony
                </p>
            </div>
         
            <button 
                onClick={handleRegisterGuests}
                className={styles.primaryButton}
                disabled={status === 'loading'}
            >
                {status === 'loading' ? 'Loading...' : 'Register Guests'}
                <img 
                    src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6850017a31263293a6805893_apps_white_24dp.svg" 
                    alt="" 
                    className={styles.buttonIcon}
                />
            </button>

        </div>
      </section>
    </div>
  )
}