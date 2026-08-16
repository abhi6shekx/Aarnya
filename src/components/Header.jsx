import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import CategoriesMenu from './CategoriesMenu'

export default function Header() {
  const { user, logout, userRole, isSuperAdmin } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  const whatsappLink = "https://wa.me/917895111299?text=Hi!%20I%20want%20to%20customize%20a%20jewelry%20piece.%20Can%20you%20help%20me?"

  const handleLogout = async () => {
    try {
      setShowUserMenu(false)
      const result = await logout()
      if (result.success) {
        navigate('/', { replace: true })
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }

    const handleKey = (e) => {
      if (e.key === 'Escape') setShowUserMenu(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuRef])

  return (
    <header className="sticky top-0 z-50 glass-header shadow-sm transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-rose-600 via-blush-600 to-rose-700 text-white text-xs py-1.5 px-4 text-center font-medium tracking-wide">
        ✨ Free Shipping Across India • Pure Handmade & Custom Jewelry • <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-90">Custom Orders Available</a>
      </div>

      <div className="container-base flex items-center justify-between h-20 px-4 sm:px-6">
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="relative p-1 bg-gradient-to-br from-rose-100 to-blush-50 rounded-2xl shadow-sm border border-blush-200 group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.svg" alt="Aarnya" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl font-bold text-charcoal tracking-tight group-hover:text-rose-600 transition-colors">Aarnya</span>
            <span className="text-[10px] tracking-widest text-rose-500 uppercase font-semibold mt-1">
              Elegance & Emotion
            </span>
          </div>
        </Link>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link to="/cart" className="p-2 rounded-full text-charcoal hover:bg-blush-100 relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </Link>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
            className="p-2 rounded-xl border border-rose-200 bg-white/80 hover:bg-blush-50 text-charcoal transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <NavLink to="/products" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blush-200 text-rose-700 shadow-soft' 
                  : 'text-charcoal hover:bg-blush-100 hover:text-rose-600'
              }`
            }
          >
            Shop All
          </NavLink>

          {/* Categories dropdown */}
          <CategoriesMenu />

          <NavLink to="/wishlist" 
            className={({ isActive }) => 
              `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-blush-200 text-rose-700 shadow-soft' 
                  : 'text-charcoal hover:bg-blush-100 hover:text-rose-600'
              }`
            }
          >
            <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Wishlist
          </NavLink>

          <NavLink to="/cart" 
            className={({ isActive }) =>
              `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-blush-200 text-rose-700 shadow-soft' 
                  : 'text-charcoal hover:bg-blush-100 hover:text-rose-600'
              }`
            }
          >
            <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Cart
          </NavLink>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 ml-1"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            WhatsApp
          </a>

          <div className="h-5 w-px bg-rose-200 mx-2"></div>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blush-100/80 border border-blush-200 hover:bg-blush-200 transition-all duration-200 shadow-sm"
              >
                <div className="w-7 h-7 bg-gradient-to-r from-blush-500 to-rose-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <span className="text-charcoal text-sm font-medium">{user.displayName || 'Account'}</span>
                <svg className={`w-3.5 h-3.5 text-rose-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-blush-200 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-blush-100 bg-blush-50/50 rounded-t-2xl">
                    <p className="text-sm font-bold text-charcoal">{user.displayName || 'Customer'}</p>
                    <p className="text-xs text-rose-600 opacity-80 truncate">{user.email}</p>
                  </div>
                  
                  <NavLink 
                    to="/profile" 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-blush-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg className="w-4 h-4 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>My Profile</span>
                  </NavLink>

                  <NavLink 
                    to="/orders" 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-blush-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg className="w-4 h-4 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    <span>My Orders</span>
                  </NavLink>

                  <NavLink 
                    to="/wishlist" 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-blush-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span>Wishlist</span>
                  </NavLink>

                  {(userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin') && (
                    <NavLink 
                      to="/admin" 
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal transition-colors ${
                        isSuperAdmin() ? 'hover:bg-purple-50' : 'hover:bg-blush-50'
                      }`}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className={`w-4 h-4 ${
                        isSuperAdmin() ? 'text-purple-500' : 'text-blush-500'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Admin Control</span>
                    </NavLink>
                  )}

                  <div className="border-t border-blush-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/profile"
              className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-rose-500 to-blush-500 text-white shadow-soft hover:shadow-glow transition-all duration-300"
            >
              Sign In
            </NavLink>
          )}
        </nav>

        {/* Mobile menu drawer */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-rose-200 shadow-xl md:hidden animate-fade-in">
            <div className="px-5 py-5 flex flex-col gap-3">
              <NavLink to="/products" className="px-4 py-2.5 rounded-xl text-charcoal font-medium hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>Shop All Products</NavLink>
              <div className="px-4 py-1">
                <CategoriesMenu compactOnMobile={true} />
              </div>
              <NavLink to="/wishlist" className="px-4 py-2.5 rounded-xl text-charcoal font-medium hover:bg-blush-50 flex items-center justify-between" onClick={() => setShowMobileMenu(false)}>
                <span>Wishlist</span>
                <span className="text-xs text-rose-500">❤️</span>
              </NavLink>
              <NavLink to="/cart" className="px-4 py-2.5 rounded-xl text-charcoal font-medium hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>Cart</NavLink>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Chat on WhatsApp
              </a>

              {user ? (
                <div className="pt-2 border-t border-rose-100 flex flex-col gap-1">
                  <NavLink to="/profile" className="px-4 py-2.5 rounded-xl text-charcoal font-medium hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>My Profile</NavLink>
                  <NavLink to="/orders" className="px-4 py-2.5 rounded-xl text-charcoal font-medium hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>My Orders</NavLink>
                  {(userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin') && (
                    <NavLink to="/admin" className="px-4 py-2.5 rounded-xl text-purple-700 bg-purple-50 font-medium" onClick={() => setShowMobileMenu(false)}>Admin Panel</NavLink>
                  )}
                  <button onClick={() => { handleLogout(); setShowMobileMenu(false) }} className="text-rose-600 px-4 py-2.5 text-left font-medium">Sign Out</button>
                </div>
              ) : (
                <NavLink to="/profile" className="px-4 py-2.5 rounded-xl bg-rose-500 text-white text-center font-medium shadow-soft" onClick={() => setShowMobileMenu(false)}>Sign In</NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

