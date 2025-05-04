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
  currentJobId: string | null;
  startAnalysis: (userId: string, jobId: string) => void;
  stopAnalysis: () => void;
}

const AnalysisProgressContext = createContext<AnalysisProgressContextType>({
  isAnalyzing: false,
  userId: null,
  currentJobId: null,
  startAnalysis: () => {},
  stopAnalysis: () => {},
})

export function AnalysisProgressProvider({ children }: AnalysisProgressProviderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  
  // Check localStorage and database for active jobs on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // First check localStorage for active analysis
        const storedAnalysisStatus = localStorage.getItem('analysisStatus')
        const storedUserId = localStorage.getItem('analysisUserId')
        const storedJobId = localStorage.getItem('analysisJobId')
        
        if (storedAnalysisStatus === 'active' && storedUserId) {
          // Verify with database query if there's an active job
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user && user.id === storedUserId) {
            // Check for the specific job if we have an ID
            if (storedJobId) {
              const { data: jobData, error: jobError } = await supabase
                .from('import_jobs')
                .select('*')
                .eq('id', storedJobId)
                .single()
                
              if (!jobError && jobData) {
                // Only restore if job is actually still active
                if (jobData.status === 'pending' || jobData.status === 'processing') {
                  console.log('Restoring active analysis job from localStorage jobId', jobData)
                  setIsAnalyzing(true)
                  setUserId(user.id)
                  setJobId(storedJobId)
                  return
                } else {
                  console.log('Found stored job but it is already complete or failed', jobData)
                  // Clear localStorage since job is done
                  localStorage.removeItem('analysisStatus')
                  localStorage.removeItem('analysisUserId')
                  localStorage.removeItem('analysisJobId')
                }
              }
            }
            
            // Fall back to querying for any active analysis job
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
              setJobId(data[0].id)
              // Update localStorage with the job ID
              localStorage.setItem('analysisJobId', data[0].id)
              return
            } else {
              console.log('No active analysis jobs found in database')
            }
          }
        }
        
        // If we reach here, no active analysis was found
        localStorage.removeItem('analysisStatus')
        localStorage.removeItem('analysisUserId')
        localStorage.removeItem('analysisJobId')
        setIsAnalyzing(false)
        setUserId(null)
        setJobId(null)
      } catch (error) {
        console.error('Error initializing analysis context:', error)
        // In case of error, clear state to avoid stuck UI
        localStorage.removeItem('analysisStatus')
        localStorage.removeItem('analysisUserId')
        localStorage.removeItem('analysisJobId')
        setIsAnalyzing(false)
        setUserId(null)
        setJobId(null)
      }
    }
    
    initialize()
  }, [supabase])
  
  const startAnalysis = (id: string, analysisJobId: string) => {
    setIsAnalyzing(true)
    setUserId(id)
    setJobId(analysisJobId)
    // Save to localStorage to persist across refreshes
    localStorage.setItem('analysisStatus', 'active')
    localStorage.setItem('analysisUserId', id)
    localStorage.setItem('analysisJobId', analysisJobId)
  }
  
  const stopAnalysis = () => {
    setIsAnalyzing(false)
    setUserId(null)
    setJobId(null)
    // Clear localStorage
    localStorage.removeItem('analysisStatus')
    localStorage.removeItem('analysisUserId')
    localStorage.removeItem('analysisJobId')
  }
  
  return (
    <AnalysisProgressContext.Provider value={{ 
      isAnalyzing, 
      userId, 
      currentJobId: jobId,
      startAnalysis, 
      stopAnalysis 
    }}>
      {children}
      {userId && jobId && (
        <AnalysisProgressIndicator 
          userId={userId} 
          jobId={jobId}
          onComplete={stopAnalysis} 
        />
      )}
    </AnalysisProgressContext.Provider>
  )
}

export const useAnalysisProgress = () => useContext(AnalysisProgressContext) 