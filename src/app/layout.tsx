import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Weekly Schedule App",
  description: "Manage your weekly schedule easily",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen flex flex-col`}
      >
        {/* Sticky Header */}
        <header className="bg-red-950 text-white py-6 sticky top-0 z-[1100] shadow-md">
          <div className="flex flex-col items-center px-4">
            {/* Logo Row */}
            <div className="flex flex-row items-center gap-3 sm:gap-6 mb-3 sm:mb-4">
              <img
                src="/reserch center.png"
                alt="Logo"
                className="h-10 sm:h-16 w-auto"
                loading="lazy"
                decoding="async"
              />
              <img 
                src="/Ai and informatics.png" 
                alt="Logo 2"
                className="h-10 sm:h-16 w-auto"
                loading="lazy"
                decoding="async"
              />
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-center tracking-tight">
              Weekly Schedule
            </h1>
          </div>
        </header>

        {/* Main content area fills all remaining vertical space, full width */}
        <main className="flex-grow w-full px-4 py-8 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  )
}
