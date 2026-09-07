const Cart = require("../models/Cart");
const Order = require("../models/Order");

const checkout = async (req, res) => {
    try {
        const { sessionId } = req.body;

        // 1. Validate session ID
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required"
            });
        }

        // 2. Find active cart
        const cart = await Cart.findOne({
            sessionId: sessionId,
            status: "ACTIVE"
        }).populate("items.productId");

        // Cart not found
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Active cart not found"
            });
        }

        // 3. Check empty cart
        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot checkout an empty cart"
            });
        }

        // 4. Prepare order items
        const orderItems = [];

        let totalAmount = 0;

        for (const item of cart.items) {

            const product = item.productId;

            // Product not found
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "Product not found in cart"
                });
            }

            // Check stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.productName}`
                });
            }

            // Calculate subtotal
            const subtotal = item.price * item.quantity;

            // Add item to order
            orderItems.push({
                product: product._id,
                productName: product.productName,
                barcode: item.barcode,
                price: item.price,
                quantity: item.quantity,
                subtotal: subtotal
            });

            totalAmount += subtotal;
        }

        // 5. Generate unique order ID
        const orderId = "ORD-" + Date.now();

        // 6. Create order
        const newOrder = await Order.create({
            orderId: orderId,
            customerId: cart.customerId,
            sessionId: cart.sessionId,
            items: orderItems,
            totalAmount: totalAmount,
            status: "PAID"
        });

        // 7. Reduce product stock
        for (const item of cart.items) {

            const product = item.productId;

            product.stock -= item.quantity;

            await product.save();
        }

        // 8. Mark cart as checked out
        cart.status = "CHECKED_OUT";

        await cart.save();

        // 9. Send response
        res.status(201).json({
            success: true,
            message: "Checkout successful",
            data: newOrder
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    checkout
};