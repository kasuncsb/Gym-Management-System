'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function StaffCheckin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<typeof members[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [members] = useState([
    { id: 'MEM001', name: 'Nimal Perera', email: 'nimal.perera@email.com', phone: '+94711234567', status: 'active', lastVisit: '2024-01-14', subscription: 'Premium Monthly' },
    { id: 'MEM002', name: 'Chathurika Silva', email: 'chathurika.silva@email.com', phone: '+94711234568', status: 'active', lastVisit: '2024-01-15', subscription: 'Basic Monthly' },
    { id: 'MEM003', name: 'Isuru Bandara', email: 'isuru.bandara@email.com', phone: '+94711234569', status: 'active', lastVisit: '2024-01-13', subscription: 'Elite Monthly' },
    { id: 'MEM004', name: 'Thilini Wijesinghe', email: 'thilini.wijesinghe@email.com', phone: '+94711234570', status: 'inactive', lastVisit: '2024-01-10', subscription: 'Annual Basic' },
    { id: 'MEM005', name: 'Saman Jayasinghe', email: 'saman.jayasinghe@email.com', phone: '+94711234571', status: 'active', lastVisit: '2024-01-15', subscription: 'Premium Monthly' }
  ]);

  const [recentCheckIns] = useState([
    { id: 1, member: 'Nimal Perera', memberId: 'MEM001', time: '14:30', type: 'check-in', status: 'completed' },
    { id: 2, member: 'Chathurika Silva', memberId: 'MEM002', time: '14:25', type: 'check-out', status: 'completed' },
    { id: 3, member: 'Isuru Bandara', memberId: 'MEM003', time: '14:20', type: 'check-in', status: 'completed' },
    { id: 4, member: 'Thilini Wijesinghe', memberId: 'MEM004', time: '14:15', type: 'check-in', status: 'completed' },
    { id: 5, member: 'Dinesh Fernando', memberId: 'MEM005', time: '14:10', type: 'check-out', status: 'completed' }
  ]);

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

  const handleMemberSelect = (member: typeof members[0]) => {
    setSelectedMember(member);
  };

  const handleCheckIn = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
    setSelectedMember(null);
    // Show success message
  };

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'check-in':
        return '📥';
      case 'check-out':
        return '📤';
      default:
        return '❓';
    }
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
              <div className="text-gray-900 font-semibold">Member Check-in</div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Check-in/Check-out</h1>
            <p className="text-gray-600">Process member entry and exit from the gym</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Member Search */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Member</h2>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or member ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.id}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">Last visit: {member.lastVisit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredMembers.length === 0 && searchTerm && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                    <p className="text-gray-500">Try a different search term</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Check-ins */}
            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm">{getTypeIcon(checkIn.type)}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{checkIn.member}</h4>
                          <p className="text-xs text-gray-600">{checkIn.memberId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{checkIn.time}</p>
                        <span className="text-green-500 text-xs">{checkIn.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Member Details Modal */}
          {selectedMember && (
            <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 border border-gray-200 shadow-xl">
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

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-xl">
                        {selectedMember.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedMember.name}</h3>
                      <p className="text-sm text-gray-600">{selectedMember.id}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{selectedMember.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm text-gray-900">{selectedMember.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMember.status)}`}>
                        {selectedMember.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subscription:</span>
                      <span className="text-sm text-gray-900">{selectedMember.subscription}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Visit:</span>
                      <span className="text-sm text-gray-900">{selectedMember.lastVisit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCheckIn}
                    disabled={isProcessing || selectedMember.status !== 'active'}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Check In'}
                  </button>
                  <button
                    onClick={handleCheckIn}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Check Out'}
                  </button>
                </div>

                {selectedMember.status !== 'active' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This member&apos;s account is {selectedMember.status}. Please verify their subscription status before allowing access.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
