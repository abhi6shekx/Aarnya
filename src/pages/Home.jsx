import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ProductCard from '../components/ProductCard'
import PromoBanner from '../components/PromoBanner'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
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
          where('featured', '==', true),
          limit(8)
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

  const categories = [
    {
      title: "Women's Grace",
      subtitle: 'Earrings, Rings & Neckpieces',
      emoji: '💎',
      color: 'from-rose-50 to-blush-100',
      link: '/products?gender=women'
    },
    {
      title: "Men's Minimal",
      subtitle: 'Statement Bands & Signet Rings',
      emoji: '🔱',
      color: 'from-amber-50 to-gold-100',
      link: '/products?gender=men'
    },
    {
      title: 'Unisex Classics',
      subtitle: 'Versatile Handmade Pieces',
      emoji: '✨',
      color: 'from-purple-50 to-pink-50',
      link: '/products?gender=unisex'
    }
  ]

  return (
    <div className="space-y-16 pb-12">
      {/* Promo Banner */}
      <PromoBanner />
      
      {/* Luxury Hero Section */}
      <section className="relative overflow-hidden pt-4 pb-12 md:py-16 bg-luxury-hero">
        <div className="container-base px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-blush-300 shadow-soft">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-xs font-bold text-rose-700 tracking-wider uppercase">
                  Artisanal Luxury • Handcrafted in India
                </span>
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-charcoal leading-[1.15]">
                Where Elegance <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-blush-500 to-gold-600">
                  Meets Emotion
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Discover our exquisite collection of handmade and ready-made jewelry. Each design is meticulously created to accentuate your unique beauty.
              </p>

              {/* Call To Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link 
                  to="/products"
                  className="btn-primary w-full sm:w-auto px-8 py-4 text-sm font-bold tracking-wide flex items-center justify-center gap-2 group shadow-glow"
                >
                  Explore Collection
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-7 py-4 text-sm font-semibold text-charcoal bg-white/90 hover:bg-white border border-blush-200 rounded-full shadow-soft hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-emerald-600 text-lg">💬</span>
                  Custom Order Inquiry
                </a>
              </div>

              {/* Trust Badges Bar */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-rose-200/60 max-w-lg mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <p className="font-display text-2xl font-bold text-rose-600">100%</p>
                  <p className="text-xs text-gray-500 font-medium">Handmade Care</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="font-display text-2xl font-bold text-rose-600">India</p>
                  <p className="text-xs text-gray-500 font-medium">Nationwide Shipping</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="font-display text-2xl font-bold text-rose-600">Pure</p>
                  <p className="text-xs text-gray-500 font-medium">Quality Materials</p>
                </div>
              </div>
            </div>

            {/* Right Graphic Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Background Ambient Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-blush-300/40 to-rose-200/50 rounded-[2.5rem] blur-2xl -z-10"></div>

                <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2.5rem] shadow-luxury border border-white space-y-4">
                  {/* Hero Main Card */}
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-ivory to-blush-50 flex items-center justify-center p-6 relative group">
                    <img
                      src={featuredProducts?.[0]?.images?.[0]?.url || featuredProducts?.[0]?.images?.[0] || featuredProducts?.[0]?.imageUrl || heroSrc}
                      alt="Aarnya Luxury Jewelry"
                      className="w-full h-full object-contain filter drop-shadow-xl transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                      onError={() => { if (heroSrc !== '/logo.svg') setHeroSrc('/logo.svg') }}
                    />
                    
                    {/* Live Virtual Try-On Overlay Badge */}
                    <Link
                      to={featuredProducts?.[0] ? `/virtual-try-on/${featuredProducts[0].id}` : '/virtual-try-on/sample'}
                      className="absolute top-3 left-3 bg-emerald-600/90 hover:bg-emerald-700 text-white backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      📸 Try-On Live AR
                    </Link>

                    {/* Top Right Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-900 border border-amber-200 shadow-sm flex items-center gap-1">
                      <span className="text-amber-500">★</span> 4.9 (120+)
                    </div>

                    {/* Bottom Info Pill */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md py-3 px-4 rounded-2xl border border-blush-100 shadow-soft flex items-center justify-between">
                      <div>
                        <p className="font-display text-sm font-bold text-charcoal truncate">
                          {featuredProducts?.[0]?.name || 'Signature Handmade Collection'}
                        </p>
                        <p className="text-[11px] text-rose-500 font-semibold">
                          {featuredProducts?.[0]?.price ? `₹${featuredProducts[0].price} • Pure Craftsmanship` : 'Available for Instant Try-On'}
                        </p>
                      </div>
                      <Link
                        to={featuredProducts?.[0] ? `/product/${featuredProducts[0].id}` : '/products'}
                        className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        View
                      </Link>
                    </div>
                  </div>

                  {/* Feature Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-blush-50/70 p-2.5 rounded-xl border border-blush-100 flex items-center gap-2">
                      <span className="text-base">🚚</span>
                      <span className="text-[11px] font-bold text-charcoal">Express Shipping</span>
                    </div>
                    <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 flex items-center gap-2">
                      <span className="text-base">🎁</span>
                      <span className="text-[11px] font-bold text-charcoal">Gift Box Ready</span>
                    </div>
                  </div>
                </div>

                {/* Floating Glass Accent Pills */}
                <div className="absolute -top-4 -right-2 glass-badge px-3.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '4s' }}>
                  <span className="text-base">✨</span>
                  <span className="text-xs font-bold text-charcoal">100% Artisan Crafted</span>
                </div>

                <div className="absolute -bottom-4 -left-2 glass-badge px-3.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-2">
                  <span className="text-base">💎</span>
                  <span className="text-xs font-bold text-charcoal">Premium Quality Resin</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Categories Showcase Section */}
      <section className="container-base px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">Curated Collections</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-charcoal mt-1">Shop by Category</h2>
          <p className="text-sm text-gray-500 font-light mt-2">
            Explore handcrafted jewelry tailored to your unique style statement
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to={cat.link}
              className={`group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br ${cat.color} border border-white/80 shadow-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between min-h-[220px]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm">{cat.emoji}</span>
                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors shadow-sm">
                  →
                </span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-charcoal group-hover:text-rose-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-gray-600 font-light mt-1">
                  {cat.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container-base px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">Handpicked Favorites</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-charcoal mt-1">Featured Creations</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
            Browse Full Catalog →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 rounded-3xl animate-pulse bg-gray-100"></div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 rounded-3xl p-12 text-center border border-blush-100 max-w-lg mx-auto">
            <p className="text-gray-500 font-light mb-4">Explore our complete collection to discover timeless handmade jewelry.</p>
            <Link to="/products" className="btn-primary px-6 py-2.5 text-xs font-bold">
              View All Products
            </Link>
          </div>
        )}
      </section>

      {/* Custom Orders WhatsApp Callout */}
      <section className="container-base px-4 sm:px-6">
        <div className="bg-gradient-to-r from-rose-500 via-blush-500 to-rose-600 rounded-3xl p-8 sm:p-12 text-white text-center sm:text-left relative overflow-hidden shadow-luxury">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <img src="/logo.svg" alt="Aarnya" className="w-96 h-96 object-contain" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase">
              Bespoke Artisan Designs
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
              Looking for Custom Jewelry?
            </h2>
            <p className="text-sm sm:text-base font-light text-rose-50 leading-relaxed">
              Have a custom design or bridal theme in mind? Share your inspiration directly with our master artisans on WhatsApp.
            </p>
            <div className="pt-2">
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm rounded-full shadow-lg transition-all transform hover:scale-105"
              >
                <span>💬 Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

