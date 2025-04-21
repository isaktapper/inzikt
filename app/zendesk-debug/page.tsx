'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export default function ZendeskDebug() {
  const [query, setQuery] = useState('type:ticket')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<any[]>([])

  // Test connection
  const testConnection = async () => {
    try {
      const response = await fetch('/api/zendesk/connection')
      if (response.ok) {
        const data = await response.json()
        console.log('Connection test:', data)
        return !!data.connection
      }
      return false
    } catch (err) {
      console.error('Error testing connection:', err)
      return false
    }
  }

  // Run a test query
  const runQuery = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/zendesk/test?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run query')
      }
      
      setResults(data)
      
      // Update groups if available
      if (data.available_groups) {
        setGroups(data.available_groups)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      console.error('Error running query:', err)
    } finally {
      setLoading(false)
    }
  }

  // Try a basic test on load
  useEffect(() => {
    const runTest = async () => {
      const connected = await testConnection()
      if (connected) {
        runQuery()
      } else {
        setError('Not connected to Zendesk')
      }
    }
    
    runTest()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Zendesk Debug Tool</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Test Query</h2>
        <div className="flex gap-2 mb-4">
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Enter Zendesk search query"
            className="flex-1"
          />
          <Button onClick={runQuery} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              'Run Query'
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => {
              setQuery('type:ticket')
              runQuery()
            }}
          >
            All Tickets
          </Button>
          
          {groups.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const firstGroup = groups[0]
                setQuery(`type:ticket group_id:${firstGroup.id}`)
                runQuery()
              }}
            >
              Test First Group
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => {
              setQuery('type:ticket status:open')
              runQuery()
            }}
          >
            Open Tickets
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setQuery('type:ticket status:pending')
              runQuery()
            }}
          >
            Pending Tickets
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}
      
      {results && (
        <div className="space-y-6">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Results</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Query:</p>
                <p className="font-mono bg-gray-100 p-2 rounded">{results.query}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Count:</p>
                <p className="font-bold">{results.count}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tickets Returned:</p>
                <p className="font-bold">{results.tickets_returned}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Connection Info</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Subdomain:</p>
                <p>{results.connection_info?.subdomain}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Selected Groups:</p>
                <p className="font-mono bg-gray-100 p-2 rounded">
                  {JSON.stringify(results.connection_info?.selected_groups)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Selected Statuses:</p>
                <p className="font-mono bg-gray-100 p-2 rounded">
                  {JSON.stringify(results.connection_info?.selected_statuses)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Available Groups</h3>
            <div className="overflow-auto max-h-60">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">ID</th>
                    <th className="text-left p-2 border">Name</th>
                    <th className="text-left p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.available_groups?.map((group: any) => (
                    <tr key={group.id} className="border-b">
                      <td className="p-2 border">{group.id}</td>
                      <td className="p-2 border">{group.name}</td>
                      <td className="p-2 border">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setQuery(`type:ticket group_id:${group.id}`)
                            runQuery()
                          }}
                        >
                          Test
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Tickets ({results.tickets_returned})</h3>
            <div className="overflow-auto max-h-96">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">ID</th>
                    <th className="text-left p-2 border">Subject</th>
                    <th className="text-left p-2 border">Status</th>
                    <th className="text-left p-2 border">Group</th>
                    <th className="text-left p-2 border">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {results.tickets?.map((ticket: any) => (
                    <tr key={ticket.id} className="border-b">
                      <td className="p-2 border">{ticket.id}</td>
                      <td className="p-2 border">{ticket.subject}</td>
                      <td className="p-2 border">{ticket.status}</td>
                      <td className="p-2 border">
                        {ticket.group_name} ({ticket.group_id})
                      </td>
                      <td className="p-2 border">
                        {new Date(ticket.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 