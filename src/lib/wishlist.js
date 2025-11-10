import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from './firebase'

const LOCAL_KEY = 'wishlist'

export function getLocalWishlist() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
  } catch (e) {
    return []
  }
}

export function setLocalWishlist(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
    // notify other parts of the app in this window/tab
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wishlist:changed', { detail: { list } }))
      }
    } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }
}

export function isInLocalWishlist(productId) {
  const list = getLocalWishlist()
  return list.includes(productId)
}

export async function addToLocalWishlist(productId) {
  const list = getLocalWishlist()
  if (!list.includes(productId)) {
    list.unshift(productId)
    // keep max 100
    if (list.length > 100) list.splice(100)
    setLocalWishlist(list)
  }
}

export async function removeFromLocalWishlist(productId) {
  let list = getLocalWishlist()
  list = list.filter(id => id !== productId)
  setLocalWishlist(list)
}

// Firestore-backed wishlist: simple document under users/{uid} with field `items: string[]`
export async function getUserWishlist(uid) {
  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return []
    const data = snap.data()
    return data.wishlist || []
  } catch (e) {
    console.error('getUserWishlist failed', e)
    return []
  }
}

export async function addToUserWishlist(uid, productId) {
  try {
    const ref = doc(db, 'users', uid)
    await updateDoc(ref, { wishlist: arrayUnion(productId) })
    try {
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('wishlist:changed'))
    } catch (e) { /* ignore */ }
  } catch (e) {
    // If doc doesn't exist, create it
    try {
      await setDoc(doc(db, 'users', uid), { wishlist: [productId] }, { merge: true })
      try {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('wishlist:changed'))
      } catch (err2) { /* ignore */ }
    } catch (err) {
      console.error('addToUserWishlist failed', err)
    }
  }
}

export async function removeFromUserWishlist(uid, productId) {
  try {
    const ref = doc(db, 'users', uid)
    await updateDoc(ref, { wishlist: arrayRemove(productId) })
    try {
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('wishlist:changed'))
    } catch (e) { /* ignore */ }
  } catch (e) {
    console.error('removeFromUserWishlist failed', e)
  }
}
