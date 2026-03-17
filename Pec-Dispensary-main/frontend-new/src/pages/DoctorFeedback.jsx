import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackAPI } from '../lib/api';
import { isAuthenticated, isDoctor, logout } from '../lib/auth';
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";
import { 
  Star, TrendingUp, TrendingDown, Minus, MessageSquare, 
  ThumbsUp, ThumbsDown, Activity, Users, Clock, Sparkles,
  Stethoscope, Building, Timer, Pill, UserCheck, AlertCircle
} from 'lucide-react';

export function DoctorFeedback() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [sentimentStats, setSentimentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (!isDoctor()) {
      setError('Only doctors can view feedback analytics');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feedbackRes, statsRes] = await Promise.all([
        feedbackAPI.getDoctorFeedbacks(),
        feedbackAPI.getDoctorSentimentStats()
      ]);
      setFeedbacks(feedbackRes.data || []);
      setSentimentStats(statsRes.data || null);
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError('Failed to load feedback data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get sentiment data (handles both array and object formats from Supabase)
  const getSentimentData = (feedback) => {
    if (!feedback.sentiment) return null;
    // If it's an array, get first element
    if (Array.isArray(feedback.sentiment)) {
      return feedback.sentiment.length > 0 ? feedback.sentiment[0] : null;
    }
    // If it's an object with id, return it directly
    if (feedback.sentiment.id) {
      return feedback.sentiment;
    }
    return null;
  };

  // Calculate overall stats from ML model results
  const calculateOverallStats = () => {
    const feedbacksWithSentiment = feedbacks.filter(f => getSentimentData(f) !== null);
    if (feedbacksWithSentiment.length === 0) {
      return {
        total: feedbacks.length,
        analyzed: 0,
        avgSentimentScore: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        avgRating: 0,
        aspectAverages: {}
      };
    }

    const total = feedbacks.length;
    const analyzed = feedbacksWithSentiment.length;
    const avgRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / total;

    // Calculate sentiment distribution
    let positive = 0, neutral = 0, negative = 0;
    let totalScore = 0;

    // Aspect tracking
    const aspectCounts = {
      aspect_cleanliness: { positive: 0, neutral: 0, negative: 0, total: 0 },
      aspect_staff_behaviour: { positive: 0, neutral: 0, negative: 0, total: 0 },
      aspect_waiting_time: { positive: 0, neutral: 0, negative: 0, total: 0 },
      aspect_doctor_explanation: { positive: 0, neutral: 0, negative: 0, total: 0 },
      aspect_medicine_availability: { positive: 0, neutral: 0, negative: 0, total: 0 },
      aspect_crowd_management: { positive: 0, neutral: 0, negative: 0, total: 0 }
    };

    feedbacksWithSentiment.forEach(f => {
      const sentiment = getSentimentData(f);
      totalScore += parseFloat(sentiment.sentiment_score || 0.5);

      if (sentiment.overall_sentiment === 'positive') positive++;
      else if (sentiment.overall_sentiment === 'negative') negative++;
      else neutral++;

      // Count aspect sentiments
      if (sentiment.aspects) {
        Object.entries(sentiment.aspects).forEach(([aspect, value]) => {
          if (aspectCounts[aspect]) {
            aspectCounts[aspect][value]++;
            aspectCounts[aspect].total++;
          }
        });
      }
    });

    // Calculate aspect scores (positive = 1, neutral = 0.5, negative = 0)
    const aspectAverages = {};
    Object.entries(aspectCounts).forEach(([aspect, counts]) => {
      if (counts.total > 0) {
        const score = (counts.positive * 1 + counts.neutral * 0.5 + counts.negative * 0) / counts.total;
        aspectAverages[aspect] = {
          score: score,
          positive: counts.positive,
          neutral: counts.neutral,
          negative: counts.negative,
          total: counts.total
        };
      }
    });

    return {
      total,
      analyzed,
      avgSentimentScore: totalScore / analyzed,
      positive,
      neutral,
      negative,
      avgRating,
      aspectAverages
    };
  };

  // Format aspect name for display
  const formatAspectName = (aspect) => {
    const names = {
      aspect_cleanliness: 'Cleanliness',
      aspect_staff_behaviour: 'Staff Behaviour',
      aspect_waiting_time: 'Waiting Time',
      aspect_doctor_explanation: 'Doctor Explanation',
      aspect_medicine_availability: 'Medicine Availability',
      aspect_crowd_management: 'Crowd Management'
    };
    return names[aspect] || aspect.replace('aspect_', '').replace(/_/g, ' ');
  };

  // Get aspect icon
  const getAspectIcon = (aspect) => {
    const icons = {
      aspect_cleanliness: <Sparkles className="w-5 h-5" />,
      aspect_staff_behaviour: <UserCheck className="w-5 h-5" />,
      aspect_waiting_time: <Timer className="w-5 h-5" />,
      aspect_doctor_explanation: <Stethoscope className="w-5 h-5" />,
      aspect_medicine_availability: <Pill className="w-5 h-5" />,
      aspect_crowd_management: <Users className="w-5 h-5" />
    };
    return icons[aspect] || <Activity className="w-5 h-5" />;
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get score background
  const getScoreBg = (score) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Format symptom name
  const formatSymptomName = (symptom) => {
    return symptom.replace('symptom_', '').replace(/_/g, ' ');
  };

  // Get sentiment display for a feedback
  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'positive') {
      return { icon: <ThumbsUp className="w-3 h-3" />, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Positive' };
    } else if (sentiment === 'negative') {
      return { icon: <ThumbsDown className="w-3 h-3" />, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Negative' };
    }
    return { icon: <Minus className="w-3 h-3" />, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Neutral' };
  };

  const stats = calculateOverallStats();

  if (loading) {
    return (
      <>
        <LpNavbar1 />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading feedback analytics...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LpNavbar1 />
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Patient Feedback Analytics</h1>
              <p className="text-gray-400 text-sm">ML-Powered Sentiment & Aspect Analysis</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Overall Experience Stats */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              Overall Patient Experience Summary
            </h2>

            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Feedbacks</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{stats.analyzed}</div>
                <div className="text-sm text-gray-400">ML Analyzed</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.positive}</div>
                <div className="text-sm text-gray-400">Positive</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.neutral}</div>
                <div className="text-sm text-gray-400">Neutral</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{stats.negative}</div>
                <div className="text-sm text-gray-400">Negative</div>
              </div>
            </div>

            {/* Sentiment Distribution Bar */}
            {stats.analyzed > 0 && (
              <div className="mb-8">
                <div className="text-sm text-gray-300 mb-2">Overall Sentiment Distribution</div>
                <div className="flex h-6 rounded-lg overflow-hidden">
                  <div 
                    className="bg-green-500 transition-all flex items-center justify-center text-xs font-medium" 
                    style={{ width: `${(stats.positive / stats.analyzed) * 100}%` }}
                  >
                    {stats.positive > 0 && `${((stats.positive / stats.analyzed) * 100).toFixed(0)}%`}
                  </div>
                  <div 
                    className="bg-yellow-500 transition-all flex items-center justify-center text-xs font-medium text-black" 
                    style={{ width: `${(stats.neutral / stats.analyzed) * 100}%` }}
                  >
                    {stats.neutral > 0 && `${((stats.neutral / stats.analyzed) * 100).toFixed(0)}%`}
                  </div>
                  <div 
                    className="bg-red-500 transition-all flex items-center justify-center text-xs font-medium" 
                    style={{ width: `${(stats.negative / stats.analyzed) * 100}%` }}
                  >
                    {stats.negative > 0 && `${((stats.negative / stats.analyzed) * 100).toFixed(0)}%`}
                  </div>
                </div>
              </div>
            )}

            {/* Aspect-wise Analysis */}
            <div>
              <div className="text-sm text-gray-300 mb-4">Aspect-wise Analysis (ML Model)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.aspectAverages).map(([aspect, data]) => (
                  <div key={aspect} className="bg-black/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-orange-400">{getAspectIcon(aspect)}</span>
                      <span className="text-white font-medium">{formatAspectName(aspect)}</span>
                    </div>
                    
                    {/* Score bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Score</span>
                        <span className={getScoreColor(data.score)}>{(data.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getScoreBg(data.score)}`}
                          style={{ width: `${data.score * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex justify-between text-xs text-gray-400">
                      <span className="text-green-400">+{data.positive}</span>
                      <span className="text-yellow-400">~{data.neutral}</span>
                      <span className="text-red-400">-{data.negative}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Feedback Cards */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-orange-500" />
              Individual Feedback Analysis
            </h2>
          </div>

          {feedbacks.length === 0 ? (
            <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No feedback received yet</p>
              <p className="text-gray-500 text-sm mt-2">Patient feedback will appear here with ML analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => {
                const sentimentData = getSentimentData(feedback);
                const hasSentiment = !!sentimentData;
                const overallBadge = hasSentiment ? getSentimentBadge(sentimentData.overall_sentiment) : null;

                return (
                  <div key={feedback.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                    {/* Feedback Header */}
                    <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {feedback.patient?.full_name || 'Patient'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {feedback.created_at 
                              ? new Date(feedback.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Date N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Star Rating */}
                        <div className="flex items-center gap-1 bg-gray-800 px-3 py-1.5 rounded-lg">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= (feedback.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ML Analysis Content */}
                    {hasSentiment ? (
                      <div className="p-6">
                        {/* Aspect Analysis Grid */}
                        <div className="mb-6">
                          <div className="text-sm font-semibold text-gray-300 mb-3">Aspect-wise Sentiment</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {sentimentData.aspects && Object.entries(sentimentData.aspects).map(([aspect, value]) => {
                              const badge = getSentimentBadge(value);
                              return (
                                <div key={aspect} className={`${badge.bg} rounded-lg p-3 text-center`}>
                                  <div className={`${badge.color} mb-1`}>{getAspectIcon(aspect)}</div>
                                  <div className="text-xs text-gray-300 mb-1">{formatAspectName(aspect)}</div>
                                  <div className={`text-sm font-medium ${badge.color}`}>{value}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Detected Symptoms */}
                        {sentimentData.detected_symptoms && sentimentData.detected_symptoms.length > 0 && (
                          <div className="mb-6">
                            <div className="text-sm font-semibold text-gray-300 mb-3">Detected Symptoms (ML)</div>
                            <div className="flex flex-wrap gap-2">
                              {sentimentData.detected_symptoms.map((symptom, idx) => {
                                const prob = sentimentData.symptom_probabilities?.[symptom];
                                return (
                                  <span 
                                    key={idx} 
                                    className="px-3 py-1.5 bg-orange-500/30 border border-orange-500/50 text-white rounded-lg text-sm flex items-center gap-2"
                                  >
                                    <AlertCircle className="w-3 h-3 text-orange-400" />
                                    <span className="font-medium capitalize">{formatSymptomName(symptom)}</span>
                                    {prob && (
                                      <span className="text-orange-300 text-xs font-bold">
                                        ({(prob * 100).toFixed(0)}%)
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Original Comment */}
                        {feedback.comments && (
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="text-sm font-semibold text-gray-300 mb-2">Original Feedback</div>
                            <p className="text-gray-400 text-sm whitespace-pre-line">{feedback.comments}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                          <p>ML analysis pending...</p>
                        </div>
                        {feedback.comments && (
                          <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
                            <div className="text-sm font-semibold text-gray-300 mb-2">Original Feedback</div>
                            <p className="text-gray-400 text-sm whitespace-pre-line">{feedback.comments}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
