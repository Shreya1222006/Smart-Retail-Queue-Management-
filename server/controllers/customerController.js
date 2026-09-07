const Customer = require('../models/Customer')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_retail_key_123'

// ── 1. REGISTER ──────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, phone and password' })
    }

    // Check if phone already registered
    const existing = await Customer.findOne({ phone })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Phone number already registered. Please login.' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create customer
    const customer = await Customer.create({
      name,
      phone,
      email: email || '',
      password: hashedPassword,
      loyaltyPoints: 100
    })

    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, name: customer.name, phone: customer.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── 2. LOGIN ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Please enter phone and password' })
    }

    // Find customer by phone
    const customer = await Customer.findOne({ phone })
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid phone or password' })
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, customer.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, name: customer.name, phone: customer.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── 3. GET CURRENT PROFILE (Protected with JWT) ──────────
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password')
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }
    res.status(200).json({ success: true, customer })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}