const express = require("express");

const router = express.Router();

const{
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem
} = require("../controllers/cartController");

router.post("/",addToCart);
router.get("/:sessionId",getCart);
router.patch("/:sessionId/item/:productId", updateCartItem);
router.delete("/:sessionId/item/:productId",removeCartItem);
module.exports = router;