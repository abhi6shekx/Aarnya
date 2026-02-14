import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatINR } from '../lib/currency'
import { useAuthContext } from '../context/AuthContext'

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

export default function ProductDetail(){
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuthContext()
  
  // Review states
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  // canReview — true when the user has a delivered order containing this product
  const [canReview, setCanReview] = useState(false)
  const [userHasReviewed, setUserHasReviewed] = useState(false)

  // WhatsApp configuration
  const whatsappNumber = '917895111299'
  const getCustomizationMessage = (productName) => {
    return encodeURIComponent(`Hello Aarnya, I'm interested in customizing "${productName}". Can you help me with personalization options?`)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No product ID provided")
        setLoading(false)
        return
      }

      try {
        console.log("Fetching product with ID:", id)
        const snap = await getDoc(doc(db, 'products', id))
        
        if (snap.exists()) {
          const productData = { id: snap.id, ...snap.data() }
          console.log("Product data:", productData)
          setP(productData)
        } else {
          console.log("No product found with ID:", id)
          setError("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  // Fetch related / recommended products
  useEffect(() => {
    if (!p) return

    const fetchRelated = async () => {
      try {
        // If admin provided explicit related product IDs, fetch them first
        if (Array.isArray(p.relatedProducts) && p.relatedProducts.length) {
          const items = []
          for (const prodId of p.relatedProducts.slice(0, 6)) {
            try {
              const s = await getDoc(doc(db, 'products', prodId))
              if (s.exists()) items.push({ id: s.id, ...s.data() })
            } catch (innerErr) {
              console.warn('Failed to load related product', prodId, innerErr)
            }
          }
          setRelated(items)
          return
        }

        // Fallback: tag/category/productType-based suggestions
        const suggestions = new Map()

        // 1) Match productType
        if (p.productType) {
          const q = query(collection(db, 'products'), where('productType', '==', p.productType), limit(6))
          const snap = await getDocs(q)
          snap.docs.forEach(d => {
            if (d.id === p.id) return
            suggestions.set(d.id, { id: d.id, ...d.data() })
          })
        }

        // 2) Match category (if still not enough)
        if (suggestions.size < 4 && p.category) {
          const q2 = query(collection(db, 'products'), where('category', '==', p.category), limit(6))
          const snap2 = await getDocs(q2)
          snap2.docs.forEach(d => {
            if (d.id === p.id) return
            if (!suggestions.has(d.id)) suggestions.set(d.id, { id: d.id, ...d.data() })
          })
        }

        // 3) Lightweight keyword match against shortDesc (split words)
        if (suggestions.size < 4 && p.shortDesc) {
          const kws = p.shortDesc.split(/\s+/).slice(0, 5).map(w => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()).filter(Boolean)
          if (kws.length) {
            // naive approach: fetch some candidates and filter client-side
            const q3 = query(collection(db, 'products'), limit(20))
            const snap3 = await getDocs(q3)
            snap3.docs.forEach(d => {
              if (d.id === p.id) return
              if (suggestions.size >= 6) return
              const data = d.data()
              const hay = ((data.shortDesc || '') + ' ' + (data.name || '')).toLowerCase()
              if (kws.some(k => hay.includes(k))) {
                if (!suggestions.has(d.id)) suggestions.set(d.id, { id: d.id, ...data })
              }
            })
          }
        }

        setRelated(Array.from(suggestions.values()).slice(0, 6))
      } catch (err) {
        console.error('Error loading related products:', err)
      }
    }

    fetchRelated()
  }, [p])

  // Close modal on Escape
  useEffect(() => {
    if (!showImageModal) return
    const onKey = (e) => {
      if (e.key === 'Escape') setShowImageModal(false)
      if (e.key === 'ArrowLeft') setCurrentImageIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setCurrentImageIndex(i => {
        const max = (p?.images?.length || 1) - 1
        return Math.min(max, i + 1)
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showImageModal, p])

  // Auto-expand Additional details on initial load (applies to mobile and web)
  // If you prefer mobile-only auto-expand, change this to check window.innerWidth
  useEffect(() => {
    setDetailsOpen(true)
  }, [])

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return
      
      try {
        const q = query(
          collection(db, "reviews"),
          where("productId", "==", id),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const reviewsData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviews(reviewsData);
        // mark if current user already reviewed
        if (user) {
          const existing = reviewsData.find(r => r.userId === user.uid)
          setUserHasReviewed(!!existing)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, [id, user]);

  // Verify delivered orders for this user that include the product (verified-buyer)
  useEffect(() => {
    const verifyPurchase = async () => {
      if (!user || !id) {
        setCanReview(false)
        return
      }

      try {
        const ordersQ = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          where('status', '==', 'delivered')
        )
        const snap = await getDocs(ordersQ)
        let verified = false
        snap.docs.forEach((d) => {
          const order = d.data()
          // orders may store product list under `products` array with productId
          if (order.products && Array.isArray(order.products)) {
            if (order.products.some(p => p.productId === id)) verified = true
          }
          // fallback for older shape
          if (order.items && Array.isArray(order.items)) {
            if (order.items.some(item => item.id === id || item.productId === id)) verified = true
          }
        })

        setCanReview(verified)
      } catch (err) {
        console.error('Error verifying purchase:', err)
        setCanReview(false)
      }
    }

    verifyPurchase()
  }, [user, id])

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!user) {
      alert("Please sign in to leave a review.");
      return;
    }

    if (!canReview) {
      alert('Only verified buyers can leave reviews.');
      return;
    }

    if (userHasReviewed) {
      alert('You have already reviewed this product.');
      return;
    }

    if (!rating) {
      alert("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      alert("Please write a comment.");
      return;
    }

    try {
      // double-check on submit: ensure user hasn't already reviewed (race safety)
      const existingQ = query(
        collection(db, 'reviews'),
        where('productId', '==', id),
        where('userId', '==', user.uid)
      )
      const existingSnap = await getDocs(existingQ)
      if (!existingSnap.empty) {
        alert('You have already reviewed this product.');
        return;
      }

      // Add review to Firestore
      await addDoc(collection(db, "reviews"), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Anonymous User",
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });

      // Recalculate average rating from all reviews
      const reviewsSnap = await getDocs(query(
        collection(db, "reviews"), 
        where("productId", "==", id)
      ));
      const allReviews = reviewsSnap.docs.map(d => d.data());
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      // Update product's average rating + count
      await updateDoc(doc(db, "products", id), {
        averageRating: avgRating,
        reviewCount: allReviews.length
      });

      // Reset form and refresh
      setRating('');
      setComment('');
      alert("Review submitted successfully!");
      
      // Refresh the page to show new review
      window.location.reload();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleAddToCart = async () => {
    try {
      // Add to cart logic - check if product already exists
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      
      // Check if product already exists in cart
      const existingIndex = cart.findIndex(item => item.id === p.id)
      
      if (existingIndex !== -1) {
        // Product exists, increase quantity
        cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1
      } else {
        // New product, add to cart
        cart.push({
          ...p,
          // Ensure shipping measurements are present in cart for rate calculation
          weight: p?.weight ?? 0,
          length: p?.length ?? 0,
          breadth: p?.breadth ?? 0,
          height: p?.height ?? 0,
          qty: 1
        })
      }
      
      localStorage.setItem('cart', JSON.stringify(cart))
      
      // Update popularity count in Firestore
      await incrementProductAddCount(p.id)
      
      // Navigate to cart
      navigate('/cart')
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert("Failed to add to cart. Please try again.")
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="container-base py-20">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          <span className="ml-4 text-gray-600">Loading product...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container-base py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">{error}</h1>
          <button 
            onClick={() => navigate('/shop')}
            className="btn-primary"
          >
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  // Product not found
  if (!p) {
    return (
      <div className="container-base py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Product not found</h1>
          <button 
            onClick={() => navigate('/shop')}
            className="btn-primary"
          >
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  // Normalize product description fields into a single variable so both
  // desktop and modal views render the same content. This runs after the
  // early-return guards above (loading/error/not-found), so `p` is available.
  const productDescription = p.fullDesc || p.fullDescription || p.description || p.desc || p.shortDesc || ''

  return (
    <div className="container-base py-8">
      <div className="flex flex-col md:flex-row justify-center gap-8 px-4 md:px-12">
        {/* Main column: image + controls */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-stretch">
          {/* Main product image with hover overlay (group) */}
          <div className="relative group w-full md:w-auto">
            <div className="flex justify-center w-full">
              <div
                className="rounded-2xl overflow-hidden bg-smoke cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => setShowImageModal(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowImageModal(true) }}
              >
                <img
                  src={p.images?.[0]?.url || p.images?.[0] || p.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'}
                  alt={p.name}
                  className="w-[85%] sm:w-[70%] md:w-[50%] lg:w-[45%] xl:w-[40%] rounded-2xl object-contain shadow-md transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image' }}
                />
              </div>
            </div>

            <div
              className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center cursor-pointer"
              onClick={() => setShowImageModal(true)}
              aria-hidden="true"
            >
              <span className="text-white text-sm font-medium bg-pink-500/80 px-3 py-1 rounded-full">
                See measurements 📏
              </span>
            </div>
          </div>
          {/* Fallback persistent controls below the image (visible even if overlay missing) */}
          <div className="mt-3 flex items-center gap-3">
          <button onClick={() => setShowImageModal(true)} className="px-3 py-2 bg-white border rounded-full text-sm text-rose-700 shadow-sm hover:shadow-md transition">See measurements</button>
          {p.images && p.images.length > 1 && (
            <button onClick={() => { setCurrentImageIndex(0); setShowImageModal(true) }} className="px-3 py-2 bg-white border rounded-full text-sm text-charcoal shadow-sm hover:shadow-md transition">View all images</button>
          )}
          </div>
        </div>
        <div className="w-full md:w-1/2 mt-6 md:mt-0">
          <h1 className="h1 mb-2">{p.name}</h1>
          {/* Product Description (render only if available) */}
          {productDescription && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{productDescription}</p>
            </div>
          )}
          {/* Additional Details Section: maps Firestore fields (weight, size, material, care) */}
          <div className="mt-6 border-t border-pink-100 pt-4">
            <button
              className="text-pink-600 font-medium underline hover:text-pink-700 transition"
              onClick={() => setDetailsOpen(!detailsOpen)}
              aria-expanded={detailsOpen}
            >
              {detailsOpen ? 'Hide product details' : 'See product details'}
            </button>

            {detailsOpen && (
              <div className="mt-4 space-y-2 text-gray-700 bg-pink-50 p-4 rounded-xl shadow-sm">
                {/* Available sizes for rings or explicit `size` field */}
                {p.productType === 'rings' && p.availableSizes?.length > 0 && (
                  <p><strong>Available sizes:</strong> {p.availableSizes.join(', ')}</p>
                )}

                <p><strong>Weight:</strong> {p.weight || 'Not specified'}</p>

                {/* Prefer explicit `size` field; otherwise try to derive from length/breadth/height */}
                <p>
                  <strong>Size:</strong> {p.size || ((p.length || p.breadth || p.height) ? `${p.length || '—'} × ${p.breadth || '—'} × ${p.height || '—'} cm` : 'Not specified')}
                </p>

                <p><strong>Material:</strong> {p.material || 'Handmade Resin'}</p>
                <p><strong>Care Instructions:</strong> {p.care || 'Avoid water & perfume contact'}</p>
              </div>
            )}
          </div>
          
            {/* Related products / cross-sell: "Complete the look" */}
            {related && related.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Complete the look</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {related.map(r => (
                    <Link key={r.id} to={`/product/${r.id}`} className="w-40 flex-shrink-0 bg-white border rounded-lg p-3 hover:shadow-md transition">
                      <div className="w-full h-24 mb-2 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        <img src={(r.images && r.images[0]?.url) || r.imageUrl || 'https://via.placeholder.com/150'} alt={r.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-sm font-medium text-charcoal line-clamp-2">{r.name}</div>
                      <div className="text-sm text-rose-600 font-semibold">{formatINR(r.price)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          {/* Price (moved closer to title/description for visibility) */}
          <p className="font-bold text-lg mb-4">{formatINR(p.price)}</p>
          
          {/* Product rating summary */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-500">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i}>
                  {i < Math.round(p.averageRating || 0) ? "★" : "☆"}
                </span>
              ))}
            </div>
            <span className="text-gray-700 font-medium">
              {p.averageRating ? p.averageRating.toFixed(1) : "No ratings"}
            </span>
            <span className="text-gray-500 text-sm">
              ({p.reviewCount || 0} reviews)
            </span>
          </div>
          
          {/* Stock urgency display */}
          <div className="mb-4">
            {p.stock <= 5 && p.stock > 0 && (
              <span className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
                ⚠️ Only {p.stock} left in stock!
              </span>
            )}
            {p.stock === 0 && (
              <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                😞 Out of Stock
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {p.stock === 0 ? (
              <button 
                disabled 
                className="bg-gray-300 text-gray-500 rounded-full px-6 py-3 w-full cursor-not-allowed font-medium"
              >
                Out of Stock
              </button>
            ) : (
              <button 
                onClick={handleAddToCart} 
                className="btn-primary rounded-full px-6 py-3 w-full"
              >
                Add to Cart
              </button>
            )}
            
            {/* WhatsApp Customization Section - Only show if customizable */}
            {p.customizable && (
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💎</span>
                  <h3 className="font-semibold text-charcoal">Want a personalized version?</h3>
                </div>
                <p className="text-sm text-muted mb-3">
                  Like this design but want customization? Chat with us on WhatsApp for personalized options!
                </p>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${getCustomizationMessage(p.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                    alt="WhatsApp"
                    className="w-4 h-4"
                  />
                  Customize on WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full image modal - shows image with description and details so description doesn't disappear */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowImageModal(false); setCurrentImageIndex(0) }} />
          <div className="relative z-10 max-w-5xl w-full mx-4 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 bg-black relative flex flex-col">
              {/* Prev button */}
              <button
                onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                disabled={currentImageIndex === 0}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full z-20 disabled:opacity-40"
              >
                ◀
              </button>

              <img
                src={p.images?.[currentImageIndex]?.url || p.images?.[0]?.url || p.imageUrl || 'https://via.placeholder.com/800x800?text=No+Image'}
                alt={`${p.name} - image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain bg-black"
              />

              {/* Next button */}
              <button
                onClick={() => setCurrentImageIndex(i => Math.min((p?.images?.length || 1) - 1, i + 1))}
                disabled={currentImageIndex >= ((p?.images?.length || 1) - 1)}
                aria-label="Next image"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full z-20 disabled:opacity-40"
              >
                ▶
              </button>

              {/* Thumbnails */}
              {p.images && p.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-30 px-2">
                  {p.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-12 h-12 rounded-md overflow-hidden border ${idx === currentImageIndex ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/40'}`}
                      aria-label={`Show image ${idx + 1}`}
                    >
                      <img src={img?.url || img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-6 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{p.name}</h2>
                  {/* Keep the product description visible inside the modal too (use normalized value) */}
                  {productDescription && (
                    <p className="text-gray-700 mt-1 leading-relaxed mb-4 whitespace-pre-line">{productDescription}</p>
                  )}
                </div>
                <button onClick={() => { setShowImageModal(false); setCurrentImageIndex(0) }} aria-label="Close" className="ml-4 text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <div className="mt-2">
                {/* Modal: collapsible Additional details (accessible) */}
                <button
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  aria-expanded={detailsOpen}
                  className="flex items-center justify-between w-full bg-white border border-rose-100 rounded-lg px-4 py-3 text-left"
                >
                  <span className="font-medium">Additional details</span>
                  <span className="text-sm text-gray-500">{detailsOpen ? 'Hide' : 'Show'}</span>
                </button>

                {detailsOpen && (
                  <div className="mt-3 text-sm text-gray-700">
                    {p.productType === 'rings' && p.availableSizes?.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-500">Available sizes</div>
                        <div className="mt-1">{p.availableSizes.join(', ')}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500">Weight (kg)</div>
                        <div className="font-medium mt-1">{p.weight || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Dimensions (L×B×H cm)</div>
                        <div className="font-medium mt-1">{(p.length || '—')} × {(p.breadth || '—')} × {(p.height || '—')}</div>
                      </div>
                    </div>

                    {p.material && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500">Material</div>
                        <div className="font-medium mt-1">{p.material}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <p className="font-bold text-lg">{formatINR(p.price)}</p>
                <div className="mt-3 flex gap-3">
                  <button onClick={handleAddToCart} className="btn-primary rounded-full px-4 py-2">Add to Cart</button>
                  <button onClick={() => { setShowImageModal(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="px-4 py-2 border rounded-lg">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Reviews Section */}
      <div className="mt-12 bg-rose-50 rounded-xl p-6 shadow-sm border border-rose-100">
        <h3 className="text-2xl font-display mb-4 text-rose-700">Customer Reviews</h3>

        {/* Average Rating Summary */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-yellow-500 text-xl">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>
                {i < Math.round(p.averageRating || 0) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <p className="text-gray-700 font-medium">
            {p.averageRating ? p.averageRating.toFixed(1) : "No ratings yet"}
          </p>
          <p className="text-gray-500 text-sm">
            ({p.reviewCount || 0} reviews)
          </p>
        </div>

        {/* Show Existing Reviews */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-3 mb-6">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-3 border border-rose-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-rose-800">{r.userName}</span>
                  <span className="text-yellow-500">{"★".repeat(r.rating)}</span>
                </div>
                <p className="text-gray-700 mt-1">{r.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Review Form / Verified Buyer flow */}
        {user ? (
          canReview ? (
            userHasReviewed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-600 text-sm">✅ Thank you — you've already reviewed this product.</div>
              </div>
            ) : (
              <div className="mt-4">
                <h4 className="font-medium text-rose-700 mb-2">Write a Review</h4>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="border border-rose-300 rounded-md p-2 mr-2"
                >
                  <option value="">Rate</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} Star
                    </option>
                  ))}
                </select>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full border border-rose-300 rounded-lg p-2 mt-2"
                />

                <button
                  onClick={handleSubmitReview}
                  disabled={!canReview || userHasReviewed}
                  className="mt-3 bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  Submit Review
                </button>
              </div>
            )
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <div className="text-amber-700 text-sm">🛍️ Only verified buyers can leave reviews. Purchase this product to share your experience.</div>
            </div>
          )
        ) : (
          <p className="text-gray-500 mt-4">Login to leave a review.</p>
        )}
      </div>
    </div>
  )
}