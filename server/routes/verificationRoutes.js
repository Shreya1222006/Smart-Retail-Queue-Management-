const express = require("express");

const router = express.Router();

const {
    verifyOrder
} = require("../controllers/verificationController");

router.post("/", verifyOrder);

module.exports = router;