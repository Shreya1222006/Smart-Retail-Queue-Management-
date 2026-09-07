const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])  // ← Same fix as server.js

const mongoose = require('mongoose')
require('dotenv').config()
const Product = require('../models/Product')

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1) })

const products = [
  { productName: 'Amul Milk 500ml',    barcode: '890126200001', category: 'Dairy',     price: 32,  stock: 100, cvLabel: 'bottle',    isActive: true },
  { productName: 'Tata Salt 1kg',      barcode: '890103000002', category: 'Grocery',   price: 22,  stock: 80,  cvLabel: 'box',       isActive: true },
  { productName: 'Parle-G Biscuits',   barcode: '890105000003', category: 'Snacks',    price: 10,  stock: 150, cvLabel: 'box',       isActive: true },
  { productName: 'Maggi Noodles 70g',  barcode: '890108000004', category: 'Instant',   price: 14,  stock: 120, cvLabel: 'box',       isActive: true },
  { productName: 'Colgate Toothpaste', barcode: '890112000005', category: 'Personal',  price: 99,  stock: 60,  cvLabel: 'bottle',    isActive: true },
  { productName: 'Lays Classic Chips', barcode: '890115000006', category: 'Snacks',    price: 20,  stock: 90,  cvLabel: 'bottle',    isActive: true },
  { productName: 'Surf Excel 1kg',     barcode: '890118000007', category: 'Household', price: 120, stock: 50,  cvLabel: 'box',       isActive: true },
  { productName: 'Britannia Bread',    barcode: '890121000008', category: 'Bakery',    price: 45,  stock: 40,  cvLabel: 'sandwich',  isActive: true },
]

async function seedData() {
  try {
    await Product.deleteMany()
    console.log('🗑️  Old products deleted')

    await Product.insertMany(products)
    console.log(`✅ ${products.length} products seeded!`)

    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding failed:', err.message)
    process.exit(1)
  }
}

// Wait for connection then seed
mongoose.connection.once('open', seedData)