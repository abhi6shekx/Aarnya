// Delivery estimation helper
// Provides a small abstraction that tries to call a carrier API (if configured)
// and falls back to a local estimator when none is available.

const WAREHOUSE_PIN = import.meta.env.VITE_WAREHOUSE_PIN || '201206'
const SHIPROCKET_TOKEN = import.meta.env.VITE_SHIPROCKET_TOKEN || ''

export async function getDeliveryEstimate(pincode, products = [], speed = 'standard') {
  // Calculate package characteristics from products
  const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0) * (p.qty || 1), 0)
  const maxLength = Math.max(0, ...products.map(p => p.length || 0))
  const maxBreadth = Math.max(0, ...products.map(p => p.breadth || 0))
  const totalHeight = products.reduce((sum, p) => sum + (p.height || 0) * (p.qty || 1), 0)

  // Prefer calling a secure backend function to get Shiprocket rates
  const RATE_FN = import.meta.env.VITE_SHIPROCKET_RATE_ENDPOINT || import.meta.env.VITE_SHIPROCKET_FN_URL || ''
  if (RATE_FN) {
    try {
      const payload = {
        delivery_pincode: pincode,
        weight: Math.max(0.1, totalWeight),
        length: Math.max(1, maxLength),
        breadth: Math.max(1, maxBreadth),
        height: Math.max(1, totalHeight)
      }

      const res = await fetch(RATE_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        // Shiprocket cloud function mirrors Shiprocket response shape
        const courier = data.data?.[0] || data.data?.available_courier_companies?.[0] || null
        if (courier) {
          const fee = courier.rate?.amount || courier.rate || courier.courier_charge || courier.delivery_charges || 0
          return {
            success: true,
            fee: Math.round(fee),
            mode: courier.name || courier.service || speed,
            eta: courier.eta || courier.etd || `${speed === 'express' ? '2-3' : '5-7'} days`,
            raw: data
          }
        }
      } else {
        console.warn('Rate function returned non-ok:', res.status)
      }
    } catch (err) {
      console.error('Rate function call failed, falling back to local estimator', err)
    }
  }

  // Local fallback estimator
  const distanceKm = estimateDistanceFromPin(WAREHOUSE_PIN, pincode)
  const fee = estimateDeliveryCharge(totalWeight, distanceKm, speed)
  return {
    success: true,
    fee,
    mode: speed === 'express' ? 'Express' : 'Standard',
    eta: speed === 'express' ? '2-3 days' : '5-7 days',
    raw: null
  }
}

// Very small heuristic: map pincodes to pseudo-distances. This is approximate.
function estimateDistanceFromPin(srcPin, dstPin) {
  try {
    // If PINs are numeric strings of length 6, use digit distance heuristic
    const s = String(srcPin).replace(/\D/g, '')
    const d = String(dstPin).replace(/\D/g, '')
    if (s.length >= 3 && d.length >= 3) {
      const sPrefix = parseInt(s.slice(0, 3), 10)
      const dPrefix = parseInt(d.slice(0, 3), 10)
      return Math.abs(sPrefix - dPrefix) * 10 // rough km estimate
    }
  } catch (e) {
    // ignore
  }
  return 50 // default 50km
}

// Simple local pricing algorithm
function estimateDeliveryCharge(weightKg, distanceKm, speed) {
  const base = speed === 'express' ? 120 : 60
  const perKm = 0.2 // rupees per km
  const perKg = 40 // rupees per kg
  const w = Math.max(0.1, weightKg)
  const fee = Math.round(base + distanceKm * perKm + w * perKg)
  return fee
}

export default {
  getDeliveryEstimate
}
