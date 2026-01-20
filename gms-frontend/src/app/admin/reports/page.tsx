'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function AdminReports() {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  const [filters, setFilters] = useState({
    memberType: 'all',
    status: 'all',
    plan: 'all'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', description: 'Member check-in/out patterns and statistics' },
    { id: 'revenue', name: 'Revenue Report', description: 'Financial performance and payment analytics' },
    { id: 'membership', name: 'Membership Report', description: 'Member demographics and subscription trends' },
    { id: 'equipment', name: 'Equipment Usage', description: 'Equipment utilization and maintenance records' },
    { id: 'staff', name: 'Staff Performance', description: 'Staff activities and productivity metrics' },
    { id: 'system', name: 'System Analytics', description: 'System usage and performance statistics' }
  ];

  const [reportData] = useState({
    attendance: {
      totalCheckIns: 2847,
      averageDailyAttendance: 92,
      peakHours: '6:00 PM - 8:00 PM',
      memberRetention: 87.5,
      topMembers: [
        { name: 'John Smith', checkIns: 28, lastVisit: '2024-01-15' },
        { name: 'Sarah Johnson', checkIns: 26, lastVisit: '2024-01-14' },
        { name: 'Mike Chen', checkIns: 24, lastVisit: '2024-01-13' }
      ]
    },
    revenue: {
      totalRevenue: 45680,
      monthlyGrowth: 12.5,
      averageTransaction: 3500,
      paymentMethods: {
        creditCard: 65,
        bankTransfer: 25,
        cash: 10
      },
      topPlans: [
        { name: 'Premium Monthly', revenue: 19450, members: 389 },
        { name: 'Basic Monthly', revenue: 13680, members: 456 },
        { name: 'Elite Monthly', revenue: 19520, members: 244 }
      ]
    },
    membership: {
      totalMembers: 1247,
      newMembers: 89,
      activeMembers: 1089,
      churnRate: 3.2,
      demographics: {
        ageGroups: {
          '18-25': 25,
          '26-35': 40,
          '36-45': 25,
          '46+': 10
        },
        gender: {
          male: 60,
          female: 40
        }
      }
    }
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    // Show success message or download
  };

  const handleExportReport = (format: string) => {
    console.log(`Exporting ${selectedReport} report as ${format}`);
    // Implement export functionality
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700">Total Check-ins</h3>
                <p className="text-2xl font-bold text-blue-900">{reportData.attendance.totalCheckIns.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700">Avg Daily Attendance</h3>
                <p className="text-2xl font-bold text-green-900">{reportData.attendance.averageDailyAttendance}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-700">Peak Hours</h3>
                <p className="text-lg font-bold text-yellow-900">{reportData.attendance.peakHours}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-700">Retention Rate</h3>
                <p className="text-2xl font-bold text-purple-900">{reportData.attendance.memberRetention}%</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Active Members</h3>
              <div className="space-y-3">
                {reportData.attendance.topMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">Last visit: {member.lastVisit}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{member.checkIns} visits</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700">Total Revenue</h3>
                <p className="text-2xl font-bold text-green-900">Rs. {reportData.revenue.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700">Monthly Growth</h3>
                <p className="text-2xl font-bold text-blue-900">+{reportData.revenue.monthlyGrowth}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-700">Avg Transaction</h3>
                <p className="text-2xl font-bold text-purple-900">Rs. {reportData.revenue.averageTransaction.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {Object.entries(reportData.revenue.paymentMethods).map(([method, percentage]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{method.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Revenue Plans</h3>
                <div className="space-y-3">
                  {reportData.revenue.topPlans.map((plan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-500">{plan.members} members</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">Rs. {plan.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'membership':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700">Total Members</h3>
                <p className="text-2xl font-bold text-blue-900">{reportData.membership.totalMembers.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700">New Members</h3>
                <p className="text-2xl font-bold text-green-900">{reportData.membership.newMembers}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-700">Active Members</h3>
                <p className="text-2xl font-bold text-purple-900">{reportData.membership.activeMembers.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-700">Churn Rate</h3>
                <p className="text-2xl font-bold text-red-900">{reportData.membership.churnRate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(reportData.membership.demographics.ageGroups).map(([ageGroup, percentage]) => (
                    <div key={ageGroup} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{ageGroup} years</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(reportData.membership.demographics.gender).map(([gender, percentage]) => (
                    <div key={gender} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{gender}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Preview</h3>
            <p className="text-gray-500">Select a report type to view detailed analytics</p>
          </div>
        );
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
              <div className="text-gray-900 font-semibold">Detailed Reports</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Detailed Reports</h1>
                <p className="text-gray-600">Generate comprehensive analytics and export data</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExportReport('PDF')}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExportReport('CSV')}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
                <select
                  value={filters.memberType}
                  onChange={(e) => setFilters(prev => ({ ...prev, memberType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Members</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Types */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedReport === type.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {reportTypes.find(t => t.id === selectedReport)?.name} Report
              </h2>
              <div className="text-sm text-gray-500">
                {dateRange.startDate} to {dateRange.endDate}
              </div>
            </div>
            {renderReportContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
