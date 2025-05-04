'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { getUserUsage, checkUsageLimits } from '@/lib/usage/tracker'

export default function UsagePage() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [usageData, setUsageData] = useState({
    openai_tokens: { current: 0, limit: 100000, percentage: 0 },
    api_calls: { current: 0, limit: 10000, percentage: 0 },
    ticket_analysis: { current: 0, limit: 1000, percentage: 0 }
  })
  
  // Fetch usage data
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setIsLoading(true)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No authenticated user')
        
        // Get user's plan limits
        const { data: userData, error: userError } = await supabase
          .from('user_subscription')
          .select('plan, limits')
          .eq('user_id', user.id)
          .single()
        
        if (userError && userError.code !== 'PGRST116') {
          throw userError
        }
        
        // Default limits
        const limits = {
          openai_tokens: 100000,
          api_calls: 10000,
          ticket_analysis: 1000,
          ...(userData?.limits || {})
        }
        
        // Check usage for each metric
        const tokenUsage = await checkUsageLimits(user.id, 'openai_tokens', limits.openai_tokens)
        const apiUsage = await checkUsageLimits(user.id, 'api_calls', limits.api_calls)
        const analysisUsage = await checkUsageLimits(user.id, 'ticket_analysis', limits.ticket_analysis)
        
        setUsageData({
          openai_tokens: tokenUsage,
          api_calls: apiUsage,
          ticket_analysis: analysisUsage
        })
      } catch (error) {
        console.error('Error fetching usage data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load usage data',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUsage()
  }, [supabase, toast])
  
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-2" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Usage & Limits</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Usage</CardTitle>
              <CardDescription>
                Your usage for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">API Calls</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(usageData.api_calls.current)} / {formatNumber(usageData.api_calls.limit)}
                    </span>
                  </div>
                  <Progress value={usageData.api_calls.percentage} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">OpenAI Tokens</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(usageData.openai_tokens.current)} / {formatNumber(usageData.openai_tokens.limit)}
                    </span>
                  </div>
                  <Progress value={usageData.openai_tokens.percentage} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Ticket Analysis</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(usageData.ticket_analysis.current)} / {formatNumber(usageData.ticket_analysis.limit)}
                    </span>
                  </div>
                  <Progress value={usageData.ticket_analysis.percentage} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 