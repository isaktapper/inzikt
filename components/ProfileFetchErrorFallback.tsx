'use client'

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useRouter } from 'next/navigation'

interface ProfileFetchErrorFallbackProps {
  message?: string
  retry?: () => void
}

export default function ProfileFetchErrorFallback({
  message = "Could not load your user profile. Please try logging out and in again or contact support.",
  retry
}: ProfileFetchErrorFallbackProps) {
  const router = useRouter()

  const handleLogout = async () => {
    router.push('/logout')
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Profile Error</h2>
      <p className="text-muted-foreground mb-6">{message}</p>
      <div className="flex gap-4">
        {retry && (
          <Button 
            variant="outline" 
            onClick={retry}
          >
            Try Again
          </Button>
        )}
        <Button 
          onClick={handleLogout}
          variant="destructive"
        >
          Log Out
        </Button>
      </div>
    </div>
  )
} 