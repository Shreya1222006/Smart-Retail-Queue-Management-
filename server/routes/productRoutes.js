const express = require("express");

const router = express.Router();

const{
    createProduct,
    getAllProducts,
    getProductByBarcode
} = require("../controllers/productController");

//GET all products
router.get("/",getAllProducts);

//GET product by barcode
router.get("/barcode/:barcode",getProductByBarcode);

//create Product
router.post("/",createProduct);

module.exports = router;