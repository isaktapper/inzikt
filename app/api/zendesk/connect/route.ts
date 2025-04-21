import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { ZendeskService } from '@/lib/zendesk/service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, subdomain, email, apiToken, groups, statuses } = body

  if (!userId || !subdomain || !email || !apiToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1. Spara Zendesk credentials
  const { data, error } = await supabase
    .from('zendesk_connections')
    .upsert([
      {
        user_id: userId,
        subdomain,
        email,
        api_token: apiToken,
        groups,
        statuses,
      },
    ], {
      onConflict: 'user_id',
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Skapa ZendeskService
  const zendeskService = new ZendeskService({
    subdomain,
    email,
    api_token: apiToken,
    selected_groups: groups || [],
    selected_statuses: statuses || [],
  })

  // 3. Hämta agenter
  const agents = await zendeskService.fetchAgents()

  // 4. Spara agenter i Supabase
  for (const agent of agents) {
    await supabase.from('zendesk_agents').upsert({
      user_id: userId,
      agent_id: agent.id,
      name: agent.name,
      email: agent.email,
    }, {
      onConflict: 'user_id,agent_id'
    })
  }

  return NextResponse.json({ success: true, data })
}
