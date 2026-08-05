import db, { generateId } from '../db.js';

const Cart = {
  // Find or create cart for user, with product info populated
  findByUser(userId, populate = true) {
    let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);

    if (!cart) {
      const _id = generateId();
      db.prepare('INSERT INTO carts (_id, user_id) VALUES (?, ?)').run(_id, userId);
      cart = { _id, user_id: userId };
    }

    const items = db.prepare('SELECT * FROM cart_items WHERE cart_id = ?').all(cart._id);

    if (populate) {
      cart.items = items.map((item) => {
        const product = db.prepare('SELECT _id, name, price, images, stock FROM products WHERE _id = ?').get(item.product_id);
        return {
          _id: item._id,
          product: product
            ? { ...product, images: JSON.parse(product.images || '[]') }
            : { _id: item.product_id, name: 'Deleted Product', price: 0, images: [], stock: 0 },
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        };
      });
    } else {
      cart.items = items.map((item) => ({
        _id: item._id,
        product: item.product_id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));
    }

    return cart;
  },

  // Add item to cart
  addItem(userId, { productId, quantity = 1, size, color }) {
    const cart = Cart.findByUser(userId, false);

    // Check if item already exists with same product/size/color
    const existing = db.prepare(`
      SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND COALESCE(size, '') = ? AND COALESCE(color, '') = ?
    `).get(cart._id, productId, size || '', color || '');

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE _id = ?').run(quantity, existing._id);
    } else {
      db.prepare(`
        INSERT INTO cart_items (_id, cart_id, product_id, quantity, size, color)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId(), cart._id, productId, quantity, size || '', color || '');
    }

    return Cart.findByUser(userId);
  },

  // Update cart item quantity
  updateItem(userId, itemId, quantity) {
    const cart = Cart.findByUser(userId, false);

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE _id = ? AND cart_id = ?').run(itemId, cart._id);
    } else {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE _id = ? AND cart_id = ?').run(quantity, itemId, cart._id);
    }

    return Cart.findByUser(userId);
  },

  // Remove item from cart
  removeItem(userId, itemId) {
    const cart = Cart.findByUser(userId, false);
    db.prepare('DELETE FROM cart_items WHERE _id = ? AND cart_id = ?').run(itemId, cart._id);
    return Cart.findByUser(userId);
  },

  // Clear cart
  clear(userId) {
    const cart = db.prepare('SELECT _id FROM carts WHERE user_id = ?').get(userId);
    if (cart) {
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart._id);
    }
  },
};

export default Cart;
