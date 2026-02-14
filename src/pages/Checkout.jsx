import { useMemo } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Checkout(){
  const { user } = useAuth()
  const nav = useNavigate()
  
  const cart = useMemo(()=> JSON.parse(localStorage.getItem('cart')||'[]'), [])
  const subtotal = cart.reduce((a,b)=>a + b.price*(b.qty||1), 0)
  const totalItems = cart.reduce((a,b)=>a + (b.qty||1), 0)

  // Redirect to cart if empty
  if (!cart.length) {
    return <Navigate to="/cart" replace />
  }

  // Generate WhatsApp message with product details
  const generateWhatsAppMessage = () => {
    let message = `🛍️ *Order Inquiry from Aarnya*\n\n`
    message += `Hi! I'm interested in purchasing the following items:\n\n`
    
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`
      message += `   Qty: ${item.qty || 1} piece(s)\n`
      message += `   Price: ₹${item.price} each\n`
      if (item.size) message += `   Size: ${item.size}\n`
      if (item.color) message += `   Color: ${item.color}\n`
      message += `\n`
    })
    
    message += `-------------------\n`
    message += `*Total Items:* ${totalItems}\n`
    message += `*Subtotal:* ₹${subtotal}\n\n`
    
    if (user?.email) {
      message += `*My Email:* ${user.email}\n`
    }
    
    message += `\nPlease let me know the availability and how to proceed with the order. Thank you! 🙏`
    
    return encodeURIComponent(message)
  }

  const handleContactSeller = () => {
    const phoneNumber = '917895111299'
    const message = generateWhatsAppMessage()
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="container-base py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-700 mb-3">Complete Your Order</h1>
          <p className="text-gray-600">
            To purchase these beautiful pieces, please contact our seller directly via WhatsApp. 
            We believe in personal service and will assist you with delivery, payment options, and any customizations you need.
          </p>
        </div>

        {/* Product Summary Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🛒 Your Cart Summary
          </h2>
          
          <div className="space-y-4">
            {cart.map((item, index) => (
              <div key={item.id || index} className="flex items-center gap-4 p-3 bg-blush-50 rounded-xl">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{item.name}</h3>
                  <div className="text-sm text-gray-600">
                    {item.size && <span>Size: {item.size} • </span>}
                    {item.color && <span>Color: {item.color} • </span>}
                    <span>Qty: {item.qty || 1}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-rose-600">₹{item.price * (item.qty || 1)}</p>
                  <p className="text-xs text-gray-500">₹{item.price} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-4 border-t border-blush-200">
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Total Items</span>
              <span>{totalItems} piece(s)</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-rose-700">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Final price including delivery will be confirmed by the seller
            </p>
          </div>
        </div>

        {/* Contact Seller Section */}
        <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Ready to Order?</h3>
            <p className="text-gray-600 mb-6">
              Click the button below to connect with our seller on WhatsApp. 
              Your cart details will be automatically shared for a quick and easy checkout experience.
            </p>
            
            <button
              onClick={handleContactSeller}
              className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 text-white rounded-full text-lg font-semibold hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact Seller on WhatsApp
            </button>

            <p className="text-sm text-gray-500 mt-4">
              🔒 Safe & Secure • Personal Assistance • Quick Response
            </p>
          </div>
        </div>

        {/* Back to Cart Link */}
        <div className="text-center mt-6">
          <button 
            onClick={() => nav('/cart')} 
            className="text-rose-600 hover:text-rose-700 underline"
          >
            ← Back to Cart
          </button>
        </div>
      </div>
    </div>
  )
}


