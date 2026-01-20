'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function AdminActivities() {
  const [filter, setFilter] = useState({
    type: 'all',
    user: 'all',
    dateRange: 'today'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [activities] = useState([
    {
      id: 1,
      timestamp: '2024-01-15 14:30:25',
      user: 'John Smith',
      userId: 'MEM001',
      action: 'Member Check-in',
      type: 'member',
      details: 'Member checked in at main entrance',
      ipAddress: '192.168.1.100',
      device: 'Mobile App',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:25:10',
      user: 'Admin',
      userId: 'STF001',
      action: 'System Configuration Updated',
      type: 'system',
      details: 'Updated gym opening hours to 06:00-22:00',
      ipAddress: '192.168.1.50',
      device: 'Web Browser',
      status: 'success'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:45',
      user: 'Sarah Johnson',
      userId: 'MEM002',
      action: 'Payment Processed',
      type: 'payment',
      details: 'Premium Monthly subscription payment - Rs. 5,000',
      ipAddress: '192.168.1.101',
      device: 'Mobile App',
      status: 'success'
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:15:30',
      user: 'Mike Chen',
      userId: 'MEM003',
      action: 'Failed Login Attempt',
      type: 'security',
      details: 'Invalid password entered 3 times',
      ipAddress: '192.168.1.102',
      device: 'Web Browser',
      status: 'failed'
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:10:15',
      user: 'Lisa Thompson',
      userId: 'STF002',
      action: 'Member Profile Updated',
      type: 'staff',
      details: 'Updated emergency contact for member MEM004',
      ipAddress: '192.168.1.51',
      device: 'Web Browser',
      status: 'success'
    },
    {
      id: 6,
      timestamp: '2024-01-15 14:05:00',
      user: 'System',
      userId: 'SYSTEM',
      action: 'Automated Backup',
      type: 'system',
      details: 'Daily database backup completed successfully',
      ipAddress: '192.168.1.1',
      device: 'Server',
      status: 'success'
    },
    {
      id: 7,
      timestamp: '2024-01-15 14:00:20',
      user: 'Emma Wilson',
      userId: 'MEM004',
      action: 'Appointment Booked',
      type: 'member',
      details: 'Booked personal training session with TRN001',
      ipAddress: '192.168.1.103',
      device: 'Mobile App',
      status: 'success'
    },
    {
      id: 8,
      timestamp: '2024-01-15 13:55:10',
      user: 'Alex Brown',
      userId: 'STF003',
      action: 'Equipment Status Updated',
      type: 'staff',
      details: 'Marked Treadmill #2 as under maintenance',
      ipAddress: '192.168.1.52',
      device: 'Tablet',
      status: 'success'
    },
    {
      id: 9,
      timestamp: '2024-01-15 13:50:35',
      user: 'David Rodriguez',
      userId: 'MEM005',
      action: 'Subscription Renewed',
      type: 'member',
      details: 'Elite Monthly subscription auto-renewed',
      ipAddress: '192.168.1.104',
      device: 'Mobile App',
      status: 'success'
    },
    {
      id: 10,
      timestamp: '2024-01-15 13:45:50',
      user: 'System',
      userId: 'SYSTEM',
      action: 'Security Alert',
      type: 'security',
      details: 'Multiple failed login attempts detected from IP 203.0.113.1',
      ipAddress: '203.0.113.1',
      device: 'Unknown',
      status: 'warning'
    }
  ]);

  const filteredActivities = activities.filter(activity => {
    const matchesType = filter.type === 'all' || activity.type === filter.type;
    const matchesUser = filter.user === 'all' || activity.userId === filter.user;
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesUser && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'member':
        return 'text-blue-400 bg-blue-500/20';
      case 'staff':
        return 'text-green-400 bg-green-500/20';
      case 'system':
        return 'text-purple-400 bg-purple-500/20';
      case 'payment':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'security':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'member':
        return '👤';
      case 'staff':
        return '👨‍💼';
      case 'system':
        return '⚙️';
      case 'payment':
        return '💳';
      case 'security':
        return '🔒';
      default:
        return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/admin-dashboard" className="flex items-center space-x-3 group">
              <Image
                src="/logo.png"
                alt="PowerWorld Fitness Logo"
                width={50}
                height={50}
                className="transition-transform group-hover:scale-105"
                priority
              />
              <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                PowerWorld Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">System Administrator</div>
              <div className="text-gray-900 font-semibold">System Activities</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">System Activities</h1>
                <p className="text-gray-600">Monitor all system activities and user actions</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Export Log
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Clear Old Logs
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="member">Member Actions</option>
                  <option value="staff">Staff Actions</option>
                  <option value="system">System Actions</option>
                  <option value="payment">Payment Actions</option>
                  <option value="security">Security Events</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <select
                  value={filter.user}
                  onChange={(e) => setFilter(prev => ({ ...prev, user: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="MEM001">John Smith</option>
                  <option value="STF001">Admin</option>
                  <option value="STF002">Lisa Thompson</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filter.dateRange}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activities.filter(a => a.status === 'success').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">❌</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activities.filter(a => a.status === 'failed').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activities.filter(a => a.status === 'warning').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{getTypeIcon(activity.type)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900">{activity.action}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(activity.type)}`}>
                            {activity.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{activity.details}</p>
                      </div>
                      <div className="mt-3 flex items-center space-x-6 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>👤</span>
                          <span>{activity.user} ({activity.userId})</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>🌐</span>
                          <span>{activity.ipAddress}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>📱</span>
                          <span>{activity.device}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredActivities.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
