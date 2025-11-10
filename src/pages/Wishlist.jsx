import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { getLocalWishlist, getUserWishlist, addToUserWishlist } from '../lib/wishlist'
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
        // Start with local ids (guest flow / cached)
        const localIds = getLocalWishlist() || []

        // If user is logged in, prefer server wishlist. Also merge any local items into the server wishlist.
        let ids = localIds
        if (user && user.uid) {
          const serverIds = await getUserWishlist(user.uid)
          // Merge serverIds and localIds (preserve order: server first, then new local items)
          const merged = Array.from(new Set([...(serverIds || []), ...(localIds || [])]))

          // If there are local ids not present on server, add them to server for persistence
          const toAdd = (localIds || []).filter(id => !(serverIds || []).includes(id))
          if (toAdd.length) {
            // fire-and-forget individual adds to avoid a large single update; helper will create user doc if missing
            try {
              await Promise.all(toAdd.map(id => addToUserWishlist(user.uid, id)))
            } catch (e) {
              console.warn('Failed to merge local wishlist into user wishlist', e)
            }
          }

          ids = merged
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
