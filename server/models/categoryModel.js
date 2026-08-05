import db, { generateId } from '../db.js';

class Category {
  static async find() {
    return db.prepare('SELECT * FROM categories ORDER BY createdAt ASC').all();
  }

  static async create(name) {
    const _id = generateId();
    db.prepare('INSERT INTO categories (_id, name) VALUES (?, ?)').run(_id, name);
    return { _id, name };
  }

  static async delete(name) {
    const result = db.prepare('DELETE FROM categories WHERE name = ?').run(name);
    if (result.changes === 0) {
      throw new Error('Category not found');
    }
    return { message: 'Category removed' };
  }
}

export default Category;
