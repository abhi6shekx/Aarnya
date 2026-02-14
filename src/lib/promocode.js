import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Delivery charges are now dynamic from Shiprocket API
// These are fallback values only if API fails
const deliveryCharges = {
  standard: 60,  // Fallback if carrier quote isn't available
  express: 120,  // Fallback if carrier quote isn't available
};

export const applyPromoCode = async ({ code, cartTotal, shippingType, userId }) => {
  code = code?.toUpperCase();
  
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    const usedPromos = userData.userPromoUsage || {};
    const isFirstOrder = userData.orderCount === 0;

    // Check if already used
    if (usedPromos[code]) {
      return { error: "You have already used this promo code." };
    }

    let discount = 0;
    let shippingDiscount = 0;

    switch (code) {
      case "FREEDEL":
        if (!isFirstOrder) return { error: "FREEDEL is only valid for your first order." };
        if (shippingType !== "standard") return { error: "FREEDEL is only valid with standard delivery." };
        shippingDiscount = deliveryCharges.standard;
        break;

      case "EXPRESS50":
        if (shippingType !== "express") return { error: "EXPRESS50 is only valid with express delivery." };
        if (cartTotal < 499) return { error: "Minimum cart total ₹499 required for EXPRESS50." };
        shippingDiscount = deliveryCharges.express / 2; // 50% off
        break;

      case "ABHI100":
        if (cartTotal < 799) return { error: "Minimum cart total ₹799 required for ABHI100." };
        discount = 100;
        break;

      default:
        return { error: "Invalid promo code." };
    }

    return {
      success: true,
      code,
      discount,
      shippingDiscount,
      message: `${code} applied successfully!`,
    };

  } catch (error) {
    console.error('Error applying promo code:', error);
    return { error: "Error applying promo code. Please try again." };
  }
};

// Get delivery charges
export const getDeliveryCharges = () => deliveryCharges;

// Check if user can use a specific promo
export const canUsePromo = async (userId, code) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    const usedPromos = userData.userPromoUsage || {};
    const isFirstOrder = userData.orderCount === 0;

    if (usedPromos[code]) return false;

    // Additional checks for specific codes
    if (code === "FREEDEL" && !isFirstOrder) return false;

    return true;
  } catch (error) {
    console.error('Error checking promo availability:', error);
    return false;
  }
};

// Get available promo codes for user (VISIBLE ONLY - excludes ABHI100)
export const getAvailablePromosForUser = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    const usedPromos = userData.userPromoUsage || {};
    const isFirstOrder = userData.orderCount === 0;

    const availablePromos = [];

    // Check FREEDEL - Visible to new users only
    if (!usedPromos.FREEDEL && isFirstOrder) {
      availablePromos.push({
        code: "FREEDEL",
        description: "Free standard delivery on your first order",
        type: "shipping",
        visible: true
      });
    }

    // Check EXPRESS50 - Visible to all users
    if (!usedPromos.EXPRESS50) {
      availablePromos.push({
        code: "EXPRESS50",
        description: "50% off express delivery (min ₹499)",
        type: "shipping",
        visible: true
      });
    }

    // ABHI100 is NEVER returned here as it's hidden

    return availablePromos;
  } catch (error) {
    console.error('Error getting available promos:', error);
    return [];
  }
};