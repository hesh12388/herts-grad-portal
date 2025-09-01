'use client'

import Image from 'next/image'
import styles from './css/footer.module.css'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'


export default function Footer() {

    const router = useRouter()
    const { data: session } = useSession()
    
    const handleRegisterGuests = () => {
        if (session) {
          router.push('/dashboard')
        } else {
          // Trigger NextAuth sign-in
          signIn('azure-ad', { callbackUrl: `${window.location.origin}/dashboard`  })
        }
    }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Top Section */}
        <div className={styles.topSection}>
         
            <h2 className={styles.footerTitle}>CAP & GOWN REGISTRATION</h2>
            <button className={styles.registerButton} onClick={handleRegisterGuests}>
              Register Guests
              <img 
                src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6850017a31263293a6805893_apps_white_24dp.svg" 
                alt="" 
                className={styles.buttonIcon}
              />
            </button>

        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
        
            <div className={styles.logoColumn}>
                <div className={styles.logo}>
                    <img src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/64797de73f5a05c19f6b731a_UH-logo-white.svg" alt="University Logo"/>
                </div>
            </div>

            <div className={styles.footerColumn}>
                <h3 className={styles.columnTitle}>Contact Us</h3>
                <div className={styles.contactItem}>
                    <img 
                        src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6462783e1580ecb93d4e3f37_Vector.webp" 
                        alt="Location Icon" 
                        className={styles.contactIcon}
                    />
                    <span className={styles.contactText}>Plot Code 6, R5, New Administrative Capital, Egypt</span>
                </div>
                <div className={styles.contactItem}>
                    <img 
                        src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/646278540df968af755ca390_Vector.webp" 
                        alt="Phone Icon" 
                        className={styles.contactIcon}
                    />
                    <span className={styles.contactText}>16192</span>
                </div>
                <div className={styles.contactItem}>
                    <img 
                        src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/6462786962cb72f1b15b5daa_Vector.webp" 
                        alt="Time Icon" 
                        className={styles.contactIcon}
                    />
                    <span className={styles.contactText}>
                        Admissions Office Working: 
                        <br />
                        Saturday: 10am - 5pm
                        <br />
                        Sunday - Wednesday: 9am - 6pm
                        <br />
                        Thursday: 9am - 4pm
                    </span>
                </div>

            </div>

            <div className={styles.footerColumn}>
                <h3 className={styles.columnTitle}>Follow Us</h3>
                <div className={styles.socialIcons}>
                    <a href="https://www.facebook.com/UHGAF/" target="_blank" rel="noopener noreferrer">
                        <img 
                            src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/646278a30fcb43e10830d343_facebook-app-symbol.webp" 
                            alt="Facebook" 
                            className={styles.socialIcon}
                        />
                    </a>
                    <a href="https://www.instagram.com/uh_gaf/" target="_blank" rel="noopener noreferrer">
                        <img 
                            src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/646278a30fcb43e10830d349_instagram.webp" 
                            alt="Instagram" 
                            className={styles.socialIcon}
                        />
                    </a>
                    <a href="https://www.youtube.com/@UHGAF" target="_blank" rel="noopener noreferrer">
                        <img 
                            src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/646f04732fb4adbd05a4921d_youtube.webp"
                            alt="Youtube" 
                            className={styles.socialIcon}
                        />
                    </a>
                    <a href="https://www.linkedin.com/company/university-of-hertfordshire-hosted-by-global-academic-foundation/" target="_blank" rel="noopener noreferrer">
                        <img 
                            src="https://cdn.prod.website-files.com/646225713b452fec5e17e535/646278a30fcb43e10830d346_linkedin.webp" 
                            alt="TikTok" 
                            className={styles.socialIcon}
                        />
                    </a>
                </div>
            </div>
        
        </div>

        {/* Copyright */}
        <div className={styles.copyright}>
          <p>© 2025 Global Academic Foundation, All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}