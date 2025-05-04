import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: Request) {
  console.log('Portal session API called')
  
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    console.log('Authorization token received')
    
    // Initialize Stripe
    console.log('Initializing Stripe...')
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing Stripe secret key')
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      )
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    })
    console.log('Stripe initialized')

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
    
    // Get user from token
    console.log('Getting user from token...')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User error:', userError)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }
    
    console.log('User authenticated from token:', user.id)

    // Get user profile to find their Stripe customer ID
    console.log('Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: 'Error fetching profile' },
        { status: 500 }
      )
    }
    
    console.log('Profile data:', profile)

    if (!profile?.stripe_customer_id) {
      console.error('No Stripe customer ID found')
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    console.log('Found Stripe customer ID:', profile.stripe_customer_id)

    // Parse request body for return URL
    console.log('Parsing request body...')
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const returnUrl = body.returnUrl || process.env.NEXT_PUBLIC_URL + '/dashboard/settings?tab=billing'
    console.log('Return URL:', returnUrl)

    // Create portal session
    console.log('Creating Stripe portal session...')
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: returnUrl,
      })
      
      console.log('Portal session created:', portalSession.url)
      return NextResponse.json({ url: portalSession.url })
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json(
        { error: `Stripe error: ${stripeError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
} 