import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

const API    = 'http://localhost:5000/api'
const CV_API = 'http://localhost:8000'

export default function SecurityVerification() {
  const [orderIdInput, setOrderIdInput]     = useState('')
  const [activeOrder, setActiveOrder]       = useState(null)
  const [verifying, setVerifying]           = useState(false)
  const [verifResult, setVerifResult]       = useState(null)
  const [cameraOn, setCameraOn]             = useState(false)
  const [scanning, setScanning]             = useState(false)
  const [detectedCount, setDetectedCount]   = useState(0)
  const [detectedLabels, setDetectedLabels] = useState([])
  const [statusMsg, setStatusMsg]           = useState('Point camera at Receipt QR Code or Enter Order ID')

  const videoRef         = useRef(null)
  const canvasRef        = useRef(null)
  const streamRef        = useRef(null)
  const scanIntervalRef  = useRef(null)
  const detectedCountRef = useRef(0)

  // ── Start / Stop WebCam ──────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setCameraOn(true)
      setStatusMsg('📷 Camera active — click Start Inspection')
    } catch {
      setStatusMsg('❌ Camera access denied')
    }
  }

  function stopCamera() {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    setCameraOn(false)
    setScanning(false)
  }

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraOn])

  useEffect(() => () => stopCamera(), [])

  // ── Frame Scanning (Auto-QR + Bag AI Inspection) ─────────
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

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
        const { barcodes, detectedObjects, totalItemsCount } = res.data

        // 1. AUTO-DETECT QR CODE RECEIPT
        if (barcodes && barcodes.length > 0) {
          const rawCode = barcodes[0].code
          let targetOrderId = rawCode

          try {
            const parsed = JSON.parse(rawCode)
            if (parsed.orderId) targetOrderId = parsed.orderId
          } catch {
            // Keep rawCode as targetOrderId
          }

          if (targetOrderId && targetOrderId !== orderIdInput) {
            setOrderIdInput(targetOrderId)
            fetchOrderDetails(targetOrderId)
            setStatusMsg(`🎉 Scanned QR Pass: ${targetOrderId}`)
          }
        }

        // 2. LIVE YOLO BAG INSPECTION
        if (detectedObjects) {
          const count = totalItemsCount || detectedObjects.length
          setDetectedCount(count)
          detectedCountRef.current = count
          setDetectedLabels(detectedObjects.map(o => o.label))
        }
      } catch  {
        setStatusMsg('⚠️ CV Service offline — is Python running?')
      }
    }, 'image/jpeg', 0.8)
  }, [orderIdInput])

  function toggleScan() {
    if (scanning) {
      clearInterval(scanIntervalRef.current)
      setScanning(false)
      setStatusMsg('⏸️ Inspection paused')
    } else {
      setScanning(true)
      setStatusMsg('🔍 Scanning for Receipt QR and Bag items...')
      scanIntervalRef.current = setInterval(scanFrame, 1200)
    }
  }

  // ── Load Order from Backend ─────────────────────────────
  async function fetchOrderDetails(id) {
    const targetId = id || orderIdInput
    if (!targetId) return

    //1.checked shared orders storage first
    const savedOrders = JSON.parse(localStorage.getItem('retail_orders')||'{}')
    if(savedOrders[targetId]){
        setActiveOrder(savedOrders[targetId])
        setStatusMsg(`✅ Order #${targetId} loaded from store!`)
        return
    }
    try {
      const res = await axios.get(`${API}/checkout/${targetId}`).catch(() => null)
      if (res && res.data &&(res.data.data || res.data.order)) {
        setActiveOrder(res.data.data || res.data)
        setStatusMsg(`✅ Order #${targetId} loaded from backend!`)
        return
    //   } else {
    //     // Fallback demo order
    //     setActiveOrder({
    //       _id: targetId,
    //       items: [
    //         { productName: 'Amul Milk 500ml', quantity: 1, price: 32 },
    //         { productName: 'Parle-G Biscuits', quantity: 2, price: 10 }
    //       ],
    //       totalAmount: 52
    //     })
    //   }
    //   setStatusMsg(`✅ Order #${targetId} loaded! Point camera at bag & verify.`)
    } }catch  {
      //ignore
    }
    setStatusMsg(`❌ Order #${targetId} not found`)
  }

  // ── Reconcile Bill vs Bag Items ──────────────────────────
  async function runVerification(customCount = null) {
    const countToVerify = customCount !== null ? customCount : detectedCountRef.current
    const billedTotal = activeOrder?.items?.reduce((sum, i) => sum + i.quantity, 0) || 3

    setVerifying(true)
    try {
      const payload = {
        orderId: activeOrder?._id || orderIdInput || 'ORD-DEMO',
        scannedCount: countToVerify,
        billedCount: billedTotal,
        scannedItems: detectedLabels
      }

      const res = await axios.post(`${API}/verify`, payload).catch(() => null)

      if (res && res.data) {
        setVerifResult(res.data)
      } else {
        const isMatch = billedTotal === countToVerify && countToVerify > 0
        setVerifResult({
          status: isMatch ? 'PASSED' : 'DISCREPANCY',
          message: isMatch
            ? 'All items match receipt perfectly. Gate opened! 🟢'
            : `Discrepancy: Bill has ${billedTotal} items, but AI detected ${countToVerify} items in bag! 🚨`,
        })
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-850 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h1 className="text-2xl font-bold">Security Exit Gate Portal</h1>
            <p className="text-xs text-gray-400">Automated Receipt QR & Bag Anti-Theft Verification</p>
          </div>
        </div>
        <a href="/kiosk" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold transition">
          ← Back to Kiosk
        </a>
      </div>

      {/* Main Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

        {/* LEFT: Camera / Scanner */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">📷 Live Overhead Camera</h2>
            <div className="flex gap-2">
              {!cameraOn ? (
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Turn On Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleScan}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      scanning ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                  >
                    {scanning ? '⏸ Pause' : '▶ Start Inspection'}
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-red-600 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-gray-700">
            {cameraOn ? (
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-500 p-6">
                <div className="text-5xl mb-2">📹</div>
                <p className="text-sm">Click "Turn On Camera" to automatically scan Receipt QR or inspect customer bag</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* AI Stats */}
          <div className="bg-gray-900/90 rounded-xl p-4 border border-gray-700 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">YOLOv8 Detected Objects</p>
              <p className="text-sm font-semibold text-gray-200">
                {detectedLabels.length > 0 ? detectedLabels.join(', ') : 'No objects detected yet'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Live Item Count</p>
              <p className="text-3xl font-extrabold text-blue-400">{detectedCount}</p>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400">{statusMsg}</p>
        </div>

        {/* RIGHT: Bill & Gate Verification */}
        <div className="flex flex-col gap-4">

          {/* Step 1: Load Bill */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col gap-3">
            <h2 className="text-lg font-bold">🧾 Step 1: Customer Receipt Pass</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Show Receipt QR to camera or enter Order ID..."
                value={orderIdInput}
                onChange={e => setOrderIdInput(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => fetchOrderDetails(orderIdInput)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Load Bill
              </button>
            </div>

            {activeOrder && (
              <div className="mt-1 bg-gray-900 rounded-xl p-4 border border-gray-700 text-sm flex flex-col gap-2">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="font-mono text-gray-200">{activeOrder._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Billed Items:</span>
                  <span className="font-bold text-green-400">
                    {activeOrder.items?.reduce((s, i) => s + (i.quantity || 1), 0) || activeOrder.items?.length || 3} items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Paid:</span>
                  <span className="font-bold text-green-400">₹{activeOrder.totalAmount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Verification Engine */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex-1 flex flex-col gap-4">
            <h2 className="text-lg font-bold">🚦 Step 2: AI Bag Reconciliation</h2>

            <button
              onClick={() => runVerification()}
              disabled={!activeOrder || verifying}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 py-3.5 rounded-xl font-bold text-base transition cursor-pointer"
            >
              {verifying ? '⏳ Verifying Bag vs Receipt...' : '⚡ Verify Live Bag (Count: ' + detectedCount + ')'}
            </button>

            {/* Simulation Scenarios for Demos */}
            <div className="border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400 mb-2 font-semibold">🧪 Demo Test Scenarios:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => runVerification(activeOrder?.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 3)}
                  className="bg-green-700/60 hover:bg-green-600 text-green-200 text-xs py-2 px-2 rounded-lg font-medium cursor-pointer"
                >
                  🟢 Perfect Match
                </button>
                <button
                  onClick={() => runVerification(1)}
                  className="bg-yellow-700/60 hover:bg-yellow-600 text-yellow-200 text-xs py-2 px-2 rounded-lg font-medium cursor-pointer"
                >
                  🟡 Missing Item
                </button>
                <button
                  onClick={() => runVerification(5)}
                  className="bg-red-700/60 hover:bg-red-600 text-red-200 text-xs py-2 px-2 rounded-lg font-medium cursor-pointer"
                >
                  🚨 Unbilled Theft
                </button>
              </div>
            </div>

            {/* Verdict Box */}
            {verifResult && (
              <div
                className={`mt-auto rounded-xl p-5 border text-center flex flex-col items-center gap-2 animate-fade-in ${
                  verifResult.status === 'PASSED' || verifResult.success
                    ? 'bg-green-950/70 border-green-500 text-green-200'
                    : 'bg-red-950/70 border-red-500 text-red-200'
                }`}
              >
                <div className="text-4xl">
                  {verifResult.status === 'PASSED' || verifResult.success ? '🟢' : '🚨'}
                </div>
                <h3 className="text-xl font-black tracking-wide uppercase">
                  {verifResult.status === 'PASSED' || verifResult.success ? 'GATE OPEN — VERIFIED' : 'GATE LOCKED — ALERT'}
                </h3>
                <p className="text-sm font-medium">{verifResult.message || verifResult.verdict}</p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}