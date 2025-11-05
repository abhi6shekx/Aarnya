import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

/**
 * Generates a /products URL with query params.
 * Example: /products?type=rings
 */
const buildUrl = ({ type }) => {
  const p = new URLSearchParams();
  if (type) p.set("type", type);
  return `/products?${p.toString()}`;
};

const CATEGORIES = [
  { label: "All", type: "", hasSubmenu: false, available: true },
  { label: "Rings", type: "rings", hasSubmenu: true, available: true },
  { label: "Necklaces & Pendants", type: "necklaces", hasSubmenu: true, available: false },
  { label: "Bracelets", type: "bracelets", hasSubmenu: true, available: false },
  { label: "Earrings", type: "earrings", hasSubmenu: true, available: true },
  { label: "Anklets", type: "anklets", hasSubmenu: true, available: false },
  { label: "Other Categories", type: "other", hasSubmenu: true, available: false },
];

export default function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="relative group"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="px-4 py-2 rounded-full text-charcoal hover:bg-blush-100 hover:text-rose-600 transition flex items-center gap-2"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Categories
        <svg 
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      <div
        className={`absolute left-0 top-full mt-2 w-80 rounded-2xl border border-blush-200 bg-white shadow-lg z-50 overflow-hidden
        ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        transition-all duration-200`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3 border-b border-blush-200">
          <h3 className="font-medium text-rose-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Shop by Category
          </h3>
        </div>

        {/* Categories List */}
        <div className="py-2">
          {CATEGORIES.map((category) => (
            category.available ? (
              <Link
                key={category.type || 'all'}
                to={category.type ? buildUrl({ type: category.type }) : '/products'}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-charcoal hover:bg-blush-50 transition-colors group"
              >
                <span className={`${category.type === '' ? 'font-medium text-rose-600' : ''}`}>
                  {category.label}
                </span>
                {category.hasSubmenu && (
                  <svg 
                    className="w-4 h-4 text-gray-400 group-hover:text-rose-500 transition-colors" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </Link>
            ) : (
              <div
                key={category.type || 'all'}
                className="flex items-center justify-between px-4 py-3 text-gray-400 cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {category.label}
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </span>
                {category.hasSubmenu && (
                  <svg 
                    className="w-4 h-4 text-gray-300" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )
          ))}
        </div>

        {/* Quick Actions Footer */}
        <div className="border-t border-blush-200 bg-gray-50 px-4 py-3">
          <div className="flex gap-2 text-xs">
            <Link
              to="/products?gender=women"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 bg-white rounded-full text-rose-600 hover:bg-rose-50 transition border border-rose-200"
            >
              Women
            </Link>
            <Link
              to="/products?gender=men"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 bg-white rounded-full text-rose-600 hover:bg-rose-50 transition border border-rose-200"
            >
              Men
            </Link>
            <Link
              to="/products?gender=unisex"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 bg-white rounded-full text-rose-600 hover:bg-rose-50 transition border border-rose-200"
            >
              Unisex
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
