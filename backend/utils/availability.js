import Booking from '../models/Booking.js';

/**
 * Check if a charger is available for a given time range
 * @param {string} chargerId - ID of the charging point
 * @param {Date} startTime - Start time of the booking
 * @param {Date} endTime - End time of the booking
 * @param {string} excludeBookingId - Optional booking ID to exclude from conflict check (for updates)
 * @returns {Promise<{available: boolean, conflictingBookings: Array}>}
 */
export const checkChargerAvailability = async (chargerId, startTime, endTime, excludeBookingId = null) => {
  try {
    // Find bookings that overlap with the requested time range
    // Overlap condition: (start < existing.end) AND (end > existing.start)
    const query = {
      chargerId,
      bookingStatus: { $in: ['pending', 'booked'] }, // Only check active bookings
      $or: [
        {
          // Existing booking starts before requested end and ends after requested start
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    };

    // Exclude current booking if updating
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await Booking.find(query);

    return {
      available: conflictingBookings.length === 0,
      conflictingBookings,
    };
  } catch (error) {
    throw new Error(`Error checking charger availability: ${error.message}`);
  }
};

