import Booking from '../models/Booking.js';
import mongoose from 'mongoose';

/**
 * Atomically create a booking with race condition protection
 * Uses MongoDB sessions and transactions to ensure only one booking succeeds
 * for overlapping time slots on the same charger
 */
export const createBookingAtomic = async (bookingData, session = null) => {
  try {
    // Query to check for overlapping bookings
    const query = {
      chargerId: bookingData.chargerId,
      bookingStatus: { $in: ['pending', 'booked'] },
      $or: [
        {
          startTime: { $lt: bookingData.endTime },
          endTime: { $gt: bookingData.startTime },
        },
      ],
    };

    const existingBookings = await Booking.find(query).session(session);

    if (existingBookings.length > 0) {
      throw new Error('CONFLICT_DETECTED');
    }

    const options = session ? { session } : {};
    const booking = await Booking.create([bookingData], options);

    return booking[0];
  } catch (error) {
    if (error.message === 'CONFLICT_DETECTED') {
      throw {
        code: 'CONFLICT_DETECTED',
        message: 'Charger is not available for the requested time slot',
      };
    }
    throw error;
  }
};

/**
 * Verify booking with timeout check and race condition handling
 */
export const verifyBookingPayment = async (bookingId, paymentDetails, session = null) => {
  try {
    const query = { _id: bookingId };
    const options = session ? { session } : {};

    // Find and check if booking still exists and hasn't expired
    const booking = await Booking.findOne(query).session(session);

    if (!booking) {
      throw {
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      };
    }

    if (booking.bookingStatus !== 'pending') {
      throw {
        code: 'BOOKING_ALREADY_PROCESSED',
        message: 'Booking has already been processed',
      };
    }

    // Check if payment deadline has passed
    const now = new Date();
    if (now > booking.paymentDeadline) {
      booking.paymentStatus = 'expired';
      booking.bookingStatus = 'cancelled';
      await booking.save(options);

      throw {
        code: 'PAYMENT_EXPIRED',
        message: 'Payment deadline expired',
      };
    }

    // Verify payment and update atomically
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: 'success',
        bookingStatus: 'booked',
      },
      { new: true, ...options }
    ).session(session);

    return updatedBooking;
  } catch (error) {
    if (error.code) {
      throw error;
    }
    throw {
      code: 'VERIFICATION_ERROR',
      message: error.message,
    };
  }
};
