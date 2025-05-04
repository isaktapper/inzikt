'use client'

import Link from 'next/link'
import { ServerCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useImportProgress } from '@/contexts/ImportProgressContext'
import { useAnalysisProgress } from '@/contexts/AnalysisProgressContext'

export function JobsDropdown() {
  // Get import progress state
  const { currentJobId: importJobId } = useImportProgress()
  
  // Get analysis progress state
  const { isAnalyzing } = useAnalysisProgress()

  // Track total active jobs
  const totalActiveJobs = (importJobId ? 1 : 0) + (isAnalyzing ? 1 : 0);
  
  return (
    <Button variant="outline" size="sm" className="relative" asChild>
      <Link href="/jobs">
        <ServerCog className="h-4 w-4 mr-1" />
        Jobs
        {totalActiveJobs > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {totalActiveJobs}
          </Badge>
        )}
      </Link>
    </Button>
  )
} 