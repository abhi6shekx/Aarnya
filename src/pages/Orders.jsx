import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const orderList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(orderList);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush-50 to-rose-100 flex items-center justify-center py-12 px-4">
        <div className="card p-12 text-center">
          <h2 className="font-display text-3xl text-charcoal mb-4">Please Sign In</h2>
          <p className="text-rose-600 opacity-70 mb-6">You need to be logged in to view your orders</p>
          <Link to="/profile" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush-50 to-rose-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 to-rose-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card backdrop-blur-sm bg-white/80">
          <div className="px-6 py-8 sm:p-8">
            <div className="mb-8">
              <h1 className="font-display text-4xl text-charcoal">My Orders</h1>
              <p className="text-rose-600 opacity-70 mt-2">Track your jewelry purchases</p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-blush-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blush-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl text-charcoal mb-3">No Orders Yet</h3>
                <p className="text-rose-600 opacity-70 mb-6">Start shopping for beautiful jewelry!</p>
                <Link to="/products" className="btn-primary">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="card p-6 bg-white/70 backdrop-blur-sm border border-blush-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-charcoal">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-rose-600 opacity-70">
                          {order.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blush-100 text-blush-600">
                        {order.status || 'Processing'}
                      </span>
                    </div>
                    
                    <div className="border-t border-blush-100 pt-4">
                      <p className="text-lg font-semibold text-charcoal">
                        Total: ₹{order.total?.toLocaleString()}
                      </p>
                      <p className="text-sm text-rose-600 opacity-70 mt-1">
                        {order.items?.length} item(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;