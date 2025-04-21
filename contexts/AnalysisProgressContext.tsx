'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { AnalysisProgressIndicator } from '@/components/ProgressIndicator'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AnalysisProgressProviderProps {
  children: ReactNode
}

interface AnalysisProgressContextType {
  isAnalyzing: boolean;
  userId: string | null;
  startAnalysis: (userId: string) => void;
  stopAnalysis: () => void;
}

const AnalysisProgressContext = createContext<AnalysisProgressContextType>({
  isAnalyzing: false,
  userId: null,
  startAnalysis: () => {},
  stopAnalysis: () => {},
})

export function AnalysisProgressProvider({ children }: AnalysisProgressProviderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  
  // Check localStorage and database for active jobs on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // First check localStorage for active analysis
        const storedAnalysisStatus = localStorage.getItem('analysisStatus')
        const storedUserId = localStorage.getItem('analysisUserId')
        
        if (storedAnalysisStatus === 'active' && storedUserId) {
          // Verify with database query if there's an active job
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user && user.id === storedUserId) {
            const { data, error } = await supabase
              .from('import_jobs')
              .select('*')
              .eq('user_id', user.id)
              .eq('job_type', 'analysis')
              .or('status.eq.processing,status.eq.pending')
              .order('created_at', { ascending: false })
              .limit(1)
              
            if (!error && data && data.length > 0) {
              // We found an active analysis job, restore the state
              console.log('Restoring active analysis job from database', data[0])
              setIsAnalyzing(true)
              setUserId(user.id)
              return
            }
          }
        }
        
        // If we reach here, no active analysis was found
        localStorage.removeItem('analysisStatus')
        localStorage.removeItem('analysisUserId')
        setIsAnalyzing(false)
        setUserId(null)
      } catch (error) {
        console.error('Error initializing analysis context:', error)
      }
    }
    
    initialize()
  }, [supabase])
  
  const startAnalysis = (id: string) => {
    setIsAnalyzing(true)
    setUserId(id)
    // Save to localStorage to persist across refreshes
    localStorage.setItem('analysisStatus', 'active')
    localStorage.setItem('analysisUserId', id)
  }
  
  const stopAnalysis = () => {
    setIsAnalyzing(false)
    setUserId(null)
    // Clear localStorage
    localStorage.removeItem('analysisStatus')
    localStorage.removeItem('analysisUserId')
  }
  
  return (
    <AnalysisProgressContext.Provider value={{ isAnalyzing, userId, startAnalysis, stopAnalysis }}>
      {children}
      {userId && <AnalysisProgressIndicator userId={userId} onComplete={stopAnalysis} />}
    </AnalysisProgressContext.Provider>
  )
}

export const useAnalysisProgress = () => useContext(AnalysisProgressContext) 