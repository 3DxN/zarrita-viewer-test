export const metadata = {
  title: 'AIDA Viewer Test',
  description: 'Test application for AIDA Viewer',
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
