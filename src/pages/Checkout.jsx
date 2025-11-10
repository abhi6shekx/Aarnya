import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, updateDoc, increment } from 'firebase/firestore'
import { applyPromoCode, getDeliveryCharges, getAvailablePromosForUser } from '../lib/promocode'
import { getDeliveryEstimate } from '../lib/delivery'
import { markPromoAsUsed } from '../lib/promoUsage'

// Function to increment purchase count and decrease stock
async function incrementPurchaseCount(productId) {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      purchaseCount: increment(1),
      stock: increment(-1) // Reduce stock by 1 automatically
    });
  } catch (error) {
    console.error("Failed to update purchaseCount:", error);
  }
}

const estimateETA = (pincode, speed)=>{
  // super simple heuristic (improve later by region)
  const now = new Date()
  const addDays = (d)=> {
    const x = new Date(now); x.setDate(x.getDate()+d); return x.toDateString()
  }
  
  const deliveryCharges = getDeliveryCharges()
  
  if (speed==='express') return { 
    label: 'Express (2–3 days)', 
    eta: `${addDays(2)} – ${addDays(3)}`, 
    fee: deliveryCharges.express 
  }
  return { 
    label: 'Standard (5–7 days)', 
    eta: `${addDays(5)} – ${addDays(7)}`, 
    fee: deliveryCharges.standard 
  }
}

export default function Checkout(){
  const { user } = useAuth()
  const nav = useNavigate()
  
  // Redirect to profile/login if not authenticated
  if (!user) {
    return <Navigate to="/profile" replace />
  }
  const [addresses, setAddresses] = useState([])
  const [addrId, setAddrId] = useState('')
  const [speed, setSpeed] = useState('standard')
  const [loading, setLoading] = useState(true)
  
  // Promo code states
  const [promoInput, setPromoInput] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [discount, setDiscount] = useState(0)
  const [shippingDiscount, setShippingDiscount] = useState(0)
  const [appliedPromoCode, setAppliedPromoCode] = useState('')
  const [availablePromos, setAvailablePromos] = useState([])
  // Keep separate estimates per shipping speed so each radio shows the correct fee
  const [deliveryEstimateStandard, setDeliveryEstimateStandard] = useState(null)
  const [deliveryEstimateExpress, setDeliveryEstimateExpress] = useState(null)

  const cart = useMemo(()=> JSON.parse(localStorage.getItem('cart')||'[]'), [])
  const subtotal = cart.reduce((a,b)=>a + b.price*(b.qty||1), 0)

  useEffect(()=>{
    if (!cart.length) return nav('/cart')
    
    const loadAddresses = async () => {
      try {
        const q = query(collection(db, 'userAddresses'), where('userId', '==', user.uid))
        const snap = await getDocs(q)
        const list = snap.docs.map(d=>({id:d.id, ...d.data()}))
        setAddresses(list)
        const def = list.find(a=>a.isDefault) || list[0]
        setAddrId(def?.id || '')
        setLoading(false)
      } catch (error) {
        console.error('Error loading addresses:', error)
        setLoading(false)
      }
    }
    
    loadAddresses()
  }, [user])

  // Recompute delivery estimates (both standard and express) when address or cart changes
  useEffect(() => {
    const compute = async () => {
      try {
        if (!addrId) {
          setDeliveryEstimateStandard(null)
          setDeliveryEstimateExpress(null)
          return
        }
        const addr = addresses.find(a => a.id === addrId)
        if (!addr) {
          setDeliveryEstimateStandard(null)
          setDeliveryEstimateExpress(null)
          return
        }

        // Fetch both estimates in parallel so the UI can show independent fees for each option
        const [std, expr] = await Promise.all([
          getDeliveryEstimate(addr.pincode, cart, 'standard'),
          getDeliveryEstimate(addr.pincode, cart, 'express')
        ])

        setDeliveryEstimateStandard(std)
        setDeliveryEstimateExpress(expr)
      } catch (err) {
        console.error('Error getting delivery estimate:', err)
        setDeliveryEstimateStandard(null)
        setDeliveryEstimateExpress(null)
      }
    }

    compute()
  }, [addrId, addresses, cart])

  // Load available promo codes for user
  useEffect(() => {
    const loadAvailablePromos = async () => {
      if (user?.uid) {
        try {
          const promos = await getAvailablePromosForUser(user.uid)
          setAvailablePromos(promos)
        } catch (error) {
          console.error('Error loading available promos:', error)
        }
      }
    }
    
    loadAvailablePromos()
  }, [user?.uid])

  // Revalidate promo code when shipping type changes
  useEffect(() => {
    const revalidatePromo = async () => {
      if (appliedPromoCode) {
        try {
          const result = await applyPromoCode({
            code: appliedPromoCode,
            cartTotal: subtotal,
            shippingType: speed,
            userId: user.uid
          })

          if (result.error) {
            // Promo is no longer valid for new shipping type
            setPromoMessage(`Promo code no longer valid: ${result.error}`)
            removePromo()
          } else {
            // Update promo with new values
            // Recompute shipping discount for EXPRESS50 against the currently selected fee
            let computedShippingDiscount = result.shippingDiscount || 0
            if (result.code === 'EXPRESS50' && speed === 'express') {
              computedShippingDiscount = Math.round((fee || staticCharges.express) / 2)
            }
            setDiscount(result.discount)
            setShippingDiscount(computedShippingDiscount)
            setPromoMessage('')
          }
        } catch (error) {
          console.error('Error revalidating promo:', error)
          setPromoMessage('Error validating promo code')
          removePromo()
        }
      }
    }

    revalidatePromo()
  }, [speed, appliedPromoCode, subtotal, user.uid])

  if (loading) return <div className="container-base py-10"><p>Loading addresses...</p></div>
  if (!addresses.length) return (
    <div className="container-base py-10">
      <p className="text-muted text-center">
        No address found. Please{' '}
        <button onClick={() => nav('/profile')} className="text-blush-600 underline">
          add an address
        </button>{' '}
        first.
      </p>
    </div>
  )

  const selected = addresses.find(a=>a.id===addrId)
  const fallback = estimateETA(selected?.pincode, speed)
  // Use the estimate corresponding to the selected shipping speed
  const deliveryEstimate = speed === 'express' ? deliveryEstimateExpress : deliveryEstimateStandard
  const fee = deliveryEstimate?.fee ?? fallback.fee
  const label = deliveryEstimate?.mode ?? fallback.label
  const eta = deliveryEstimate?.eta ?? fallback.eta
  const staticCharges = getDeliveryCharges()
  
  // Calculate totals with promo
  const finalShippingCost = Math.max(0, fee - shippingDiscount)
  const finalSubtotal = Math.max(0, subtotal - discount)
  const total = finalSubtotal + finalShippingCost

  // Handle promo code application
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      setPromoMessage('Please enter a promo code')
      return
    }

    // Prevent applying EXPRESS50 until we have an express estimate available
    if (promoInput.toUpperCase() === 'EXPRESS50' && speed === 'express' && !deliveryEstimateExpress) {
      setPromoMessage('Please wait for the express delivery estimate to load before applying EXPRESS50')
      return
    }

    setPromoMessage('')

    try {
      const result = await applyPromoCode({
        code: promoInput,
        cartTotal: subtotal,
        shippingType: speed,
        userId: user.uid
      })

      if (result.error) {
        setPromoMessage(result.error)
        setDiscount(0)
        setShippingDiscount(0)
        setAppliedPromoCode('')
      } else {
        // If EXPRESS50, compute shipping discount from the current fee (dynamic) instead of static helper
        let computedShippingDiscount = result.shippingDiscount || 0
        if (result.code === 'EXPRESS50' && speed === 'express') {
          // fee is the currently selected shipping fee (dynamic if available)
          computedShippingDiscount = Math.round((fee || staticCharges.express) / 2)
        }

        setPromoMessage(result.message)
        setDiscount(result.discount)
        setShippingDiscount(computedShippingDiscount)
        setAppliedPromoCode(result.code)
        setPromoInput('')
        // Refresh available promos after successful application
        const promos = await getAvailablePromosForUser(user.uid)
        setAvailablePromos(promos)
      }
    } catch (error) {
      console.error('Error applying promo code:', error)
      setPromoMessage('Error applying promo code. Please try again.')
    }
  }

  // Handle quick promo application from visible buttons
  const handleQuickPromo = async (code) => {
    // Prevent quick-apply of EXPRESS50 until express estimate is available
    if (code === 'EXPRESS50' && speed === 'express' && !deliveryEstimateExpress) {
      setPromoMessage('Please wait for the express delivery estimate to load before applying EXPRESS50')
      return
    }

    try {
      const result = await applyPromoCode({
        code,
        cartTotal: subtotal,
        shippingType: speed,
        userId: user.uid
      })

      if (result.error) {
        setPromoMessage(result.error)
        setDiscount(0)
        setShippingDiscount(0)
        setAppliedPromoCode('')
      } else {
        let computedShippingDiscount = result.shippingDiscount || 0
        if (result.code === 'EXPRESS50' && speed === 'express') {
          computedShippingDiscount = Math.round((fee || staticCharges.express) / 2)
        }

        setPromoMessage(result.message)
        setDiscount(result.discount)
        setShippingDiscount(computedShippingDiscount)
        setAppliedPromoCode(result.code)
        // Refresh available promos after successful application
        const promos = await getAvailablePromosForUser(user.uid)
        setAvailablePromos(promos)
      }
    } catch (error) {
      console.error('Error applying promo code:', error)
      setPromoMessage('Error applying promo code. Please try again.')
    }
  }

  // Remove applied promo
  const removePromo = async () => {
    setDiscount(0)
    setShippingDiscount(0)
    setAppliedPromoCode('')
    setPromoMessage('')
    // Refresh available promos
    try {
      const promos = await getAvailablePromosForUser(user.uid)
      setAvailablePromos(promos)
    } catch (error) {
      console.error('Error refreshing promos:', error)
    }
  }

  const pay = ()=>{
    // Razorpay
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: total * 100,
      currency: 'INR',
      name: 'Aarnya',
      description: 'Order Payment',
      handler: async (resp)=>{
        try {
          // Create order in database
          const orderRef = await addDoc(collection(db,'orders'), {
            userId: user.uid,
            cart,
            subtotal: finalSubtotal,
            originalSubtotal: subtotal,
            promoCode: appliedPromoCode || null,
            promoDiscount: discount,
            shippingDiscount: shippingDiscount,
            delivery: { speed, fee: finalShippingCost, originalFee: fee, eta, selectedAddress: selected },
            payment: { id: resp.razorpay_payment_id, status: 'paid' },
            createdAt: serverTimestamp()
          })
          
          // Update user's order count
          const userRef = doc(db, 'users', user.uid)
          await updateDoc(userRef, {
            orderCount: increment(1)
          })

          // If a promo code was applied, mark it as used for this user now that order is successful
          if (appliedPromoCode) {
            try {
              await updateDoc(userRef, {
                [`userPromoUsage.${appliedPromoCode}`]: true
              })
              // also persist in userPromoUsage collection (history)
              try {
                await markPromoAsUsed(user.uid, appliedPromoCode, { discount, shippingDiscount, orderId: orderRef.id })
              } catch (err2) {
                console.error('Failed to write promo usage history:', err2)
              }
            } catch (err) {
              console.error('Failed to mark promo as used:', err)
            }
          }
          
          // Update purchase count and stock for each item
          for (let item of cart) {
            await incrementPurchaseCount(item.id);
          }
          
          localStorage.removeItem('cart')
          nav('/success')
        } catch (error) {
          console.error('Error processing order:', error)
          alert('Error processing order. Please try again.')
        }
      },
      prefill: {
        name: selected?.fullName || '',
        email: user.email || '',
        contact: selected?.phone || ''
      },
      theme: { color: '#e56a9d' }
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6 space-y-4">
        <h2 className="h2">Select Delivery Address</h2>
        {addresses.map(a=>(
          <label key={a.id} className={`block p-4 rounded-xl border cursor-pointer ${addrId===a.id?'border-rose-500 bg-blush-50':'border-blush-200'}`}>
            <input type="radio" name="addr" checked={addrId===a.id} onChange={()=>setAddrId(a.id)} className="mr-2" />
            <span className="font-medium">{a.name}</span> • {a.phone}
            <div className="text-sm">{a.line1}, {a.line2}</div>
            <div className="text-sm">{a.city}, {a.state} - {a.pincode}</div>
          </label>
        ))}
        {/* '+ Add new address' removed: customers must choose from saved addresses only */}
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="h2">Delivery & Payment</h2>

        <div className="space-y-2">
          <label className={`block p-3 rounded-xl border cursor-pointer ${speed==='standard'?'border-rose-500 bg-blush-50':'border-blush-200'}`}>
            <input type="radio" name="speed" checked={speed==='standard'} onChange={()=>{
              setSpeed('standard')
              // Clear promo message when switching shipping types
              setPromoMessage('')
            }} className="mr-2" />
            {/* Show dynamic estimate fee if available for standard, otherwise fallback to static site defaults */}
            Standard Delivery — ₹{deliveryEstimateStandard?.fee ?? staticCharges.standard} • ETA {deliveryEstimateStandard?.eta ?? estimateETA(selected?.pincode,'standard').eta}
          </label>
          <label className={`block p-3 rounded-xl border cursor-pointer ${speed==='express'?'border-rose-500 bg-blush-50':'border-blush-200'}`}>
            <input type="radio" name="speed" checked={speed==='express'} onChange={()=>{
              setSpeed('express')
              // Clear promo message when switching shipping types
              setPromoMessage('')
            }} className="mr-2" />
            Express Delivery — ₹{deliveryEstimateExpress?.fee ?? staticCharges.express} • ETA {deliveryEstimateExpress?.eta ?? estimateETA(selected?.pincode,'express').eta}
          </label>
        </div>

        {/* Enhanced Promo Code Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            🎫 Promo Codes
          </h3>
          
          {!appliedPromoCode ? (
            <div className="space-y-4">
              {/* Quick Apply Buttons for Available Promos */}
              {availablePromos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-green-700 font-medium">Available for you:</p>
                  <div className="flex flex-wrap gap-2">
                    {availablePromos.map((promo) => (
                            <button
                              key={promo.code}
                              onClick={() => handleQuickPromo(promo.code)}
                              disabled={promo.code === 'EXPRESS50' && (speed !== 'express' || !deliveryEstimateExpress)}
                              title={promo.code === 'EXPRESS50' && !deliveryEstimateExpress ? 'Waiting for express delivery estimate' : ''}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                promo.code === 'EXPRESS50' && (speed !== 'express' || !deliveryEstimateExpress)
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              Apply {promo.code}
                            </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Manual Entry for Hidden Codes */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Or enter a promo code manually:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              {promoMessage && (
                <p className={`text-sm ${
                  promoMessage.includes("success") || promoMessage.includes("applied") 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {promoMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-green-700 font-medium">✅ {appliedPromoCode}</span>
                <span className="text-sm text-green-600">Applied successfully!</span>
              </div>
              <button
                onClick={removePromo}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Remove promo code"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Promo debug panel removed (dev-only). */}

        <div className="p-4 rounded-xl bg-white border border-blush-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            
            {appliedPromoCode && discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedPromoCode})</span>
                <span>-₹{discount}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Delivery ({label})</span>
              <div className="text-right">
                {shippingDiscount > 0 ? (
                  <>
                    <span className="line-through text-gray-500 text-sm">₹{fee}</span>
                    <span className="ml-2 text-green-600">₹{finalShippingCost}</span>
                  </>
                ) : (
                  <span>₹{fee}</span>
                )}
              </div>
            </div>

            {/* Show a clear note when a dynamic estimate was used instead of the static site defaults */}
            {deliveryEstimate && ((speed === 'standard' && deliveryEstimate.fee !== staticCharges.standard) || (speed === 'express' && deliveryEstimate.fee !== staticCharges.express)) && (
              <div className="text-xs text-gray-500 mt-2">
                Note: courier estimate ₹{deliveryEstimate.fee} • ETA {deliveryEstimate.eta} (used for totals)
              </div>
            )}
            
            {appliedPromoCode && shippingDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Shipping Discount ({appliedPromoCode})</span>
                <span>-₹{shippingDiscount}</span>
              </div>
            )}
            
            <hr className="border-blush-200" />
            <div className="flex justify-between font-semibold text-rose-700 text-lg">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
            
            {(discount > 0 || shippingDiscount > 0) && (
              <div className="text-sm text-green-600 font-medium">
                🎉 You saved ₹{discount + shippingDiscount}!
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted mt-2">Estimated delivery: {eta}</div>
        </div>

        <button className="btn-primary rounded-full px-6 py-3 w-full" onClick={pay}>Pay & Place Order</button>
      </div>
    </div>
  )
}


