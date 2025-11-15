import Station from '../models/Station.js';
import ChargingPoint from '../models/ChargingPoint.js';
import Booking from '../models/Booking.js';

/**
 * Calculate dynamic pricing for a charging session
 * Pricing formula:
 * pricePerHour = station.price + 0.5 * charger.capacity + 2 * peakHourFlag + 1 * demandFactor
 * 
 * @param {string} stationId - ID of the charging station
 * @param {string} chargerId - ID of the charging point
 * @param {number} durationHours - Duration of charging in hours
 * @param {Date} startTime - Start time of the booking (optional, for peak hour calculation)
 * @returns {Promise<{pricePerHour: number, totalAmount: number}>}
 */
export const calculatePricing = async (stationId, chargerId, durationHours, startTime = null) => {
  try {
    const station = await Station.findById(stationId);
    const charger = await ChargingPoint.findById(chargerId);

    if (!station) {
      throw new Error('Station not found');
    }
    if (!charger) {
      throw new Error('Charging point not found');
    }

    // Base price from station
    const basePrice = station.price;

    // Capacity factor: 0.5 * charger.capacity
    const capacityFactor = 0.5 * charger.capacity;

    // Peak hour flag: 2 if time is between 18:00-22:00
    let peakHourFlag = 0;
    if (startTime) {
      const hour = startTime.getHours();
      if (hour >= 18 && hour < 22) {
        peakHourFlag = 2;
      }
    }

    // Demand factor: 1 * (number of bookings in next 2 hours)
    let demandFactor = 0;
    if (startTime) {
      const twoHoursLater = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
      const upcomingBookings = await Booking.countDocuments({
        stationId,
        bookingStatus: { $in: ['pending', 'booked'] },
        startTime: { $gte: startTime, $lte: twoHoursLater },
      });
      demandFactor = upcomingBookings;
    }

    // Calculate price per hour using regression formula
    const pricePerHour = basePrice + capacityFactor + peakHourFlag + demandFactor;

    // Calculate total amount
    const totalAmount = pricePerHour * durationHours;

    return {
      pricePerHour: Math.round(pricePerHour * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  } catch (error) {
    throw new Error(`Error calculating pricing: ${error.message}`);
  }
};

