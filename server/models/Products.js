const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true },
  productName: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productsSchema);