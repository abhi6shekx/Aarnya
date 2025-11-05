// Product Categories and Configuration

export const GENDER_CATEGORIES = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'unisex', label: 'Unisex' }
]

export const PRODUCT_TYPES = [
  { value: 'earrings', label: 'Earrings' },
  { value: 'rings', label: 'Rings' },
  { value: 'hair-clips', label: 'Hair Clips' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'bracelets', label: 'Bracelets' }
]

export const RING_SIZES = [
  '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', 
  '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'
]

// Virtual Try-On Compatible Products
export const VIRTUAL_TRY_ON_COMPATIBLE = [
  'earrings',
  'rings', 
  'hair-clips'
]

// Product availability by gender
export const GENDER_PRODUCT_MATRIX = {
  'women': [
    'earrings',
    'rings',
    'hair-clips',
    'necklaces',
    'bracelets'
  ],
  'men': [
    'earrings',
    'rings',
    'necklaces',
    'bracelets'
  ],
  'unisex': [
    'earrings',
    'rings',
    'necklaces',
    'bracelets'
  ]
}

// Category icons for UI
export const CATEGORY_ICONS = {
  'earrings': '💎',
  'rings': '💍',
  'hair-clips': '🎀',
  'necklaces': '📿',
  'bracelets': '✨'
}

// Gender icons for UI
export const GENDER_ICONS = {
  'women': '👩',
  'men': '👨',
  'unisex': '🌟'
}