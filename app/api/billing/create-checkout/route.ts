import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { priceId, email, successUrl, cancelUrl } = await req.json()

    // Validation
    if (!priceId || !email || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get user from Supabase
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    if (userData.plan_active) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Check if user already has a Stripe customer ID
    let customerId = userData.stripe_customer_id

    // If not, create a new customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: userData.id
        }
      })
      customerId = customer.id

      // Update the user record with the customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.id)
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?checkout_complete=true`,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId: userData.id
        }
      },
      allow_promotion_codes: true,
      client_reference_id: userData.id,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 