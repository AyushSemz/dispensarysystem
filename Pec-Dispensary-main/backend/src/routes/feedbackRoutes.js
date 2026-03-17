import express from 'express';
import { 
    createFeedback, 
    getFeedbackForVisit, 
    getAllDoctorFeedbacks,
    getDoctorSentimentStatistics
} from '../controllers/feedbackController.js';
import authMiddleware, { isPatient, isDoctor } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', isPatient, createFeedback);
router.get('/doctor/all', isDoctor, getAllDoctorFeedbacks);
router.get('/doctor/sentiment-stats', isDoctor, getDoctorSentimentStatistics);
router.get('/:visitId', isDoctor, getFeedbackForVisit);

export default router;