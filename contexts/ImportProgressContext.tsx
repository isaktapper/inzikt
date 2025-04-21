'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ImportProgressIndicator } from '@/components/ImportProgressIndicator'

interface ImportProgressContextType {
  showImportProgress: (jobId: string, onComplete?: () => void) => void
  hideImportProgress: () => void
  currentJobId: string | null
}

const ImportProgressContext = createContext<ImportProgressContextType>({
  showImportProgress: () => {},
  hideImportProgress: () => {},
  currentJobId: null
})

export const useImportProgress = () => useContext(ImportProgressContext)

export function ImportProgressProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [onCompleteCallback, setOnCompleteCallback] = useState<(() => void) | undefined>()
  
  // Check for saved job on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedJobId = localStorage.getItem('importProgressJobId')
        if (savedJobId) {
          setJobId(savedJobId)
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error)
      }
    }
  }, [])
  
  // Show import progress
  const showImportProgress = useCallback((jobId: string, onComplete?: () => void) => {
    setJobId(jobId)
    setOnCompleteCallback(() => onComplete)
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('importProgressJobId', jobId)
      } catch (error) {
        console.error('Error saving jobId to localStorage:', error)
      }
    }
  }, [])
  
  // Hide import progress
  const hideImportProgress = useCallback(() => {
    setJobId(null)
    setOnCompleteCallback(undefined)
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('importProgressJobId')
      } catch (error) {
        console.error('Error removing jobId from localStorage:', error)
      }
    }
  }, [])
  
  const handleComplete = useCallback(() => {
    if (onCompleteCallback) {
      onCompleteCallback()
    }
    setJobId(null)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('importProgressJobId')
      } catch (error) {
        console.error('Error removing jobId from localStorage:', error)
      }
    }
  }, [onCompleteCallback])
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    showImportProgress,
    hideImportProgress,
    currentJobId: jobId
  }), [showImportProgress, hideImportProgress, jobId])
  
  return (
    <ImportProgressContext.Provider value={contextValue}>
      {children}
      {jobId && (
        <ImportProgressIndicator 
          key={jobId} 
          jobId={jobId} 
          onComplete={handleComplete}
        />
      )}
    </ImportProgressContext.Provider>
  )
} 