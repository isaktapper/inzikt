import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Middleware function to check if a user has an active subscription
 * This should be used in API routes to prevent usage by unpaid users
 * 
 * @param req The Next.js request object
 * @returns NextResponse or null if validation passes
 */
export async function checkSubscription(req: NextRequest): Promise<NextResponse | null> {
  try {
    // Create a cookie-based client to access the user's session
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    // Get the user's profile to check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_active')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Error checking subscription:', profileError)
      return NextResponse.json(
        { error: 'Error checking subscription status' },
        { status: 500 }
      )
    }

    // Check if the user has an active plan
    if (!profile || profile.plan_active !== true) {
      return NextResponse.json(
        { error: 'Payment required: Please subscribe to access this feature' },
        { status: 402 } // 402 Payment Required
      )
    }

    // If validation passes, return null to continue processing the request
    return null
  } catch (error) {
    console.error('Error in checkSubscription:', error)
    return NextResponse.json(
      { error: 'Server error checking subscription' },
      { status: 500 }
    )
  }
} 