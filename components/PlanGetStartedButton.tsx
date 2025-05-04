'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

interface PlanGetStartedButtonProps {
  planId: string
  planName: string
  className?: string
  children?: React.ReactNode
  period?: string
}

export default function PlanGetStartedButton({
  planId,
  planName,
  className = '',
  children,
  period = 'monthly'
}: PlanGetStartedButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [supabase] = useState(() => createClientSupabaseClient())

  const handleClick = async () => {
    setLoading(true)
    try {
      // Store the selected plan in both sessionStorage and localStorage for reliability
      try {
        console.log('Storing selected plan:', planId, 'with period:', period)
        sessionStorage.setItem('selectedPlan', planId)
        sessionStorage.setItem('selectedPeriod', period)
        localStorage.setItem('selectedPlan', planId)
        localStorage.setItem('selectedPeriod', period)
        
        // Also store as a cookie for extra reliability
        document.cookie = `selectedPlan=${planId};path=/;max-age=3600`;
        document.cookie = `selectedPeriod=${period};path=/;max-age=3600`;
      } catch (e) {
        console.error('Error storing plan and period:', e)
      }
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is logged in - go directly to checkout
        console.log('User is logged in, redirecting to checkout with plan:', planId, 'and period:', period)
        router.push(`/billing/checkout?plan=${planId}&period=${period}`)
      } else {
        // User is not logged in - go to register with plan parameter
        console.log('User is not logged in, redirecting to register with plan:', planId, 'and period:', period)
        router.push(`/register?plan=${planId}&period=${period}`)
      }
    } catch (error) {
      console.error('Error in PlanGetStartedButton:', error)
      // On error, fallback to registration with plan parameter
      router.push(`/register?plan=${planId}&period=${period}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      className={className}
      disabled={loading}
    >
      {loading ? 'Loading...' : children || `Select ${planName}`}
    </Button>
  )
} 