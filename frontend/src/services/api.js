import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach token from localStorage if present
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// attempt to initialize token from storage
const savedToken = localStorage.getItem('token');
if (savedToken) setAuthToken(savedToken);

// Get nearby stations
export const getNearbyStations = (lat, lng, radius = 10) => {
  return api.get('/stations/nearby', { params: { lat, lng, radius } });
};

// Get a single station by id
export const getStationById = (id) => {
  return api.get(`/stations/${id}`);
};

// Auth helpers
export const registerUser = (payload) => {
  return api.post('/users/register', payload);
};

export const loginUser = (payload) => {
  return api.post('/users/login', payload);
};

export const initiateBooking = (payload) => {
  return api.post('/payment/initiate-booking', payload);
};

export const verifyPayment = (payload) => {
  return api.post('/payment/verify', payload);
};

export const getBookingDetails = (bookingId) => {
  return api.get(`/payment/booking/${bookingId}`);
};

export const cancelPendingBooking = (bookingId) => {
  return api.post(`/payment/cancel-pending/${bookingId}`);
};

export const getUserBookings = (userId) => {
  return api.get(`/payment/user/${userId}`);
};

export const cancelUserBooking = (bookingId) => {
  return api.post(`/payment/cancel-booking/${bookingId}`);
};

export default api;
