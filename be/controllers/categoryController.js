import Category from '../models/Category.js';

export async function getCategories(req, res) {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return res.status(200).json({ categories });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve categories', error: err.message });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name, description });
    await category.save();

    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Category.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
}
