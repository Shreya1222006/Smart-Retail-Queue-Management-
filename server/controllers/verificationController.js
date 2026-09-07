const Order = require("../models/Order");

const verifyOrder = async(req,res)=>{
    try{
        const{orderId,detectedItems}=req.body || {};

        //1.Validate input
        if(!orderId || !detectedItems){
            return res.status(400).json({
                success : false,
                message : "orderId and detectedItems are required"
            });
        }

        //2.find the order
        const order = await Order.findOne({
            orderId : orderId
        });

        if(!order){
            return res.status(404).json({
                success : false,
                message : "Order not found"
            });
        }

        //3.compare detected items with billed items
        const mismatches = [];

        //check every detected item
        for(const detected of detectedItems){

            const billedItem = order.items.find(
                item => item.barcode === detected.barcode
            );

            //Product not present in bill
            if(!billedItem){

                mismatches.push({
                    barcode : detected.barcode,
                    issue : "Extra item detected",
                    detectedQuantity : detected.quantity
                });

                continue;
            }

            //quantity mismatch
            if(detected.quantity !== billedItem.quantity){

                mismatches.push({
                    barcode : detected.barcode,
                    issue : "Quantity mismatch",
                    billedQuantity : billedItem.quantity,
                    detectedQuantity : detected.quantity
                });
            }
        }
        
        //4.check if billed products are missing
        for(const billedItem of order.items){

            const detectedItem = detectedItems.find(
                item => item.barcode === billedItem.barcode
            );

            if(!detectedItem){

                mismatches.push({
                    barcode : billedItem.barcode,
                    issue  : "Billed item not detected ",
                    billedQuantity : billedItem.quantity,
                    detectedQuantity : 0
                });
            }
        }

        //5.determine final result
        const verified = mismatches.length === 0;

        //6.send response
        res.status(200).json({
            success : true,
            verified : verified,
            message : verified
                ?"Order verified successfully"
                :"Order verification failed",
            orderId : orderId,
            mismatches : mismatches
        });
    }catch(error){
        console.error(error);

        res.status(500).json({
            success : false,
            message : error.message
        });
    }
};

module.exports = {
    verifyOrder
};