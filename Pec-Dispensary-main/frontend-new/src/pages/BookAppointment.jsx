import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI, profileAPI } from '../lib/api';
import { isAuthenticated, isPatient, logout } from '../lib/auth';
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";

export function BookAppointment() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (!isPatient()) {
      setError('Only patients can book appointments');
      return;
    }
    fetchDoctors();
  }, [navigate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getDoctors();
      setDoctors(response.data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.doctor_id) {
      setError('Please select a doctor');
      return;
    }
    if (!formData.appointment_date) {
      setError('Please select a date');
      return;
    }
    if (!formData.appointment_time) {
      setError('Please select a time');
      return;
    }
    if (!formData.reason) {
      setError('Please provide a reason for your appointment');
      return;
    }

    try {
      setSubmitting(true);
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}`;
      const appointmentData = {
        doctor_id: formData.doctor_id,
        appointment_time: new Date(appointmentDateTime).toISOString(),
        reason: formData.reason,
      };
      await appointmentAPI.create(appointmentData);
      alert('Appointment booked successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error booking appointment:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('BookAppointment rendering', { doctors, formData });

  return (
    <>
      <LpNavbar1 />
      <div className="min-h-screen bg-black flex" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {/* Left Panel - Form */}
        <div className="w-1/2 bg-black flex flex-col">
          {/* Main Content */}
          <div className="flex-1 pl-16 pr-12 pt-4 pb-8 overflow-y-auto">
            <h1 className="text-4xl font-bold mb-8 text-white" style={{ fontFamily: 'inherit' }}>Book Appointment</h1>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form Content - All in one section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Doctor</label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-600 rounded-none bg-gray-800 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem'
                }}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name} - {doctor.doctor_profile?.specialization || 'General'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time - Separate boxes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Select Date</label>
                <input
                  type="date"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-none bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Select Time</label>
                <input
                  type="time"
                  name="appointment_time"
                  value={formData.appointment_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-600 rounded-none bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Reason for Appointment</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={6}
                placeholder="Describe your symptoms or reason for appointment..."
                className="w-full px-4 py-3 border border-gray-600 rounded-none bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <p className="text-sm text-gray-400">
              By submitting this form you are agreeing to our Privacy Policy
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 border border-gray-600 rounded-none hover:bg-gray-800 transition-colors text-sm font-medium text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-orange-500 text-white rounded-none hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="w-px bg-gray-700"></div>

      {/* Right Panel - Video */}
      <div className="w-1/2 relative bg-black flex items-center justify-center p-8">
        <video
          src="/appointment-1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-4/5 h-4/5 object-contain"
        />
      </div>
      </div>
    </>
  );
}
