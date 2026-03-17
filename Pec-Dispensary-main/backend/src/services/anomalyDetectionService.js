import { supabase } from '../config/supabase.js';

/**
 * Update symptom statistics for a given date
 * @param {string} symptom - The symptom name
 * @param {Date} date - The date to update statistics for
 * @returns {Promise<Object>} - Updated statistics
 */
export const updateSymptomStatistics = async (symptom, date) => {
    try {
        const dateStr = date.toISOString().split('T')[0];
        
        // Get count of the symptom for the date from sentiment_analysis
        const { data: sentiments } = await supabase
            .from('sentiment_analysis')
            .select('detected_symptoms, processed_at')
            .contains('detected_symptoms', [symptom])
            .gte('processed_at', `${dateStr}T00:00:00`)
            .lte('processed_at', `${dateStr}T23:59:59`);

        const count = sentiments ? sentiments.length : 0;

        // Calculate baseline statistics (last 30 days, excluding today)
        const thirtyDaysAgo = new Date(date);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: historicalStats } = await supabase
            .from('symptom_statistics')
            .select('count')
            .eq('symptom', symptom)
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
            .lte('date', yesterday.toISOString().split('T')[0])
            .order('date', { ascending: true });

        let baselineMean = 0;
        let baselineStdDev = 0;
        let ewmaValue = count;

        if (historicalStats && historicalStats.length > 0) {
            const counts = historicalStats.map(s => s.count);
            baselineMean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
            
            // Calculate standard deviation
            const variance = counts.reduce((sum, c) => sum + Math.pow(c - baselineMean, 2), 0) / counts.length;
            baselineStdDev = Math.sqrt(variance);

            // Calculate EWMA (Exponentially Weighted Moving Average) with alpha = 0.3
            const alpha = 0.3;
            ewmaValue = count;
            for (let i = counts.length - 1; i >= 0; i--) {
                ewmaValue = alpha * counts[i] + (1 - alpha) * ewmaValue;
            }
        }

        // Upsert statistics
        const { data: stats, error } = await supabase
            .from('symptom_statistics')
            .upsert({
                symptom,
                date: dateStr,
                count,
                mean_value: count,
                std_dev: baselineStdDev,
                ewma_value: ewmaValue,
                baseline_mean: baselineMean,
                baseline_std_dev: baselineStdDev,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'symptom,date'
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating symptom statistics:', error);
            throw error;
        }

        return stats;
    } catch (error) {
        console.error('Error in updateSymptomStatistics:', error);
        throw error;
    }
};

/**
 * Calculate Z-score for anomaly detection
 * @param {number} value - Current value
 * @param {number} mean - Baseline mean
 * @param {number} stdDev - Baseline standard deviation
 * @returns {number} - Z-score
 */
const calculateZScore = (value, mean, stdDev) => {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
};

/**
 * Check for Z-score anomaly (Z-score > 3)
 * @param {Object} stats - Symptom statistics
 * @returns {boolean} - Whether anomaly detected
 */
const checkZScoreAnomaly = (stats) => {
    if (stats.baseline_std_dev === 0 || stats.baseline_mean === 0) return false;
    const zScore = calculateZScore(stats.count, stats.baseline_mean, stats.baseline_std_dev);
    return zScore > 3;
};

/**
 * Check for EWMA deviation anomaly
 * @param {Object} stats - Symptom statistics
 * @returns {boolean} - Whether anomaly detected
 */
const checkEWMAAnomaly = (stats) => {
    if (stats.baseline_mean === 0) return false;
    const deviation = Math.abs(stats.ewma_value - stats.baseline_mean);
    const threshold = 2 * stats.baseline_std_dev;
    return deviation > threshold;
};

/**
 * Check for consecutive day exceedance
 * @param {string} symptom - The symptom name
 * @param {Date} date - Current date
 * @param {number} consecutiveDays - Number of consecutive days to check (default: 3)
 * @returns {Promise<boolean>} - Whether consecutive exceedance detected
 */
const checkConsecutiveDayExceedance = async (symptom, date, consecutiveDays = 3) => {
    try {
        const checks = [];
        for (let i = 0; i < consecutiveDays; i++) {
            const checkDate = new Date(date);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            const { data: stats } = await supabase
                .from('symptom_statistics')
                .select('count, baseline_mean, baseline_std_dev')
                .eq('symptom', symptom)
                .eq('date', dateStr)
                .single();

            if (!stats || stats.baseline_mean === 0) {
                return false; // Not enough data
            }

            const threshold = stats.baseline_mean + stats.baseline_std_dev;
            checks.push(stats.count > threshold);
        }

        // All consecutive days must exceed threshold
        return checks.every(check => check === true);
    } catch (error) {
        console.error('Error checking consecutive day exceedance:', error);
        return false;
    }
};

/**
 * Detect anomalies and create alerts
 * @param {string} symptom - The symptom name
 * @param {Date} date - The date to check
 * @returns {Promise<Array>} - Array of created alerts
 */
export const detectAnomaliesAndCreateAlerts = async (symptom, date = new Date()) => {
    try {
        const dateStr = date.toISOString().split('T')[0];
        
        // Get current statistics
        const { data: stats } = await supabase
            .from('symptom_statistics')
            .select('*')
            .eq('symptom', symptom)
            .eq('date', dateStr)
            .single();

        if (!stats) {
            return [];
        }

        const alerts = [];

        // Check Z-score anomaly (Z-score > 3)
        if (checkZScoreAnomaly(stats)) {
            const zScore = calculateZScore(stats.count, stats.baseline_mean, stats.baseline_std_dev);
            const alert = await createAlert({
                symptom,
                alertType: 'z-score',
                severity: zScore > 5 ? 'CRITICAL' : zScore > 4 ? 'HIGH' : 'MEDIUM',
                thresholdValue: 3,
                currentValue: zScore,
                detectionMethod: `Z-score anomaly detected: ${zScore.toFixed(2)} (threshold: 3)`,
                affectedPeriodStart: new Date(`${dateStr}T00:00:00`),
                affectedPeriodEnd: new Date(`${dateStr}T23:59:59`),
                patientCount: stats.count,
                metadata: {
                    z_score: zScore,
                    baseline_mean: stats.baseline_mean,
                    baseline_std_dev: stats.baseline_std_dev,
                    current_count: stats.count,
                },
            });
            alerts.push(alert);
        }

        // Check EWMA deviation
        if (checkEWMAAnomaly(stats)) {
            const deviation = Math.abs(stats.ewma_value - stats.baseline_mean);
            const alert = await createAlert({
                symptom,
                alertType: 'ewma',
                severity: deviation > 3 * stats.baseline_std_dev ? 'HIGH' : 'MEDIUM',
                thresholdValue: 2 * stats.baseline_std_dev,
                currentValue: deviation,
                detectionMethod: `EWMA deviation detected: ${deviation.toFixed(2)} (threshold: ${(2 * stats.baseline_std_dev).toFixed(2)})`,
                affectedPeriodStart: new Date(`${dateStr}T00:00:00`),
                affectedPeriodEnd: new Date(`${dateStr}T23:59:59`),
                patientCount: stats.count,
                metadata: {
                    ewma_value: stats.ewma_value,
                    baseline_mean: stats.baseline_mean,
                    deviation,
                    current_count: stats.count,
                },
            });
            alerts.push(alert);
        }

        // Check consecutive day exceedance
        const consecutiveExceedance = await checkConsecutiveDayExceedance(symptom, date, 3);
        if (consecutiveExceedance) {
            const threeDaysAgo = new Date(date);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
            
            const alert = await createAlert({
                symptom,
                alertType: 'consecutive-day',
                severity: 'HIGH',
                thresholdValue: 3,
                currentValue: 3,
                detectionMethod: 'Consecutive 3-day threshold exceedance detected',
                affectedPeriodStart: new Date(`${threeDaysAgo.toISOString().split('T')[0]}T00:00:00`),
                affectedPeriodEnd: new Date(`${dateStr}T23:59:59`),
                patientCount: stats.count,
                metadata: {
                    consecutive_days: 3,
                    current_count: stats.count,
                },
            });
            alerts.push(alert);
        }

        return alerts;
    } catch (error) {
        console.error('Error detecting anomalies:', error);
        throw error;
    }
};

/**
 * Create an outbreak alert
 * @param {Object} alertData - Alert data
 * @returns {Promise<Object>} - Created alert
 */
const createAlert = async (alertData) => {
    try {
        // Check if similar alert already exists (within last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { data: existingAlerts } = await supabase
            .from('outbreak_alerts')
            .select('*')
            .eq('symptom', alertData.symptom)
            .eq('alert_type', alertData.alertType)
            .eq('status', 'ACTIVE')
            .gte('created_at', oneDayAgo.toISOString());

        if (existingAlerts && existingAlerts.length > 0) {
            // Alert already exists, return existing one
            return existingAlerts[0];
        }

        // Create new alert
        const { data: alert, error } = await supabase
            .from('outbreak_alerts')
            .insert({
                symptom: alertData.symptom,
                alert_type: alertData.alertType,
                severity: alertData.severity,
                status: 'ACTIVE',
                threshold_value: alertData.thresholdValue,
                current_value: alertData.currentValue,
                detection_method: alertData.detectionMethod,
                affected_period_start: alertData.affectedPeriodStart.toISOString(),
                affected_period_end: alertData.affectedPeriodEnd.toISOString(),
                patient_count: alertData.patientCount,
                metadata: alertData.metadata,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating alert:', error);
            throw error;
        }

        return alert;
    } catch (error) {
        console.error('Error in createAlert:', error);
        throw error;
    }
};

/**
 * Process all symptoms for anomaly detection
 * @param {Date} date - The date to process
 * @returns {Promise<Array>} - Array of all created alerts
 */
export const processAllSymptomsForAnomalies = async (date = new Date()) => {
    try {
        const symptoms = [
            'symptom_cough',
            'symptom_fever',
            'symptom_diarrhea',
            'symptom_vomiting',
            'symptom_breathlessness',
            'symptom_headache',
            'symptom_sore_throat',
            'symptom_body_pain',
            'symptom_rash',
            'symptom_fatigue',
        ];

        const allAlerts = [];

        for (const symptom of symptoms) {
            // Update statistics
            await updateSymptomStatistics(symptom, date);
            
            // Detect anomalies
            const alerts = await detectAnomaliesAndCreateAlerts(symptom, date);
            allAlerts.push(...alerts);
        }

        return allAlerts;
    } catch (error) {
        console.error('Error processing symptoms for anomalies:', error);
        throw error;
    }
};

/**
 * Get active alerts
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Array of active alerts
 */
export const getActiveAlerts = async (filters = {}) => {
    try {
        let query = supabase
            .from('outbreak_alerts')
            .select('*')
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false });

        if (filters.symptom) {
            query = query.eq('symptom', filters.symptom);
        }

        if (filters.severity) {
            query = query.eq('severity', filters.severity);
        }

        const { data: alerts, error } = await query;

        if (error) {
            console.error('Error fetching active alerts:', error);
            throw error;
        }

        return alerts;
    } catch (error) {
        console.error('Error in getActiveAlerts:', error);
        throw error;
    }
};

/**
 * Acknowledge an alert
 * @param {string} alertId - The alert ID
 * @param {string} doctorId - The doctor acknowledging the alert
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} - Updated alert
 */
export const acknowledgeAlert = async (alertId, doctorId, notes = null) => {
    try {
        const { data: alert, error } = await supabase
            .from('outbreak_alerts')
            .update({
                status: 'ACKNOWLEDGED',
                acknowledged_at: new Date().toISOString(),
                acknowledged_by: doctorId,
                notes: notes,
            })
            .eq('id', alertId)
            .select()
            .single();

        if (error) {
            console.error('Error acknowledging alert:', error);
            throw error;
        }

        return alert;
    } catch (error) {
        console.error('Error in acknowledgeAlert:', error);
        throw error;
    }
};

/**
 * Resolve an alert
 * @param {string} alertId - The alert ID
 * @param {string} doctorId - The doctor resolving the alert
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} - Updated alert
 */
export const resolveAlert = async (alertId, doctorId, notes = null) => {
    try {
        const { data: alert, error } = await supabase
            .from('outbreak_alerts')
            .update({
                status: 'RESOLVED',
                resolved_at: new Date().toISOString(),
                resolved_by: doctorId,
                notes: notes,
            })
            .eq('id', alertId)
            .select()
            .single();

        if (error) {
            console.error('Error resolving alert:', error);
            throw error;
        }

        return alert;
    } catch (error) {
        console.error('Error in resolveAlert:', error);
        throw error;
    }
};
