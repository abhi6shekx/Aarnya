import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'
import { GENDER_ICONS, CATEGORY_ICONS } from '../lib/categories'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Function to increment product popularity count
async function incrementProductAddCount(productId) {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      addCount: increment(1),
    });
  } catch (error) {
    console.error("Failed to update addCount:", error);
  }
}

function PopularityBadge({ addCount, purchaseCount }) {
  let label = "";
  let style = "";

  if (purchaseCount > 100) {
    label = "👑 Bestselling";
    style = "bg-gradient-to-r from-pink-300 to-yellow-200 text-ink shadow-lg shadow-pink-200";
  } else if (addCount > 50) {
    label = "🌟 Hot Seller";
    style = "bg-gradient-to-r from-yellow-200 to-rose-100 text-ink shadow-md shadow-yellow-200";
  } else if (addCount > 10) {
    label = "🔥 Trending";
    style = "bg-gradient-to-r from-rose-200 to-pink-100 text-rose-800 shadow-sm";
  }

  if (!label) return null;
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>{label}</span>;
}

export default function ProductCard({ p }) {
  const navigate = useNavigate()

  const addToCart = async () => {
    // Add to cart logic
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ ...p, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Update popularity count in Firestore
    await incrementProductAddCount(p.id)
    
    // Navigate to cart
    navigate('/cart')
  }

  const startVirtualTryOn = (e) => {
    e.preventDefault()
    navigate(`/virtual-try-on/${p.id}`)
  }

  return (
    <div className="card p-3 hover:shadow-xl transition duration-300 transform hover:-translate-y-1 relative group">
      <Link to={`/product/${p.id}`}>
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-50 relative">
          <img
            src={p.images?.[0]?.url || p.images?.[0]}
            alt={p.name}
            className="w-full h-full object-cover transition duration-300 hover:scale-110"
          />
          
          {/* Category badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {/* Popularity Badge */}
            {(p.addCount || p.purchaseCount) && <PopularityBadge addCount={p.addCount} purchaseCount={p.purchaseCount} />}
            
            {p.gender && (
              <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-purple-600 flex items-center gap-1">
                <span>{GENDER_ICONS[p.gender]}</span>
                {p.gender}
              </span>
            )}
            {p.productType && (
              <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-blue-600 flex items-center gap-1">
                <span>{CATEGORY_ICONS[p.productType]}</span>
                {p.productType}
              </span>
            )}
          </div>

          {/* Virtual Try-On Badge */}
          {p.virtualTryOnEnabled && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                📸 Try On
              </span>
            </div>
          )}
        </div>
        
        <div className="pt-3">
          <h3 className="font-semibold line-clamp-1 text-lg">{p.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{p.shortDesc}</p>
          
          {/* Ring sizes display */}
          {p.productType === 'rings' && p.availableSizes?.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                Sizes: {p.availableSizes.slice(0, 3).join(', ')}
                {p.availableSizes.length > 3 && ` +${p.availableSizes.length - 3} more`}
              </span>
            </div>
          )}
          
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-xl">{formatINR(p.price)}</span>
            <span className="text-xs bg-smoke px-2 py-1 rounded">{p.category}</span>
          </div>
          
          {/* Stock urgency display */}
          <div className="mt-2">
            {p.stock <= 5 && p.stock > 0 && (
              <span className="text-sm text-red-600 font-medium">
                Only {p.stock} left in stock!
              </span>
            )}
            {p.stock === 0 && (
              <span className="text-sm text-gray-500 font-medium">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Action buttons */}
      <div className="mt-3 space-y-2">
        {p.stock === 0 ? (
          <button 
            disabled 
            className="bg-gray-300 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium w-full cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : p.virtualTryOnEnabled ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startVirtualTryOn}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              📸 Try On
            </button>
            <button
              onClick={addToCart}
              className="btn-gold text-sm"
            >
              Add to Cart
            </button>
          </div>
        ) : (
          <button
            onClick={addToCart}
            className="btn-gold w-full"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}
