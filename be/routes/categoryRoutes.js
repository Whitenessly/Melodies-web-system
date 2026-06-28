import express from 'express';
import { getAllCategories } from '../controllers/categoryController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getAllCategories);

export default router;
