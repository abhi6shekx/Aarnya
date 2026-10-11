import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ProductCard from '../components/ProductCard'
import PromoBanner from '../components/PromoBanner'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [heroSrc, setHeroSrc] = useState('/favicon.svg')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const whatsappNumber = '917895111299'
  const whatsappMessage = encodeURIComponent('Hi! I would like to explore your jewelry collection. Can you help me?')
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          limit(12)
        )
        const snapshot = await getDocs(q)
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setFeaturedProducts(products)
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  // Quick category circles (GIVA style)
  const quickCategories = [
    { title: 'All', icon: '✨', link: '/products', badge: 'Hot' },
    { title: 'Rings', icon: '💍', link: '/products?type=rings' },
    { title: 'Earrings', icon: '💎', link: '/products?type=earrings' },
    { title: 'Necklaces', icon: '📿', link: '/products?type=necklaces' },
    { title: 'Bracelets', icon: '🌟', link: '/products?type=bracelets' },
    { title: "Women", icon: '👩', link: '/products?gender=women' },
    { title: "Men", icon: '👨', link: '/products?gender=men' },
    { title: 'Bespoke', icon: '💬', link: whatsappLink, isExternal: true, badge: 'Custom' }
  ]

  // Filter products based on selected tab
  const displayedProducts = featuredProducts.filter(p => {
    if (activeTab === 'all') return true
    if (activeTab === 'women') return p.gender === 'women'
    if (activeTab === 'men') return p.gender === 'men'
    if (activeTab === 'rings') return p.productType === 'rings'
    if (activeTab === 'earrings') return p.productType === 'earrings'
    return true
  })

  return (
    <div className="space-y-12 pb-16 bg-[#FAF8F5]">
      {/* Top Announcement Bar */}
      <PromoBanner />

      {/* 1. Quick Category Circles (GIVA Style Top Bar) */}
      <section className="container-base px-4 sm:px-6 pt-2">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-blush-100 shadow-sm">
          <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">
            {quickCategories.map((cat, idx) => (
              cat.isExternal ? (
                <a
                  key={idx}
                  href={cat.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 shrink-0 group min-w-[64px]"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-50 to-teal-50 border-2 border-emerald-200 group-hover:border-emerald-500 group-hover:scale-105 transition-all flex items-center justify-center text-xl sm:text-2xl shadow-sm relative">
                    {cat.icon}
                    {cat.badge && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-charcoal group-hover:text-emerald-700 transition-colors">
                    {cat.title}
                  </span>
                </a>
              ) : (
                <Link
                  key={idx}
                  to={cat.link}
                  className="flex flex-col items-center gap-1.5 shrink-0 group min-w-[64px]"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-rose-50 to-blush-50 border-2 border-blush-200 group-hover:border-rose-400 group-hover:scale-105 transition-all flex items-center justify-center text-xl sm:text-2xl shadow-sm relative">
                    {cat.icon}
                    {cat.badge && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-charcoal group-hover:text-rose-600 transition-colors">
                    {cat.title}
                  </span>
                </Link>
              )
            ))}
          </div>
        </div>
      </section>

      {/* 2. Modern Minimalist Hero Section */}
      <section className="container-base px-4 sm:px-6">
        <div className="bg-gradient-to-br from-white via-rose-50/40 to-blush-100/60 rounded-3xl p-6 sm:p-10 lg:p-12 border border-blush-200/80 shadow-soft relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-100/80 text-rose-700 rounded-full text-xs font-bold tracking-wide uppercase shadow-xs">
                <span>✨</span>
                <span>Artisanal Resin • Everyday Minimalist Luxury</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-charcoal tracking-tight leading-[1.15]">
                Minimalist Elegance, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600">
                  Crafted To Shine.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed">
                Handcrafted jewelry made with real botanical petals, pure gold accents, and anti-tarnish finishes. Designed for effortless daily style.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/products"
                  className="btn-primary w-full sm:w-auto px-8 py-3.5 text-xs font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all"
                >
                  Shop Best Sellers →
                </Link>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold text-charcoal bg-white hover:bg-rose-50 border border-blush-200 rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-emerald-600 text-sm">💬</span>
                  Custom Order Concierge
                </a>
              </div>

              {/* Micro Trust Strip */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-blush-200/80 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                <div>
                  <p className="font-display text-xl font-bold text-rose-600">100%</p>
                  <p className="text-[11px] text-gray-500 font-medium">Handmade with Love</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-rose-600">Free</p>
                  <p className="text-[11px] text-gray-500 font-medium">Gift Box Ready</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-rose-600">Pan-India</p>
                  <p className="text-[11px] text-gray-500 font-medium">Fast Express Courier</p>
                </div>
              </div>
            </div>

            {/* Right Hero Showcase Product */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-white rounded-2xl p-4 border border-blush-100 shadow-luxury space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-ivory relative group flex items-center justify-center">
                  <img
                    src={featuredProducts?.[0]?.images?.[0]?.url || featuredProducts?.[0]?.images?.[0] || featuredProducts?.[0]?.imageUrl || heroSrc}
                    alt="Aarnya Highlight"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => { if (heroSrc !== '/logo.svg') setHeroSrc('/logo.svg') }}
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-rose-600 border border-rose-100 shadow-xs">
                    🔥 Featured Drop
                  </div>
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-900 border border-amber-200 shadow-xs flex items-center gap-1">
                    <span className="text-amber-500">★</span> 4.9
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-charcoal truncate">
                      {featuredProducts?.[0]?.name || 'Signature Handmade Collection'}
                    </h3>
                    <span className="font-bold text-sm text-charcoal">
                      {featuredProducts?.[0]?.price ? `₹${featuredProducts[0].price}` : 'Handcrafted'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 font-light">
                    {featuredProducts?.[0]?.shortDesc || 'Ultra-lightweight resin with authentic botanicals.'}
                  </p>
                  <Link
                    to={featuredProducts?.[0] ? `/product/${featuredProducts[0].id}` : '/products'}
                    className="w-full block text-center py-2.5 bg-charcoal hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    View Piece →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Shop by Budget / Occasion Badges */}
      <section className="container-base px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/products?type=rings"
            className="bg-white p-4 rounded-2xl border border-blush-100 shadow-xs hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <span className="text-2xl p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">💍</span>
            <div>
              <p className="text-xs font-bold text-charcoal group-hover:text-rose-600 transition-colors">Everyday Rings</p>
              <p className="text-[11px] text-gray-500">Floral & Bands</p>
            </div>
          </Link>

          <Link
            to="/products?type=earrings"
            className="bg-white p-4 rounded-2xl border border-blush-100 shadow-xs hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <span className="text-2xl p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">💎</span>
            <div>
              <p className="text-xs font-bold text-charcoal group-hover:text-rose-600 transition-colors">Statement Studs</p>
              <p className="text-[11px] text-gray-500">Lightweight Drop</p>
            </div>
          </Link>

          <Link
            to="/products?gender=women"
            className="bg-white p-4 rounded-2xl border border-blush-100 shadow-xs hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <span className="text-2xl p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">🎁</span>
            <div>
              <p className="text-xs font-bold text-charcoal group-hover:text-rose-600 transition-colors">Gift Sets</p>
              <p className="text-[11px] text-gray-500">Ready in Velvet Box</p>
            </div>
          </Link>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <span className="text-2xl p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">🌸</span>
            <div>
              <p className="text-xs font-bold text-charcoal group-hover:text-emerald-600 transition-colors">Wedding Preserves</p>
              <p className="text-[11px] text-emerald-700">Custom Flower Art</p>
            </div>
          </a>
        </div>
      </section>

      {/* 4. Filterable Products Grid */}
      <section className="container-base px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-blush-100 pb-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">Curated Catalog</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-charcoal mt-0.5">
              Featured Creations
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'women', label: 'Women' },
              { id: 'men', label: 'Men' },
              { id: 'rings', label: 'Rings' },
              { id: 'earrings', label: 'Earrings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-blush-200 hover:bg-rose-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-3xl animate-pulse bg-gray-200/60"></div>
            ))}
          </div>
        ) : displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-blush-100 max-w-md mx-auto space-y-3">
            <p className="text-sm text-gray-500 font-light">No pieces found in this category.</p>
            <Link to="/products" className="btn-primary inline-block px-5 py-2 text-xs font-bold">
              Browse All Products
            </Link>
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-blush-200 text-charcoal hover:bg-rose-50 hover:text-rose-600 rounded-full text-xs font-bold transition-all shadow-xs"
          >
            <span>Explore Entire Catalog ({featuredProducts.length}+ Pieces)</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* 5. Minimalist "Why Choose Aarnya" Trust Grid */}
      <section className="container-base px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-blush-100 shadow-sm space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">The Aarnya Promise</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-charcoal">
              Thoughtfully Made, Lovingly Delivered
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-light">
              We create each piece with attention to detail and supreme artisan dedication.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2 p-2">
              <span className="text-3xl inline-block p-3 rounded-2xl bg-rose-50 text-rose-600">🌿</span>
              <h3 className="font-display font-bold text-sm text-charcoal">Real Preserved Botanicals</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Natural pressed petals preserved forever inside crystal-clear resin.
              </p>
            </div>

            <div className="space-y-2 p-2">
              <span className="text-3xl inline-block p-3 rounded-2xl bg-amber-50 text-amber-600">✨</span>
              <h3 className="font-display font-bold text-sm text-charcoal">Anti-Tarnish Finishes</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Water-resistant, lightweight, and skin-friendly for everyday wear.
              </p>
            </div>

            <div className="space-y-2 p-2">
              <span className="text-3xl inline-block p-3 rounded-2xl bg-purple-50 text-purple-600">🎁</span>
              <h3 className="font-display font-bold text-sm text-charcoal">Velvet Gift Packaging</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Every order arrives in a signature velvet box ready for gifting.
              </p>
            </div>

            <div className="space-y-2 p-2">
              <span className="text-3xl inline-block p-3 rounded-2xl bg-emerald-50 text-emerald-600">🚚</span>
              <h3 className="font-display font-bold text-sm text-charcoal">Pan-India Express</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Safe, insured delivery across all Indian pin codes with live tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Custom Orders & Bespoke WhatsApp Concierge */}
      <section className="container-base px-4 sm:px-6">
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-charcoal rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-luxury">
          <div className="relative z-10 max-w-2xl space-y-4 text-center sm:text-left">
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase text-rose-200">
              Personalized Atelier Service
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              Looking for a Custom Design?
            </h2>
            <p className="text-xs sm:text-sm font-light text-rose-100/90 leading-relaxed max-w-xl">
              Have a special occasion, bridal theme, or flowers from your wedding you want to preserve? Chat directly with our designer on WhatsApp for bespoke creations.
            </p>
            <div className="pt-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs rounded-full shadow-lg transition-all transform hover:scale-105"
              >
                <span>💬 Chat with Artisan on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
