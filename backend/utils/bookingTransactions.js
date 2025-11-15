import Booking from '../models/Booking.js';

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
