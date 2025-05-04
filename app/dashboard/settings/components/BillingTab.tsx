'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CreditCard, CheckCircle, Package, ChevronRight, CreditCardIcon, AlertCircle, Zap, Calendar } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { checkUsageLimits } from '@/lib/usage/tracker'

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
  plan_interval?: string;
  payment_method?: {
    type: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
  };
  price_id?: string;
}

interface PlanDetails {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  savingsAmount: number | null;
  features: string[];
  highlight?: boolean;
}

export function BillingTab() {
  const [supabase] = useState(() => createClientSupabaseClient())
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<any>(null)
  const [billingPeriod, setBillingPeriod] = useState('monthly')

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get subscription data
        const { data: subData, error: subError } = await supabase
          .from('profiles')
          .select('current_plan, stripe_subscription_id, plan_interval')
          .eq('id', user.id)
          .single()

        if (subError) {
          console.error('Error fetching subscription:', subError)
          // Still continue to show usage even if subscription fetch fails
        }

        // Set subscription data and initial billing period from user settings
        const plan = subData?.current_plan || 'unknown'
        const planInterval = subData?.plan_interval || 'monthly'
        setBillingPeriod(planInterval)
        
        setSubscription({ 
          plan, 
          status: 'active',
          current_period_end: '', 
          plan_interval: planInterval
        })

        // Always load usage data
        const usageData = await checkUsageLimits(
          supabase,
          user.id,
          'tickets_analyzed',
          getPlanTicketLimit(plan)
        )
        console.log('Usage data:', usageData) // Debug log
        setUsage(usageData)

        // Get additional subscription details if available
        if (subData?.stripe_subscription_id) {
          const { data: stripeData } = await supabase
            .from('stripe_subscriptions')
            .select('*')
            .eq('subscription_id', subData.stripe_subscription_id)
            .single()
          
          if (stripeData) {
            setSubscription(prev => ({
              ...stripeData,
              plan: prev?.plan || 'unknown',
              plan_interval: planInterval
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [supabase])

  const handleManageSubscription = async () => {
    try {
      setLoading(true)
      console.log('Starting manage subscription process...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      console.log('User authenticated:', user.id)

      // Get the session token
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionToken = sessionData.session?.access_token
      
      if (!sessionToken) {
        throw new Error('No session token available')
      }

      // Call our API endpoint instead of Supabase function
      console.log('Calling portal session API...')
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ returnUrl: window.location.href })
      })

      console.log('API response status:', response.status)
      
      const responseText = await response.text()
      console.log('API response text:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse response as JSON:', e)
        throw new Error('Invalid response format')
      }
      
      if (!response.ok) {
        console.error('Error response from API:', data)
        throw new Error(data.error || 'Failed to create portal session')
      }
      
      console.log('Portal session data:', data)
      
      // Redirect to Stripe portal
      if (data?.url) {
        console.log('Redirecting to Stripe portal:', data.url)
        window.location.href = data.url
      } else {
        console.error('No portal URL in response')
        throw new Error('No portal URL returned')
      }
    } catch (error) {
      console.error('Error managing subscription:', error)
      alert('Failed to open subscription management. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscriptionAction = async () => {
    try {
      // First, try the regular portal session
      await handleManageSubscription();
    } catch (error: any) {
      // If the error is about stripe portal configuration
      if (error.message && error.message.includes('No configuration provided')) {
        // Use direct interaction with checkout based on current plan
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, current_plan, plan_interval')
          .eq('id', user.id)
          .single();
          
        if (!profile) throw new Error('Profile not found');
        
        // Get the price ID for the current plan and interval
        const currentPlanId = profile.current_plan?.toLowerCase() || 'starter';
        const interval = profile.plan_interval || billingPeriod;
        
        // Get price ID from environment variables
        const priceIdKey = `NEXT_PUBLIC_STRIPE_PRICE_${currentPlanId.toUpperCase()}_${interval.toUpperCase()}`;
        const priceId = process.env[priceIdKey];
        
        if (!priceId) {
          // Fallback to direct plans page
          window.location.href = '/billing/plans';
          return;
        }
        
        // Create a checkout session for the current plan
        const response = await fetch('/api/billing/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            email: profile.email,
            successUrl: window.location.href,
            cancelUrl: window.location.href,
          }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.sessionId) {
          window.location.href = `/billing/checkout?session_id=${data.sessionId}`;
        }
      } else {
        // For other errors, just re-throw
        throw error;
      }
    }
  };

  const getPlanTicketLimit = (plan: string): number => {
    const limits: Record<string, number> = {
      'starter': 500,
      'growth': 2000,
      'pro': 10000,
      'professional': 10000, // Alias for 'pro'
      'enterprise': Infinity,
      'unknown': 100, // Add default limit for unknown plans
      'free': 100 // Add default limit for free plans
    }
    return limits[plan?.toLowerCase()] || 100 // Return 100 as default limit
  }

  // All plan details consistent with pricing page
  const plans: PlanDetails[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'For small teams getting started with ticket analytics',
      monthlyPrice: 49,
      yearlyPrice: 42,
      savingsAmount: 84,
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
      yearlyPrice: 127,
      savingsAmount: 264,
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
      yearlyPrice: 254,
      savingsAmount: 540,
      features: [
        '10,000 tickets per month',
        'Enterprise-grade analytics',
        'Custom reports & dashboards',
        'API access',
        'Dedicated support & onboarding'
      ]
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Subscription Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!subscription || subscription.plan === 'free' ? (
            <div className="rounded-md border p-4">
              <div className="flex items-center">
                <div>
                  <h3 className="text-lg font-medium">Free Plan</h3>
                  <p className="text-sm text-muted-foreground">You are currently on the free plan</p>
                </div>
                <Button className="ml-auto" size="sm" onClick={() => window.location.href = '/billing/plans'}>
                  Upgrade
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{subscription.plan ? `${subscription.plan.charAt(0).toUpperCase()}${subscription.plan.slice(1)} Plan` : 'Unknown Plan'}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {subscription.status || 'active'} 
                    {subscription.current_period_end && 
                      ` · Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    }
                    {subscription.plan_interval && 
                      ` · Billed ${subscription.plan_interval}`
                    }
                  </p>
                </div>
                <div className="flex items-center text-green-500 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Active
                </div>
              </div>
              
              {/* Usage Bar */}
              {usage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tickets Used This Month</span>
                    <span>{usage.current} / {usage.limit === Infinity ? 'Unlimited' : usage.limit}</span>
                  </div>
                  <Progress value={usage.percentage} className="h-2" />
                  {usage.exceeded && (
                    <p className="text-sm text-orange-500 mt-1">
                      You've reached your plan's limit. Need more tickets? Purchase an extra tickets pack (100 tickets for $15).
                    </p>
                  )}
                  {!usage.exceeded && usage.percentage >= 80 && (
                    <p className="text-sm text-orange-500 mt-1">
                      You're approaching your plan's limit. Consider purchasing extra tickets packs in advance.
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-1 mt-2">
                <p className="text-sm font-medium">Plan features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {getPlanFeatures(subscription.plan || 'unknown').map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {subscription?.payment_method && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Payment method</h3>
              <div className="flex items-center p-3 border rounded-md">
                <CreditCardIcon className="h-4 w-4 mr-2" />
                <div>
                  <p className="text-sm capitalize">{subscription.payment_method.type}</p>
                  {subscription.payment_method.last4 && (
                    <p className="text-xs text-muted-foreground">
                      •••• {subscription.payment_method.last4}
                      {subscription.payment_method.exp_month && subscription.payment_method.exp_year && (
                        <span> · Expires {subscription.payment_method.exp_month}/{subscription.payment_method.exp_year}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleSubscriptionAction}
              disabled={loading}
            >
              Manage Subscription
            </Button>
            <p className="text-xs text-center mt-2 text-muted-foreground">
              You can manage your subscription, payment methods, and billing information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get features for a plan
function getPlanFeatures(plan: string): string[] {
  const featureMap: Record<string, string[]> = {
    'starter': [
      '500 tickets per month',
      'Basic AI analytics',
      'Auto-tagging & AI summarization',
      'Zendesk & Freshdesk integration',
      'Email support'
    ],
    'growth': [
      '2,000 tickets per month',
      'Advanced analytics',
      'AI insights & recommendations',
      'All integrations',
      'Priority support'
    ],
    'pro': [
      '10,000 tickets per month',
      'Enterprise-grade analytics',
      'Custom reports & dashboards',
      'API access',
      'Dedicated support & onboarding'
    ],
    'professional': [ // Alias for 'pro'
      '10,000 tickets per month',
      'Enterprise-grade analytics',
      'Custom reports & dashboards',
      'API access',
      'Dedicated support & onboarding'
    ],
    'enterprise': [
      'Unlimited tickets',
      'Custom AI models',
      'SSO & advanced security',
      'Custom integrations',
      'Dedicated CSM',
      'SLA'
    ],
    'unknown': [
      'Limited to 100 tickets/month',
      'Basic features'
    ],
    'free': [
      'Limited to 100 tickets/month',
      'Basic features'
    ]
  }
  
  return featureMap[plan.toLowerCase()] || featureMap['unknown']
} 