'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function ManagerStaff() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<typeof staff[0] | null>(null);

  const [staff] = useState([
    {
      id: 'STF001',
      name: 'Mike Davis',
      email: 'mike.d@email.com',
      phone: '+94123456784',
      role: 'admin',
      hireDate: '2023-06-01',
      status: 'active',
      department: 'Administration',
      performance: 95,
      tasksCompleted: 156,
      memberSatisfaction: 4.8,
      lastActive: '2024-01-15 14:30'
    },
    {
      id: 'STF002',
      name: 'Lisa Thompson',
      email: 'lisa.t@email.com',
      phone: '+94123456783',
      role: 'manager',
      hireDate: '2023-08-15',
      status: 'active',
      department: 'Management',
      performance: 92,
      tasksCompleted: 143,
      memberSatisfaction: 4.7,
      lastActive: '2024-01-15 14:25'
    },
    {
      id: 'STF003',
      name: 'Alex Brown',
      email: 'alex.b@email.com',
      phone: '+94123456782',
      role: 'instructor',
      hireDate: '2023-09-10',
      status: 'active',
      department: 'Training',
      performance: 88,
      tasksCompleted: 98,
      memberSatisfaction: 4.6,
      lastActive: '2024-01-15 14:20'
    },
    {
      id: 'STF004',
      name: 'Maria Garcia',
      email: 'maria.g@email.com',
      phone: '+94123456781',
      role: 'receptionist',
      hireDate: '2023-10-05',
      status: 'inactive',
      department: 'Reception',
      performance: 85,
      tasksCompleted: 67,
      memberSatisfaction: 4.5,
      lastActive: '2024-01-10 16:00'
    },
    {
      id: 'STF005',
      name: 'John Wilson',
      email: 'john.w@email.com',
      phone: '+94123456780',
      role: 'instructor',
      hireDate: '2023-11-20',
      status: 'active',
      department: 'Training',
      performance: 90,
      tasksCompleted: 112,
      memberSatisfaction: 4.7,
      lastActive: '2024-01-15 14:15'
    }
  ]);

  const [performanceData] = useState({
    overall: {
      averagePerformance: 90,
      totalStaff: 5,
      activeStaff: 4,
      averageSatisfaction: 4.7,
      totalTasksCompleted: 576
    },
    departments: [
      { name: 'Administration', staff: 1, performance: 95, satisfaction: 4.8 },
      { name: 'Management', staff: 1, performance: 92, satisfaction: 4.7 },
      { name: 'Training', staff: 2, performance: 89, satisfaction: 4.65 },
      { name: 'Reception', staff: 1, performance: 85, satisfaction: 4.5 }
    ],
    trends: {
      performance: '+5%',
      satisfaction: '+0.2',
      taskCompletion: '+12%'
    }
  });

  const filteredStaff = staff.filter(staffMember => 
    staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-400 bg-red-500/20';
      case 'manager':
        return 'text-blue-400 bg-blue-500/20';
      case 'instructor':
        return 'text-green-400 bg-green-500/20';
      case 'receptionist':
        return 'text-purple-400 bg-purple-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20';
      case 'inactive':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-500';
    if (performance >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.overall.totalStaff}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.overall.activeStaff}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.overall.averagePerformance}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.overall.averageSatisfaction}/5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
        <div className="space-y-4">
          {performanceData.departments.map((dept, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{dept.name}</h4>
                <p className="text-sm text-gray-600">{dept.staff} staff member{dept.staff !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Performance</p>
                  <p className="text-lg font-semibold text-gray-900">{dept.performance}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Satisfaction</p>
                  <p className="text-lg font-semibold text-gray-900">{dept.satisfaction}/5</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{performanceData.trends.performance}</div>
            <p className="text-sm text-gray-600">Performance Improvement</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">+{performanceData.trends.satisfaction}</div>
            <p className="text-sm text-gray-600">Satisfaction Increase</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{performanceData.trends.taskCompletion}</div>
            <p className="text-sm text-gray-600">Task Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStaffList = () => (
    <div className="space-y-4">
      {filteredStaff.map((staffMember) => (
        <div key={staffMember.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-semibold">
                  {staffMember.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{staffMember.name}</h3>
                <p className="text-sm text-gray-600">{staffMember.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(staffMember.role)}`}>
                    {staffMember.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(staffMember.status)}`}>
                    {staffMember.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Performance</p>
                <p className={`text-lg font-semibold ${getPerformanceColor(staffMember.performance)}`}>
                  {staffMember.performance}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="text-lg font-semibold text-gray-900">{staffMember.tasksCompleted}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className="text-lg font-semibold text-gray-900">{staffMember.memberSatisfaction}/5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Last Active</p>
                <p className="text-sm text-gray-900">{staffMember.lastActive}</p>
              </div>
              <button
                onClick={() => setSelectedStaff(staffMember)}
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
              <div className="text-gray-900 font-semibold">Staff Analytics</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Analytics</h1>
                <p className="text-gray-600">Monitor staff performance and analyze team metrics</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Add Staff Member
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
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'staff'
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Staff List
                </button>
              </nav>
            </div>
          </div>

          {/* Search */}
          {activeTab === 'staff' && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Content */}
          <div>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'staff' && renderStaffList()}
          </div>

          {/* Staff Details Modal */}
          {selectedStaff && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Staff Details</h2>
                  <button
                    onClick={() => setSelectedStaff(null)}
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
                        {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{selectedStaff.name}</h3>
                      <p className="text-gray-600">{selectedStaff.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(selectedStaff.role)}`}>
                          {selectedStaff.role}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedStaff.status)}`}>
                          {selectedStaff.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-900">{selectedStaff.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900">{selectedStaff.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="text-gray-900">{selectedStaff.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hire Date:</span>
                          <span className="text-gray-900">{selectedStaff.hireDate}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Performance Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Performance:</span>
                          <span className={`font-semibold ${getPerformanceColor(selectedStaff.performance)}`}>
                            {selectedStaff.performance}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tasks Completed:</span>
                          <span className="text-gray-900">{selectedStaff.tasksCompleted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Member Satisfaction:</span>
                          <span className="text-gray-900">{selectedStaff.memberSatisfaction}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Active:</span>
                          <span className="text-gray-900">{selectedStaff.lastActive}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      Edit Details
                    </button>
                    <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      View Performance
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
