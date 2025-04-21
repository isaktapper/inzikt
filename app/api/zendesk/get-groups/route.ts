import { NextResponse } from 'next/server'
import { ZendeskService } from '@/lib/zendesk/service'

export async function POST(req: Request) {
  try {
    const { subdomain, email, api_token } = await req.json()

    if (!subdomain || !email || !api_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create a temporary Zendesk service to fetch groups
    const zendeskService = new ZendeskService({
      subdomain,
      email,
      api_token,
      selected_groups: [],
      selected_statuses: []
    })

    // Test the connection first
    const isConnected = await zendeskService.testConnection()

    if (!isConnected) {
      return NextResponse.json({ error: 'Could not connect to Zendesk. Please check your credentials.' }, { status: 401 })
    }

    // Fetch the groups using the internal fetchGroups method
    const groupsRecord = await (zendeskService as any).fetchGroups()
    
    // Convert the record to an array of group objects
    const groups = Object.values(groupsRecord).map((group: any) => ({
      id: group.id,
      name: group.name
    }))

    return NextResponse.json({ groups })
  } catch (error: any) {
    console.error('Error fetching Zendesk groups:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch groups' }, { status: 500 })
  }
} 