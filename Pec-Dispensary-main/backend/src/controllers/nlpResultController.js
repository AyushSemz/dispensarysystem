import { supabase } from '../config/supabase.js';

export const getNlpResultById = async (req, res) => {
    const { resultId } = req.params;
    const { userId, role } = req.user;

    // This endpoint is intended for clinical staff
    if (role !== 'DOCTOR') {
        return res.status(403).json({ message: 'Access denied. Clinical role required.' });
    }

    try {
        // Get the NLP result
        const { data: nlpResult, error: nlpError } = await supabase
            .from('nlp_results')
            .select('*')
            .eq('id', resultId)
            .single();

        if (nlpError || !nlpResult) {
            return res.status(404).json({ message: 'NLP result not found.' });
        }

        // Check authorization by verifying the source
        let authorized = false;

        // Check if it's from a remark
        const { data: remark } = await supabase
            .from('remarks')
            .select('visit_id, visits!inner(doctor_id)')
            .eq('nlp_result_id', resultId)
            .single();

        if (remark && remark.visits.doctor_id === userId) {
            authorized = true;
        }

        // Check if it's from a feedback
        if (!authorized) {
            const { data: feedback } = await supabase
                .from('feedbacks')
                .select('visit_id, visits!inner(doctor_id)')
                .eq('nlp_result_id', resultId)
                .single();

            if (feedback && feedback.visits.doctor_id === userId) {
                authorized = true;
            }
        }

        if (!authorized) {
            return res.status(403).json({ message: 'You are not authorized to view this result.' });
        }

        res.status(200).json(nlpResult);
    } catch (error) {
        console.error("Get NLP Result Error:", error);
        res.status(500).json({ message: 'Failed to retrieve NLP result.' });
    }
};