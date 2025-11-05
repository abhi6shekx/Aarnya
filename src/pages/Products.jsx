import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import ProductCard from '../components/ProductCard'
import { GENDER_CATEGORIES, PRODUCT_TYPES, GENDER_ICONS, CATEGORY_ICONS } from '../lib/categories'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get filters from URL params
  const selectedGender = searchParams.get('gender') || ''
  const selectedProductType = searchParams.get('type') || ''

  // Update URL when filters change
  const updateFilters = (gender, type) => {
    const params = new URLSearchParams()
    if (gender) params.set('gender', gender)
    if (type) params.set('type', type)
    setSearchParams(params)
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'))
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error("Error fetching products:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Filter products based on selected criteria
  const filteredProducts = products.filter(product => {
    const genderMatch = !selectedGender || product.gender === selectedGender
    const typeMatch = !selectedProductType || product.productType === selectedProductType
    return genderMatch && typeMatch
  })

  if (loading) {
    return <p className="text-center text-rose-500 font-medium py-20 animate-pulse">Loading beautiful creations...</p>
  }

  if (!products.length) {
    return (
      <div className="text-center py-20 bg-watercolor bg-cover bg-center rounded-2xl shadow-soft">
        <h2 className="font-display text-3xl text-rose-600 mb-4">No Products Yet</h2>
        <p className="text-muted mb-6">Your jewelry collection is waiting to shine ✨</p>
        <p className="text-sm text-rose-400">Go to <span className="font-semibold">Admin</span> to start adding products</p>
      </div>
    )
  }

  return (
    <div className="py-8">
      {/* Filter Section */}
      <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
        <h2 className="font-display text-2xl text-charcoal mb-6">Filter Products</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gender Filter */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3">Shop by Gender</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilters('', selectedProductType)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedGender 
                    ? 'bg-blush-500 text-white shadow-lg' 
                    : 'bg-white/50 text-charcoal hover:bg-blush-100'
                }`}
              >
                All
              </button>
              {GENDER_CATEGORIES.map(gender => (
                <button
                  key={gender.value}
                  onClick={() => updateFilters(gender.value, selectedProductType)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedGender === gender.value 
                      ? 'bg-blush-500 text-white shadow-lg' 
                      : 'bg-white/50 text-charcoal hover:bg-blush-100'
                  }`}
                >
                  <span>{GENDER_ICONS[gender.value]}</span>
                  {gender.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Type Filter */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3">Shop by Category</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilters(selectedGender, '')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedProductType 
                    ? 'bg-blush-500 text-white shadow-lg' 
                    : 'bg-white/50 text-charcoal hover:bg-blush-100'
                }`}
              >
                All Categories
              </button>
              {PRODUCT_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => updateFilters(selectedGender, type.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedProductType === type.value 
                      ? 'bg-blush-500 text-white shadow-lg' 
                      : 'bg-white/50 text-charcoal hover:bg-blush-100'
                  }`}
                >
                  <span>{CATEGORY_ICONS[type.value]}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-muted">
          Showing {filteredProducts.length} of {products.length} products
          {selectedGender && ` • ${GENDER_CATEGORIES.find(g => g.value === selectedGender)?.label}`}
          {selectedProductType && ` • ${PRODUCT_TYPES.find(t => t.value === selectedProductType)?.label}`}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredProducts.map(p => <ProductCard key={p.id} p={p} />)}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <h3 className="font-display text-2xl text-charcoal mb-4">No Products Found</h3>
          <p className="text-muted mb-6">Try adjusting your filters to see more products</p>
          <button
            onClick={() => updateFilters('', '')}
            className="btn-primary"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}
