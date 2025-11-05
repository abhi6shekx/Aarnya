/**
 * SuperAdmin Initialization Utility
 * 
 * This script helps set up the initial superadmin user.
 * Run this ONCE after deploying your application to make yourself a superadmin.
 * 
 * SECURITY: Delete this file after running it in production!
 */

import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

// 🔥 IMPORTANT: Replace this with YOUR email address
const SUPERADMIN_EMAIL = 'your-email@example.com'

/**
 * Initialize superadmin by email
 * This function should be called from your admin panel or run manually
 */
export async function initializeSuperAdmin(userEmail = SUPERADMIN_EMAIL) {
  try {
    console.log('🚀 Initializing SuperAdmin for:', userEmail)
    
    // Note: This function requires you to know the user's UID
    // In a real scenario, you would:
    // 1. Log in as the user first
    // 2. Get their UID from auth.currentUser.uid
    // 3. Then call this function
    
    console.log('ℹ️  To complete superadmin setup:')
    console.log('1. Log in with your account first')
    console.log('2. Open browser console')
    console.log('3. Run: window.setupSuperAdmin()')
    
    return { 
      success: false, 
      message: 'Manual setup required - see console instructions' 
    }
  } catch (error) {
    console.error('❌ Error initializing superadmin:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Setup superadmin for currently logged in user
 * This function will be exposed globally for manual setup
 */
export async function setupCurrentUserAsSuperAdmin(uid) {
  try {
    if (!uid) {
      throw new Error('User ID is required')
    }

    console.log('🔧 Setting up superadmin for UID:', uid)

    // Check if user document exists
    const userRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      throw new Error('User document not found. Please ensure the user is registered.')
    }

    // Update user role to superadmin
    await setDoc(userRef, {
      role: 'superadmin',
      promotedAt: new Date(),
      promotedBy: 'system',
      isSuperAdmin: true
    }, { merge: true })

    console.log('✅ SuperAdmin setup complete!')
    console.log('🔄 Please refresh the page to see admin privileges')
    
    return { success: true, message: 'SuperAdmin role assigned successfully' }
  } catch (error) {
    console.error('❌ Error setting up superadmin:', error)
    return { success: false, error: error.message }
  }
}

// Expose function globally for manual setup
if (typeof window !== 'undefined') {
  window.setupSuperAdmin = () => {
    // This will be called manually from browser console
    import('../lib/firebase').then(({ auth }) => {
      if (auth.currentUser) {
        setupCurrentUserAsSuperAdmin(auth.currentUser.uid)
          .then(result => {
            if (result.success) {
              alert('✅ SuperAdmin setup complete! Please refresh the page.')
            } else {
              alert('❌ Error: ' + result.error)
            }
          })
      } else {
        alert('❌ Please log in first, then run this command again.')
      }
    })
  }
  
  console.log('🔧 SuperAdmin setup utility loaded. Run window.setupSuperAdmin() after logging in.')
}