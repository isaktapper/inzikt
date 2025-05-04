'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>('Payment successful! Updating your account...')
  
  // Get plan and period from URL params
  const plan = searchParams.get('plan') || 'starter'
  const period = searchParams.get('period') || 'monthly'

  useEffect(() => {
    const updateSubscription = async () => {
      try {
        // Store checkout completion status
        try {
          localStorage.setItem('checkout_completed', 'true')
        } catch (e) {
          console.error('Failed to store checkout status:', e)
        }

        const supabase = createClientSupabaseClient()
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        // LOCAL DEVELOPMENT WORKAROUND: 
        // Update the user profile directly since webhooks may not be configured
        const planMapping: Record<string, { name: string, interval: string, limit: number }> = {
          'starter': { name: 'starter', interval: period, limit: 500 },
          'growth': { name: 'growth', interval: period, limit: 2000 },
          'pro': { name: 'professional', interval: period, limit: 10000 },
        }
        
        const selectedPlan = planMapping[plan] || 
          { name: 'unknown', interval: period, limit: 100 }
          
        // Update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            current_plan: selectedPlan.name,
            plan_interval: selectedPlan.interval,
            plan_seats_limit: selectedPlan.limit,
            plan_active: true
          })
          .eq('id', user.id)
          
        if (updateError) {
          console.error('Error updating profile after checkout:', updateError)
          setError('Failed to update your subscription status. Please contact support.')
          setLoading(false)
          return
        }
        
        // Redirect to dashboard
        console.log('Profile updated, redirecting to dashboard...')
        setSuccess('Account updated successfully! Redirecting to dashboard...')
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/tags'
        }, 2000)
        
      } catch (error: any) {
        console.error('Error processing successful checkout:', error)
        setError('There was an issue updating your subscription. Please contact support.')
        setLoading(false)
      }
    }
    
    updateSubscription()
  }, [router, plan, period])

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50/30 p-4">
      <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">Payment Successful!</h1>
          <p className="text-gray-600">
            {loading ? 'Processing your payment...' : success}
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && !error && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    </div>
  )
} 