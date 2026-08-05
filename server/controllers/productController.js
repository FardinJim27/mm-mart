import Product from '../models/productModel.js';

// GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const result = Product.find({ keyword, category, minPrice, maxPrice, sort, page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products (admin)
export const createProduct = async (req, res) => {
  try {
    const product = Product.create(req.body);
    res.status(201).json({ product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/products/:id (admin)
export const updateProduct = async (req, res) => {
  try {
    const product = Product.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/products/:id (admin)
export const deleteProduct = async (req, res) => {
  try {
    const product = Product.delete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products/:id/reviews
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    if (Product.hasReviewed(req.params.id, req.user._id)) {
      return res.status(400).json({ message: 'Already reviewed this product.' });
    }

    Product.addReview(req.params.id, {
      userId: req.user._id,
      name: req.user.name,
      rating,
      comment,
    });

    res.status(201).json({ message: 'Review added.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
