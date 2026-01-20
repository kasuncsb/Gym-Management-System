'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function ProgressPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'

  const workoutData = {
    week: [1, 0, 1, 1, 0, 1, 0], // Mon-Sun
    month: [4, 3, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3, 4, 5, 4, 6, 3],
    year: [18, 22, 19, 25, 21, 23, 20, 24, 22, 26, 21, 23] // 12 months only
  };

  const weightData = {
    week: [75.8, 75.6, 75.4, 75.3, 75.2, 75.1, 75.0],
    month: [76.5, 76.2, 75.9, 75.7, 75.5, 75.3, 75.1, 75.0, 74.8, 74.6, 74.4, 74.2, 74.0, 73.8, 73.6, 73.4, 73.2, 73.0, 72.8, 72.6, 72.4, 72.2, 72.0, 71.8, 71.6, 71.4, 71.2, 71.0, 70.8, 70.6, 70.4],
    year: [80.0, 79.0, 78.0, 77.0, 76.0, 75.0, 74.0, 73.0, 72.0, 71.0, 70.0, 69.0] // 12 months only
  };

  const personalRecords = [
    { exercise: 'Bench Press', current: '120 kg', previous: '115 kg', improvement: '+5 kg', date: '2025-01-15' },
    { exercise: 'Squat', current: '150 kg', previous: '145 kg', improvement: '+5 kg', date: '2025-01-12' },
    { exercise: 'Deadlift', current: '180 kg', previous: '175 kg', improvement: '+5 kg', date: '2025-01-10' },
    { exercise: 'Overhead Press', current: '80 kg', previous: '75 kg', improvement: '+5 kg', date: '2025-01-08' },
    { exercise: 'Pull-ups', current: '15 reps', previous: '12 reps', improvement: '+3 reps', date: '2025-01-05' }
  ];

  const achievements = [
    { name: 'First Workout', description: 'Completed your first workout', date: '2024-12-01', icon: '🏃‍♂️' },
    { name: 'Week Warrior', description: 'Worked out 5 days in a week', date: '2024-12-15', icon: '💪' },
    { name: 'Month Master', description: 'Worked out 20 days in a month', date: '2024-12-31', icon: '🏆' },
    { name: 'Weight Loss', description: 'Lost 5kg in a month', date: '2025-01-10', icon: '⚖️' },
    { name: 'Strength Gain', description: 'Increased bench press by 10kg', date: '2025-01-15', icon: '🔥' }
  ];

  const weeklyStats = {
    workouts: 4,
    totalTime: '6h 30m',
    caloriesBurned: 2840,
    avgHeartRate: 145,
    steps: 45600,
    distance: '32.5 km'
  };

  const monthlyStats = {
    workouts: 18,
    totalTime: '28h 45m',
    caloriesBurned: 12840,
    avgHeartRate: 142,
    steps: 198600,
    distance: '142.3 km'
  };

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'week':
        return workoutData.week;
      case 'month':
        return workoutData.month;
      case 'year':
        return workoutData.year;
      default:
        return workoutData.week;
    }
  };

  const getWeightData = () => {
    switch (selectedPeriod) {
      case 'week':
        return weightData.week;
      case 'month':
        return weightData.month;
      case 'year':
        return weightData.year;
      default:
        return weightData.week;
    }
  };

  const getCurrentStats = () => {
    return selectedPeriod === 'week' ? weeklyStats : monthlyStats;
  };

  const getMaxValue = (data: number[]) => {
    return Math.max(...data, 1);
  };


  const getProgressPercentage = () => {
    // Placeholder progress calculation
    return 75; // 75% progress
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
            <p className="text-gray-600">Track your fitness journey and celebrate achievements</p>
          </div>

          {/* Period Selection */}
          <div className="flex space-x-2 mb-6">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  selectedPeriod === period
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weight Progress</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current:</span>
                  <span className="text-gray-900 font-bold">75.5 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target:</span>
                  <span className="text-gray-900">70.0 kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {getProgressPercentage().toFixed(1)}% to goal
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Body Composition</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Body Fat:</span>
                  <span className="text-gray-900 font-bold">18.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Muscle Mass:</span>
                  <span className="text-gray-900 font-bold">32.1 kg</span>
                </div>
                <div className="text-center text-sm text-green-500">
                  Healthy Range
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Workouts</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">This {selectedPeriod}:</span>
                  <span className="text-gray-900 font-bold text-xl">{getCurrentStats().workouts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="text-gray-900">{getCurrentStats().totalTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calories:</span>
                  <span className="text-orange-400 font-bold">{getCurrentStats().caloriesBurned.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Steps:</span>
                  <span className="text-gray-900 font-bold">{getCurrentStats().steps.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="text-gray-900">{getCurrentStats().distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg HR:</span>
                  <span className="text-red-500 font-bold">{getCurrentStats().avgHeartRate} bpm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Workout Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Workout Activity</h3>
              <div className="h-64 flex items-end justify-between overflow-hidden gap-1">
                {getCurrentData().map((value, index) => (
                  <div key={index} className="flex flex-col items-center flex-shrink-0 flex-1">
                    <div
                      className={`w-full max-w-4 rounded-t-lg transition-all duration-500 ${
                        value > 0
                          ? 'bg-gradient-to-t from-red-500 to-red-400'
                          : 'bg-gray-300'
                      }`}
                      style={{ height: `${Math.min((value / getMaxValue(getCurrentData())) * 200, 200)}px` }}
                    ></div>
                    <span className="text-gray-600 text-xs mt-2 truncate w-full text-center">
                      {selectedPeriod === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] : 
                       selectedPeriod === 'month' ? (index + 1) : 
                       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Weight Trend</h3>
              <div className="h-64 flex items-end justify-between overflow-hidden gap-1">
                {getWeightData().map((value, index) => (
                  <div key={index} className="flex flex-col items-center flex-shrink-0 flex-1">
                    <div
                      className="w-full max-w-4 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ height: `${Math.min(((value - Math.min(...getWeightData())) / (Math.max(...getWeightData()) - Math.min(...getWeightData()))) * 200, 200)}px` }}
                    ></div>
                    <span className="text-gray-600 text-xs mt-2 truncate w-full text-center">
                      {selectedPeriod === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] : 
                       selectedPeriod === 'month' ? (index + 1) : 
                       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Records */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalRecords.map((record, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-gray-900 font-semibold">{record.exercise}</h4>
                    <span className="text-green-500 text-sm font-bold">{record.improvement}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current:</span>
                      <span className="text-gray-900 font-bold">{record.current}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Previous:</span>
                      <span className="text-gray-700">{record.previous}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-700 text-sm">{record.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <h4 className="text-gray-900 font-semibold">{achievement.name}</h4>
                      <p className="text-gray-600 text-sm">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-xs">{achievement.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
