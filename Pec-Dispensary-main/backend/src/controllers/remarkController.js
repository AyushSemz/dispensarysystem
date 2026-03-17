import { supabase } from '../config/supabase.js';

export const createRemark = async (req, res) => {
    const { visit_id, raw_text, symptom_tags } = req.body;
    const doctor_id = req.user.userId;

    if (!visit_id || !raw_text) {
        return res.status(400).json({ message: 'Visit ID and remark text are required.' });
    }

    try {
        // Verify visit exists and belongs to doctor
        const { data: visit, error: visitError } = await supabase
            .from('visits')
            .select('*')
            .eq('id', visit_id)
            .single();

        if (visitError || !visit) {
            return res.status(404).json({ message: 'Visit not found.' });
        }

        if (visit.doctor_id !== doctor_id) {
            return res.status(403).json({ message: 'You can only add remarks to your own visits.' });
        }

        // Create remark
        const { data: newRemark, error: remarkError } = await supabase
            .from('remarks')
            .insert({
                visit_id,
                doctor_id,
                raw_text,
                symptom_tags: symptom_tags || [],
            })
            .select()
            .single();

        if (remarkError) {
            console.error("Create Remark Error:", remarkError);
            return res.status(500).json({ message: 'Failed to create remark.' });
        }

        res.status(201).json(newRemark);
    } catch (error) {
        console.error("Create Remark Error:", error);
        res.status(500).json({ message: 'Failed to create remark.' });
    }
};

export const getRemarksForVisit = async (req, res) => {
    const { visitId } = req.params;
    const { userId, role } = req.user;

    try {
        // First, retrieve the visit to verify access rights
        const { data: visit, error: visitError } = await supabase
            .from('visits')
            .select('*')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) {
            return res.status(404).json({ message: 'Visit not found.' });
        }

        // Authorization check: User must be the patient or the doctor of the visit
        if (visit.patient_id !== userId && visit.doctor_id !== userId) {
            return res.status(403).json({ message: 'Access denied. You are not part of this visit.' });
        }

        // If authorized, fetch the remarks
        const { data: remarks, error: remarksError } = await supabase
            .from('remarks')
            .select(`
                *,
                doctor:users!remarks_doctor_id_fkey(full_name)
            `)
            .eq('visit_id', visitId)
            .order('created_at', { ascending: true });

        if (remarksError) {
            console.error("Get Remarks Error:", remarksError);
            return res.status(500).json({ message: 'Failed to retrieve remarks.' });
        }

        res.status(200).json(remarks);
    } catch (error) {
        console.error("Get Remarks Error:", error);
        res.status(500).json({ message: 'Failed to retrieve remarks.' });
    }
};