import db, { generateId } from '../db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const User = {
  // Find a user by ID (excludes password by default)
  findById(id, includePassword = false) {
    const cols = includePassword
      ? '*'
      : '_id, name, email, role, avatar, phone, address_street, address_city, address_state, address_zip, address_country, createdAt, updatedAt';
    const user = db.prepare(`SELECT ${cols} FROM users WHERE _id = ?`).get(id);
    if (user && !includePassword) {
      user.phone = user.phone || '';
      user.address = {
        street: user.address_street || '',
        city: user.address_city || '',
        state: user.address_state || '',
        zip: user.address_zip || '',
        country: user.address_country || '',
      };
    }
    return user || null;
  },

  // Find a user by email (always includes password for auth)
  findByEmail(email, includePassword = false) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email?.toLowerCase());
    if (!user) return null;
    if (!includePassword) delete user.password;
    user.phone = user.phone || '';
    user.address = {
      street: user.address_street || '',
      city: user.address_city || '',
      state: user.address_state || '',
      zip: user.address_zip || '',
      country: user.address_country || '',
    };
    return user;
  },

  // Create a new user
  async create({ name, email, password, role = 'customer' }) {
    const _id = generateId();
    const hashed = await bcrypt.hash(password, 12);
    db.prepare(`
      INSERT INTO users (_id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(_id, name, email.toLowerCase(), hashed, role);
    return { _id, name, email: email.toLowerCase(), role };
  },

  // Compare password
  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  // Find all users (admin)
  findAll() {
    const users = db.prepare('SELECT _id, name, email, role, avatar, createdAt, updatedAt FROM users').all();
    return users;
  },

  // Update user profile
  updateProfile(id, { name, phone, address }) {
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (address) {
      if (address.street !== undefined) { fields.push('address_street = ?'); values.push(address.street); }
      if (address.city !== undefined) { fields.push('address_city = ?'); values.push(address.city); }
      if (address.state !== undefined) { fields.push('address_state = ?'); values.push(address.state); }
      if (address.zip !== undefined) { fields.push('address_zip = ?'); values.push(address.zip); }
      if (address.country !== undefined) { fields.push('address_country = ?'); values.push(address.country); }
    }

    fields.push("updatedAt = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE _id = ?`).run(...values);
    return User.findById(id);
  },

  // Wishlist
  getWishlist(userId) {
    const rows = db.prepare(`
      SELECT p._id, p.name, p.price, p.images, p.rating, p.category
      FROM wishlists w
      JOIN products p ON w.product_id = p._id
      WHERE w.user_id = ?
    `).all(userId);

    return rows.map((r) => ({
      ...r,
      images: JSON.parse(r.images || '[]'),
    }));
  },

  getWishlistIds(userId) {
    return db.prepare('SELECT product_id FROM wishlists WHERE user_id = ?')
      .all(userId)
      .map((r) => r.product_id);
  },

  toggleWishlist(userId, productId) {
    const existing = db.prepare('SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ?').get(userId, productId);
    if (existing) {
      db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(userId, productId);
      return { added: false };
    } else {
      db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(userId, productId);
      return { added: true };
    }
  },

  // Generate and set reset password token
  getResetPasswordToken(email) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    db.prepare(`UPDATE users SET resetPasswordToken = ?, resetPasswordExpire = ? WHERE email = ?`)
      .run(resetPasswordToken, resetPasswordExpire, email.toLowerCase());

    return resetToken;
  },

  // Find user by reset token
  findByResetToken(resetToken) {
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const now = new Date().toISOString();
    return db.prepare(`SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpire > ?`)
      .get(resetPasswordToken, now);
  },

  // Update password and clear reset tokens
  async updatePassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 12);
    db.prepare(`UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpire = NULL, updatedAt = datetime('now') WHERE _id = ?`)
      .run(hashed, id);
  }
};

export default User;
