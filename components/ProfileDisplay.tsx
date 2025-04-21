'use client'

import { Profile } from '@/lib/getUserProfile'
import { withProfile } from '@/lib/withProfile'

interface ProfileDisplayProps {
  profile: Profile
  showDetails?: boolean
}

function ProfileDisplay({ profile, showDetails = false }: ProfileDisplayProps) {
  return (
    <div className="p-4 rounded-lg border">
      <h2 className="text-xl font-bold mb-2">{profile.full_name || 'User'}</h2>
      {showDetails && (
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Company:</span> {profile.company || 'Not specified'}</p>
          <p><span className="font-medium">Role:</span> {profile.role || 'Not specified'}</p>
          <p><span className="font-medium">Domain:</span> {profile.domain || 'Not specified'}</p>
          {profile.use_cases && profile.use_cases.length > 0 && (
            <div>
              <p className="font-medium">Use Cases:</p>
              <ul className="list-disc pl-5">
                {profile.use_cases.map((useCase, index) => (
                  <li key={index}>{useCase}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export the component wrapped with the withProfile HOC
export default withProfile(ProfileDisplay) 