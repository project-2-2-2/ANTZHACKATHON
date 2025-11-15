import express from 'express';
import {
  initiateBooking,
  verifyPayment,
  getBookingDetails,
  cancelPendingBooking,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initiate-booking', initiateBooking);

router.post('/verify', verifyPayment);

router.get('/booking/:id', getBookingDetails);

router.post('/cancel-pending/:id', cancelPendingBooking);

export default router;
