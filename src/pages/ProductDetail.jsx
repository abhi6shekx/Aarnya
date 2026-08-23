import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatINR } from '../lib/currency'
import { useAuthContext } from '../context/AuthContext'

async function incrementProductAddCount(productId) {
  try {
    await updateDoc(doc(db, 'products', productId), {
      addCount: increment(1)
    })
  } catch (e) {
    console.error(e)
  }
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [reviews, setReviews] = useState([])

  const whatsappNumber = '917895111299'

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'products', id))
        if (!snap.exists()) throw new Error('Product not found')
        setP({ id: snap.id, ...snap.data() })
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!id) return
    const loadReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('productId', '==', id),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error("Error fetching reviews:", err)
      }
    }
    loadReviews()
  }, [id])

  const handleAddToCart = async () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ ...p, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    await incrementProductAddCount(p.id)
    navigate('/cart')
  }

  if (loading) {
    return (
      <div className="container-base px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-rose-600 font-display text-xl">Loading creation details...</p>
      </div>
    )
  }

  if (error || !p) {
    return (
      <div className="container-base px-4 py-24 text-center max-w-md mx-auto space-y-4">
        <h2 className="font-display text-3xl font-bold text-charcoal">Design Not Found</h2>
        <p className="text-sm text-gray-500">{error || 'The requested product could not be located.'}</p>
        <button onClick={() => navigate('/products')} className="btn-primary px-6 py-2.5 text-xs font-bold">
          Return to Shop
        </button>
      </div>
    )
  }

  return (
    <div className="container-base px-4 sm:px-6 py-8 space-y-6">
      {/* Back Button */}
      <div>
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-blush-200 text-charcoal hover:bg-blush-100 hover:text-rose-600 text-xs font-bold transition-all shadow-sm group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Products</span>
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-blush-100 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">

          {/* Product Image Gallery */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div 
              onClick={() => setShowImageModal(true)}
              className="w-full max-w-md bg-ivory rounded-2xl overflow-hidden border border-blush-100 shadow-card cursor-pointer group relative flex items-center justify-center min-h-[350px] max-h-[520px]"
            >
              <img
                src={p.images?.[0]?.url || p.images?.[0] || p.imageUrl || '/logo.svg'}
                alt={p.name}
                className="w-full h-full max-h-[520px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-3 right-3 glass-badge px-3 py-1 rounded-full text-xs font-bold text-charcoal opacity-90">
                🔍 Click to Expand
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">
                {p.productType || p.category || 'Handcrafted Jewelry'}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-charcoal mt-1">
                {p.name}
              </h1>

              <div className="flex items-center gap-3 mt-2">
                <div className="text-amber-400 text-sm">
                  {'★'.repeat(Math.round(p.averageRating || 5))}
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  ({reviews.length || p.reviewCount || 0} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-charcoal">
                {formatINR(p.price)}
              </span>
              {p.originalPrice && p.originalPrice > p.price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatINR(p.originalPrice)}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 font-light leading-relaxed">
              {p.description || p.desc || p.shortDesc || 'Handcrafted with extreme care and premium quality materials.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="btn-primary w-full py-4 text-sm font-bold tracking-wide shadow-glow"
              >
                Add to Cart
              </button>

              {p.customizable && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hello Aarnya, I want customization for ${p.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold py-3.5 rounded-full text-sm text-center block transition-all"
                >
                  💬 Customize on WhatsApp
                </a>
              )}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blush-100 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-base">🇮🇳</span>
                <span>India-Wide Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span>100% Handcrafted</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-blush-100 shadow-soft space-y-6">
        <h3 className="font-display text-2xl font-bold text-charcoal">Customer Reviews</h3>
        
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500 font-light italic">No reviews yet for this creation.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map(r => (
              <div key={r.id} className="bg-ivory p-4 rounded-2xl border border-blush-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-charcoal">{r.userName || 'Verified Buyer'}</span>
                  <span className="text-amber-400 text-xs">{'★'.repeat(r.rating || 5)}</span>
                </div>
                <p className="text-xs text-gray-600 font-light">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={p.images?.[0]?.url || p.images?.[0] || p.imageUrl || '/logo.svg'}
            alt={p.name}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}

