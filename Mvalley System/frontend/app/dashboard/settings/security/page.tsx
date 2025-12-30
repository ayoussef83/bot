'use client';

import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiShield, FiLock, FiKey, FiInfo, FiCheck } from 'react-icons/fi';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure security policies, authentication, and access controls
        </p>
      </div>

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

      {/* Security Policies */}
      <SettingsCard
        title="Security Policies"
        description="Configure security policies and rules"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Coming Soon</p>
            <p className="text-sm text-blue-700 mt-1">
              Security policy configuration will include password requirements, session timeout, IP whitelisting,
              two-factor authentication, and audit logging settings.
            </p>
          </div>
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
    </div>
  );
}

