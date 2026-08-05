import Cart from '../models/cartModel.js';

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = Cart.findByUser(req.user._id);
    res.json({ cart: cart || { items: [] } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/cart/add
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;
    const cart = Cart.addItem(req.user._id, { productId, quantity, size, color });
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cart/:itemId
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = Cart.updateItem(req.user._id, req.params.itemId, quantity);
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart/:itemId
export const removeFromCart = async (req, res) => {
  try {
    const cart = Cart.removeItem(req.user._id, req.params.itemId);
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    Cart.clear(req.user._id);
    res.json({ message: 'Cart cleared.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
