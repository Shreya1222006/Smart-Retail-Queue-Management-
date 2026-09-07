const { trusted } = require("mongoose");
const Product = require("../models/Product");

// Create a new product
const createProduct = async (req, res) => {
  try {
    // Get data from request body
    const {
      productName,
      barcode,
      category,
      price,
      stock,
      image,
      cvLabel,
    } = req.body;

    // Create product
    const product = await Product.create({
      productName,
      barcode,
      category,
      price,
      stock,
      image,
      cvLabel,
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//gett all products
const getAllProducts = async(req , res) =>{
  try{
    const products = await Product.find();

    res.status(200).json({
      success : true,
      count :products.length,
      data : products,
    });

  }catch(error){
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get product by barcode
const getProductByBarcode = async(req,res)=>{
  try{
    const{barcode}=req.params;

    const product = await Product.findOne({
      barcode : barcode,
      isActive: true
    });

    if(!product){
      return res.status(404).json({
        success : false,
        message :"Product not found"
      });
    }
    res.status(200).json({
      success:true,
      data:product
    });
  }catch (error){
    res.status(500).json({
      success : false,
      message : error.message
    });
  }
};
module.exports = {
  createProduct,
  getAllProducts,
  getProductByBarcode
};