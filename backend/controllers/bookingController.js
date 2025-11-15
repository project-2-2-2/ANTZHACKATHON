import Booking from '../models/Booking.js';
import Station from '../models/Station.js';
import ChargingPoint from '../models/ChargingPoint.js';
import { checkChargerAvailability } from '../utils/availability.js';
import { calculatePricing } from '../utils/pricing.js';

/**
 * Create a new booking
 * POST /booking
 * Body: { stationId, chargerId, userId, startTime, endTime }
 */
export const createBooking = async (req, res) => {
  try {
    const { stationId, chargerId, userId, startTime, endTime } = req.body;

    // Validate required fields
    if (!stationId || !chargerId || !userId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stationId, chargerId, userId, startTime, and endTime are required',
      });
    }

    // Parse and validate dates
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for startTime or endTime',
      });
    }

    // Validate endTime is after startTime
    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be after startTime',
      });
    }

    // Validate station and charger exist
    const station = await Station.findById(stationId);
    const charger = await ChargingPoint.findById(chargerId);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charging point not found',
      });
    }

    // Verify charger belongs to station
    if (charger.stationId.toString() !== stationId) {
      return res.status(400).json({
        success: false,
        message: 'Charging point does not belong to the specified station',
      });
    }

    // Check for conflicting bookings
    const availability = await checkChargerAvailability(
      chargerId,
      parsedStartTime,
      parsedEndTime
    );

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: 'Charger is not available for the requested time slot',
        conflictingBookings: availability.conflictingBookings.length,
      });
    }

    // Calculate duration in hours
    const durationMs = parsedEndTime.getTime() - parsedStartTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate pricing
    const pricing = await calculatePricing(stationId, chargerId, durationHours, parsedStartTime);

    // Mock payment success (no real payment gateway calls)
    // In a real application, you would integrate with Razorpay or similar here

    // Create booking with status "booked"
    const booking = await Booking.create({
      stationId,
      chargerId,
      userId,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      amount: pricing.totalAmount,
      bookingStatus: 'booked',
    });

    // Populate references for response
    await booking.populate('stationId chargerId userId');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message,
    });
  }
};

/**
 * Cancel a booking
 * POST /booking/cancel/:id
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if booking is already cancelled
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    // Calculate time difference between now and startTime
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDifferenceMs = startTime.getTime() - now.getTime();
    const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

    // Cancellation rule: 10+ minutes before startTime → full refund, else → no refund
    let refundAmount = 0;
    if (timeDifferenceMinutes >= 10) {
      refundAmount = booking.amount;
    }

    // Update booking status to cancelled
    booking.bookingStatus = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId: booking._id,
        refundAmount: Math.round(refundAmount * 100) / 100,
        cancellationTime: now,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message,
    });
  }
};

