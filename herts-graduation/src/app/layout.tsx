import type { Metadata } from 'next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import '@/app/css/globals.css'
import Providers from '../../components/Providers'

export const metadata: Metadata = {
  title: 'University of Hertfordshire - Graduation Registration',
  description: 'Register your guests for the graduation ceremony',
  icons: {
    icon: '/images/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}