import React, { useState, useRef, useEffect } from 'react'

export default function VirtualTryOn({ product, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Face/body landmarks for positioning jewelry
  const [landmarks, setLandmarks] = useState(null)

  useEffect(() => {
    initializeCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const initializeCamera = async () => {
    try {
      setIsLoading(true)
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      streamRef.current = stream
      setHasPermission(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
          // Initialize face detection here (we'll use a simple overlay for now)
        }
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions to try on jewelry.')
      setIsLoading(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame
    ctx.drawImage(video, 0, 0)

    // Add jewelry overlay based on product type
    drawJewelryOverlay(ctx, canvas.width, canvas.height)

    // Convert to image and download
    const link = document.createElement('a')
    link.download = `${product.name}-virtual-try-on.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const drawJewelryOverlay = (ctx, width, height) => {
    const centerX = width / 2
    const centerY = height / 2

    // Simple positioning based on product category
    switch (product.category) {
      case 'earrings':
        // Draw earrings on both sides of face
        drawEarring(ctx, centerX - 80, centerY - 20) // Left ear
        drawEarring(ctx, centerX + 80, centerY - 20) // Right ear
        break
      
      case 'hair-clips':
        // Draw hair clip on top of head
        drawHairClip(ctx, centerX, centerY - 120)
        break
      
      case 'rings':
        // Draw ring on finger (we'll position it lower)
        drawRing(ctx, centerX - 50, centerY + 150)
        break
      
      default:
        break
    }
  }

  const drawEarring = (ctx, x, y) => {
    ctx.save()
    
    // Simple earring representation
    ctx.fillStyle = '#FFD700' // Gold color
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, 2 * Math.PI)
    ctx.fill()
    
    // Add some shine
    ctx.fillStyle = '#FFFF99'
    ctx.beginPath()
    ctx.arc(x - 2, y - 2, 3, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.restore()
  }

  const drawHairClip = (ctx, x, y) => {
    ctx.save()
    
    // Hair clip representation
    ctx.fillStyle = '#FF69B4' // Pink color
    ctx.fillRect(x - 20, y, 40, 8)
    
    // Add decorative elements
    ctx.fillStyle = '#FFB6C1'
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(x - 15 + (i * 15), y + 4, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
    
    ctx.restore()
  }

  const drawRing = (ctx, x, y) => {
    ctx.save()
    
    // Ring representation
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, 2 * Math.PI)
    ctx.stroke()
    
    // Add gem
    ctx.fillStyle = '#FF1493'
    ctx.beginPath()
    ctx.arc(x, y - 8, 4, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.restore()
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-4xl mx-4 w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">Virtual Try-On</h3>
            <p className="text-gray-600">Try {product.name} virtually</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p>Initializing camera...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Camera View */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 object-cover transform scale-x-[-1]" // Mirror effect
              />
              
              {/* Overlay Instructions */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
                📸 Position your {product.category === 'rings' ? 'hand' : 'face'} in the frame
              </div>
              
              {/* Product Info Overlay */}
              <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg text-sm">
                <div className="font-medium">{product.name}</div>
                <div className="text-gray-600 capitalize">{product.category}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Capture Photo
              </button>
              
              <button onClick={onClose} className="btn-outline">
                Close Try-On
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold mb-2">How to use Virtual Try-On:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Make sure you're in good lighting</li>
                <li>• {product.category === 'rings' ? 'Hold your hand steady in front of the camera' : 'Keep your face centered in the frame'}</li>
                <li>• Click "Capture Photo" to save your virtual try-on</li>
                <li>• Move slightly to see different angles</li>
              </ul>
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}