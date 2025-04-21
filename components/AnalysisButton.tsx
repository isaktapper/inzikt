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
  const handleStartAnalysis = async () => {
    try {
      setIsStarting(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Authentication error',
          description: 'Please sign in to analyze tickets',
          variant: 'destructive',
        })
        return
      }
      
      // Call API to start analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Update state in context
      startAnalysis(user.id)
      
      toast({
        title: 'Analysis started',
        description: 'Your tickets are being analyzed in the background. You can view progress in the Jobs menu.',
      })
    } catch (error) {
      console.error('Error starting analysis:', error)
      toast({
        title: 'Failed to start analysis',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsStarting(false)
    }
  }
  
  return (
    <Button
      variant="default"
      className={className}
      onClick={handleStartAnalysis}
      disabled={isAnalyzing || isStarting}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isAnalyzing ? 'Analysis in progress...' : isStarting ? 'Starting analysis...' : 'Analyze tickets'}
    </Button>
  )
} 