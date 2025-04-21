import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get Zendesk connection
    const { data: connection, error: connError } = await supabase
      .from('zendesk_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connError) {
      console.error("Error fetching Zendesk connection:", connError)
      return NextResponse.json({ connection: null })
    }

    return NextResponse.json({ connection })
  } catch (error: any) {
    console.error('Error in connection API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Delete Zendesk connection
    const { error: deleteError } = await supabase
      .from('zendesk_connections')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error("Error deleting Zendesk connection:", deleteError)
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    // Also remove any Zendesk cookies
    cookieStore.delete('zendesk_token')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE connection API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 