//import required packages
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// console.log("MONGO_URI is:", process.env.MONGO_URI);
const productRoutes = require("./routes/productRoutes");

const cartRoutes = require("./routes/cartRoutes");

const checkoutRoutes = require("./routes/checkoutRoutes");

const verificationRoutes = require("./routes/verificationRoutes");

const customerRoutes = require("./routes/customerRoutes");

const analyticsRoutes = require("./routes/analyticsRoutes");

const adminAuthRoutes = require("./routes/adminAuthRoutes");



//create an express application
const app = express();

//connect to MongoDB
connectDB();

//middleware
app.use(cors());
app.use(express.json());

//Routes
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/verify",verificationRoutes);
app.use("/api/customers",customerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin",adminAuthRoutes)

//home route
app.get("/",(req,res) => {
    res.status(200).json({
        sucess: true,
        message:"smart retail checkout backend is running"
    });
});

//start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
  
});