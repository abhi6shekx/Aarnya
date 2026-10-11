import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ProductCard from '../components/ProductCard'
import PromoBanner from '../components/PromoBanner'

// --- 2D LUXURY VECTOR ICONS ---
function IconSparkle({ className = "w-6 h-6 text-rose-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3z" />
    </svg>
  )
}

function IconRing({ className = "w-6 h-6 text-rose-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="7" />
      <path d="M9 5l3-2 3 2-1.5 2h-3L9 5z" />
      <path d="M10.5 7h3" />
    </svg>
  )
}

function IconEarrings({ className = "w-6 h-6 text-rose-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="5.5" r="2" />
      <path d="M7.5 7.5v5l-2 4h4l-2-4" />
      <circle cx="16.5" cy="5.5" r="2" />
      <path d="M16.5 7.5v5l-2 4h4l-2-4" />
    </svg>
  )
}

function IconNecklace({ className = "w-6 h-6 text-rose-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5c0 7 3.5 12 8 12s8-5 8-12" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M12 17v-1.5" />
    </svg>
  )
}

function IconBracelet({ className = "w-6 h-6 text-rose-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="9" ry="5.5" />
      <circle cx="12" cy="6.5" r="1.5" fill="currentColor" />
      <circle cx="6.5" cy="10" r="1" fill="currentColor" />
      <circle cx="17.5" cy="10" r="1" fill="currentColor" />
    </svg>
  )
}

function IconWomen({ className = "w-6 h-6 text-rose-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a4.5 4.5 0 0 1 4.5 4.5c0 2.5-2 4.5-4.5 4.5S7.5 10 7.5 7.5A4.5 4.5 0 0 1 12 3z" />
      <path d="M6 21c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <path d="M15 8c1-.8 2-.8 3 .2" />
    </svg>
  )
}

function IconMen({ className = "w-6 h-6 text-rose-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5" />
      <path d="M13.5 10.5L20 4" />
      <path d="M15 4h5v5" />
    </svg>
  )
}

function IconBespoke({ className = "w-6 h-6 text-emerald-600" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.5 5.5L20 8.5l-4 4 1 5.5-5-2.8L7 21l1-5.5-4-4 5.5-1L12 2z" />
    </svg>
  )
}

function IconBotanical({ className = "w-6 h-6 text-rose-600" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a9 9 0 0 1 9 9c0 5-4 9-9 9s-9-4-9-9a9 9 0 0 1 9-9z" />
      <path d="M12 22V11" />
      <path d="M12 15c2-2 4-2 6-1" />
      <path d="M12 13c-2-2-4-2-6-1" />
    </svg>
  )
}

function IconShield({ className = "w-6 h-6 text-amber-600" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function IconGift({ className = "w-6 h-6 text-purple-600" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13" />
      <path d="M3 13h18" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5c2 0 4.5 5 4.5 5s2.5-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}

function IconDelivery({ className = "w-6 h-6 text-emerald-600" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="14" height="11" rx="1" />
      <path d="M15 10h4l3 3v4h-7V10z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function IconWhatsApp({ className = "w-4 h-4 fill-current" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.07 7.23C8.91 7.23 8.65 7.29 8.44 7.52C8.22 7.76 7.6 8.34 7.6 9.53C7.6 10.72 8.46 11.87 8.58 12.03C8.71 12.2 10.27 14.6 12.66 15.63C14.65 16.49 15.06 16.32 15.5 16.28C15.94 16.24 16.92 15.7 17.12 15.13C17.33 14.56 17.33 14.07 17.27 13.97C17.2 13.87 17.05 13.81 16.82 13.7C16.6 13.59 15.51 13.05 15.31 12.98C15.1 12.9 14.95 12.87 14.8 13.1C14.65 13.32 14.22 13.84 14.09 13.99C13.96 14.14 13.83 14.16 13.61 14.05C13.38 13.93 12.66 13.7 11.8 12.93C11.14 12.34 10.68 11.61 10.56 11.39C10.43 11.16 10.54 11.04 10.66 10.93C10.76 10.82 10.89 10.66 11 10.53C11.12 10.4 11.16 10.3 11.23 10.15C11.31 10 11.27 9.87 11.21 9.76C11.15 9.64 10.71 8.57 10.53 8.12C10.35 7.69 10.17 7.75 10.03 7.74C9.9 7.74 9.75 7.23 9.07 7.23Z" />
    </svg>
  )
}

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

  // 2D Vector Category Story Circles (Clean line-art)
  const quickCategories = [
    { title: 'All', icon: <IconSparkle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />, link: '/products', badge: 'Hot' },
    { title: 'Rings', icon: <IconRing className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />, link: '/products?type=rings' },
    { title: 'Earrings', icon: <IconEarrings className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />, link: '/products?type=earrings' },
    { title: 'Necklaces', icon: <IconNecklace className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />, link: '/products?type=necklaces' },
    { title: 'Bracelets', icon: <IconBracelet className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />, link: '/products?type=bracelets' },
    { title: "Women", icon: <IconWomen className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />, link: '/products?gender=women' },
    { title: "Men", icon: <IconMen className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />, link: '/products?gender=men' },
    { title: 'Bespoke', icon: <IconBespoke className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />, link: whatsappLink, isExternal: true, badge: 'Custom' }
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

      {/* 1. Quick Category Circles with 2D Line-Art Designs */}
      <section className="container-base px-4 sm:px-6 pt-2">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-blush-100 shadow-sm">
          <div className="flex items-center justify-between gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1">
            {quickCategories.map((cat, idx) => (
              cat.isExternal ? (
                <a
                  key={idx}
                  href={cat.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 shrink-0 group min-w-[64px]"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50/70 border border-emerald-200 group-hover:border-emerald-500 group-hover:bg-emerald-100/70 group-hover:scale-105 transition-all flex items-center justify-center shadow-xs relative">
                    {cat.icon}
                    {cat.badge && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-charcoal group-hover:text-emerald-700 transition-colors">
                    {cat.title}
                  </span>
                </a>
              ) : (
                <Link
                  key={idx}
                  to={cat.link}
                  className="flex flex-col items-center gap-1.5 shrink-0 group min-w-[64px]"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50/70 border border-blush-200 group-hover:border-rose-400 group-hover:bg-rose-100/70 group-hover:scale-105 transition-all flex items-center justify-center shadow-xs relative">
                    {cat.icon}
                    {cat.badge && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-charcoal group-hover:text-rose-600 transition-colors">
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
        <div className="bg-gradient-to-br from-white via-rose-50/30 to-blush-50/60 rounded-3xl p-6 sm:p-10 lg:p-12 border border-blush-200/80 shadow-soft relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-100/80 text-rose-700 rounded-full text-xs font-bold tracking-wide uppercase shadow-xs">
                <IconSparkle className="w-3.5 h-3.5 text-rose-600" />
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
                  <IconWhatsApp className="w-4 h-4 text-emerald-600" />
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
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-rose-600 border border-rose-100 shadow-xs flex items-center gap-1">
                    <IconSparkle className="w-3 h-3 text-rose-500" />
                    <span>Featured Drop</span>
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

      {/* 3. Filterable Products Grid */}
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

      {/* 4. Minimalist "Why Choose Aarnya" Trust Grid with 2D Line-Art SVGs */}
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
            <div className="space-y-2.5 p-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center">
                <IconBotanical className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-display font-bold text-sm text-charcoal">Real Preserved Botanicals</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Natural pressed petals preserved forever inside crystal-clear resin.
              </p>
            </div>

            <div className="space-y-2.5 p-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center">
                <IconShield className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-display font-bold text-sm text-charcoal">Anti-Tarnish Finishes</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Water-resistant, lightweight, and skin-friendly for everyday wear.
              </p>
            </div>

            <div className="space-y-2.5 p-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center">
                <IconGift className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-display font-bold text-sm text-charcoal">Velvet Gift Packaging</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Every order arrives in a signature velvet box ready for gifting.
              </p>
            </div>

            <div className="space-y-2.5 p-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center">
                <IconDelivery className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-sm text-charcoal">Pan-India Express</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Safe, insured delivery across all Indian pin codes with live tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Custom Orders & Bespoke WhatsApp Concierge */}
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
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs rounded-full shadow-lg transition-all transform hover:scale-105"
              >
                <IconWhatsApp className="w-4 h-4 text-emerald-700" />
                <span>Chat with Artisan on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
