'use client'

import { Badge } from '@/components/ui/badge'
import { useImportProgress } from '@/contexts/ImportProgressContext'
import { useAnalysisProgress } from '@/contexts/AnalysisProgressContext'

export function ActiveJobsBadge() {
  // Get import progress state
  const { currentJobId: importJobId } = useImportProgress()
  
  // Get analysis progress state
  const { isAnalyzing } = useAnalysisProgress()

  // Track total active jobs
  const totalActiveJobs = (importJobId ? 1 : 0) + (isAnalyzing ? 1 : 0);
  
  if (totalActiveJobs === 0) return null;
  
  return (
    <Badge 
      variant="destructive" 
      className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
    >
      {totalActiveJobs}
    </Badge>
  )
} 