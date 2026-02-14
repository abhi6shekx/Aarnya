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

  // Update quantity
  const updateQty = (id, delta) => {
    const updated = cart.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, (p.qty || 1) + delta)
        return { ...p, qty: newQty }
      }
      return p
    })
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  // Clear entire cart
  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCart([])
      localStorage.removeItem('cart')
    }
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="h1">Your Cart</h1>
        {cart.length > 0 && (
          <button 
            onClick={clearCart} 
            className="text-sm text-red-500 hover:text-red-700 hover:underline"
          >
            🗑️ Clear Cart
          </button>
        )}
      </div>

      {cart.length ? cart.map(p => (
        <div key={p.id} className="card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src={p.images?.[0]?.url || p.images?.[0] || p.imageUrl || 'https://via.placeholder.com/160?text=No+Image'}
              className="w-20 h-20 rounded-xl object-cover"
              alt={p.name}
            />
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-rose-600">{formatINR(p.price)}</p>
              <p className="text-sm text-gray-500">Subtotal: {formatINR(p.price * (p.qty || 1))}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
              <button 
                onClick={() => updateQty(p.id, -1)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-50 text-lg font-medium"
                disabled={p.qty <= 1}
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{p.qty || 1}</span>
              <button 
                onClick={() => updateQty(p.id, 1)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-50 text-lg font-medium"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-3">
              {savedIds.includes(p.id) ? (
                <span className="text-sm text-green-600">Saved ✓</span>
              ) : (
                <button onClick={() => saveToWishlist(p.id)} className="text-sm text-rose-700 hover:underline">Save</button>
              )}

              <button onClick={() => moveToWishlist(p.id)} className="text-sm text-rose-600 hover:underline">Move to wishlist</button>

              <button onClick={() => remove(p.id)} className="text-sm text-red-500 hover:underline">Remove</button>
            </div>
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
