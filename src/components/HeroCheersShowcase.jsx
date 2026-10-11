import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function HeroCheersShowcase({ products = [], fallbackSrc = '/favicon.svg' }) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isManualCheers, setIsManualCheers] = useState(false)

  // Track scroll position within the hero viewport (0 to 1)
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY
          // Complete animation within first 350px of scroll
          const progress = Math.min(1, Math.max(0, scrollY / 320))
          setScrollProgress(progress)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Manual trigger when user clicks the cheers button
  const triggerManualCheers = () => {
    setIsManualCheers(true)
    setTimeout(() => setIsManualCheers(false), 1600)
  }

  const effectiveProgress = isManualCheers ? 1 : scrollProgress
  const isCheersReached = effectiveProgress > 0.7

  // Product 1 (Left piece) and Product 2 (Right piece)
  const productA = products[0] || null
  const productB = products[1] || products[0] || null

  const imageA = productA?.images?.[0]?.url || productA?.images?.[0] || productA?.imageUrl || fallbackSrc
  const imageB = productB?.images?.[1]?.url || productB?.images?.[1] || productB?.images?.[0]?.url || productB?.images?.[0] || imageA

  // Transform calculations based on progress
  // Left card: starts shifted left (-45px on mobile, -75px on desktop) & tilted (-12deg)
  // When scrolled: moves to center (-2px) & tilts inward (-3deg)
  const leftX = (1 - effectiveProgress) * -65
  const leftRotate = (1 - effectiveProgress) * -12 - 3

  // Right card: starts shifted right (+45px on mobile, +75px on desktop) & tilted (+12deg)
  // When scrolled: moves to center (+2px) & tilts inward (+3deg)
  const rightX = (1 - effectiveProgress) * 65
  const rightRotate = (1 - effectiveProgress) * 12 + 3

  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      
      {/* Background Ambient Glow & Sparkle particles */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-rose-200/50 via-blush-200/30 to-amber-200/40 rounded-[2.5rem] blur-2xl -z-10"></div>

      {/* Floating Sparkles that react to scroll */}
      <div 
        className="absolute -top-3 left-6 text-xl transition-all duration-300 pointer-events-none"
        style={{ transform: `translateY(${effectiveProgress * 15}px) rotate(${effectiveProgress * 45}deg)` }}
      >
        ✨
      </div>
      <div 
        className="absolute -bottom-3 right-8 text-xl transition-all duration-300 pointer-events-none"
        style={{ transform: `translateY(${-effectiveProgress * 15}px) rotate(${-effectiveProgress * 45}deg)` }}
      >
        🌸
      </div>

      {/* Main Container */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-blush-100 shadow-luxury space-y-4 relative overflow-hidden">
        
        {/* Top Header Badge & Interactive Toast Pill */}
        <div className="flex items-center justify-between gap-2 border-b border-blush-50 pb-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-[11px] font-bold text-rose-700">
            <span>🥂</span>
            <span>{isCheersReached ? 'Perfect Pair Clink!' : 'Scroll to Cheers!'}</span>
          </div>

          <button
            onClick={triggerManualCheers}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-full transition-all flex items-center gap-1 shadow-xs active:scale-95"
            title="Click to see Cheers Animation"
          >
            <span>🥂 Tap to Cheers</span>
          </button>
        </div>

        {/* CHEERS ANIMATION STAGE (The two cards/earrings) */}
        <div 
          onClick={triggerManualCheers}
          className="relative h-64 sm:h-72 w-full flex items-center justify-center cursor-pointer group"
          title="Scroll or Click to see them Cheers together!"
        >

          {/* Contact Sparkle Burst (Appears when they touch / cheers) */}
          <div 
            className={`absolute z-30 transition-all duration-300 pointer-events-none flex flex-col items-center ${
              isCheersReached ? 'scale-110 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-400/90 text-white flex items-center justify-center shadow-lg shadow-amber-400/50 animate-ping absolute"></div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-stone-900 font-extrabold text-sm flex items-center justify-center shadow-md relative z-10 border-2 border-white">
              ✨
            </div>
            <span className="mt-1 px-2.5 py-0.5 bg-charcoal text-white text-[10px] font-bold rounded-full shadow-md whitespace-nowrap">
              🥂 Cheers!
            </span>
          </div>

          {/* LEFT PIECE (Moves right on scroll) */}
          <div
            className="absolute z-10 w-36 sm:w-44 transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `translateX(${leftX}px) rotate(${leftRotate}deg)`
            }}
          >
            <div className="bg-white rounded-2xl p-2.5 border border-blush-100 shadow-md hover:shadow-xl transition-shadow relative">
              <div className="aspect-square rounded-xl overflow-hidden bg-ivory relative">
                <img
                  src={imageA}
                  alt={productA?.name || 'Left Piece'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                />
                <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-rose-700 shadow-xs">
                  Left Pair
                </span>
              </div>
              <div className="mt-2 text-center">
                <p className="font-display font-bold text-xs text-charcoal truncate">
                  {productA?.name || 'Floral Resin Earring'}
                </p>
                <p className="text-[11px] font-bold text-rose-600">
                  {productA?.price ? `₹${productA.price}` : 'Handcrafted'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PIECE (Moves left on scroll) */}
          <div
            className="absolute z-20 w-36 sm:w-44 transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `translateX(${rightX}px) rotate(${rightRotate}deg)`
            }}
          >
            <div className="bg-white rounded-2xl p-2.5 border border-blush-100 shadow-md hover:shadow-xl transition-shadow relative">
              <div className="aspect-square rounded-xl overflow-hidden bg-ivory relative">
                <img
                  src={imageB}
                  alt={productB?.name || 'Right Piece'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                />
                <span className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 shadow-xs">
                  Right Pair
                </span>
              </div>
              <div className="mt-2 text-center">
                <p className="font-display font-bold text-xs text-charcoal truncate">
                  {productB?.name || 'Botanical Bloom'}
                </p>
                <p className="text-[11px] font-bold text-rose-600">
                  {productB?.price ? `₹${productB.price}` : 'Handcrafted'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Scroll Hint / Indicator Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Opposite Sides ↔️</span>
            <span className="font-bold text-rose-600">
              {Math.round(effectiveProgress * 100)}% Together
            </span>
            <span>Clink Together 🥂</span>
          </div>

          {/* Interactive Progress Bar */}
          <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
              style={{ width: `${Math.max(10, effectiveProgress * 100)}%` }}
            ></div>
          </div>

          <div className="pt-2 flex gap-2">
            <Link
              to={productA ? `/product/${productA.id}` : '/products'}
              className="flex-1 py-2.5 bg-charcoal hover:bg-black text-white text-xs font-bold rounded-xl text-center transition-all shadow-sm"
            >
              View Left Piece →
            </Link>
            {productB && productB.id !== productA?.id ? (
              <Link
                to={`/product/${productB.id}`}
                className="flex-1 py-2.5 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold rounded-xl text-center border border-rose-200 transition-all"
              >
                View Right Piece →
              </Link>
            ) : (
              <Link
                to="/products"
                className="flex-1 py-2.5 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold rounded-xl text-center border border-rose-200 transition-all"
              >
                Explore Pair →
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
