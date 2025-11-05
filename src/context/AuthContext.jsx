import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Backwards-compatible alias: some files import `useAuthContext`
export const useAuthContext = useAuth

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get user role from Firestore
  const getUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        return userDoc.data().role || 'customer'
      }
      return 'customer'
    } catch (error) {
      console.error('Error fetching user role:', error)
      return 'customer'
    }
  }

  // Create user document with role and promo structure
  const createUserDocument = async (user, role = 'customer') => {
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          role: role,
          userPromoUsage: {
            FREEDEL: false,
            EXPRESS50: false,
            ABHI100: false
          },
          orderCount: 0,
          createdAt: new Date(),
          lastLogin: new Date()
        })
      } else {
        // Update last login
        await setDoc(userRef, {
          lastLogin: new Date()
        }, { merge: true })
      }
    } catch (error) {
      console.error('Error creating user document:', error)
    }
  }

  // Role checking utilities with hierarchy: superadmin > admin > manager > staff > customer
  const isSuperAdmin = () => userRole === 'superadmin'
  const isAdmin = () => userRole === 'admin' || isSuperAdmin()
  const isManager = () => userRole === 'manager' || isAdmin()
  const isStaff = () => userRole === 'staff' || isManager()
  const isCustomer = () => userRole === 'customer'
  const hasRole = (role) => userRole === role
  const hasAnyRole = (roles) => roles.includes(userRole)
  
  // Permission-based functions
  const canManageProducts = () => userRole === 'admin' || userRole === 'manager' || isSuperAdmin()
  const canDeleteProducts = () => userRole === 'admin' || isSuperAdmin()
  const canViewAllOrders = () => userRole === 'admin' || userRole === 'staff' || isSuperAdmin()
  const canManageUsers = () => isSuperAdmin() // Only superadmin can manage user roles
  const canPromoteToAdmin = () => isSuperAdmin() // Only superadmin can create admins
  const canDeleteUsers = () => isSuperAdmin() // Only superadmin can delete users
  
  // Role hierarchy functions
  const getRoleLevel = (role) => {
    const levels = { customer: 1, staff: 2, manager: 3, admin: 4, superadmin: 5 }
    return levels[role] || 0
  }
  
  const canManageRole = (targetRole) => {
    return getRoleLevel(userRole) > getRoleLevel(targetRole)
  }

  // Sign up with email and password
  const signup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await createUserDocument(result.user, 'customer')
      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await createUserDocument(result.user)
      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await createUserDocument(result.user, 'customer')
      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Send OTP to phone number
  const sendOTP = async (phoneNumber) => {
    try {
      // Create recaptcha verifier
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved')
          }
        })
      }

      const appVerifier = window.recaptchaVerifier
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      
      return { success: true, confirmationResult }
    } catch (error) {
      console.error('SMS send error:', error)
      return { success: false, error: error.message }
    }
  }

  // Verify OTP and sign in
  const verifyOTP = async (confirmationResult, otp) => {
    try {
      const result = await confirmationResult.confirm(otp)
      await createUserDocument(result.user, 'customer')
      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign out
  const logout = async () => {
    try {
      // Clear state before signing out to prevent race conditions
      setUserRole(null)
      await signOut(auth)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if signOut fails, clear local state
      setUser(null)
      setUserRole(null)
      return { success: false, error: error.message }
    }
  }

  // Update user role (superadmin only)
  const updateUserRole = async (uid, newRole) => {
    try {
      if (!canManageUsers()) {
        throw new Error('Only superadmins can update user roles')
      }
      
      // Prevent superadmin from demoting themselves
      if (uid === user?.uid && userRole === 'superadmin' && newRole !== 'superadmin') {
        throw new Error('Cannot demote yourself from superadmin role')
      }
      
      // Prevent creating multiple superadmins without explicit permission
      if (newRole === 'superadmin' && !isSuperAdmin()) {
        throw new Error('Only superadmins can promote users to superadmin')
      }
      
      await setDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date(),
        updatedBy: user.uid
      }, { merge: true })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user)
        
        if (user) {
          // Fetch user role when user logs in
          const role = await getUserRole(user.uid)
          setUserRole(role)
        } else {
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUser(null)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    userRole,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    sendOTP,
    verifyOTP,
    updateUserRole,
    // Role checking utilities
    isSuperAdmin,
    isAdmin,
    isManager,
    isStaff,
    isCustomer,
    hasRole,
    hasAnyRole,
    // Permission-based functions
    canManageProducts,
    canDeleteProducts,
    canViewAllOrders,
    canManageUsers,
    canPromoteToAdmin,
    canDeleteUsers,
    // Role hierarchy functions
    getRoleLevel,
    canManageRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}