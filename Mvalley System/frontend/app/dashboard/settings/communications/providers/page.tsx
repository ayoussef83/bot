'use client';

import { useEffect, useState } from 'react';
import { settingsService, IntegrationConfig } from '@/lib/services';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiEdit2, FiCheck, FiX, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: IntegrationConfig | null;
  loading: boolean;
  editMode: boolean;
  formData: any;
  showPassword: boolean;
}

export default function CommunicationsProvidersPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([
    {
      id: 'zoho_email',
      name: 'Zoho Email',
      description: 'SMTP email service for sending notifications',
      icon: <span className="text-2xl">📧</span>,
      config: null,
      loading: false,
      editMode: false,
      formData: {
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        username: '',
        fromEmail: '',
        fromName: 'MV-OS',
        password: '',
        isActive: true,
      },
      showPassword: false,
    },
    {
      id: 'smsmisr',
      name: 'SMSMisr',
      description: 'SMS gateway for sending text messages',
      icon: <span className="text-2xl">💬</span>,
      config: null,
      loading: false,
      editMode: false,
      formData: {
        username: '',
        senderId: '',
        apiUrl: 'https://smsmisr.com/api/SMS/',
        environment: 1,
        language: 1,
        password: '',
        isActive: true,
      },
      showPassword: false,
    },
  ]);

  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    providerId: string;
    action: () => void;
  }>({ isOpen: false, providerId: '', action: () => {} });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setError('');
    try {
      const [emailResp, smsResp] = await Promise.all([
        settingsService.getIntegration('zoho_email'),
        settingsService.getIntegration('smsmisr'),
      ]);

      setProviders((prev) =>
        prev.map((p) => {
          if (p.id === 'zoho_email') {
            const config = emailResp.data;
            return {
              ...p,
              config,
              formData: {
                ...p.formData,
                ...(config.config || {}),
                isActive: !!config.isActive,
                password: '', // Never show password
              },
            };
          }
          if (p.id === 'smsmisr') {
            const config = smsResp.data;
            return {
              ...p,
              config,
              formData: {
                ...p.formData,
                ...(config.config || {}),
                isActive: !!config.isActive,
                password: '', // Never show password
              },
            };
          }
          return p;
        })
      );
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load providers');
    }
  };

  const getProviderStatus = (provider: ProviderConfig) => {
    if (!provider.config) return { status: 'inactive' as const, label: 'Not Configured' };
    if (!provider.config.isActive) return { status: 'inactive' as const, label: 'Inactive' };
    
    // Check if secrets are configured
    const hasSecrets = provider.config?.hasSecrets || false;
    if (!hasSecrets) {
      return { status: 'warning' as const, label: 'Missing Credentials' };
    }
    
    return { status: 'active' as const, label: 'Active' };
  };

  const getProviderWarnings = (provider: ProviderConfig) => {
    const warnings: string[] = [];
    if (!provider.config?.isActive) {
      warnings.push('Provider is inactive');
    }
    if (!provider.config?.hasSecrets) {
      warnings.push('Credentials not configured');
    }
    if (provider.id === 'zoho_email' && !provider.formData.fromEmail) {
      warnings.push('From email address is required');
    }
    if (provider.id === 'smsmisr' && !provider.formData.senderId) {
      warnings.push('Sender ID is required');
    }
    return warnings;
  };

  const enableEdit = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, editMode: true } : p))
    );
  };

  const cancelEdit = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === providerId) {
          // Reset form data from config
          const config = p.config;
          return {
            ...p,
            editMode: false,
            formData: {
              ...p.formData,
              ...(config?.config || {}),
              isActive: config?.isActive ?? false,
              password: '', // Clear password
            },
            showPassword: false,
          };
        }
        return p;
      })
    );
  };

  const saveProvider = async (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;

    // Validate required fields
    if (provider.id === 'zoho_email') {
      if (!provider.formData.username || !provider.formData.fromEmail) {
        setError('Username and From Email are required');
        return;
      }
    }
    if (provider.id === 'smsmisr') {
      if (!provider.formData.username || !provider.formData.senderId) {
        setError('Username and Sender ID are required');
        return;
      }
    }

    setSaving(providerId);
    setError('');

    try {
      const payload: any = {
        provider: providerId,
        isActive: provider.formData.isActive,
        config: {},
        secrets: provider.formData.password ? { password: provider.formData.password } : undefined,
      };

      if (provider.id === 'zoho_email') {
        payload.config = {
          host: provider.formData.host,
          port: Number(provider.formData.port),
          secure: !!provider.formData.secure,
          username: provider.formData.username,
          fromEmail: provider.formData.fromEmail,
          fromName: provider.formData.fromName,
        };
      } else if (provider.id === 'smsmisr') {
        payload.config = {
          username: provider.formData.username,
          senderId: provider.formData.senderId,
          apiUrl: provider.formData.apiUrl,
          environment: Number(provider.formData.environment) || 1,
          language: Number(provider.formData.language) || 1,
        };
      }

      await settingsService.upsertIntegration(payload);
      await fetchProviders();
      
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, editMode: false, showPassword: false } : p))
      );
    } catch (e: any) {
      setError(e.response?.data?.message || `Failed to save ${provider.name}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSave = (providerId: string) => {
    setConfirmModal({
      isOpen: true,
      providerId,
      action: () => saveProvider(providerId),
    });
  };

  const updateFormData = (providerId: string, field: string, value: any) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, formData: { ...p.formData, [field]: value } }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communication Providers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure email and SMS providers for system notifications
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Provider Cards */}
      <div className="space-y-6">
        {providers.map((provider) => {
          const status = getProviderStatus(provider);
          const warnings = getProviderWarnings(provider);
          const isSaving = saving === provider.id;

          return (
            <SettingsCard
              key={provider.id}
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {provider.icon}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-500">{provider.description}</p>
                    </div>
                  </div>
                  <StatusBadge status={status.status} label={status.label} />
                </div>
              }
              description={
                warnings.length > 0 ? (
                  <div className="mt-2 flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                    <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <ul className="list-disc list-inside">
                      {warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : undefined
              }
              footer={
                !provider.editMode ? (
                  <div className="flex justify-end">
                    <button
                      onClick={() => enableEdit(provider.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Edit Configuration
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => cancelEdit(provider.id)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiX className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(provider.id)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <FiCheck className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )
              }
            >
              {provider.editMode ? (
                <div className="space-y-4">
                  {provider.id === 'zoho_email' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Host
                          </label>
                          <input
                            type="text"
                            value={provider.formData.host}
                            onChange={(e) => updateFormData(provider.id, 'host', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm"
                            disabled={isSaving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Port
                          </label>
                          <input
                            type="number"
                            value={provider.formData.port}
                            onChange={(e) => updateFormData(provider.id, 'port', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={provider.formData.username}
                            onChange={(e) => updateFormData(provider.id, 'username', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm"
                            disabled={isSaving}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={provider.formData.fromEmail}
                            onChange={(e) => updateFormData(provider.id, 'fromEmail', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm"
                            disabled={isSaving}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Name
                        </label>
                        <input
                          type="text"
                          value={provider.formData.fromName}
                          onChange={(e) => updateFormData(provider.id, 'fromName', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password {provider.config?.hasSecrets && '(leave blank to keep current)'}
                        </label>
                        <div className="relative">
                          <input
                            type={provider.showPassword ? 'text' : 'password'}
                            value={provider.formData.password}
                            onChange={(e) => updateFormData(provider.id, 'password', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm pr-10"
                            disabled={isSaving}
                            placeholder={provider.config?.hasSecrets ? '••••••••' : 'Enter password'}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setProviders((prev) =>
                                prev.map((p) =>
                                  p.id === provider.id ? { ...p, showPassword: !p.showPassword } : p
                                )
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {provider.showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${provider.id}-active`}
                          checked={provider.formData.isActive}
                          onChange={(e) => updateFormData(provider.id, 'isActive', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={isSaving}
                        />
                        <label htmlFor={`${provider.id}-active`} className="ml-2 text-sm text-gray-700">
                          Enable this provider
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={provider.formData.username}
                            onChange={(e) => updateFormData(provider.id, 'username', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm"
                            disabled={isSaving}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sender ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={provider.formData.senderId}
                            onChange={(e) => updateFormData(provider.id, 'senderId', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm"
                            disabled={isSaving}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password {provider.config?.hasSecrets && '(leave blank to keep current)'}
                        </label>
                        <div className="relative">
                          <input
                            type={provider.showPassword ? 'text' : 'password'}
                            value={provider.formData.password}
                            onChange={(e) => updateFormData(provider.id, 'password', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm pr-10"
                            disabled={isSaving}
                            placeholder={provider.config?.hasSecrets ? '••••••••' : 'Enter password'}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setProviders((prev) =>
                                prev.map((p) =>
                                  p.id === provider.id ? { ...p, showPassword: !p.showPassword } : p
                                )
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {provider.showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${provider.id}-active`}
                          checked={provider.formData.isActive}
                          onChange={(e) => updateFormData(provider.id, 'isActive', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={isSaving}
                        />
                        <label htmlFor={`${provider.id}-active`} className="ml-2 text-sm text-gray-700">
                          Enable this provider
                        </label>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {provider.id === 'zoho_email' && provider.config?.config ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Host:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.host}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Port:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.port}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Username:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.username || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">From Email:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.fromEmail || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">From Name:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.fromName || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Credentials:</span>
                          <span className="ml-2 text-gray-900">
                            {provider.config.hasSecrets ? '✓ Configured' : '✗ Not configured'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : provider.id === 'smsmisr' && provider.config?.config ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Username:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.username || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sender ID:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.senderId || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">API URL:</span>
                          <span className="ml-2 text-gray-900">{provider.config.config.apiUrl || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Credentials:</span>
                          <span className="ml-2 text-gray-900">
                            {provider.config.hasSecrets ? '✓ Configured' : '✗ Not configured'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No configuration found. Click Edit to configure.</p>
                  )}
                </div>
              )}
            </SettingsCard>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, providerId: '', action: () => {} })}
        onConfirm={confirmModal.action}
        title="Save Configuration"
        message="Are you sure you want to save these changes? This will update the provider configuration."
        confirmLabel="Save"
        cancelLabel="Cancel"
      />
    </div>
  );
}

