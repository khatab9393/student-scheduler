import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "./i18n/LanguageContext"
import Header from "./components/Header"

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen flex flex-col overflow-x-hidden`}
      >
        <LanguageProvider>
          {/* Header (scrolls with the page, not pinned) */}
          <Header />

          {/* Main content area fills all remaining vertical space, full width */}
          <main className="flex-grow w-full px-4 py-8 sm:py-12">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}
