"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get("message") || "Something went wrong"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-[#d8f950] p-1">
              <span className="font-bold text-black">K</span>
            </div>
            <span className="font-bold text-xl">Inzikt</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl border shadow-sm p-8">
            <div className="mx-auto w-12 h-12 mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <Button asChild className="bg-[#d8f950] text-black hover:bg-[#c2e340]">
                <Link href="/login">Return to Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 