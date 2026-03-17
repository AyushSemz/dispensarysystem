/**
 * Test script for Alert Generation and Sentiment Analysis
 * Run with: node test-alert-sentiment.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';
let authToken = '';

// Test configuration
const testConfig = {
    doctorEmail: 'doctor@example.com',
    doctorPassword: 'password123',
    patientEmail: 'patient@example.com',
    patientPassword: 'password123',
};

// Helper function to login
async function login(email, password) {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password,
        });
        return response.data.token;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
}

// Test 1: Create feedback with sentiment analysis
async function testCreateFeedback() {
    console.log('\n=== Test 1: Create Feedback with Sentiment Analysis ===');
    
    try {
        const token = await login(testConfig.patientEmail, testConfig.patientPassword);
        
        // First, get a visit ID (you'll need to create a visit first)
        // For now, using a placeholder
        const visitId = 'your-visit-id-here';
        
        const response = await axios.post(
            `${BASE_URL}/feedbacks`,
            {
                visit_id: visitId,
                rating: 4,
                comments: 'I had fever and headache. The doctor was very helpful but the waiting time was extremely long.',
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log('✓ Feedback created:', response.data);
        console.log('✓ Sentiment analysis will process asynchronously');
        return response.data.id;
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Test 2: Get sentiment statistics for doctor
async function testGetSentimentStats() {
    console.log('\n=== Test 2: Get Sentiment Statistics ===');
    
    try {
        const token = await login(testConfig.doctorEmail, testConfig.doctorPassword);
        
        const response = await axios.get(
            `${BASE_URL}/feedbacks/doctor/sentiment-stats`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log('✓ Sentiment Statistics:', response.data);
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Test 3: Trigger anomaly detection
async function testAnomalyDetection() {
    console.log('\n=== Test 3: Trigger Anomaly Detection ===');
    
    try {
        const token = await login(testConfig.doctorEmail, testConfig.doctorPassword);
        
        const response = await axios.post(
            `${BASE_URL}/alerts/detect`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log('✓ Anomaly Detection Results:', response.data);
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Test 4: Get active alerts
async function testGetActiveAlerts() {
    console.log('\n=== Test 4: Get Active Alerts ===');
    
    try {
        const token = await login(testConfig.doctorEmail, testConfig.doctorPassword);
        
        const response = await axios.get(
            `${BASE_URL}/alerts`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log('✓ Active Alerts:', response.data);
        return response.data.length > 0 ? response.data[0].id : null;
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Test 5: Get alert dashboard
async function testAlertDashboard() {
    console.log('\n=== Test 5: Get Alert Dashboard ===');
    
    try {
        const token = await login(testConfig.doctorEmail, testConfig.doctorPassword);
        
        const response = await axios.get(
            `${BASE_URL}/alerts/dashboard`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log('✓ Dashboard Data:', response.data);
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Test 6: Acknowledge an alert
async function testAcknowledgeAlert(alertId) {
    if (!alertId) {
        console.log('\n=== Test 6: Skip - No alerts to acknowledge ===');
        return;
    }
    
    console.log('\n=== Test 6: Acknowledge Alert ===');
    
    try {
        const token = await login(testConfig.doctorEmail, testConfig.doctorPassword);
        
        const response = await axios.post(
            `${BASE_URL}/alerts/${alertId}/acknowledge`,
            {
                notes: 'Investigating this alert',
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log('✓ Alert Acknowledged:', response.data);
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Test 7: Get symptom statistics
async function testSymptomStatistics() {
    console.log('\n=== Test 7: Get Symptom Statistics ===');
    
    try {
        const token = await login(testConfig.doctorEmail, testConfig.doctorPassword);
        
        const symptom = 'symptom_fever';
        const response = await axios.get(
            `${BASE_URL}/alerts/statistics/${symptom}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log(`✓ Statistics for ${symptom}:`, response.data);
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Test 8: Get all doctor feedbacks with sentiment
async function testGetDoctorFeedbacks() {
    console.log('\n=== Test 8: Get All Doctor Feedbacks ===');
    
    try {
        const token = await login(testConfig.doctorEmail, testConfig.doctorPassword);
        
        const response = await axios.get(
            `${BASE_URL}/feedbacks/doctor/all`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        
        console.log('✓ Doctor Feedbacks:', response.data.length, 'feedbacks found');
        if (response.data.length > 0) {
            console.log('  Sample:', response.data[0]);
        }
    } catch (error) {
        console.error('✗ Failed:', error.response?.data || error.message);
    }
}

// Main test runner
async function runTests() {
    console.log('===========================================');
    console.log('Alert Generation & Sentiment Analysis Tests');
    console.log('===========================================');
    console.log('\nMake sure the backend server is running on http://localhost:4000');
    console.log('Press Ctrl+C to cancel...\n');
    
    // Wait 2 seconds to allow user to cancel
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        // Run tests sequentially
        await testCreateFeedback();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testGetSentimentStats();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testAnomalyDetection();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const alertId = await testGetActiveAlerts();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testAlertDashboard();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testAcknowledgeAlert(alertId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testSymptomStatistics();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testGetDoctorFeedbacks();
        
        console.log('\n===========================================');
        console.log('Tests completed!');
        console.log('===========================================\n');
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

// Run the tests
runTests();
