import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI, feedbackAPI, alertAPI } from '../lib/api';
import { isAuthenticated, isPatient, logout } from '../lib/auth';
import { X, AlertTriangle } from 'lucide-react';
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";

export function Feedback() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' or 'alerts'
  const [realAlerts, setRealAlerts] = useState([]); // Real-time alerts from backend
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [formData, setFormData] = useState({
    appointment_id: '',
    staffCleanliness: '',
    doctorBehavior: '',
    overallExperience: '',
    additionalComments: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (!isPatient()) {
      setError('Only patients can submit feedback');
      return;
    }
    fetchCompletedAppointments();
    fetchRealAlerts(); // Fetch real-time alerts
  }, [navigate]);

  const fetchRealAlerts = async () => {
    try {
      setAlertsLoading(true);
      const response = await alertAPI.getActiveAlerts();
      setRealAlerts(response.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      // Don't show error to user, just log it
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchCompletedAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getMyAppointments();
      const completed = response.data.filter(apt => apt.status === 'COMPLETED');
      setAppointments(completed);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError('Failed to load appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentSelect = (appointmentId) => {
    setSelectedAppointment(appointmentId);
    setFormData({ ...formData, appointment_id: appointmentId });
    setShowForm(true);
    setCurrentStep(1);
  };

  const handleMoodSelect = (field, value, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep === 1) {
      setShowForm(false);
      setFormData({
        appointment_id: '',
        staffCleanliness: '',
        doctorBehavior: '',
        overallExperience: '',
        additionalComments: ''
      });
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      
      const feedbackData = {
        appointment_id: formData.appointment_id,
        rating: getMoodRating(formData.overallExperience),
        comments: `Staff Cleanliness: ${formData.staffCleanliness || 'N/A'}\nDoctor Behavior: ${formData.doctorBehavior || 'N/A'}\nOverall Experience: ${formData.overallExperience || 'N/A'}\n\nAdditional Comments: ${formData.additionalComments || 'N/A'}`
      };
      
      await feedbackAPI.create(feedbackData);
      alert('Feedback submitted successfully!');
      setShowForm(false);
      setFormData({
        appointment_id: '',
        staffCleanliness: '',
        doctorBehavior: '',
        overallExperience: '',
        additionalComments: ''
      });
      fetchCompletedAppointments();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Map symptoms to likely diseases
  const getDiseaseName = (symptomName) => {
    const symptom = symptomName?.toLowerCase().replace('symptom_', '').replace(/_/g, ' ') || '';
    
    const symptomToDiseaseMap = {
      'cough': 'Respiratory Infection / Flu',
      'fever': 'Viral Fever / Influenza',
      'cold': 'Common Cold / Upper Respiratory Infection',
      'headache': 'Migraine / Tension Headache',
      'diarrhea': 'Gastroenteritis / Food Poisoning',
      'vomiting': 'Gastroenteritis / Food Poisoning',
      'breathlessness': 'Respiratory Distress / Asthma',
      'sore throat': 'Pharyngitis / Strep Throat',
      'body pain': 'Viral Fever / Dengue',
      'rash': 'Skin Allergy / Viral Exanthem',
      'fatigue': 'Viral Infection / Anemia'
    };

    for (const [key, disease] of Object.entries(symptomToDiseaseMap)) {
      if (symptom.includes(key)) {
        return disease;
      }
    }
    
    return symptom.charAt(0).toUpperCase() + symptom.slice(1) + ' Outbreak';
  };

  const getMoodRating = (mood) => {
    const ratings = {
      'very_bad': 1,
      'bad': 2,
      'average': 3,
      'good': 4,
      'very_good': 5
    };
    return ratings[mood] || 3;
  };

  const getAlerts = () => {
    const alerts = [];
    
    // Check for upcoming appointments in next 24 hours
    const upcomingAppointments = appointments.filter(apt => {
      if (!apt.appointment_time || apt.status !== 'SCHEDULED') return false;
      const aptDate = new Date(apt.appointment_time);
      const now = new Date();
      const hoursDiff = (aptDate - now) / (1000 * 60 * 60);
      return hoursDiff > 0 && hoursDiff <= 24;
    });

    if (upcomingAppointments.length > 0) {
      alerts.push({
        id: 'upcoming',
        type: 'warning',
        title: 'Upcoming Appointments',
        description: `You have ${upcomingAppointments.length} appointment${upcomingAppointments.length > 1 ? 's' : ''} in the next 24 hours`,
        impact: 'Medium',
        date: new Date().toLocaleDateString(),
        actions: ['Review schedule', 'Prepare documents']
      });
    }

    // Check for pending feedback
    const completedWithoutFeedback = appointments.filter(apt => 
      apt.status === 'COMPLETED' && !apt.Feedback?.length
    );

    if (completedWithoutFeedback.length > 0) {
      alerts.push({
        id: 'feedback-pending',
        type: 'info',
        title: 'Feedback Pending',
        description: `${completedWithoutFeedback.length} completed appointment${completedWithoutFeedback.length > 1 ? 's' : ''} waiting for your feedback`,
        impact: 'Low',
        date: new Date().toLocaleDateString(),
        actions: ['Submit feedback', 'Share experience']
      });
    }

    // Add real-time epidemic alerts from backend
    realAlerts.forEach(alert => {
      const diseaseName = getDiseaseName(alert.symptom_name);
      const severityColor = alert.severity === 'CRITICAL' ? 'High' : alert.severity === 'HIGH' ? 'Medium' : 'Low';
      
      alerts.push({
        id: alert.id,
        type: 'alert',
        title: `Disease Alert: ${diseaseName}`,
        description: `Status: ${alert.severity} Risk - Active Outbreak Detected\nDetection Method: ${alert.detection_method.replace(/_/g, ' ')}\nLocation: PEC Campus & Surrounding Area`,
        impact: severityColor,
        casesReported: alert.patient_count,
        trend: 'Increasing',
        dateDetected: new Date(alert.start_date).toLocaleDateString(),
        actions: ['Isolate symptomatic cases', 'Enhance sanitation', 'Seek medical attention if experiencing symptoms'],
        metadata: alert.metadata
      });
    });

    return alerts;
  };

  const alerts = getAlerts();

  const steps = [
    { number: 1, label: 'Staff Cleanliness' },
    { number: 2, label: 'Doctor Behavior' },
    { number: 3, label: 'Overall Experience' },
    { number: 4, label: 'Comments' }
  ];

  const moodOptions = [
    { value: 'very_bad', emoji: '😠', label: 'Very Bad' },
    { value: 'bad', emoji: '😞', label: 'Bad' },
    { value: 'average', emoji: '😐', label: 'Average' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'very_good', emoji: '🤩', label: 'Very Good' }
  ];

  if (loading) {
    return (
      <>
        <LpNavbar1 />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!showForm) {
    return (
      <>
        <LpNavbar1 />
        <div className="min-h-screen bg-black">
          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-4 text-white">Feedback & Alerts</h1>
            <p className="text-gray-400 mb-8">
              Submit feedback for completed appointments and view important health alerts
            </p>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'feedback'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Submit Feedback
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'alerts'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Health Alerts
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Feedback Section */}
          {activeTab === 'feedback' && (
            <>
              {appointments.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-gray-300 text-lg">No completed appointments found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Complete an appointment first to submit feedback
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      onClick={() => handleAppointmentSelect(appointment.id)}
                      className="p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors text-left border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-lg text-white">
                            {appointment.doctor?.full_name || 'Doctor'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {appointment.doctor?.doctor_profile?.specialization || 'General'}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          Completed
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400">
                          Date: {appointment.appointment_time 
                            ? new Date(appointment.appointment_time).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                        <p className="text-gray-400 line-clamp-2">
                          Reason: {appointment.reason}
                        </p>
                      </div>

                      <div className="mt-4 text-orange-500 text-sm font-medium">
                        Click to provide feedback →
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Alerts Section */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {alertsLoading ? (
                <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Loading alerts...</p>
                </div>
              ) : (
                <>
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                      {/* Alert Header */}
                      <div className={`px-6 py-3 flex items-center justify-between ${
                        alert.type === 'alert' ? 'bg-red-900/50 border-b border-red-800' : 
                        alert.type === 'warning' ? 'bg-yellow-900/50 border-b border-yellow-800' : 
                        'bg-blue-900/50 border-b border-blue-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.type === 'alert' ? 'text-red-400' : 
                            alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                          }`} />
                          <span className={`font-bold text-sm uppercase ${
                            alert.type === 'alert' ? 'text-red-400' : 
                            alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                          }`}>
                            {alert.type === 'alert' ? 'DISEASE ALERT' : alert.type === 'warning' ? 'WARNING' : 'INFO'}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.impact === 'High' ? 'bg-red-500/20 text-red-400' : 
                          alert.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {alert.impact} Impact
                        </span>
                      </div>

                      <div className="p-6">
                        {/* Title */}
                        <h3 className="text-xl font-bold mb-3 text-white">
                          {alert.title}
                        </h3>

                        {/* Description */}
                        <div className="mb-4 text-gray-300 whitespace-pre-line text-sm">
                          {alert.description}
                        </div>

                        {/* Stats Grid (for epidemic alerts) */}
                        {alert.casesReported && (
                          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-800 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-500">{alert.casesReported}</div>
                              <div className="text-xs text-gray-400">Cases Reported</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-500">{alert.trend}</div>
                              <div className="text-xs text-gray-400">Trend</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400">{alert.dateDetected}</div>
                              <div className="text-xs text-gray-400">Date Detected</div>
                            </div>
                          </div>
                        )}

                        {/* Detection Details from ML/EWMA (for real alerts) */}
                        {alert.metadata && (
                          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                            <div className="text-sm font-semibold text-white mb-2">Detection Details (EWMA Threshold):</div>
                            <div className="text-sm text-gray-300 space-y-1">
                              {alert.metadata.z_score && (
                                <p>Z-Score: <span className="font-bold text-orange-400">{alert.metadata.z_score.toFixed(2)}</span></p>
                              )}
                              {alert.metadata.baseline_mean !== undefined && (
                                <p>Baseline Average: <span className="font-bold text-orange-400">{alert.metadata.baseline_mean.toFixed(1)} cases/day</span></p>
                              )}
                              {alert.metadata.threshold && (
                                <p>Alert Threshold Crossed: <span className="font-bold text-red-400">{alert.metadata.threshold.toFixed(1)}</span></p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Common Disease Keywords */}
                        {alert.type === 'alert' && (
                          <div className="mb-4">
                            <div className="text-sm font-semibold text-white mb-2">Common Symptoms:</div>
                            <div className="flex flex-wrap gap-2">
                              {['cold', 'cough', 'fever', 'headache', 'fatigue'].map((keyword) => (
                                <span key={keyword} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions Required */}
                        <div className="mb-4">
                          <div className="text-sm font-semibold text-white mb-2">Recommended Actions:</div>
                          <ul className="space-y-1">
                            {alert.actions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                      <p className="text-gray-300 text-lg">No active alerts</p>
                      <p className="text-sm text-gray-500 mt-2">
                        You'll be notified when there are health alerts in your area
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <LpNavbar1 />
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl max-w-2xl w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={handleBack}
          className="absolute top-6 right-6 p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`h-1 flex-1 rounded-full transition-colors ${
                currentStep >= step.number ? 'bg-orange-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-white">
          Tell us about your experience!
        </h1>
        <p className="text-gray-400 mb-8">
          We value your feedback! Rate your visit to help us improve our healthcare services.
          Your input helps us serve you better.
        </p>

        <form onSubmit={handleSubmit} onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}>
          {/* Step 1: Staff Cleanliness */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  How would you rate the staff cleanliness & hygiene?{' '}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="flex gap-4 justify-center">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={(e) => handleMoodSelect('staffCleanliness', mood.value, e)}
                      className={`p-4 rounded-xl transition-all ${
                        formData.staffCleanliness === mood.value
                          ? 'bg-orange-500/20 ring-2 ring-orange-500 scale-110'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-4xl">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Doctor Behavior */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  How was the doctor's behavior & professionalism?{' '}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="flex gap-4 justify-center">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={(e) => handleMoodSelect('doctorBehavior', mood.value, e)}
                      className={`p-4 rounded-xl transition-all ${
                        formData.doctorBehavior === mood.value
                          ? 'bg-orange-500/20 ring-2 ring-orange-500 scale-110'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-4xl">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Overall Experience */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  How was your overall healthcare experience?{' '}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="flex gap-4 justify-center">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={(e) => handleMoodSelect('overallExperience', mood.value, e)}
                      className={`p-4 rounded-xl transition-all ${
                        formData.overallExperience === mood.value
                          ? 'bg-orange-500/20 ring-2 ring-orange-500 scale-110'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-4xl">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Comments */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  Anything else you'd like to add?{' '}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={formData.additionalComments}
                  onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                  rows={6}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={(e) => handleBack(e)}
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium text-white"
            >
              Go back
            </button>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={(e) => handleNext(e)}
                className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit feedback'}
              </button>
            )}
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
