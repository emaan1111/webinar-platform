export const metadata = {
  title: 'Event Registration',
}

export default function EmbedEventLayout({
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
