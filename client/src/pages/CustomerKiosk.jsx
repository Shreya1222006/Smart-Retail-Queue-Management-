import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import ReceiptModal from '../components/ReceiptModal.jsx'
import AuthModal from '../components/AuthModal.jsx'

const API    = 'http://localhost:5000/api'
const CV_API = 'http://localhost:8000'

export default function CustomerKiosk() {
  // ── State ──────────────────────────────────────────────
  const [products, setProducts]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [cart, setCart]                     = useState([])
  const [cameraOn, setCameraOn]             = useState(false)
  const [scanning, setScanning]             = useState(false)
  const [cvStatus, setCvStatus]             = useState('')
  const [completedOrder, setCompletedOrder] = useState(null)
  const [isCheckingOut, setIsCheckingOut]   = useState(false)
  const [showAuthModal, setShowAuthModal]   = useState(false)
  const [customer, setCustomer]             = useState(() => {
    const saved = localStorage.getItem('retail_customer')
    return saved ? JSON.parse(saved) : null
  })

  const videoRef         = useRef(null)
  const canvasRef        = useRef(null)
  const streamRef        = useRef(null)
  const scanIntervalRef  = useRef(null)
  const isScanningLocked = useRef(false)

  // ── Fetch products on page load ─────────────────────────
  useEffect(() => {
    axios.get(`${API}/products`)
      .then(res => { setProducts(res.data.data || res.data); setLoading(false) })
      .catch(() => { setError('Could not connect to backend.'); setLoading(false) })
  }, [])

  // ── Set stream after video mounts ───────────────────────
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraOn])

  // ── Cleanup camera on unmount ───────────────────────────
  useEffect(() => {
    return () => stopCamera()
  }, [])

  function handleLogout() {
    localStorage.removeItem('retail_token')
    localStorage.removeItem('retail_customer')
    setCustomer(null)
  }

  // ── Cart Logic ──────────────────────────────────────────
  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id)
      if (existing) {
        return prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function removeFromCart(productId) {
    setCart(prev => {
      const existing = prev.find(item => item._id === productId)
      if (existing.quantity === 1) {
        return prev.filter(item => item._id !== productId)
      }
      return prev.map(item =>
        item._id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    })
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // ── Camera Logic ────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setCameraOn(true)
      setCvStatus('📷 Camera ready — click Start Scan')
    } catch {
      setCvStatus('❌ Camera access denied. Allow camera in browser.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setCameraOn(false)
    setScanning(false)
    setCvStatus('')
  }

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isScanningLocked.current) return

    const canvas  = canvasRef.current
    const ctx     = canvas.getContext('2d')
    canvas.width  = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    ctx.drawImage(videoRef.current, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const formData = new FormData()
      formData.append('file', blob, 'frame.jpg')

      try {
        const res = await axios.post(`${CV_API}/detect`, formData)
        const { barcodes, detectedObjects } = res.data

        if (barcodes && barcodes.length > 0) {
          const code = barcodes[0].code
          if (!isScanningLocked.current) {
            const matched = products.find(p => p.barcode === code)
            if (matched) {
              addToCart(matched)
              setCvStatus(`🎉 Added: ${matched.productName} (₹${matched.price})`)
              
              isScanningLocked.current = true
              setTimeout(() => {
                isScanningLocked.current = false
                setCvStatus('🔍 Ready for next scan...')
              }, 2500)
            } else {
              setCvStatus(`⚠️ Barcode ${code} not in catalog`)
            }
          }
        } else if (detectedObjects && detectedObjects.length > 0) {
          setCvStatus(`👁️ Seeing: ${detectedObjects.map(o => o.label).join(', ')}`)
        } else {
          setCvStatus('🔍 Scanning... hold barcode up to camera')
        }
      } catch  {
        setCvStatus('⚠️ CV service not reachable — is Python running?')
      }
    }, 'image/jpeg', 0.8)
  }, [products])

  function toggleScan() {
    if (scanning) {
      clearInterval(scanIntervalRef.current)
      setScanning(false)
      setCvStatus('⏸️ Scanning paused')
    } else {
      setScanning(true)
      setCvStatus('🔍 Scanning...')
      scanIntervalRef.current = setInterval(scanFrame, 1500)
    }
  }

  // ── Checkout Logic ──────────────────────────────────────
  async function handleCheckout() {
    if (cart.length === 0) return

    setIsCheckingOut(true)
    try {
      const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000)
      const payload = {
        _id: orderId,
        orderId: orderId,
        customerId: customer?.id || null,
        items: cart.map(item => ({
          productId: item._id,
          productName: item.productName,
          barcode: item.barcode,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        totalAmount: totalPrice,
        paymentMethod: 'UPI / Digital'
      }

      try {
        await axios.post(`${API}/checkout`, payload)
      } catch {
        // demo fallback
      }

      const existingOrders = JSON.parse(localStorage.getItem('retail_orders') || '{}')
      existingOrders[orderId] = payload
      localStorage.setItem('retail_orders', JSON.stringify(existingOrders))

      setCompletedOrder(payload)
      setCart([])
      setCvStatus('🎉 Order placed successfully!')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // ── Loading / Error ─────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-xl">
      Loading products...
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-900 text-red-400 flex items-center justify-center text-xl">
      ❌ {error}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* Header with Customer Auth */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div>
          <h1 className="text-2xl font-bold">🛒 Smart Retail Kiosk</h1>
          <span className="text-gray-400 text-xs">{products.length} products available</span>
        </div>

        {/* Customer Profile / Login */}
        <div className="flex items-center gap-3">
          {customer ? (
            <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-xl border border-gray-700">
              <div>
                <p className="text-xs font-bold text-white">👤 {customer.name}</p>
                <p className="text-xs text-yellow-400 font-semibold">⭐ {customer.loyaltyPoints || 100} Loyalty Pts</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-600/80 hover:bg-red-500 px-2 py-1 rounded-md text-white cursor-pointer transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>👤</span> Log In / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Camera Bar */}
      <div className="px-6 py-3 bg-gray-800 border-b border-gray-700 flex items-center gap-4">
        {!cameraOn ? (
          <button
            onClick={startCamera}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer"
          >
            📷 Open Camera Scanner
          </button>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-48 h-36 rounded-lg border-2 border-blue-500 object-cover"
              />
              {scanning && (
                <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-pulse" />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-col gap-2">
              <button
                onClick={toggleScan}
                className={`px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer ${
                  scanning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {scanning ? '⏸ Pause Scan' : '▶ Start Scan'}
              </button>
              <button
                onClick={stopCamera}
                className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg text-sm cursor-pointer"
              >
                🔴 Close Camera
              </button>
            </div>

            <p className="text-sm text-gray-300 flex-1">{cvStatus}</p>
          </div>
        )}
      </div>

      {/* Main Grid: Products + Cart */}
      <div className="flex flex-1 gap-4 p-4">

        {/* LEFT: Products */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 content-start">
          {products.map(product => (
            <div
              key={product._id}
              onClick={() => addToCart(product)}
              className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2 hover:bg-blue-700 cursor-pointer transition active:scale-95"
            >
              <div className="text-3xl text-center">🛍️</div>
              <h3 className="font-semibold text-center text-white text-sm">{product.productName}</h3>
              <p className="text-green-400 font-bold text-center">₹{product.price}</p>
              <p className="text-gray-500 text-xs text-center">{product.barcode}</p>
              <button className="mt-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded-lg">
                + Add to Cart
              </button>
            </div>
          ))}
        </div>

        {/* RIGHT: Cart */}
        <div className="w-80 bg-gray-800 rounded-xl p-4 flex flex-col h-fit sticky top-4">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">
            🧾 Your Cart ({totalItems} items)
          </h2>

          {cart.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Click a product or scan a barcode to add items
            </p>
          )}

          <div className="flex flex-col gap-3 flex-1">
            {cart.map(item => (
              <div key={item._id} className="flex justify-between items-center bg-gray-700 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.productName}</p>
                  <p className="text-green-400 text-xs">₹{item.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="bg-red-600 hover:bg-red-500 w-6 h-6 rounded text-sm font-bold cursor-pointer"
                  >−</button>
                  <span className="w-4 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-green-600 hover:bg-green-500 w-6 h-6 rounded text-sm font-bold cursor-pointer"
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total:</span>
                <span className="text-green-400">₹{totalPrice}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl transition cursor-pointer"
              >
                {isCheckingOut ? '⏳ Processing Payment...' : '✅ Proceed to Checkout'}
              </button>
              <button
                onClick={() => setCart([])}
                className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm py-2 rounded-xl transition cursor-pointer"
              >
                🗑️ Clear Cart
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Popups */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(cust) => setCustomer(cust)}
        />
      )}

    </div>
  )
}