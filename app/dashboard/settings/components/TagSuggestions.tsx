'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface TagSuggestion {
  id: string
  ticket_id: string
  suggested_tag: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

interface TicketInfo {
  id: string
  subject: string
}

export function TagSuggestions() {
  const [supabase] = useState(() => createClientSupabaseClient())
  const [suggestions, setSuggestions] = useState<(TagSuggestion & { ticket?: TicketInfo })[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null) // Track which suggestion is being processed
  const { toast } = useToast()

  // Fetch tag suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('User not found')
        }

        // Get pending tag suggestions
        const { data, error } = await supabase
          .from('tag_suggestions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Get ticket info for each suggestion
        const suggestions = data || []
        const ticketIds = [...new Set(suggestions.map(s => s.ticket_id))]
        
        if (ticketIds.length > 0) {
          const { data: tickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('id, subject')
            .in('id', ticketIds)
            
          if (ticketsError) throw ticketsError
          
          // Combine suggestions with ticket info
          const suggestionsWithTickets = suggestions.map(suggestion => {
            const ticket = tickets?.find(t => t.id === suggestion.ticket_id)
            return {
              ...suggestion,
              ticket
            }
          })
          
          setSuggestions(suggestionsWithTickets)
        } else {
          setSuggestions(suggestions)
        }
      } catch (error) {
        console.error('Error fetching tag suggestions:', error)
        toast({
          title: 'Error fetching suggestions',
          description: 'Failed to load tag suggestions. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
    
    // Set up real-time subscription to tag_suggestions table
    const channel = supabase
      .channel('tag_suggestions_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tag_suggestions' 
      }, 
      () => {
        fetchSuggestions()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast])

  // Handle tag suggestion action (accept/reject)
  const handleAction = async (suggestionId: string, action: 'accept' | 'reject') => {
    try {
      setProcessing(suggestionId)
      
      const response = await fetch(`/api/tag-suggestions/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestion_id: suggestionId }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process tag suggestion')
      }
      
      // Update local state to remove the processed suggestion
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
      
      toast({
        title: `Tag ${action === 'accept' ? 'accepted' : 'rejected'}`,
        description: `The tag suggestion has been ${action === 'accept' ? 'added to your tags' : 'rejected'}.`,
      })
    } catch (error: any) {
      console.error(`Error ${action}ing tag:`, error)
      toast({
        title: `Error ${action}ing tag`,
        description: error.message || `Failed to ${action} tag suggestion.`,
        variant: 'destructive',
      })
    } finally {
      setProcessing(null)
    }
  }

  // Empty state when no suggestions
  if (!loading && suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Tag Suggestions
          </CardTitle>
          <CardDescription>
            AI-suggested tags will appear here for your review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p>No pending tag suggestions</p>
            <p className="text-sm mt-1">When AI suggests new tags for your tickets, they'll appear here for review</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Tag Suggestions
        </CardTitle>
        <CardDescription>
          Review and manage AI-suggested tags for your support tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center border rounded-md p-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className="flex justify-between items-center border rounded-md p-3 hover:bg-muted/30"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                      {suggestion.suggested_tag}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      suggested {new Date(suggestion.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {suggestion.ticket && (
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      From ticket: {suggestion.ticket.subject}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAction(suggestion.id, 'accept')}
                    disabled={!!processing}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span className="sr-only">Accept</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAction(suggestion.id, 'reject')}
                    disabled={!!processing}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="h-5 w-5" />
                    <span className="sr-only">Reject</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 