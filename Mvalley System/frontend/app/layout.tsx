import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MV-OS - MindValley Operating System',
  description: 'Education & Operations Management System',
  icons: {
    icon: [{ url: '/mindvalley-logo.png?v=20260101', type: 'image/png' }],
    apple: [{ url: '/mindvalley-logo.png?v=20260101', type: 'image/png' }],
    shortcut: '/mindvalley-logo.png?v=20260101',
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

