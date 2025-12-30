'use client';

import SettingsCard from '@/components/settings/SettingsCard';
import { FiInfo } from 'react-icons/fi';

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure organization information and branding
        </p>
      </div>

      {/* Coming Soon */}
      <SettingsCard
        title="Organization Settings"
        description="Organization details and branding configuration"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Coming Soon</p>
            <p className="text-sm text-blue-700 mt-1">
              Organization settings will include company name, logo, address, contact information, and branding preferences.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

