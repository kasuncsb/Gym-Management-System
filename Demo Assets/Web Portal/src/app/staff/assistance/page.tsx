'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function StaffAssistance() {
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all'
  });
  const [selectedRequest, setSelectedRequest] = useState<typeof requests[0] | null>(null);
  const [isResponding, setIsResponding] = useState(false);

  const [requests] = useState([
    {
      id: 1,
      member: 'Gayani Fernando',
      memberId: 'MEM004',
      request: 'Need help with form on bench press',
      category: 'Form Check',
      priority: 'medium',
      status: 'pending',
      time: '5 min ago',
      location: 'Weight Room',
      description: 'Member is having trouble with proper form on bench press and needs guidance on technique.'
    },
    {
      id: 2,
      member: 'Ruwan Jayawardena',
      memberId: 'MEM005',
      request: 'Equipment not working properly',
      category: 'Equipment Issue',
      priority: 'high',
      status: 'in_progress',
      time: '12 min ago',
      location: 'Cardio Zone',
      description: 'Treadmill #2 is making strange noises and the belt is slipping.'
    },
    {
      id: 3,
      member: 'Nirosha Senanayake',
      memberId: 'MEM006',
      request: 'Looking for workout recommendations',
      category: 'General Help',
      priority: 'low',
      status: 'completed',
      time: '18 min ago',
      location: 'Reception',
      description: 'New member looking for a beginner workout routine.'
    },
    {
      id: 4,
      member: 'Nimal Perera',
      memberId: 'MEM001',
      request: 'Can\'t access locker room',
      category: 'Access Issue',
      priority: 'high',
      status: 'pending',
      time: '3 min ago',
      location: 'Locker Room',
      description: 'Member\'s key card is not working for locker room access.'
    },
    {
      id: 5,
      member: 'Chathurika Silva',
      memberId: 'MEM002',
      request: 'Need spotter for heavy lifts',
      category: 'Safety',
      priority: 'medium',
      status: 'in_progress',
      time: '8 min ago',
      location: 'Weight Room',
      description: 'Member needs a spotter for deadlifts and squats.'
    },
    {
      id: 6,
      member: 'Isuru Bandara',
      memberId: 'MEM003',
      request: 'Water fountain not working',
      category: 'Facility Issue',
      priority: 'low',
      status: 'completed',
      time: '25 min ago',
      location: 'Cardio Zone',
      description: 'Water fountain in cardio zone is not dispensing water.'
    }
  ]);

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filter.status === 'all' || request.status === filter.status;
    const matchesPriority = filter.priority === 'all' || request.priority === filter.priority;
    
    return matchesStatus && matchesPriority;
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/20';
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Form Check':
        return '🏋️';
      case 'Equipment Issue':
        return '🔧';
      case 'General Help':
        return '❓';
      case 'Access Issue':
        return '🔑';
      case 'Safety':
        return '🛡️';
      case 'Facility Issue':
        return '🏢';
      default:
        return '📝';
    }
  };

  const handleStatusUpdate = async () => {
    setIsResponding(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsResponding(false);
    setSelectedRequest(null);
    // Show success message
  };

  const handleResponse = async () => {
    setIsResponding(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsResponding(false);
    setSelectedRequest(null);
    // Show success message
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/staff-dashboard" className="flex items-center space-x-3 group">
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
              <div className="text-gray-900 font-semibold">Member Assistance</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Assistance</h1>
                <p className="text-gray-600">Help members with their requests and issues</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  New Request
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  View All
                </button>
              </div>
            </div>
          </div>

          {/* Request Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔄</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🚨</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.priority === 'high').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filter.priority}
                  onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">{getCategoryIcon(request.category)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{request.member}</h3>
                        <span className="text-sm text-gray-500">({request.memberId})</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-gray-900 font-medium mb-1">{request.request}</h4>
                      <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📍 {request.location}</span>
                        <span>⏰ {request.time}</span>
                        <span>🏷️ {request.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Respond
                    </button>
                    {request.status === 'pending' && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isResponding}
                        className="px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isResponding}
                        className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results</p>
            </div>
          )}

          {/* Request Response Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Respond to Request</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(selectedRequest.category)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedRequest.member}</h3>
                      <p className="text-sm text-gray-600">{selectedRequest.memberId}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Request Details</h4>
                    <p className="text-gray-900 mb-2">{selectedRequest.request}</p>
                    <p className="text-sm text-gray-600">{selectedRequest.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 text-gray-900">{selectedRequest.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Priority:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                    <textarea
                      rows={4}
                      placeholder="Type your response or action taken..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleResponse}
                      disabled={isResponding}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isResponding ? 'Processing...' : 'Mark as Completed'}
                    </button>
                    <button
                      onClick={handleResponse}
                      disabled={isResponding}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                    >
                      {isResponding ? 'Processing...' : 'Mark as In Progress'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
