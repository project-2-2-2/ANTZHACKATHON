import mongoose from 'mongoose';

/**
 * Booking Schema
 * Stores booking information for EV charging slots
 */
const bookingSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  chargerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargingPoint',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'booked', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed', 'expired'],
    default: 'pending',
  },
  paymentDeadline: {
    type: Date,
    required: true,
  },
  paymentId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient querying of overlapping bookings
bookingSchema.index({ chargerId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ userId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

