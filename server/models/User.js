const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  displayname: { type: String, required: false },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  matricNo: { type: String, unique: true, sparse: true },
  userType: { type: String, enum: ["student", "other"], required: true },
  role: {
    type: String,
    enum: ["free", "premium", "seller", "admin"],
    default: "free",
  },
  nin: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
    unique: true,
  },
  isVerified: { type: Boolean, default: false },
  badges: [String],
  xp: { type: Number, default: 0 },
  profilePic: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
