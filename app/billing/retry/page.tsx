'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, CreditCard } from 'lucide-react'

export default function RetryPaymentPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClientSupabaseClient())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Get profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setError('Failed to load your profile information')
        } else {
          setProfile(data)
          
          // If user already has an active plan, redirect to dashboard
          if (data.plan_active) {
            router.push('/dashboard/tags')
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setError('Authentication error')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleRetryPayment = () => {
    router.push('/billing/plans')
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50/30 p-4">
      <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 max-w-lg w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center">Complete Your Payment</h1>
          <p className="text-gray-600 text-center">
            It looks like you didn't complete your payment process. Your plan selection is still waiting.
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <Button 
            onClick={handleRetryPayment}
            className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600"
          >
            Complete Payment
          </Button>
          
          <Button 
            onClick={handleBackToHome}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
} 