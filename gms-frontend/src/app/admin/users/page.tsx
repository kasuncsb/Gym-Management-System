'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const [members] = useState([
    { id: 'MEM001', name: 'John Smith', email: 'john.smith@email.com', phone: '+94123456789', joinDate: '2024-01-15', status: 'active', subscription: 'Premium Monthly' },
    { id: 'MEM002', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+94123456788', joinDate: '2024-01-10', status: 'active', subscription: 'Basic Monthly' },
    { id: 'MEM003', name: 'Mike Chen', email: 'mike.chen@email.com', phone: '+94123456787', joinDate: '2024-01-05', status: 'inactive', subscription: 'Elite Monthly' },
    { id: 'MEM004', name: 'Emma Wilson', email: 'emma.w@email.com', phone: '+94123456786', joinDate: '2024-01-20', status: 'active', subscription: 'Annual Basic' },
    { id: 'MEM005', name: 'David Rodriguez', email: 'david.r@email.com', phone: '+94123456785', joinDate: '2024-01-12', status: 'suspended', subscription: 'Premium Monthly' }
  ]);

  const [staff] = useState([
    { id: 'STF001', name: 'Mike Davis', email: 'mike.d@email.com', phone: '+94123456784', role: 'admin', hireDate: '2023-06-01', status: 'active' },
    { id: 'STF002', name: 'Lisa Thompson', email: 'lisa.t@email.com', phone: '+94123456783', role: 'manager', hireDate: '2023-08-15', status: 'active' },
    { id: 'STF003', name: 'Alex Brown', email: 'alex.b@email.com', phone: '+94123456782', role: 'instructor', hireDate: '2023-09-10', status: 'active' },
    { id: 'STF004', name: 'Maria Garcia', email: 'maria.g@email.com', phone: '+94123456781', role: 'receptionist', hireDate: '2023-10-05', status: 'inactive' }
  ]);

  const [trainers] = useState([
    { id: 'TRN001', name: 'Sarah Johnson', email: 'sarah.trainer@email.com', phone: '+94123456780', specialization: 'Weightlifting', hourlyRate: 2500, status: 'active' },
    { id: 'TRN002', name: 'Tom Wilson', email: 'tom.w@email.com', phone: '+94123456779', specialization: 'Yoga', hourlyRate: 2000, status: 'active' },
    { id: 'TRN003', name: 'Jessica Lee', email: 'jessica.l@email.com', phone: '+94123456778', specialization: 'Cardio', hourlyRate: 2200, status: 'inactive' }
  ]);

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

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = staff.filter(staffMember => 
    (staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedRole === 'all' || staffMember.role === selectedRole)
  );

  const filteredTrainers = trainers.filter(trainer => 
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMembersTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredMembers.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.id}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{member.email}</div>
                <div className="text-sm text-gray-500">{member.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {member.joinDate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {member.subscription}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-red-500 hover:text-red-700 mr-3">Edit</button>
                <button className="text-gray-500 hover:text-gray-700">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStaffTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredStaff.map((staffMember) => (
            <tr key={staffMember.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                  <div className="text-sm text-gray-500">{staffMember.id}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{staffMember.email}</div>
                <div className="text-sm text-gray-500">{staffMember.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(staffMember.role)}`}>
                  {staffMember.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {staffMember.hireDate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(staffMember.status)}`}>
                  {staffMember.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-red-500 hover:text-red-700 mr-3">Edit</button>
                <button className="text-gray-500 hover:text-gray-700">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTrainersTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTrainers.map((trainer) => (
            <tr key={trainer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                  <div className="text-sm text-gray-500">{trainer.id}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{trainer.email}</div>
                <div className="text-sm text-gray-500">{trainer.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {trainer.specialization}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Rs. {trainer.hourlyRate.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trainer.status)}`}>
                  {trainer.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-red-500 hover:text-red-700 mr-3">Edit</button>
                <button className="text-gray-500 hover:text-gray-700">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
              <div className="text-gray-900 font-semibold">User Management</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600">Manage members, staff, and trainers</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Add New User
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'members', name: 'Members', count: members.length },
                  { id: 'staff', name: 'Staff', count: staff.length },
                  { id: 'trainers', name: 'Trainers', count: trainers.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'staff' && (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="instructor">Instructor</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {activeTab === 'members' && renderMembersTable()}
            {activeTab === 'staff' && renderStaffTable()}
            {activeTab === 'trainers' && renderTrainersTable()}
          </div>
        </div>
      </main>
    </div>
  );
}
