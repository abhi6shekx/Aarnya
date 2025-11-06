import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'
import { GENDER_ICONS, CATEGORY_ICONS } from '../lib/categories'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import {
  getLocalWishlist,
  isInLocalWishlist,
  addToLocalWishlist,
  removeFromLocalWishlist,
  addToUserWishlist,
  removeFromUserWishlist
} from '../lib/wishlist'

// Function to increment product popularity count
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
    label = "👑 Bestselling";
    style = "bg-gradient-to-r from-pink-300 to-yellow-200 text-ink shadow-lg shadow-pink-200";
  } else if (addCount > 50) {
    label = "🌟 Hot Seller";
    style = "bg-gradient-to-r from-yellow-200 to-rose-100 text-ink shadow-md shadow-yellow-200";
  } else if (addCount > 10) {
    label = "🔥 Trending";
    style = "bg-gradient-to-r from-rose-200 to-pink-100 text-rose-800 shadow-sm";
  }

  if (!label) return null;
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>{label}</span>;
}

export default function ProductCard({ p }) {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [saved, setSaved] = useState(false)
  const [animVariant, setAnimVariant] = useState('')

  useEffect(() => {
    if (user && user.uid) {
      // If user is logged in, check their wishlist via local cache (we read localStorage for now)
      // For simplicity, prefer localStorage check to avoid an extra network call on every card render.
      setSaved(isInLocalWishlist(p.id))
    } else {
      setSaved(isInLocalWishlist(p.id))
    }
  }, [user, p.id])

  const addToCart = async () => {
    // Add to cart logic
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ ...p, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Update popularity count in Firestore
    await incrementProductAddCount(p.id)
    
    // Navigate to cart
    navigate('/cart')
  }

  const startVirtualTryOn = (e) => {
    e.preventDefault()
    navigate(`/virtual-try-on/${p.id}`)
  }

  return (
    <div className="card p-3 hover:shadow-xl transition duration-300 transform hover:-translate-y-1 relative group">
      {/* Wishlist heart button */}
      <div className="absolute top-2 left-2 z-20">
        <button
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={saved}
          title={saved ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={async (e) => {
            e.preventDefault()
            try {
              let newSaved = saved
              if (user && user.uid) {
                if (saved) {
                  await removeFromUserWishlist(user.uid, p.id)
                  // also remove from local cache
                  await removeFromLocalWishlist(p.id)
                  newSaved = false
                } else {
                  await addToUserWishlist(user.uid, p.id)
                  await addToLocalWishlist(p.id)
                  newSaved = true
                }
              } else {
                // guest: toggle in localStorage
                if (isInLocalWishlist(p.id)) {
                  await removeFromLocalWishlist(p.id)
                  newSaved = false
                } else {
                  await addToLocalWishlist(p.id)
                  newSaved = true
                }
              }
              // Update local state and trigger animation variant
              setSaved(newSaved)
              setAnimVariant(newSaved ? 'add' : 'remove')
            } catch (err) {
              console.error('Wishlist toggle failed', err)
            }
          }}
          className={
            `w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md transition-transform duration-200 ` +
            `hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-300`
          }
        >
          {/* visually-hidden live region for screen readers to announce status changes */}
          <span className="sr-only" aria-live="polite">{saved ? 'Added to wishlist' : 'Removed from wishlist'}</span>
          <svg
            onAnimationEnd={() => setAnimVariant('')}
            className={`w-5 h-5 transform transition-all duration-200 ${saved ? 'text-rose-500 scale-110' : 'text-gray-400 scale-100'} ${animVariant === 'add' ? 'animate-heart-pop' : ''} ${animVariant === 'remove' ? 'animate-heart-pop-reverse' : ''}`}
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke={saved ? 'currentColor' : 'currentColor'}
            strokeWidth="1.5"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 21s-7-4.35-9-7.5C1.2 9.7 4 5 8 5c2.1 0 3 1.5 4 2.5C13 6.5 13.9 5 16 5c4 0 6.8 4.7 5 8.5C19 16.65 12 21 12 21z" />
          </svg>
        </button>
      </div>
      <Link to={`/product/${p.id}`}>
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-50 relative">
          <img
            src={p.images?.[0]?.url || p.images?.[0]}
            alt={p.name}
            className="w-full h-full object-cover transition duration-300 hover:scale-110"
          />
          
          {/* Category badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {/* Popularity Badge */}
            {(p.addCount || p.purchaseCount) && <PopularityBadge addCount={p.addCount} purchaseCount={p.purchaseCount} />}
            
            {p.gender && (
              <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-purple-600 flex items-center gap-1">
                <span>{GENDER_ICONS[p.gender]}</span>
                {p.gender}
              </span>
            )}
            {p.productType && (
              <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-blue-600 flex items-center gap-1">
                <span>{CATEGORY_ICONS[p.productType]}</span>
                {p.productType}
              </span>
            )}
          </div>

          {/* Virtual Try-On Badge */}
          {p.virtualTryOnEnabled && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                📸 Try On
              </span>
            </div>
          )}
        </div>
        
        <div className="pt-3">
          <h3 className="font-semibold line-clamp-1 text-lg">{p.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{p.shortDesc}</p>
          
          {/* Ring sizes display */}
          {p.productType === 'rings' && p.availableSizes?.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                Sizes: {p.availableSizes.slice(0, 3).join(', ')}
                {p.availableSizes.length > 3 && ` +${p.availableSizes.length - 3} more`}
              </span>
            </div>
          )}
          
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-xl">{formatINR(p.price)}</span>
            <span className="text-xs bg-smoke px-2 py-1 rounded">{p.category}</span>
          </div>
          
          {/* Stock urgency display */}
          <div className="mt-2">
            {p.stock <= 5 && p.stock > 0 && (
              <span className="text-sm text-red-600 font-medium">
                Only {p.stock} left in stock!
              </span>
            )}
            {p.stock === 0 && (
              <span className="text-sm text-gray-500 font-medium">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Action buttons */}
      <div className="mt-3 space-y-2">
        {p.stock === 0 ? (
          <button 
            disabled 
            className="bg-gray-300 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium w-full cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : p.virtualTryOnEnabled ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startVirtualTryOn}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              📸 Try On
            </button>
            <button
              onClick={addToCart}
              className="btn-gold text-sm"
            >
              Add to Cart
            </button>
          </div>
        ) : (
          <button
            onClick={addToCart}
            className="btn-gold w-full"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}
