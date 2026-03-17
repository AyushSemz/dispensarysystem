import { supabase } from '../config/supabase.js';

export const createVisit = async (req, res) => {
    const doctor_id = req.user.userId;
    const {
        appointment_id,
        patient_id,
        diagnosis_code,
        diagnosis_text,
        prescription,
        follow_up_reco,
    } = req.body;

    // A visit must be linked to a patient and an appointment
    if (!appointment_id || !patient_id) {
        return res.status(400).json({ message: 'Appointment ID and Patient ID are required.' });
    }

    try {
        // Create the visit
        const { data: newVisit, error: visitError } = await supabase
            .from('visits')
            .insert({
                appointment_id,
                patient_id,
                doctor_id,
                visit_time: new Date().toISOString(),
                diagnosis_code,
                diagnosis_text,
                prescription,
                follow_up_reco,
            })
            .select()
            .single();

        if (visitError) {
            console.error("Create Visit Error:", visitError);
            return res.status(500).json({ message: 'Failed to create visit record.' });
        }

        // Update appointment status to COMPLETED
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'COMPLETED' })
            .eq('id', appointment_id);

        if (updateError) {
            console.error("Update Appointment Error:", updateError);
        }

        res.status(201).json(newVisit);
    } catch (error) {
        console.error("Create Visit Error:", error);
        res.status(500).json({ message: 'Failed to create visit record.' });
    }
};

export const getMyVisits = async (req, res) => {
    const { userId, role } = req.user;

    try {
        let query = supabase
            .from('visits')
            .select(`
                *,
                doctor:users!visits_doctor_id_fkey(full_name),
                patient:users!visits_patient_id_fkey(full_name),
                appointment:appointments(appointment_time, reason)
            `)
            .order('visit_time', { ascending: false });

        if (role === 'DOCTOR') {
            query = query.eq('doctor_id', userId);
        } else {
            query = query.eq('patient_id', userId);
        }

        const { data: visits, error } = await query;

        if (error) {
            console.error("Get Visits Error:", error);
            return res.status(500).json({ message: 'Failed to retrieve visits.' });
        }

        res.status(200).json(visits);
    } catch (error) {
        console.error("Get Visits Error:", error);
        res.status(500).json({ message: 'Failed to retrieve visits.' });
    }
};