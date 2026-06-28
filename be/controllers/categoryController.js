import Category from '../models/Category.js';
import Song from '../models/Song.js';

export async function getAllCategories(req, res) {
  try {
    const categories = await Category.find();
    
    let likedGenres = [];
    if (req.user && req.user.likedGenres) {
      likedGenres = req.user.likedGenres.map(g => g.toLowerCase());
    }
    
    // Filter categories that have NOT appeared in user's likedGenres
    let filteredCategories = categories.filter(category => {
      return !likedGenres.includes(category.name.toLowerCase());
    });
    
    // For each remaining category, count the number of approved, non-deleted songs
    const categoriesWithCount = [];
    for (const category of filteredCategories) {
      const count = await Song.countDocuments({
        genre: new RegExp('^' + category.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i'),
        status: 'approved',
        deleted_at: null
      });
      categoriesWithCount.push({
        _id: category._id,
        name: category.name,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        songCount: count
      });
    }
    
    // Sort categories by song count descending
    categoriesWithCount.sort((a, b) => b.songCount - a.songCount);

    // Exclude categories with 0 songs and limit to 5
    const finalCategories = categoriesWithCount
      .filter(cat => cat.songCount > 0)
      .slice(0, 5);
    
    return res.json(finalCategories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
