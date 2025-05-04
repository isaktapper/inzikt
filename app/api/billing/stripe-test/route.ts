import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  try {
    // Show environment details but mask sensitive data
    const stripeKeyPrefix = process.env.STRIPE_SECRET_KEY 
      ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...'
      : 'not set'

    // Check for required environment variables
    const envCheck = {
      STRIPE_SECRET_KEY: stripeKeyPrefix,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 7) + '...'
        : 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }

    // Try to initialize Stripe
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-03-31.basil',
      })
      
      // Try to call a simple Stripe API
      const balance = await stripe.balance.retrieve()
      
      return NextResponse.json({
        success: true,
        message: 'Stripe connection successful',
        environment: envCheck,
        balanceAvailable: !!balance
      })
    } catch (stripeError: any) {
      return NextResponse.json({
        success: false,
        message: 'Stripe connection failed',
        error: stripeError.message,
        environment: envCheck
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error.message
    }, { status: 500 })
  }
} 