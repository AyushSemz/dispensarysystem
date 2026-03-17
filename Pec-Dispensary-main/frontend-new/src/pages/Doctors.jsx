import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileAPI } from '../lib/api';
import { User, Stethoscope, Phone, Award } from 'lucide-react';
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";

export function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getDoctors();
      setDoctors(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const search = searchTerm.toLowerCase();
    return (
      doctor.full_name?.toLowerCase().includes(search) ||
      doctor.doctor_profile?.specialization?.toLowerCase().includes(search) ||
      doctor.doctor_profile?.license_number?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <>
        <LpNavbar1 />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading doctors...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LpNavbar1 />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-gray-900">Our Doctors</h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse our qualified healthcare professionals
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No doctors found' : 'No doctors available'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Please check back later'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                {/* Doctor Avatar */}
                <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4">
                  <User className="w-10 h-10 text-blue-600" />
                </div>

                {/* Doctor Info */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-1">
                    Dr. {doctor.full_name}
                  </h3>
                  {doctor.doctor_profile?.specialization && (
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                      <Stethoscope className="w-4 h-4" />
                      <span className="text-sm font-medium">{doctor.doctor_profile.specialization}</span>
                    </div>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="space-y-3 border-t pt-4">
                  {doctor.doctor_profile?.license_number && (
                    <div className="flex items-start gap-2 text-sm">
                      <Award className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500">License</p>
                        <p className="text-gray-900 font-medium">{doctor.doctor_profile.license_number}</p>
                      </div>
                    </div>
                  )}

                  {doctor.phone && (
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500">Contact</p>
                        <p className="text-gray-900 font-medium">{doctor.phone}</p>
                      </div>
                    </div>
                  )}

                  {doctor.doctor_profile?.bio && (
                    <div className="text-sm">
                      <p className="text-gray-500 mb-1">About</p>
                      <p className="text-gray-700 line-clamp-3">{doctor.doctor_profile.bio}</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <Link
                    to="/appointments/book"
                    state={{ doctorId: doctor.id }}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Doctor Count */}
        {filteredDoctors.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {filteredDoctors.length} of {doctors.length} doctor
            {doctors.length !== 1 ? 's' : ''}
          </div>
        )}
      </main>
      </div>
    </>
  );
}
