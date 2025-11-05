import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
// We'll dynamically import MediaPipe modules only when needed to avoid bundler/runtime issues
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function VirtualTryOn({ product: propProduct, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  // default ML off for better compatibility on low-power devices; user can enable it
  const [useFaceMesh, setUseFaceMesh] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const earringRef = useRef(null)
  const mpCameraRef = useRef(null)
  const faceMeshRef = useRef(null)
  const initTimeoutRef = useRef(null)
  const retryCountRef = useRef(0)
  const startedRef = useRef(false)
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()

  const routeProductId = params.id || params.productId || (params.productId && params.productId.toString())
  const [localProduct, setLocalProduct] = useState(propProduct || location.state?.product || null)

  // Face/body landmarks for positioning jewelry
  const [landmarks, setLandmarks] = useState(null)

  useEffect(() => {
    // If product is not provided via props/state but an id param is present, fetch it
    const tryFetchProduct = async () => {
      if (!localProduct && routeProductId) {
        try {
          const d = await getDoc(doc(db, 'products', routeProductId))
          if (d.exists()) {
            setLocalProduct({ id: d.id, ...d.data() })
          } else {
            setError('Product not found')
          }
        } catch (err) {
          console.error('Failed to fetch product:', err)
          setError('Failed to load product')
        }
      }
    }

    let mounted = true

    ;(async () => {
      if (!mounted) return
      await tryFetchProduct()
      // DO NOT call initializeCamera here — wait until the video element is mounted
    })()

    return () => {
      mounted = false
      // Stop any active media stream
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(track => track.stop()) } catch (e) { /* ignore */ }
      }
      // Stop mediapipe camera if used
      if (mpCameraRef.current && typeof mpCameraRef.current.stop === 'function') {
        try { mpCameraRef.current.stop() } catch (e) { /* ignore */ }
      }
      // Close faceMesh
      if (faceMeshRef.current && typeof faceMeshRef.current.close === 'function') {
        try { faceMeshRef.current.close() } catch (e) { /* ignore */ }
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
      // allow re-initialization if component remounts
      try { startedRef.current = false } catch (e) {}
    }
  }, [])

  // Wait until the video element is actually mounted in the DOM before initializing camera
  // Run once on mount and start initialization only once (guarded by startedRef)
  useEffect(() => {
    let cancelled = false

    const waitForVideo = async () => {
      let retries = 0
      // wait up to ~5s for the video element to appear
      while (!videoRef.current && retries < 25 && !cancelled) {
        await new Promise((res) => setTimeout(res, 200))
        retries++
      }

      if (cancelled) return

      if (videoRef.current) {
        console.log('✅ Video element found, initializing camera...')
        if (!startedRef.current) {
          startedRef.current = true
          initializeCamera(localProduct)
        } else {
          console.log('Initialization already started; skipping duplicate init')
        }
      } else {
        console.error('❌ Still no video element after waiting.')
        setError('Internal error: video element not found after mounting.')
      }
    }

    waitForVideo()

    return () => { cancelled = true }
  }, [])

  // Close on Escape key for convenience
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleClose = () => {
    if (typeof onClose === 'function') return onClose()
    // if no onClose passed (route-based), navigate back
    try {
      navigate(-1)
    } catch (e) {
      navigate('/')
    }
  }

  const initializeCamera = async (initialProduct = null) => {
    try {
      // mark that initialization has started to avoid duplicates
      startedRef.current = true
      setIsLoading(true)
      setError('')

      const video = videoRef.current
      if (!video) {
        console.error('❌ Video element not found in DOM')
        setError('Internal error: video element not found')
        setIsLoading(false)
        return
      }

      // stop any previous mp camera / faceMesh before creating a new stream
      try {
        if (mpCameraRef.current && typeof mpCameraRef.current.stop === 'function') mpCameraRef.current.stop()
      } catch (e) { /* ignore */ }
      try {
        if (faceMeshRef.current && typeof faceMeshRef.current.close === 'function') faceMeshRef.current.close()
      } catch (e) { /* ignore */ }

      // Request camera permission and stream
      console.log('🎥 Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      streamRef.current = stream
      setHasPermission(true)
      console.log('🎥 Camera stream obtained')
      try { console.log('✅ Camera stream granted:', !!stream && !!stream.active) } catch (e) {}
      // reset retry counter on success
      retryCountRef.current = 0

      // attach stream to video element
      // remove prior event handlers to avoid duplicate calls
      try { video.onloadedmetadata = null } catch (e) {}
      try { video.onplaying = null } catch (e) {}
      video.srcObject = stream
      console.log('🎬 video.srcObject set')

      // Try to start playback immediately; some browsers require an explicit play()
      (async () => {
        try {
          console.log('▶️ Attempting video.play() immediately after attaching srcObject')
          await video.play()
          console.log('✅ video.play() succeeded (immediate)')
        } catch (playErr) {
          console.warn('video.play() immediate attempt failed:', playErr)
        }
      })()

      // Ensure playing/loaded handlers are set — this mirrors the snippet you provided
      video.onloadedmetadata = async () => {
        console.log('🔔 video.onloadedmetadata')
        try {
          await video.play()
        } catch (playErr) {
          console.warn('video.play() failed or was blocked:', playErr)
        }

        // mark ready
        setIsLoading(false)

        // start MediaPipe only when requested and appropriate for product
        const productToUse = initialProduct || localProduct
        if (useFaceMesh && productToUse?.category === 'earrings') {
          try {
            const mp = await import('@mediapipe/face_mesh')
            const camUtil = await import('@mediapipe/camera_utils')
            const FaceMeshClass = mp.FaceMesh
            const CameraClass = camUtil.Camera

            const faceMesh = new FaceMeshClass({
              locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            })

            faceMesh.setOptions({
              maxNumFaces: 1,
              refineLandmarks: true,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5,
            })

            faceMesh.onResults((results) => {
              if (results.multiFaceLandmarks && results.multiFaceLandmarks[0] && videoRef.current) {
                const landmarks = results.multiFaceLandmarks[0]
                const leftEar = landmarks[234]
                const videoEl = videoRef.current
                const earring = earringRef.current
                if (leftEar && videoEl && earring) {
                  const x = leftEar.x * videoEl.videoWidth
                  const y = leftEar.y * videoEl.videoHeight
                  earring.style.left = `${x - 20}px`
                  earring.style.top = `${y - 20}px`
                }
              }
            })

            faceMeshRef.current = faceMesh
            const mpCamera = new CameraClass(video, {
              onFrame: async () => {
                try {
                  await faceMesh.send({ image: video })
                } catch (e) {
                  // ignore send errors
                }
              },
              width: 640,
              height: 480,
            })

            mpCameraRef.current = mpCamera
            try {
              mpCamera.start()
              console.log('🚀 Starting MediaPipe camera...')
            } catch (startErr) {
              console.error('MediaPipe Camera start failed, falling back to video-only mode', startErr)
            }
          } catch (mpErr) {
            console.error('Failed to initialize MediaPipe FaceMesh', mpErr)
          }
        } // end if useFaceMesh && product is earrings
      } // end video.onloadedmetadata
    } catch (err) {
      console.error('initializeCamera failed', err)
      setError('Failed to initialize camera')
      setIsLoading(false)
      startedRef.current = false
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
            <button onClick={handleClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onMouseDown={(e) => {
        // if user clicked on backdrop (not the modal), close
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-4xl mx-4 w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">Virtual Try-On</h3>
                <p className="text-gray-600">Try {localProduct?.name || 'this item'} virtually</p>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Camera View - always render the video element so refs are available */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-96 object-cover transform scale-x-[-1]" // Mirror effect
            />

            {/* Spinner overlay while initializing */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                <div>Initializing camera...</div>
              </div>
            )}

            {/* Overlay Instructions */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
              📸 Position your {localProduct?.category === 'rings' ? 'hand' : 'face'} in the frame
            </div>

            {/* Product Info Overlay */}
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg text-sm">
              <div className="font-medium">{localProduct?.name || '—'}</div>
              <div className="text-gray-600 capitalize">{localProduct?.category || ''}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="btn-primary flex items-center gap-2"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Capture Photo
            </button>

            <button onClick={handleClose} className="btn-outline">
              Close Try-On
            </button>
          </div>

          {/* Retry / ML toggle */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              onClick={() => {
                setError('')
                setIsLoading(true)
                try {
                  if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
                  if (mpCameraRef.current && typeof mpCameraRef.current.stop === 'function') mpCameraRef.current.stop()
                  if (faceMeshRef.current && typeof faceMeshRef.current.close === 'function') faceMeshRef.current.close()
                } catch (e) { /* ignore */ }
                streamRef.current = null
                mpCameraRef.current = null
                faceMeshRef.current = null
                // ensure we wait for video in case it's not yet mounted
                (async () => {
                  let retries = 0
                  while (!videoRef.current && retries < 15) { await new Promise(r => setTimeout(r, 200)); retries++ }
                  initializeCamera()
                })()
              }}
              className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
            >
              Retry camera
            </button>

            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useFaceMesh} onChange={(e)=>setUseFaceMesh(e.target.checked)} className="w-4 h-4" />
              Use ML placement
            </label>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold mb-2">How to use Virtual Try-On:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Make sure you're in good lighting</li>
              <li>• {localProduct?.category === 'rings' ? 'Hold your hand steady in front of the camera' : 'Keep your face centered in the frame'}</li>
              <li>• Click "Capture Photo" to save your virtual try-on</li>
              <li>• Move slightly to see different angles</li>
            </ul>
          </div>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}