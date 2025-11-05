import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuthContext()
  
  // Review states
  const [reviews, setReviews] = useState([])
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
      // Add to cart logic
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      cart.push({ ...p, qty: 1 })
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

  return (
    <div className="container-base py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl overflow-hidden bg-smoke">
          <img 
            src={p.images?.[0]?.url || p.images?.[0] || p.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
            alt={p.name} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'
            }}
          />
        </div>
        <div>
          <h1 className="h1 mb-2">{p.name}</h1>
          <p className="text-muted mb-4">{p.desc || p.description}</p>
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