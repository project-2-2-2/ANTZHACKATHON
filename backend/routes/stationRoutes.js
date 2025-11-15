import express from 'express';
import {
  getNearbyStations,
  getStationById,
} from '../controllers/stationController.js';

const router = express.Router();

// GET /stations/nearby?lat=&lng=&radius=
router.get('/nearby', getNearbyStations);

// GET /stations/:id
router.get('/:id', getStationById);

export default router;

