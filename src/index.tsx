import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zarrita Viewer',
  description: 'Web viewer for Zarr files using zarrita.js and vizarr',
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