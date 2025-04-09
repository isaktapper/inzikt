import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kisa - AI-Powered Support Ticket Analysis",
  description: "Turn support tickets into product insights with AI",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ThemeProvider>
  )
}


import './globals.css'