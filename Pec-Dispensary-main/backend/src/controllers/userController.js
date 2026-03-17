import { supabase } from '../config/supabase.js';

export const getMyProfile = async (req, res) => {
    const { userId, role } = req.user;

    try {
        let query = supabase
            .from('users')
            .select(`
                *,
                patient_profile:patient_profiles(*),
                doctor_profile:doctor_profiles(*)
            `)
            .eq('id', userId)
            .single();

        const { data: userProfile, error } = await query;

        if (error || !userProfile) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        // Remove profile data that doesn't belong to user's role
        if (role !== 'PATIENT') {
            delete userProfile.patient_profile;
        }
        if (role !== 'DOCTOR') {
            delete userProfile.doctor_profile;
        }

        const { password_hash, ...profileWithoutPassword } = userProfile;
        res.status(200).json(profileWithoutPassword);

    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: 'Failed to retrieve user profile.' });
    }
};

export const updateMyProfile = async (req, res) => {
    const { userId, role } = req.user;
    const profileData = req.body;

    try {
        // Update user basic info
        const { error: userError } = await supabase
            .from('users')
            .update({
                full_name: profileData.full_name,
                phone: profileData.phone,
            })
            .eq('id', userId);

        if (userError) {
            console.error("Update User Error:", userError);
            return res.status(500).json({ message: 'Failed to update user profile.' });
        }

        // Update role-specific profile
        if (role === 'PATIENT') {
            const patientData = {
                user_id: userId,
                dob: profileData.dob ? new Date(profileData.dob).toISOString() : null,
                gender: profileData.gender,
                address: profileData.address,
                emergency_contact: profileData.emergency_contact,
                medical_history: profileData.medical_history,
            };

            // Upsert patient profile
            const { error: profileError } = await supabase
                .from('patient_profiles')
                .upsert(patientData, { onConflict: 'user_id' });

            if (profileError) {
                console.error("Update Patient Profile Error:", profileError);
                return res.status(500).json({ message: 'Failed to update patient profile.' });
            }

        } else if (role === 'DOCTOR') {
            const doctorData = {
                user_id: userId,
                specialization: profileData.specialization,
                registration_no: profileData.registration_no,
                available_slots: profileData.available_slots,
                bio: profileData.bio,
                location: profileData.location,
            };

            // Upsert doctor profile
            const { error: profileError } = await supabase
                .from('doctor_profiles')
                .upsert(doctorData, { onConflict: 'user_id' });

            if (profileError) {
                console.error("Update Doctor Profile Error:", profileError);
                return res.status(500).json({ message: 'Failed to update doctor profile.' });
            }
        }

        // Fetch updated profile
        const { data: updatedUser, error: fetchError } = await supabase
            .from('users')
            .select(`
                *,
                patient_profile:patient_profiles(*),
                doctor_profile:doctor_profiles(*)
            `)
            .eq('id', userId)
            .single();

        if (fetchError) {
            return res.status(500).json({ message: 'Profile updated but failed to fetch.' });
        }

        // Remove profile data that doesn't belong to user's role
        if (role !== 'PATIENT') {
            delete updatedUser.patient_profile;
        }
        if (role !== 'DOCTOR') {
            delete updatedUser.doctor_profile;
        }

        const { password_hash, ...profileWithoutPassword } = updatedUser;
        res.status(200).json({ message: 'Profile updated successfully', user: profileWithoutPassword });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: 'Failed to update user profile.' });
    }
};