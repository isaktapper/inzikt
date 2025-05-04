import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Get user from session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Error fetching profile', details: profileError.message },
        { status: 500 }
      )
    }
    
    // Mask sensitive data
    const safeProfile = { ...profile }
    if (safeProfile.stripe_customer_id) {
      safeProfile.stripe_customer_id = `${safeProfile.stripe_customer_id.substring(0, 4)}...${safeProfile.stripe_customer_id.substring(safeProfile.stripe_customer_id.length - 4)}`
    }
    
    return NextResponse.json({ 
      profile: safeProfile,
      has_customer_id: !!profile.stripe_customer_id
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
} 