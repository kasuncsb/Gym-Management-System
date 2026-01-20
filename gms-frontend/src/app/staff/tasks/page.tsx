'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function StaffTasks() {
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  const [selectedTask, setSelectedTask] = useState<typeof tasks[0] | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [tasks] = useState([
    {
      id: 1,
      title: 'Clean cardio equipment',
      description: 'Wipe down all treadmills, ellipticals, and stationary bikes',
      category: 'Cleaning',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-15',
      estimatedTime: '30 min',
      location: 'Cardio Zone',
      completedBy: null,
      completedAt: null,
      notes: 'Use disinfectant spray and clean towels'
    },
    {
      id: 2,
      title: 'Restock towels',
      description: 'Refill towel dispensers in all areas',
      category: 'Maintenance',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-15',
      estimatedTime: '15 min',
      location: 'All Areas',
      completedBy: null,
      completedAt: null,
      notes: 'Check all towel stations'
    },
    {
      id: 3,
      title: 'Check equipment maintenance',
      description: 'Inspect all equipment for any issues or needed repairs',
      category: 'Maintenance',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-14',
      estimatedTime: '45 min',
      location: 'All Areas',
      completedBy: 'Nimal Perera',
      completedAt: '2024-01-14 16:30',
      notes: 'All equipment checked, no issues found'
    },
    {
      id: 4,
      title: 'Empty trash bins',
      description: 'Empty all trash bins and replace liners',
      category: 'Cleaning',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-15',
      estimatedTime: '20 min',
      location: 'All Areas',
      completedBy: null,
      completedAt: null,
      notes: 'Check all floors and locker rooms'
    },
    {
      id: 5,
      title: 'Update member check-in log',
      description: 'Review and update the daily member check-in records',
      category: 'Administrative',
      priority: 'low',
      status: 'pending',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-15',
      estimatedTime: '10 min',
      location: 'Reception',
      completedBy: null,
      completedAt: null,
      notes: 'Verify all entries are accurate'
    },
    {
      id: 6,
      title: 'Test emergency equipment',
      description: 'Test all emergency equipment and safety systems',
      category: 'Safety',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-15',
      estimatedTime: '25 min',
      location: 'All Areas',
      completedBy: null,
      completedAt: null,
      notes: 'Check fire extinguishers, first aid kits, and emergency exits'
    },
    {
      id: 7,
      title: 'Organize weight room',
      description: 'Organize and clean the weight room area',
      category: 'Cleaning',
      priority: 'medium',
      status: 'completed',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-14',
      estimatedTime: '35 min',
      location: 'Weight Room',
      completedBy: 'Chathurika Silva',
      completedAt: '2024-01-14 18:00',
      notes: 'All weights organized, floor mopped'
    },
    {
      id: 8,
      title: 'Check pool chemicals',
      description: 'Test and adjust pool chemical levels',
      category: 'Maintenance',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Current Staff',
      dueDate: '2024-01-15',
      estimatedTime: '20 min',
      location: 'Pool Area',
      completedBy: null,
      completedAt: null,
      notes: 'Use test strips to check pH and chlorine levels'
    }
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filter.status === 'all' || task.status === filter.status;
    const matchesPriority = filter.priority === 'all' || task.priority === filter.priority;
    const matchesCategory = filter.category === 'all' || task.category === filter.category;
    
    return matchesStatus && matchesPriority && matchesCategory;
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
      case 'Cleaning':
        return '🧹';
      case 'Maintenance':
        return '🔧';
      case 'Administrative':
        return '📋';
      case 'Safety':
        return '🛡️';
      default:
        return '📝';
    }
  };

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUpdating(false);
    setSelectedTask(null);
    // Show success message
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
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
              <div className="text-gray-900 font-semibold">Daily Tasks</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Tasks</h1>
                <p className="text-gray-600">Manage your daily assignments and responsibilities</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Add Task
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  View Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'pending').length}
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
                    {tasks.filter(t => t.status === 'in_progress').length}
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
                    {tasks.filter(t => t.status === 'completed').length}
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
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Safety">Safety</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">{getCategoryIcon(task.category)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {isOverdue(task.dueDate) && task.status !== 'completed' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold text-red-400 bg-red-500/20">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Due Date:</span>
                          <span className="ml-1">{task.dueDate}</span>
                        </div>
                        <div>
                          <span className="font-medium">Time:</span>
                          <span className="ml-1">{task.estimatedTime}</span>
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>
                          <span className="ml-1">{task.location}</span>
                        </div>
                        <div>
                          <span className="font-medium">Category:</span>
                          <span className="ml-1">{task.category}</span>
                        </div>
                      </div>
                      {task.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span> {task.notes}
                          </p>
                        </div>
                      )}
                      {task.completedBy && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">Completed by:</span> {task.completedBy} on {task.completedAt}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View Details
                    </button>
                    {task.status === 'pending' && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating}
                        className="px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating}
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

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results</p>
            </div>
          )}

          {/* Task Details Modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getCategoryIcon(selectedTask.category)}</span>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{selectedTask.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTask.status)}`}>
                          {selectedTask.status.replace('_', ' ')}
                        </span>
                        {isOverdue(selectedTask.dueDate) && selectedTask.status !== 'completed' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold text-red-400 bg-red-500/20">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-900">{selectedTask.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Task Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="text-gray-900">{selectedTask.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="text-gray-900">{selectedTask.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Time:</span>
                          <span className="text-gray-900">{selectedTask.estimatedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date:</span>
                          <span className="text-gray-900">{selectedTask.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Assignment</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned To:</span>
                          <span className="text-gray-900">{selectedTask.assignedTo}</span>
                        </div>
                        {selectedTask.completedBy && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed By:</span>
                            <span className="text-gray-900">{selectedTask.completedBy}</span>
                          </div>
                        )}
                        {selectedTask.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed At:</span>
                            <span className="text-gray-900">{selectedTask.completedAt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedTask.notes && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedTask.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    {selectedTask.status === 'pending' && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? 'Updating...' : 'Start Task'}
                      </button>
                    )}
                    {selectedTask.status === 'in_progress' && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? 'Updating...' : 'Mark as Completed'}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
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
