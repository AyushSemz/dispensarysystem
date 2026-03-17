import express from 'express';
import { getNlpResultById } from '../controllers/nlpResultController.js';
import authMiddleware, { isDoctor } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(isDoctor);

router.get('/:resultId', getNlpResultById);

export default router;