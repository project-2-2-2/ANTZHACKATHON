# EV Charging Station Finder + Slot Booking Backend

A complete Node.js + Express + MongoDB backend for EV charging station finder and slot booking system.

## 🚀 Tech Stack

- **Node.js** + **Express** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **dotenv** - Environment variable management

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection configuration
├── models/
│   ├── User.js            # User schema
│   ├── Station.js         # Station schema
│   ├── ChargingPoint.js   # Charging point schema
│   └── Booking.js         # Booking schema
├── routes/
│   ├── stationRoutes.js   # Station-related routes
│   ├── pricingRoutes.js   # Pricing calculation routes
│   ├── bookingRoutes.js   # Booking management routes
│   └── userRoutes.js      # User-related routes
├── controllers/
│   ├── stationController.js
│   ├── pricingController.js
│   ├── bookingController.js
│   └── userController.js
├── utils/
│   ├── distance.js        # Haversine distance calculation
│   ├── availability.js    # Charger availability checking
│   └── pricing.js         # Dynamic pricing calculation
├── server.js              # Main server file
└── package.json
```

## 🗄️ Database Schemas

### User
- `email` (String, unique, required)
- `username` (String, required)
- `password` (String, required)

### Station
- `name` (String, required)
- `location` (Object: `lat`, `lng`)
- `price` (Number, base price per hour)
- `openingHours` (Object: `open`, `close`)

### ChargingPoint
- `stationId` (ObjectId, ref: Station)
- `capacity` (Number, required)
- `availabilityStatus` (Enum: "free", "booked", "in_use")
- `connectorType` (Enum: "CCS", "Type2", "CHAdeMO")

### Booking
- `stationId` (ObjectId, ref: Station)
- `chargerId` (ObjectId, ref: ChargingPoint)
- `userId` (ObjectId, ref: User)
- `startTime` (Date, required)
- `endTime` (Date, required)
- `amount` (Number, required)
- `bookingStatus` (Enum: "pending", "booked", "cancelled")

## 🔌 API Endpoints

### 1. Get Nearby Stations
**GET** `/stations/nearby?lat={latitude}&lng={longitude}&radius={radiusInKm}`

Returns stations within the specified radius using Haversine formula.

**Example:**
```
GET /stations/nearby?lat=28.6139&lng=77.2090&radius=10
```

### 2. Get Station Details
**GET** `/stations/:id`

Returns station details with real-time charging point availability.

**Example:**
```
GET /stations/507f1f77bcf86cd799439011
```

### 3. Calculate Pricing
**POST** `/pricing`

**Body:**
```json
{
  "stationId": "507f1f77bcf86cd799439011",
  "chargerId": "507f1f77bcf86cd799439012",
  "durationHours": 2,
  "startTime": "2024-01-15T18:00:00Z" // Optional
}
```

**Pricing Formula:**
```
pricePerHour = station.price + 0.5 * charger.capacity + 2 * peakHourFlag + 1 * demandFactor
```

Where:
- `peakHourFlag` = 2 if time is between 18:00-22:00, else 0
- `demandFactor` = number of bookings in next 2 hours

### 4. Create Booking
**POST** `/booking`

**Body:**
```json
{
  "stationId": "507f1f77bcf86cd799439011",
  "chargerId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439013",
  "startTime": "2024-01-15T18:00:00Z",
  "endTime": "2024-01-15T20:00:00Z"
}
```

**Logic:**
- Checks for conflicting bookings (overlapping time ranges)
- Calculates pricing automatically
- Mock payment success (no real payment gateway)
- Creates booking with status "booked"

### 5. Cancel Booking
**POST** `/booking/cancel/:id`

**Cancellation Rules:**
- If cancelled 10+ minutes before startTime → Full refund
- Else → No refund

**Example:**
```
POST /booking/cancel/507f1f77bcf86cd799439014
```

### 6. Get User Usage
**GET** `/users/:id/usage`

Returns user usage summary:
- Total bookings
- Total hours booked
- Money spent
- Cancelled bookings count

**Example:**
```
GET /users/507f1f77bcf86cd799439013/usage
```

## 🛠️ Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ev-charging
   PORT=5000
   NODE_ENV=development
   ```

3. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

4. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Verify Server is Running**
   
   Visit `http://localhost:5000` or `http://localhost:5000/health`

## 📝 Notes

- **No Authentication**: This backend does not include login/authentication logic as per requirements.
- **Mock Payments**: Payment processing is mocked - no real payment gateway integration.
- **Availability Logic**: Real-time availability is calculated based on active bookings.
- **Overlap Detection**: Bookings are considered conflicting if:
  - `(startTime < existing.endTime) AND (endTime > existing.startTime)`

## 🧪 Testing the API

You can test the API using tools like:
- **Postman**
- **curl**
- **Thunder Client** (VS Code extension)
- **Insomnia**

### Example curl Commands

**Get Nearby Stations:**
```bash
curl "http://localhost:5000/stations/nearby?lat=28.6139&lng=77.2090&radius=10"
```

**Calculate Pricing:**
```bash
curl -X POST http://localhost:5000/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "507f1f77bcf86cd799439011",
    "chargerId": "507f1f77bcf86cd799439012",
    "durationHours": 2,
    "startTime": "2024-01-15T18:00:00Z"
  }'
```

**Create Booking:**
```bash
curl -X POST http://localhost:5000/booking \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "507f1f77bcf86cd799439011",
    "chargerId": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439013",
    "startTime": "2024-01-15T18:00:00Z",
    "endTime": "2024-01-15T20:00:00Z"
  }'
```

## 🔧 Utility Functions

### `calculateDistance(lat1, lng1, lat2, lng2)`
Calculates distance between two coordinates using Haversine formula (returns kilometers).

### `checkChargerAvailability(chargerId, startTime, endTime)`
Checks if a charger is available for a given time range, returns availability status and conflicting bookings.

### `calculatePricing(stationId, chargerId, durationHours, startTime)`
Implements the dynamic pricing regression model based on station price, charger capacity, peak hours, and demand.

## 📄 License

ISC

