const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_retail_key_123'

module.exports = function (req, res, next) {
  // Get token from header: "Bearer <token>"
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.customer = decoded // { id: customer._id, name: customer.name }
    next()
  } catch (_err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
}