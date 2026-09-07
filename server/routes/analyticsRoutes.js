const express = require('express')
const router = express.Router()
const analyticsController = require('../controllers/analyticsController')

router.get('/store-insights', analyticsController.getStoreAnalytics)

module.exports = router