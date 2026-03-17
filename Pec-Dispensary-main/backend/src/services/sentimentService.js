import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run sentiment analysis using the trained BERT model
 * @param {string} feedbackText - The feedback text to analyze
 * @returns {Promise<Object>} - Sentiment analysis result
 */
export const analyzeSentiment = async (feedbackText) => {
    return new Promise((resolve, reject) => {
        // Path to the Python inference wrapper script
        const pythonScript = path.join(__dirname, '../../../ml-model/run_inference.py');
        
        // Spawn Python process
        const pythonProcess = spawn('python', [pythonScript], {
            cwd: path.join(__dirname, '../../../ml-model'),
        });

        let outputData = '';
        let errorData = '';

        // Send the feedback text to the Python script via stdin
        pythonProcess.stdin.write(JSON.stringify({ text: feedbackText }));
        pythonProcess.stdin.end();

        // Collect stdout
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        // Collect stderr
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', errorData);
                reject(new Error(`Python script failed with code ${code}: ${errorData}`));
                return;
            }

            try {
                // Parse the JSON output from Python
                const lines = outputData.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                const result = JSON.parse(lastLine);
                
                if (result.error) {
                    reject(new Error(result.error));
                    return;
                }
                
                resolve(result);
            } catch (error) {
                console.error('Failed to parse Python output:', outputData);
                reject(new Error('Failed to parse sentiment analysis result'));
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            reject(new Error('Failed to execute sentiment analysis'));
        });
    });
};

/**
 * Save sentiment analysis results to database
 * @param {string} feedbackId - The feedback ID
 * @param {Object} sentimentData - The sentiment analysis result
 * @returns {Promise<Object>} - Saved sentiment record
 */
export const saveSentimentAnalysis = async (feedbackId, sentimentData) => {
    try {
        const { data, error } = await supabase
            .from('sentiment_analysis')
            .insert({
                feedback_id: feedbackId,
                overall_sentiment: sentimentData.overall,
                sentiment_score: calculateSentimentScore(sentimentData.overall),
                detected_symptoms: sentimentData.symptoms,
                symptom_probabilities: sentimentData.symptom_probs,
                aspects: sentimentData.aspects,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving sentiment analysis:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to save sentiment analysis:', error);
        throw error;
    }
};

/**
 * Calculate a numeric sentiment score from sentiment label
 * @param {string} sentiment - positive/neutral/negative
 * @returns {number} - Score between 0 and 1
 */
const calculateSentimentScore = (sentiment) => {
    const scoreMap = {
        'positive': 0.90,
        'neutral': 0.50,
        'negative': 0.10,
    };
    return scoreMap[sentiment] || 0.50;
};

/**
 * Process feedback and analyze sentiment
 * @param {string} feedbackId - The feedback ID
 * @param {string} feedbackText - The feedback text
 * @returns {Promise<Object>} - Sentiment analysis result
 */
export const processFeedbackSentiment = async (feedbackId, feedbackText) => {
    try {
        // Check if already processed
        const { data: existing } = await supabase
            .from('sentiment_analysis')
            .select('*')
            .eq('feedback_id', feedbackId)
            .single();

        if (existing) {
            return existing;
        }

        // Analyze sentiment
        const sentimentResult = await analyzeSentiment(feedbackText);

        // Save to database
        const savedSentiment = await saveSentimentAnalysis(feedbackId, sentimentResult);

        // Mark feedback as processed
        await supabase
            .from('feedbacks')
            .update({ processed: true })
            .eq('id', feedbackId);

        return savedSentiment;
    } catch (error) {
        console.error('Error processing feedback sentiment:', error);
        throw error;
    }
};

/**
 * Get sentiment analysis for a feedback
 * @param {string} feedbackId - The feedback ID
 * @returns {Promise<Object>} - Sentiment analysis data
 */
export const getSentimentByFeedbackId = async (feedbackId) => {
    try {
        const { data, error } = await supabase
            .from('sentiment_analysis')
            .select('*')
            .eq('feedback_id', feedbackId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error fetching sentiment analysis:', error);
        throw error;
    }
};

/**
 * Get sentiment statistics for a doctor
 * @param {string} doctorId - The doctor ID
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @returns {Promise<Object>} - Aggregated sentiment statistics
 */
export const getDoctorSentimentStats = async (doctorId, startDate, endDate) => {
    try {
        const { data: visits } = await supabase
            .from('visits')
            .select('id')
            .eq('doctor_id', doctorId)
            .gte('visit_time', startDate.toISOString())
            .lte('visit_time', endDate.toISOString());

        if (!visits || visits.length === 0) {
            return {
                total: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
                avgScore: 0,
            };
        }

        const visitIds = visits.map(v => v.id);

        const { data: feedbacks } = await supabase
            .from('feedbacks')
            .select('id')
            .in('visit_id', visitIds);

        if (!feedbacks || feedbacks.length === 0) {
            return {
                total: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
                avgScore: 0,
            };
        }

        const feedbackIds = feedbacks.map(f => f.id);

        const { data: sentiments } = await supabase
            .from('sentiment_analysis')
            .select('overall_sentiment, sentiment_score')
            .in('feedback_id', feedbackIds);

        if (!sentiments || sentiments.length === 0) {
            return {
                total: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
                avgScore: 0,
            };
        }

        const stats = {
            total: sentiments.length,
            positive: sentiments.filter(s => s.overall_sentiment === 'positive').length,
            neutral: sentiments.filter(s => s.overall_sentiment === 'neutral').length,
            negative: sentiments.filter(s => s.overall_sentiment === 'negative').length,
            avgScore: sentiments.reduce((sum, s) => sum + parseFloat(s.sentiment_score || 0), 0) / sentiments.length,
        };

        return stats;
    } catch (error) {
        console.error('Error fetching doctor sentiment stats:', error);
        throw error;
    }
};
