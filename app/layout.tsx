import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AnalysisProgressProvider } from "@/contexts/AnalysisProgressContext"
import { ImportProgressProvider } from "@/contexts/ImportProgressContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Inzikt - AI-Powered Support Ticket Analysis",
  description: "Turn support tickets into product insights with AI",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AnalysisProgressProvider>
            <ImportProgressProvider>
              {children}
              <Toaster />
            </ImportProgressProvider>
          </AnalysisProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}