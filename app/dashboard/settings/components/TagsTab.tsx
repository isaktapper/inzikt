'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, Plus, X, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { TagSuggestions } from '@/app/dashboard/components/TagSuggestions'

interface UserTag {
  id: string
  tag_name: string
  is_default: boolean
  created_at: string
}

export function TagsTab() {
  const [supabase] = useState(() => createClientSupabaseClient())
  const [tags, setTags] = useState<UserTag[]>([])
  const [loading, setLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch user tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('User not found')
        }

        const { data, error } = await supabase
          .from('user_tags')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setTags(data || [])
      } catch (error) {
        console.error('Error fetching tags:', error)
        toast({
          title: 'Error fetching tags',
          description: 'Failed to load your tags. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [supabase, toast])

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Tag name required',
        description: 'Please enter a name for your tag',
        variant: 'destructive',
      })
      return
    }

    // Check for duplicate tag names
    if (tags.some(tag => tag.tag_name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast({
        title: 'Duplicate tag',
        description: 'A tag with this name already exists',
        variant: 'destructive',
      })
      return
    }

    try {
      setAddingTag(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not found')
      }

      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user.id,
          tag_name: newTagName.trim(),
          is_default: false
        })
        .select()

      if (error) throw error

      // Fetch the updated tags list
      const { data: updatedTags, error: fetchError } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTags(updatedTags || [])
      setNewTagName('')
      
      toast({
        title: 'Tag added',
        description: 'Your new tag has been added successfully',
      })
    } catch (error) {
      console.error('Error adding tag:', error)
      toast({
        title: 'Error adding tag',
        description: 'Failed to add your tag. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAddingTag(false)
    }
  }

  const handleDeleteTag = async (id: string) => {
    try {
      setDeletingTagId(id)
      
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setTags(tags.filter(tag => tag.id !== id))
      
      toast({
        title: 'Tag deleted',
        description: 'The tag has been deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast({
        title: 'Error deleting tag',
        description: 'Failed to delete the tag. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeletingTagId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Manage your support tags for ticket classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add new tag input */}
              <div className="space-y-2">
                <Label htmlFor="new-tag">Add new tag</Label>
                <div className="flex space-x-2">
                  <Input
                    id="new-tag"
                    placeholder="Enter tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    maxLength={30}
                  />
                  <Button 
                    onClick={handleAddTag} 
                    disabled={addingTag || !newTagName.trim()}
                  >
                    {addingTag ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Add
                  </Button>
                </div>
              </div>

              {/* Tags list */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Your tags ({tags.length})</h3>
                
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    You don't have any tags yet. Add your first tag above.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tags.map((tag) => (
                      <div 
                        key={tag.id} 
                        className="flex items-center justify-between border rounded-md p-3"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{tag.tag_name}</span>
                          {tag.is_default && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={deletingTagId === tag.id}
                            >
                              {deletingTagId === tag.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete tag</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the tag "{tag.tag_name}"? 
                                This will remove it from all associated tickets.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteTag(tag.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tag Suggestions</CardTitle>
          <CardDescription>
            AI-generated tag suggestions from your ticket content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagSuggestions />
        </CardContent>
      </Card>
    </div>
  )
} 