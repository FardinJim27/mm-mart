import db, { generateId } from '../db.js';

const Product = {
  // Parse JSON fields on a product row
  _parse(row) {
    if (!row) return null;
    return {
      ...row,
      sizes: JSON.parse(row.sizes || '[]'),
      colors: JSON.parse(row.colors || '[]'),
      images: JSON.parse(row.images || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      featured: !!row.featured,
    };
  },

  // GET all products with filters, sort, pagination
  find({ keyword, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = {}) {
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('p.name LIKE ?');
      params.push(`%${keyword}%`);
    }
    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (minPrice) {
      conditions.push('p.price >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      conditions.push('p.price <= ?');
      params.push(Number(maxPrice));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortMap = {
      newest: 'p.createdAt DESC',
      'price-asc': 'p.price ASC',
      'price-desc': 'p.price DESC',
      rating: 'p.rating DESC',
    };
    const orderBy = sortMap[sort] || 'p.createdAt DESC';

    const offset = (Number(page) - 1) * Number(limit);

    const total = db.prepare(`SELECT COUNT(*) as count FROM products p ${where}`).get(...params).count;
    const products = db.prepare(`SELECT * FROM products p ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...params, Number(limit), offset)
      .map(Product._parse);

    return { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
  },

  // GET single product by ID
  findById(id) {
    const row = db.prepare('SELECT * FROM products WHERE _id = ?').get(id);
    if (!row) return null;

    const product = Product._parse(row);

    // Attach reviews
    product.reviews = db.prepare(`
      SELECT r.*, u.name as userName, u.avatar as userAvatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u._id
      WHERE r.product_id = ?
      ORDER BY r.createdAt DESC
    `).all(id).map((rev) => ({
      _id: rev._id,
      user: { _id: rev.user_id, name: rev.userName || rev.name, avatar: rev.userAvatar || '' },
      name: rev.name,
      rating: rev.rating,
      comment: rev.comment,
      createdAt: rev.createdAt,
      updatedAt: rev.updatedAt,
    }));

    return product;
  },

  // CREATE product
  create(data) {
    const _id = generateId();
    db.prepare(`
      INSERT INTO products (_id, name, description, price, discountPrice, category, brand, sizes, colors, images, stock, sold, rating, numReviews, featured, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      _id,
      data.name,
      data.description,
      data.price,
      data.discountPrice || 0,
      data.category,
      data.brand || '',
      JSON.stringify(data.sizes || []),
      JSON.stringify(data.colors || []),
      JSON.stringify(data.images || []),
      data.stock || 0,
      data.sold || 0,
      data.rating || 0,
      data.numReviews || 0,
      data.featured ? 1 : 0,
      JSON.stringify(data.tags || [])
    );
    return Product.findById(_id);
  },

  // UPDATE product
  update(id, data) {
    const existing = db.prepare('SELECT * FROM products WHERE _id = ?').get(id);
    if (!existing) return null;

    const fields = [];
    const values = [];

    const directFields = ['name', 'description', 'price', 'discountPrice', 'category', 'brand', 'stock', 'sold', 'rating', 'numReviews'];
    for (const f of directFields) {
      if (data[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(data[f]);
      }
    }

    const jsonFields = ['sizes', 'colors', 'images', 'tags'];
    for (const f of jsonFields) {
      if (data[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(JSON.stringify(data[f]));
      }
    }

    if (data.featured !== undefined) {
      fields.push('featured = ?');
      values.push(data.featured ? 1 : 0);
    }

    if (fields.length === 0) return Product.findById(id);

    fields.push("updatedAt = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE _id = ?`).run(...values);
    return Product.findById(id);
  },

  // DELETE product
  delete(id) {
    const existing = db.prepare('SELECT _id FROM products WHERE _id = ?').get(id);
    if (!existing) return null;
    db.prepare('DELETE FROM products WHERE _id = ?').run(id);
    return existing;
  },

  // ADD review
  addReview(productId, { userId, name, rating, comment }) {
    const reviewId = generateId();
    db.prepare(`
      INSERT INTO reviews (_id, product_id, user_id, name, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reviewId, productId, userId, name, rating, comment);

    // Update product rating
    const stats = db.prepare(`
      SELECT COUNT(*) as count, AVG(rating) as avg FROM reviews WHERE product_id = ?
    `).get(productId);

    db.prepare(`
      UPDATE products SET rating = ?, numReviews = ?, updatedAt = datetime('now') WHERE _id = ?
    `).run(stats.avg || 0, stats.count || 0, productId);
  },

  // Check if user already reviewed
  hasReviewed(productId, userId) {
    return !!db.prepare('SELECT 1 FROM reviews WHERE product_id = ? AND user_id = ?').get(productId, userId);
  },

  // Get basic product info (for cart population)
  findBasic(id) {
    const row = db.prepare('SELECT _id, name, price, images, stock FROM products WHERE _id = ?').get(id);
    if (!row) return null;
    return { ...row, images: JSON.parse(row.images || '[]') };
  },
};

export default Product;
