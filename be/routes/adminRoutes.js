import express from 'express';
import { 
  getDashboardStats, 
  getModerationQueue, 
  approveSong, 
  banSong, 
  getCommentsQueue, 
  approveComment, 
  deleteComment, 
  getAds, 
  getRandomAd, 
  createAd, 
  updateAd, 
  deleteAd, 
  trackAdClick, 
  getPlans, 
  updatePlanPrice, 
  updatePaymentConfig,
  getPaymentConfig
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public/Listener routes for ads and pricing packages
router.get('/ads/serve-random', getRandomAd);
router.post('/ads/:id/click', trackAdClick);
router.get('/plans', getPlans);

// Admin-only protected routes
router.use(authenticate, authorize(['admin']));

router.get('/stats', getDashboardStats);
router.get('/moderation/songs', getModerationQueue);
router.post('/moderation/songs/:id/approve', approveSong);
router.post('/moderation/songs/:id/ban', banSong);

router.get('/moderation/comments', getCommentsQueue);
router.post('/moderation/comments/:id/approve', approveComment);
router.delete('/moderation/comments/:id', deleteComment);

router.get('/ads', getAds);
router.post('/ads', createAd);
router.put('/ads/:id', updateAd);
router.delete('/ads/:id', deleteAd);

router.put('/plans/:id', updatePlanPrice);
router.get('/payment-config/:gateway', getPaymentConfig);
router.post('/payment-config', updatePaymentConfig);

export default router;
