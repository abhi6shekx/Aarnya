import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'

export default function Cart(){
  const [cart, setCart] = useState([])
  const navigate = useNavigate()

  // Load cart from localStorage when page loads
  useEffect(()=>{
    const c = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(c)
  },[])

  // Calculate total price
  const total = cart.reduce((a,b) => a + (b.price * b.qty), 0)

  // Remove item
  const remove = (id) => {
    const updated = cart.filter(p => p.id !== id)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
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
          <button onClick={() => remove(p.id)} className="text-sm text-red-500">Remove</button>
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
