'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  const trainers = [
    { id: '1', name: 'Chathurika Silva', specialization: 'Strength Training', rating: 4.9, experience: '5 years', avatar: '/not-found.png' },
    { id: '2', name: 'Isuru Bandara', specialization: 'Cardio & HIIT', rating: 4.8, experience: '7 years', avatar: '/not-found.png' },
    { id: '3', name: 'Thilini Wijesinghe', specialization: 'Yoga & Flexibility', rating: 4.9, experience: '4 years', avatar: '/not-found.png' },
    { id: '4', name: 'Dinesh Fernando', specialization: 'Bodybuilding', rating: 4.7, experience: '8 years', avatar: '/not-found.png' },
    { id: '5', name: 'Gayani Fernando', specialization: 'Nutrition & Wellness', rating: 4.9, experience: '6 years', avatar: '/not-found.png' }
  ];

  const appointmentTypes = [
    'Personal Training',
    'Nutrition Consultation',
    'Group Class',
    'Assessment',
    'Rehabilitation',
    'Sports Specific Training'
  ];

  const timeSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
  ];

  const upcomingAppointments = [
    {
      id: 1,
      trainer: 'Chathurika Silva',
      type: 'Personal Training',
      date: '2025-01-18',
      time: '10:00 AM',
      duration: '60 min',
      status: 'confirmed',
      location: 'Studio A'
    },
    {
      id: 2,
      trainer: 'Isuru Bandara',
      type: 'Nutrition Consultation',
      date: '2025-01-20',
      time: '2:00 PM',
      duration: '45 min',
      status: 'confirmed',
      location: 'Consultation Room'
    },
    {
      id: 3,
      trainer: 'Thilini Wijesinghe',
      type: 'Group Class',
      date: '2025-01-22',
      time: '6:00 PM',
      duration: '75 min',
      status: 'pending',
      location: 'Yoga Studio'
    }
  ];

  const pastAppointments = [
    {
      id: 4,
      trainer: 'Dinesh Fernando',
      type: 'Personal Training',
      date: '2025-01-15',
      time: '9:00 AM',
      duration: '60 min',
      status: 'completed',
      rating: 5,
      notes: 'Great session! Focused on upper body strength.'
    },
    {
      id: 5,
      trainer: 'Gayani Fernando',
      type: 'Nutrition Consultation',
      date: '2025-01-12',
      time: '3:00 PM',
      duration: '45 min',
      status: 'completed',
      rating: 5,
      notes: 'Helpful dietary recommendations.'
    }
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateBooked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return upcomingAppointments.some(apt => apt.date === dateStr);
  };

  const handleBookAppointment = () => {
    if (selectedTrainer && selectedTimeSlot && appointmentType) {
      // In real app, this would call the booking API
      alert('Appointment booked successfully!');
      // Reset form
      setSelectedTrainer('');
      setSelectedTimeSlot('');
      setAppointmentType('');
      setNotes('');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleCancelAppointment = () => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      // In real app, this would call the cancellation API
      alert('Appointment cancelled successfully!');
    }
  };

  const handleRescheduleAppointment = () => {
    // In real app, this would open a reschedule modal
    alert('Reschedule functionality would open here');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <Image
                src="/logo.png"
                alt="PowerWorld Fitness Logo"
                width={50}
                height={50}
                className="transition-transform group-hover:scale-105"
                priority
              />
              <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                PowerWorld
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointments</h1>
            <p className="text-gray-600">Schedule your training sessions and consultations</p>
          </div>

          {/* View Toggle */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Calendar View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                List View
              </button>
            </div>
            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors">
              Book New Appointment
            </button>
          </div>

          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {formatDate(selectedDate)}
                    </h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-gray-600 font-semibold py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {getDaysInMonth(selectedDate).map((day, index) => (
                      <div
                        key={index}
                        className={`aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
                          day
                            ? isDateBooked(day)
                              ? 'bg-red-500/20 text-red-500 border border-red-500'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            : ''
                        }`}
                        onClick={() => day && setSelectedDate(day)}
                      >
                        {day && day.getDate()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Book Appointment</h3>
                
                <div className="space-y-4">
                  {/* Trainer Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Trainer
                    </label>
                    <select
                      value={selectedTrainer}
                      onChange={(e) => setSelectedTrainer(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Choose a trainer</option>
                      {trainers.map(trainer => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name} - {trainer.specialization}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type
                    </label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select type</option>
                      {appointmentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Slot
                    </label>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Any specific requirements or goals..."
                    />
                  </div>

                  <button
                    onClick={handleBookAppointment}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Appointments */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Appointments</h2>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-semibold">{appointment.trainer}</h3>
                          <p className="text-gray-600 text-sm">{appointment.type}</p>
                          <p className="text-gray-500 text-xs">{appointment.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">{appointment.date}</p>
                        <p className="text-gray-600 text-sm">{appointment.time} ({appointment.duration})</p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleRescheduleAppointment()}
                            className="text-blue-500 hover:text-blue-600 text-sm"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelAppointment()}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Appointments */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Past Appointments</h2>
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-semibold">{appointment.trainer}</h3>
                          <p className="text-gray-600 text-sm">{appointment.type}</p>
                          <p className="text-gray-500 text-xs">{appointment.notes}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">{appointment.date}</p>
                        <p className="text-gray-600 text-sm">{appointment.time} ({appointment.duration})</p>
                        <div className="flex items-center justify-end mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < appointment.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trainers Section */}
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Our Trainers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((trainer) => (
                  <div key={trainer.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {trainer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-gray-900 font-semibold">{trainer.name}</h3>
                        <p className="text-gray-600 text-sm">{trainer.specialization}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-gray-700">{trainer.rating}</span>
                      </div>
                      <span className="text-gray-600">{trainer.experience}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
