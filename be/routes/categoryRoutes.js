import express from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticate, authorize(['admin']), createCategory);
router.delete('/:id', authenticate, authorize(['admin']), deleteCategory);

export default router;
