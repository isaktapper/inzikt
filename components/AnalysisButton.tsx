'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalysisProgress } from '@/contexts/AnalysisProgressContext'
import { toast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AnalysisButtonProps {
  className?: string
}

export function AnalysisButton({ className }: AnalysisButtonProps) {
  const { isAnalyzing, startAnalysis } = useAnalysisProgress()
  const [isStarting, setIsStarting] = useState(false)
  const supabase = createClientComponentClient()
  
  // Start a new analysis
  const handleAnalyze = async () => {
    try {
      setIsStarting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Authentication error',
          description: 'You must be logged in to analyze tickets',
          variant: 'destructive'
        })
        return
      }
      
      // Start the analysis process
      const response = await fetch('/api/analyze-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (data.jobId) {
        // Now we pass the job ID to the context
        startAnalysis(user.id, data.jobId)
        
        toast({
          title: 'Analysis started',
          description: 'Your tickets are being analyzed and tagged.',
          variant: 'default'
        })
      } else {
        toast({
          title: 'Nothing to analyze',
          description: data.message || 'No tickets found that need analysis',
          variant: 'default'
        })
      }
    } catch (error: any) {
      console.error('Analysis error:', error)
      toast({
        title: 'Analysis error',
        description: error.message || 'Failed to start ticket analysis',
        variant: 'destructive'
      })
    } finally {
      setIsStarting(false)
    }
  }
  
  return (
    <Button
      variant="default"
      className={className}
      onClick={handleAnalyze}
      disabled={isAnalyzing || isStarting}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isAnalyzing ? 'Analysis in progress...' : isStarting ? 'Starting analysis...' : 'Analyze tickets'}
    </Button>
  )
} 