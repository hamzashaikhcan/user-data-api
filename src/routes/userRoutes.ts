import { Router } from 'express';
import { getUserById, createUser, getAllUsers } from '../controllers/userController';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiter to all user routes
router.use(apiRateLimiter);

// GET all users
router.get('/', getAllUsers);

// GET user by ID
router.get('/:id', getUserById);

// POST create new user
router.post('/', createUser);

export default router;