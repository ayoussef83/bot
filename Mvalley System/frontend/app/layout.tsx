import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MV-OS - MindValley Operating System',
  description: 'Education & Operations Management System',
  icons: {
    icon: [{ url: '/mv-favicon.svg?v=20260101', type: 'image/svg+xml' }],
    apple: [{ url: '/mindvalley-logo.png?v=20260101', type: 'image/png' }],
    shortcut: '/mv-favicon.svg?v=20260101',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

