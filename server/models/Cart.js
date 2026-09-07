const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        sessionId: {
            type: String,
            required: true,
            unique: true
        },

        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                barcode: {
                    type: String,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                price: {
                    type: Number,
                    required: true
                },

                subtotal: {
                    type: Number,
                    required: true
                }
            }
        ],

        status: {
            type: String,
            enum: ["ACTIVE", "CHECKED_OUT"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Cart", cartSchema);