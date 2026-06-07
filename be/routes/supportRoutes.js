import express from 'express';
import { createTicket, getUserTickets, adminRespondTicket } from '../controllers/supportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createTicket);
router.get('/', getUserTickets);
router.put('/:id', authorize(['admin']), adminRespondTicket);

export default router;
