import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MV-OS - MindValley Operating System',
  description: 'Education & Operations Management System',
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

