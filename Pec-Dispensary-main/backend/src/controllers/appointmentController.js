import { supabase } from '../config/supabase.js';

export const createAppointment = async (req, res) => {
    const { doctor_id, appointment_time, duration_minutes, reason } = req.body;
    
    const patient_id = req.user.userId;

    if (!doctor_id || !appointment_time) {
        return res.status(400).json({ message: 'Doctor ID and appointment time are required.' });
    }

    try {
        const { data: newAppointment, error } = await supabase
            .from('appointments')
            .insert({
                patient_id,
                doctor_id,
                appointment_time: new Date(appointment_time).toISOString(),
                duration_minutes: duration_minutes || 15,
                reason,
                status: 'SCHEDULED',
            })
            .select()
            .single();

        if (error) {
            console.error("Create Appointment Error:", error);
            return res.status(500).json({ message: 'Failed to create appointment.' });
        }

        res.status(201).json(newAppointment);
    } catch (error) {
        console.error("Create Appointment Error:", error);
        res.status(500).json({ message: 'Failed to create appointment.' });
    }
};

export const getMyAppointments = async (req, res) => {
    const { userId, role } = req.user;

    try {
        let query = supabase
            .from('appointments')
            .select(`
                *,
                doctor:users!appointments_doctor_id_fkey(
                    full_name,
                    doctor_profile:doctor_profiles(specialization)
                ),
                patient:users!appointments_patient_id_fkey(full_name)
            `)
            .order('appointment_time', { ascending: false });

        if (role === 'DOCTOR') {
            query = query.eq('doctor_id', userId);
        } else {
            query = query.eq('patient_id', userId);
        }

        const { data: appointments, error } = await query;

        if (error) {
            console.error("Get Appointments Error:", error);
            return res.status(500).json({ message: 'Failed to retrieve appointments.' });
        }

        res.status(200).json(appointments);
    } catch (error) {
        console.error("Get Appointments Error:", error);
        res.status(500).json({ message: 'Failed to retrieve appointments.' });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { userId, role } = req.user;

    if (!status || !['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW).' });
    }

    try {
        // First, verify the appointment exists and belongs to the doctor
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Only doctors can update appointment status
        if (role !== 'DOCTOR') {
            return res.status(403).json({ message: 'Only doctors can update appointment status.' });
        }

        // Verify this is the doctor's appointment
        if (appointment.doctor_id !== userId) {
            return res.status(403).json({ message: 'You can only update your own appointments.' });
        }

        const { data: updatedAppointment, error: updateError } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select(`
                *,
                doctor:users!appointments_doctor_id_fkey(
                    full_name,
                    doctor_profile:doctor_profiles(specialization)
                ),
                patient:users!appointments_patient_id_fkey(full_name)
            `)
            .single();

        if (updateError) {
            console.error("Update Appointment Status Error:", updateError);
            return res.status(500).json({ message: 'Failed to update appointment status.' });
        }

        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error("Update Appointment Status Error:", error);
        res.status(500).json({ message: 'Failed to update appointment status.' });
    }
};