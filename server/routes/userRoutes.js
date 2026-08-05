import express from 'express';
import User from '../models/userModel.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = User.findAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, address } = req.body;
    const user = User.updateProfile(req.user._id, { name, address });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/wishlist/:productId
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const { added } = User.toggleWishlist(req.user._id, req.params.productId);
    const wishlist = User.getWishlistIds(req.user._id);
    res.json({ wishlist, added });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/wishlist
router.get('/wishlist', protect, async (req, res) => {
  try {
    const wishlist = User.getWishlist(req.user._id);
    res.json({ wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
