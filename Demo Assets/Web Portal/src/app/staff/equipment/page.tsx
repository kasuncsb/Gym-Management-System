'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function StaffEquipment() {
  const [filter, setFilter] = useState({
    status: 'all',
    category: 'all',
    location: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<typeof equipment[0] | null>(null);

  const [equipment] = useState([
    {
      id: 'EQ001',
      name: 'Treadmill #1',
      category: 'Cardio',
      location: 'Cardio Zone',
      status: 'operational',
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-02-10',
      usageHours: 156,
      issues: []
    },
    {
      id: 'EQ002',
      name: 'Treadmill #2',
      category: 'Cardio',
      location: 'Cardio Zone',
      status: 'maintenance',
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-01-20',
      usageHours: 203,
      issues: ['Belt needs replacement', 'Display flickering']
    },
    {
      id: 'EQ003',
      name: 'Elliptical #1',
      category: 'Cardio',
      location: 'Cardio Zone',
      status: 'operational',
      lastMaintenance: '2024-01-12',
      nextMaintenance: '2024-02-12',
      usageHours: 89,
      issues: []
    },
    {
      id: 'EQ004',
      name: 'Weight Bench #1',
      category: 'Strength',
      location: 'Weight Room',
      status: 'operational',
      lastMaintenance: '2024-01-08',
      nextMaintenance: '2024-02-08',
      usageHours: 234,
      issues: []
    },
    {
      id: 'EQ005',
      name: 'Rowing Machine',
      category: 'Cardio',
      location: 'Cardio Zone',
      status: 'out_of_order',
      lastMaintenance: '2024-01-14',
      nextMaintenance: '2024-01-18',
      usageHours: 67,
      issues: ['Motor failure', 'Seat adjustment broken']
    },
    {
      id: 'EQ006',
      name: 'Dumbbell Set (20kg)',
      category: 'Strength',
      location: 'Weight Room',
      status: 'operational',
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-02-05',
      usageHours: 312,
      issues: []
    },
    {
      id: 'EQ007',
      name: 'Stationary Bike #1',
      category: 'Cardio',
      location: 'Cardio Zone',
      status: 'operational',
      lastMaintenance: '2024-01-11',
      nextMaintenance: '2024-02-11',
      usageHours: 145,
      issues: []
    },
    {
      id: 'EQ008',
      name: 'Cable Machine',
      category: 'Strength',
      location: 'Weight Room',
      status: 'maintenance',
      lastMaintenance: '2024-01-16',
      nextMaintenance: '2024-01-22',
      usageHours: 178,
      issues: ['Cable tension adjustment needed']
    }
  ]);

  const filteredEquipment = equipment.filter(item => {
    const matchesStatus = filter.status === 'all' || item.status === filter.status;
    const matchesCategory = filter.category === 'all' || item.category === filter.category;
    const matchesLocation = filter.location === 'all' || item.location === filter.location;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesLocation && matchesSearch;
  });

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cardio':
        return '🏃';
      case 'Strength':
        return '🏋️';
      case 'Flexibility':
        return '🧘';
      default:
        return '❓';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return '✅';
      case 'maintenance':
        return '⚠️';
      case 'out_of_order':
        return '❌';
      default:
        return '❓';
    }
  };

  const handleStatusUpdate = (equipmentId: string, newStatus: string) => {
    // Update equipment status logic here
    console.log(`Updating ${equipmentId} to ${newStatus}`);
  };

  const handleMaintenanceSchedule = (equipmentId: string) => {
    // Schedule maintenance logic here
    console.log(`Scheduling maintenance for ${equipmentId}`);
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
              <div className="text-gray-900 font-semibold">Equipment Monitoring</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Monitoring</h1>
                <p className="text-gray-600">Monitor equipment status and schedule maintenance</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Report Issue
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Schedule Maintenance
                </button>
              </div>
            </div>
          </div>

          {/* Equipment Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Operational</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {equipment.filter(e => e.status === 'operational').length}
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
                  <p className="text-sm text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {equipment.filter(e => e.status === 'maintenance').length}
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
                  <p className="text-sm text-gray-600">Out of Order</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {equipment.filter(e => e.status === 'out_of_order').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Equipment</p>
                  <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out_of_order">Out of Order</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Strength">Strength</option>
                  <option value="Flexibility">Flexibility</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={filter.location}
                  onChange={(e) => setFilter(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Locations</option>
                  <option value="Cardio Zone">Cardio Zone</option>
                  <option value="Weight Room">Weight Room</option>
                  <option value="Yoga Studio">Yoga Studio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Equipment List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)} {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm text-gray-900">{item.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm text-gray-900">{item.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Usage Hours:</span>
                    <span className="text-sm text-gray-900">{item.usageHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Maintenance:</span>
                    <span className="text-sm text-gray-900">{item.lastMaintenance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Next Maintenance:</span>
                    <span className="text-sm text-gray-900">{item.nextMaintenance}</span>
                  </div>
                </div>

                {item.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Current Issues:</h4>
                    <div className="space-y-1">
                      {item.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          • {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedEquipment(item)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(item.id, 'maintenance')}
                    className="px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredEquipment.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results</p>
            </div>
          )}

          {/* Equipment Details Modal */}
          {selectedEquipment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Equipment Details</h2>
                  <button
                    onClick={() => setSelectedEquipment(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{getCategoryIcon(selectedEquipment.category)}</span>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{selectedEquipment.name}</h3>
                      <p className="text-gray-600">{selectedEquipment.id}</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedEquipment.status)}`}>
                        {getStatusIcon(selectedEquipment.status)} {selectedEquipment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Basic Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Category:</span>
                          <span className="text-sm text-gray-900">{selectedEquipment.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Location:</span>
                          <span className="text-sm text-gray-900">{selectedEquipment.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Usage Hours:</span>
                          <span className="text-sm text-gray-900">{selectedEquipment.usageHours}h</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Maintenance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Service:</span>
                          <span className="text-sm text-gray-900">{selectedEquipment.lastMaintenance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Next Service:</span>
                          <span className="text-sm text-gray-900">{selectedEquipment.nextMaintenance}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedEquipment.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Current Issues</h4>
                      <div className="space-y-2">
                        {selectedEquipment.issues.map((issue, index) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            • {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleMaintenanceSchedule(selectedEquipment.id)}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Schedule Maintenance
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedEquipment.id, 'operational')}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Mark as Fixed
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
