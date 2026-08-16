import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
// We'll dynamically import MediaPipe modules only when needed to avoid bundler/runtime issues
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Safe logging helpers to avoid runtime failures if `console.log` has been overridden
const safeLog = (...args) => {
  try {
    if (typeof console !== 'undefined' && typeof console.log === 'function') console.log(...args)
  } catch (e) { /* ignore logging errors */ }
}
const safeWarn = (...args) => {
  try {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') console.warn(...args)
  } catch (e) { /* ignore logging errors */ }
}
const safeError = (...args) => {
  try {
    if (typeof console !== 'undefined' && typeof console.error === 'function') console.error(...args)
  } catch (e) { /* ignore logging errors */ }
}

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
      if (!localProduct) {
        if (!routeProductId || routeProductId === 'sample' || routeProductId === 'demo') {
          setLocalProduct({
            id: 'sample',
            name: 'Sample Jewelry Creation',
            category: 'earrings',
            productType: 'earrings',
            virtualTryOnEnabled: true
          })
          return
        }
        try {
          const d = await getDoc(doc(db, 'products', routeProductId))
          if (d.exists()) {
            setLocalProduct({ id: d.id, ...d.data() })
          } else {
            // Fallback demo product if id not found in firestore
            setLocalProduct({
              id: routeProductId,
              name: 'Sample Jewelry Piece',
              category: 'earrings',
              productType: 'earrings',
              virtualTryOnEnabled: true
            })
          }
        } catch (err) {
          console.error('Failed to fetch product:', err)
          setLocalProduct({
            id: 'sample',
            name: 'Sample Jewelry Piece',
            category: 'earrings',
            productType: 'earrings',
            virtualTryOnEnabled: true
          })
        }
      }
    }

    let mounted = true

    ;(async () => {
      if (!mounted) return
      await tryFetchProduct()
    })()

    return () => {
      mounted = false
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(track => track.stop()) } catch (e) { /* ignore */ }
      }
      if (mpCameraRef.current && typeof mpCameraRef.current.stop === 'function') {
        try { mpCameraRef.current.stop() } catch (e) { /* ignore */ }
      }
      if (faceMeshRef.current && typeof faceMeshRef.current.close === 'function') {
        try { faceMeshRef.current.close() } catch (e) { /* ignore */ }
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
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
        safeLog('✅ Video element found, initializing camera...')
        if (!startedRef.current) {
          startedRef.current = true
          initializeCamera(localProduct)
        } else {
          safeLog('Initialization already started; skipping duplicate init')
        }
      } else {
        safeError('❌ Still no video element after waiting.')
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
        safeError('❌ Video element not found in DOM')
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
      safeLog('🎥 Requesting camera access...')
      let stream = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })
      } catch (firstErr) {
        safeWarn('Ideal getUserMedia failed, retrying with basic video constraint...', firstErr)
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        } catch (gmErr) {
          safeWarn('getUserMedia failed', gmErr)
          let userMessage = 'Failed to access camera.'
          if (gmErr.name === 'NotAllowedError' || gmErr.name === 'SecurityError' || gmErr.name === 'PermissionDeniedError') {
            userMessage = 'Camera permission was denied or blocked. Please enable camera permission in your browser settings and click Retry.'
          } else if (gmErr.name === 'NotFoundError' || gmErr.name === 'DevicesNotFoundError') {
            userMessage = 'No camera device found. Please connect a camera and click Retry.'
          } else if (gmErr.name === 'NotReadableError' || gmErr.name === 'TrackStartError') {
            userMessage = 'Camera is in use by another application. Close other camera apps and click Retry.'
          } else if (gmErr.name === 'OverconstrainedError' || gmErr.name === 'ConstraintNotSatisfiedError') {
            userMessage = 'Unable to satisfy camera constraints. Click Retry to re-initialize.'
          }

          setError(userMessage)
          setIsLoading(false)

          try {
            if (navigator.permissions && navigator.permissions.query) {
              const p = await navigator.permissions.query({ name: 'camera' })
              safeLog('Permissions camera state:', p.state)
              const onPermChange = () => {
                safeLog('Permissions change detected:', p.state)
                if (p.state === 'granted') {
                  setTimeout(() => {
                    initializeCamera(initialProduct)
                  }, 500)
                }
              }
              p.addEventListener('change', onPermChange)
              initTimeoutRef.current = () => p.removeEventListener('change', onPermChange)
            }
          } catch (permErr) {
            safeWarn('Permissions API query failed:', permErr)
          }

          return
        }
      }

      streamRef.current = stream
  setHasPermission(true)
  safeLog('🎥 Camera stream obtained')
  try { safeLog('✅ Camera stream granted:', !!stream && !!stream.active) } catch (e) {}
      // reset retry counter on success
      retryCountRef.current = 0

      // attach stream to video element
      // remove prior event handlers to avoid duplicate calls
      try { video.onloadedmetadata = null } catch (e) {}
      try { video.onplaying = null } catch (e) {}
  video.srcObject = stream
  safeLog('🎬 video.srcObject set')

      // Try to start playback immediately; some browsers require an explicit play()
      (async () => {
        try {
          safeLog('▶️ Attempting video.play() immediately after attaching srcObject')
          await video.play()
          safeLog('✅ video.play() succeeded (immediate)')
        } catch (playErr) {
          safeWarn('video.play() immediate attempt failed:', playErr)
        }
      })()

      // Ensure playing/loaded handlers are set — this mirrors the snippet you provided
      video.onloadedmetadata = async () => {
  safeLog('🔔 video.onloadedmetadata')
        try {
          await video.play()
        } catch (playErr) {
          safeWarn('video.play() failed or was blocked:', playErr)
        }

        // mark ready
        setIsLoading(false)

        // start MediaPipe only when requested and appropriate for product
        const productToUse = initialProduct || localProduct
        if (useFaceMesh && productToUse?.category === 'earrings') {
            try {
                // Load MediaPipe FaceMesh and CameraUtils from CDN to avoid bundler url(...) issues
                // (Vite + ESM dynamic import can break Mediapipe's internal url handling when bundled)
                const loadScript = (src) => new Promise((resolve, reject) => {
                  // If script already present, resolve immediately
                  if (document.querySelector(`script[src="${src}"]`)) return resolve()
                  const s = document.createElement('script')
                  s.src = src
                  s.async = true
                  s.onload = () => resolve()
                  s.onerror = (e) => reject(new Error(`Failed to load script: ${src}`))
                  document.body.appendChild(s)
                })

                try {
                  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js')
                  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
                } catch (loadErr) {
                  safeWarn('Failed to load MediaPipe scripts from CDN', loadErr)
                  throw loadErr
                }

                // MediaPipe exposes constructors on window when loaded from CDN
                const FaceMeshClass = window.FaceMesh
                const CameraClass = window.Camera

                if (!FaceMeshClass || !CameraClass) {
                  throw new Error('MediaPipe classes not found on window after script load')
                }

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
              safeLog('🚀 Starting MediaPipe camera...')
            } catch (startErr) {
              safeError('MediaPipe Camera start failed, falling back to video-only mode', startErr)
            }
          } catch (mpErr) {
            safeError('Failed to initialize MediaPipe FaceMesh', mpErr)
          }
        } // end if useFaceMesh && product is earrings
      } // end video.onloadedmetadata
    } catch (err) {
      safeError('initializeCamera failed', err)
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

  const capturePhoto = () => {
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const width = video.videoWidth || 640
      const height = video.videoHeight || 480
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // The video element is mirrored via CSS (scaleX(-1)). To capture the same mirrored view,
      // flip the canvas horizontally before drawing the video frame.
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -width, 0, width, height)
      ctx.restore()

      // If product overlay drawing is desired, we could draw overlays here using drawEarring/drawRing etc.

      // Draw product overlays onto the captured canvas so the saved snapshot includes them.
      try {
        const category = (localProduct && localProduct.category) ? localProduct.category : null
        const centerX = width / 2
        const centerY = height / 2
        // use proportional offsets so overlays scale with video size
        const offsetX = Math.round(width * 0.12)
        const offsetY = Math.round(height * 0.12)

        switch (category) {
          case 'earrings':
            // approximate ear positions relative to center
            drawEarring(ctx, centerX - offsetX, centerY - offsetY)
            drawEarring(ctx, centerX + offsetX, centerY - offsetY)
            break
          case 'hair-clips':
            drawHairClip(ctx, centerX, centerY - Math.round(height * 0.28))
            break
          case 'rings':
            drawRing(ctx, centerX + Math.round(width * 0.18), centerY + Math.round(height * 0.32))
            break
          default:
            // no overlay
            break
        }
      } catch (overlayErr) {
        console.warn('Failed to draw overlay on capture:', overlayErr)
      }

      // Convert to data URL and trigger download
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${(localProduct && localProduct.name) ? localProduct.name.replace(/\s+/g, '_') : 'tryon'}_snapshot.png`
      document.body.appendChild(a)
      a.click()
      a.remove()

      // small UI feedback
      setIsRecording(true)
      setTimeout(() => setIsRecording(false), 700)
    } catch (err) {
      console.error('capturePhoto failed', err)
      setError('Failed to capture photo')
    }
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h3 className="font-display text-2xl font-bold text-charcoal">
            Camera Connection
          </h3>
          
          <p className="text-sm text-gray-600 font-light leading-relaxed">
            {error}
          </p>

          <div className="flex flex-col gap-2.5 pt-2">
            <button 
              onClick={() => {
                setError('')
                setIsLoading(true)
                startedRef.current = false
                initializeCamera()
              }} 
              className="btn-primary w-full py-3 text-xs font-bold shadow-soft"
            >
              🔄 Retry Camera Stream
            </button>
            <button 
              onClick={handleClose} 
              className="btn-outline w-full py-2.5 text-xs font-semibold"
            >
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
              onClick={() => { if (typeof capturePhoto === 'function') capturePhoto() }}
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