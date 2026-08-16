import React, { useState } from 'react'

const DEFAULT_ACCESS_CODE = 'aarnya123'

export default function SiteLockGuard({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('aarnya_site_unlocked') === 'true'
  })
  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState('')

  const handleUnlock = (e) => {
    e.preventDefault()
    const targetPassword = import.meta.env.VITE_SITE_ACCESS_PASSWORD || DEFAULT_ACCESS_CODE

    if (inputCode.trim() === targetPassword) {
      localStorage.setItem('aarnya_site_unlocked', 'true')
      setIsUnlocked(true)
      setError('')
    } else {
      setError('Incorrect Access Code. Please try again.')
    }
  }

  if (isUnlocked) {
    return children
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Aarnya Site Protected</h1>
          <p className="text-slate-400 text-sm">
            This preview site is currently private. Please enter the Access Code to continue.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Access Code / Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                autoFocus
              />
              <svg className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-xs">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg shadow-rose-600/25 active:scale-[0.98]"
          >
            Unlock Access
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Aarnya Private Preview Guard
        </div>
      </div>
    </div>
  )
}
