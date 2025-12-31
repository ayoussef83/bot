'use client';

import { useState } from 'react';
import { marketingService, CreateChannelAccountData } from '@/lib/services';
import { FiX, FiFacebook, FiInstagram, FiMessageCircle, FiAlertCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

interface ConnectChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PlatformOption = {
  value: 'facebook_page' | 'instagram_business' | 'whatsapp_business';
  label: string;
  description: string;
  icon: React.ReactNode;
  oauthUrl?: string;
};

const platformOptions: PlatformOption[] = [
  {
    value: 'facebook_page',
    label: 'Facebook Page',
    description: 'Connect your Facebook Page for posts and page management',
    icon: <FiFacebook className="w-6 h-6 text-blue-600" />,
  },
  {
    value: 'instagram_business',
    label: 'Instagram Business',
    description: 'Connect your Instagram Business account for posts and stories',
    icon: <FiInstagram className="w-6 h-6 text-pink-600" />,
  },
  {
    value: 'whatsapp_business',
    label: 'WhatsApp Business',
    description: 'Connect WhatsApp Business API for messaging',
    icon: <FaWhatsapp className="w-6 h-6 text-green-600" />,
  },
];

export default function ConnectChannelModal({ isOpen, onClose, onSuccess }: ConnectChannelModalProps) {
  const [step, setStep] = useState<'select' | 'manual'>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    externalId: '',
    accessToken: '',
    refreshToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePlatformSelect = (platform: PlatformOption) => {
    setSelectedPlatform(platform);
    setStep('manual');
    setFormData({
      name: '',
      externalId: '',
      accessToken: '',
      refreshToken: '',
    });
    setError('');
  };

  const handleOAuthConnect = (platform: PlatformOption) => {
    // TODO: Implement OAuth flow
    // For now, show manual entry option
    alert(`OAuth flow for ${platform.label} will be implemented. For now, use manual connection.`);
    handlePlatformSelect(platform);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setError('');
    setLoading(true);

    try {
      await marketingService.createChannelAccount({
        platform: selectedPlatform.value,
        name: formData.name,
        externalId: formData.externalId,
        accessToken: formData.accessToken,
        refreshToken: formData.refreshToken || undefined,
        status: 'connected',
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect channel');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedPlatform(null);
    setFormData({
      name: '',
      externalId: '',
      accessToken: '',
      refreshToken: '',
    });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {step === 'select' ? 'Connect Channel' : `Connect ${selectedPlatform?.label}`}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {step === 'select' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Select a platform to connect. You can connect via OAuth (recommended) or manually enter credentials.
                </p>
                <div className="space-y-3">
                  {platformOptions.map((platform) => (
                    <div
                      key={platform.value}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
                      onClick={() => handlePlatformSelect(platform)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">{platform.icon}</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{platform.label}</h4>
                          <p className="text-xs text-gray-500 mt-1">{platform.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., My Facebook Page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedPlatform?.value === 'whatsapp_business' ? 'Phone Number ID' : 'Page/Account ID'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.externalId}
                    onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={
                      selectedPlatform?.value === 'whatsapp_business'
                        ? 'WhatsApp Business Phone Number ID'
                        : 'Facebook Page ID or Instagram Business Account ID'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this in your {selectedPlatform?.label} settings or developer console
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.accessToken}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Paste your access token here"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get this from {selectedPlatform?.label} developer console or OAuth flow
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refresh Token (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.refreshToken}
                    onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Paste refresh token if available"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Tokens are encrypted and stored securely. For production, use OAuth flow
                    instead of manual entry.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Connecting...' : 'Connect Channel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

