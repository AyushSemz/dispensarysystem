import express from 'express';
import { createAppointment, getMyAppointments, updateAppointmentStatus } from '../controllers/appointmentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getMyAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;