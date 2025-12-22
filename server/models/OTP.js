const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 1800 }, // auto-delete after 30 mins
});

module.exports = mongoose.model("OTP", otpSchema);
