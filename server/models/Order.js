const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
   
    product:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product",
        required : true
    },

    productName:{
        type : String,
        required : true
    },

    barcode : {
        type : String,
        required : true
    },
     price : {
        type : Number,
        required : true
     },

    quantity : {
        type : Number,
        required : true,
        min : 1
    },

    subtotal : {
        type : Number,
        required : true
    }

});

const orderSchema = new mongoose.Schema(
    {
        orderId : {
            type : String,
            required : true,
            unique : true
        },

        customerId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Customer",
            required : true            
        },

        sessionId : {
            type : String,
            required : true
        },
        items : [orderItemSchema],

        totalAmount : {
            type : Number,
            required : true
        },

        status :{
            type : String,
            enum :["PAID","CANCELLED"],
            default : "PAID"
        }
    },
    {
        timestamps : true
    }
);

module.exports = mongoose.model("Order",orderSchema);