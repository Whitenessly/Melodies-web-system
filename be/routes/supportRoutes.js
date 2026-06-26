import express from 'express';
import { createTicket, getMyTickets } from '../controllers/supportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/tickets', createTicket);
router.get('/tickets', getMyTickets);

export default router;
