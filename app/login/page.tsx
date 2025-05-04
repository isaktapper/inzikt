"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientSupabaseClient } from "@/utils/supabase/client"

function LoginLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectedFrom') || '/dashboard'
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [supabase] = useState(() => createClientSupabaseClient())

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'auth_callback_error') {
      setError("Authentication failed. Please try signing in again.")
    }

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push(redirectTo)
      }
    }

    checkSession()
  }, [router, searchParams, supabase, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      // Always use direct window navigation after auth - the most reliable approach
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      })
      
      if (error) {
        throw error
      }

      if (!data || !data.user) {
        throw new Error("Authentication failed")
      }
      
      // Store successful login in localStorage as fallback
      try {
        localStorage.setItem('auth_success', 'true')
      } catch (e) {
        // Ignore storage errors
      }
      
      // MOST RELIABLE: Using direct window navigation instead of router
      // This ensures proper authentication propagation and avoids router issues
      console.log("Login successful, redirecting to:", redirectTo)
      window.location.href = redirectTo
      
    } catch (error: any) {
      if (error.message && error.message.includes("Invalid login")) {
        setError("Invalid email or password")
      } else {
        setError(error.message || "Failed to sign in")
      }
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm text-orange-500 hover:text-pink-500 transition-colors duration-200">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-gray-300 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="remember" />
        <label
          htmlFor="remember"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#0E0E10]"
        >
          Remember me
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-md hover:scale-105 transition-all duration-200"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-orange-50/30 flex flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/inzikt_logo.svg" alt="Inzikt Logo" className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 hover:shadow-md transition-all duration-300">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">Welcome back</h1>
              <p className="text-gray-600">Sign in to your Inzikt account</p>
            </div>

            <Suspense fallback={<p>Loading login form...</p>}>
              <LoginLogic />
            </Suspense>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-orange-500 font-medium hover:text-pink-500 transition-colors duration-200 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
