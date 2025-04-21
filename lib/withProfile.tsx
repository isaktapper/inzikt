'use client'

import { useEffect, useState, ComponentType } from 'react'
import { getUserProfile, Profile } from './getUserProfile'
import ProfileFetchErrorFallback from '@/components/ProfileFetchErrorFallback'

interface WithProfileProps {
  profile: Profile
}

/**
 * Higher Order Component that provides the user profile to wrapped components
 * Handles loading state and error fallback UI
 */
export function withProfile<P extends WithProfileProps>(
  WrappedComponent: ComponentType<P>
) {
  return function WithProfileComponent(props: Omit<P, keyof WithProfileProps>) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const profileData = await getUserProfile()
        setProfile(profileData)
      } catch (err) {
        console.error('Error fetching profile in HOC:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'))
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchProfile()
    }, [])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (error || !profile) {
      return (
        <ProfileFetchErrorFallback 
          message={error?.message || 'Failed to load user profile'} 
          retry={fetchProfile}
        />
      )
    }

    return <WrappedComponent {...(props as P)} profile={profile} />
  }
} 