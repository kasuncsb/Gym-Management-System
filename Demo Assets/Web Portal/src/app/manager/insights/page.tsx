'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function ManagerInsights() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [insights] = useState({
    trends: [
      {
        id: 1,
        title: 'Peak Hours Analysis',
        description: 'Gym is busiest between 6-8 PM on weekdays',
        impact: 'high',
        recommendation: 'Consider adding more staff during peak hours',
        trend: 'increasing',
        value: '+15%',
        icon: '📈'
      },
      {
        id: 2,
        title: 'Revenue Growth',
        description: 'Monthly revenue increased by 12% compared to last month',
        impact: 'positive',
        recommendation: 'Continue current marketing strategies',
        trend: 'increasing',
        value: '+12%',
        icon: '💰'
      },
      {
        id: 3,
        title: 'Member Retention',
        description: 'Retention rate dropped by 3% this month',
        impact: 'medium',
        recommendation: 'Implement member engagement programs',
        trend: 'decreasing',
        value: '-3%',
        icon: '👥'
      },
      {
        id: 4,
        title: 'Equipment Usage',
        description: 'Cardio equipment usage is 15% higher than strength training',
        impact: 'low',
        recommendation: 'Consider expanding cardio section',
        trend: 'stable',
        value: '+15%',
        icon: '🏃'
      },
      {
        id: 5,
        title: 'Staff Productivity',
        description: 'Staff response time improved by 20% this week',
        impact: 'positive',
        recommendation: 'Maintain current training programs',
        trend: 'increasing',
        value: '+20%',
        icon: '⚡'
      },
      {
        id: 6,
        title: 'Member Satisfaction',
        description: 'Satisfaction scores increased to 4.6/5 this month',
        impact: 'positive',
        recommendation: 'Continue focusing on member experience',
        trend: 'increasing',
        value: '4.6/5',
        icon: '⭐'
      }
    ],
    recommendations: [
      {
        id: 1,
        priority: 'high',
        category: 'Operations',
        title: 'Optimize Peak Hour Staffing',
        description: 'Add 2 additional staff members during 6-8 PM to handle increased demand',
        impact: 'High member satisfaction improvement',
        effort: 'Medium',
        timeline: '2 weeks'
      },
      {
        id: 2,
        priority: 'medium',
        category: 'Revenue',
        title: 'Introduce Off-Peak Discounts',
        description: 'Offer 20% discount for members who visit during 10 AM - 2 PM',
        impact: 'Better equipment utilization and revenue diversification',
        effort: 'Low',
        timeline: '1 week'
      },
      {
        id: 3,
        priority: 'high',
        category: 'Retention',
        title: 'Launch Member Engagement Program',
        description: 'Create monthly challenges and rewards to increase member retention',
        impact: 'Expected 5% improvement in retention rate',
        effort: 'High',
        timeline: '1 month'
      },
      {
        id: 4,
        priority: 'low',
        category: 'Equipment',
        title: 'Expand Cardio Section',
        description: 'Add 3 more treadmills and 2 ellipticals to meet demand',
        impact: 'Reduced wait times and improved member experience',
        effort: 'High',
        timeline: '2 months'
      }
    ],
    kpis: {
      memberRetention: 87.5,
      averageRevenue: 45680,
      memberSatisfaction: 4.6,
      equipmentUtilization: 78.3,
      staffProductivity: 92.1,
      peakHourCapacity: 85
    }
  });

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
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
              <div className="text-gray-900 font-semibold">Insights & Analytics</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Insights & Analytics</h1>
                <p className="text-gray-600">AI-powered insights and recommendations for gym optimization</p>
              </div>
              <div className="flex space-x-3">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Refresh Insights
                </button>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Member Retention</h3>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{insights.kpis.memberRetention}%</div>
                <div className="text-sm text-gray-600">+2.1% from last month</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">Rs. {insights.kpis.averageRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">+12.5% from last month</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Member Satisfaction</h3>
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⭐</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{insights.kpis.memberSatisfaction}/5</div>
                <div className="text-sm text-gray-600">+0.2 from last month</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Equipment Utilization</h3>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🏃</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{insights.kpis.equipmentUtilization}%</div>
                <div className="text-sm text-gray-600">+5.2% from last month</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Staff Productivity</h3>
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{insights.kpis.staffProductivity}%</div>
                <div className="text-sm text-gray-600">+8.3% from last month</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Peak Hour Capacity</h3>
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{insights.kpis.peakHourCapacity}%</div>
                <div className="text-sm text-gray-600">+3.1% from last month</div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.trends.map((trend) => (
                <div key={trend.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{trend.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{trend.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getImpactColor(trend.impact)}`}>
                            {trend.impact}
                          </span>
                          <span className="text-sm text-gray-500">{getTrendIcon(trend.trend)} {trend.value}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{trend.description}</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Recommendation:</span> {trend.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Actionable Recommendations</h2>
            <div className="space-y-4">
              {insights.recommendations.map((rec) => (
                <div key={rec.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} priority
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {rec.category}
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Effort: {rec.effort}</div>
                      <div>Timeline: {rec.timeline}</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{rec.title}</h3>
                  <p className="text-gray-600 mb-3">{rec.description}</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Expected Impact:</span> {rec.impact}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                      Dismiss
                    </button>
                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      Implement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900">Generate Custom Report</h3>
                <p className="text-sm text-gray-600">Create detailed analytics</p>
              </button>
              <button className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900">Set Goals</h3>
                <p className="text-sm text-gray-600">Define performance targets</p>
              </button>
              <button className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-semibold text-gray-900">View Trends</h3>
                <p className="text-sm text-gray-600">Analyze historical data</p>
              </button>
              <button className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all">
                <div className="text-2xl mb-2">🔔</div>
                <h3 className="font-semibold text-gray-900">Set Alerts</h3>
                <p className="text-sm text-gray-600">Monitor key metrics</p>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
