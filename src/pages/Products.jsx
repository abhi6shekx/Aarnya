import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import ProductCard from '../components/ProductCard'
import { GENDER_CATEGORIES, PRODUCT_TYPES, GENDER_ICONS, CATEGORY_ICONS } from '../lib/categories'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  
  const selectedGender = searchParams.get('gender') || ''
  const selectedProductType = searchParams.get('type') || ''

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

  const filteredProducts = products.filter(product => {
    const genderMatch = !selectedGender || product.gender === selectedGender
    const typeMatch = !selectedProductType || product.productType === selectedProductType
    const searchMatch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDesc?.toLowerCase().includes(searchQuery.toLowerCase())
    return genderMatch && typeMatch && searchMatch
  })

  if (loading) {
    return (
      <div className="container-base px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-rose-600 font-display text-xl">Loading handcrafted jewelry...</p>
      </div>
    )
  }

  return (
    <div className="container-base px-4 sm:px-6 py-10 space-y-10">
      
      {/* Header Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">Artisanal Catalog</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-charcoal">
          Explore Our Collection
        </h1>
        <p className="text-sm text-gray-500 font-light">
          Find handcrafted earrings, rings, and unique accessories designed to shine.
        </p>
      </div>

      {/* Luxury Filter Panel */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-blush-200 shadow-soft space-y-6">
        
        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder="Search by name, category, or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-luxury pr-12 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-blush-100">
          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Filter by Gender
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilters('', selectedProductType)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  !selectedGender 
                    ? 'bg-rose-600 text-white shadow-soft' 
                    : 'bg-blush-50/80 text-charcoal border border-rose-100 hover:bg-blush-100'
                }`}
              >
                All
              </button>
              {GENDER_CATEGORIES.map(gender => (
                <button
                  key={gender.value}
                  onClick={() => updateFilters(gender.value, selectedProductType)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedGender === gender.value 
                      ? 'bg-rose-600 text-white shadow-soft' 
                      : 'bg-blush-50/80 text-charcoal border border-rose-100 hover:bg-blush-100'
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
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilters(selectedGender, '')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  !selectedProductType 
                    ? 'bg-rose-600 text-white shadow-soft' 
                    : 'bg-blush-50/80 text-charcoal border border-rose-100 hover:bg-blush-100'
                }`}
              >
                All Categories
              </button>
              {PRODUCT_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => updateFilters(selectedGender, type.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedProductType === type.value 
                      ? 'bg-rose-600 text-white shadow-soft' 
                      : 'bg-blush-50/80 text-charcoal border border-rose-100 hover:bg-blush-100'
                  }`}
                >
                  <span>{CATEGORY_ICONS[type.value]}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-xs text-gray-500 font-medium pt-2 flex items-center justify-between">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          {(selectedGender || selectedProductType || searchQuery) && (
            <button 
              onClick={() => { updateFilters('', ''); setSearchQuery(''); }}
              className="text-rose-600 hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="bg-white/80 rounded-3xl p-16 text-center border border-blush-100 shadow-soft max-w-lg mx-auto space-y-4">
          <span className="text-4xl">🔍</span>
          <h3 className="font-display text-2xl font-bold text-charcoal">No Designs Found</h3>
          <p className="text-sm text-gray-500 font-light">
            We couldn't find any pieces matching your current filters or search term.
          </p>
          <button
            onClick={() => { updateFilters('', ''); setSearchQuery(''); }}
            className="btn-primary px-6 py-3 text-xs font-bold"
          >
            Clear Filters & Search
          </button>
        </div>
      )}
    </div>
  )
}

