'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IntegrationsTab } from './components/IntegrationsTab'
import { ProfileTab } from './components/ProfileTab'
import { TagsTab } from './components/TagsTab'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Link2, Download, Brain, CreditCard, Zap, HomeIcon, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface UserProfile {
  email: string
  first_name?: string
}

interface ZendeskConnection {
  id: string
  subdomain: string
  admin_email: string
  created_at: string
}

interface ImportSettings {
  auto_import: boolean
  import_frequency: 'manual' | 'daily' | 'hourly'
}

interface AISettings {
  auto_analysis: boolean
  last_analysis?: string
}

interface Subscription {
  plan: string
  status: string
  current_period_end: string
}

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam === 'integrations' 
    ? 'integrations' 
    : tabParam === 'tags'
      ? 'tags'
      : 'profile'
  const [supabase] = useState(() => createClientSupabaseClient())
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [zendeskConnection, setZendeskConnection] = useState<ZendeskConnection | null>(null)
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    auto_import: false,
    import_frequency: 'manual'
  })
  const [aiSettings, setAISettings] = useState<AISettings>({
    auto_analysis: false
  })
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserProfile({
            email: user.email!,
            first_name: user.user_metadata?.full_name?.split(' ')[0]
          })
        }

        // Fetch Zendesk connection
        const { data: zendeskData } = await supabase
          .from('zendesk_connections')
          .select('*')
          .single()
        setZendeskConnection(zendeskData)

        // Fetch import settings
        const { data: importData } = await supabase
          .from('import_settings')
          .select('*')
          .single()
        if (importData) {
          setImportSettings(importData)
        }

        // Fetch AI settings
        const { data: aiData } = await supabase
          .from('ai_settings')
          .select('*')
          .single()
        if (aiData) {
          setAISettings(aiData)
        }

        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .single()
        if (subscriptionData) {
          setSubscription(subscriptionData)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleDisconnectZendesk = async () => {
    try {
      const { error } = await supabase
        .from('zendesk_connections')
        .delete()
        .eq('id', zendeskConnection?.id)

      if (error) throw error
      
      setZendeskConnection(null)
    } catch (error) {
      console.error('Error disconnecting Zendesk:', error)
    }
  }

  const handleUpdateImportSettings = async (settings: Partial<ImportSettings>) => {
    try {
      const { error } = await supabase
        .from('import_settings')
        .upsert(settings)

      if (error) throw error
      
      setImportSettings(prev => ({ ...prev, ...settings }))
    } catch (error) {
      console.error('Error updating import settings:', error)
    }
  }

  const handleUpdateAISettings = async (settings: Partial<AISettings>) => {
    try {
      const { error } = await supabase
        .from('ai_settings')
        .upsert(settings)

      if (error) throw error
      
      setAISettings(prev => ({ ...prev, ...settings }))
    } catch (error) {
      console.error('Error updating AI settings:', error)
    }
  }

  const handleTabChange = (value: string) => {
    // Update the URL without a full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and connections.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="bg-background border">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
        <TabsContent value="tags">
          <TagsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
} 