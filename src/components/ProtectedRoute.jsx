import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = [], 
  requireAnyRole = false,
  requirePermission = null, // New: use permission functions instead
  fallback = null 
}) => {
  const { 
    user, 
    userRole, 
    loading, 
    hasRole, 
    hasAnyRole,
    // Import hierarchy-aware functions
    isSuperAdmin,
    isAdmin,
    isManager,
    isStaff,
    canManageProducts,
    canManageUsers
  } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-rose-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush-50 to-rose-100">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-rose-600 mb-2">Authentication Required</h2>
          <p className="text-rose-500 mb-6">Please sign in to access this page.</p>
          <a 
            href="/profile" 
            className="inline-flex items-center px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  // Check role-based permissions
  let hasPermission = true

  if (requirePermission) {
    // Use permission functions (hierarchy-aware)
    switch (requirePermission) {
      case 'canManageProducts':
        hasPermission = canManageProducts()
        break
      case 'canManageUsers':
        hasPermission = canManageUsers()
        break
      case 'isAdmin':
        hasPermission = isAdmin()
        break
      case 'isSuperAdmin':
        hasPermission = isSuperAdmin()
        break
      default:
        hasPermission = false
    }
  } else if (requiredRole) {
    // For backwards compatibility, but enhanced with hierarchy
    switch (requiredRole) {
      case 'superadmin':
        hasPermission = isSuperAdmin()
        break
      case 'admin':
        hasPermission = isAdmin() // This includes superadmin
        break
      case 'manager':
        hasPermission = isManager() // This includes admin and superadmin
        break
      case 'staff':
        hasPermission = isStaff() // This includes manager, admin, and superadmin
        break
      default:
        hasPermission = hasRole(requiredRole)
    }
  } else if (requiredRoles.length > 0) {
    if (requireAnyRole) {
      // Check if user has any of the required roles (with hierarchy)
      hasPermission = requiredRoles.some(role => {
        switch (role) {
          case 'superadmin':
            return isSuperAdmin()
          case 'admin':
            return isAdmin()
          case 'manager':
            return isManager()
          case 'staff':
            return isStaff()
          default:
            return hasRole(role)
        }
      })
    } else {
      // Require ALL roles (less common use case)
      hasPermission = requiredRoles.every(role => hasRole(role))
    }
  }

  if (!hasPermission) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush-50 to-rose-100">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-rose-600 mb-2">Access Denied</h2>
          <p className="text-rose-500 mb-2">You don't have permission to access this page.</p>
          <p className="text-sm text-rose-400 mb-6">
            Your role: <span className="font-medium">{userRole}</span>
            {requiredRole && <span> • Required: <span className="font-medium">{requiredRole}</span></span>}
            {requiredRoles.length > 0 && (
              <span> • Required: <span className="font-medium">{requiredRoles.join(requireAnyRole ? ' or ' : ' and ')}</span></span>
            )}
          </p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute