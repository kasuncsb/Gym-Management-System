'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function AdminPlans() {
  const [plans, setPlans] = useState([
    {
      id: 'PLAN001',
      name: 'Basic Monthly',
      description: 'Access to gym equipment and basic facilities',
      price: 3000,
      duration: 30,
      accessHours: '06:00-22:00',
      facilities: { gym: true, pool: false, classes: false, personalTraining: false },
      status: 'active',
      memberCount: 456,
      createdAt: '2024-01-01'
    },
    {
      id: 'PLAN002',
      name: 'Premium Monthly',
      description: 'Full access to all facilities including pool and group classes',
      price: 5000,
      duration: 30,
      accessHours: '05:00-23:00',
      facilities: { gym: true, pool: true, classes: true, personalTraining: false },
      status: 'active',
      memberCount: 389,
      createdAt: '2024-01-01'
    },
    {
      id: 'PLAN003',
      name: 'Elite Monthly',
      description: 'Premium access with personal training sessions included',
      price: 8000,
      duration: 30,
      accessHours: '24/7',
      facilities: { gym: true, pool: true, classes: true, personalTraining: true },
      status: 'active',
      memberCount: 244,
      createdAt: '2024-01-01'
    },
    {
      id: 'PLAN004',
      name: 'Annual Basic',
      description: 'Basic plan with annual discount',
      price: 30000,
      duration: 365,
      accessHours: '06:00-22:00',
      facilities: { gym: true, pool: false, classes: false, personalTraining: false },
      status: 'active',
      memberCount: 123,
      createdAt: '2024-01-01'
    },
    {
      id: 'PLAN005',
      name: 'Student Plan',
      description: 'Discounted plan for students with valid ID',
      price: 2000,
      duration: 30,
      accessHours: '06:00-22:00',
      facilities: { gym: true, pool: false, classes: true, personalTraining: false },
      status: 'inactive',
      memberCount: 0,
      createdAt: '2024-01-15'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<typeof plans[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPlans = plans.filter(plan => 
    (plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     plan.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || plan.status === statusFilter)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20';
      case 'inactive':
        return 'text-gray-400 bg-gray-500/20';
      case 'archived':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility) {
      case 'gym':
        return 'GYM';
      case 'pool':
        return 'POOL';
      case 'classes':
        return 'CLASS';
      case 'personalTraining':
        return 'PERSONAL';
      default:
        return 'OTHER';
    }
  };

  const handleStatusToggle = (planId: string) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? { ...plan, status: plan.status === 'active' ? 'inactive' : 'active' }
        : plan
    ));
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      setPlans(prev => prev.filter(plan => plan.id !== planId));
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
              <div className="text-gray-900 font-semibold">Subscription Plans</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Plans</h1>
                <p className="text-gray-600">Manage pricing plans and member subscriptions</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Create New Plan
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Export Plans
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Price:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {plan.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Duration:</span>
                    <span className="text-sm text-gray-900">{plan.duration} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Access Hours:</span>
                    <span className="text-sm text-gray-900">{plan.accessHours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Members:</span>
                    <span className="text-sm text-gray-900">{plan.memberCount}</span>
                  </div>
                </div>

                {/* Facilities */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Facilities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(plan.facilities).map(([facility, included]) => (
                      <span
                        key={facility}
                        className={`px-2 py-1 rounded-full text-xs ${
                          included 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {getFacilityIcon(facility)} - {facility.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleStatusToggle(plan.id)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      plan.status === 'active'
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {plan.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit Plan Modal */}
          {(isCreating || editingPlan) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isCreating ? 'Create New Plan' : 'Edit Plan'}
                  </h2>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingPlan(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                      <input
                        type="text"
                        defaultValue={editingPlan?.name || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plan ID</label>
                      <input
                        type="text"
                        defaultValue={editingPlan?.id || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      defaultValue={editingPlan?.description || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (Rs.)</label>
                      <input
                        type="number"
                        defaultValue={editingPlan?.price || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                      <input
                        type="number"
                        defaultValue={editingPlan?.duration || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access Hours</label>
                      <input
                        type="text"
                        defaultValue={editingPlan?.accessHours || ''}
                        placeholder="06:00-22:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(editingPlan?.facilities || { gym: false, pool: false, classes: false, personalTraining: false }).map(([facility, included]) => (
                        <div key={facility} className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked={included}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700 capitalize">
                            {facility.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingPlan(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      {isCreating ? 'Create Plan' : 'Update Plan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
