import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'
import { useAuth } from '../context/AuthContext'
import {
  getLocalWishlist,
  addToLocalWishlist,
  addToUserWishlist,
  getUserWishlist,
  isInLocalWishlist
} from '../lib/wishlist'

export default function Cart(){
  const [cart, setCart] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()

  // Load cart from localStorage when page loads
  useEffect(()=>{
    const c = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(c)
  },[])

  // Load wishlist ids (local or user) to mark saved items
  useEffect(() => {
    const load = async () => {
      if (user?.uid) {
        try {
          const list = await getUserWishlist(user.uid)
          setSavedIds(list || [])
        } catch (err) {
          console.error('Failed to load user wishlist', err)
          setSavedIds(getLocalWishlist())
        }
      } else {
        setSavedIds(getLocalWishlist())
      }
    }
    load()
  }, [user])

  // Calculate total price
  const total = cart.reduce((a,b) => a + (b.price * b.qty), 0)

  // Remove item
  const remove = (id) => {
    const updated = cart.filter(p => p.id !== id)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  // Save (or move) item to wishlist
  const saveToWishlist = async (id) => {
    try {
      if (user?.uid) {
        await addToUserWishlist(user.uid, id)
        setSavedIds(prev => prev.includes(id) ? prev : [id, ...prev])
      } else {
        await addToLocalWishlist(id)
        setSavedIds(prev => prev.includes(id) ? prev : [id, ...prev])
      }
    } catch (err) {
      console.error('Failed to save to wishlist', err)
      alert('Failed to save to wishlist. Please try again.')
    }
  }

  const moveToWishlist = async (id) => {
    await saveToWishlist(id)
    remove(id)
  }

  return (
    <div className="space-y-4">
      <h1 className="h1 mb-4">Your Cart</h1>

      {cart.length ? cart.map(p => (
        <div key={p.id} className="card p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={p.images?.[0]?.url || p.images?.[0] || p.imageUrl || 'https://via.placeholder.com/160?text=No+Image'}
              className="w-20 h-20 rounded-xl object-cover"
              alt={p.name}
            />
            <div>
              <p className="font-medium">{p.name}</p>
              <p>{formatINR(p.price)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {savedIds.includes(p.id) ? (
              <span className="text-sm text-green-600">Saved ✓</span>
            ) : (
              <button onClick={() => saveToWishlist(p.id)} className="text-sm text-rose-700">Save to wishlist</button>
            )}

            <button onClick={() => moveToWishlist(p.id)} className="text-sm text-rose-600">Move to wishlist</button>

            <button onClick={() => remove(p.id)} className="text-sm text-red-500">Remove</button>
          </div>
        </div>
      )) : <p>Your cart is empty.</p>}

      {cart.length > 0 && (
        <div className="text-right space-y-3">
          <p className="text-lg font-semibold">Total: {formatINR(total)}</p>
          <button onClick={() => navigate('/checkout')} className="btn-gold">Checkout</button>
        </div>
      )}

      {cart.length === 0 && (
        <Link to="/products" className="btn-gold">Start Shopping</Link>
      )}
    </div>
  )
}
