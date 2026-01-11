import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
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

  // Reviews
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [canReview, setCanReview] = useState(false)
  const [userHasReviewed, setUserHasReviewed] = useState(false)

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
      const q = query(
        collection(db, 'reviews'),
        where('productId', '==', id),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setReviews(data)
      if (user) {
        setUserHasReviewed(data.some(r => r.userId === user.uid))
      }
    }
    loadReviews()
  }, [id, user])

  useEffect(() => {
    if (!user || !id) return
    const verify = async () => {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        where('status', '==', 'delivered')
      )
      const snap = await getDocs(q)
      let ok = false
      snap.forEach(d => {
        const o = d.data()
        if (o.products?.some(x => x.productId === id)) ok = true
      })
      setCanReview(ok)
    }
    verify()
  }, [user, id])

  const handleAddToCart = async () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ ...p, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    await incrementProductAddCount(p.id)
    navigate('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-rose-500 rounded-full" />
      </div>
    )
  }

  if (error || !p) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {error || 'Product not found'}
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* MAIN LAYOUT */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* IMAGE */}
          <div className="w-full md:w-1/2">
            <img
              src={p.images?.[0]?.url || p.imageUrl || '/logo.svg'}
              alt={p.name}
              className="w-full aspect-square object-cover rounded-xl"
              onClick={() => setShowImageModal(true)}
            />

            <button
              onClick={() => setShowImageModal(true)}
              className="mt-4 md:hidden w-full border rounded-full py-2 text-sm"
            >
              View Images
            </button>
          </div>

          {/* DETAILS */}
          <div className="w-full md:w-1/2">
            <h1 className="text-2xl md:text-3xl font-semibold mb-3">{p.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="text-yellow-500">
                {'★'.repeat(Math.round(p.averageRating || 5))}
              </div>
              <span className="text-sm text-gray-500">
                ({p.reviewCount || 0} reviews)
              </span>
            </div>

            <p className="text-3xl font-bold mb-4">{formatINR(p.price)}</p>

            <button
              onClick={handleAddToCart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full font-semibold mb-6"
            >
              Add to Cart
            </button>

            <div className="text-gray-600 text-sm leading-relaxed mb-6">
              {p.description || p.desc}
            </div>

            {/* WhatsApp */}
            {p.customizable && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=Hello Aarnya, I want customization for ${p.name}`}
                target="_blank"
                className="block w-full bg-green-500 text-white text-center py-3 rounded-lg"
              >
                Customize on WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* REVIEWS */}
        <div className="mt-12 bg-rose-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>

          {reviews.length === 0 && (
            <p className="text-gray-500">No reviews yet</p>
          )}

          {reviews.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-lg mb-3">
              <div className="flex justify-between">
                <span className="font-medium">{r.userName}</span>
                <span className="text-yellow-500">{'★'.repeat(r.rating)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* IMAGE MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <img
            src={p.images?.[0]?.url || p.imageUrl || '/logo.svg'}
            className="max-w-full max-h-full object-contain"
            onClick={() => setShowImageModal(false)}
          />
        </div>
      )}
    </div>
  )
}
