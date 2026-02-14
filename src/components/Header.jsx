import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLocalWishlist, getUserWishlist } from '../lib/wishlist'
import { useState, useRef, useEffect } from 'react'
import CategoriesMenu from './CategoriesMenu'

export default function Header(){
  const { user, logout, userRole, canManageProducts, isSuperAdmin } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  // WhatsApp configuration
  const WHATSAPP_NUMBER = "917895111299" // without +
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

  // Close user menu when clicking/tapping outside or pressing Escape
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

  // Watch wishlist changes and auth changes to update the badge count
  useEffect(() => {
    let mounted = true
    const updateCount = async () => {
      try {
        if (user && user.uid) {
          const ids = await getUserWishlist(user.uid)
          if (mounted) setWishlistCount((ids || []).length)
        } else {
          const local = getLocalWishlist()
          if (mounted) setWishlistCount((local || []).length)
        }
      } catch (e) {
        console.warn('Failed to load wishlist count', e)
      }
    }

    updateCount()

    const handler = () => { updateCount() }
    // custom event fired by wishlist helpers
    window.addEventListener('wishlist:changed', handler)
    // cross-tab/localStorage updates
    window.addEventListener('storage', handler)

    return () => {
      mounted = false
      window.removeEventListener('wishlist:changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [user])

  // Watch cart changes to update the badge count
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0)
        setCartCount(totalItems)
      } catch (e) {
        console.warn('Failed to load cart count', e)
        setCartCount(0)
      }
    }

    updateCartCount()

    // Listen for storage changes (cross-tab and same-tab updates)
    window.addEventListener('storage', updateCartCount)
    
    // Custom event for cart updates
    window.addEventListener('cart:changed', updateCartCount)

    // Poll for changes (backup for same-tab updates)
    const interval = setInterval(updateCartCount, 1000)

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cart:changed', updateCartCount)
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blush-200 shadow-sm">
      <div className="container-base flex items-center justify-between h-20 px-4 sm:px-6 md:px-12">
        
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Aarnya" className="h-12 w-12 object-contain drop-shadow-md" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-2xl text-rose-600">Aarnya</span>
            <span className="text-xs tracking-wide text-rose-400 uppercase">
              Where elegance meets emotion
            </span>
          </div>
        </Link>

        {/* Mobile hamburger */}
        <div className="md:hidden mr-2">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
            className="p-2 rounded-md border border-blush-100 bg-white/70 hover:bg-blush-50"
          >
            <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation - desktop */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLink to="/products" 
            className={({ isActive }) => 
              `relative px-4 py-2 rounded-full text-charcoal transition ${
                isActive 
                  ? 'bg-blush-200 text-rose-700 shadow-soft' 
                  : 'hover:bg-blush-100 hover:text-rose-600'
              }`
            }
          >
            Shop
          </NavLink>

          {/* Categories dropdown */}
          <CategoriesMenu />

          <NavLink to="/cart" 
            className={({ isActive }) =>
              `relative px-4 py-2 rounded-full text-charcoal transition flex items-center gap-2 ${
                isActive 
                  ? 'bg-blush-200 text-rose-700 shadow-soft' 
                  : 'hover:bg-blush-100 hover:text-rose-600'
              }`
            }
          >
            Cart
            {cartCount > 0 && (
              <span className="inline-flex items-center justify-center text-xs bg-rose-500 text-white rounded-full min-w-[20px] h-5 px-1">
                {cartCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/wishlist" 
            className={({ isActive }) =>
              `relative px-4 py-2 rounded-full text-charcoal transition flex items-center gap-2 ${
                isActive 
                  ? 'bg-blush-200 text-rose-700 shadow-soft' 
                  : 'hover:bg-blush-100 hover:text-rose-600'
              }`
            }
          >
            {/* simple heart icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-rose-500">
              <path d="M12 21s-7-4.534-9-7.071C-1.2 9.618 5.6 5 9 8.5 11 10.5 12 12 12 12s1-1.5 3-3.5C18.4 5 25.2 9.618 21 13.929 19 16.466 12 21 12 21z" />
            </svg>
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center text-xs bg-rose-500 text-white rounded-full px-1.5 py-0.5">
                {wishlistCount}
              </span>
            )}
          </NavLink>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full transition hover:bg-blush-100 hover:text-rose-600 text-charcoal btn-outline"
          >
            Chat on WhatsApp
          </a>

          {user ? (
            <div className="relative" ref={menuRef}>
              {/* User Menu Button */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blush-100 hover:bg-blush-200 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blush-400 to-rose-400 rounded-full flex items-center justify-center text-white font-medium">
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <span className="text-charcoal font-medium">{user.displayName || 'User'}</span>
                <svg className={`w-4 h-4 text-charcoal transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-blush-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-blush-100">
                    <p className="text-sm font-medium text-charcoal">{user.displayName || 'User'}</p>
                    <p className="text-xs text-rose-600 opacity-70">{user.email}</p>
                  </div>
                  
                  <NavLink 
                    to="/profile" 
                    className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-blush-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg className="w-5 h-5 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>My Profile</span>
                  </NavLink>

                  <NavLink 
                    to="/orders" 
                    className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-blush-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg className="w-5 h-5 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    <span>My Orders</span>
                  </NavLink>

                  <NavLink 
                    to="/profile#addresses" 
                    className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-blush-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg className="w-5 h-5 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span>My Addresses</span>
                  </NavLink>

                  <NavLink 
                    to="/wishlist" 
                    className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-blush-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <span className="text-rose-500">💖</span>
                    <span>My Wishlist</span>
                  </NavLink>

                  {/* Admin link in user menu for mobile/compact view - show only for explicit admin/manager/superadmin roles */}
                  {(userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin') && (
                    <NavLink 
                      to="/admin" 
                      className={`flex items-center gap-3 px-4 py-3 text-charcoal transition-colors ${
                        isSuperAdmin() ? 'hover:bg-purple-50' : 'hover:bg-blush-50'
                      }`}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className={`w-5 h-5 ${
                        isSuperAdmin() ? 'text-purple-500' : 'text-blush-500'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{isSuperAdmin() && '👑 '}Admin Panel</span>
                      <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                        isSuperAdmin() 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {userRole}
                      </span>
                    </NavLink>
                  )}

                  <div className="border-t border-blush-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition ${isActive ? 'bg-blush-200 text-rose-700 shadow-soft' : 'hover:bg-blush-100 hover:text-rose-600'}`
              }
            >
              Sign In
            </NavLink>
          )}

          {/* Admin link - only show for superadmin/admin/manager */}
          {(userRole === "admin" || userRole === "manager" || userRole === "superadmin") && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-6 py-3 hover:bg-rose-50 transition"
            >
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Mobile menu panel */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-white z-40 border-t border-blush-100 md:hidden">
            <div className="px-4 py-4 flex flex-col gap-2">
              <NavLink to="/products" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>Shop</NavLink>
              <div className="px-3 py-2">
                {/* Keep the categories component visible in mobile as-is if it supports touch */}
                <CategoriesMenu compactOnMobile={true} />
              </div>
              <NavLink to="/cart" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50 flex items-center gap-2" onClick={() => setShowMobileMenu(false)}>
                Cart
                {cartCount > 0 && (
                  <span className="inline-flex items-center justify-center text-xs bg-rose-500 text-white rounded-full min-w-[20px] h-5 px-1">
                    {cartCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/wishlist" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50 flex items-center gap-2" onClick={() => setShowMobileMenu(false)}>
                <span className="text-rose-500">💖</span>
                Wishlist
              </NavLink>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50">Chat on WhatsApp</a>

              {user ? (
                <>
                  <NavLink to="/profile" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>My Profile</NavLink>
                  <NavLink to="/orders" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>My Orders</NavLink>
                  <NavLink to="/profile#addresses" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>My Addresses</NavLink>
                  {(userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin') && (
                    <NavLink to="/admin" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>Admin Panel</NavLink>
                  )}
                  <button onClick={() => { handleLogout(); setShowMobileMenu(false) }} className="text-rose-600 px-3 py-2 text-left">Sign Out</button>
                </>
              ) : (
                <NavLink to="/profile" className="px-3 py-2 rounded-md text-charcoal hover:bg-blush-50" onClick={() => setShowMobileMenu(false)}>Sign In</NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
