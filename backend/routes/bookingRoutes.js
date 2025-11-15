import express from 'express';
import {
  createBooking,
  cancelBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

// POST /booking
router.post('/', createBooking);

// POST /booking/cancel/:id
router.post('/cancel/:id', cancelBooking);

export default router;

