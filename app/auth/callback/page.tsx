'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/utils/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClientSupabaseClient())

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback page loaded, handling authentication...')
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('User is authenticated, checking for selected plan...')
          
          // Check if a plan was preselected during signup
          let selectedPlan: string | null = null
          
          // First try to get from sessionStorage
          try {
            selectedPlan = sessionStorage.getItem('selectedPlan')
            console.log('Plan from sessionStorage:', selectedPlan)
          } catch (e) {
            console.error('Error accessing sessionStorage:', e)
          }
          
          // Get the billing period
          let selectedPeriod: string | null = null
          try {
            selectedPeriod = sessionStorage.getItem('selectedPeriod') || 'monthly'
            console.log('Period from sessionStorage:', selectedPeriod)
          } catch (e) {
            console.error('Error accessing sessionStorage for period:', e)
          }
          
          // Try localStorage as fallback
          if (!selectedPlan) {
            try {
              selectedPlan = localStorage.getItem('selectedPlan')
              console.log('Plan from localStorage:', selectedPlan)
            } catch (e) {
              console.error('Error accessing localStorage:', e)
            }
          }
          
          // Try to get from cookies as well for plan
          if (!selectedPlan) {
            try {
              const cookies = document.cookie.split(';')
              const planCookie = cookies.find(cookie => cookie.trim().startsWith('selectedPlan='))
              if (planCookie) {
                selectedPlan = planCookie.split('=')[1]
                console.log('Plan from cookies:', selectedPlan)
              }
            } catch (e) {
              console.error('Error accessing cookies for plan:', e)
            }
          }
          
          // Try to get period from cookies as well
          if (!selectedPeriod) {
            try {
              const cookies = document.cookie.split(';')
              const periodCookie = cookies.find(cookie => cookie.trim().startsWith('selectedPeriod='))
              if (periodCookie) {
                selectedPeriod = periodCookie.split('=')[1]
                console.log('Period from cookies:', selectedPeriod)
              }
            } catch (e) {
              console.error('Error accessing cookies for period:', e)
            }
          }
          
          // Also check URL parameters as a fallback for plan
          if (!selectedPlan) {
            const params = new URLSearchParams(window.location.search)
            selectedPlan = params.get('plan')
            console.log('Plan from URL params:', selectedPlan)
          }
          
          // Check URL parameters for period as a fallback
          if (!selectedPeriod) {
            const params = new URLSearchParams(window.location.search)
            selectedPeriod = params.get('period')
            console.log('Period from URL params:', selectedPeriod)
          }
          
          // Default to monthly if no period found
          if (!selectedPeriod) {
            selectedPeriod = 'monthly'
          }
          
          // If still no plan, check if it was stored in the user's profile
          if (!selectedPlan) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('selected_plan')
                .eq('id', session.user.id)
                .single()
                
              if (profile && profile.selected_plan) {
                selectedPlan = profile.selected_plan
                console.log('Plan from user profile:', selectedPlan)
              }
            } catch (e) {
              console.error('Error getting plan from profile:', e)
            }
          }
          
          if (selectedPlan) {
            // User selected a specific plan - redirect directly to checkout
            console.log('Selected plan found, redirecting to checkout:', selectedPlan, 'with period:', selectedPeriod)
            
            // Clear from all storage locations
            try {
              sessionStorage.removeItem('selectedPlan')
              sessionStorage.removeItem('selectedPeriod')
              localStorage.removeItem('selectedPlan')
              localStorage.removeItem('selectedPeriod')
              document.cookie = 'selectedPlan=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
              document.cookie = 'selectedPeriod=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
            } catch (e) {
              console.error('Error clearing storage:', e)
            }
            
            router.push(`/billing/checkout?plan=${selectedPlan}&period=${selectedPeriod}`)
          } else {
            // General signup flow - go to plan selection
            console.log('No selected plan, redirecting to plan selection')
            router.push('/billing/plans')
          }
        } else {
          console.log('No session found, trying to exchange code for session')
          
          // Get the auth code from the URL
          const url = new URL(window.location.href)
          const code = url.searchParams.get('code')
          
          if (code) {
            // Exchange the code for a session
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError)
              setError('Authentication failed. Please try again.')
              return
            }
            
            // Check if authentication succeeded
            const { data: { session: newSession } } = await supabase.auth.getSession()
            
            if (newSession) {
              console.log('Authentication successful, checking for selected plan...')
              
              // Check for selected plan again
              let selectedPlan: string | null = null
              let selectedPeriod: string | null = 'monthly'
              
              try {
                selectedPlan = sessionStorage.getItem('selectedPlan')
                selectedPeriod = sessionStorage.getItem('selectedPeriod') || 'monthly'
              } catch (e) {
                console.error('Error accessing sessionStorage:', e)
              }
              
              if (selectedPlan) {
                // User selected a specific plan - redirect directly to checkout
                console.log('Selected plan found, redirecting to checkout:', selectedPlan, 'with period:', selectedPeriod)
                
                try {
                  sessionStorage.removeItem('selectedPlan')
                  sessionStorage.removeItem('selectedPeriod')
                } catch (e) {
                  console.error('Error clearing sessionStorage:', e)
                }
                
                router.push(`/billing/checkout?plan=${selectedPlan}&period=${selectedPeriod}`)
              } else {
                // General signup flow - go to plan selection
                console.log('No selected plan, redirecting to plan selection')
                router.push('/billing/plans')
              }
            } else {
              setError('Failed to authenticate user. Please try again.')
            }
          } else {
            setError('No authentication code found in the URL.')
          }
        }
      } catch (error) {
        console.error('Error during authentication callback:', error)
        setError('Authentication failed. Please try again.')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50/30">
      <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">Verifying your account</h1>
          <p className="text-gray-600">Please wait while we verify your account...</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-6">
            <p>{error}</p>
            <button 
              onClick={() => router.push('/register')}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Sign Up
            </button>
          </div>
        )}
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      </div>
    </div>
  )
} 