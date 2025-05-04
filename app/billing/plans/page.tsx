'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PlanGetStartedButton from '@/components/PlanGetStartedButton'

export default function BillingPlansPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [supabase] = useState(() => createClientSupabaseClient())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    // Check authentication and fetch profile
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
            console.log('User has active plan, redirecting to dashboard')
            router.push('/dashboard/tags')
            return
          }
          
          // Check for recently completed checkout from URL parameters
          const params = new URLSearchParams(window.location.search)
          const checkoutComplete = params.get('checkout_complete')
          
          if (checkoutComplete === 'true') {
            console.log('Checkout recently completed, checking subscription status...')
            
            // Perform one more check to the database to get the latest subscription status
            const { data: refreshedProfile, error: refreshError } = await supabase
              .from('profiles')
              .select('plan_active')
              .eq('id', user.id)
              .single()
              
            if (!refreshError && refreshedProfile && refreshedProfile.plan_active) {
              console.log('Confirmed active subscription, redirecting to dashboard')
              router.push('/dashboard/tags')
              return
            }
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

  const handleSelectPlan = async (planId: string) => {
    // Create Stripe checkout session for the selected plan
    try {
      setLoading(true)

      // Determine the price ID based on plan and billing period
      let priceId
      switch (planId) {
        case 'starter':
          priceId = billingPeriod === 'monthly' 
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY 
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY
          break
        case 'growth':
          priceId = billingPeriod === 'monthly' 
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_MONTHLY 
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_YEARLY
          break
        case 'pro':
          priceId = billingPeriod === 'monthly' 
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY 
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
          break
        default:
          if (planId === 'enterprise') {
            // For enterprise, redirect to contact form
            router.push('/contact?plan=enterprise')
            return
          }
          throw new Error('Invalid plan selected')
      }

      // Redirect to checkout page with selected plan
      router.push(`/billing/checkout?plan=${planId}&period=${billingPeriod}`)
    } catch (error) {
      console.error('Error selecting plan:', error)
      setError('Failed to select plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'For small teams getting started with ticket analytics',
      monthlyPrice: 49,
      yearlyPrice: 42, // ~15% discount
      savingsAmount: 84, // $7 x 12 = $84 saved per year
      features: [
        '500 tickets per month',
        'Basic AI analytics',
        'Auto-tagging & AI summarization',
        'Zendesk & Freshdesk integration',
        'Email support'
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      description: 'For growing teams with moderate support volume',
      monthlyPrice: 149,
      yearlyPrice: 127, // ~15% discount
      savingsAmount: 264, // $22 x 12 = $264 saved per year
      features: [
        '2,000 tickets per month',
        'Advanced analytics',
        'AI insights & recommendations',
        'All integrations',
        'Priority support'
      ],
      highlight: true
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For larger teams with high support volume',
      monthlyPrice: 299,
      yearlyPrice: 254, // ~15% discount
      savingsAmount: 540, // $45 x 12 = $540 saved per year
      features: [
        '10,000 tickets per month',
        'Enterprise-grade analytics',
        'Custom reports & dashboards',
        'API access',
        'Dedicated support & onboarding'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations with custom needs',
      monthlyPrice: null, // Custom pricing
      yearlyPrice: null,
      savingsAmount: null,
      features: [
        'Unlimited tickets',
        'Custom AI models',
        'SSO & advanced security',
        'Custom integrations',
        'Dedicated CSM',
        'SLA'
      ]
    }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-10 mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Choose your plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the plan that best fits your needs.
        </p>

        {error && (
          <Alert variant="destructive" className="mt-6 max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Billing Period Toggle */}
        <div className="mt-8 inline-flex items-center p-1 bg-gray-100 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md transition-all ${
              billingPeriod === 'monthly' 
                ? 'bg-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setBillingPeriod('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-all ${
              billingPeriod === 'yearly' 
                ? 'bg-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setBillingPeriod('yearly')}
          >
            Yearly <span className="text-xs text-green-600 font-semibold">Save 15%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${
              plan.highlight 
                ? 'border-orange-400 ring-1 ring-orange-400' 
                : ''
            }`}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {plan.monthlyPrice ? (
                <div className="mb-6">
                  <p className="text-3xl font-bold">
                    ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    <span className="text-sm font-normal text-gray-500">
                      /{billingPeriod === 'monthly' ? 'mo' : 'mo, billed annually'}
                    </span>
                  </p>
                  {billingPeriod === 'yearly' && plan.savingsAmount && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${plan.savingsAmount} per year
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-2xl font-bold">Custom pricing</p>
                  <p className="text-sm text-gray-500">Contact us for details</p>
                </div>
              )}

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.id === 'enterprise' ? (
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                >
                  Contact Sales
                </Button>
              ) : (
                <PlanGetStartedButton
                  planId={plan.id}
                  planName={plan.name}
                  period={billingPeriod}
                  className={`w-full ${
                    plan.highlight 
                      ? 'bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600' 
                      : ''
                  }`}
                >
                  {`Select ${plan.name}`}
                </PlanGetStartedButton>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 