  import Providers from '@/redux/Providers'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import CookieConsentBanner from '@/components/CookieConsentBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RentAI',
 
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Providers>
      <Suspense>
        {children}
      </Suspense>
      <CookieConsentBanner />
        </Providers>
        </body>
    </html>
  )
}