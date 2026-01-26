'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function ManagerDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'
  const [managerStats] = useState({
    totalMembers: 1247,
    activeMembers: 1089,
    monthlyRevenue: 12340,
    memberRetention: 87.5,
    averageWorkoutFrequency: 4.2,
    trainerUtilization: 78.3,
    equipmentUtilization: 65.8,
    memberSatisfaction: 4.6
  });

  const [insights] = useState([
    { id: 1, type: 'trend', title: 'Peak Hours Analysis', description: 'Gym is busiest between 6-8 PM on weekdays', impact: 'high', recommendation: 'Consider adding more staff during peak hours' },
    { id: 2, type: 'revenue', title: 'Revenue Growth', description: 'Monthly revenue increased by 12% compared to last month', impact: 'positive', recommendation: 'Continue current marketing strategies' },
    { id: 3, type: 'member', title: 'Member Retention', description: 'Retention rate dropped by 3% this month', impact: 'medium', recommendation: 'Implement member engagement programs' },
    { id: 4, type: 'equipment', title: 'Equipment Usage', description: 'Cardio equipment usage is 15% higher than strength training', impact: 'low', recommendation: 'Consider expanding cardio section' }
  ]);


  const [upcomingTasks] = useState([
    { id: 1, task: 'Review monthly budget', priority: 'high', dueDate: '2025-01-20', assignee: 'Manager' },
    { id: 2, task: 'Staff performance evaluation', priority: 'medium', dueDate: '2025-01-22', assignee: 'Manager' },
    { id: 3, task: 'Equipment maintenance schedule', priority: 'low', dueDate: '2025-01-25', assignee: 'Staff' },
    { id: 4, task: 'Member feedback analysis', priority: 'medium', dueDate: '2025-01-18', assignee: 'Manager' }
  ]);

  const [occupancyData] = useState({
    week: [45, 52, 48, 61, 58, 35, 28], // Mon-Sun
    month: [42, 45, 48, 52, 55, 58, 61, 58, 55, 52, 48, 45, 42, 45, 48, 52, 55, 58, 61, 58, 55, 52, 48, 45, 42, 45, 48, 52, 55, 58, 61],
    year: [35, 38, 42, 45, 48, 52, 55, 58, 61, 58, 55, 52]
  });

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

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'week':
        return occupancyData.week;
      case 'month':
        return occupancyData.month;
      case 'year':
        return occupancyData.year;
      default:
        return occupancyData.week;
    }
  };

  const getMaxValue = (data: number[]) => {
    return Math.max(...data, 1);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/20';
      case 'positive':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
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
                PowerWorld Manager
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Gym Manager</div>
              <div className="text-gray-900 font-semibold">Management Panel</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Management Dashboard
            </h1>
            <p className="text-gray-600">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Members */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Members</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{managerStats.totalMembers.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  <span className="text-green-500">{managerStats.activeMembers}</span> active
                </div>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">Rs.{managerStats.monthlyRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  <span className="text-green-500">+12%</span> vs last month
                </div>
              </div>
            </div>

            {/* Member Retention */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Retention Rate</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{managerStats.memberRetention}%</div>
                <div className="text-sm text-gray-600">
                  <span className="text-red-500">-3%</span> vs last month
                </div>
              </div>
            </div>

            {/* Member Satisfaction */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Satisfaction</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{managerStats.memberSatisfaction}/5</div>
                <div className="text-sm text-gray-600">Average rating</div>
              </div>
            </div>
          </div>

          {/* Management Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Reports */}
            <Link
              href="/manager/reports"
              className="p-6 rounded-lg border-2 border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Generate Reports</h3>
              <p className="text-sm opacity-75">Create detailed analytics</p>
            </Link>

            {/* Insights */}
            <Link
              href="/manager/insights"
              className="p-6 rounded-lg border-2 border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">View Insights</h3>
              <p className="text-sm opacity-75">Analytics and trends</p>
            </Link>

            {/* Staff Analytics */}
            <Link
              href="/manager/staff"
              className="p-6 rounded-lg border-2 border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Staff Analytics</h3>
              <p className="text-sm opacity-75">Analyze team performance</p>
            </Link>

            {/* Member Analytics */}
            <Link
              href="/manager/members"
              className="p-6 rounded-lg border-2 border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Member Analytics</h3>
              <p className="text-sm opacity-75">Track member activity</p>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Insights */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Key Insights</h3>
                  <Link
                    href="/manager/insights"
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-gray-900 font-semibold">{insight.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getImpactColor(insight.impact)}`}>
                          {insight.impact}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                      <p className="text-gray-500 text-xs italic">Recommendation: {insight.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Tasks</h3>
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-gray-900 font-semibold text-sm">{task.task}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Due:</span>
                          <span className="text-gray-900">{task.dueDate}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Assignee:</span>
                          <span className="text-gray-900">{task.assignee}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Occupancy Chart */}
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Gym Occupancy Trend</h3>
              <div className="flex items-end justify-between h-32">
                {getCurrentData().map((value, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="w-6 rounded-t-lg bg-gradient-to-t from-red-500 to-red-400 transition-all duration-500"
                      style={{ height: `${(value / getMaxValue(getCurrentData())) * 100}px` }}
                    ></div>
                    <span className="text-gray-600 text-xs mt-2">
                      {selectedPeriod === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] : 
                       selectedPeriod === 'month' ? index + 1 : 
                       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                    </span>
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
