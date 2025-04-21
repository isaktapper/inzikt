'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, X, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface TagSuggestion {
  id: string
  user_id: string
  ticket_id: string
  suggested_tag: string
  status: 'pending' | 'accepted' | 'rejected'
}

interface TagSuggestionsProps {
  ticketId?: string // Optional: to filter suggestions for a specific ticket
  onRefreshTags?: () => void
}

export function TagSuggestions({ ticketId, onRefreshTags }: TagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({})
  
  const supabase = createClientSupabaseClient()
  
  // Fetch tag suggestions
  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      let query = supabase
        .from('tag_suggestions')
        .select('*')
        .eq('status', 'pending')
        .eq('user_id', user.id)
        
      // Filter by ticket_id if provided
      if (ticketId) {
        query = query.eq('ticket_id', ticketId)
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setSuggestions(data || [])
    } catch (err: any) {
      console.error('Error fetching tag suggestions:', err)
      setError('Failed to load tag suggestions')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle tag action (accept/reject)
  const handleTagAction = async (id: string, action: 'accepted' | 'rejected') => {
    try {
      setActionInProgress(prev => ({ ...prev, [id]: true }))
      
      // Get the suggestion
      const suggestion = suggestions.find(s => s.id === id)
      if (!suggestion) return
      
      // Update the tag status
      const { error: updateError } = await supabase
        .from('tag_suggestions')
        .update({ status: action })
        .eq('id', id)
        
      if (updateError) {
        throw updateError
      }
      
      // If accepted, add the tag to user_tags
      if (action === 'accepted') {
        const { error: insertError } = await supabase
          .from('user_tags')
          .upsert({
            user_id: suggestion.user_id,
            tag_name: suggestion.suggested_tag,
            is_default: false
          }, {
            onConflict: 'user_id,tag_name',
            ignoreDuplicates: true
          })
          
        if (insertError) {
          throw insertError
        }
        
        toast.success(`Added tag: ${suggestion.suggested_tag}`)
      } else {
        toast.info(`Dismissed tag: ${suggestion.suggested_tag}`)
      }
      
      // Update local state
      setSuggestions(prev => prev.filter(s => s.id !== id))
      
      // Call refresh callback if provided
      if (onRefreshTags) {
        onRefreshTags()
      }
      
    } catch (err: any) {
      console.error(`Error handling tag action (${action}):`, err)
      setError(`Failed to ${action === 'accepted' ? 'accept' : 'reject'} tag`)
      toast.error(`Error: ${err.message || 'Something went wrong'}`)
    } finally {
      setActionInProgress(prev => ({ ...prev, [id]: false }))
    }
  }
  
  // Load suggestions on mount
  useEffect(() => {
    fetchSuggestions()
  }, [ticketId])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading suggestions...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  if (suggestions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        No tag suggestions available.
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {suggestions.map(suggestion => (
          <div 
            key={suggestion.id} 
            className="flex items-center bg-slate-100 px-2 py-1 rounded-md"
          >
            <span className="text-sm mr-2">{suggestion.suggested_tag}</span>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-green-100 hover:text-green-600"
                onClick={() => handleTagAction(suggestion.id, 'accepted')}
                disabled={actionInProgress[suggestion.id]}
              >
                {actionInProgress[suggestion.id] ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
                <span className="sr-only">Accept</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600"
                onClick={() => handleTagAction(suggestion.id, 'rejected')}
                disabled={actionInProgress[suggestion.id]}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Reject</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSuggestions}
          className="text-xs"
        >
          <Loader2 className="h-3 w-3 mr-1" /> 
          Refresh
        </Button>
      </div>
    </div>
  )
} 