import express from 'express';
import {
    getAllDoctorProfiles,
    getDoctorProfileById,
    getMyPatientProfile
} from '../controllers/profileController.js';
import authMiddleware, { isPatient } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/doctors', getAllDoctorProfiles);
router.get('/doctors/:doctorId', getDoctorProfileById);
router.get('/patients/me', authMiddleware, isPatient, getMyPatientProfile);


export default router;