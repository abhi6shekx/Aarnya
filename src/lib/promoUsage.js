import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'

// Check if user has used a specific promo code
export const hasUserUsedPromo = async (userId, promoCode) => {
  try {
    const userPromoRef = doc(db, 'userPromoUsage', userId)
    const userPromoDoc = await getDoc(userPromoRef)
    
    if (!userPromoDoc.exists()) {
      return false
    }
    
    const data = userPromoDoc.data()
    return data.usedCodes?.includes(promoCode) || false
  } catch (error) {
    console.error('Error checking promo usage:', error)
    return false
  }
}

// Mark promo code as used by user
export const markPromoAsUsed = async (userId, promoCode, orderData = {}) => {
  try {
    const userPromoRef = doc(db, 'userPromoUsage', userId)
    const userPromoDoc = await getDoc(userPromoRef)
    
    if (!userPromoDoc.exists()) {
      // Create new document for user
      await setDoc(userPromoRef, {
        userId: userId,
        usedCodes: [promoCode],
        usageHistory: [{
          code: promoCode,
          usedAt: serverTimestamp(),
          orderId: orderData.orderId || null,
          discount: orderData.discount || 0,
          shippingDiscount: orderData.shippingDiscount || 0
        }],
        createdAt: serverTimestamp()
      })
    } else {
      // Update existing document
      await updateDoc(userPromoRef, {
        usedCodes: arrayUnion(promoCode),
        usageHistory: arrayUnion({
          code: promoCode,
          usedAt: serverTimestamp(),
          orderId: orderData.orderId || null,
          discount: orderData.discount || 0,
          shippingDiscount: orderData.shippingDiscount || 0
        }),
        updatedAt: serverTimestamp()
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error marking promo as used:', error)
    return { success: false, error: error.message }
  }
}

// Get user's promo usage history
export const getUserPromoHistory = async (userId) => {
  try {
    const userPromoRef = doc(db, 'userPromoUsage', userId)
    const userPromoDoc = await getDoc(userPromoRef)
    
    if (!userPromoDoc.exists()) {
      return { usedCodes: [], usageHistory: [] }
    }
    
    return userPromoDoc.data()
  } catch (error) {
    console.error('Error getting promo history:', error)
    return { usedCodes: [], usageHistory: [] }
  }
}

// Check if user's first order (for FREEDELIVERY promo)
export const isUserFirstOrder = async (userId) => {
  try {
    // Check if user has any completed orders
    const ordersRef = collection(db, 'orders')
    const q = query(
      ordersRef, 
      where('userId', '==', userId),
      where('status', '==', 'completed')
    )
    
    const orderSnapshot = await getDocs(q)
    return orderSnapshot.empty // true if no completed orders
  } catch (error) {
    console.error('Error checking first order:', error)
    return false
  }
}

// Get available promo codes for user (excludes already used ones)
export const getAvailablePromosForUser = async (userId, allPromoCodes) => {
  try {
    const userPromoData = await getUserPromoHistory(userId)
    const usedCodes = userPromoData.usedCodes || []
    
    // Filter out already used codes
    return allPromoCodes.filter(promo => 
      promo.active && 
      !usedCodes.includes(promo.code) &&
      new Date() >= promo.validFrom &&
      new Date() <= promo.validUntil
    )
  } catch (error) {
    console.error('Error getting available promos:', error)
    return allPromoCodes
  }
}