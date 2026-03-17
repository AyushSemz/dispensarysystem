import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertAPI } from '../lib/api';
import { isAuthenticated, logout } from '../lib/auth';
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Info } from 'lucide-react';
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";

export function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, resolved

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchAlerts();
  }, [navigate]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await alertAPI.getActiveAlerts();
      setAlerts(response.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError('Failed to load alerts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledgeAlert(alertId, 'Alert acknowledged by user');
      fetchAlerts();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      setError('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await alertAPI.resolveAlert(alertId, 'Alert resolved by user');
      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      setError('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getSeverityImpact = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '100%';
      case 'HIGH':
        return '75%';
      case 'MEDIUM':
        return '50%';
      case 'LOW':
        return '25%';
      default:
        return '0%';
    }
  };

  // Comprehensive mapping of symptoms to actual diseases
  const getDiseaseName = (symptomName) => {
    const symptom = symptomName?.toLowerCase().replace('symptom_', '').replace(/_/g, ' ') || '';
    
    // More accurate symptom-to-disease mapping
    const symptomToDiseaseMap = {
      'cough': {
        disease: 'Influenza (Flu)',
        alternates: ['Common Cold', 'Bronchitis', 'COVID-19', 'Tuberculosis']
      },
      'fever': {
        disease: 'Viral Fever',
        alternates: ['Typhoid', 'Malaria', 'Dengue', 'COVID-19']
      },
      'cold': {
        disease: 'Common Cold',
        alternates: ['Influenza', 'Sinusitis', 'Allergic Rhinitis']
      },
      'headache': {
        disease: 'Migraine',
        alternates: ['Tension Headache', 'Sinusitis', 'Meningitis']
      },
      'diarrhea': {
        disease: 'Gastroenteritis',
        alternates: ['Cholera', 'Typhoid', 'Food Poisoning', 'Dysentery']
      },
      'vomiting': {
        disease: 'Gastroenteritis',
        alternates: ['Food Poisoning', 'Viral Infection', 'Hepatitis']
      },
      'breathlessness': {
        disease: 'Asthma',
        alternates: ['Pneumonia', 'COVID-19', 'Bronchitis', 'COPD']
      },
      'sore throat': {
        disease: 'Pharyngitis',
        alternates: ['Tonsillitis', 'Strep Throat', 'COVID-19']
      },
      'body pain': {
        disease: 'Dengue Fever',
        alternates: ['Chikungunya', 'Malaria', 'Viral Fever', 'COVID-19']
      },
      'rash': {
        disease: 'Measles',
        alternates: ['Chickenpox', 'Dengue', 'Allergic Reaction', 'Scarlet Fever']
      },
      'fatigue': {
        disease: 'Viral Infection',
        alternates: ['Anemia', 'Typhoid', 'Tuberculosis', 'COVID-19']
      },
      'chills': {
        disease: 'Malaria',
        alternates: ['Typhoid', 'Dengue', 'Influenza']
      }
    };

    // Check if symptom matches any key
    for (const [key, data] of Object.entries(symptomToDiseaseMap)) {
      if (symptom.includes(key)) {
        return data.disease;
      }
    }
    
    // Return formatted symptom as disease name if no match
    const formattedSymptom = symptom.charAt(0).toUpperCase() + symptom.slice(1);
    return `${formattedSymptom} Related Illness`;
  };

  // Get possible diseases based on symptom
  const getPossibleDiseases = (symptomName) => {
    const symptom = symptomName?.toLowerCase().replace('symptom_', '').replace(/_/g, ' ') || '';
    
    const symptomToDiseaseMap = {
      'cough': ['Influenza (Flu)', 'Common Cold', 'Bronchitis', 'COVID-19', 'Tuberculosis', 'Pneumonia'],
      'fever': ['Viral Fever', 'Typhoid', 'Malaria', 'Dengue', 'COVID-19', 'Chikungunya'],
      'cold': ['Common Cold', 'Influenza', 'Sinusitis', 'Allergic Rhinitis', 'COVID-19'],
      'headache': ['Migraine', 'Tension Headache', 'Sinusitis', 'Meningitis', 'Typhoid'],
      'diarrhea': ['Gastroenteritis', 'Cholera', 'Typhoid', 'Food Poisoning', 'Dysentery', 'E. Coli Infection'],
      'vomiting': ['Gastroenteritis', 'Food Poisoning', 'Hepatitis A', 'Cholera', 'Typhoid'],
      'breathlessness': ['Asthma', 'Pneumonia', 'COVID-19', 'Bronchitis', 'COPD', 'Tuberculosis'],
      'sore throat': ['Pharyngitis', 'Tonsillitis', 'Strep Throat', 'COVID-19', 'Diphtheria'],
      'body pain': ['Dengue', 'Chikungunya', 'Malaria', 'Viral Fever', 'COVID-19', 'Influenza'],
      'rash': ['Measles', 'Chickenpox', 'Dengue', 'Rubella', 'Scarlet Fever', 'Typhoid'],
      'fatigue': ['Viral Infection', 'Anemia', 'Typhoid', 'Tuberculosis', 'COVID-19', 'Hepatitis'],
      'chills': ['Malaria', 'Typhoid', 'Dengue', 'Influenza', 'Sepsis']
    };

    for (const [key, diseases] of Object.entries(symptomToDiseaseMap)) {
      if (symptom.includes(key)) {
        return diseases;
      }
    }
    
    return ['Viral Infection', 'Bacterial Infection', 'Seasonal Illness'];
  };

  // Get related symptoms based on main symptom
  const getRelatedSymptoms = (symptomName) => {
    const symptom = symptomName?.toLowerCase().replace('symptom_', '').replace(/_/g, ' ') || '';
    
    const relatedSymptomsMap = {
      'cough': ['dry cough', 'wet cough', 'sore throat', 'chest congestion', 'runny nose', 'fatigue'],
      'fever': ['chills', 'body ache', 'headache', 'fatigue', 'sweating', 'weakness'],
      'cold': ['runny nose', 'sneezing', 'congestion', 'sore throat', 'mild fever', 'fatigue'],
      'headache': ['migraine', 'nausea', 'sensitivity to light', 'dizziness', 'neck pain'],
      'diarrhea': ['stomach cramps', 'nausea', 'dehydration', 'fever', 'vomiting', 'weakness'],
      'vomiting': ['nausea', 'stomach pain', 'diarrhea', 'dehydration', 'loss of appetite'],
      'breathlessness': ['wheezing', 'chest tightness', 'cough', 'rapid breathing', 'fatigue'],
      'sore throat': ['difficulty swallowing', 'swollen glands', 'hoarse voice', 'fever', 'cough'],
      'body pain': ['muscle ache', 'joint pain', 'fatigue', 'fever', 'weakness', 'headache'],
      'rash': ['itching', 'redness', 'swelling', 'blisters', 'skin irritation'],
      'fatigue': ['weakness', 'tiredness', 'drowsiness', 'lack of energy', 'body ache']
    };

    for (const [key, symptoms] of Object.entries(relatedSymptomsMap)) {
      if (symptom.includes(key)) {
        return symptoms;
      }
    }
    
    // Default symptoms if no match
    return ['fever', 'fatigue', 'body ache', 'headache', 'weakness'];
  };

  // Get health suggestions based on symptom/disease
  const getHealthSuggestions = (symptomName) => {
    const symptom = symptomName?.toLowerCase().replace('symptom_', '').replace(/_/g, ' ') || '';
    
    const suggestionsMap = {
      'cough': [
        '😷 Wear a mask in public places',
        '💧 Stay hydrated - drink warm water with honey',
        '🏠 Avoid crowded areas and maintain social distance',
        '🧼 Wash hands frequently with soap',
        '💊 Take prescribed cough suppressants if needed',
        '🌬️ Avoid exposure to dust and smoke'
      ],
      'fever': [
        '🛏️ Take adequate rest and sleep',
        '💧 Drink plenty of fluids to stay hydrated',
        '🌡️ Monitor temperature regularly',
        '💊 Take paracetamol as prescribed',
        '🍲 Eat light, nutritious food',
        '🏥 Consult a doctor if fever persists beyond 3 days'
      ],
      'cold': [
        '😷 Wear a mask to prevent spreading',
        '🧣 Keep yourself warm, especially chest and throat',
        '🍵 Drink warm soups and herbal tea',
        '💧 Stay hydrated with warm water',
        '🏠 Rest at home and avoid going out',
        '🧴 Use steam inhalation for relief'
      ],
      'diarrhea': [
        '💧 Drink plenty of ORS (Oral Rehydration Solution)',
        '🚰 AVOID tap water - drink only boiled/filtered water',
        '🍌 Eat BRAT diet (Banana, Rice, Apple, Toast)',
        '🧼 Maintain strict hand hygiene',
        '🚫 Avoid street food and raw vegetables',
        '🏥 Seek medical help if blood in stool'
      ],
      'vomiting': [
        '💧 Sip small amounts of water frequently',
        '🍚 Eat bland foods like rice and crackers',
        '🚫 Avoid spicy, oily, and heavy foods',
        '🛏️ Rest in an upright position',
        '💊 Take anti-emetic medication if prescribed',
        '🏥 Seek help if vomiting persists over 24 hours'
      ],
      'breathlessness': [
        '🏥 Seek immediate medical attention if severe',
        '🌬️ Stay in well-ventilated areas',
        '😷 Wear N95 mask in polluted areas',
        '🚫 Avoid strenuous physical activity',
        '💨 Practice deep breathing exercises',
        '🚬 Avoid smoking and smoky environments'
      ],
      'headache': [
        '🛏️ Rest in a dark, quiet room',
        '💧 Stay hydrated - dehydration causes headaches',
        '📱 Reduce screen time',
        '💊 Take pain relievers as needed',
        '🧘 Practice relaxation techniques',
        '😴 Ensure adequate sleep (7-8 hours)'
      ],
      'body pain': [
        '🛏️ Get adequate rest',
        '💧 Stay hydrated',
        '🏃 Light stretching if tolerable',
        '💊 Take pain relievers as prescribed',
        '🛁 Warm compress on affected areas',
        '🏥 Consult doctor if pain is severe'
      ],
      'rash': [
        '🧴 Keep the affected area clean and dry',
        '🚫 Avoid scratching the rash',
        '👕 Wear loose, cotton clothing',
        '🧼 Use mild, fragrance-free soap',
        '💊 Apply prescribed topical creams',
        '🏥 Seek medical help if rash spreads'
      ],
      'fatigue': [
        '😴 Get 7-8 hours of quality sleep',
        '🍎 Eat balanced, nutritious meals',
        '💧 Stay well hydrated',
        '🚶 Light exercise like walking',
        '☕ Limit caffeine intake',
        '🏥 Get blood tests if fatigue persists'
      ]
    };

    for (const [key, suggestions] of Object.entries(suggestionsMap)) {
      if (symptom.includes(key)) {
        return suggestions;
      }
    }
    
    // Default suggestions
    return [
      '💧 Stay hydrated - drink clean water',
      '🛏️ Get adequate rest',
      '🧼 Maintain good hygiene',
      '😷 Wear mask in crowded places',
      '🏥 Consult a doctor if symptoms worsen',
      '🍎 Eat nutritious food'
    ];
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'active') return alert.status === 'ACTIVE';
    if (filter === 'resolved') return alert.status === 'RESOLVED';
    return true;
  });

  if (loading) {
    return (
      <>
        <LpNavbar1 />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading alerts...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LpNavbar1 />
      <div className="min-h-screen bg-black">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-white">Health Alerts Dashboard</h1>
            <p className="text-gray-300">
              Stay informed about disease outbreaks and health alerts in your area
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-700">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                filter === 'all'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                filter === 'active'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Active ({alerts.filter(a => a.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                filter === 'resolved'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Resolved ({alerts.filter(a => a.status === 'RESOLVED').length})
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Alerts List */}
          <div className="space-y-6">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
                <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg font-medium">No alerts found</p>
                <p className="text-sm text-gray-400 mt-2">
                  {filter === 'all' 
                    ? "You'll be notified when there are health alerts in your area"
                    : `No ${filter} alerts at this time`}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const diseaseName = getDiseaseName(alert.symptom_name);
                const possibleDiseases = getPossibleDiseases(alert.symptom_name);
                const relatedSymptoms = getRelatedSymptoms(alert.symptom_name);
                const healthSuggestions = getHealthSuggestions(alert.symptom_name);
                const detectionMethod = alert.detection_method?.replace(/_/g, ' ') || 'Unknown';
                
                return (
                  <div 
                    key={alert.id} 
                    className="rounded-2xl shadow-lg overflow-hidden bg-gray-900 border-2 border-orange-600/30"
                  >
                    {/* Alert Header */}
                    <div className={`${getSeverityColor(alert.severity)} px-6 py-4 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <div>
                          <span className="font-bold text-lg">EPIDEMIC ALERT</span>
                          <span className="ml-3 text-sm opacity-90">
                            {alert.severity} RISK
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'ACTIVE' && (
                          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                            ACTIVE
                          </span>
                        )}
                        {alert.status === 'RESOLVED' && (
                          <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs font-medium">
                            RESOLVED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-2xl font-bold text-orange-400 mb-3">
                        Disease Alert: {diseaseName}
                      </h3>

                      {/* Description */}
                      <div className="mb-4 space-y-2 text-gray-300">
                        <p>
                          <span className="font-semibold">Status:</span> {alert.severity} Risk - Active Outbreak Detected
                        </p>
                        <p>
                          <span className="font-semibold">Detection Method:</span> {detectionMethod.charAt(0).toUpperCase() + detectionMethod.slice(1)}
                        </p>
                        <p>
                          <span className="font-semibold">Location:</span> PEC Campus & Surrounding Area
                        </p>
                      </div>

                      {/* Impact Level */}
                      <div className="mb-6">
                        <div className="text-sm text-gray-300 mb-2 font-medium">Impact Level</div>
                        <div className="w-full bg-gray-700 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full transition-all duration-300 ${
                              alert.severity === 'CRITICAL' ? 'bg-red-500' :
                              alert.severity === 'HIGH' ? 'bg-orange-500' :
                              alert.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: getSeverityImpact(alert.severity) }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-700">
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">Cases Reported</div>
                          <div className="text-3xl font-bold text-orange-400">{alert.patient_count || 0}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">Trend</div>
                          <div className="flex items-center justify-center gap-1 text-xl font-bold text-orange-400">
                            <TrendingUp className="w-5 h-5" />
                            Increasing
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">Threshold Crossed</div>
                          <div className="text-xl font-bold text-orange-400">
                            {alert.start_date ? new Date(alert.start_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Common Disease Keywords */}
                      <div className="mb-6">
                        <div className="text-sm font-semibold text-gray-200 mb-3">Related Symptoms (ML Detected):</div>
                        <div className="flex flex-wrap gap-2">
                          {relatedSymptoms.map((keyword) => (
                            <span key={keyword} className="px-3 py-1.5 bg-orange-500/20 text-orange-300 rounded-full text-sm border border-orange-500/40 font-medium capitalize">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Possible Diseases */}
                      <div className="mb-6">
                        <div className="text-sm font-semibold text-gray-200 mb-3">🦠 Possible Diseases (Based on Symptoms):</div>
                        <div className="flex flex-wrap gap-2">
                          {possibleDiseases.map((disease, idx) => (
                            <span 
                              key={disease} 
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                idx === 0 
                                  ? 'bg-red-500/30 text-red-300 border border-red-500/50' 
                                  : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                              }`}
                            >
                              {idx === 0 && '⚠️ '}{disease}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          * Primary suspected disease highlighted. Consult healthcare professionals for accurate diagnosis.
                        </p>
                      </div>

                      {/* Detection Details */}
                      {alert.metadata && (
                        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Detection Details
                          </div>
                          <div className="text-sm text-gray-300 space-y-2">
                            {alert.metadata.z_score !== undefined && (
                              <p className="flex justify-between">
                                <span>Z-Score:</span>
                                <span className="font-bold">{alert.metadata.z_score.toFixed(2)}</span>
                              </p>
                            )}
                            {alert.metadata.baseline_mean !== undefined && (
                              <p className="flex justify-between">
                                <span>Baseline Average:</span>
                                <span className="font-bold">{alert.metadata.baseline_mean.toFixed(1)} cases/day</span>
                              </p>
                            )}
                            {alert.metadata.threshold !== undefined && (
                              <p className="flex justify-between">
                                <span>Alert Threshold:</span>
                                <span className="font-bold">{alert.metadata.threshold.toFixed(1)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions Required */}
                      <div className="mb-6">
                        <div className="text-sm font-semibold text-gray-200 mb-3">Actions Required:</div>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Isolate symptomatic cases immediately</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Enhance sanitation and hygiene protocols</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Seek medical attention if experiencing symptoms</span>
                          </li>
                        </ul>
                      </div>

                      {/* Health Suggestions */}
                      <div className="mb-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-600/30">
                        <div className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                          <span className="text-lg">💡</span>
                          Health Suggestions & Precautions
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {healthSuggestions.map((suggestion, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-gray-200 bg-black/20 rounded-lg p-2">
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {alert.status === 'ACTIVE' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleAcknowledge(alert.id)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Clock className="w-5 h-5" />
                            Acknowledge Alert
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
