'use client';

import { useState } from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiSliders, FiAlertTriangle, FiDatabase, FiRefreshCw, FiTrash2, FiDownload, FiInfo, FiCheckCircle } from 'react-icons/fi';

export default function AdvancedSettingsPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAction = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // TODO: Replace with actual API calls
      switch (actionType) {
        case 'clear-cache':
          // await api.post('/settings/advanced/clear-cache');
          setSuccess('Cache cleared successfully');
          break;
        case 'cleanup-db':
          // await api.post('/settings/advanced/cleanup-database');
          setSuccess('Database cleanup completed successfully');
          break;
        case 'export-logs':
          // await api.get('/settings/advanced/export-logs');
          setSuccess('Logs exported successfully');
          break;
        case 'reset-settings':
          // await api.post('/settings/advanced/reset-settings');
          setSuccess('Settings reset to defaults');
          break;
        default:
          break;
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setActionType('');
    }
  };

  const getActionMessage = (type: string) => {
    switch (type) {
      case 'clear-cache':
        return 'Are you sure you want to clear the system cache? This may temporarily slow down the system while cache rebuilds.';
      case 'cleanup-db':
        return 'Are you sure you want to clean up the database? This will remove old records and may take several minutes.';
      case 'export-logs':
        return 'This will export all system logs. The export may be large and take some time.';
      case 'reset-settings':
        return 'Are you sure you want to reset all settings to defaults? This action cannot be undone.';
      default:
        return '';
    }
  };

  const getActionTitle = (type: string) => {
    switch (type) {
      case 'clear-cache':
        return 'Clear System Cache';
      case 'cleanup-db':
        return 'Cleanup Database';
      case 'export-logs':
        return 'Export System Logs';
      case 'reset-settings':
        return 'Reset Settings to Defaults';
      default:
        return 'Confirm Action';
    }
  };

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

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* System Maintenance */}
      <SettingsCard
        title="System Maintenance"
        description="System maintenance and diagnostic tools"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FiRefreshCw className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Clear System Cache</p>
                <p className="text-sm text-gray-500 mt-1">
                  Clear all cached data to free up memory and refresh system cache
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActionType('clear-cache');
                setShowConfirm(true);
              }}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              Clear Cache
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FiDatabase className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Database Cleanup</p>
                <p className="text-sm text-gray-500 mt-1">
                  Remove old records, clean up soft-deleted items, and optimize database
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActionType('cleanup-db');
                setShowConfirm(true);
              }}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              Cleanup Database
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FiDownload className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Export System Logs</p>
                <p className="text-sm text-gray-500 mt-1">
                  Download all system logs for analysis and troubleshooting
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActionType('export-logs');
                setShowConfirm(true);
              }}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              Export Logs
            </button>
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
            <p className="text-sm font-medium text-blue-900">Configuration via Environment Variables</p>
            <p className="text-sm text-blue-700 mt-1">
              System configuration options are managed through environment variables and server configuration.
              Contact your system administrator for changes to API rate limiting, timeout settings, retry policies,
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
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FiSliders className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">API Testing</p>
                <p className="text-sm text-gray-500 mt-1">
                  Test API endpoints and view request/response details
                </p>
              </div>
            </div>
            <StatusBadge status="active" label="Coming Soon" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FiSliders className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Webhook Configuration</p>
                <p className="text-sm text-gray-500 mt-1">
                  Configure webhooks for external integrations
                </p>
              </div>
            </div>
            <StatusBadge status="active" label="Coming Soon" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FiSliders className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Event Logging</p>
                <p className="text-sm text-gray-500 mt-1">
                  View and filter system event logs
                </p>
              </div>
            </div>
            <StatusBadge status="active" label="Coming Soon" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FiSliders className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">System Health Monitoring</p>
                <p className="text-sm text-gray-500 mt-1">
                  Monitor system performance and health metrics
                </p>
              </div>
            </div>
            <StatusBadge status="active" label="Coming Soon" />
          </div>
        </div>
      </SettingsCard>

      {/* Dangerous Actions */}
      <SettingsCard
        title="Dangerous Actions"
        description="Actions that cannot be undone"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <FiTrash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Reset All Settings</p>
                <p className="text-sm text-red-700 mt-1">
                  Reset all system settings to their default values. This action cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActionType('reset-settings');
                setShowConfirm(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Reset Settings
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setActionType('');
        }}
        onConfirm={handleAction}
        title={getActionTitle(actionType)}
        message={getActionMessage(actionType)}
        confirmText="Confirm"
        cancelText="Cancel"
        isDestructive={actionType === 'reset-settings' || actionType === 'cleanup-db'}
        loading={loading}
      />
    </div>
  );
}
