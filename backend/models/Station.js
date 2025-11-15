import mongoose from 'mongoose';

/**
 * Station Schema
 * Represents an EV charging station with location and pricing information
 */
const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  openingHours: {
    open: {
      type: String,
      required: true,
      default: '00:00',
    },
    close: {
      type: String,
      required: true,
      default: '23:59',
    },
  },
}, {
  timestamps: true,
});

const Station = mongoose.model('Station', stationSchema);

export default Station;

