import Station from '../models/Station.js';
import ChargingPoint from '../models/ChargingPoint.js';
import Booking from '../models/Booking.js';
import { calculateDistance } from '../utils/distance.js';
import { checkChargerAvailability } from '../utils/availability.js';

/**
 * Get nearby stations within a specified radius
 * GET /stations/nearby?lat=&lng=&radius=
 */
export const getNearbyStations = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    // Validate input parameters
    if (!lat || !lng || !radius) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: lat, lng, and radius are required',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng) || isNaN(radiusKm)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter values: lat, lng, and radius must be valid numbers',
      });
    }

    // Fetch all stations
    const allStations = await Station.find({});

    // Filter stations within radius using Haversine formula
    const nearbyStations = allStations
      .map((station) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          station.location.lat,
          station.location.lng
        );
        return {
          station,
          distance,
        };
      })
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .map((item) => ({
        ...item.station.toObject(),
        distance: Math.round(item.distance * 100) / 100, // Round to 2 decimal places
      }));

    res.status(200).json({
      success: true,
      count: nearbyStations.length,
      data: nearbyStations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby stations',
      error: error.message,
    });
  }
};

/**
 * Get station details with real-time charging point availability
 * GET /stations/:id
 */
export const getStationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch station details
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    // Fetch all charging points for this station
    const chargingPoints = await ChargingPoint.find({ stationId: id });

    // Get current time for availability check
    const now = new Date();

    // Check real-time availability for each charging point
    const chargingPointsWithAvailability = await Promise.all(
      chargingPoints.map(async (charger) => {
        // Check for active bookings (currently in use - started but not ended)
        const activeBookings = await Booking.find({
          chargerId: charger._id,
          bookingStatus: { $in: ['pending', 'booked'] },
          startTime: { $lte: now },
          endTime: { $gt: now },
        });

        // If there's an active booking, status is "in_use"
        if (activeBookings.length > 0) {
          return {
            ...charger.toObject(),
            availabilityStatus: 'in_use',
          };
        }

        // Check for any future bookings (pending or booked)
        const futureBookings = await Booking.find({
          chargerId: charger._id,
          bookingStatus: { $in: ['pending', 'booked'] },
          startTime: { $gt: now },
        });

        // If there are future bookings, status is "booked"
        if (futureBookings.length > 0) {
          return {
            ...charger.toObject(),
            availabilityStatus: 'booked',
          };
        }

        // Otherwise, it's free
        return {
          ...charger.toObject(),
          availabilityStatus: 'free',
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        station: station.toObject(),
        chargingPoints: chargingPointsWithAvailability,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching station details',
      error: error.message,
    });
  }
};

