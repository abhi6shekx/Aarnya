import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ProductCard from '../components/ProductCard'
import PromoBanner from '../components/PromoBanner'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  // Use the site favicon as the hero graphic (local asset) and allow fallback to logo if missing
  const [heroSrc, setHeroSrc] = useState('/favicon.svg')
  
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // WhatsApp configuration
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
      title: 'Women',
      emoji: '💎',
      description: 'Elegant earrings, rings & accessories',
      color: 'from-rose-100 to-pink-50',
      link: '/products?gender=women'
    },
    {
      title: 'Men',
      emoji: '🔱',
      description: 'Sophisticated rings & minimal pieces',
      color: 'from-amber-100 to-yellow-50',
      link: '/products?gender=men'
    },
    {
      title: 'Unisex',
      emoji: '✨',
      description: 'Versatile designs for everyone',
      color: 'from-violet-100 to-purple-50',
      link: '/products?gender=unisex'
    }
  ]

  return (
    <div className="space-y-20">
      {/* Promo Banner */}
      <PromoBanner />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-25 to-violet-50"></div>
        <div className="relative container-base">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh] py-20">
            {/* Content */}
            <div className="space-y-8 fade-up">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-rose-200">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-rose-700">Handcrafted with Love</span>
                </div>
                
                <h1 className="font-display text-5xl lg:text-7xl leading-tight text-charcoal">
                  Where elegance
                  <span className="block text-rose-600">meets emotion</span>
                </h1>
                
                <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                  Discover our curated collection of premium handmade jewelry. 
                  Each piece tells a story, crafted with precision and passion in India.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 fade-up" style={{'--d': '200ms'}}>
                <Link 
                  to="/products"
                  className="btn-primary px-8 py-4 text-lg font-medium inline-flex items-center justify-center gap-2 group"
                >
                  Explore Collection
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-8 pt-8 fade-up" style={{'--d': '400ms'}}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-600">100%</div>
                  <div className="text-sm text-gray-600">Handcrafted</div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative fade-up" style={{'--d': '300ms'}}>
                <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                  <div className="bg-white flex items-center justify-center w-full h-full">
                    <img
                      src={heroSrc}
                      alt="Aarnya favicon"
                      className="w-96 h-96 lg:w-[48rem] lg:h-[48rem] p-6 object-contain"
                      loading="eager"
                      onError={() => { if (heroSrc !== '/logo.svg') setHeroSrc('/logo.svg') }}
                    />
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
                  <span className="text-2xl">💎</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-rose-100/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container-base">
        <div className="text-center mb-12 fade-up">
          <h2 className="font-display text-4xl text-charcoal mb-4">Shop by Category</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our carefully curated collections designed for every style and occasion
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.title}
              to={category.link}
              className={`card p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br ${category.color} border-0 fade-up`}
              style={{'--d': `${(index + 1) * 100}ms`}}
            >
              <div className="text-4xl mb-4">{category.emoji}</div>
              <h3 className="font-display text-2xl text-charcoal mb-2">{category.title}</h3>
              <p className="text-gray-600 mb-4">{category.description}</p>
              <span className="inline-flex items-center text-rose-600 font-medium group">
                Explore Collection
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container-base">
        <div className="flex items-center justify-between mb-8 fade-up">
          <h2 className="font-display text-4xl text-charcoal">Featured Pieces</h2>
          <Link to="/products" className="text-rose-600 hover:underline font-medium">
            View All Products →
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-80 animate-pulse bg-gray-100"></div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <div key={product.id} className="fade-up" style={{'--d': `${index * 100}ms`}}>
                <ProductCard p={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 fade-up">
            <p className="text-gray-600">No featured products available at the moment.</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-rose-100 to-pink-100">
        <div className="container-base py-20">
          <div className="text-center max-w-3xl mx-auto fade-up">
            <h2 className="font-display text-4xl text-charcoal mb-6">
              Need Something Custom?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Have a special design in mind? Chat with us on WhatsApp and our artisans can bring your vision to life!
            </p>
            <div className="flex justify-center">
              <a 
                href="https://wa.me/917895111299?text=Hi!%20I%20want%20to%20customize%20a%20jewelry%20piece.%20Can%20you%20help%20me?"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-8 py-4 text-lg font-medium inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.306"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
