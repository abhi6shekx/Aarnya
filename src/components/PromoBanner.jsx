import { useState, useEffect } from 'react';
import { getAvailablePromosForUser } from '../lib/promocode';
import { useAuth } from '../context/AuthContext';

export default function PromoBanner() {
  const { user } = useAuth();
  const [visiblePromos, setVisiblePromos] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const loadPromos = async () => {
      if (!user?.uid) return;
      
      try {
        // Get promo codes specific to user (excludes already used ones)
        const promos = await getAvailablePromosForUser(user.uid);
        setVisiblePromos(promos);
      } catch (error) {
        console.error('Error loading promo codes:', error);
        setVisiblePromos([]);
      }
    };

    loadPromos();
  }, [user?.uid]);

  if (!visiblePromos.length || !isVisible || !user) return null;

  // Combine all banner texts into one line
  const bannerText = visiblePromos
    .map(promo => `${promo.code}: ${promo.description}`)
    .join(' | ');

  return (
    <div className="bg-rose-100 text-center py-2 text-sm relative">
      <div className="container-base">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-rose-800 font-medium">
              🎉 {bannerText}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 p-1 rounded-full hover:bg-rose-200 transition-colors text-rose-600"
            aria-label="Close banner"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}