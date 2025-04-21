import { ZendeskService } from './service'

// Define the ZendeskConnection interface locally matching the one in service.ts
interface ZendeskConnection {
  subdomain: string;
  email: string;
  api_token: string;
  selected_groups: string[];
  selected_statuses: string[];
  max_tickets?: number;
}

/**
 * Fetches groups from Zendesk using the user's connection details
 */
export async function fetchZendeskGroups(connectionDetails: ZendeskConnection) {
  try {
    const { subdomain, email, api_token } = connectionDetails

    const response = await fetch('/api/zendesk/get-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subdomain, email, api_token }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch Zendesk groups')
    }

    const data = await response.json()
    return data.groups
  } catch (error: any) {
    console.error('Error fetching Zendesk groups:', error)
    throw error
  }
} 