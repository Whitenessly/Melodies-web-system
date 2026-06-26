import Category from '../models/Category.js';

export async function getAllCategories(req, res) {
  try {
    const categories = await Category.find();
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
