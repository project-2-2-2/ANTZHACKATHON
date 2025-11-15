import User from '../models/User.js';
import Booking from '../models/Booking.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Get user usage summary
 * GET /users/:id/usage
 */
export const getUserUsage = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch all bookings for the user
    const allBookings = await Booking.find({ userId: id });

    // Calculate statistics
    const totalBookings = allBookings.length;
    const cancelledBookings = allBookings.filter(
      (booking) => booking.bookingStatus === 'cancelled'
    ).length;

    // Calculate total hours booked (only for booked/pending bookings)
    const activeBookings = allBookings.filter(
      (booking) => booking.bookingStatus !== 'cancelled'
    );
    const totalHoursBooked = activeBookings.reduce((total, booking) => {
      const durationMs = new Date(booking.endTime) - new Date(booking.startTime);
      const durationHours = durationMs / (1000 * 60 * 60);
      return total + durationHours;
    }, 0);

    // Calculate total money spent (only for booked/pending bookings)
    const moneySpent = activeBookings.reduce((total, booking) => {
      return total + booking.amount;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        userId: id,
        totalBookings,
        totalHoursBooked: Math.round(totalHoursBooked * 100) / 100,
        moneySpent: Math.round(moneySpent * 100) / 100,
        cancelledBookingsCount: cancelledBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user usage',
      error: error.message,
    });
  }
};

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ email, username, password: hashed });

    // create token containing user id
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({ success: true, data: { user: { _id: user._id, email: user.email, username: user.username }, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
  }
};

// Login existing user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(200).json({ success: true, data: { user: { _id: user._id, email: user.email, username: user.username }, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
};

