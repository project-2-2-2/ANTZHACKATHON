# EV Charging Station Finder - Frontend

A modern React frontend for the EV Charging Station Finder application with interactive map, booking system, and usage tracking.

## 🚀 Features

- **🗺️ Interactive Map View** - Find nearby stations using Leaflet maps
- **📋 Station List View** - Browse stations in a clean list format
- **📍 Location Services** - Use your current location or search manually
- **🔌 Station Details** - View charging points, availability, and pricing
- **💰 Dynamic Pricing** - Real-time pricing calculation based on demand and time
- **💳 Payment Flow** - Mock payment system with card and UPI options
- **📊 Usage Summary** - Track your booking history and spending
- **❌ Cancellation** - Cancel bookings with grace period refund rules

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Leaflet + React-Leaflet** - Interactive maps
- **Axios** - HTTP client for API calls
- **CSS3** - Modern styling with gradients and animations

## 📦 Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🎨 Features Overview

### Map View
- Interactive map with station markers
- Color-coded markers (green = available, orange = booked, red = selected)
- Click markers to view station details
- Popup with station information

### Station List
- Grid view of all nearby stations
- Shows distance, price, and availability
- Click to view details and book

### Booking Flow
1. **Select Station** - Choose from map or list
2. **Select Charger** - Pick available charging point
3. **Set Time & Duration** - Choose start time and duration
4. **View Pricing** - See dynamic pricing calculation
5. **Payment** - Complete mock payment
6. **Confirmation** - Receive booking confirmation

### Dynamic Pricing
Pricing is calculated using:
- Base station price
- Charger capacity factor
- Peak hour multiplier (18:00-22:00)
- Demand factor (upcoming bookings)

### Cancellation
- **10+ minutes before start**: Full refund
- **Less than 10 minutes**: No refund
- Clear refund status display

### Usage Summary
- Total bookings count
- Total hours booked
- Total money spent
- Cancelled bookings count
- Average statistics

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1920px+)
- Tablet (768px - 1920px)
- Mobile (320px - 768px)

## 🔌 API Integration

The frontend connects to the backend API at `http://localhost:5000` (configurable via `.env`).

### API Endpoints Used:
- `GET /stations/nearby` - Find nearby stations
- `GET /stations/:id` - Get station details
- `POST /pricing` - Calculate pricing
- `POST /booking` - Create booking
- `POST /booking/cancel/:id` - Cancel booking
- `GET /users/:id/usage` - Get usage summary

## 🎯 Usage

1. **Find Stations**
   - Click "Use My Location" or manually search
   - Adjust search radius (1-50 km)
   - View stations on map or in list

2. **Book a Slot**
   - Click on a station
   - Select a charging point
   - Choose start time and duration
   - Review pricing
   - Complete payment

3. **View Usage**
   - Click "My Usage" button
   - View booking statistics
   - Track spending and hours

4. **Cancel Booking**
   - Access from booking details (if implemented)
   - Check refund eligibility
   - Confirm cancellation

## 🎨 Styling

- Modern gradient designs
- Smooth animations and transitions
- Color-coded status indicators
- Responsive grid layouts
- Custom scrollbars
- Modal overlays with backdrop blur

## 🐛 Troubleshooting

**Map not loading?**
- Ensure Leaflet CSS is imported
- Check browser console for errors
- Verify internet connection (for map tiles)

**API errors?**
- Ensure backend is running on port 5000
- Check `.env` file configuration
- Verify CORS is enabled on backend

**Location not working?**
- Grant browser location permissions
- Use manual search as fallback
- Default location (Delhi) will be used

## 📄 License

ISC
