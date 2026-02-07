const express = require("express");
const dotenv= require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const otpRoutes = require("./routes/otp");


dotenv.config();
const app = express();
connectDB();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
