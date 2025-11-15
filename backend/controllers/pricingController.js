import { calculatePricing } from '../utils/pricing.js';

/**
 * Calculate pricing for a charging session
 * POST /pricing
 * Body: { stationId, chargerId, durationHours, startTime (optional) }
 */
export const getPricing = async (req, res) => {
  try {
    const { stationId, chargerId, durationHours, startTime } = req.body;

    // Validate required fields
    if (!stationId || !chargerId || !durationHours) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stationId, chargerId, and durationHours are required',
      });
    }

    // Validate durationHours is a positive number
    const duration = parseFloat(durationHours);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'durationHours must be a positive number',
      });
    }

    // Parse startTime if provided
    let parsedStartTime = null;
    if (startTime) {
      parsedStartTime = new Date(startTime);
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startTime format',
        });
      }
    }

    // Calculate pricing using the regression model
    const pricing = await calculatePricing(stationId, chargerId, duration, parsedStartTime);

    res.status(200).json({
      success: true,
      data: {
        stationId,
        chargerId,
        durationHours: duration,
        ...pricing,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating pricing',
      error: error.message,
    });
  }
};

