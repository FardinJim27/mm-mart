import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import sendEmail from '../utils/sendEmail.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid, genuine email address.' });
    }

    const existing = User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      message: 'Account created successfully.',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = User.findByEmail(email, true);
    if (!user || !(await User.comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.json({
      message: 'Logged in successfully.',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// POST /api/auth/forgotpassword
export const forgotPassword = async (req, res) => {
  try {
    const user = User.findByEmail(req.body.email);
    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    const resetToken = User.getResetPasswordToken(user.email);
    
    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
        html: `<p>You requested a password reset. Click this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      // If email fails, clear tokens (ideally)
      res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/resetpassword/:token
export const resetPassword = async (req, res) => {
  try {
    const user = User.findByResetToken(req.params.token);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    await User.updatePassword(user._id, req.body.password);
    
    const token = signToken(user._id);
    sendTokenCookie(res, token);
    
    res.status(200).json({ message: 'Password reset successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/updatepassword
export const updatePassword = async (req, res) => {
  try {
    const user = User.findByEmail(req.user.email, true);
    
    if (!(await User.comparePassword(req.body.currentPassword, user.password))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await User.updatePassword(user._id, req.body.newPassword);
    
    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({ message: 'Password updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
