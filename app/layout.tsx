import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Fitness Tracker',
  description: 'Track your fitness journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-900 text-white min-h-screen">
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
