'use client';

import { useEffect, useState } from 'react';
import { settingsService, IntegrationConfig } from '@/lib/services';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiLink, FiCheck, FiX, FiInfo } from 'react-icons/fi';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<{
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'warning';
    config: IntegrationConfig | null;
    loading: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setError('');
    setLoading(true);
    try {
      const [emailResp, smsResp] = await Promise.all([
        settingsService.getIntegration('zoho_email').catch(() => null),
        settingsService.getIntegration('smsmisr').catch(() => null),
      ]);

      setIntegrations([
        {
          id: 'zoho_email',
          name: 'Zoho Email',
          description: 'SMTP email service for sending notifications',
          status: emailResp?.data?.isActive && emailResp?.data?.hasSecrets ? 'active' : emailResp?.data?.hasSecrets ? 'warning' : 'inactive',
          config: emailResp?.data || null,
          loading: false,
        },
        {
          id: 'smsmisr',
          name: 'SMSMisr',
          description: 'SMS gateway for sending text messages',
          status: smsResp?.data?.isActive && smsResp?.data?.hasSecrets ? 'active' : smsResp?.data?.hasSecrets ? 'warning' : 'inactive',
          config: smsResp?.data || null,
          loading: false,
        },
      ]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'warning':
        return 'Needs Attention';
      case 'inactive':
        return 'Not Configured';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage third-party service integrations and their configurations
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Integrations List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <SettingsCard
              key={integration.id}
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiLink className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-500">{integration.description}</p>
                    </div>
                  </div>
                  <StatusBadge status={integration.status} label={getStatusLabel(integration.status)} />
                </div>
              }
              footer={
                <div className="flex justify-end">
                  <a
                    href={`/dashboard/settings/communications/providers`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
                  >
                    Configure
                  </a>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 text-gray-900">
                      {integration.config?.isActive ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <FiCheck className="w-4 h-4" />
                          Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600">
                          <FiX className="w-4 h-4" />
                          Disabled
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Credentials:</span>
                    <span className="ml-2 text-gray-900">
                      {integration.config?.hasSecrets ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <FiCheck className="w-4 h-4" />
                          Configured
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <FiX className="w-4 h-4" />
                          Not Configured
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {integration.status === 'warning' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This integration is configured but not active. Enable it in the provider settings.
                    </p>
                  </div>
                )}
                {integration.status === 'inactive' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm text-gray-600">
                      This integration is not configured. Click "Configure" to set it up.
                    </p>
                  </div>
                )}
              </div>
            </SettingsCard>
          ))}
        </div>
      )}

      {/* Info Card */}
      <SettingsCard
        title="Integration Management"
        description="About system integrations"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Integration Overview</p>
            <p className="text-sm text-blue-700 mt-1">
              Integrations connect MV-OS with external services. Configure each integration in the Communications → Providers section.
              Each integration requires credentials and must be enabled to function.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}



