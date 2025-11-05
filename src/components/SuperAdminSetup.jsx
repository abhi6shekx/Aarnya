import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { setupCurrentUserAsSuperAdmin } from '../utils/initSuperAdmin'

/**
 * SuperAdmin Setup Component
 * Only show this to users who need to be promoted to superadmin
 * Remove this component after initial setup!
 */
export default function SuperAdminSetup() {
  const { user, userRole, isSuperAdmin } = useAuth()
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)

  // Don't show if user is already superadmin
  if (isSuperAdmin()) {
    return null
  }

  // Only show for logged in users
  if (!user) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <div className="text-sm">
            <strong>Please log in first</strong> to set up superadmin access.
          </div>
        </div>
      </div>
    )
  }

  const handleSetupSuperAdmin = async () => {
    if (!confirm('🚨 WARNING: This will give you full superadmin privileges. Continue?')) {
      return
    }

    setIsSettingUp(true)
    try {
      const result = await setupCurrentUserAsSuperAdmin(user.uid)
      if (result.success) {
        setSetupComplete(true)
        // Force a page refresh to reload the user role
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        alert('❌ Error: ' + result.error)
        setShowManualInstructions(true)
      }
    } catch (error) {
      alert('❌ Error: ' + error.message)
      setShowManualInstructions(true)
    } finally {
      setIsSettingUp(false)
    }
  }

  if (setupComplete) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div>
            <div className="font-semibold">SuperAdmin Setup Complete!</div>
            <div className="text-sm">Refreshing page in 2 seconds...</div>
          </div>
        </div>
      </div>
    )
  }

  if (showManualInstructions) {
    return (
      <div className="fixed inset-4 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔧</span>
            <h3 className="text-lg font-semibold">Manual Setup Required</h3>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <strong>Your User ID:</strong>
              <code className="block bg-gray-100 p-2 rounded mt-1 text-xs break-all">
                {user.uid}
              </code>
            </div>
            
            <div>
              <strong>Follow these exact steps in Firebase Console:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to Firebase Console → Firestore Database</li>
                <li>Navigate to <code>users</code> collection</li>
                <li>Find document with ID: <code>{user.uid}</code></li>
                <li>Click the pencil icon to edit</li>
                <li>Add/Edit field:</li>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><strong>Field name:</strong> <code>role</code> (all lowercase)</li>
                  <li><strong>Type:</strong> string</li>
                  <li><strong>Value:</strong> <code>superadmin</code> (all lowercase)</li>
                </ul>
                <li>Click "Update"</li>
                <li>Refresh this page</li>
              </ol>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <strong>⚠️ Important:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Field must be exactly <code>role</code> (not "Role")</li>
                <li>Value must be exactly <code>superadmin</code> (not "Superadmin")</li>
                <li>No extra spaces!</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowManualInstructions(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-purple-100 border border-purple-300 text-purple-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <span className="text-lg">👑</span>
        <div className="flex-1">
          <div className="font-semibold text-sm mb-2">Initial SuperAdmin Setup</div>
          <div className="text-xs mb-3">
            You're logged in as: <strong>{user.email}</strong><br/>
            Current role: <strong>{userRole || 'customer'}</strong>
          </div>
          <button
            onClick={handleSetupSuperAdmin}
            disabled={isSettingUp}
            className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
          >
            {isSettingUp ? 'Setting up...' : 'Make Me SuperAdmin'}
          </button>
          <button
            onClick={() => setShowManualInstructions(true)}
            className="w-full bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-200"
          >
            Manual Setup Instructions
          </button>
          <div className="text-xs text-purple-600 mt-2">
            ⚠️ Only do this for the site owner!
          </div>
        </div>
      </div>
    </div>
  )
}