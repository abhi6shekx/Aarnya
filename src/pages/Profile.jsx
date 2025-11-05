import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  deleteField
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const Profile = () => {
  const { user, login, signup, signInWithGoogle, logout, isSuperAdmin } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resettingPromos, setResettingPromos] = useState(false)

  // Load user addresses
  useEffect(() => {
    if (user) {
      console.log('Loading addresses for user:', user.uid);
      const addressQuery = query(
        collection(db, 'userAddresses'),
        where('userId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(addressQuery, (snapshot) => {
        console.log('Address snapshot received:', snapshot.docs.length, 'addresses');
        const addressList = snapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('Address data:', data);
          return data;
        });
        
        // Sort addresses in client side - default first, then by creation date
        addressList.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });
        
        console.log('Setting addresses:', addressList);
        setAddresses(addressList);
      }, (error) => {
        console.error('Error loading addresses:', error);
        setError(`Failed to load addresses: ${error.message}`);
      });

      return () => unsubscribe();
    } else {
      console.log('No user, clearing addresses');
      setAddresses([]);
    }
  }, [user]);

  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.name);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setFormData({ email: '', password: '', name: '' });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Current user:', user);
      console.log('User UID:', user?.uid);
      console.log('Address form data:', addressForm);
      
      if (!user || !user.uid) {
        throw new Error('User not authenticated');
      }

      if (editingAddress) {
        console.log('Updating address:', editingAddress.id);
        await updateDoc(doc(db, 'userAddresses', editingAddress.id), {
          ...addressForm,
          updatedAt: new Date()
        });
      } else {
        console.log('Creating new address');
        const newAddress = {
          ...addressForm,
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        console.log('New address data:', newAddress);
        
        await addDoc(collection(db, 'userAddresses'), newAddress);
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        name: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
    } catch (error) {
      console.error('Address submit error:', error);
      setError(`Failed to save address: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteDoc(doc(db, 'userAddresses', addressId));
      } catch (error) {
        setError(error.message);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush-50 to-rose-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="font-display text-4xl text-charcoal mb-4">
              {authMode === 'login' ? 'Welcome Back' : 'Join Aarnya'}
            </h2>
            <p className="text-rose-700 opacity-70 mb-8">
              {authMode === 'login' ? 'Sign in to your elegant account' : 'Create your beautiful jewelry account'}
            </p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setAuthMode('login')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-blush-400 to-rose-400 text-white shadow-lg'
                    : 'bg-white/60 backdrop-blur-sm text-charcoal border border-blush-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-blush-400 to-rose-400 text-white shadow-lg'
                    : 'bg-white/60 backdrop-blur-sm text-charcoal border border-blush-200'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="card p-8 backdrop-blur-sm bg-white/80">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={onChange}
                      className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm placeholder-rose-400"
                      placeholder="Enter your elegant name"
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm placeholder-rose-400"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm placeholder-rose-400"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blush-400 to-rose-400 text-white py-4 px-6 rounded-xl font-medium hover:from-blush-500 hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blush-300 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Please wait...
                    </div>
                  ) : (
                    authMode === 'login' ? 'Sign In Elegantly' : 'Create Account'
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-blush-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-rose-600 font-medium">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex justify-center items-center px-6 py-4 border border-blush-200 rounded-xl shadow-sm text-sm font-medium text-charcoal bg-white/70 backdrop-blur-sm hover:bg-white hover:border-blush-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blush-300 disabled:opacity-50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 to-rose-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card backdrop-blur-sm bg-white/80">
          <div className="px-6 py-8 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="font-display text-4xl text-charcoal">Profile</h1>
                <p className="text-rose-600 opacity-70 mt-2">Manage your elegant account</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-rose-100 hover:bg-rose-200 text-rose-600 font-medium rounded-xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="border-b border-blush-200 pb-8 mb-8">
              <h2 className="text-xl font-medium text-charcoal mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Account Information
              </h2>
              <div className="bg-blush-50 p-4 rounded-xl">
                <p className="text-sm text-charcoal"><strong>Name:</strong> {user.displayName || 'Not provided'}</p>
                <p className="text-sm text-charcoal mt-2"><strong>Email:</strong> {user.email}</p>
                {/* Promo reset: visible only to superadmin (not customers) */}
                {isSuperAdmin() && (
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        if (!confirm('Reset this user\'s promo usage flags? This will allow using promo codes again.')) return
                        setResettingPromos(true)
                        try {
                          // remove userPromoUsage field from users/{uid}
                          await updateDoc(doc(db, 'users', user.uid), { userPromoUsage: deleteField() })
                          // delete history doc if exists
                          await deleteDoc(doc(db, 'userPromoUsage', user.uid))
                          alert('✅ User promo usage flags have been reset.')
                        } catch (err) {
                          console.error('Failed to reset promo flags:', err)
                          alert('❌ Failed to reset promo flags: ' + err.message)
                        } finally {
                          setResettingPromos(false)
                        }
                      }}
                      disabled={resettingPromos}
                      className="mt-3 px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 text-sm hover:bg-yellow-100 transition"
                    >
                      {resettingPromos ? 'Resetting...' : 'Reset promo flags'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-medium text-charcoal flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Saved Addresses
                  </h2>
                  <p className="text-rose-600 opacity-70 text-sm mt-1">Manage your delivery locations</p>
                </div>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blush-400 to-rose-400 text-white font-medium rounded-xl hover:from-blush-500 hover:to-rose-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Address
                </button>
              </div>

              {showAddressForm && (
                <div className="mb-8 bg-blush-50 p-6 rounded-2xl border border-blush-200">
                  <h3 className="text-lg font-medium text-charcoal mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <form onSubmit={handleAddressSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={addressForm.name}
                          onChange={onAddressChange}
                          required
                          className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          value={addressForm.pincode}
                          onChange={onAddressChange}
                          required
                          className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Street Address</label>
                      <textarea
                        name="street"
                        value={addressForm.street}
                        onChange={onAddressChange}
                        required
                        rows="3"
                        className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={addressForm.city}
                          onChange={onAddressChange}
                          required
                          className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={addressForm.state}
                          onChange={onAddressChange}
                          required
                          className="w-full px-4 py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={addressForm.isDefault}
                          onChange={onAddressChange}
                          className="h-4 w-4 text-blush-500 focus:ring-blush-300 border-blush-300 rounded"
                        />
                        <span className="ml-3 text-sm text-charcoal">Set as default address</span>
                      </label>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blush-400 to-rose-400 text-white font-medium rounded-xl hover:from-blush-500 hover:to-rose-500 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                          setAddressForm({
                            name: '',
                            street: '',
                            city: '',
                            state: '',
                            pincode: '',
                            isDefault: false
                          });
                        }}
                        className="px-6 py-3 bg-white border border-blush-200 text-charcoal font-medium rounded-xl hover:bg-blush-50 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="card p-12 text-center bg-white/60 backdrop-blur-sm">
                  <div className="w-20 h-20 mx-auto mb-6 bg-blush-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-blush-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-2xl text-charcoal mb-3">No Addresses Yet</h3>
                  <p className="text-rose-600 opacity-70 mb-6">Add your first delivery address to get started with your jewelry shopping!</p>
                  <div className="inline-flex items-center text-blush-500 font-medium">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add your first address
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="card p-6 bg-white/70 backdrop-blur-sm border border-blush-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-charcoal flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blush-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {address.name}
                            {address.isDefault && (
                              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blush-100 text-blush-600">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Default
                              </span>
                            )}
                          </h4>
                          <div className="mt-2 text-sm text-rose-600 opacity-80">
                            <p>{address.street}</p>
                            <p>{address.city}, {address.state} - {address.pincode}</p>
                          </div>
                        </div>
                        <div className="flex space-x-3 ml-4">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="text-blush-500 hover:text-blush-600 text-sm font-medium transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-rose-500 hover:text-rose-600 text-sm font-medium transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;