import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000/api'

export default function AdminDashboard() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('retail_admin_token'))
  })

  // Admin Login Form State
  const [loginEmail, setLoginEmail]       = useState('admin@retail.com')
  const [loginPassword, setLoginPassword] = useState('')
  const [authError, setAuthError]         = useState('')
  const [authLoading, setAuthLoading]     = useState(false)

  // Dashboard Data State
  const [products, setProducts]         = useState([])
  const [analytics, setAnalytics]       = useState(null)
  const [loading, setLoading]           = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  
  const [newProd, setNewProd] = useState({
    productName: '',
    barcode: '',
    category: 'Grocery',
    price: '',
    stock: 50,
    cvLabel: 'bottle'
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchData()
    }
  }, [isAdminLoggedIn])

  // ── Handle Admin Login ────────────────────────────────────
  async function handleAdminLogin(e) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const res = await axios.post(`${API}/admin/login`, {
        email: loginEmail,
        password: loginPassword
      })

      if (res.data.success) {
        localStorage.setItem('retail_admin_token', res.data.token)
        setIsAdminLoggedIn(true)
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid manager credentials')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleAdminLogout() {
    localStorage.removeItem('retail_admin_token')
    setIsAdminLoggedIn(false)
    setLoginPassword('')
  }

  // ── Fetch Dashboard Data ──────────────────────────────────
  async function fetchData() {
    setLoading(true)
    try {
      const [prodRes, anaRes] = await Promise.all([
        axios.get(`${API}/products`).catch(() => ({ data: [] })),
        axios.get(`${API}/analytics/store-insights`).catch(() => ({ data: null }))
      ])

      setProducts(prodRes.data.data || prodRes.data || [])
      setAnalytics(anaRes.data?.data || null)
    } finally {
      setLoading(false)
    }
  }

  // ── Add SKU ───────────────────────────────────────────────
  async function handleAddProduct(e) {
    e.preventDefault()
    if (!newProd.productName || !newProd.barcode || !newProd.price) {
      setMsg('❌ Please fill in required fields')
      return
    }

    setSaving(true)
    try {
      await axios.post(`${API}/products`, {
        ...newProd,
        price: Number(newProd.price),
        stock: Number(newProd.stock),
        isActive: true
      })
      setMsg('✅ Product SKU added successfully!')
      setNewProd({ productName: '', barcode: '', category: 'Grocery', price: '', stock: 50, cvLabel: 'bottle' })
      setShowAddModal(false)
      fetchData()
    } catch  {
      setMsg('❌ Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  // ── 🔒 IF NOT LOGGED IN: SHOW ADMIN LOGIN SCREEN ──────────
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 animate-fade-in">
          
          <div className="text-center">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-2xl font-bold">Store Manager Portal</h1>
            <p className="text-xs text-gray-400 mt-1">Authorized Store Staff & Manager Access Only</p>
          </div>

          {authError && (
            <div className="bg-red-950/80 border border-red-500 text-red-200 text-xs p-3 rounded-xl text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 font-semibold">Manager Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white mt-1 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold">Manager Password</label>
              <input
                type="password"
                required
                placeholder="Enter admin password (e.g. admin123)"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white mt-1 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 font-bold py-3 rounded-xl text-sm transition cursor-pointer mt-2"
            >
              {authLoading ? 'Verifying Credentials...' : 'Sign In as Manager'}
            </button>
          </form>

          <div className="text-center border-t border-gray-700 pt-4">
            <a href="/kiosk" className="text-xs text-gray-400 hover:text-white transition">
              ← Return to Customer Self-Checkout Kiosk
            </a>
          </div>

        </div>
      </div>
    )
  }

  // ── 📊 IF LOGGED IN: SHOW FULL ADMIN DASHBOARD ────────────
  const totalSKUs  = products.length
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
  const liveQueue  = analytics?.liveQueue || { estimatedWaitMinutes: 2, congestionLevel: 'LOW', activeShoppers: 5 }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-xl">
        <span className="animate-pulse">📊 Loading Analytics & Inventory Dashboard...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-850 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <h1 className="text-2xl font-bold">Admin & Queue Analytics Portal</h1>
            <p className="text-xs text-gray-400">Footfall Predictor, AI Queue Wait Times & Inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/kiosk" className="bg-gray-700 hover:bg-gray-600 px-3.5 py-2 rounded-xl text-xs font-semibold">
            🛒 Kiosk
          </a>
          <a href="/security" className="bg-gray-700 hover:bg-gray-600 px-3.5 py-2 rounded-xl text-xs font-semibold">
            🛡️ Security Gate
          </a>
          <button
            onClick={handleAdminLogout}
            className="bg-red-600/80 hover:bg-red-500 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            🔒 Sign Out
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">

        {/* 1. Live Queue & Store Congestion KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
            <p className="text-xs text-gray-400 font-semibold">Live Queue Wait Time</p>
            <p className="text-3xl font-black text-purple-400 mt-1">{liveQueue.estimatedWaitMinutes} mins</p>
            <p className="text-xs text-gray-400 mt-1">Based on active scan rate</p>
          </div>

          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
            <p className="text-xs text-gray-400 font-semibold">Store Congestion Level</p>
            <p className={`text-2xl font-black mt-1 ${
              liveQueue.congestionLevel === 'HIGH' ? 'text-red-400' :
              liveQueue.congestionLevel === 'MODERATE' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {liveQueue.congestionLevel}
            </p>
            <p className="text-xs text-gray-400 mt-1">{liveQueue.activeShoppers} active shoppers</p>
          </div>

          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
            <p className="text-xs text-gray-400 font-semibold">Peak Footfall Day</p>
            <p className="text-2xl font-black text-blue-400 mt-1">Saturday</p>
            <p className="text-xs text-gray-400 mt-1">42% of weekly visitors</p>
          </div>

          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
            <p className="text-xs text-gray-400 font-semibold">Total Stock Units</p>
            <p className="text-3xl font-black text-green-400 mt-1">{totalStock}</p>
            <p className="text-xs text-gray-400 mt-1">Across {totalSKUs} registered SKUs</p>
          </div>
        </div>

        {/* 2. Visual Footfall Charts & Rush Heatmaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Chart: Weekly Footfall */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">📅 Weekly Customer Footfall Prediction</h2>
                <p className="text-xs text-gray-400">Traffic forecast by day of the week</p>
              </div>
              <span className="bg-blue-900/60 text-blue-300 text-xs px-2.5 py-1 rounded-md font-bold">
                Weekend Peak
              </span>
            </div>

            <div className="flex items-end gap-3 h-48 pt-6 pb-2 border-b border-gray-700">
              {analytics?.weeklyFootfall?.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-xs font-bold text-gray-300">{item.trafficPercentage}%</span>
                  <div
                    style={{ height: `${item.trafficPercentage * 2.1}px` }}
                    className={`w-full rounded-t-lg transition-all ${
                      item.isPeak ? 'bg-gradient-to-t from-blue-600 to-indigo-400' : 'bg-gray-700'
                    }`}
                  />
                  <span className={`text-xs font-semibold ${item.isPeak ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              💡 <span className="font-semibold text-white">Insight:</span> 66% of total weekly footfall occurs on <span className="text-blue-400 font-bold">Friday, Saturday & Sunday</span>.
            </p>
          </div>

          {/* Right Chart: Hourly Rush Hours */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold">⏰ Hourly Rush Heatmap</h2>
              <p className="text-xs text-gray-400">Customer density across operating hours</p>
            </div>

            <div className="flex flex-col gap-3">
              {analytics?.hourlyRush?.map((slot) => (
                <div key={slot.timeSlot} className="bg-gray-900 p-3 rounded-xl border border-gray-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{slot.timeSlot}</p>
                    <p className="text-xs text-gray-400">{slot.label}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: slot.traffic }}
                        className={`h-full ${
                          slot.level === 'HIGH' ? 'bg-red-500' : slot.level === 'MODERATE' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                      slot.level === 'HIGH' ? 'bg-red-950 text-red-300' :
                      slot.level === 'MODERATE' ? 'bg-yellow-950 text-yellow-300' : 'bg-green-950 text-green-300'
                    }`}>
                      {slot.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-950/50 border border-indigo-500/50 rounded-xl p-3.5 text-xs text-indigo-200 flex flex-col gap-1">
              <p className="font-bold flex items-center gap-1 text-indigo-300">
                <span>🤖</span> AI Store Optimization Recommendation:
              </p>
              <p>• Deploy 2 additional self-checkout kiosks during the <span className="font-bold text-white">5 PM - 9 PM Evening Rush</span> to keep wait times under 2 mins.</p>
            </div>
          </div>

        </div>

        {/* Status Message */}
        {msg && (
          <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl text-sm font-semibold text-center">
            {msg}
          </div>
        )}

        {/* 3. Product Inventory Table */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">📦 Product Inventory Catalog</h2>
              <p className="text-xs text-gray-400">Manage SKUs, prices, stock levels & Computer Vision models</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition"
            >
              + Add New SKU
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">CV Detection Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {products.map(p => (
                  <tr key={p._id || p.barcode} className="hover:bg-gray-750">
                    <td className="py-3.5 px-4 font-semibold text-white">{p.productName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-400">{p.barcode}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-gray-700 px-2.5 py-1 rounded-md text-xs">{p.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-green-400">₹{p.price}</td>
                    <td className="py-3.5 px-4">{p.stock || 50} units</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-purple-300">{p.cvLabel || 'bottle'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-xl font-bold">Add New SKU Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-400">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurkure Masala Munch"
                  value={newProd.productName}
                  onChange={e => setNewProd({ ...newProd, productName: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Barcode</label>
                  <input
                    type="text"
                    required
                    placeholder="890123456789"
                    value={newProd.barcode}
                    onChange={e => setNewProd({ ...newProd, barcode: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={newProd.price}
                    onChange={e => setNewProd({ ...newProd, price: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Category</label>
                  <input
                    type="text"
                    value={newProd.category}
                    onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Stock Quantity</label>
                  <input
                    type="number"
                    value={newProd.stock}
                    onChange={e => setNewProd({ ...newProd, stock: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">YOLO CV Label</label>
                  <select
                    value={newProd.cvLabel}
                    onChange={e => setNewProd({ ...newProd, cvLabel: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  >
                    <option value="bottle">bottle</option>
                    <option value="cup">cup</option>
                    <option value="box">box</option>
                    <option value="book">book</option>
                    <option value="sandwich">sandwich</option>
                    <option value="toothbrush">toothbrush</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Add SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}