const Product = require('../models/Product');


exports.addProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.fingById(req.params.id);
        if (!product) return res.status(404).json({error: "Product not found"});
        res.json(product);
    } catch (err) {
        res.status(500).json({error: err.message});        
    }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.fingByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.fingByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({message: "Product successfully deleted"});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};