import express from 'express';
import {
    runAnomalyDetection,
    getAllActiveAlerts,
    getAlertById,
    acknowledgeAlertHandler,
    resolveAlertHandler,
    getAlertHistory,
    getSymptomStatistics,
    getAlertDashboard,
    detectSymptomAnomaly,
} from '../controllers/alertController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard and summary
router.get('/dashboard', getAlertDashboard);

// Run anomaly detection
router.post('/detect', runAnomalyDetection);
router.post('/detect/:symptom', detectSymptomAnomaly);

// Alert management
router.get('/', getAllActiveAlerts);
router.get('/history', getAlertHistory);
router.get('/:alertId', getAlertById);
router.post('/:alertId/acknowledge', acknowledgeAlertHandler);
router.post('/:alertId/resolve', resolveAlertHandler);

// Statistics
router.get('/statistics/:symptom', getSymptomStatistics);

export default router;
