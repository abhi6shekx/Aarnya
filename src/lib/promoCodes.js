// Delivery charges configuration
const deliveryCharges = {
  standard: 80,
  express: 150,
};

// Promo Codes Configuration
export const PROMO_CODES = [
  {
    code: "FREEDELIVERY",
    type: "shipping",
    name: "Free Delivery on First Order",
    description: "Get FREE standard shipping on your first order",
    discount: {
      type: "shipping_free",
      value: deliveryCharges.standard,
      appliesTo: "standard"
    },
    conditions: {
      firstOrderOnly: true,
      shippingType: "standard",
      minOrderValue: 0
    },
    visibility: {
      showInBanner: true,
      showInCheckout: true,
      bannerText: "🎉 FREEDELIVERY for new users"
    },
    active: true,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31')
  },
  {
    code: "EXPRESS50",
    type: "shipping",
    name: "50% Off Express Delivery",
    description: "Get 50% discount on express delivery",
    discount: {
      type: "shipping_percentage",
      value: 50,
      appliesTo: "express"
    },
    conditions: {
      firstOrderOnly: false,
      shippingType: "express",
      minOrderValue: 499
    },
    visibility: {
      showInBanner: true,
      showInCheckout: true,
      bannerText: "EXPRESS50: 50% OFF express delivery above ₹499"
    },
    active: true,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31')
  },
  {
    code: "ABHI100",
    type: "order",
    name: "₹100 Off Order",
    description: "Get ₹100 off on your order",
    discount: {
      type: "fixed_amount",
      value: 100,
      appliesTo: "subtotal"
    },
    conditions: {
      firstOrderOnly: false,
      minOrderValue: 799,
      maxUses: 100
    },
    visibility: {
      showInBanner: false, // Hidden code
      showInCheckout: true,
      bannerText: ""
    },
    active: true,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31')
  }
];

// Enhanced Promo Code Application Logic with User Tracking
export const applyPromoCode = async ({ code, cartTotal, isFirstOrder, shippingType, userId }) => {
  code = code?.toUpperCase();

  // Import usage tracking functions
  const { hasUserUsedPromo } = await import('./promoUsage');
  
  // Check if user has already used this promo code
  if (userId) {
    const hasUsed = await hasUserUsedPromo(userId, code);
    if (hasUsed) {
      return { error: `You have already used the promo code "${code}".` };
    }
  }

  let discount = 0;       // Discount on product total
  let shippingDiscount = 0;

  switch (code) {
    case "FREEDELIVERY":
      if (!isFirstOrder) {
        return { error: "FREEDELIVERY is only for first-time users." };
      }
      if (shippingType !== "standard") {
        return { error: "FREEDELIVERY is only valid for standard delivery." };
      }
      shippingDiscount = deliveryCharges.standard;
      break;

    case "EXPRESS50":
      if (shippingType !== "express") {
        return { error: "EXPRESS50 is only valid for express delivery." };
      }
      if (cartTotal < 499) {
        return { error: "Minimum cart total ₹499 required for EXPRESS50." };
      }
      shippingDiscount = deliveryCharges.express / 2; // 50% off
      break;

    case "ABHI100":
      if (cartTotal < 799) {
        return { error: "Minimum cart total ₹799 required to use this code." };
      }
      discount = 100;
      break;

    default:
      return { error: "Invalid promo code." };
  }

  const promo = PROMO_CODES.find(p => p.code === code);

  return {
    success: true,
    promo,
    discount,
    shippingDiscount,
    message: `🎉 Promo code "${code}" applied successfully!`,
    canBeUsed: true // Flag to indicate this code can be marked as used
  };
};

// Get visible promo codes for banner (excludes hidden codes like ABHI100 and used codes)
export const getVisiblePromoCodes = async (userId = null) => {
  let availableCodes = PROMO_CODES.filter(promo => 
    promo.active && 
    promo.visibility.showInBanner &&
    new Date() >= promo.validFrom &&
    new Date() <= promo.validUntil
  );

  // If userId provided, filter out already used codes
  if (userId) {
    const { getAvailablePromosForUser } = await import('./promoUsage');
    availableCodes = await getAvailablePromosForUser(userId, availableCodes);
  }

  return availableCodes;
};

// Get checkout promo codes (includes all active codes)
export const getCheckoutPromoCodes = () => {
  return PROMO_CODES.filter(promo => 
    promo.active && 
    promo.visibility.showInCheckout &&
    new Date() >= promo.validFrom &&
    new Date() <= promo.validUntil
  );
};

// Get delivery charges
export const getDeliveryCharges = () => deliveryCharges;