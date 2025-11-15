// connectDB.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Station from '../models/Station.js'; // adjust path if needed
import ChargingPoint from '../models/ChargingPoint.js'; // adjust path if needed

dotenv.config();

const BASE_LAT = 15.759619395745585;
const BASE_LNG = 78.03902722949863;
const RADIUS_KM = 25; // 25 km radius
const EARTH_RADIUS_KM = 6371;

/* --- helper: random point within radius --- */
function randomPointWithinRadius(latDeg, lngDeg, maxKm) {
  const lat = (latDeg * Math.PI) / 180;
  const lng = (lngDeg * Math.PI) / 180;

  const rand = Math.random();
  const distKm = Math.sqrt(rand) * maxKm;
  const angularDist = distKm / EARTH_RADIUS_KM;
  const bearing = Math.random() * 2 * Math.PI;

  const newLat = Math.asin(
    Math.sin(lat) * Math.cos(angularDist) + Math.cos(lat) * Math.sin(angularDist) * Math.cos(bearing)
  );

  const newLng =
    lng +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDist) * Math.cos(lat),
      Math.cos(angularDist) - Math.sin(lat) * Math.sin(newLat)
    );

  return {
    lat: (newLat * 180) / Math.PI,
    lng: (newLng * 180) / Math.PI,
  };
}

/* --- seed station documents (upsert by name) --- */
async function seedStations() {
  try {
    const names = [
      'Seed Station Alpha',
      'Seed Station Beta',
      'Seed Station Gamma',
      'Seed Station Delta',
      'Seed Station Epsilon',
    ];

    const promises = names.map(async (name) => {
      const loc = randomPointWithinRadius(BASE_LAT, BASE_LNG, RADIUS_KM);
      const price = +(Math.random() * (25 - 5) + 5).toFixed(2); // 5..25
      const openingHours = { open: '06:00', close: '23:00' };

      const res = await Station.updateOne(
        { name },
        {
          $setOnInsert: {
            name,
            location: { lat: loc.lat, lng: loc.lng },
            price,
            openingHours,
          },
        },
        { upsert: true }
      );

      if (res.upsertedCount && res.upsertedCount > 0) {
        console.log(`Inserted station "${name}" at (${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)})`);
      } else {
        console.log(`Station "${name}" already existed — skipped insertion.`);
      }
    });

    await Promise.all(promises);
    console.log('Station seeding complete.');
  } catch (err) {
    console.error('Error during station seeding:', err);
  }
}

/* --- add 2..4 charging connectors per station --- */
async function addChargingPointsForStations() {
  try {
    // connector types and typical power capacities (kW) to sample from
    const connectorTypes = ['CCS', 'Type2', 'CHAdeMO'];
    const capacities = [7, 11, 22, 50, 100, 150]; // typical capacities

    const stations = await Station.find({}); // all stations
    if (!stations || stations.length === 0) {
      console.log('No stations found to add charging points to.');
      return;
    }

    for (const station of stations) {
      const existingCount = await ChargingPoint.countDocuments({ stationId: station._id });

      // choose a random target between 2 and 4
      const target = Math.floor(Math.random() * (4 - 2 + 1)) + 2;

      if (existingCount >= target) {
        console.log(
          `Station "${station.name}" already has ${existingCount} charging points (target ${target}) — skipping.`
        );
        continue;
      }

      const toCreate = target - existingCount;
      const docs = [];

      for (let i = 0; i < toCreate; i++) {
        const connectorType = connectorTypes[Math.floor(Math.random() * connectorTypes.length)];
        const capacity = capacities[Math.floor(Math.random() * capacities.length)];
        docs.push({
          stationId: station._id,
          capacity,
          connectorType,
          availabilityStatus: 'free', // explicit for clarity, schema default already 'free'
        });
      }

      const inserted = await ChargingPoint.insertMany(docs);
      console.log(`Added ${inserted.length} charging points to station "${station.name}".`);
    }

    console.log('Charging point seeding complete.');
  } catch (err) {
    console.error('Error while adding charging points:', err);
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ev-charging', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Only run seeding when explicitly requested (safer).
    if (process.env.SEED_STATIONS === 'true') {
      await seedStations();
      await addChargingPointsForStations();
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
