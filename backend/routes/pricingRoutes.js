import express from 'express';
import { getPricing } from '../controllers/pricingController.js';

const router = express.Router();

// POST /pricing
router.post('/', getPricing);

export default router;

