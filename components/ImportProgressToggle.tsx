'use client'

import { useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { useImportProgress } from '@/contexts/ImportProgressContext'

interface ImportProgressToggleProps {
  className?: string
}

function ImportProgressToggleComponent({ className = '' }: ImportProgressToggleProps) {
  const { toggleImportProgress, isVisible, currentJobId } = useImportProgress()
  
  const handleToggle = useCallback(() => {
    toggleImportProgress()
  }, [toggleImportProgress])
  
  // If there's no active job, don't render anything
  if (!currentJobId) {
    return null
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={`flex items-center ${className}`}
    >
      {isVisible ? (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Hide Import Progress
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Show Import Progress
        </>
      )}
    </Button>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const ImportProgressToggle = memo(ImportProgressToggleComponent) 