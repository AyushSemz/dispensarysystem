import express from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;