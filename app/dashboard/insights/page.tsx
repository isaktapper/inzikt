"use client"

import { useState, useEffect } from "react"
import { Loader2, TrendingUp, TrendingDown, BarChart, AlertTriangle, RefreshCw, MessageSquare, Filter, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { createClientSupabaseClient } from "@/utils/supabase/client"
import Link from "next/link"
import { InsightsSettings } from "@/components/InsightsSettings"
import { InsightDetails } from "@/components/InsightDetails"
import { InsightMetrics } from "@/components/InsightMetrics"
import { Badge } from "@/components/ui/badge"

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: 'TREND' | 'VOLUME' | 'EMERGING' | 'IMPROVEMENT' | 'ALERT';
  percentage_change: number | null;
  related_tags: string[];
  related_ticket_ids: string[];
  metric_type: string;
  metric_value: number | null;
  time_period: string;
  count: number;
  created_at: string;
}

// Define available periods
const AVAILABLE_PERIODS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'half_year', label: 'Half Year' },
  { value: 'year', label: 'Yearly' },
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(["week"])
  const [activePeriod, setActivePeriod] = useState<string>("week")
  const [generating, setGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  
  const supabase = createClientSupabaseClient()

  // Initial insights fetch
  useEffect(() => {
    fetchUserSettings()
    fetchInsights()
  }, [])

  // Poll for job completion if we're generating insights
  useEffect(() => {
    if (jobId && generating) {
      const interval = setInterval(checkJobStatus, 2000)
      setPollingInterval(interval)
      return () => clearInterval(interval)
    } else if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }, [jobId, generating])

  // Fetch user's settings to get preferred periods
  const fetchUserSettings = async () => {
    try {
      // Find the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Look for existing scheduled job for insights to get preferred periods
      const { data: job, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_type', 'generate-insights')
        .single()
      
      if (error) {
        // No settings found, use default
        return
      }
      
      if (job?.parameters?.periods) {
        // Use the user's preferred periods
        setSelectedPeriods(job.parameters.periods)
        // Set active period to the first one
        if (job.parameters.periods.length > 0) {
          setActivePeriod(job.parameters.periods[0])
        }
      } else if (job?.parameters?.period) {
        // Backward compatibility
        setSelectedPeriods([job.parameters.period])
        setActivePeriod(job.parameters.period)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Request insights for all selected periods
      const periodsParam = selectedPeriods.join(',')
      const response = await fetch(`/api/insights/generate?periods=${periodsParam}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' 
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch insights' }))
        throw new Error(errorData.error || 'Failed to fetch insights')
      }
      
      const data = await response.json()
      
      // Augment insights with default count if missing
      const processedInsights = data.insights.map((insight: Insight) => ({
        ...insight,
        count: insight.related_ticket_ids?.length || 0
      }))
      
      setInsights(processedInsights)
    } catch (err: any) {
      console.error('Error fetching insights:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateNewInsights = async () => {
    try {
      setGenerating(true)
      
      console.log("Requesting insights generation...");
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({
          periods: selectedPeriods,
          compare_with: 'previous_period'
        })
      })
      
      const responseText = await response.text();
      console.log("Raw API response:", responseText);
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: 'Invalid JSON response' };
      }
      
      if (!response.ok) {
        console.error("API error details:", errorData);
        const errorMessage = errorData.error || 'Failed to generate insights';
        const errorDetails = errorData.details ? (typeof errorData.details === 'string' ? 
          errorData.details : JSON.stringify(errorData.details)) : '';
        
        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      }
      
      const data = errorData; // We already parsed the response
      setJobId(data.jobId)
      
      toast({
        title: "Generating insights",
        description: "We're analyzing your tickets and generating insights. This may take a minute."
      })
      
    } catch (err: any) {
      console.error('Error generating insights:', err)
      setError(err.message)
      setGenerating(false)
      
      toast({
        title: "Error generating insights",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const checkJobStatus = async () => {
    if (!jobId) return
    
    try {
      const { data: job, error } = await supabase
        .from('import_jobs')
        .select('status, progress')
        .eq('id', jobId)
        .single()
      
      if (error) throw error
      
      if (job.status === 'completed') {
        setGenerating(false)
        setJobId(null)
        
        toast({
          title: "Insights generated successfully",
          description: "Your new insights are ready to view."
        })
        
        // Fetch new insights
        fetchInsights()
      } else if (job.status === 'failed') {
        setGenerating(false)
        setJobId(null)
        
        toast({
          title: "Insights generation failed",
          description: "There was an error generating insights. Please try again.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Error checking job status:', err)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'TREND':
        return <TrendingUp className="h-5 w-5" />
      case 'VOLUME':
        return <BarChart className="h-5 w-5" />
      case 'EMERGING':
        return <TrendingUp className="h-5 w-5" />
      case 'IMPROVEMENT':
        return <TrendingUp className="h-5 w-5" />
      case 'ALERT':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <BarChart className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: string, change: number | null) => {
    if (type === 'ALERT') return "text-red-700 bg-red-100"
    if (type === 'IMPROVEMENT') return "text-green-700 bg-green-100"
    
    if (change) {
      return change > 0 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
    }
    
    return "text-blue-700 bg-blue-100"
  }

  // Filter insights by active period
  const filteredInsights = insights.filter(
    insight => insight.time_period === activePeriod
  )

  const renderSkeletons = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          
          <div className="flex gap-2 mb-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-muted-foreground">
            AI-generated analysis and trends from your support tickets.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="default" 
            onClick={generateNewInsights}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="view">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="view">
            <BarChart className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Filter className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <InsightMetrics period={activePeriod} />
        </TabsContent>
        
        <TabsContent value="view">
          {/* Period selection tabs */}
          <div className="mb-6">
            <div className="mb-2 text-sm font-medium">Time Period</div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PERIODS.filter(p => 
                selectedPeriods.includes(p.value)
              ).map(period => (
                <Badge 
                  key={period.value}
                  variant={activePeriod === period.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setActivePeriod(period.value)}
                >
                  {period.label}
                </Badge>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {!loading && filteredInsights.length === 0 ? (
            <Card className="border shadow-sm mb-6">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No insights available</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  We don't have enough data to generate insights for this time period yet.
                  Import more tickets or try a different time period.
                </p>
                <Button onClick={generateNewInsights} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Insights Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? 
                renderSkeletons() 
                : 
                filteredInsights.map((insight) => (
                  <Card key={insight.id} className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <div className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", 
                          getInsightColor(insight.insight_type, insight.percentage_change)
                        )}>
                          {insight.insight_type}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getTimeContextLabel(insight.time_period, insight.created_at)}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2 flex-wrap">
                          {insight.related_tags.map((tag) => (
                            <span 
                              key={tag} 
                              className="px-2 py-1 rounded-full text-xs bg-accent text-accent-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {insight.related_ticket_ids.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>{insight.related_ticket_ids.length} tickets</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 border-t flex justify-between">
                      <InsightDetails insight={insight} />
                      
                      {insight.related_ticket_ids.length > 0 ? (
                        <Link 
                          href={`/dashboard?ticket_ids=${insight.related_ticket_ids.join(',')}`}
                        >
                          <Button 
                            variant="outline" 
                            size="sm"
                          >
                            View tickets
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled
                        >
                          No tickets
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              }
            </div>
          )}
          
          <Card className="border bg-accent mb-6 mt-6">
            <CardContent className="pt-6">
              <h2 className="font-bold mb-2">About AI-powered insights</h2>
              <p className="text-sm text-muted-foreground">
                These insights are generated using advanced AI analysis of your support tickets.
                The system analyzes ticket volume, content, and trends to identify patterns
                and provide actionable recommendations for your support team.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <InsightsSettings />
            </div>
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" /> 
                    Insights Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Control which types of insights are generated and customize your insights experience.
                    You can toggle different categories of insights to focus on what matters most to your team.
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium">Coming soon:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                      <li>Custom insight category preferences</li>
                      <li>Insight notification settings</li>
                      <li>Integration with team communication tools</li>
                      <li>Custom insight metrics and KPIs</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to format the time context
function getTimeContextLabel(period: string, createdAt: string) {
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  switch(period) {
    case 'day':
      return `Last 24 hours (generated ${formattedDate})`;
    case 'week':
      return `Last 7 days (generated ${formattedDate})`;
    case 'month':
      return `Last 30 days (generated ${formattedDate})`;
    case 'quarter':
      return `Last quarter (generated ${formattedDate})`;
    case 'half_year':
      return `Last 6 months (generated ${formattedDate})`;
    case 'year':
      return `Last year (generated ${formattedDate})`;
    default:
      return `Generated ${formattedDate}`;
  }
} 