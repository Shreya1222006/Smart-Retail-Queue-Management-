const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true
  },
  email: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  loyaltyPoints: {
    type: Number,
    default: 100 // Welcome bonus points!
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema)