const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_retail_key_123'

// Pre-configured Admin Store Manager Credentials
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@retail.com',
  // Default password: "admin123" (hashed)
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
  name: 'Store Manager'
}

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    // Verify email
    if (email.toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, ADMIN_CREDENTIALS.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
    }

    // Generate Admin JWT Token
    const token = jwt.sign(
      { email: ADMIN_CREDENTIALS.email, role: 'admin', name: ADMIN_CREDENTIALS.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.status(200).json({
      success: true,
      message: 'Admin access granted!',
      token,
      admin: {
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: 'admin'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}