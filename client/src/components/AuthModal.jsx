import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000/api'

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true) // true = Login, false = Register
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const endpoint = isLogin ? `${API}/customers/login` : `${API}/customers/register`
      const payload = isLogin
        ? { phone: formData.phone, password: formData.password }
        : formData

      const res = await axios.post(endpoint, payload)

      if (res.data.success) {
        // 1. Save JWT token & customer info in localStorage
        localStorage.setItem('retail_token', res.data.token)
        localStorage.setItem('retail_customer', JSON.stringify(res.data.customer))

        setSuccessMsg(isLogin ? '🎉 Logged in successfully!' : '🎉 Registered with 100 Welcome Points!')
        setTimeout(() => {
          onLoginSuccess(res.data.customer)
          onClose()
        }, 1000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <h2 className="text-xl font-bold">{isLogin ? 'Customer Login' : 'Create Account'}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              !isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-950/80 border border-red-500 text-red-200 text-xs p-3 rounded-xl text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-950/80 border border-green-500 text-green-200 text-xs p-3 rounded-xl text-center">
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!isLogin && (
            <div>
              <label className="text-xs text-gray-400">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white mt-1 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white mt-1 focus:outline-none focus:border-blue-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs text-gray-400">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white mt-1 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white mt-1 focus:outline-none focus:border-blue-500"
            />
          </div>

          {!isLogin && (
            <p className="text-xs text-green-400">🎁 You will receive 100 free Loyalty Points upon signing up!</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 font-bold py-3 rounded-xl text-sm transition cursor-pointer mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In to Kiosk' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  )
}