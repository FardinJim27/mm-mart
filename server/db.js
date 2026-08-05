import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'mm-mart.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Generate unique IDs ────────────────────────────────────────────────────
export const generateId = () => crypto.randomBytes(12).toString('hex');

// ── Create tables ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
    avatar TEXT DEFAULT '',
    address_street TEXT DEFAULT '',
    address_city TEXT DEFAULT '',
    address_state TEXT DEFAULT '',
    address_zip TEXT DEFAULT '',
    address_country TEXT DEFAULT '',
    resetPasswordToken TEXT,
    resetPasswordExpire TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS categories (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    discountPrice REAL DEFAULT 0,
    category TEXT NOT NULL,
    brand TEXT DEFAULT '',
    sizes TEXT DEFAULT '[]',
    colors TEXT DEFAULT '[]',
    images TEXT DEFAULT '[]',
    stock INTEGER NOT NULL DEFAULT 0,
    sold INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    numReviews INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    _id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    _id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    shipping_fullName TEXT NOT NULL,
    shipping_street TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT DEFAULT '',
    shipping_zip TEXT NOT NULL,
    shipping_country TEXT NOT NULL,
    shipping_phone TEXT DEFAULT '',
    paymentMethod TEXT DEFAULT 'stripe',
    payment_id TEXT DEFAULT '',
    payment_status TEXT DEFAULT '',
    payment_email TEXT DEFAULT '',
    itemsPrice REAL NOT NULL,
    shippingPrice REAL DEFAULT 0,
    taxPrice REAL DEFAULT 0,
    totalPrice REAL NOT NULL,
    isPaid INTEGER DEFAULT 0,
    paidAt TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    deliveredAt TEXT,
    stripeSessionId TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS order_items (
    _id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    name TEXT,
    image TEXT,
    price REAL,
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT,
    color TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS carts (
    _id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    _id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT,
    color TEXT,
    FOREIGN KEY (cart_id) REFERENCES carts(_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(_id) ON DELETE CASCADE
  );
`);

// ── Seed database on first run ─────────────────────────────────────────────
export async function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('📦 Database already seeded');
    return;
  }

  console.log('🌱 Seeding database with sample data...');

  // Seed categories
  const defaultCategories = ['jackets', 'coats', 'sweaters', 'hoodies', 'scarves', 'footwear', 'accessories'];
  const insertCategory = db.prepare('INSERT INTO categories (_id, name) VALUES (?, ?)');
  const insertCategoriesTx = db.transaction((cats) => {
    for (const cat of cats) {
      insertCategory.run(generateId(), cat);
    }
  });
  insertCategoriesTx(defaultCategories);

  // Create admin user
  const adminId = generateId();
  const hashedPassword = await bcrypt.hash('admin123', 12);
  db.prepare(`
    INSERT INTO users (_id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'Admin', 'fardinjim77@gmail.com', hashedPassword, 'admin');

  // Create a test customer
  const customerId = generateId();
  const customerPassword = await bcrypt.hash('customer123', 12);
  db.prepare(`
    INSERT INTO users (_id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(customerId, 'Jane Doe', 'jane@mm-mart.com', customerPassword, 'customer');

  // Seed products
  const sampleProducts = [
    {
      name: 'Arctic Explorer Parka',
      description: 'Premium heavyweight parka designed for extreme cold. Features waterproof outer shell, 800-fill down insulation, detachable fur-trimmed hood, and multiple secure pockets. Built to withstand temperatures down to -40°F.',
      price: 349.99,
      discountPrice: 279.99,
      category: 'jackets',
      brand: 'MM-MART',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'Navy', 'Olive'],
      images: [{ url: 'https://images.unsplash.com/photo-1544923246-77307dd270b1?w=600', publicId: '' }],
      stock: 45,
      sold: 128,
      rating: 4.7,
      numReviews: 23,
      featured: true,
      tags: ['bestseller', 'winter', 'waterproof'],
    },
    {
      name: 'Cashmere Blend Overcoat',
      description: 'Elegant double-breasted overcoat crafted from premium cashmere-wool blend. Features a notched lapel, satin lining, and tailored silhouette for a refined look. Perfect for formal winter occasions.',
      price: 459.99,
      discountPrice: 0,
      category: 'coats',
      brand: 'MM-MART',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Charcoal', 'Camel', 'Burgundy'],
      images: [{ url: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600', publicId: '' }],
      stock: 30,
      sold: 67,
      rating: 4.9,
      numReviews: 15,
      featured: true,
      tags: ['premium', 'formal', 'cashmere'],
    },
    {
      name: 'Alpine Cable Knit Sweater',
      description: 'Cozy chunky cable knit sweater made from 100% merino wool. Features a classic crew neck, ribbed cuffs and hem, and a relaxed fit. Machine washable and pill-resistant.',
      price: 129.99,
      discountPrice: 99.99,
      category: 'sweaters',
      brand: 'MM-MART',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Cream', 'Forest Green', 'Rust'],
      images: [{ url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600', publicId: '' }],
      stock: 85,
      sold: 210,
      rating: 4.5,
      numReviews: 42,
      featured: true,
      tags: ['cozy', 'merino', 'bestseller'],
    },
    {
      name: 'Sherpa Lined Zip Hoodie',
      description: 'Ultra-warm sherpa-lined hoodie with full zip closure. Features heavyweight cotton-poly exterior, cozy sherpa fleece lining, kangaroo pocket, and adjustable drawstring hood.',
      price: 89.99,
      discountPrice: 69.99,
      category: 'hoodies',
      brand: 'MM-MART',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Heather Grey', 'Black', 'Navy'],
      images: [{ url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', publicId: '' }],
      stock: 120,
      sold: 340,
      rating: 4.6,
      numReviews: 58,
      featured: false,
      tags: ['sherpa', 'comfortable', 'casual'],
    },
    {
      name: 'Luxury Wool Scarf',
      description: 'Oversized luxury scarf woven from the finest Italian wool. Features elegant herringbone pattern, hand-finished fringed edges, and generous dimensions for versatile styling.',
      price: 79.99,
      discountPrice: 0,
      category: 'scarves',
      brand: 'MM-MART',
      sizes: [],
      colors: ['Burgundy', 'Grey', 'Camel', 'Black'],
      images: [{ url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600', publicId: '' }],
      stock: 200,
      sold: 95,
      rating: 4.3,
      numReviews: 19,
      featured: false,
      tags: ['luxury', 'gift', 'italian'],
    },
    {
      name: 'Insulated Snow Boots',
      description: 'Rugged insulated boots built for harsh winter conditions. Features Thinsulate insulation rated to -25°F, waterproof leather and nylon upper, Vibram Arctic Grip outsole, and cushioned EVA midsole.',
      price: 199.99,
      discountPrice: 159.99,
      category: 'footwear',
      brand: 'MM-MART',
      sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
      colors: ['Brown', 'Black'],
      images: [{ url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600', publicId: '' }],
      stock: 60,
      sold: 175,
      rating: 4.8,
      numReviews: 31,
      featured: true,
      tags: ['waterproof', 'insulated', 'bestseller'],
    },
    {
      name: 'Fleece Tech Gloves',
      description: 'Premium touchscreen-compatible winter gloves featuring wind-resistant fleece, silicone grip palm, and 3M Thinsulate lining. Stay warm while using your smartphone.',
      price: 39.99,
      discountPrice: 29.99,
      category: 'accessories',
      brand: 'MM-MART',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Grey'],
      images: [{ url: 'https://images.unsplash.com/photo-1545170241-e3028951bf56?w=600', publicId: '' }],
      stock: 150,
      sold: 420,
      rating: 4.4,
      numReviews: 67,
      featured: false,
      tags: ['touchscreen', 'tech', 'gift'],
    },
    {
      name: 'Down Puffer Vest',
      description: 'Lightweight yet incredibly warm down puffer vest with 700-fill power goose down. Features stand-up collar, water-resistant shell, and packs into its own pocket for travel.',
      price: 149.99,
      discountPrice: 119.99,
      category: 'jackets',
      brand: 'MM-MART',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Red', 'Navy'],
      images: [{ url: 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600', publicId: '' }],
      stock: 70,
      sold: 155,
      rating: 4.6,
      numReviews: 28,
      featured: false,
      tags: ['packable', 'layering', 'down'],
    },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (_id, name, description, price, discountPrice, category, brand, sizes, colors, images, stock, sold, rating, numReviews, featured, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((products) => {
    for (const p of products) {
      insertProduct.run(
        generateId(),
        p.name,
        p.description,
        p.price,
        p.discountPrice,
        p.category,
        p.brand,
        JSON.stringify(p.sizes),
        JSON.stringify(p.colors),
        JSON.stringify(p.images),
        p.stock,
        p.sold,
        p.rating,
        p.numReviews,
        p.featured ? 1 : 0,
        JSON.stringify(p.tags)
      );
    }
  });

  insertMany(sampleProducts);

  // Add some sample reviews
  const products = db.prepare('SELECT _id FROM products LIMIT 3').all();
  const insertReview = db.prepare(`
    INSERT INTO reviews (_id, product_id, user_id, name, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  if (products.length >= 3) {
    insertReview.run(generateId(), products[0]._id, customerId, 'Jane Doe', 5, 'Amazing parka! Kept me warm in -20°F weather. Worth every penny.');
    insertReview.run(generateId(), products[0]._id, adminId, 'Admin', 4, 'Great quality and very warm. Runs slightly large.');
    insertReview.run(generateId(), products[1]._id, customerId, 'Jane Doe', 5, 'The most elegant coat I have ever owned. Beautiful craftsmanship.');
    insertReview.run(generateId(), products[2]._id, customerId, 'Jane Doe', 4, 'Very soft and cozy. Perfect for layering.');
  }

  // Create a sample order for the dashboard
  const orderId = generateId();
  db.prepare(`
    INSERT INTO orders (_id, user_id, shipping_fullName, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country, itemsPrice, shippingPrice, taxPrice, totalPrice, isPaid, paidAt, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `).run(orderId, customerId, 'Jane Doe', '123 Winter Lane', 'Snowville', 'CO', '80201', 'US', 349.99, 0, 28.00, 377.99, 1, 'delivered');

  db.prepare(`
    INSERT INTO order_items (_id, order_id, product_id, name, image, price, quantity, size, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(generateId(), orderId, products[0]?._id || generateId(), 'Arctic Explorer Parka', 'https://images.unsplash.com/photo-1544923246-77307dd270b1?w=600', 349.99, 1, 'L', 'Black');

  console.log('✅ Database seeded with 8 products, 2 users, and sample data');
  console.log('   👤 Admin: fardinjim77@gmail.com / admin123');
  console.log('   👤 Customer: jane@mm-mart.com / customer123');
}

export default db;
