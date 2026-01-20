'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function ManagerReports() {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', description: 'Member check-in patterns and gym utilization' },
    { id: 'revenue', name: 'Revenue Report', description: 'Financial performance and subscription analytics' },
    { id: 'membership', name: 'Membership Report', description: 'Member demographics and retention trends' },
    { id: 'staff', name: 'Staff Performance', description: 'Staff productivity and activity metrics' },
    { id: 'equipment', name: 'Equipment Usage', description: 'Equipment utilization and maintenance needs' },
    { id: 'member-satisfaction', name: 'Member Satisfaction', description: 'Feedback and satisfaction survey results' }
  ];

  const [reportData] = useState({
    attendance: {
      totalCheckIns: 2847,
      averageDailyAttendance: 92,
      peakHours: '6:00 PM - 8:00 PM',
      memberRetention: 87.5,
      hourlyBreakdown: [
        { hour: '06:00', count: 15 },
        { hour: '07:00', count: 45 },
        { hour: '08:00', count: 38 },
        { hour: '09:00', count: 25 },
        { hour: '10:00', count: 20 },
        { hour: '11:00', count: 18 },
        { hour: '12:00', count: 22 },
        { hour: '13:00', count: 15 },
        { hour: '14:00', count: 20 },
        { hour: '15:00', count: 25 },
        { hour: '16:00', count: 35 },
        { hour: '17:00', count: 55 },
        { hour: '18:00', count: 78 },
        { hour: '19:00', count: 85 },
        { hour: '20:00', count: 65 },
        { hour: '21:00', count: 40 },
        { hour: '22:00', count: 20 }
      ]
    },
    revenue: {
      totalRevenue: 45680,
      monthlyGrowth: 12.5,
      averageTransaction: 3500,
      subscriptionBreakdown: {
        'Basic Monthly': { revenue: 13680, members: 456, percentage: 30 },
        'Premium Monthly': { revenue: 19450, members: 389, percentage: 42.5 },
        'Elite Monthly': { revenue: 19520, members: 244, percentage: 42.7 },
        'Annual Basic': { revenue: 36900, members: 123, percentage: 80.8 }
      }
    },
    membership: {
      totalMembers: 1247,
      newMembers: 89,
      activeMembers: 1089,
      churnRate: 3.2,
      demographics: {
        ageGroups: { '18-25': 25, '26-35': 40, '36-45': 25, '46+': 10 },
        gender: { male: 60, female: 40 },
        plans: { basic: 36.6, premium: 31.2, elite: 19.6, annual: 9.9 }
      }
    }
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const renderAttendanceReport = () => (
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Attendance Pattern</h3>
        <div className="space-y-2">
          {reportData.attendance.hourlyBreakdown.map((hour, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm text-gray-600">{hour.hour}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(hour.count / 85) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-sm text-gray-900 font-medium">{hour.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRevenueReport = () => (
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
      
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Revenue Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(reportData.revenue.subscriptionBreakdown).map(([plan, data]) => (
            <div key={plan} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{plan}</h4>
                <p className="text-sm text-gray-600">{data.members} members</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">Rs. {data.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{data.percentage}% of total</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMembershipReport = () => (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {Object.entries(reportData.membership.demographics.plans).map(([plan, percentage]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{plan}</span>
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

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'attendance':
        return renderAttendanceReport();
      case 'revenue':
        return renderRevenueReport();
      case 'membership':
        return renderMembershipReport();
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
              <div className="text-gray-900 font-semibold">Reports</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
                <p className="text-gray-600">Generate detailed reports for business insights</p>
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
                  <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    PDF
                  </button>
                  <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {reportTypes.find(t => t.id === selectedReport)?.name}
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
