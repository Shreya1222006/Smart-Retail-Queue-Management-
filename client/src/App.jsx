import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomerKiosk from './pages/CustomerKiosk'
import SecurityVerification from './pages/SecurityVerification'
import AdminDashboard from './pages/AdminDashboard'
function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">🛒 Smart Retail Checkout</h1>
      <p className="text-gray-400">Select a portal to continue</p>
      <div className="flex gap-4 mt-4">
        <a href="/kiosk"    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold">Customer Kiosk</a>
        <a href="/security" className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold">Security Gate</a>
        <a href="/admin"    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold">Admin Dashboard</a>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/kiosk"    element={<CustomerKiosk />} />
        <Route path="/security" element={<SecurityVerification/>} />
        <Route path="/admin"    element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App