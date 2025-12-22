const express = require("express");
const dotenv= require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const otpRoutes = require("./routes/otp");


dotenv.config();
const app = express();
connectDB();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

app.get("/", (_, res) => res.send("BlueBase API running"));

app.listen(process.env.PORT || 5000, () => console.log("Server up"));
