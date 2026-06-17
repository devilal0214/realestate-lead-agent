import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'RealEstate AI – AI Chat Widget for Real Estate',
    template: '%s | RealEstate AI',
  },
  description:
    'Convert website visitors into qualified real estate leads with AI-powered chat widgets. Multi-tenant SaaS for real estate agents and agencies.',
  keywords: ['real estate', 'AI chat', 'lead generation', 'chatbot', 'widget'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'RealEstate AI',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
