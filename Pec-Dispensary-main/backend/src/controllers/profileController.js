import { supabase } from '../config/supabase.js';

export const getAllDoctorProfiles = async (req, res) => {
    try {
        const { data: doctors, error } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                doctor_profile:doctor_profiles(
                    specialization,
                    bio,
                    location
                )
            `)
            .eq('role', 'DOCTOR');

        if (error) {
            console.error("Get All Doctors Error:", error);
            return res.status(500).json({ message: 'Failed to retrieve doctor profiles.' });
        }

        res.status(200).json(doctors);
    } catch (error) {
        console.error("Get All Doctors Error:", error);
        res.status(500).json({ message: 'Failed to retrieve doctor profiles.' });
    }
};

export const getDoctorProfileById = async (req, res) => {
    const { doctorId } = req.params;
    try {
        const { data: doctor, error } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                phone,
                doctor_profile:doctor_profiles(*)
            `)
            .eq('id', doctorId)
            .eq('role', 'DOCTOR')
            .single();

        if (error || !doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        res.status(200).json(doctor);
    } catch (error) {
        console.error("Get Doctor by ID Error:", error);
        res.status(500).json({ message: 'Failed to retrieve doctor profile.' });
    }
};

export const getMyPatientProfile = async (req, res) => {
    const patient_id = req.user.userId;
    try {
        const { data: patientProfile, error } = await supabase
            .from('patient_profiles')
            .select(`
                *,
                user:users(full_name, email, phone)
            `)
            .eq('user_id', patient_id)
            .single();

        if (error || !patientProfile) {
            return res.status(404).json({ message: 'Patient profile not found.' });
        }

        res.status(200).json(patientProfile);

    } catch (error) {
        console.error("Get Patient Profile Error:", error);
        res.status(500).json({ message: 'Failed to retrieve patient profile.' });
    }
};