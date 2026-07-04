import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  updateMe, 
  deleteMe, 
  clearSearchHistory, 
  removeSearchQuery,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changeEmailRequest,
  changeEmailVerify,
  cancelSubscription,
  reactivateSubscription
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.delete('/me', authenticate, deleteMe);
router.put('/me/clear-search-history', authenticate, clearSearchHistory);
router.put('/me/remove-search-query', authenticate, removeSearchQuery);
router.post('/me/cancel-subscription', authenticate, cancelSubscription);
router.post('/me/reactivate-subscription', authenticate, reactivateSubscription);

router.post('/change-email-request', authenticate, changeEmailRequest);
router.post('/change-email-verify', authenticate, changeEmailVerify);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
