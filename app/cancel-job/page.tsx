'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { XCircle, Loader2 } from "lucide-react"

export default function CancelJobPage() {
  const [canceling, setCanceling] = useState(false)
  const [done, setDone] = useState(false)
  const jobId = 'd2102f06-1439-4c11-a847-b593b35d8797'
  
  const cancelJob = async () => {
    try {
      setCanceling(true)
      
      // Call the appropriate endpoint for analysis jobs
      const response = await fetch('/api/analyze-tickets/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel job')
      }
      
      toast({
        title: "Job canceled",
        description: "The job has been successfully canceled.",
      })
      
      setDone(true)
    } catch (error) {
      console.error('Error canceling job:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to cancel job',
        variant: "destructive",
      })
    } finally {
      setCanceling(false)
    }
  }
  
  useEffect(() => {
    // Automatically trigger job cancellation when the page loads
    cancelJob()
  }, [])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Cancel Analysis Job</h1>
        <p className="mb-4">Job ID: {jobId}</p>
        
        {canceling ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Canceling job...</span>
          </div>
        ) : done ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
            Job has been successfully canceled.
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={cancelJob}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Job
            </Button>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/jobs'}
          >
            Go to Jobs List
          </Button>
        </div>
      </div>
    </div>
  )
} 