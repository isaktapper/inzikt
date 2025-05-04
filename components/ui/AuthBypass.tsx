/**
 * Special component for local development testing only
 * Allows bypassing authentication for testing purposes
 */

"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthBypass() {
  const [userId, setUserId] = useState('')
  const [bypassEnabled, setBypassEnabled] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // Only enable in development
    setIsDev(process.env.NODE_ENV === 'development')
    
    // Check if bypass is already enabled
    const savedBypass = localStorage.getItem('auth_bypass') === 'true'
    const savedUserId = localStorage.getItem('auth_bypass_user_id') || ''
    
    setBypassEnabled(savedBypass)
    setUserId(savedUserId)
  }, [])

  const enableBypass = () => {
    localStorage.setItem('auth_bypass', 'true')
    localStorage.setItem('auth_bypass_user_id', userId)
    setBypassEnabled(true)
    
    // Reload to apply changes
    window.location.reload()
  }

  const disableBypass = () => {
    localStorage.removeItem('auth_bypass')
    localStorage.removeItem('auth_bypass_user_id')
    setBypassEnabled(false)
    
    // Reload to apply changes
    window.location.reload()
  }

  // Register the bypass with the fetch API
  useEffect(() => {
    if (isDev && bypassEnabled) {
      const originalFetch = window.fetch
      window.fetch = function(input, init) {
        init = init || {}
        init.headers = init.headers || {}
        
        // Add bypass headers
        const headers = new Headers(init.headers)
        headers.set('x-bypass-auth', 'true') 
        headers.set('x-user-id', userId)
        init.headers = headers
        
        return originalFetch(input, init)
      }
      
      console.log('🛠️ Auth bypass enabled for development')
      
      return () => {
        // Restore original fetch when component unmounts
        window.fetch = originalFetch
      }
    }
  }, [isDev, bypassEnabled, userId])

  if (!isDev) return null

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 opacity-90 hover:opacity-100 transition-opacity">
      <CardHeader className="px-4 py-2">
        <CardTitle className="text-sm flex items-center">
          <span className="mr-2">🔧</span> Dev Auth Bypass
        </CardTitle>
        <CardDescription className="text-xs">Local development only</CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-2 space-y-2">
        {bypassEnabled ? (
          <div className="text-xs">
            <span className="font-bold text-green-500">Enabled</span> with user ID: 
            <div className="overflow-x-auto text-gray-500 mt-1 p-1 bg-gray-100 rounded">
              {userId || '(none)'}
            </div>
          </div>
        ) : (
          <Input 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID for testing"
            className="text-xs h-8"
          />
        )}
      </CardContent>
      <CardFooter className="px-4 py-2">
        {bypassEnabled ? (
          <Button 
            variant="destructive" 
            className="w-full text-xs h-8" 
            onClick={disableBypass}
          >
            Disable Bypass
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="w-full text-xs h-8" 
            onClick={enableBypass}
          >
            Enable Bypass
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 