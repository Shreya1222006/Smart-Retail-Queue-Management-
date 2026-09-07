const express = require('express')
const router = express.Router()
const customerController = require('../controllers/customerController')
const auth = require('../middleware/auth')

// Public routes
router.post('/register', customerController.register)
router.post('/login', customerController.login)

// Protected route (requires JWT Token)
router.get('/profile', auth, customerController.getProfile)

module.exports = router