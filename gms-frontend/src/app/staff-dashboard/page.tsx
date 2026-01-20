'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function StaffDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [staffStats] = useState({
    membersAssisted: 23,
    checkInsToday: 45,
    equipmentIssues: 2,
    memberSatisfaction: 4.7,
    tasksCompleted: 8,
    pendingTasks: 3
  });

  const [recentCheckIns] = useState([
    { id: 1, member: 'John Smith', time: '2 min ago', type: 'check-in', status: 'completed' },
    { id: 2, member: 'Sarah Johnson', time: '5 min ago', type: 'check-out', status: 'completed' },
    { id: 3, member: 'Mike Chen', time: '8 min ago', type: 'check-in', status: 'completed' },
    { id: 4, member: 'Emma Wilson', time: '12 min ago', type: 'assistance', status: 'completed' },
    { id: 5, member: 'David Rodriguez', time: '15 min ago', type: 'check-in', status: 'completed' }
  ]);

  const [pendingTasks] = useState([
    { id: 1, task: 'Clean cardio equipment', priority: 'high', estimatedTime: '30 min', status: 'pending' },
    { id: 2, task: 'Restock towels', priority: 'medium', estimatedTime: '15 min', status: 'pending' },
    { id: 3, task: 'Check equipment maintenance', priority: 'low', estimatedTime: '45 min', status: 'pending' }
  ]);

  const [equipmentStatus] = useState([
    { id: 1, name: 'Treadmill #1', status: 'operational', lastMaintenance: '2025-01-10' },
    { id: 2, name: 'Treadmill #2', status: 'maintenance', lastMaintenance: '2025-01-15' },
    { id: 3, name: 'Elliptical #1', status: 'operational', lastMaintenance: '2025-01-12' },
    { id: 4, name: 'Weight Bench #1', status: 'operational', lastMaintenance: '2025-01-08' },
    { id: 5, name: 'Rowing Machine', status: 'out_of_order', lastMaintenance: '2025-01-14' }
  ]);

  const [memberRequests] = useState([
    { id: 1, member: 'Lisa Thompson', request: 'Need help with form on bench press', time: '5 min ago', priority: 'medium' },
    { id: 2, member: 'Alex Brown', request: 'Equipment not working properly', time: '12 min ago', priority: 'high' },
    { id: 3, member: 'Maria Garcia', request: 'Looking for workout recommendations', time: '18 min ago', priority: 'low' }
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

  const handleCheckIn = () => {
    setIsCheckedIn(!isCheckedIn);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400 bg-green-500/20';
      case 'maintenance':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'out_of_order':
        return 'text-red-400 bg-red-500/20';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'check-in':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'check-out':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'assistance':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
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
                PowerWorld Staff
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Staff Member</div>
              <div className="text-gray-900 font-semibold">Operations Panel</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
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
              Staff Operations Dashboard
            </h1>
            <p className="text-gray-600">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>

          {/* Staff Check-in Status */}
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Staff Status</h2>
                  <p className="text-gray-600">
                    {isCheckedIn ? 'You are currently checked in' : 'You are currently checked out'}
                  </p>
                </div>
                <button
                  onClick={handleCheckIn}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isCheckedIn
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isCheckedIn ? 'Check Out' : 'Check In'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Members Assisted */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Members Assisted</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{staffStats.membersAssisted}</div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </div>

            {/* Check-ins Today */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Check-ins Today</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{staffStats.checkInsToday}</div>
                <div className="text-sm text-gray-600">Total processed</div>
              </div>
            </div>

            {/* Equipment Issues */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Equipment Issues</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{staffStats.equipmentIssues}</div>
                <div className="text-sm text-gray-600">Require attention</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Member Check-in */}
            <Link
              href="/staff/checkin"
              className="p-6 rounded-lg border-2 border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Member Check-in</h3>
              <p className="text-sm opacity-75">Process member entry</p>
            </Link>

            {/* Equipment Status */}
            <Link
              href="/staff/equipment"
              className="p-6 rounded-lg border-2 border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Equipment Status</h3>
              <p className="text-sm opacity-75">Monitor equipment</p>
            </Link>

            {/* Member Assistance */}
            <Link
              href="/staff/assistance"
              className="p-6 rounded-lg border-2 border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Member Assistance</h3>
              <p className="text-sm opacity-75">Help members</p>
            </Link>

            {/* Tasks */}
            <Link
              href="/staff/tasks"
              className="p-6 rounded-lg border-2 border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Daily Tasks</h3>
              <p className="text-sm opacity-75">View assignments</p>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Check-ins */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Check-ins</h3>
                  <Link
                    href="/staff/checkin"
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {getTypeIcon(checkIn.type)}
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-semibold">{checkIn.member}</h4>
                          <p className="text-gray-600 text-sm capitalize">{checkIn.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">{checkIn.time}</p>
                        <span className="text-green-500 text-xs">{checkIn.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Pending Tasks</h3>
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-gray-900 font-semibold text-sm">{task.task}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Time:</span>
                          <span className="text-gray-900">{task.estimatedTime}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Status:</span>
                          <span className="text-yellow-500">{task.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Status & Member Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Equipment Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Equipment Status</h3>
              <div className="space-y-4">
                {equipmentStatus.map((equipment) => (
                  <div key={equipment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-gray-900 font-semibold">{equipment.name}</h4>
                      <p className="text-gray-600 text-sm">Last maintenance: {equipment.lastMaintenance}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(equipment.status)}`}>
                      {equipment.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Requests */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Member Requests</h3>
              <div className="space-y-4">
                {memberRequests.map((request) => (
                  <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-gray-900 font-semibold text-sm">{request.member}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{request.request}</p>
                    <p className="text-gray-500 text-xs">{request.time}</p>
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
