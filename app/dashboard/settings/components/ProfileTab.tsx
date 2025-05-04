'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Check, Trash2, User } from 'lucide-react'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'

interface UserProfile {
  email: string
  first_name?: string
  last_name?: string
}

export function ProfileTab() {
  const router = useRouter()
  const [supabase] = useState(() => createClientSupabaseClient())
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletionLoading, setDeletionLoading] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const profile = {
            email: user.email!,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || ''
          }
          setUserProfile(profile)
          setFormData(profile)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (formData) {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSaveProfile = async () => {
    if (!formData) return

    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name
        }
      })

      if (error) throw error

      setUserProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeletionLoading(true)
      
      // First, ensure the user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Delete user data from the database using a Supabase function
      // This should cascade delete all associated user data
      const { error: functionError } = await supabase.functions.invoke('delete-account', {
        body: { userId: user.id }
      })
      
      if (functionError) {
        throw functionError
      }
      
      // Finally delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (authError) {
        throw authError
      }
      
      // Sign out the user locally
      await supabase.auth.signOut()
      
      // Redirect to login page
      router.push('/login?deleted=true')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again later or contact support.')
    } finally {
      setDeletionLoading(false)
      setShowDeleteConfirmation(false)
    }
  }

  if (loading && !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Profile Information
          </CardTitle>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setFormData(userProfile)
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input 
                    id="first_name"
                    name="first_name"
                    value={formData?.first_name || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input 
                    id="last_name"
                    name="last_name"
                    value={formData?.last_name || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email"
                  value={formData?.email || ''}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">First name</h3>
                  <p>{userProfile?.first_name || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Last name</h3>
                  <p>{userProfile?.last_name || 'Not set'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Email address</h3>
                <p>{userProfile?.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Section */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Actions in this section can lead to permanent data loss.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-red-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete your account and all associated data. 
                      This includes your profile, tickets, analyses, and billing information.
                      <br /><br />
                      <span className="font-medium">This action cannot be undone.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteAccount()
                      }}
                      disabled={deletionLoading}
                    >
                      {deletionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 mr-2 border-b-2 border-white"></div>
                          Deleting...
                        </>
                      ) : (
                        'Yes, delete my account'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 