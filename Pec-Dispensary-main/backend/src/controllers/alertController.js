import { 
    processAllSymptomsForAnomalies, 
    getActiveAlerts, 
    acknowledgeAlert, 
    resolveAlert,
    updateSymptomStatistics,
    detectAnomaliesAndCreateAlerts
} from '../services/anomalyDetectionService.js';
import { supabase } from '../config/supabase.js';

/**
 * Run anomaly detection for current date
 * @route POST /api/alerts/detect
 * @access Doctor, Admin
 */
export const runAnomalyDetection = async (req, res) => {
    try {
        const alerts = await processAllSymptomsForAnomalies();
        
        res.status(200).json({
            message: 'Anomaly detection completed',
            alertsCreated: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error('Error running anomaly detection:', error);
        res.status(500).json({ message: 'Failed to run anomaly detection' });
    }
};

/**
 * Get all active alerts
 * @route GET /api/alerts
 * @access Doctor, Admin
 */
export const getAllActiveAlerts = async (req, res) => {
    try {
        const { symptom, severity } = req.query;
        
        const filters = {};
        if (symptom) filters.symptom = symptom;
        if (severity) filters.severity = severity;
        
        const alerts = await getActiveAlerts(filters);
        
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ message: 'Failed to fetch alerts' });
    }
};

/**
 * Get alert by ID
 * @route GET /api/alerts/:alertId
 * @access Doctor, Admin
 */
export const getAlertById = async (req, res) => {
    const { alertId } = req.params;
    
    try {
        const { data: alert, error } = await supabase
            .from('outbreak_alerts')
            .select('*')
            .eq('id', alertId)
            .single();
        
        if (error || !alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        
        res.status(200).json(alert);
    } catch (error) {
        console.error('Error fetching alert:', error);
        res.status(500).json({ message: 'Failed to fetch alert' });
    }
};

/**
 * Acknowledge an alert
 * @route POST /api/alerts/:alertId/acknowledge
 * @access Doctor, Admin
 */
export const acknowledgeAlertHandler = async (req, res) => {
    const { alertId } = req.params;
    const { notes } = req.body;
    const doctorId = req.user.userId;
    
    try {
        const alert = await acknowledgeAlert(alertId, doctorId, notes);
        
        res.status(200).json({
            message: 'Alert acknowledged',
            alert,
        });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({ message: 'Failed to acknowledge alert' });
    }
};

/**
 * Resolve an alert
 * @route POST /api/alerts/:alertId/resolve
 * @access Doctor, Admin
 */
export const resolveAlertHandler = async (req, res) => {
    const { alertId } = req.params;
    const { notes } = req.body;
    const doctorId = req.user.userId;
    
    try {
        const alert = await resolveAlert(alertId, doctorId, notes);
        
        res.status(200).json({
            message: 'Alert resolved',
            alert,
        });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ message: 'Failed to resolve alert' });
    }
};

/**
 * Get alert history
 * @route GET /api/alerts/history
 * @access Doctor, Admin
 */
export const getAlertHistory = async (req, res) => {
    try {
        const { startDate, endDate, symptom, status } = req.query;
        
        let query = supabase
            .from('outbreak_alerts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        
        if (symptom) {
            query = query.eq('symptom', symptom);
        }
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data: alerts, error } = await query;
        
        if (error) {
            console.error('Error fetching alert history:', error);
            return res.status(500).json({ message: 'Failed to fetch alert history' });
        }
        
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Error in getAlertHistory:', error);
        res.status(500).json({ message: 'Failed to fetch alert history' });
    }
};

/**
 * Get symptom statistics
 * @route GET /api/alerts/statistics/:symptom
 * @access Doctor, Admin
 */
export const getSymptomStatistics = async (req, res) => {
    const { symptom } = req.params;
    const { startDate, endDate } = req.query;
    
    try {
        let query = supabase
            .from('symptom_statistics')
            .select('*')
            .eq('symptom', symptom)
            .order('date', { ascending: true });
        
        if (startDate) {
            query = query.gte('date', startDate);
        }
        
        if (endDate) {
            query = query.lte('date', endDate);
        }
        
        const { data: stats, error } = await query;
        
        if (error) {
            console.error('Error fetching symptom statistics:', error);
            return res.status(500).json({ message: 'Failed to fetch symptom statistics' });
        }
        
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error in getSymptomStatistics:', error);
        res.status(500).json({ message: 'Failed to fetch symptom statistics' });
    }
};

/**
 * Get dashboard summary
 * @route GET /api/alerts/dashboard
 * @access Doctor, Admin
 */
export const getAlertDashboard = async (req, res) => {
    try {
        // Get active alerts count by severity
        const { data: activeAlerts } = await supabase
            .from('outbreak_alerts')
            .select('severity')
            .eq('status', 'ACTIVE');
        
        const alertsBySeverity = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
        };
        
        if (activeAlerts) {
            activeAlerts.forEach(alert => {
                alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
            });
        }
        
        // Get total alerts in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentAlerts, count: recentCount } = await supabase
            .from('outbreak_alerts')
            .select('*', { count: 'exact' })
            .gte('created_at', sevenDaysAgo.toISOString());
        
        // Get top symptoms with alerts
        const symptomCounts = {};
        if (activeAlerts) {
            activeAlerts.forEach(alert => {
                const symptomName = alert.symptom || 'unknown';
                symptomCounts[symptomName] = (symptomCounts[symptomName] || 0) + 1;
            });
        }
        
        const topSymptoms = Object.entries(symptomCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([symptom, count]) => ({ symptom, count }));
        
        res.status(200).json({
            activeAlertsCount: activeAlerts ? activeAlerts.length : 0,
            alertsBySeverity,
            recentAlertsCount: recentCount || 0,
            topSymptoms,
        });
    } catch (error) {
        console.error('Error fetching alert dashboard:', error);
        res.status(500).json({ message: 'Failed to fetch alert dashboard' });
    }
};

/**
 * Manually trigger detection for specific symptom
 * @route POST /api/alerts/detect/:symptom
 * @access Doctor, Admin
 */
export const detectSymptomAnomaly = async (req, res) => {
    const { symptom } = req.params;
    
    try {
        // Update statistics
        await updateSymptomStatistics(symptom, new Date());
        
        // Detect anomalies
        const alerts = await detectAnomaliesAndCreateAlerts(symptom, new Date());
        
        res.status(200).json({
            message: `Anomaly detection completed for ${symptom}`,
            alertsCreated: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error('Error detecting symptom anomaly:', error);
        res.status(500).json({ message: 'Failed to detect anomaly' });
    }
};
