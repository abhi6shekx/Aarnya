import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { getLocalWishlist } from '../lib/wishlist'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const ids = getLocalWishlist()
        if (user && user.uid) {
          // prefer local cache (we maintain local wishlist in localStorage on toggle)
          // For stronger consistency, you could fetch from Firestore here.
        }

        if (!ids || ids.length === 0) {
          setProducts([])
          setLoading(false)
          return
        }

        const snaps = await Promise.all(ids.map(id => getDoc(doc(db, 'products', id))))
        const found = snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }))
        if (mounted) setProducts(found)
      } catch (e) {
        console.error('Failed to load wishlist products', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [user])

  if (loading) return <div className="p-8">Loading wishlist...</div>
  if (!products.length) return <div className="p-8 text-center">Your wishlist is empty. <br/> <Link to="/products" className="text-rose-500 underline">Continue shopping</Link></div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Your Wishlist</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  )
}
