import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false) })
    return () => unsub()
  }, [])

  const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass)
  const register = (email, pass) => createUserWithEmailAndPassword(auth, email, pass)
  const logout = () => signOut(auth)

  return <AuthCtx.Provider value={{ user, login, register, logout }}>{loading ? null : children}</AuthCtx.Provider>
}
