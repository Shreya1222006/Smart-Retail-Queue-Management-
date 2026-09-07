const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

const addToCart = async(req , res) =>{
    try{
        const{customerId,sessionId,barcode,quantity} = req.body;
        
        //Validate required fields
        if(!customerId||!sessionId || !barcode || !quantity){
            return res.status(400).json({
                success : false,
                message : "customerId,sessionId, barcode and quantity are required"
            });
        }

        //check wether customer exists
        const customer = await Customer.findById(customerId);

        if(!customer){
            return res.status(404).json({
                success : false,
                message : "Customer not found"
            });
        }

        //find product using barcode
        const product = await Product.findOne({
            barcode : barcode,
            isActive : true
        });

        //Product not found
        if(!product){
            return res.status(404).json({
                success : false,
                message : "Product not found"
            });
        }

        //check stock
        if(product.stock < quantity){
            return res.status(400).json({
                success : false,
                message : "Insufficient stock"
            });
        }

        //find existing cart
        let cart = await Cart.findOne({
            sessionId : sessionId,
            status : "ACTIVE"
        });
        
        //If cart doesn't exist , create one
        if(!cart){
            cart =new Cart({
                customerId : customerId,
                sessionId : sessionId,
                items : []
            });
        }

        //Check if product already exists in cart
        const existingItem = cart.items.find(
            item => item.productId.toString() === product._id.toString()
        );

        if(existingItem){

            //check total requested quantity against stock
            if(product.stock < existingItem.quantity + quantity){
                return res.status(400).json({
                    success : false,
                    message : "Insufficient stock for requested quantity"
                });
            }

            existingItem.quantity += quantity;
            existingItem.subtotal =
                existingItem.quantity * existingItem.price;
            
        }
        else{
            cart.items.push({
                productId : product._id,
                barcode : product.barcode,
                quantity : quantity,
                price : product.price,
                subtotal : product.price * quantity
            });
        }

        //calculate total amount
        let totalAmount = 0;

        for(const item of cart.items){
            totalAmount += item.subtotal;        
  
        }

        cart.totalAmount = totalAmount;

        //save cart
        await cart.save();

        res.status(201).json({
            success : true,
            message : "Product added to cart successfully",
            data : cart
        });
        
    }catch(error){

        res.status(500).json({
            success : false,
            message : error.message
        });
    }
};

//Get cart by session ID
const getCart = async(req , res)=>{
    try{
        const{sessionId} = req.params;

        const cart = await Cart.findOne({
            sessionId : sessionId,
            status : "ACTIVE"        
        }).populate("items.productId");

        if(!cart){
            return res.status(404).json({
                success : false,
                message : "Cart not found"
            });
        }

        res.status(200).json({
            success : true,
            data : cart
        });
    }catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
};

//update product quantity in cart
const updateCartItem = async(req , res) => {
    try{
        const{sessionId , productId} = req.params;
        const{quantity} = req.body;

        //validate quantity
        if(!quantity || quantity<1){
            return res.status(400).json({
                success : false,
                message : "Quantity must be at least 1"
            });
        }
        //find active cart
        const cart = await Cart.findOne({
            sessionId : sessionId,
            status : "ACTIVE"
        });

        if(!cart){
            return res.status(404).json({
                success : false,
                message : "cart not found"
            });
        }

        //find item inside cart
        const cartItem = cart.items.find(
            item => item.productId.toString() === productId
        );

        if(!cartItem){
            return res.status(404).json({
                success : false,
                message : "Product not found in cart"
            });
        }

        //find product to check stock
        const product = await Product.findById(productId);

        if(!product){
            return res.status(404).json({
                success : false,
                message : "Product not found"
            });
        }

        //check stock
        if(product.stock < quantity){
            return res.status(400).json({
                success : false,
                message : "Insufficient stock"
            });
        }

        //update quantity
        cartItem.quantity = quantity;

        //Recalculate total
        let totalAmount = 0 ;

        for (const item of cart.items){
            const cartProduct = await Product.findById(item.productId);

            if(cartProduct){
                totalAmount += cartProduct.price * item.quantity;
            }
        }

        cart.totalAmount = totalAmount;

        await cart.save();

        res.status(200).json({
            success  : true,
            message : "CArt quantity updated successfully",
            data : cart
        });
    }catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
};

//remove product from cart
const removeCartItem = async(req,res)=>{
    try{
        const{sessionId,productId}=req.params;

        //find active cart
        const cart = await Cart.findOne({
            sessionId : sessionId,
            status : "ACTIVE"
        });

        if(!cart){
            return res.status(404).json({
                success : false,
                message : "Cart not found"
            });
            
        }

        //check whether product exists in cart
        const itemExists = cart.items.some(
            item => item.productId.toString()==productId
        );

        if(!itemExists){
            return res.status(404).json({
                success : false,
                message:"Product not found in cart"
            });
            
        }
        //Remove product from cart
        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );

        //recalculate the total 
        let totalAmount = 0 ;
        for(const item of cart.items){
            const product = await Product.findById(item.productId);

            if(product){
                totalAmount += product.price * item.quantity;
            }
        }

        cart.totalAmount = totalAmount;

        //save updated cart
        await cart.save();

        res.status(200).json({
            success : true,
            message : "Product removed from cart successfully",
            data : cart
        });
    }catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem
};