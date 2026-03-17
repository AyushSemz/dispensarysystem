// =============================================
// SUPABASE QUERY EXAMPLES
// =============================================
// This file contains common query patterns for your reference

import { supabase } from './config/supabase.js';

// =============================================
// 1. INSERT - Create a new record
// =============================================
const createUser = async (userData) => {
    const { data, error } = await supabase
        .from('users')
        .insert({
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role
        })
        .select()
        .single();
    
    return { data, error };
};

// =============================================
// 2. SELECT - Query records
// =============================================

// Get single record
const getUserByEmail = async (email) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    
    return { data, error };
};

// Get multiple records with filter
const getDoctors = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'DOCTOR');
    
    return { data, error };
};

// Get with JOIN (relationships)
const getAppointmentsWithDetails = async (userId) => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:users!appointments_patient_id_fkey(full_name, email),
            doctor:users!appointments_doctor_id_fkey(
                full_name,
                doctor_profile:doctor_profiles(specialization)
            )
        `)
        .eq('patient_id', userId);
    
    return { data, error };
};

// =============================================
// 3. UPDATE - Modify existing records
// =============================================
const updateAppointmentStatus = async (appointmentId, status) => {
    const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single();
    
    return { data, error };
};

// =============================================
// 4. UPSERT - Insert or Update
// =============================================
const upsertPatientProfile = async (userId, profileData) => {
    const { data, error } = await supabase
        .from('patient_profiles')
        .upsert({
            user_id: userId,
            ...profileData
        }, {
            onConflict: 'user_id'
        })
        .select()
        .single();
    
    return { data, error };
};

// =============================================
// 5. DELETE - Remove records
// =============================================
const deleteAppointment = async (appointmentId) => {
    const { data, error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
    
    return { data, error };
};

// =============================================
// 6. COMPLEX QUERIES
// =============================================

// Multiple filters
const getUpcomingAppointments = async (doctorId) => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('status', 'SCHEDULED')
        .gte('appointment_time', now)
        .order('appointment_time', { ascending: true })
        .limit(10);
    
    return { data, error };
};

// Search with LIKE
const searchDoctorsByName = async (searchTerm) => {
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            doctor_profile:doctor_profiles(*)
        `)
        .eq('role', 'DOCTOR')
        .ilike('full_name', `%${searchTerm}%`);
    
    return { data, error };
};

// Count records
const countPatientAppointments = async (patientId) => {
    const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);
    
    return { count, error };
};

// =============================================
// 7. WORKING WITH ARRAYS AND JSONB
// =============================================

// Update array field
const addSymptomTag = async (remarkId, newTag) => {
    // First get current tags
    const { data: remark } = await supabase
        .from('remarks')
        .select('symptom_tags')
        .eq('id', remarkId)
        .single();
    
    // Add new tag
    const updatedTags = [...(remark.symptom_tags || []), newTag];
    
    // Update
    const { data, error } = await supabase
        .from('remarks')
        .update({ symptom_tags: updatedTags })
        .eq('id', remarkId);
    
    return { data, error };
};

// Query JSONB field
const getUsersByMetadata = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .contains('metadata', { verified: true });
    
    return { data, error };
};

// =============================================
// 8. TRANSACTIONS (Using PostgreSQL Functions)
// =============================================
// For complex transactions, create a PostgreSQL function
// and call it using RPC

const completeVisitTransaction = async (visitData) => {
    const { data, error } = await supabase
        .rpc('complete_visit_transaction', {
            p_appointment_id: visitData.appointment_id,
            p_patient_id: visitData.patient_id,
            p_doctor_id: visitData.doctor_id,
            p_diagnosis: visitData.diagnosis
        });
    
    return { data, error };
};

// =============================================
// 9. ERROR HANDLING PATTERNS
// =============================================
const handleSupabaseError = (error) => {
    if (error) {
        console.error('Supabase Error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        
        // Common error codes:
        // 23505 - Unique constraint violation
        // 23503 - Foreign key violation
        // 42P01 - Table doesn't exist
        // PGRST116 - No rows found
        
        return {
            success: false,
            message: error.message
        };
    }
    return { success: true };
};

// =============================================
// 10. PAGINATION
// =============================================
const getPaginatedAppointments = async (page = 1, pageSize = 10) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });
    
    return {
        data,
        error,
        pagination: {
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize)
        }
    };
};

// Export for reference
export {
    createUser,
    getUserByEmail,
    getDoctors,
    getAppointmentsWithDetails,
    updateAppointmentStatus,
    upsertPatientProfile,
    deleteAppointment,
    getUpcomingAppointments,
    searchDoctorsByName,
    countPatientAppointments,
    handleSupabaseError,
    getPaginatedAppointments
};
