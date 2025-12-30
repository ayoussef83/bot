'use client';

import { useEffect, useState } from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiEdit2, FiSave, FiX, FiShield, FiLock, FiKey, FiCheck, FiAlertTriangle } from 'react-icons/fi';

interface SecuritySettingsData {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableTwoFactor: boolean;
  enableIpWhitelist: boolean;
  allowedIpAddresses: string;
  enableAuditLogging: boolean;
  auditLogRetentionDays: number;
}

export default function SecuritySettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<SecuritySettingsData>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    passwordExpiryDays: 90,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    enableTwoFactor: false,
    enableIpWhitelist: false,
    allowedIpAddresses: '',
    enableAuditLogging: true,
    auditLogRetentionDays: 365,
  });

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('securitySettings');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load security settings', e);
      }
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // await api.post('/settings/security', formData);
      
      // For now, save to localStorage
      localStorage.setItem('securitySettings', JSON.stringify(formData));
      
      setSuccess('Security settings saved successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save security settings');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    loadSecuritySettings();
    setIsEditing(false);
    setError('');
  };

  const hasChanges = () => {
    const saved = localStorage.getItem('securitySettings');
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
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure security policies, authentication, and access controls
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

      {/* Security Status */}
      <SettingsCard
        title="Security Status"
        description="Current security configuration overview"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiShield className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">JWT Authentication</p>
                <p className="text-sm text-green-700">Token-based authentication is enabled</p>
              </div>
            </div>
            <StatusBadge status="active" label="Active" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiLock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">HTTPS Encryption</p>
                <p className="text-sm text-green-700">All connections are encrypted</p>
              </div>
            </div>
            <StatusBadge status="active" label="Active" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiKey className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Role-Based Access Control</p>
                <p className="text-sm text-green-700">User permissions are enforced</p>
              </div>
            </div>
            <StatusBadge status="active" label="Active" />
          </div>
        </div>
      </SettingsCard>

      {/* Password Policies */}
      <SettingsCard
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiLock className="w-5 h-5 text-gray-500" />
              <span>Password Policies</span>
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
        description="Configure password requirements and policies"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Password Length
              </label>
              <input
                type="number"
                value={formData.passwordMinLength}
                onChange={(e) => setFormData({ ...formData, passwordMinLength: parseInt(e.target.value) || 8 })}
                disabled={!isEditing}
                min="6"
                max="32"
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Expiry (days)
              </label>
              <input
                type="number"
                value={formData.passwordExpiryDays}
                onChange={(e) => setFormData({ ...formData, passwordExpiryDays: parseInt(e.target.value) || 90 })}
                disabled={!isEditing}
                min="0"
                max="365"
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">0 = Never expire</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Require Uppercase Letters</p>
                <p className="text-xs text-gray-500 mt-1">Passwords must contain uppercase letters (A-Z)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.passwordRequireUppercase}
                  onChange={(e) => setFormData({ ...formData, passwordRequireUppercase: e.target.checked })}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Require Lowercase Letters</p>
                <p className="text-xs text-gray-500 mt-1">Passwords must contain lowercase letters (a-z)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.passwordRequireLowercase}
                  onChange={(e) => setFormData({ ...formData, passwordRequireLowercase: e.target.checked })}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Require Numbers</p>
                <p className="text-xs text-gray-500 mt-1">Passwords must contain numbers (0-9)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.passwordRequireNumbers}
                  onChange={(e) => setFormData({ ...formData, passwordRequireNumbers: e.target.checked })}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Require Special Characters</p>
                <p className="text-xs text-gray-500 mt-1">Passwords must contain special characters (!@#$%^&*)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.passwordRequireSpecialChars}
                  onChange={(e) => setFormData({ ...formData, passwordRequireSpecialChars: e.target.checked })}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Session & Access Control */}
      <SettingsCard
        title="Session & Access Control"
        description="Configure session timeout and login security"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={formData.maxLoginAttempts}
                onChange={(e) => setFormData({ ...formData, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                disabled={!isEditing}
                min="3"
                max="10"
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.lockoutDuration}
                onChange={(e) => setFormData({ ...formData, lockoutDuration: parseInt(e.target.value) || 15 })}
                disabled={!isEditing}
                min="5"
                max="60"
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500 mt-1">Require 2FA for all users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableTwoFactor}
                onChange={(e) => setFormData({ ...formData, enableTwoFactor: e.target.checked })}
                disabled={!isEditing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">IP Whitelist</p>
              <p className="text-xs text-gray-500 mt-1">Restrict access to specific IP addresses</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableIpWhitelist}
                onChange={(e) => setFormData({ ...formData, enableIpWhitelist: e.target.checked })}
                disabled={!isEditing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
            </label>
          </div>
          {formData.enableIpWhitelist && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed IP Addresses (comma-separated)
              </label>
              <textarea
                value={formData.allowedIpAddresses}
                onChange={(e) => setFormData({ ...formData, allowedIpAddresses: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="192.168.1.1, 10.0.0.1"
              />
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Audit Logging */}
      <SettingsCard
        title="Audit Logging"
        description="Configure system audit and logging settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable Audit Logging</p>
              <p className="text-xs text-gray-500 mt-1">Log all system activities and access attempts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableAuditLogging}
                onChange={(e) => setFormData({ ...formData, enableAuditLogging: e.target.checked })}
                disabled={!isEditing}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
            </label>
          </div>
          {formData.enableAuditLogging && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Log Retention Period (days)
              </label>
              <input
                type="number"
                value={formData.auditLogRetentionDays}
                onChange={(e) => setFormData({ ...formData, auditLogRetentionDays: parseInt(e.target.value) || 365 })}
                disabled={!isEditing}
                min="30"
                max="3650"
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Best Practices */}
      <SettingsCard
        title="Security Best Practices"
        description="Recommended security practices"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Strong Passwords</p>
              <p className="text-sm text-gray-600 mt-1">
                Ensure all users use strong, unique passwords. Consider implementing password complexity requirements.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Regular Updates</p>
              <p className="text-sm text-gray-600 mt-1">
                Keep the system and dependencies up to date with the latest security patches.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Access Control</p>
              <p className="text-sm text-gray-600 mt-1">
                Regularly review user roles and permissions. Remove access for users who no longer need it.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Audit Logging</p>
              <p className="text-sm text-gray-600 mt-1">
                Monitor system logs for suspicious activity. Review access logs regularly.
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Save Security Settings"
        message="Are you sure you want to save these security settings? Changes to security policies will affect all users."
        confirmLabel="Save"
        cancelLabel="Cancel"
        variant="default"
        loading={loading}
      />
    </div>
  );
}
