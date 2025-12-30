'use client';

import SettingsCard from '@/components/settings/SettingsCard';
import { FiSliders, FiInfo, FiAlertTriangle } from 'react-icons/fi';

export default function AdvancedSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advanced Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Advanced configuration options and system maintenance
        </p>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Advanced Settings Warning</p>
            <p className="text-sm text-yellow-800 mt-1">
              These settings are for advanced users only. Incorrect configuration may affect system functionality.
              Please ensure you understand the implications before making changes.
            </p>
          </div>
        </div>
      </div>

      {/* System Maintenance */}
      <SettingsCard
        title="System Maintenance"
        description="System maintenance and diagnostic tools"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Coming Soon</p>
            <p className="text-sm text-blue-700 mt-1">
              Advanced maintenance tools will include database cleanup, cache management, log rotation,
              system diagnostics, and performance tuning options.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* System Configuration */}
      <SettingsCard
        title="System Configuration"
        description="Low-level system configuration"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Coming Soon</p>
            <p className="text-sm text-blue-700 mt-1">
              System configuration options will include API rate limiting, timeout settings, retry policies,
              connection pooling, and other low-level system parameters.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Developer Tools */}
      <SettingsCard
        title="Developer Tools"
        description="Tools for developers and system administrators"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Coming Soon</p>
            <p className="text-sm text-blue-700 mt-1">
              Developer tools will include API testing, webhook configuration, event logging,
              debug mode, and system health monitoring.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

