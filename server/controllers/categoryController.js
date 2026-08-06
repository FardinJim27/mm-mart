import Category from '../models/categoryModel.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json(categories.map(c => c.name));
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });
    
    // Simple validation (e.g., lowercased, no spaces if you prefer, or just lowercased)
    const formattedName = name.trim();
    
    const newCategory = await Category.create(formattedName);
    res.status(201).json(newCategory);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { name } = req.params;
    await Category.delete(name);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    if (error.message === 'Category not found') {
      res.status(404);
    }
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ message: 'New category name is required' });
    
    const formattedName = newName.trim();
    await Category.update(name, formattedName);
    res.json({ message: 'Category updated successfully', name: formattedName });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    if (error.message === 'Category not found') {
      res.status(404);
    }
    next(error);
  }
};
