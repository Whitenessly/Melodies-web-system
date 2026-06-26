import Promotion from '../models/Promotion.js';

export async function getAllPromotions(req, res) {
  try {
    const promotions = await Promotion.find().populate('artistId', 'name');
    return res.json(promotions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function validatePromotion(req, res) {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Promo code is required' });

    const promotion = await Promotion.findOne({ code: code.toUpperCase() });
    if (!promotion) {
      return res.status(404).json({ message: 'Invalid or expired coupon code' });
    }

    return res.json({
      valid: true,
      discountPercent: promotion.discountPercent,
      title: promotion.title,
      code: promotion.code
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
