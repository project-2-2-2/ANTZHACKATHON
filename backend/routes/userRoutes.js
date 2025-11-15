import express from 'express';
import { getUserUsage, registerUser, loginUser } from '../controllers/userController.js';

const router = express.Router();

// GET /users/:id/usage
router.get('/:id/usage', getUserUsage);

// POST /users/register
router.post('/register', registerUser);

// POST /users/login
router.post('/login', loginUser);

export default router;
