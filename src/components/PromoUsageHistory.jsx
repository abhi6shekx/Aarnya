import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PromoUsageHistory() {
  const { user } = useAuth();
  const [userPromoData, setUserPromoData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.uid) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserPromoData(userData);
        }
      } catch (error) {
        console.error('Error loading promo history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.uid]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="h3 mb-4">Promo Code History</h3>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  const usedPromos = userPromoData.userPromoUsage || {};
  const usedPromoList = Object.entries(usedPromos).filter(([, used]) => used);

  return (
    <div className="card p-6">
      <h3 className="h3 mb-4 flex items-center gap-2">
        <span>🎫</span>
        Promo Code Usage History
      </h3>
      
      <div className="bg-blush-50 p-4 rounded-lg mb-4">
        <h4 className="font-semibold text-charcoal mb-2">Summary</h4>
        <p className="text-sm text-muted">
          You have used <span className="font-semibold text-rose-600">
            {usedPromoList.length}
          </span> promo codes so far.
        </p>
        <p className="text-sm text-muted mt-1">
          Total orders: <span className="font-semibold text-rose-600">
            {userPromoData.orderCount || 0}
          </span>
        </p>
      </div>
      
      {usedPromoList.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-muted">You haven't used any promo codes yet.</p>
          <p className="text-sm text-muted mt-2">
            Check out available promo codes on our homepage!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="font-semibold text-charcoal">Used Promo Codes</h4>
          {usedPromoList.map(([code, used]) => (
            <div key={code} className="border border-blush-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-600 bg-rose-100 px-3 py-1 rounded-full text-sm">
                  {code}
                </span>
                <span className="text-green-600 text-sm">✅ Used</span>
              </div>
              
              <div className="mt-2 text-sm text-muted">
                {code === 'FREEDELIVERY' && 'Free standard shipping on first order'}
                {code === 'EXPRESS50' && '50% off express delivery'}
                {code === 'ABHI100' && '₹100 off order total'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}