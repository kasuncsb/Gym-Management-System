'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function MemberDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn] = useState(false);
  const [memberData] = useState({
    name: "Kasun Fernando",
    memberId: "PW2025001",
    subscriptionStatus: "Active",
    subscriptionPlan: "Premium",
    nextPayment: "2025-02-15",
    totalWorkouts: 47,
    thisWeekWorkouts: 4,
    streak: 12,
    lastCheckIn: "2025-01-15 08:30 AM",
    nextAppointment: "2025-01-18 10:00 AM"
  });

  const [workoutStats] = useState({
    thisWeek: [1, 0, 1, 1, 0, 1, 0], // Mon-Sun
    thisMonth: 18,
    personalRecords: 3,
    caloriesBurned: 2840,
    totalHours: 24.5
  });

  const [upcomingAppointments] = useState([
    {
      id: 1,
      trainer: "Chathurika Silva",
      date: "2025-01-18",
      time: "10:00 AM",
      type: "Personal Training"
    },
    {
      id: 2,
      trainer: "Isuru Bandara",
      date: "2025-01-20",
      time: "2:00 PM",
      type: "Nutrition Consultation"
    }
  ]);

  const [recentActivities] = useState([
    {
      id: 1,
      activity: "Check-in",
      time: "08:30 AM",
      date: "2025-01-15"
    },
    {
      id: 2,
      activity: "Workout Completed - Upper Body",
      time: "09:45 AM",
      date: "2025-01-15"
    },
    {
      id: 3,
      activity: "Check-out",
      time: "11:15 AM",
      date: "2025-01-15"
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <div className="text-right">
              <div className="text-sm text-gray-500">Welcome back</div>
              <div className="text-gray-900 font-semibold">{memberData.name}</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {memberData.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {memberData.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-600">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {/* Check In/Out */}
                  <Link
                    href="/qr-scanner"
                    className={`p-6 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                      isCheckedIn
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
                    <h3 className="font-semibold text-lg mb-1">
                      {isCheckedIn ? 'Check Out' : 'Check In'}
                    </h3>
                    <p className="text-sm opacity-75">
                      {isCheckedIn ? 'Tap to check out' : 'Scan QR to enter'}
                    </p>
                  </Link>

            {/* Book Appointment */}
            <Link
              href="/appointments"
              className="p-6 rounded-lg border-2 border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Book Appointment</h3>
              <p className="text-sm opacity-75">Schedule with trainer</p>
            </Link>

            {/* View Progress */}
            <Link
              href="/progress"
              className="p-6 rounded-lg border-2 border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">View Progress</h3>
              <p className="text-sm opacity-75">Track your fitness</p>
            </Link>

            {/* Workout Plans */}
            <Link
              href="/workouts"
              className="p-6 rounded-lg border-2 border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Workout Plans</h3>
              <p className="text-sm opacity-75">Browse routines</p>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Subscription Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  memberData.subscriptionStatus === 'Active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {memberData.subscriptionStatus}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="text-gray-900">{memberData.subscriptionPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Payment:</span>
                  <span className="text-gray-900">{memberData.nextPayment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member ID:</span>
                  <span className="text-gray-900 font-mono">{memberData.memberId}</span>
                </div>
              </div>
            </div>

            {/* Workout Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Workouts:</span>
                  <span className="text-gray-900 font-bold text-xl">{memberData.thisWeekWorkouts}/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Streak:</span>
                  <span className="text-green-500 font-bold">{memberData.streak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-gray-900">{memberData.totalWorkouts} workouts</span>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Workouts:</span>
                  <span className="text-gray-900 font-bold text-xl">{workoutStats.thisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calories:</span>
                  <span className="text-orange-500 font-bold">{workoutStats.caloriesBurned.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours:</span>
                  <span className="text-blue-500 font-bold">{workoutStats.totalHours}h</span>
                </div>
              </div>
            </div>

            {/* Personal Records */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">PRs This Month:</span>
                  <span className="text-yellow-500 font-bold">{workoutStats.personalRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Check-in:</span>
                  <span className="text-gray-900 text-sm">{memberData.lastCheckIn}</span>
                </div>
                <div className="flex justify-center mt-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming Appointments */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h3>
                  <Link
                    href="/appointments"
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    View All
                  </Link>
                </div>
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
                          <h4 className="text-gray-900 font-semibold">{appointment.trainer}</h4>
                          <p className="text-gray-600 text-sm">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">{appointment.date}</p>
                        <p className="text-gray-600 text-sm">{appointment.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-gray-900 text-sm">{activity.activity}</p>
                        <p className="text-gray-600 text-xs">{activity.date} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Workout Chart */}
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Workout Activity</h3>
              <div className="flex items-end justify-between h-32">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={day} className="flex flex-col items-center">
                    <div 
                      className={`w-8 rounded-t-lg transition-all duration-500 ${
                        workoutStats.thisWeek[index] > 0 
                          ? 'bg-gradient-to-t from-red-500 to-red-400' 
                          : 'bg-gray-300'
                      }`}
                      style={{ height: `${(workoutStats.thisWeek[index] / 2) * 100}px` }}
                    ></div>
                    <span className="text-gray-600 text-xs mt-2">{day}</span>
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
