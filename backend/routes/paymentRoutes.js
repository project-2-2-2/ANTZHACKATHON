import express from 'express';
import {
  initiateBooking,
  verifyPayment,
  getBookingDetails,
  cancelPendingBooking,
  getUserBookings,
  cancelUserBooking,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initiate-booking', initiateBooking);

router.post('/verify', verifyPayment);

router.get('/booking/:id', getBookingDetails);

router.post('/cancel-pending/:id', cancelPendingBooking);

router.get('/user/:userId', getUserBookings);

router.post('/cancel-booking/:id', cancelUserBooking);

export default router;
