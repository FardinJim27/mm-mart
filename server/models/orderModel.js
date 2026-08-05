import db, { generateId } from '../db.js';

const Order = {
  // Create a new order
  create({ userId, items, shippingAddress, itemsPrice, shippingPrice, taxPrice, totalPrice }) {
    const _id = generateId();

    db.prepare(`
      INSERT INTO orders (_id, user_id, shipping_fullName, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone, itemsPrice, shippingPrice, taxPrice, totalPrice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      _id, userId,
      shippingAddress.fullName, shippingAddress.street, shippingAddress.city,
      shippingAddress.state || '', shippingAddress.zip, shippingAddress.country,
      shippingAddress.phone || '',
      itemsPrice, shippingPrice || 0, taxPrice || 0, totalPrice
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (_id, order_id, product_id, name, image, price, quantity, size, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItems = db.transaction((orderItems) => {
      for (const item of orderItems) {
        insertItem.run(
          generateId(), _id,
          item.product || item.productId || '',
          item.name || '', item.image || '',
          item.price || 0, item.quantity || 1,
          item.size || '', item.color || ''
        );
      }
    });

    insertItems(items);

    return Order.findById(_id);
  },

  // Parse an order row + items
  _buildOrder(row) {
    if (!row) return null;

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row._id).map((i) => ({
      _id: i._id,
      product: i.product_id,
      name: i.name,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    }));

    return {
      _id: row._id,
      user: row.user_id,
      items,
      shippingAddress: {
        fullName: row.shipping_fullName,
        street: row.shipping_street,
        city: row.shipping_city,
        state: row.shipping_state,
        zip: row.shipping_zip,
        country: row.shipping_country,
        phone: row.shipping_phone,
      },
      paymentMethod: row.paymentMethod,
      paymentResult: {
        id: row.payment_id,
        status: row.payment_status,
        email: row.payment_email,
      },
      itemsPrice: row.itemsPrice,
      shippingPrice: row.shippingPrice,
      taxPrice: row.taxPrice,
      totalPrice: row.totalPrice,
      isPaid: !!row.isPaid,
      paidAt: row.paidAt,
      status: row.status,
      deliveredAt: row.deliveredAt,
      stripeSessionId: row.stripeSessionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  // Find order by ID
  findById(id) {
    const row = db.prepare('SELECT * FROM orders WHERE _id = ?').get(id);
    if (!row) return null;

    const order = Order._buildOrder(row);

    // Populate user info
    const user = db.prepare('SELECT _id, name, email FROM users WHERE _id = ?').get(row.user_id);
    if (user) order.user = user;

    return order;
  },

  // Find orders by user ID
  findByUser(userId) {
    const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY createdAt DESC').all(userId);
    return rows.map(Order._buildOrder);
  },

  // Find all orders (admin) with user populated
  findAll() {
    const rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
    return rows.map((row) => {
      const order = Order._buildOrder(row);
      const user = db.prepare('SELECT _id, name, email FROM users WHERE _id = ?').get(row.user_id);
      if (user) order.user = user;
      return order;
    });
  },

  // Update order status
  updateStatus(id, status) {
    const extra = status === 'delivered' ? `, deliveredAt = datetime('now')` : '';
    const result = db.prepare(`UPDATE orders SET status = ?, updatedAt = datetime('now')${extra} WHERE _id = ?`).run(status, id);
    if (result.changes === 0) return null;
    return Order.findById(id);
  },
};

export default Order;
