import Booking from '../models/Booking.js';
import ChargingPoint from '../models/ChargingPoint.js';
import { createBookingAtomic, verifyBookingPayment } from '../utils/bookingTransactions.js';

/**
 * Initiate a booking and set payment deadline
 * POST /payment/initiate-booking
 * Body: { stationId, chargerId, userId, startTime, endTime }
 */
export const initiateBooking = async (req, res) => {
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

    // Calculate duration in hours
    const durationMs = parsedEndTime.getTime() - parsedStartTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate pricing (simple calculation: 100 per hour)
    const amount = Math.round(durationHours * 100 * 100) / 100;

    // Generate payment ID
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Set payment deadline to 5 minutes from now
    const paymentDeadline = new Date(Date.now() + 5 * 60 * 1000);

    // Attempt to create booking - handles race conditions automatically
    try {
      const bookingData = {
        stationId,
        chargerId,
        userId,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        amount,
        bookingStatus: 'pending',
        paymentStatus: 'pending',
        paymentDeadline,
        paymentId,
      };

      const booking = await createBookingAtomic(bookingData);

      return res.status(201).json({
        success: true,
        message: 'Booking initiated. Please complete payment within 5 minutes.',
        data: {
          booking,
          paymentDeadline,
          paymentId,
          amount,
        },
      });
    } catch (bookingError) {
      if (bookingError.code === 'CONFLICT_DETECTED') {
        return res.status(409).json({
          success: false,
          message: bookingError.message,
        });
      }
      throw bookingError;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error initiating booking',
      error: error.message,
    });
  }
};

/**
 * Simulate payment verification
 * POST /payment/verify
 * Body: { bookingId, paymentId, cardNumber, cardExpiry, cardCvv }
 */
export const verifyPayment = async (req, res) => {
  try {
    const { bookingId, paymentId, cardNumber, cardExpiry, cardCvv } = req.body;

    if (!bookingId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId and paymentId are required',
      });
    }

    // Validate card number (basic check: must be 16 digits)
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card number',
      });
    }

    // Validate expiry (MM/YY format)
    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card expiry format (use MM/YY)',
      });
    }

    // Validate CVV (3 or 4 digits)
    if (!cardCvv || !/^\d{3,4}$/.test(cardCvv)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CVV',
      });
    }

    // Find booking and verify state atomically
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if booking is still in pending state
    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been processed',
      });
    }

    // Check if payment deadline has passed
    const now = new Date();
    if (now > booking.paymentDeadline) {
      booking.paymentStatus = 'expired';
      booking.bookingStatus = 'cancelled';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'Payment deadline expired. Booking has been cancelled.',
      });
    }

    // Check if payment ID matches
    if (booking.paymentId !== paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID',
      });
    }

    // Simulate payment success (90% success rate)
    const paymentSucceeded = Math.random() < 0.9;

    if (paymentSucceeded) {
      // Update booking status to "booked" and payment status to "success"
      booking.paymentStatus = 'success';
      booking.bookingStatus = 'booked';

      // Mark charging point as booked
      const charger = await ChargingPoint.findById(booking.chargerId);
      if (charger) {
        charger.availabilityStatus = 'booked';
        await charger.save();
      }

      await booking.save();

      return res.status(200).json({
        success: true,
        message: 'Payment successful! Booking confirmed.',
        data: {
          booking,
          transactionId: `TXN_${Date.now()}`,
        },
      });
    } else {
      // Payment failed
      booking.paymentStatus = 'failed';
      booking.bookingStatus = 'cancelled';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again or use a different card.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

/**
 * Get booking details
 * GET /payment/booking/:id
 */
export const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('stationId')
      .populate('chargerId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message,
    });
  }
};

/**
 * Cancel pending booking if payment not completed
 * POST /payment/cancel-pending/:id
 */
export const cancelPendingBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be cancelled at this stage',
      });
    }

    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'expired';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message,
    });
  }
};

/**
 * Get all bookings for a user
 * GET /payment/user/:userId
 */
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ userId })
      .populate('stationId', 'name address location price openingHours')
      .populate('chargerId', 'connectorType capacity availabilityStatus')
      .sort({ startTime: -1 });

    const now = new Date();

    // Separate upcoming and previous bookings
    const upcomingBookings = bookings.filter(
      (b) => b.startTime > now && b.bookingStatus !== 'cancelled'
    );
    const previousBookings = bookings.filter(
      (b) => b.startTime <= now || b.bookingStatus === 'cancelled'
    );

    res.status(200).json({
      success: true,
      data: {
        upcoming: upcomingBookings,
        previous: previousBookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user bookings',
      error: error.message,
    });
  }
};

/**
 * Cancel an upcoming booking with refund logic
 * POST /payment/cancel-booking/:id
 */
export const cancelUserBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    // Calculate refund based on cancellation time
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDifferenceMs = startTime.getTime() - now.getTime();
    const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

    let refundAmount = 0;
    let refundPolicy = '';

    // Refund policy: 10+ minutes before startTime → full refund, else → no refund
    if (timeDifferenceMinutes >= 10) {
      refundAmount = booking.amount;
      refundPolicy = 'Full refund - cancelled more than 10 minutes before start time';
    } else {
      refundPolicy = 'No refund - cancelled less than 10 minutes before start time';
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Update charger availability back to free if no other bookings
    const otherBookings = await Booking.find({
      chargerId: booking.chargerId,
      bookingStatus: { $in: ['pending', 'booked'] },
      _id: { $ne: id },
    });

    if (otherBookings.length === 0) {
      await ChargingPoint.findByIdAndUpdate(booking.chargerId, {
        availabilityStatus: 'free',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        refund: {
          amount: Math.round(refundAmount * 100) / 100,
          policy: refundPolicy,
        },
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

