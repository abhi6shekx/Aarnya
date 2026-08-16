import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'
import { GENDER_ICONS, CATEGORY_ICONS } from '../lib/categories'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import {
  isInLocalWishlist,
  addToLocalWishlist,
  removeFromLocalWishlist,
  addToUserWishlist,
  removeFromUserWishlist
} from '../lib/wishlist'

async function incrementProductAddCount(productId) {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      addCount: increment(1),
    });
  } catch (error) {
    console.error("Failed to update addCount:", error);
  }
}

function PopularityBadge({ addCount, purchaseCount }) {
  let label = "";
  let style = "";

  if (purchaseCount > 100) {
    label = "👑 Bestseller";
    style = "bg-gradient-to-r from-amber-200 to-yellow-300 text-amber-900 border border-amber-300/80 shadow-sm";
  } else if (addCount > 50) {
    label = "🌟 Hot Pick";
    style = "bg-gradient-to-r from-rose-200 to-blush-300 text-rose-900 border border-rose-300/80 shadow-sm";
  } else if (addCount > 10) {
    label = "🔥 Trending";
    style = "bg-gradient-to-r from-pink-100 to-rose-100 text-rose-800 border border-rose-200 shadow-sm";
  }

  if (!label) return null;
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${style}`}>{label}</span>;
}

export default function ProductCard({ p }) {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [saved, setSaved] = useState(false)
  const [animVariant, setAnimVariant] = useState('')

  useEffect(() => {
    setSaved(isInLocalWishlist(p.id))
  }, [user, p.id])

  const addToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ ...p, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    await incrementProductAddCount(p.id)
    navigate('/cart')
  }

  const startVirtualTryOn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/virtual-try-on/${p.id}`)
  }

  return (
    <div className="bg-white rounded-3xl p-3.5 border border-blush-100/80 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between group relative">
      
      {/* Wishlist heart button */}
      <button
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={async (e) => {
          e.preventDefault()
          e.stopPropagation()
          try {
            let newSaved = saved
            if (user && user.uid) {
              if (saved) {
                await removeFromUserWishlist(user.uid, p.id)
                await removeFromLocalWishlist(p.id)
                newSaved = false
              } else {
                await addToUserWishlist(user.uid, p.id)
                await addToLocalWishlist(p.id)
                newSaved = true
              }
            } else {
              if (isInLocalWishlist(p.id)) {
                await removeFromLocalWishlist(p.id)
                newSaved = false
              } else {
                await addToLocalWishlist(p.id)
                newSaved = true
              }
            }
            setSaved(newSaved)
            setAnimVariant(newSaved ? 'add' : 'remove')
          } catch (err) {
            console.error('Wishlist toggle failed', err)
          }
        }}
        className="absolute top-5 left-5 z-20 w-9 h-9 rounded-full glass-badge flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110 focus:outline-none"
      >
        <svg
          onAnimationEnd={() => setAnimVariant('')}
          className={`w-4 h-4 transition-all duration-200 ${saved ? 'text-rose-600 scale-110' : 'text-gray-400 scale-100'} ${animVariant === 'add' ? 'animate-heart-pop' : ''}`}
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 21s-7-4.35-9-7.5C1.2 9.7 4 5 8 5c2.1 0 3 1.5 4 2.5C13 6.5 13.9 5 16 5c4 0 6.8 4.7 5 8.5C19 16.65 12 21 12 21z" />
        </svg>
      </button>

      <Link to={`/product/${p.id}`} className="block flex-1">
        {/* Product Image Box */}
        <div className="aspect-square overflow-hidden rounded-2xl bg-ivory relative group-hover:shadow-inner transition-all">
          <img
            src={p.images?.[0]?.url || p.images?.[0] || '/logo.svg'}
            alt={p.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Top Right Badges */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end z-10">
            {(p.addCount || p.purchaseCount) && <PopularityBadge addCount={p.addCount} purchaseCount={p.purchaseCount} />}
            
            {p.gender && (
              <span className="glass-badge px-2 py-0.5 rounded-full text-[11px] font-semibold text-purple-700 flex items-center gap-1 shadow-sm">
                <span>{GENDER_ICONS[p.gender]}</span>
                {p.gender}
              </span>
            )}
          </div>

          {/* Virtual Try-On Badge */}
          {p.virtualTryOnEnabled && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <span className="bg-emerald-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm">
                📸 Try On
              </span>
            </div>
          )}
        </div>
        
        {/* Details Content */}
        <div className="pt-4 px-1 pb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider text-rose-500 uppercase">
              {p.productType || p.category || 'Jewelry'}
            </span>
            {p.stock <= 5 && p.stock > 0 && (
              <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Only {p.stock} left!
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-lg text-charcoal line-clamp-1 group-hover:text-rose-600 transition-colors">
            {p.name}
          </h3>
          
          {p.shortDesc && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 font-light">
              {p.shortDesc}
            </p>
          )}

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-bold text-lg text-charcoal">
              {formatINR(p.price)}
            </span>
            {p.originalPrice && p.originalPrice > p.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatINR(p.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Action Buttons */}
      <div className="mt-2 pt-2 border-t border-rose-50">
        {p.stock === 0 ? (
          <button 
            disabled 
            className="bg-gray-100 text-gray-400 py-2 px-4 rounded-xl text-xs font-semibold w-full cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : p.virtualTryOnEnabled ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startVirtualTryOn}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1"
            >
              📸 Try On
            </button>
            <button
              onClick={addToCart}
              className="btn-primary text-xs font-semibold py-2 px-3 rounded-xl"
            >
              Add to Cart
            </button>
          </div>
        ) : (
          <button
            onClick={addToCart}
            className="btn-primary w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}

