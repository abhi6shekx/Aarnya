import { Link } from 'react-router-dom'

export default function Footer() {
  const whatsappLink = "https://wa.me/917895111299?text=Hi!%20I%20have%20a%20question%20about%20Aarnya%20jewelry."

  return (
    <footer className="bg-charcoal text-ivory pt-16 pb-12 border-t border-rose-950/40">
      <div className="container-base px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Aarnya" className="h-10 w-10 object-contain filter drop-shadow brightness-110" />
              <span className="font-display text-2xl font-bold tracking-tight text-white">Aarnya</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Where elegance meets emotion. Premium handcrafted & artisanal jewelry, created with passion in India.
            </p>
            <p className="text-xs text-rose-300/80 italic">
              A name woven with love from Anya • Aarna • Divya • Ashish
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-rose-200">Shop Collections</h4>
            <ul className="space-y-2.5 text-sm text-gray-300 font-light">
              <li><Link to="/products" className="hover:text-rose-300 transition-colors">All Earrings & Accessories</Link></li>
              <li><Link to="/products?gender=women" className="hover:text-rose-300 transition-colors">Women's Collection</Link></li>
              <li><Link to="/products?gender=men" className="hover:text-rose-300 transition-colors">Men's Minimalist</Link></li>
              <li><Link to="/products?gender=unisex" className="hover:text-rose-300 transition-colors">Unisex Classics</Link></li>
              <li><Link to="/wishlist" className="hover:text-rose-300 transition-colors">My Wishlist</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-rose-200">Customer Care</h4>
            <ul className="space-y-2.5 text-sm text-gray-300 font-light">
              <li><a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span>💬 Custom Orders WhatsApp</span></a></li>
              <li><Link to="/orders" className="hover:text-rose-300 transition-colors">Track Orders</Link></li>
              <li><Link to="/profile#addresses" className="hover:text-rose-300 transition-colors">Shipping & Delivery</Link></li>
              <li className="text-xs text-gray-400">⚡ India-Wide Shipping</li>
            </ul>
          </div>

          {/* Guarantee / Trust Badges */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-rose-200">The Aarnya Promise</h4>
            <div className="space-y-3 text-xs text-gray-300">
              <div className="flex items-start gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                <span className="text-xl">✨</span>
                <div>
                  <p className="font-medium text-white">100% Handcrafted</p>
                  <p className="text-gray-400 font-light">Precision crafted by skilled artisans.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="font-medium text-white">Secure Payments</p>
                  <p className="text-gray-400 font-light">Razorpay verified checkout.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-light">
          <p>© {new Date().getFullYear()} Aarnya Store. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Handcrafted in India 🇮🇳</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}