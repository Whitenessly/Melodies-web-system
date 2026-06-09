import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  addPaymentMethod, 
  deletePaymentMethod, 
  deleteOwnAccount,
  setDefaultPaymentMethod
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);

// Authenticated user settings and profile routes
router.put('/profile', authenticate, updateProfile);
router.delete('/profile', authenticate, deleteOwnAccount);
router.put('/password', authenticate, changePassword);
router.post('/payment-methods', authenticate, addPaymentMethod);
router.delete('/payment-methods/:cardId', authenticate, deletePaymentMethod);
router.put('/payment-methods/:cardId/default', authenticate, setDefaultPaymentMethod);

export default router;
