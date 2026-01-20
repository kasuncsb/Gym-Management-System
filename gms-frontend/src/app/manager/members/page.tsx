'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function ManagerMembers() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<typeof members[0] | null>(null);

  const [members] = useState([
    {
      id: 'MEM001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+94123456789',
      joinDate: '2024-01-15',
      status: 'active',
      subscription: 'Premium Monthly',
      lastVisit: '2024-01-15',
      totalVisits: 28,
      averageWorkoutTime: 75,
      memberSatisfaction: 4.8,
      preferredTime: 'Evening',
      workoutFrequency: '5x/week'
    },
    {
      id: 'MEM002',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+94123456788',
      joinDate: '2024-01-10',
      status: 'active',
      subscription: 'Basic Monthly',
      lastVisit: '2024-01-14',
      totalVisits: 26,
      averageWorkoutTime: 60,
      memberSatisfaction: 4.7,
      preferredTime: 'Morning',
      workoutFrequency: '4x/week'
    },
    {
      id: 'MEM003',
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      phone: '+94123456787',
      joinDate: '2024-01-05',
      status: 'active',
      subscription: 'Elite Monthly',
      lastVisit: '2024-01-13',
      totalVisits: 24,
      averageWorkoutTime: 90,
      memberSatisfaction: 4.6,
      preferredTime: 'Evening',
      workoutFrequency: '6x/week'
    },
    {
      id: 'MEM004',
      name: 'Emma Wilson',
      email: 'emma.w@email.com',
      phone: '+94123456786',
      joinDate: '2024-01-20',
      status: 'inactive',
      subscription: 'Annual Basic',
      lastVisit: '2024-01-10',
      totalVisits: 5,
      averageWorkoutTime: 45,
      memberSatisfaction: 4.2,
      preferredTime: 'Afternoon',
      workoutFrequency: '2x/week'
    },
    {
      id: 'MEM005',
      name: 'David Rodriguez',
      email: 'david.r@email.com',
      phone: '+94123456785',
      joinDate: '2024-01-12',
      status: 'active',
      subscription: 'Premium Monthly',
      lastVisit: '2024-01-15',
      totalVisits: 22,
      averageWorkoutTime: 80,
      memberSatisfaction: 4.9,
      preferredTime: 'Evening',
      workoutFrequency: '5x/week'
    }
  ]);

  const [analytics] = useState({
    overview: {
      totalMembers: 1247,
      activeMembers: 1089,
      newMembersThisMonth: 89,
      memberRetention: 87.5,
      averageSatisfaction: 4.6,
      averageWorkoutFrequency: 4.2
    },
    demographics: {
      ageGroups: [
        { range: '18-25', count: 312, percentage: 25 },
        { range: '26-35', count: 499, percentage: 40 },
        { range: '36-45', count: 312, percentage: 25 },
        { range: '46+', count: 124, percentage: 10 }
      ],
      gender: [
        { type: 'Male', count: 748, percentage: 60 },
        { type: 'Female', count: 499, percentage: 40 }
      ],
      subscriptionPlans: [
        { plan: 'Basic Monthly', count: 456, percentage: 36.6 },
        { plan: 'Premium Monthly', count: 389, percentage: 31.2 },
        { plan: 'Elite Monthly', count: 244, percentage: 19.6 },
        { plan: 'Annual Basic', count: 123, percentage: 9.9 }
      ]
    },
    trends: {
      memberGrowth: '+12%',
      retentionImprovement: '+3%',
      satisfactionIncrease: '+0.2',
      averageWorkoutTime: '+5 min'
    }
  });

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20';
      case 'inactive':
        return 'text-gray-400 bg-gray-500/20';
      case 'suspended':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 4.0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalMembers.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.activeMembers.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.newMembersThisMonth}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🔄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.memberRetention}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageSatisfaction}/5</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🏃</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Frequency</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageWorkoutFrequency}x/week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {analytics.demographics.ageGroups.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{group.range} years</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{group.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
          <div className="space-y-3">
            {analytics.demographics.gender.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{group.type}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{group.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plan Distribution</h3>
        <div className="space-y-3">
          {analytics.demographics.subscriptionPlans.map((plan, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{plan.plan}</h4>
                <p className="text-sm text-gray-600">{plan.count} members</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{plan.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{analytics.trends.memberGrowth}</div>
            <p className="text-sm text-gray-600">Member Growth</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{analytics.trends.retentionImprovement}</div>
            <p className="text-sm text-gray-600">Retention Improvement</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">+{analytics.trends.satisfactionIncrease}</div>
            <p className="text-sm text-gray-600">Satisfaction Increase</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{analytics.trends.averageWorkoutTime}</div>
            <p className="text-sm text-gray-600">Avg Workout Time</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMemberList = () => (
    <div className="space-y-4">
      {filteredMembers.map((member) => (
        <div key={member.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                    {member.status}
                  </span>
                  <span className="text-xs text-gray-500">{member.subscription}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Visits</p>
                <p className="text-lg font-semibold text-gray-900">{member.totalVisits}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Time</p>
                <p className="text-lg font-semibold text-gray-900">{member.averageWorkoutTime} min</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className={`text-lg font-semibold ${getSatisfactionColor(member.memberSatisfaction)}`}>
                  {member.memberSatisfaction}/5
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Frequency</p>
                <p className="text-lg font-semibold text-gray-900">{member.workoutFrequency}</p>
              </div>
              <button
                onClick={() => setSelectedMember(member)}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/manager-dashboard" className="flex items-center space-x-3 group">
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
              <div className="text-gray-900 font-semibold">Member Analytics</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Analytics</h1>
                <p className="text-gray-600">Analyze member behavior and engagement patterns</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Export Data
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'members'
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Member List
                </button>
              </nav>
            </div>
          </div>

          {/* Search */}
          {activeTab === 'members' && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Content */}
          <div>
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'members' && renderMemberList()}
          </div>

          {/* Member Details Modal */}
          {selectedMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Member Details</h2>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-xl">
                        {selectedMember.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{selectedMember.name}</h3>
                      <p className="text-gray-600">{selectedMember.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMember.status)}`}>
                          {selectedMember.status}
                        </span>
                        <span className="text-xs text-gray-500">{selectedMember.subscription}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-900">{selectedMember.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900">{selectedMember.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Join Date:</span>
                          <span className="text-gray-900">{selectedMember.joinDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Visit:</span>
                          <span className="text-gray-900">{selectedMember.lastVisit}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Activity Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Visits:</span>
                          <span className="text-gray-900">{selectedMember.totalVisits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Workout Time:</span>
                          <span className="text-gray-900">{selectedMember.averageWorkoutTime} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Satisfaction:</span>
                          <span className={`font-semibold ${getSatisfactionColor(selectedMember.memberSatisfaction)}`}>
                            {selectedMember.memberSatisfaction}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="text-gray-900">{selectedMember.workoutFrequency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Preferences</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preferred Time:</span>
                        <span className="text-gray-900">{selectedMember.preferredTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Workout Frequency:</span>
                        <span className="text-gray-900">{selectedMember.workoutFrequency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      View Full Profile
                    </button>
                    <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      Contact Member
                    </button>
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                      Close
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
