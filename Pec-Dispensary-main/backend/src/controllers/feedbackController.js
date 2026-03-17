import { supabase } from '../config/supabase.js';
import { processFeedbackSentiment } from '../services/sentimentService.js';
import { processAllSymptomsForAnomalies } from '../services/anomalyDetectionService.js';

export const createFeedback = async (req, res) => {
    const { visit_id, appointment_id, rating, comments } = req.body;
    const patient_id = req.user.userId;

    // Accept either visit_id or appointment_id
    let actualVisitId = visit_id;

    // If appointment_id is provided, find or create visit
    if (appointment_id && !visit_id) {
        // Check if visit exists for this appointment
        const { data: existingVisit } = await supabase
            .from('visits')
            .select('id')
            .eq('appointment_id', appointment_id)
            .single();

        if (existingVisit) {
            actualVisitId = existingVisit.id;
        } else {
            // Create a simple visit record for feedback
            const { data: appointment } = await supabase
                .from('appointments')
                .select('patient_id, doctor_id')
                .eq('id', appointment_id)
                .single();

            if (appointment && appointment.patient_id === patient_id) {
                const { data: newVisit, error: visitError } = await supabase
                    .from('visits')
                    .insert({
                        appointment_id,
                        patient_id,
                        doctor_id: appointment.doctor_id,
                        visit_time: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (visitError) {
                    return res.status(500).json({ message: 'Failed to create visit record.' });
                }
                actualVisitId = newVisit.id;
            }
        }
    }

    if (!actualVisitId || rating === undefined) {
        return res.status(400).json({ message: 'Visit ID (or Appointment ID) and a rating are required.' });
    }

    try {
        // Verify visit exists and belongs to patient
        const { data: visit, error: visitError } = await supabase
            .from('visits')
            .select('*')
            .eq('id', actualVisitId)
            .single();

        if (visitError || !visit) {
            return res.status(404).json({ message: 'Visit not found.' });
        }

        if (visit.patient_id !== patient_id) {
            return res.status(404).json({ message: 'Visit not found or does not belong to this patient.' });
        }

        // Create feedback
        const { data: newFeedback, error: feedbackError } = await supabase
            .from('feedbacks')
            .insert({
                visit_id: actualVisitId,
                patient_id,
                rating,
                comments,
            })
            .select()
            .single();

        if (feedbackError) {
            console.error("Create Feedback Error:", feedbackError);
            if (feedbackError.code === '23505') { // Unique constraint violation
                return res.status(409).json({ message: 'Feedback for this visit has already been submitted.' });
            }
            return res.status(500).json({ message: 'Failed to submit feedback.' });
        }

        // Process sentiment analysis asynchronously
        if (comments && comments.trim().length > 0) {
            processFeedbackSentiment(newFeedback.id, comments)
                .then(async (sentimentResult) => {
                    console.log('Sentiment analysis completed:', sentimentResult);
                    
                    // Trigger anomaly detection after sentiment analysis
                    try {
                        await processAllSymptomsForAnomalies();
                        console.log('Anomaly detection completed');
                    } catch (anomalyError) {
                        console.error('Anomaly detection error:', anomalyError);
                    }
                })
                .catch((error) => {
                    console.error('Sentiment analysis error:', error);
                });
        }

        res.status(201).json(newFeedback);
    } catch (error) {
        console.error("Create Feedback Error:", error);
        res.status(500).json({ message: 'Failed to submit feedback.' });
    }
};

export const getFeedbackForVisit = async (req, res) => {
    const { visitId } = req.params;
    const doctor_id = req.user.userId;

    try {
        // First verify the visit belongs to this doctor
        const { data: visit, error: visitError } = await supabase
            .from('visits')
            .select('doctor_id')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) {
            return res.status(404).json({ message: 'Visit not found.' });
        }

        if (visit.doctor_id !== doctor_id) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        // Get feedbacks for the visit with sentiment analysis
        const { data: feedbacks, error: feedbackError } = await supabase
            .from('feedbacks')
            .select(`
                *,
                patient:users!feedbacks_patient_id_fkey(full_name),
                sentiment:sentiment_analysis(*)
            `)
            .eq('visit_id', visitId);

        if (feedbackError) {
            console.error("Get Feedback Error:", feedbackError);
            return res.status(500).json({ message: 'Failed to retrieve feedback.' });
        }

        res.status(200).json(feedbacks);
    } catch (error) {
        console.error("Get Feedback Error:", error);
        res.status(500).json({ message: 'Failed to retrieve feedback.' });
    }
};

/**
 * Get all feedbacks for a doctor with sentiment analysis
 * @route GET /api/feedbacks/doctor/all
 * @access Doctor
 */
export const getAllDoctorFeedbacks = async (req, res) => {
    const doctor_id = req.user.userId;
    const { startDate, endDate, sentiment } = req.query;

    try {
        // Get all visits for this doctor
        let visitQuery = supabase
            .from('visits')
            .select('id')
            .eq('doctor_id', doctor_id);

        if (startDate) {
            visitQuery = visitQuery.gte('visit_time', startDate);
        }

        if (endDate) {
            visitQuery = visitQuery.lte('visit_time', endDate);
        }

        const { data: visits, error: visitError } = await visitQuery;

        if (visitError) {
            console.error("Get Visits Error:", visitError);
            return res.status(500).json({ message: 'Failed to retrieve visits.' });
        }

        if (!visits || visits.length === 0) {
            return res.status(200).json([]);
        }

        const visitIds = visits.map(v => v.id);

        // Get feedbacks with sentiment analysis
        let feedbackQuery = supabase
            .from('feedbacks')
            .select(`
                *,
                patient:users!feedbacks_patient_id_fkey(full_name, email),
                visit:visits!feedbacks_visit_id_fkey(visit_time, diagnosis_text),
                sentiment:sentiment_analysis(*)
            `)
            .in('visit_id', visitIds)
            .order('created_at', { ascending: false });

        const { data: feedbacks, error: feedbackError } = await feedbackQuery;

        if (feedbackError) {
            console.error("Get Feedbacks Error:", feedbackError);
            return res.status(500).json({ message: 'Failed to retrieve feedbacks.' });
        }

        // Filter by sentiment if specified
        let filteredFeedbacks = feedbacks || [];
        if (sentiment) {
            filteredFeedbacks = filteredFeedbacks.filter(f => 
                f.sentiment && f.sentiment.length > 0 && f.sentiment[0].overall_sentiment === sentiment
            );
        }

        res.status(200).json(filteredFeedbacks);
    } catch (error) {
        console.error("Get Feedbacks Error:", error);
        res.status(500).json({ message: 'Failed to retrieve feedbacks.' });
    }
};

/**
 * Get sentiment statistics for doctor
 * @route GET /api/feedbacks/doctor/sentiment-stats
 * @access Doctor
 */
export const getDoctorSentimentStatistics = async (req, res) => {
    const doctor_id = req.user.userId;
    const { startDate, endDate } = req.query;

    try {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        const end = endDate ? new Date(endDate) : new Date();

        // Get all visits for this doctor
        const { data: visits } = await supabase
            .from('visits')
            .select('id')
            .eq('doctor_id', doctor_id)
            .gte('visit_time', start.toISOString())
            .lte('visit_time', end.toISOString());

        if (!visits || visits.length === 0) {
            return res.status(200).json({
                total: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
                avgScore: 0,
                symptomBreakdown: {},
                aspectBreakdown: {},
            });
        }

        const visitIds = visits.map(v => v.id);

        const { data: feedbacks } = await supabase
            .from('feedbacks')
            .select('id')
            .in('visit_id', visitIds);

        if (!feedbacks || feedbacks.length === 0) {
            return res.status(200).json({
                total: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
                avgScore: 0,
                symptomBreakdown: {},
                aspectBreakdown: {},
            });
        }

        const feedbackIds = feedbacks.map(f => f.id);

        const { data: sentiments } = await supabase
            .from('sentiment_analysis')
            .select('*')
            .in('feedback_id', feedbackIds);

        if (!sentiments || sentiments.length === 0) {
            return res.status(200).json({
                total: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
                avgScore: 0,
                symptomBreakdown: {},
                aspectBreakdown: {},
            });
        }

        // Calculate statistics
        const stats = {
            total: sentiments.length,
            positive: sentiments.filter(s => s.overall_sentiment === 'positive').length,
            neutral: sentiments.filter(s => s.overall_sentiment === 'neutral').length,
            negative: sentiments.filter(s => s.overall_sentiment === 'negative').length,
            avgScore: sentiments.reduce((sum, s) => sum + parseFloat(s.sentiment_score || 0), 0) / sentiments.length,
        };

        // Symptom breakdown
        const symptomCounts = {};
        sentiments.forEach(s => {
            if (s.detected_symptoms && Array.isArray(s.detected_symptoms)) {
                s.detected_symptoms.forEach(symptom => {
                    symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
                });
            }
        });
        stats.symptomBreakdown = symptomCounts;

        // Aspect breakdown
        const aspectBreakdown = {};
        sentiments.forEach(s => {
            if (s.aspects && typeof s.aspects === 'object') {
                Object.entries(s.aspects).forEach(([aspect, sentiment]) => {
                    if (!aspectBreakdown[aspect]) {
                        aspectBreakdown[aspect] = { positive: 0, neutral: 0, negative: 0 };
                    }
                    aspectBreakdown[aspect][sentiment] = (aspectBreakdown[aspect][sentiment] || 0) + 1;
                });
            }
        });
        stats.aspectBreakdown = aspectBreakdown;

        res.status(200).json(stats);
    } catch (error) {
        console.error("Get Sentiment Stats Error:", error);
        res.status(500).json({ message: 'Failed to retrieve sentiment statistics.' });
    }
};