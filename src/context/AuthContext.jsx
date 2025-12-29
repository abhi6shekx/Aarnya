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
  signInWithPhoneNumber
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// 1️⃣ SAFE default context (NO undefined)
const AuthContext = createContext({
  user: null,
  userRole: null,
  loading: true
})

export const useAuth = () => useContext(AuthContext)
export const useAuthContext = useAuth

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const getUserRole = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      return snap.exists() ? snap.data().role || 'customer' : 'customer'
    } catch {
      return 'customer'
    }
  }

  const createUserDocument = async (user, role = 'customer') => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)

    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        role,
        orderCount: 0,
        createdAt: new Date(),
        lastLogin: new Date()
      })
    } else {
      await setDoc(ref, { lastLogin: new Date() }, { merge: true })
    }
  }

  const signup = async (email, password) => {
    const res = await createUserWithEmailAndPassword(auth, email, password)
    await createUserDocument(res.user)
    return res.user
  }

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password)
    await createUserDocument(res.user)
    return res.user
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const res = await signInWithPopup(auth, provider)
    await createUserDocument(res.user)
    return res.user
  }

  const sendOTP = async (phoneNumber) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      })
    }
    return signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
  }

  const logout = async () => {
    setUser(null)
    setUserRole(null)
    await signOut(auth)
  }

  // 2️⃣ CRITICAL FIX: auth listener must ALWAYS finish loading
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u)
        setUserRole(u ? await getUserRole(u.uid) : null)
      } finally {
        setLoading(false)
      }
    })
    return unsub
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

    // role helpers
    isSuperAdmin: () => userRole === 'superadmin',
    isAdmin: () => ['admin', 'superadmin'].includes(userRole),
    isStaff: () => ['staff', 'admin', 'superadmin'].includes(userRole),
    isCustomer: () => userRole === 'customer'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
