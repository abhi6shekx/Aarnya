import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function EditFeaturedCollection({ product, onClose, onSaved }) {
  const [featured, setFeatured] = useState(!!product?.featured)
  const [featuredSection, setFeaturedSection] = useState(product?.featuredSection || '')
  const [featuredOrder, setFeaturedOrder] = useState(product?.featuredOrder || 0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!product?.id) return
    setSaving(true)
    try {
      const productRef = doc(db, 'products', product.id)
      await updateDoc(productRef, {
        featured: !!featured,
        featuredSection: featuredSection || '',
        featuredOrder: Number(featuredOrder) || 0,
        updatedAt: new Date()
      })
      if (onSaved) onSaved()
    } catch (err) {
      console.error('Failed to save featured metadata:', err)
      alert('Failed to save featured settings: ' + err.message)
    } finally {
      setSaving(false)
      if (onClose) onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative z-10 shadow-xl">
        <h3 className="text-lg font-semibold text-charcoal mb-4">Edit Featured Settings</h3>
        <p className="text-sm text-muted mb-4">Adjust featured status and metadata for <strong>{product?.name}</strong>.</p>

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium">Mark as Featured</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Featured Section (optional)</label>
            <input value={featuredSection} onChange={(e) => setFeaturedSection(e.target.value)} placeholder="e.g. Holiday Picks" className="w-full px-3 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Featured Order (optional)</label>
            <input type="number" value={featuredOrder} onChange={(e) => setFeaturedOrder(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            <p className="text-xs text-muted mt-1">Lower numbers show earlier in lists. Leave 0 for default.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blush-500 text-white hover:bg-blush-600">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
