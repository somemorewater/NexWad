const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      matricNo,
      userType,
    } = req.body;

    if (userType === "student" && !matricNo) {
      return res
        .status(400)
        .json({ message: "Matric number is required for students" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      matricNo: userType === "student" ? matricNo : undefined,
      userType,
      role: "free",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/upgrade/seller", async (req, res) => {
  try {
    const { userId, nin } = req.body;

    if (!nin)
      return res
        .status(400)
        .json({ message: "NIN is required to become a seller" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "seller";
    user.nin = nin;

    await user.save();

    res.json({ message: "Account upgraded to seller", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
