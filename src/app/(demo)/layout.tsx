import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

/**
 * Own root layout for the stage page: no Payload, no header/footer, no database.
 * (frontend) and (payload) keep their own root layouts.
 */
export const metadata: Metadata = {
  title: 'Một ngày của Trạm Z · Chợ Z',
  description: 'Phát lại 30 giây một ngày mô phỏng của Trạm Z do agent vận hành.',
  robots: { index: false, follow: false },
  icons: [
    { rel: 'icon', url: '/favicon.ico', sizes: '32x32' },
    { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
  ],
}

export const viewport: Viewport = {
  themeColor: '#7f1d1d',
}

export default function DemoRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body style={{ margin: 0, background: '#12070a' }}>{children}</body>
    </html>
  )
}
