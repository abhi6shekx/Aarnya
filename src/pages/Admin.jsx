import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, deleteField } from 'firebase/firestore'
import { getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { 
  GENDER_CATEGORIES, 
  PRODUCT_TYPES, 
  RING_SIZES,
  VIRTUAL_TRY_ON_COMPATIBLE,
  GENDER_PRODUCT_MATRIX,
  CATEGORY_ICONS,
  GENDER_ICONS
} from '../lib/categories'

function AdminContent() {
  const { 
    user, 
    userRole, 
    isSuperAdmin,
    canManageProducts, 
    canDeleteProducts, 
    canManageUsers,
    canManageRole,
    getRoleLevel 
  } = useAuth()
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [fullDesc, setFullDesc] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [showUserManagement, setShowUserManagement] = useState(false)
  
  // Edit mode state
  const [editProduct, setEditProduct] = useState(null)

  // New enhanced product fields
  const [gender, setGender] = useState('')
  const [productType, setProductType] = useState('')
  const [availableSizes, setAvailableSizes] = useState([])
  const [virtualTryOnEnabled, setVirtualTryOnEnabled] = useState(false)
  // Shipping dimensions
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [breadth, setBreadth] = useState('')
  const [height, setHeight] = useState('')

  // Fetch users for admin management
  const fetchUsers = async () => {
    if (!canManageUsers()) return
    
    try {
      const snap = await getDocs(collection(db, 'users'))
      const userList = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setUsers(userList)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const snap = await getDocs(collection(db, 'products'))
      const productList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log('Products loaded:', productList);
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  useEffect(() => {
    fetchProducts()
    if (canManageUsers()) {
      fetchUsers()
    }
  }, [canManageUsers])

  // Shipping config (admin only)
  const [pickupPin, setPickupPin] = useState('')
  const [shippingConfigLoading, setShippingConfigLoading] = useState(false)

  const fetchShippingConfig = async () => {
    if (!canManageUsers()) return
    setShippingConfigLoading(true)
    try {
      const docRef = doc(db, 'config', 'shipping')
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const data = snap.data()
        setPickupPin(data.pickupPin || '')
      } else {
        setPickupPin('')
      }
    } catch (err) {
      console.error('Failed to load shipping config', err)
    } finally {
      setShippingConfigLoading(false)
    }
  }

  useEffect(() => {
    if (canManageUsers()) fetchShippingConfig()
  }, [canManageUsers])

  const handleFileChange = (e) => {
    setFiles([...e.target.files])
  }

  const uploadAllImages = async () => {
    const imageData = []
    for (const file of files) {
      const result = await uploadToCloudinary(file, import.meta.env.VITE_CLOUDINARY_PRESET_PRODUCTS)
      imageData.push(result) // Now stores { url, publicId }
    }
    return imageData
  }

  const addProduct = async () => {
    if (!canManageProducts()) {
      alert('❌ You do not have permission to add products')
      return
    }

    try {
      setLoading(true)
      const imageData = await uploadAllImages()

      await addDoc(collection(db, 'products'), {
        name,
        price: parseFloat(price),
          weight: parseFloat(weight) || 0,
          length: parseFloat(length) || 0,
          breadth: parseFloat(breadth) || 0,
          height: parseFloat(height) || 0,
        category,
        shortDesc,
        fullDesc,
        images: imageData, // Now stores [{ url, publicId }, ...]
        // New enhanced fields
        gender,
        productType,
        availableSizes: productType === 'rings' ? availableSizes : [],
        virtualTryOnEnabled: VIRTUAL_TRY_ON_COMPATIBLE.includes(productType) ? virtualTryOnEnabled : false,
        createdAt: new Date(),
        createdBy: user.uid,
        createdByRole: userRole
      })

      alert('✅ Product added successfully!')
      clearForm()
      fetchProducts()
    } catch (err) {
      console.error(err)
      alert('❌ Error uploading product')
    } finally {
      setLoading(false)
    }
  }

  // Function to handle product editing
  const handleEdit = (product) => {
    console.log('Editing product:', product)
    setEditProduct(product)
    setName(product.name || '')
    setPrice(product.price?.toString() || '')
    setCategory(product.category || '')
    setShortDesc(product.shortDesc || '')
    setFullDesc(product.fullDesc || '')
    setGender(product.gender || '')
    setProductType(product.productType || '')
    setAvailableSizes(product.availableSizes || [])
    setVirtualTryOnEnabled(product.virtualTryOnEnabled || false)
    setWeight(product.weight?.toString?.() || product.weight || '')
    setLength(product.length?.toString?.() || product.length || '')
    setBreadth(product.breadth?.toString?.() || product.breadth || '')
    setHeight(product.height?.toString?.() || product.height || '')
    setFiles([])
    console.log('Edit mode set, editProduct:', product.name)
    
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Function to update existing product
  const handleUpdate = async () => {
    if (!canManageProducts()) {
      alert('❌ You do not have permission to update products')
      return
    }

    try {
      setLoading(true)
      
      let imageData = editProduct.images || []
      
      // If new files are selected, upload them
      if (files.length > 0) {
        imageData = await uploadAllImages()
      }

      const productRef = doc(db, "products", editProduct.id)
      await updateDoc(productRef, {
        name,
        price: parseFloat(price),
        category,
        shortDesc,
        fullDesc,
        images: imageData,
        gender,
        productType,
        availableSizes: productType === 'rings' ? availableSizes : [],
        virtualTryOnEnabled: VIRTUAL_TRY_ON_COMPATIBLE.includes(productType) ? virtualTryOnEnabled : false,
        updatedAt: new Date(),
        updatedBy: user.uid,
        weight: parseFloat(weight) || 0,
        length: parseFloat(length) || 0,
        breadth: parseFloat(breadth) || 0,
        height: parseFloat(height) || 0
      })

      alert('✅ Product updated successfully!')
      setEditProduct(null)
      clearForm()
      fetchProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      alert('❌ Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  // Function to clear form
  const clearForm = () => {
    setName('')
    setPrice('')
    setCategory('')
    setShortDesc('')
    setFullDesc('')
    setFiles([])
    setGender('')
    setProductType('')
    setAvailableSizes([])
    setVirtualTryOnEnabled(false)
    setWeight('')
    setLength('')
    setBreadth('')
    setHeight('')
  }

  // Function to cancel edit
  const cancelEdit = () => {
    setEditProduct(null)
    clearForm()
  }

  // Helper functions for enhanced product management
  const handleSizeToggle = (size) => {
    setAvailableSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size)
      } else {
        return [...prev, size]
      }
    })
  }

  const getAvailableProductTypes = () => {
    if (!gender) return []
    return GENDER_PRODUCT_MATRIX[gender] || []
  }

  const isVirtualTryOnAvailable = () => {
    return VIRTUAL_TRY_ON_COMPATIBLE.includes(productType)
  }

  const deleteProduct = async (id, productImages) => {
    if (!canDeleteProducts()) {
      alert('❌ You do not have permission to delete products')
      return
    }

    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      // First delete from database
      await deleteDoc(doc(db, 'products', id))
      
      // Then delete images from Cloudinary (non-blocking)
      if (productImages && productImages.length > 0) {
        productImages.forEach(async (image) => {
          if (image.publicId) {
            await deleteFromCloudinary(image.publicId)
          }
        })
      }
      
      alert('✅ Product deleted successfully!')
      fetchProducts()
    } catch (err) {
      console.error('Delete error:', err)
      alert('❌ Error deleting product')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 to-rose-100" style={{fontFamily: 'Playfair Display, serif'}}>
      <div className="container-base px-4 sm:px-6 md:px-12 py-8 sm:py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-blush-500 to-rose-500 bg-clip-text text-transparent" style={{fontFamily: 'Great Vibes, cursive'}}>
            {editProduct ? `Editing: ${editProduct.name}` : 'Admin Panel'}
          </h1>
          <p className="text-rose-700 text-lg mt-4 opacity-70">
            {editProduct ? 'Update your jewelry product details' : 'Manage your beautiful jewelry collection'}
          </p>
        </div>

  <div className="card p-6 sm:p-8 space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blush-600 bg-blush-50 p-3 rounded-xl">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                {editProduct ? `Editing: ${editProduct.name}` : 'Using Cloudinary for secure image management'}
              </span>
            </div>
            {editProduct && (
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Product Name</label>
                <input
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Price (INR)</label>
                <input
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Weight (kg)</label>
                <input
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="e.g. 0.08"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
                <input
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Handmade, Ready-made, etc."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Short Description</label>
                <textarea
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Brief product description"
                  rows="3"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Full Description</label>
                <textarea
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Detailed product description"
                  rows="4"
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Length (cm)</label>
                  <input className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-blush-200 rounded-xl" placeholder="e.g. 10" value={length} onChange={(e)=>setLength(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Breadth (cm)</label>
                  <input className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-blush-200 rounded-xl" placeholder="e.g. 7" value={breadth} onChange={(e)=>setBreadth(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Height (cm)</label>
                  <input className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-blush-200 rounded-xl" placeholder="e.g. 3" value={height} onChange={(e)=>setHeight(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* New Product Categorization Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Gender Category</label>
                <select
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender Category</option>
                  {GENDER_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Product Type</label>
                <select
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                >
                  <option value="">Select Product Type</option>
                  {PRODUCT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {productType === 'rings' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Available Ring Sizes</label>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {RING_SIZES.map(size => (
                      <label key={size} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={availableSizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAvailableSizes([...availableSizes, size]);
                            } else {
                              setAvailableSizes(availableSizes.filter(s => s !== size));
                            }
                          }}
                          className="mr-2 text-blush-500 focus:ring-blush-300"
                        />
                        <span className="text-sm">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="virtualTryOn"
                  checked={virtualTryOnEnabled}
                  onChange={(e) => setVirtualTryOnEnabled(e.target.checked)}
                  className="w-4 h-4 text-blush-500 focus:ring-blush-300 rounded"
                />
                <label htmlFor="virtualTryOn" className="text-sm font-medium text-charcoal">
                  Enable Virtual Try-On
                  {VIRTUAL_TRY_ON_COMPATIBLE.includes(productType) ? (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Compatible</span>
                  ) : productType && (
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Not Compatible</span>
                  )}
                </label>
              </div>
            </div>
          </div>

            <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Product Images</label>
            <input
              type="file"
              multiple
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-blush-200 rounded-xl focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blush-100 file:text-blush-600 hover:file:bg-blush-200"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Select multiple high-quality images for your product
            </p>
          </div>

          <button
            onClick={editProduct ? handleUpdate : addProduct}
            disabled={loading}
            className="btn-primary w-full py-3 sm:py-4 text-base sm:text-lg font-medium relative overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {editProduct ? 'Updating Product...' : 'Uploading Product...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  {editProduct ? (
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  )}
                </svg>
                {editProduct ? 'Save Changes' : 'Add New Product'}
              </div>
            )}
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="h2 text-charcoal">Current Collection</h2>
          <p className="text-muted mt-2">Manage your beautiful jewelry pieces</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((p) => (
            <div key={p.id} className="card group overflow-hidden relative">
              {/* Delete Button - Top Right */}
              <button
                onClick={() => deleteProduct(p.id, p.images)}
                className="absolute top-3 left-3 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 opacity-80 hover:opacity-100"
                title="Delete Product"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="relative overflow-hidden rounded-t-2xl">
                <img 
                  src={p.images?.[0]?.url || p.images?.[0]} 
                  alt={p.name} 
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute top-3 right-3 flex flex-col gap-1">
                  <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-blush-600">
                    {p.category}
                  </span>
                  {p.gender && (
                    <span className="bg-purple-100/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-purple-600">
                      {GENDER_ICONS[p.gender]} {p.gender}
                    </span>
                  )}
                  {p.productType && (
                    <span className="bg-blue-100/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-blue-600">
                      {CATEGORY_ICONS[p.productType]} {p.productType}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="font-display text-xl text-charcoal mb-2 line-clamp-2">{p.name}</h3>
                <p className="text-2xl font-bold text-blush-500 mb-3">₹{p.price?.toLocaleString()}</p>
                <p className="text-sm text-muted mb-4 line-clamp-2">{p.shortDesc}</p>
                
                {/* Enhanced Product Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.virtualTryOnEnabled && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      📸 Virtual Try-On
                    </span>
                  )}
                  {p.productType === 'rings' && p.availableSizes?.length > 0 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                      Sizes: {p.availableSizes.length}
                    </span>
                  )}
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
                    </svg>
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id, p.images)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {!products.length && (
            <div className="col-span-full">
              <div className="card p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-blush-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blush-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="h3 text-charcoal mb-3">No Products Yet</h3>
                <p className="text-muted mb-6">Start building your beautiful jewelry collection by adding your first product above!</p>
                <div className="inline-flex items-center text-blush-500 font-medium">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add your first product
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Management Section - SuperAdmin Only */}
        {canManageUsers() && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="h2 text-charcoal flex items-center gap-2">
                  👑 User Management 
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">SuperAdmin Only</span>
                </h2>
                <p className="text-muted mt-1">Manage user roles and permissions across the platform</p>
              </div>
              <button
                onClick={() => {
                  setShowUserManagement(!showUserManagement)
                  if (!showUserManagement) fetchUsers()
                }}
                className="btn-secondary"
              >
                {showUserManagement ? 'Hide Users' : 'Manage Users'}
              </button>
            </div>

            {showUserManagement && (
              <div className="space-y-6">
                {/* Shipping config card */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal">Shipping Configuration</h3>
                      <p className="text-sm text-muted">Set your pickup / warehouse pincode used for courier estimates</p>
                    </div>
                    <div>
                      <button onClick={fetchShippingConfig} className="btn-secondary mr-3">Reload</button>
                      <button
                        onClick={async () => {
                          if (!canManageUsers()) return alert('No permission')
                          try {
                            await setDoc(doc(db, 'config', 'shipping'), { pickupPin }, { merge: true })
                            alert('✅ Shipping config saved')
                          } catch (err) {
                            console.error('Save shipping config failed', err)
                            alert('Failed to save')
                          }
                        }}
                        className="btn-primary"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Pickup Pincode</label>
                      <input value={pickupPin} onChange={(e)=>setPickupPin(e.target.value)} className="w-full px-3 py-2 border border-blush-200 rounded-xl" placeholder="e.g. 110059" />
                    </div>
                  </div>
                </div>
                {/* Role Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['superadmin', 'admin', 'manager', 'staff', 'customer'].map(role => {
                    const count = users.filter(u => (u.role || 'customer') === role).length
                    const colors = {
                      superadmin: 'bg-purple-100 text-purple-700 border-purple-300',
                      admin: 'bg-red-100 text-red-700 border-red-300',
                      manager: 'bg-blue-100 text-blue-700 border-blue-300',
                      staff: 'bg-green-100 text-green-700 border-green-300',
                      customer: 'bg-gray-100 text-gray-700 border-gray-300'
                    }
                    return (
                      <div key={role} className={`p-4 rounded-lg border text-center ${colors[role]}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm font-medium capitalize">{role}{count !== 1 ? 's' : ''}</div>
                      </div>
                    )
                  })}
                </div>

                {/* User Table */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-charcoal">All Users ({users.length})</h3>
                    <div className="text-sm text-muted">
                      Click on role dropdowns to promote/demote users
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-blush-200">
                          <th className="pb-3 text-charcoal font-semibold">User</th>
                          <th className="pb-3 text-charcoal font-semibold">Email</th>
                          <th className="pb-3 text-charcoal font-semibold">Role</th>
                          <th className="pb-3 text-charcoal font-semibold">Joined</th>
                          <th className="pb-3 text-charcoal font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <UserRow key={u.id} user={u} onUserUpdate={fetchUsers} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// User row component for role management
function UserRow({ user, onUserUpdate }) {
  const { updateUserRole, canManageRole, isSuperAdmin, userRole: currentUserRole } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleRoleChange = async (newRole) => {
    // Prevent self-demotion from superadmin
    if (user.id === auth.currentUser?.uid && user.role === 'superadmin' && newRole !== 'superadmin') {
      if (!confirm('⚠️ WARNING: You are about to remove your own superadmin privileges. This action cannot be undone by yourself. Are you absolutely sure?')) {
        return
      }
    }

    // Check if current user can manage this role change
    if (!canManageRole(user.role) || !canManageRole(newRole)) {
      alert('❌ You do not have permission to change this user\'s role')
      return
    }

    setIsUpdating(true)
    try {
      const result = await updateUserRole(user.id, newRole)
      if (result.success) {
        alert(`✅ Role updated to ${newRole}`)
        onUserUpdate()
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ Error updating role: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  // Get available roles based on current user's permissions
  const getAvailableRoles = () => {
    const allRoles = ['customer', 'staff', 'manager', 'admin']
    if (isSuperAdmin()) {
      allRoles.push('superadmin')
    }
    
    // Filter roles based on what current user can manage
    return allRoles.filter(role => canManageRole(role))
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-700 border border-purple-300'
      case 'admin': return 'bg-red-100 text-red-700 border border-red-300'
      case 'manager': return 'bg-blue-100 text-blue-700 border border-blue-300'
      case 'staff': return 'bg-green-100 text-green-700 border border-green-300'
      default: return 'bg-gray-100 text-gray-600 border border-gray-300'
    }
  }

  return (
    <tr className="border-b border-blush-100 hover:bg-blush-25 transition-colors">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            user.role === 'superadmin' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
            user.role === 'admin' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            user.role === 'manager' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
            user.role === 'staff' ? 'bg-gradient-to-r from-green-500 to-green-600' :
            'bg-gradient-to-r from-gray-400 to-gray-500'
          }`}>
            {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-charcoal">{user.displayName || 'No Name'}</div>
            <div className="text-xs text-gray-500">
              {user.id === auth.currentUser?.uid && '(You)'}
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 text-muted">{user.email}</td>
      <td className="py-4">
        <select
          value={user.role || 'customer'}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={isUpdating || !canManageRole(user.role)}
          className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blush-300 focus:border-transparent transition-all ${
            !canManageRole(user.role) 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
              : 'border-blush-200 hover:border-blush-300'
          }`}
        >
          {getAvailableRoles().map(role => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
        {!canManageRole(user.role) && (
          <div className="text-xs text-gray-500 mt-1">Cannot modify this role</div>
        )}
      </td>
      <td className="py-4 text-sm text-muted">
        {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
      </td>
      <td className="py-4">
        {isUpdating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500"></div>
            <span className="text-sm text-gray-500">Updating...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
              {(user.role || 'customer').charAt(0).toUpperCase() + (user.role || 'customer').slice(1)}
            </span>
            {user.role === 'superadmin' && (
              <span className="text-xs text-purple-600">👑</span>
            )}
            {user.id === auth.currentUser?.uid && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">You</span>
            )}
            {/* Superadmin-only promo reset action */}
            {isSuperAdmin() && (
              <button
                onClick={async () => {
                  if (!confirm(`Reset promo flags for ${user.displayName || user.email}? This will remove any promo usage markers for this user.`)) return
                  setIsResetting(true)
                  try {
                    // Remove promo flags on users/{uid} if present
                    await updateDoc(doc(db, 'users', user.id), { userPromoUsage: deleteField() })
                    // Remove the central usage history doc if it exists
                    await deleteDoc(doc(db, 'userPromoUsage', user.id))
                    alert('✅ Promo flags reset for user')
                    onUserUpdate()
                  } catch (err) {
                    console.error('Error resetting promo flags:', err)
                    alert('❌ Failed to reset promo flags: ' + err.message)
                  } finally {
                    setIsResetting(false)
                  }
                }}
                className="ml-3 px-3 py-1 rounded-lg text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-all"
                disabled={isResetting}
                title="Superadmin: reset this user's promo usage flags"
              >
                {isResetting ? 'Resetting...' : 'Reset Promos'}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

export default function Admin() {
  const { user, canManageProducts, loading } = useAuth()
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-rose-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If user is not logged in or doesn't have admin permissions, redirect to home
  if (!user || !canManageProducts()) {
    return <Navigate to="/" replace />
  }
  
  // If user has permissions, show admin content
  return <AdminContent />
}
