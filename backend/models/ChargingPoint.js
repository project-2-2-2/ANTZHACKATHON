import mongoose from 'mongoose';

/**
 * ChargingPoint Schema
 * Represents individual charging points at a station
 */
const chargingPointSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 0,
  },
  availabilityStatus: {
    type: String,
    enum: ['free', 'booked', 'in_use'],
    default: 'free',
  },
  connectorType: {
    type: String,
    enum: ['CCS', 'Type2', 'CHAdeMO'],
    required: true,
  },
}, {
  timestamps: true,
});

const ChargingPoint = mongoose.model('ChargingPoint', chargingPointSchema);

export default ChargingPoint;

