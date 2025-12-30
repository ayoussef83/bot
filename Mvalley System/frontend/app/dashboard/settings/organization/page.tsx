'use client';

import { useEffect, useState } from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiEdit2, FiSave, FiX, FiHome, FiMapPin, FiPhone, FiMail, FiGlobe, FiDollarSign } from 'react-icons/fi';

interface OrganizationData {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  currency: string;
  taxId: string;
}

export default function OrganizationSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<OrganizationData>({
    name: '',
    address: '',
    city: '',
    country: 'Egypt',
    phone: '',
    email: '',
    website: '',
    timezone: 'Africa/Cairo',
    currency: 'EGP',
    taxId: '',
  });

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('organizationSettings');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load organization settings', e);
      }
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // await api.post('/settings/organization', formData);
      
      // For now, save to localStorage
      localStorage.setItem('organizationSettings', JSON.stringify(formData));
      
      setSuccess('Organization settings saved successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save organization settings');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    loadOrganizationData();
    setIsEditing(false);
    setError('');
  };

  const hasChanges = () => {
    const saved = localStorage.getItem('organizationSettings');
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
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure organization information and branding
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

      {/* Organization Information */}
      <SettingsCard
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiHome className="w-5 h-5 text-gray-500" />
              <span>Organization Information</span>
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
        description="Basic organization details and contact information"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="MindValley Egypt"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID / Registration Number
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="123456789"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" />
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Cairo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Egypt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="+20 123 456 7890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="info@mvalley-eg.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiGlobe className="w-4 h-4" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="https://mvalley-eg.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="EGP">EGP - Egyptian Pound</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
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
            <StatusBadge
              status={formData.name ? 'active' : 'warning'}
              label={formData.name ? 'Configured' : 'Not Configured'}
            />
          </div>
          {!formData.name && (
            <p className="text-sm text-gray-500">
              Please configure your organization information to get started.
            </p>
          )}
        </div>
      </SettingsCard>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Save Organization Settings"
        message="Are you sure you want to save these organization settings? This will update your organization information across the system."
        confirmText="Save"
        cancelText="Cancel"
        loading={loading}
      />
    </div>
  );
}
