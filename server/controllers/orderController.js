import Order from '../models/orderModel.js';
import Cart from '../models/cartModel.js';
import Stripe from 'stripe';

// Store active SSE connections for admins
let adminClients = [];

// GET /api/orders/notifications (admin)
export const orderNotifications = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  adminClients.push(res);

  req.on('close', () => {
    adminClients = adminClients.filter(client => client !== res);
  });
};

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items.' });
    }

    const order = Order.create({
      userId: req.user._id,
      items,
      shippingAddress,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    // Clear cart after order
    Cart.clear(req.user._id);

    // Notify connected admins via SSE
    adminClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ orderId: order._id, total: order.totalPrice })}\n\n`);
    });

    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/my
export const getMyOrders = async (req, res) => {
  try {
    const orders = Order.findByUser(req.user._id);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const orderUserId = typeof order.user === 'object' ? order.user._id : order.user;
    if (orderUserId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = Order.findAll();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/orders/:id/status (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = Order.updateStatus(req.params.id, status);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/orders/stripe-session
export const createStripeSession = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
      return res.status(400).json({ message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env' });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { items } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name, images: item.image ? [item.image] : [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/orders?success=1`,
      cancel_url: `${process.env.CLIENT_URL}/cart?cancelled=1`,
      customer_email: req.user.email,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
