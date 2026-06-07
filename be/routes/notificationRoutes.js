import express from 'express';
import { getUserNotifications, markAllRead, markRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getUserNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;
