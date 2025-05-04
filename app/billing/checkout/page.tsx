'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createClientSupabaseClient())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  // Get plan and period from URL params with definite values to avoid type errors
  const planParam = searchParams.get('plan')
  const periodParam = searchParams.get('period')
  const plan = planParam !== null ? planParam : 'starter'
  const period = periodParam !== null ? periodParam : 'monthly'
  
  // Properly check for checkout completion
  // We need to check the full URL in case there are malformed parameters
  const [isCheckoutComplete, setIsCheckoutComplete] = useState(false)
  
  // Use the raw URL to check for checkout completion since searchParams can be unreliable
  // with malformed URLs (when Stripe adds its own params incorrectly)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href
      const hasCheckoutComplete = url.includes('checkout_complete=true')
      console.log('URL check:', url, 'Checkout complete:', hasCheckoutComplete)
      setIsCheckoutComplete(hasCheckoutComplete)
      
      // Store checkout status in localStorage to prevent redirection loops
      if (hasCheckoutComplete) {
        try {
          localStorage.setItem('checkout_completed', 'true')
        } catch (e) {
          console.error('Failed to store checkout status:', e)
        }
      }
    }
  }, [])

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        setLoading(true)
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        setUser(user)
        
        // Check if a plan was selected
        if (!plan) {
          router.push('/billing/plans')
          return
        }

        // Handle successful checkout first
        // Process this before checking the current status to avoid race conditions
        const checkoutCompleted = isCheckoutComplete || localStorage.getItem('checkout_completed') === 'true'
        
        if (checkoutCompleted) {
          console.log('Checkout complete detected, updating profile')
          setSuccess('Payment successful! Updating your account...')
          
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
          
          // Clear the checkout completed flag
          try {
            localStorage.removeItem('checkout_completed')
          } catch (e) {
            console.error('Failed to clear checkout status:', e)
          }
          
          // Redirect to dashboard
          console.log('Profile updated, redirecting to dashboard...')
          setSuccess('Account updated successfully! Redirecting to dashboard...')
          
          // Use direct location change for reliability
          setTimeout(() => {
            window.location.href = '/dashboard/tags'
          }, 1500)
          return
        }
        
        // Get user profile - only check this AFTER handling checkout_complete
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load your profile information')
          return
        }
        
        // If user already has an active plan, redirect to dashboard
        if (profile.plan_active) {
          console.log('User already has active plan, redirecting to dashboard')
          router.push('/dashboard/tags')
          return
        }
        
        // Determine price ID based on plan and period
        let priceId: string;
        
        switch (plan) {
          case 'starter':
            priceId = period === 'monthly'
              ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY!
              : process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY!
            break
          case 'growth':
            priceId = period === 'monthly'
              ? process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_MONTHLY!
              : process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_YEARLY!
            break
          case 'pro':
            priceId = period === 'monthly'
              ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!
              : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!
            break
          default:
            priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY!
            console.warn('Invalid plan selected, using starter monthly as fallback')
        }
        
        // Create checkout session
        // Make sure we have a valid price ID before proceeding
        if (!priceId) {
          setError('Failed to determine price for the selected plan. Please try again or contact support.')
          setLoading(false)
          return
        }
        
        await createCheckoutSession(user.email, priceId)
        
      } catch (error: any) {
        console.error('Error during checkout:', error)
        setError(error.message || 'Failed to initiate checkout')
      } finally {
        setLoading(false)
      }
    }
    
    initiateCheckout()
  }, [router, supabase, plan, period, isCheckoutComplete])
  
  const createCheckoutSession = async (email: string, priceId: string) => {
    try {
      // Create proper absolute URLs for Stripe
      // Must be absolute HTTPS URLs for production
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const safeUrl = (path: string) => {
        // Ensure we have a valid URL that Stripe will accept
        if (origin.startsWith('http')) {
          return `${origin}${path}`;
        }
        // Fallback for development - Stripe requires https, but will accept http for testing
        return `http://localhost:3000${path}`;
      };
      
      // Use a direct path without query parameters to avoid URL malformation
      // Stripe will append its own parameters to this URL
      const successUrl = safeUrl(`/billing/checkout/success?plan=${plan}&period=${period}`);
      const cancelUrl = safeUrl('/billing/plans');
      
      console.log('Success URL:', successUrl);
      console.log('Cancel URL:', cancelUrl);

      // Create the checkout session on the server
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          email,
          successUrl,
          cancelUrl,
        }),
      })
      
      const { sessionId, error } = await response.json()
      
      if (error) {
        throw new Error(error)
      }
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise
      const { error: stripeError } = await stripe!.redirectToCheckout({ sessionId })
      
      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to redirect to checkout')
      }
      
    } catch (error: any) {
      console.error('Error creating checkout session:', error)
      setError(error.message || 'Failed to create checkout session')
    }
  }
  
  const handleBackToPricing = () => {
    router.push('/billing/plans')
  }
  
  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'starter': return 'Starter'
      case 'growth': return 'Growth'
      case 'pro': return 'Pro'
      default: return 'Unknown'
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50/30 p-4">
      <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-[#0E0E10]">
            {isCheckoutComplete ? 'Payment Successful!' : (plan ? `Checkout - ${getPlanName(plan)} Plan` : 'Checkout')}
          </h1>
          <p className="text-gray-600">
            {loading ? 'Processing your payment...' : 
             success ? success : 
             'Complete your purchase to get started'}
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {error ? (
              <Button 
                onClick={handleBackToPricing}
                className="w-full flex items-center justify-center"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plans
              </Button>
            ) : (
              !success && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
} 