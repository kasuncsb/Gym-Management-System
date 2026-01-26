'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats] = useState({
    totalMembers: 1247,
    activeMembers: 1089,
    totalRevenue: 45680,
    monthlyRevenue: 12340,
    systemUptime: '99.9%',
    activeSubscriptions: 1089,
    pendingPayments: 23,
    systemAlerts: 2
  });

  const [recentActivities] = useState([
    { id: 1, action: 'New member registered', user: 'Nimal Perera', time: '2 min ago', type: 'member' },
    { id: 2, action: 'Subscription plan updated', user: 'Admin', time: '15 min ago', type: 'system' },
    { id: 3, action: 'Payment processed', user: 'Chathurika Silva', time: '1 hour ago', type: 'payment' },
    { id: 4, action: 'System backup completed', user: 'System', time: '2 hours ago', type: 'system' },
    { id: 5, action: 'Member check-in', user: 'Isuru Bandara', time: '3 hours ago', type: 'member' }
  ]);

  const [systemAlerts] = useState([
    { id: 1, type: 'warning', message: 'Database backup overdue', priority: 'high' },
    { id: 2, type: 'info', message: 'New software update available', priority: 'medium' }
  ]);

  const [subscriptionPlans] = useState([
    { id: 1, name: 'Basic', price: 29.99, duration: 'monthly', members: 456, status: 'active' },
    { id: 2, name: 'Premium', price: 49.99, duration: 'monthly', members: 389, status: 'active' },
    { id: 3, name: 'Elite', price: 79.99, duration: 'monthly', members: 244, status: 'active' },
    { id: 4, name: 'Annual Basic', price: 299.99, duration: 'yearly', members: 123, status: 'active' }
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

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'info':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
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
                PowerWorld Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">System Administrator</div>
              <div className="text-gray-900 font-semibold">Admin Panel</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
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
              System Administration Dashboard
            </h1>
            <p className="text-gray-600">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>

          {/* System Alerts */}
          {systemAlerts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Alerts</h2>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-current rounded-full"></div>
                        <span className="font-medium">{alert.message}</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-current/20">
                        {alert.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
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
                <div className="text-3xl font-bold text-gray-900">{systemStats.totalMembers.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  <span className="text-green-500">{systemStats.activeMembers}</span> active
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">Rs.{systemStats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  <span className="text-green-500">Rs.{systemStats.monthlyRevenue}</span> this month
                </div>
              </div>
            </div>

            {/* System Uptime */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Uptime</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-500">{systemStats.systemUptime}</div>
                <div className="text-sm text-gray-600">Last 30 days</div>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subscriptions</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{systemStats.activeSubscriptions}</div>
                <div className="text-sm text-gray-600">
                  <span className="text-red-500">{systemStats.pendingPayments}</span> pending payments
                </div>
              </div>
            </div>
          </div>

          {/* Management Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* User Management */}
            <Link
              href="/admin/users"
              className="p-6 rounded-lg border-2 border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">User Management</h3>
              <p className="text-sm opacity-75">Manage members, staff, and roles</p>
            </Link>

            {/* System Settings */}
            <Link
              href="/admin/settings"
              className="p-6 rounded-lg border-2 border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">System Settings</h3>
              <p className="text-sm opacity-75">Configure system parameters</p>
            </Link>

            {/* Subscription Plans */}
            <Link
              href="/admin/plans"
              className="p-6 rounded-lg border-2 border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Subscription Plans</h3>
              <p className="text-sm opacity-75">Manage pricing and plans</p>
            </Link>

            {/* System Reports */}
            <Link
              href="/admin/reports"
              className="p-6 rounded-lg border-2 border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">System Reports</h3>
              <p className="text-sm opacity-75">Generate detailed reports</p>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Recent System Activities</h3>
                  <Link
                    href="/admin/activities"
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'member' ? 'bg-blue-500/20' :
                          activity.type === 'payment' ? 'bg-green-500/20' :
                          'bg-purple-500/20'
                        }`}>
                          <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-semibold">{activity.action}</h4>
                          <p className="text-gray-600 text-sm">by {activity.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subscription Plans Overview */}
            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Subscription Plans</h3>
                <div className="space-y-4">
                  {subscriptionPlans.map((plan) => (
                    <div key={plan.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-gray-900 font-semibold">{plan.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          plan.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="text-gray-900">Rs.{plan.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="text-gray-900">{plan.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Members:</span>
                          <span className="text-gray-900">{plan.members}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
