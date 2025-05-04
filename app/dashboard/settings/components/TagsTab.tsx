'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, Plus, X, Loader2, Trash2, Upload, FileSpreadsheet, Download, Globe } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { TagSuggestions } from '@/app/dashboard/components/TagSuggestions'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import TagSetupModal from '@/app/components/TagSetupModal'

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
  const [deletingAllTags, setDeletingAllTags] = useState(false)
  const [importingTags, setImportingTags] = useState(false)
  const [generatingTags, setGeneratingTags] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: boolean;
    message: string;
    importedCount?: number;
    skippedCount?: number;
    errors?: string[];
  } | null>(null)
  const [tagSetupModalOpen, setTagSetupModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleDeleteAllTags = async () => {
    try {
      setDeletingAllTags(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not found')
      }

      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setTags([])
      
      toast({
        title: 'All tags deleted',
        description: 'All your tags have been deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting all tags:', error)
      toast({
        title: 'Error deleting tags',
        description: 'Failed to delete all tags. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeletingAllTags(false)
    }
  }
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setImportingTags(true);
      setImportProgress(10);
      setImportResults(null);
      
      // Simulated progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 90);
        });
      }, 200);
      
      const response = await fetch('/api/tags/import', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      const results = await response.json();
      setImportResults(results);
      
      if (results.success) {
        // Refresh tags list
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: updatedTags } = await supabase
            .from('user_tags')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (updatedTags) {
            setTags(updatedTags);
          }
        }
        
        toast({
          title: 'Tags imported',
          description: results.message,
        });
      } else {
        toast({
          title: 'Import issue',
          description: results.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error importing tags:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import tags from file.',
        variant: 'destructive',
      });
    } finally {
      setImportingTags(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDownloadTemplate = (format: 'csv' | 'excel') => {
    window.open(`/api/tags/template?format=${format}`, '_blank');
  };
  
  const handleGenerateTagsFromWebsite = () => {
    setTagSetupModalOpen(true);
  };
  
  const handleTagSetupModalClose = () => {
    setTagSetupModalOpen(false);
    
    // Refresh tags after modal is closed
    const refreshTags = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: updatedTags } = await supabase
          .from('user_tags')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (updatedTags) {
          setTags(updatedTags);
        }
      }
    };
    
    refreshTags();
  };

  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('template-format-menu');
      if (menu && !menu.contains(event.target as Node)) {
        menu.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
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
                
                {/* Import/Export options */}
                <div className="border rounded-md p-4 space-y-4">
                  <h3 className="font-medium">Bulk Tag Management</h3>
                  
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Import Tags</h4>
                        <p className="text-xs text-muted-foreground">Import tag names from a CSV or Excel file</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative inline-block">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const menu = document.getElementById('template-format-menu');
                              if (menu) {
                                menu.classList.toggle('hidden');
                              }
                            }}
                            disabled={importingTags}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Template
                          </Button>
                          <div 
                            id="template-format-menu" 
                            className="hidden absolute right-0 mt-1 border rounded-md shadow-md bg-background w-32 z-50"
                          >
                            <button 
                              className="px-4 py-2 text-sm hover:bg-muted w-full text-left"
                              onClick={() => {
                                handleDownloadTemplate('csv');
                                document.getElementById('template-format-menu')?.classList.add('hidden');
                              }}
                            >
                              CSV Format
                            </button>
                            <button 
                              className="px-4 py-2 text-sm hover:bg-muted w-full text-left"
                              onClick={() => {
                                handleDownloadTemplate('excel');
                                document.getElementById('template-format-menu')?.classList.add('hidden');
                              }}
                            >
                              Excel Format
                            </button>
                          </div>
                        </div>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={importingTags}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={importingTags}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {importingTags ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                    </div>
                    
                    {importingTags && (
                      <Progress value={importProgress} className="h-2" />
                    )}
                    
                    {importResults && (
                      <div className={`text-sm p-2 rounded border ${importResults.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                        <p className="font-medium">{importResults.message}</p>
                        {importResults.importedCount !== undefined && (
                          <p>Imported: {importResults.importedCount}, Skipped: {importResults.skippedCount || 0}</p>
                        )}
                        {importResults.errors && importResults.errors.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs">View {importResults.errors.length} issues</summary>
                            <ul className="mt-1 text-xs pl-2">
                              {importResults.errors.slice(0, 5).map((error, index) => (
                                <li key={index} className="list-disc list-inside">{error}</li>
                              ))}
                              {importResults.errors.length > 5 && (
                                <li className="italic">...and {importResults.errors.length - 5} more</li>
                              )}
                            </ul>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Generate Tags from Website</h4>
                        <p className="text-xs text-muted-foreground">
                          Automatically generate relevant tags based on your website content
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleGenerateTagsFromWebsite}
                        disabled={generatingTags}
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Generate Tags
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tags list */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Your tags ({tags.length})</h3>
                    {tags.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            disabled={deletingAllTags}
                          >
                            {deletingAllTags ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Delete All
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete all tags</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete all your tags? 
                              This will remove them from all associated tickets and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAllTags}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete All
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
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
      
      {/* Tag Setup Modal */}
      <TagSetupModal 
        isOpen={tagSetupModalOpen} 
        onClose={handleTagSetupModalClose} 
      />
    </>
  )
} 