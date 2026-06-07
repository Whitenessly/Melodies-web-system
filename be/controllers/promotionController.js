import Promotion from '../models/Promotion.js';

export async function getPromotions(req, res) {
  try {
    const promotions = await Promotion.find({})
      .populate('artistId', 'name email role')
      .sort({ createdAt: -1 });
    return res.status(200).json({ promotions });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve promotions', error: err.message });
  }
}

export async function createPromotion(req, res) {
  try {
    const { title, description, code, discountPercent } = req.body;
    if (!title || !description || !code) {
      return res.status(400).json({ message: 'Title, description, and code are required' });
    }

    const exists = await Promotion.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: 'Promotion code already exists' });
    }

    const artistId = req.user.role === 'artist' ? req.user._id : null;

    const promotion = new Promotion({
      artistId,
      title,
      description,
      code: code.toUpperCase(),
      discountPercent: discountPercent || 0
    });

    await promotion.save();

    return res.status(201).json({ message: 'Promotion created successfully', promotion });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create promotion', error: err.message });
  }
}
