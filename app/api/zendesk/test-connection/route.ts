import { NextResponse } from 'next/server'
import { ZendeskService } from '@/lib/zendesk/service'

export async function POST(req: Request) {
  try {
    const { subdomain, email, api_token } = await req.json()

    if (!subdomain || !email || !api_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create a temporary Zendesk service to test connection
    const zendeskService = new ZendeskService({
      subdomain,
      email,
      api_token,
      selected_groups: [],
      selected_statuses: []
    })

    // Test the connection
    const isConnected = await zendeskService.testConnection()

    if (!isConnected) {
      return NextResponse.json({ error: 'Could not connect to Zendesk. Please check your credentials.' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error testing Zendesk connection:', error)
    return NextResponse.json({ error: error.message || 'Failed to test connection' }, { status: 500 })
  }
} 