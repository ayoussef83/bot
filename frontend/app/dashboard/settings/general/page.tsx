'use client';

import { useEffect, useState } from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiEdit2, FiSave, FiX, FiSettings, FiCalendar, FiClock, FiGlobe, FiFileText } from 'react-icons/fi';

interface GeneralSettingsData {
  systemName: string;
  defaultLanguage: string;
  dateFormat: string;
  timeFormat: string;
  weekStartDay: string;
  sessionTimeout: number;
  itemsPerPage: number;
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
}

export default function GeneralSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<GeneralSettingsData>({
    systemName: 'MV-OS',
    defaultLanguage: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    weekStartDay: 'sunday',
    sessionTimeout: 30,
    itemsPerPage: 25,
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSmsNotifications: true,
  });

  useEffect(() => {
    loadGeneralSettings();
  }, []);

  const loadGeneralSettings = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('generalSettings');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load general settings', e);
      }
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // await api.post('/settings/general', formData);
      
      // For now, save to localStorage
      localStorage.setItem('generalSettings', JSON.stringify(formData));
      
      setSuccess('General settings saved successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save general settings');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    loadGeneralSettings();
    setIsEditing(false);
    setError('');
  };

  const hasChanges = () => {
    const saved = localStorage.getItem('generalSettings');
    if (!saved) return true;
    try {
      const savedData = JSON.parse(saved);
      return JSON.stringify(savedData) !== JSON.stringify(formData);
    } catch {
      return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure general system settings and preferences
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* System Configuration */}
      <SettingsCard
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiSettings className="w-5 h-5 text-gray-500" />
              <span>System Configuration</span>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!hasChanges() || loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave className="w-4 h-4" />
                  Save
                </button>
              </div>
            )}
          </div>
        }
        description="Basic system configuration and display preferences"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.systemName}
                onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="MV-OS"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiGlobe className="w-4 h-4" />
                Default Language
              </label>
              <select
                value={formData.defaultLanguage}
                onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                Date Format
              </label>
              <select
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Time Format
              </label>
              <select
                value={formData.timeFormat}
                onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="24h">24 Hour (14:30)</option>
                <option value="12h">12 Hour (2:30 PM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Day</label>
              <select
                value={formData.weekStartDay}
                onChange={(e) => setFormData({ ...formData, weekStartDay: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={formData.sessionTimeout}
                onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) || 30 })}
                disabled={!isEditing}
                min="5"
                max="480"
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiFileText className="w-4 h-4" />
                Items Per Page
              </label>
              <select
                value={formData.itemsPerPage}
                onChange={(e) => setFormData({ ...formData, itemsPerPage: parseInt(e.target.value) })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Notification Preferences */}
      <SettingsCard
        title="Notification Preferences"
        description="Configure default notification settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable Notifications</p>
              <p className="text-xs text-gray-500 mt-1">Allow system notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableNotifications}
                onChange={(e) => setFormData({ ...formData, enableNotifications: e.target.checked })}
                disabled={!isEditing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs text-gray-500 mt-1">Send notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableEmailNotifications}
                onChange={(e) => setFormData({ ...formData, enableEmailNotifications: e.target.checked })}
                disabled={!isEditing || !formData.enableNotifications}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
              <p className="text-xs text-gray-500 mt-1">Send notifications via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableSmsNotifications}
                onChange={(e) => setFormData({ ...formData, enableSmsNotifications: e.target.checked })}
                disabled={!isEditing || !formData.enableNotifications}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </SettingsCard>

      {/* Status Card */}
      <SettingsCard
        title="Settings Status"
        description="Current configuration status"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Configuration Status</span>
            <StatusBadge status="active" label="Configured" />
          </div>
          <div className="text-sm text-gray-500">
            <p>System Name: <span className="font-medium text-gray-900">{formData.systemName}</span></p>
            <p className="mt-1">Language: <span className="font-medium text-gray-900">{formData.defaultLanguage.toUpperCase()}</span></p>
            <p className="mt-1">Date Format: <span className="font-medium text-gray-900">{formData.dateFormat}</span></p>
          </div>
        </div>
      </SettingsCard>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Save General Settings"
        message="Are you sure you want to save these general settings? This will update system-wide preferences."
        confirmLabel="Save"
        cancelLabel="Cancel"
      />
    </div>
  );
}
