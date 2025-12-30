'use client';

import SettingsCard from '@/components/settings/SettingsCard';
import { FiInfo } from 'react-icons/fi';

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure general system settings and preferences
        </p>
      </div>

      {/* Coming Soon */}
      <SettingsCard
        title="General Settings"
        description="General system configuration options"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Coming Soon</p>
            <p className="text-sm text-blue-700 mt-1">
              General settings configuration will be available here. This section will include system-wide preferences,
              default values, and core configuration options.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

