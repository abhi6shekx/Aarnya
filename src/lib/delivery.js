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
  // console.log('Shiprocket Response:', data) // Debug log
        
        // Parse Shiprocket response correctly
        const couriers = data.data?.available_courier_companies || []
        if (couriers.length > 0) {
          // Find the cheapest courier for standard, or fastest for express
          let selectedCourier
          if (speed === 'express') {
            // For express, prefer couriers with "Express" or "Air" in name
            selectedCourier = couriers.find(c => 
              c.courier_name?.toLowerCase().includes('express') || 
              c.courier_name?.toLowerCase().includes('air')
            ) || couriers[0]
          } else {
            // For standard, get the cheapest
            selectedCourier = couriers.reduce((cheapest, current) => {
              const currentRate = current.freight_charge || current.rate || 0
              const cheapestRate = cheapest.freight_charge || cheapest.rate || 0
              return currentRate < cheapestRate ? current : cheapest
            })
          }
          
          const fee = selectedCourier.freight_charge || selectedCourier.rate || 0
          return {
            success: true,
            fee: Math.round(fee),
            mode: selectedCourier.courier_name || selectedCourier.name || speed,
            eta: selectedCourier.etd || `${speed === 'express' ? '2-3' : '5-7'} days`,
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

// Simple local pricing algorithm (fallback when carrier quote isn't available)
function estimateDeliveryCharge(weightKg, distanceKm, speed) {
  const base = speed === 'express' ? 120 : 60
  const perKg = speed === 'express' ? 80 : 40
  const distanceSurcharge = Math.round(Math.max(0, distanceKm - 50) * (speed === 'express' ? 0.25 : 0.15))

  const extraWeight = Math.max(0, (Number(weightKg) || 0) - 0.5)
  const weightCharge = Math.round(extraWeight * perKg)

  return Math.max(0, Math.round(base + weightCharge + distanceSurcharge))
}

export default {
  getDeliveryEstimate
}
