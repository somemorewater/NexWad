const express = require("express");
const router = express.Router();
const OTP = require("../models/OTP");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Generate OTP
router.post("/generate", auth, async (req, res) => {
  try {
    const user = req.user;
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

    await OTP.create({ userId: user._id, code });

    // TODO: send code via email/SMS
    console.log(`OTP for ${user.email}: ${code}`);

    res.json({ message: "OTP generated, check your email/phone" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP
router.post("/verify", auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;

    const otpEntry = await OTP.findOne({ userId: user._id, code });
    if (!otpEntry)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    // mark user as verified (add a field in User if needed)
    user.isVerified = true;
    await user.save();

    await otpEntry.delete();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
