import express from 'express';
import { createRemark, getRemarksForVisit } from '../controllers/remarkController.js';
import authMiddleware, { isDoctor } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', isDoctor, createRemark);
router.get('/:visitId', getRemarksForVisit);

export default router;