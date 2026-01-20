'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      gymName: 'PowerWorld Fitness',
      gymAddress: '123 Main Street, Kiribathgoda',
      gymPhone: '+94123456789',
      gymEmail: 'info@powerworld.com',
      timezone: 'Asia/Colombo',
      currency: 'LKR',
      language: 'en'
    },
    access: {
      qrExpiryHours: 24,
      maxFailedAttempts: 3,
      sessionTimeout: 30,
      requireTwoFactor: false,
      allowGuestAccess: false
    },
    billing: {
      autoRenewal: true,
      gracePeriodDays: 7,
      lateFeePercentage: 5,
      paymentMethods: ['credit_card', 'bank_transfer', 'cash'],
      invoicePrefix: 'PW'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      maintenanceAlerts: true,
      systemAlerts: true
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      sessionTimeout: 30,
      enableAuditLog: true,
      ipWhitelist: []
    }
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSettingChange = (category: string, key: string, value: string | number | boolean | string[]) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
    setIsEditing(false);
    // Show success message
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gym Name</label>
          <input
            type="text"
            value={settings.general.gymName}
            onChange={(e) => handleSettingChange('general', 'gymName', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gym Phone</label>
          <input
            type="text"
            value={settings.general.gymPhone}
            onChange={(e) => handleSettingChange('general', 'gymPhone', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Gym Address</label>
        <textarea
          value={settings.general.gymAddress}
          onChange={(e) => handleSettingChange('general', 'gymAddress', e.target.value)}
          disabled={!isEditing}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="Asia/Colombo">Asia/Colombo</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={settings.general.currency}
            onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="LKR">LKR (Sri Lankan Rupee)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={settings.general.language}
            onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="en">English</option>
            <option value="si">Sinhala</option>
            <option value="ta">Tamil</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAccessSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Expiry (Hours)</label>
          <input
            type="number"
            value={settings.access.qrExpiryHours}
            onChange={(e) => handleSettingChange('access', 'qrExpiryHours', parseInt(e.target.value))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Failed Attempts</label>
          <input
            type="number"
            value={settings.access.maxFailedAttempts}
            onChange={(e) => handleSettingChange('access', 'maxFailedAttempts', parseInt(e.target.value))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.access.requireTwoFactor}
            onChange={(e) => handleSettingChange('access', 'requireTwoFactor', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Require Two-Factor Authentication</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.access.allowGuestAccess}
            onChange={(e) => handleSettingChange('access', 'allowGuestAccess', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Allow Guest Access</label>
        </div>
      </div>
    </div>
  );

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (Days)</label>
          <input
            type="number"
            value={settings.billing.gracePeriodDays}
            onChange={(e) => handleSettingChange('billing', 'gracePeriodDays', parseInt(e.target.value))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee Percentage</label>
          <input
            type="number"
            value={settings.billing.lateFeePercentage}
            onChange={(e) => handleSettingChange('billing', 'lateFeePercentage', parseInt(e.target.value))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Prefix</label>
        <input
          type="text"
          value={settings.billing.invoicePrefix}
          onChange={(e) => handleSettingChange('billing', 'invoicePrefix', e.target.value)}
          disabled={!isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.billing.autoRenewal}
            onChange={(e) => handleSettingChange('billing', 'autoRenewal', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Enable Auto-Renewal</label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Accepted Payment Methods</label>
        <div className="space-y-2">
          {['credit_card', 'bank_transfer', 'cash', 'paypal'].map((method) => (
            <div key={method} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.billing.paymentMethods.includes(method)}
                onChange={(e) => {
                  const newMethods = e.target.checked
                    ? [...settings.billing.paymentMethods, method]
                    : settings.billing.paymentMethods.filter(m => m !== method);
                  handleSettingChange('billing', 'paymentMethods', newMethods);
                }}
                disabled={!isEditing}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
              />
              <label className="ml-2 block text-sm text-gray-700 capitalize">{method.replace('_', ' ')}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications.emailNotifications}
            onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Email Notifications</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications.smsNotifications}
            onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">SMS Notifications</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications.pushNotifications}
            onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Push Notifications</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications.maintenanceAlerts}
            onChange={(e) => handleSettingChange('notifications', 'maintenanceAlerts', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Maintenance Alerts</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications.systemAlerts}
            onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">System Alerts</label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
          <input
            type="number"
            value={settings.security.passwordMinLength}
            onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (Minutes)</label>
          <input
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.security.requireSpecialChars}
            onChange={(e) => handleSettingChange('security', 'requireSpecialChars', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Require Special Characters in Passwords</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.security.enableAuditLog}
            onChange={(e) => handleSettingChange('security', 'enableAuditLog', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:bg-gray-100"
          />
          <label className="ml-2 block text-sm text-gray-700">Enable Audit Logging</label>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'access', name: 'Access Control', icon: '🔐' },
    { id: 'billing', name: 'Billing', icon: '💳' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🛡️' }
  ];

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
              <div className="text-gray-900 font-semibold">System Settings</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
                <p className="text-gray-600">Configure system parameters and preferences</p>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Edit Settings
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'access' && renderAccessSettings()}
            {activeTab === 'billing' && renderBillingSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
          </div>
        </div>
      </main>
    </div>
  );
}
