import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser, logout, isDoctor } from '../lib/auth';
import { appointmentAPI } from '../lib/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, Clock, Home, Search, CheckCircle } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";

export function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [navigate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getMyAppointments();
      setAppointments(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (appointmentId) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, 'COMPLETED');
      // Refresh appointments after updating
      fetchAppointments();
      setShowModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert(err.response?.data?.message || 'Failed to mark appointment as complete');
    }
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
    setCurrentMonth(new Date());
  };
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  
  const nextDay = () => setCurrentWeekStart(addDays(currentWeekStart, 1));
  const prevDay = () => setCurrentWeekStart(addDays(currentWeekStart, -1));

  const handleNavigation = () => {
    if (currentView === 'week') {
      prevWeek();
    } else if (currentView === 'day') {
      prevDay();
    } else {
      prevMonth();
    }
  };

  const handleNextNavigation = () => {
    if (currentView === 'week') {
      nextWeek();
    } else if (currentView === 'day') {
      nextDay();
    } else {
      nextMonth();
    }
  };

  const getDateRangeText = () => {
    if (currentView === 'week') {
      return `${format(currentWeekStart, 'MMMM d')} - ${format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}`;
    } else if (currentView === 'day') {
      return format(currentWeekStart, 'MMMM d, yyyy');
    } else {
      return format(currentMonth, 'MMMM yyyy');
    }
  };

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = monthStart.getDay();

  // Get appointments for a specific day
  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      if (!apt.appointment_time) return false;
      try {
        const aptDate = parseISO(apt.appointment_time);
        return isSameDay(aptDate, date);
      } catch (error) {
        console.error('Error parsing appointment date:', error);
        return false;
      }
    });
  };

  // Calculate event position and height
  const calculateEventStyle = (startTime) => {
    const date = new Date(startTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const start = hours + minutes / 60;
    const top = (start - 8) * 80; // 80px per hour
    const height = 70; // Increased height for better visibility
    return { top: `${top}px`, height: `${height}px` };
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-orange-500 text-white';
      case 'COMPLETED':
        return 'bg-green-500 text-white';
      case 'CANCELLED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <>
        <LpNavbar1 />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LpNavbar1 />
      <div className="min-h-screen bg-black">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-6">
            <CalendarIcon className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-semibold text-white">
              {user?.role === 'DOCTOR' ? 'Doctor Dashboard' : 'Patient Dashboard'}
            </h1>
          </div>

          <div className="flex gap-6">
            {/* Left Sidebar - Mini Calendar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
                  <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (<div key={i} className="text-center text-xs text-gray-500 font-medium py-1">{day}</div>))}
                  {Array.from({ length: firstDayOffset }).map((_, i) => (<div key={`empty-${i}`} className="aspect-square" />))}
                  {calendarDays.map((day, i) => (
                    <button key={i} className={`aspect-square flex items-center justify-center text-xs rounded text-gray-300 ${isSameDay(day, new Date()) ? 'bg-orange-500 text-white font-medium' : 'hover:bg-gray-800'}`}>{format(day, 'd')}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={goToToday} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm font-medium text-white hover:bg-gray-800">Today</button>
              <div className="flex items-center gap-2">
                <button onClick={handleNavigation} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={handleNextNavigation} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <h2 className="text-lg font-medium text-white">{getDateRangeText()}</h2>
            </div>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg p-1">
              <button onClick={() => setCurrentView('day')} className={`px-4 py-1.5 rounded text-sm font-medium ${currentView === 'day' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Day</button>
              <button onClick={() => setCurrentView('week')} className={`px-4 py-1.5 rounded text-sm font-medium ${currentView === 'week' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Week</button>
              <button onClick={() => setCurrentView('month')} className={`px-4 py-1.5 rounded text-sm font-medium ${currentView === 'month' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Month</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Next Appointment</span>
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-semibold text-white">{(() => {
                const nextApt = appointments.filter(apt => apt.status === 'SCHEDULED' && apt.appointment_time && new Date(apt.appointment_time) > new Date())[0];
                if (nextApt && nextApt.appointment_time) {
                  try { return format(parseISO(nextApt.appointment_time), 'MMM d'); } catch (e) { return 'None'; }
                }
                return 'None';
              })()}</p>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Appointments</span>
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-semibold text-white">{appointments.length}</p>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Upcoming</span>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-semibold text-white">{appointments.filter(apt => {
                try {
                  return apt.status === 'SCHEDULED' && apt.appointment_time && new Date(apt.appointment_time) > new Date();
                } catch (e) {
                  return false;
                }
              }).length}</p>
            </div>
          </div>

          {/* Calendar Views */}
          {currentView === 'week' && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-8 border-b border-gray-700">
                <div className="bg-gray-800 p-4"></div>
                {weekDays.map((day, i) => (
                  <div key={i} className="p-4 text-center border-l border-gray-700">
                    <div className="text-xs text-gray-500 font-medium mb-1">{day}</div>
                    <div className={`text-lg font-medium ${isSameDay(weekDates[i], new Date()) ? 'bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-white'}`}>{format(weekDates[i], 'd')}</div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-8 relative" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <div className="bg-gray-800">
                  {timeSlots.map((time, i) => (
                    <div key={i} className="h-20 border-b border-r border-gray-700 pr-2 text-right text-xs pt-1 text-gray-500 font-medium">
                      {time > 12 ? `${time - 12} PM` : time === 12 ? '12 PM' : `${time} AM`}
                    </div>
                  ))}
                </div>

                {weekDates.map((date, dayIndex) => (
                  <div key={dayIndex} className={`relative ${isSameDay(date, new Date()) ? 'bg-orange-500/10' : ''}`}>
                    {timeSlots.map((_, timeIndex) => (
                      <div key={timeIndex} className="h-20 border-b border-r border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors" />
                    ))}

                    {getAppointmentsForDay(date).map((apt, i) => {
                      if (!apt.appointment_time) return null;
                      let eventStyle, timeDisplay = 'Time N/A';
                      try {
                        eventStyle = calculateEventStyle(apt.appointment_time);
                        timeDisplay = format(parseISO(apt.appointment_time), 'h:mm a');
                      } catch (error) {
                        eventStyle = { top: '0px', height: '70px' };
                      }
                      
                      return (
                        <div key={i} className={`absolute ${getStatusColor(apt.status)} rounded-md p-2.5 text-xs cursor-pointer transition-all hover:shadow-lg hover:scale-105`}
                          style={{ ...eventStyle, left: '6px', right: '6px', minHeight: '60px', zIndex: 10 }}
                          onClick={() => handleAppointmentClick(apt)}>
                          <div className="font-semibold truncate text-xs">{apt.doctor?.full_name || apt.patient?.full_name || 'Unknown'}</div>
                          <div className="flex items-center gap-1 mt-1 opacity-90">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px]">{timeDisplay}</span>
                          </div>
                          {apt.reason && <div className="text-[10px] opacity-80 truncate mt-1">{apt.reason}</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day View */}
          {currentView === 'day' && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-2 border-b border-gray-700">
                <div className="bg-gray-800 p-4"></div>
                <div className="p-4 text-center border-l border-gray-700">
                  <div className="text-xs text-gray-500 font-medium mb-1">{format(currentWeekStart, 'EEEE').toUpperCase()}</div>
                  <div className={`text-lg font-medium ${isSameDay(currentWeekStart, new Date()) ? 'bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-white'}`}>{format(currentWeekStart, 'd')}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 relative" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <div className="bg-gray-800">
                  {timeSlots.map((time, i) => (
                    <div key={i} className="h-20 border-b border-r border-gray-700 pr-2 text-right text-xs pt-1 text-gray-500 font-medium">
                      {time > 12 ? `${time - 12} PM` : time === 12 ? '12 PM' : `${time} AM`}
                    </div>
                  ))}
                </div>

                <div className={`relative ${isSameDay(currentWeekStart, new Date()) ? 'bg-orange-500/10' : ''}`}>
                  {timeSlots.map((_, timeIndex) => (
                    <div key={timeIndex} className="h-20 border-b border-r border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors" />
                  ))}

                  {getAppointmentsForDay(currentWeekStart).map((apt, i) => {
                    if (!apt.appointment_time) return null;
                    let eventStyle, timeDisplay = 'Time N/A';
                    try {
                      eventStyle = calculateEventStyle(apt.appointment_time);
                      timeDisplay = format(parseISO(apt.appointment_time), 'h:mm a');
                    } catch (error) {
                      eventStyle = { top: '0px', height: '70px' };
                    }
                    
                    return (
                      <div key={i} className={`absolute ${getStatusColor(apt.status)} rounded-md p-3 text-sm cursor-pointer transition-all hover:shadow-lg`}
                        style={{ ...eventStyle, left: '8px', right: '8px', minHeight: '70px', zIndex: 10 }}
                        onClick={() => console.log('Clicked appointment:', apt)}>
                        <div className="font-semibold mb-1">{apt.doctor?.user?.name || apt.patient?.user?.name || 'Unknown'}</div>
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{timeDisplay}</span>
                        </div>
                        {apt.reason && <div className="text-xs opacity-90">{apt.reason}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Month View */}
          {currentView === 'month' && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-700">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                  <div key={i} className="p-3 text-center text-xs text-gray-500 font-medium border-r last:border-r-0 border-gray-700">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-700 bg-gray-800" />
                ))}
                
                {calendarDays.map((day, i) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  return (
                    <div key={i} className={`min-h-[100px] border-r last:border-r-0 border-b border-gray-700 p-2 ${
                      isSameDay(day, new Date()) ? 'bg-orange-500/10' : ''
                    }`}>
                      <div className={`text-sm font-medium mb-2 ${
                        isSameDay(day, new Date()) ? 'bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-300'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((apt, idx) => (
                          <div key={idx} className={`${getStatusColor(apt.status)} rounded px-1.5 py-1 text-[10px] truncate cursor-pointer hover:shadow-md`}
                            onClick={() => handleAppointmentClick(apt)}>
                            {format(parseISO(apt.appointment_time), 'h:mm a')} - {apt.doctor?.full_name || apt.patient?.full_name || 'Unknown'}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-[10px] text-gray-500 pl-1.5">+{dayAppointments.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">{error}</div>}

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Appointment Details</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`${getStatusColor(selectedAppointment.status)} px-3 py-1 rounded-full text-sm font-medium`}>
                  {selectedAppointment.status}
                </span>
              </div>

              {/* Patient/Doctor Info */}
              <div>
                <label className="text-sm text-gray-400">
                  {isDoctor() ? 'Patient' : 'Doctor'}
                </label>
                <p className="text-lg font-semibold text-white">
                  {isDoctor() 
                    ? selectedAppointment.patient?.full_name || 'Unknown Patient'
                    : selectedAppointment.doctor?.full_name || 'Unknown Doctor'}
                </p>
                {!isDoctor() && selectedAppointment.doctor?.doctor_profile?.specialization && (
                  <p className="text-sm text-gray-400">{selectedAppointment.doctor.doctor_profile.specialization}</p>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-sm text-gray-400">Date & Time</label>
                <p className="text-lg font-semibold text-white">
                  {selectedAppointment.appointment_time 
                    ? format(parseISO(selectedAppointment.appointment_time), 'PPP p')
                    : 'Not specified'}
                </p>
              </div>

              {/* Duration */}
              {selectedAppointment.duration_minutes && (
                <div>
                  <label className="text-sm text-gray-400">Duration</label>
                  <p className="text-lg font-semibold text-white">{selectedAppointment.duration_minutes} minutes</p>
                </div>
              )}

              {/* Reason */}
              {selectedAppointment.reason && (
                <div>
                  <label className="text-sm text-gray-400">Reason</label>
                  <p className="text-base text-gray-300">{selectedAppointment.reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors font-medium text-white"
                >
                  Close
                </button>
                {isDoctor() && selectedAppointment.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleMarkComplete(selectedAppointment.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
