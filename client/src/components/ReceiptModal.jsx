import { QRCodeSVG } from 'qrcode.react'

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null

  // Payload encoded inside the QR Code for the Security Gate to scan
  const qrPayload = JSON.stringify({
    orderId: order._id || order.orderId,
    totalItems: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    totalAmount: order.totalAmount,
    timestamp: new Date().toISOString()
  })

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="text-center border-b border-gray-700 pb-4">
          <div className="text-4xl mb-1">🎉</div>
          <h2 className="text-2xl font-bold text-green-400">Payment Successful!</h2>
          <p className="text-xs text-gray-400 mt-1">Order ID: <span className="font-mono text-gray-300">{order._id || order.orderId}</span></p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center">
          <QRCodeSVG value={qrPayload} size={160} level="H" />
          <p className="text-xs text-gray-700 font-bold mt-2 text-center">
            📱 Show this QR Code at the Exit Security Gate
          </p>
        </div>

        {/* Purchased Items List */}
        <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-2">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm bg-gray-700/50 px-3 py-2 rounded-lg">
              <span className="font-medium text-gray-200">
                {item.productName || item.name} <span className="text-xs text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-bold text-green-400">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="border-t border-gray-700 pt-3 flex justify-between items-center text-lg font-bold">
          <span>Total Paid:</span>
          <span className="text-2xl text-green-400">₹{order.totalAmount}</span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition cursor-pointer"
        >
          ✅ Done / Start New Customer
        </button>
      </div>
    </div>
  )
}