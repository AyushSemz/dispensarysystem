import express from 'express';
import { createVisit, getMyVisits } from '../controllers/visitController.js';
import authMiddleware, { isDoctor } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getMyVisits);
router.post('/', isDoctor, createVisit);

export default router;