import '@/app/globals.css'
import '@/lib/optimizely/init'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
