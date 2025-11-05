import { useAuth } from '../context/AuthContext'

/**
 * Role Debug Component
 * Shows current user role information for debugging
 * Remove this component after setup is complete
 */
export default function RoleDebugger() {
  const { user, userRole, isSuperAdmin, isAdmin, canManageProducts, canManageUsers } = useAuth()

  // Only show for logged in users
  if (!user) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm text-xs font-mono">
      <div className="font-bold mb-2">🐛 Role Debug Info</div>
      <div className="space-y-1">
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>UID:</strong> {user.uid}</div>
        <div><strong>userRole:</strong> {JSON.stringify(userRole)}</div>
        <div><strong>isSuperAdmin():</strong> {isSuperAdmin() ? '✅' : '❌'}</div>
        <div><strong>isAdmin():</strong> {isAdmin() ? '✅' : '❌'}</div>
        <div><strong>canManageProducts():</strong> {canManageProducts() ? '✅' : '❌'}</div>
        <div><strong>canManageUsers():</strong> {canManageUsers() ? '✅' : '❌'}</div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700 text-yellow-300">
        <strong>Expected for SuperAdmin:</strong><br/>
        userRole: "superadmin"<br/>
        All functions: ✅
      </div>
    </div>
  )
}