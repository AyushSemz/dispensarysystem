import { supabase } from './src/config/supabase.js';

async function generateSyntheticData() {
    try {
        console.log('Starting synthetic data generation...\n');

        // Get doctor and patient IDs
        const { data: users } = await supabase
            .from('users')
            .select('id, role')
            .in('role', ['DOCTOR', 'PATIENT']);

        const doctor = users?.find(u => u.role === 'DOCTOR');
        const patient = users?.find(u => u.role === 'PATIENT');

        if (!doctor || !patient) {
            console.log('Creating test users...');
            
            // Create doctor
            const { data: newDoctor } = await supabase
                .from('users')
                .insert({
                    role: 'DOCTOR',
                    email: 'synth.doctor@example.com',
                    password_hash: '$2a$10$dummy',
                    full_name: 'Dr. Synthetic',
                })
                .select()
                .single();

            // Create patient
            const { data: newPatient } = await supabase
                .from('users')
                .insert({
                    role: 'PATIENT',
                    email: 'synth.patient@example.com',
                    password_hash: '$2a$10$dummy',
                    full_name: 'Patient Synthetic',
                })
                .select()
                .single();

            doctor = newDoctor;
            patient = newPatient;
        }

        console.log(`✓ Using Doctor ID: ${doctor.id}`);
        console.log(`✓ Using Patient ID: ${patient.id}\n`);

        // Generate historical data for the last 30 days
        const symptoms = [
            'symptom_fever',
            'symptom_cough',
            'symptom_headache',
            'symptom_diarrhea',
        ];

        console.log('Generating baseline data for last 30 days...');
        
        for (let day = 30; day >= 1; day--) {
            const date = new Date();
            date.setDate(date.getDate() - day);
            const dateStr = date.toISOString().split('T')[0];

            for (const symptom of symptoms) {
                // Normal baseline: 5-15 cases per day
                const baselineCount = Math.floor(Math.random() * 10) + 5;

                const { error } = await supabase
                    .from('symptom_statistics')
                    .upsert({
                        symptom,
                        date: dateStr,
                        count: baselineCount,
                        mean_value: baselineCount,
                        std_dev: 3,
                        ewma_value: baselineCount,
                        baseline_mean: 10,
                        baseline_std_dev: 3,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'symptom,date'
                    });

                if (error) {
                    console.error(`Error for ${symptom} on ${dateStr}:`, error);
                }
            }
        }

        console.log('✓ Baseline data created\n');

        // Create TODAY'S SPIKE DATA to trigger alerts
        console.log('Creating spike data for TODAY to trigger alerts...\n');
        
        const today = new Date().toISOString().split('T')[0];
        
        // Create 52 feedbacks with fever (SPIKE - will trigger Z-score alert)
        console.log('Creating 52 fever cases (SPIKE)...');
        
        const feverComments = [
            'I had high fever and body ache',
            'Running high temperature with chills',
            'Severe fever since yesterday, feeling weak',
            'High fever and headache, need help',
            'Fever not coming down, body pain too',
        ];
        
        for (let i = 0; i < 52; i++) {
            // Create visit
            const { data: visit } = await supabase
                .from('visits')
                .insert({
                    patient_id: patient.id,
                    doctor_id: doctor.id,
                    visit_time: new Date().toISOString(),
                    diagnosis_text: 'Fever case',
                })
                .select()
                .single();

            // Create feedback with varied comments
            const { data: feedback } = await supabase
                .from('feedbacks')
                .insert({
                    visit_id: visit.id,
                    patient_id: patient.id,
                    rating: Math.floor(Math.random() * 2) + 3, // 3 or 4 rating
                    comments: feverComments[i % feverComments.length],
                    processed: true,
                })
                .select()
                .single();

            // Create sentiment analysis
            await supabase
                .from('sentiment_analysis')
                .insert({
                    feedback_id: feedback.id,
                    overall_sentiment: i % 3 === 0 ? 'negative' : 'neutral',
                    sentiment_score: 0.45 + (Math.random() * 0.2), // 0.45 - 0.65
                    detected_symptoms: ['symptom_fever', 'symptom_body_pain'],
                    symptom_probabilities: {
                        symptom_fever: 0.90 + (Math.random() * 0.1), // 0.90 - 1.0
                        symptom_body_pain: 0.80 + (Math.random() * 0.15), // 0.80 - 0.95
                    },
                    aspects: {
                        aspect_cleanliness: 'neutral',
                        aspect_staff_behaviour: i % 4 === 0 ? 'positive' : 'neutral',
                    },
                });
        }

        console.log('✓ Created 52 fever cases\n');

        // Update symptom statistics for TODAY with SPIKE
        console.log('Updating symptom statistics with spike...');
        
        await supabase
            .from('symptom_statistics')
            .upsert({
                symptom: 'symptom_fever',
                date: today,
                count: 52, // SPIKE! Normal is ~10
                mean_value: 52,
                std_dev: 3,
                ewma_value: 52,
                baseline_mean: 10, // Baseline mean
                baseline_std_dev: 3, // Baseline std dev
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'symptom,date'
            });

        console.log('✓ Symptom statistics updated\n');

        // Manually create an alert
        console.log('Creating outbreak alert...');
        
        const zScore = (52 - 10) / 3; // (current - baseline_mean) / baseline_std_dev = 14.0
        
        const { data: alert, error: alertError } = await supabase
            .from('outbreak_alerts')
            .insert({
                symptom: 'symptom_fever',
                alert_type: 'z-score',
                severity: 'CRITICAL', // Z-score > 5
                status: 'ACTIVE',
                threshold_value: 3,
                current_value: zScore,
                detection_method: `Z-score anomaly detected: ${zScore.toFixed(2)} (threshold: 3)`,
                affected_period_start: `${today}T00:00:00Z`,
                affected_period_end: `${today}T23:59:59Z`,
                patient_count: 52,
                metadata: {
                    z_score: zScore,
                    baseline_mean: 10,
                    baseline_std_dev: 3,
                    current_count: 52,
                    threshold: 3,
                },
            })
            .select()
            .single();

        if (alertError) {
            console.error('Alert creation error:', alertError);
        } else {
            console.log('✓ Alert created successfully!\n');
            console.log('Alert Details:');
            console.log(`  - ID: ${alert.id}`);
            console.log(`  - Symptom: ${alert.symptom}`);
            console.log(`  - Severity: ${alert.severity}`);
            console.log(`  - Z-Score: ${zScore.toFixed(2)}`);
            console.log(`  - Patient Count: ${alert.patient_count}`);
            console.log(`  - Status: ${alert.status}\n`);
        }

        console.log('========================================');
        console.log('✅ Synthetic data generation complete!');
        console.log('========================================');
        console.log('\nYou can now:');
        console.log('1. View alerts: GET /api/alerts');
        console.log('2. View dashboard: GET /api/alerts/dashboard');
        console.log('3. View symptom stats: GET /api/alerts/statistics/symptom_fever');

    } catch (error) {
        console.error('Error generating synthetic data:', error);
    }
}

generateSyntheticData();
