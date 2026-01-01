'use client';

import { useMemo, useState } from 'react';
import { marketingService, type ChannelAccount } from '@/lib/services';
import { FiX, FiChevronRight, FiCheck, FiAlertTriangle, FiExternalLink } from 'react-icons/fi';

type WizardPlatform =
  | 'facebook_page'
  | 'instagram_business'
  | 'whatsapp_business'
  | 'linkedin'; // UI-only for now

type WizardIntegrationId =
  | 'whatsapp'
  | 'facebook'
  | 'facebook_messenger'
  | 'instagram'
  | 'instagram_dm'
  | 'linkedin';

export type ConnectChannelWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  integrationId: WizardIntegrationId | null;
  existingAccount?: ChannelAccount | null;
};

type Step = 1 | 2 | 3;

function looksLikeAppSecret(v: string) {
  const t = v.trim();
  return /^[a-f0-9]{32}$/i.test(t);
}

function looksLikeMetaAccessToken(platform: WizardPlatform, v: string) {
  const t = v.trim();
  if (t.length < 40) return false;
  if (looksLikeAppSecret(t)) return false;
  if (platform === 'instagram_business') return /^IG/i.test(t);
  if (platform === 'facebook_page' || platform === 'whatsapp_business') return /^EA/i.test(t);
  return true;
}

function platformForIntegration(id: WizardIntegrationId): WizardPlatform {
  switch (id) {
    case 'whatsapp':
      return 'whatsapp_business';
    case 'facebook':
    case 'facebook_messenger':
      return 'facebook_page';
    case 'instagram':
    case 'instagram_dm':
      return 'instagram_business';
    case 'linkedin':
      return 'linkedin';
  }
}

function titleForIntegration(id: WizardIntegrationId): string {
  switch (id) {
    case 'whatsapp':
      return 'WhatsApp Business';
    case 'facebook':
      return 'Facebook Page';
    case 'facebook_messenger':
      return 'Facebook Messenger (uses your Facebook Page connection)';
    case 'instagram':
      return 'Instagram Business';
    case 'instagram_dm':
      return 'Instagram DM (uses your Instagram Business connection)';
    case 'linkedin':
      return 'LinkedIn';
  }
}

function requirementsForPlatform(platform: WizardPlatform): Array<{ title: string; details: string[] }> {
  switch (platform) {
    case 'whatsapp_business':
      return [
        {
          title: 'Prerequisites',
          details: [
            'You need access to WhatsApp Business API (Meta).',
            'Have a permanent access token (or a long-lived token you can rotate).',
            'Know your WhatsApp Phone Number ID (recommended as External ID).',
          ],
        },
      ];
    case 'facebook_page':
      return [
        {
          title: 'Prerequisites',
          details: [
            'You need a Meta App with permissions for your Page.',
            'Have a Page Access Token with the needed scopes.',
            'Know your Facebook Page ID (recommended as External ID).',
          ],
        },
        {
          title: 'Note',
          details: ['Facebook Messenger is enabled through the same Page connection.'],
        },
      ];
    case 'instagram_business':
      return [
        {
          title: 'Prerequisites',
          details: [
            'Instagram must be a Business/Creator account connected to a Facebook Page.',
            'Have a long-lived access token with required permissions.',
            'Know your Instagram Business Account ID (recommended as External ID).',
          ],
        },
        {
          title: 'Note',
          details: ['Instagram DM is enabled through the same Instagram Business connection.'],
        },
      ];
    case 'linkedin':
      return [
        {
          title: 'Not available yet',
          details: [
            'LinkedIn is not supported in the current backend schema.',
            'We can add it once we extend the MarketingPlatform enum and ChannelAccount model.',
          ],
        },
      ];
  }
}

export default function ConnectChannelWizard({
  isOpen,
  onClose,
  onSuccess,
  integrationId,
  existingAccount,
}: ConnectChannelWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const platform = useMemo(() => (integrationId ? platformForIntegration(integrationId) : null), [integrationId]);

  const [form, setForm] = useState({
    name: existingAccount?.name || '',
    externalId: existingAccount?.externalId || '',
    accessToken: '',
    refreshToken: '',
  });

  const reset = () => {
    setStep(1);
    setSubmitting(false);
    setError('');
    setForm({
      name: existingAccount?.name || '',
      externalId: existingAccount?.externalId || '',
      accessToken: '',
      refreshToken: '',
    });
  };

  const close = () => {
    reset();
    onClose();
  };

  const canProceedStep1 = Boolean(platform);
  const canProceedStep2 =
    platform !== 'linkedin' &&
    form.name.trim().length > 1 &&
    form.externalId.trim().length > 2 &&
    looksLikeMetaAccessToken(platform, form.accessToken);

  const startMetaOAuth = async () => {
    setError('');
    try {
      const redirectUri = `${window.location.origin}/dashboard/settings/integrations/meta-callback`;
      const res = await marketingService.getMetaOAuthUrl(redirectUri);
      const url = res?.data?.url;
      if (!url) throw new Error('No OAuth URL returned');
      window.location.href = url;
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Failed to start Meta connection');
    }
  };

  const handleSave = async () => {
    if (!integrationId || !platform || platform === 'linkedin') return;
    setSubmitting(true);
    setError('');
    try {
      if (looksLikeAppSecret(form.accessToken)) {
        setError('That looks like a Meta App Secret, not an Access Token. Please paste an Access Token.');
        return;
      }
      const payload = {
        platform,
        name: form.name.trim(),
        externalId: form.externalId.trim(),
        accessToken: form.accessToken.trim(),
        refreshToken: form.refreshToken.trim() ? form.refreshToken.trim() : undefined,
      };

      if (existingAccount?.id) {
        await marketingService.updateChannelAccount(existingAccount.id, payload as any);
      } else {
        await marketingService.createChannelAccount(payload as any);
      }

      setStep(3);
      onSuccess();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Failed to connect channel');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !integrationId || !platform) return null;

  const requirements = requirementsForPlatform(platform);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/30" onClick={close} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connect {titleForIntegration(integrationId)}</h2>
              <p className="text-sm text-gray-500 mt-1">Step {step} of 3</p>
            </div>
            <button onClick={close} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-6 space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                {requirements.map((section) => (
                  <div key={section.title} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {section.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="text-sm text-gray-600">
                  Need help? Open{' '}
                  <a
                    className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    href="/dashboard/marketing/channels"
                  >
                    Marketing → Channels <FiExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {step === 2 && platform !== 'linkedin' && (
              <div className="space-y-4">
                {platform === 'facebook_page' && (
                  <div className="border border-indigo-200 bg-indigo-50 rounded p-3">
                    <div className="text-sm font-semibold text-indigo-900">Recommended</div>
                    <div className="text-sm text-indigo-800 mt-1">
                      Connect via Meta OAuth to enable Facebook Messenger automatically (no manual tokens).
                    </div>
                    <button
                      type="button"
                      onClick={startMetaOAuth}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Connect with Facebook
                    </button>
                    <div className="text-xs text-indigo-700 mt-2">
                      You’ll be redirected to Facebook, then back to MV-OS.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="e.g. Main Facebook Page"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      External ID
                      <span className="ml-2 text-xs text-gray-500">
                        ({platform === 'whatsapp_business' ? 'Phone Number ID' : platform === 'facebook_page' ? 'Page ID' : 'IG Business ID'})
                      </span>
                    </label>
                    <input
                      value={form.externalId}
                      onChange={(e) => setForm((p) => ({ ...p, externalId: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="ID"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Token</label>
                  <textarea
                    value={form.accessToken}
                    onChange={(e) => setForm((p) => ({ ...p, accessToken: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                    rows={4}
                    placeholder="Paste token here"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Refresh Token (optional)</label>
                  <input
                    value={form.refreshToken}
                    onChange={(e) => setForm((p) => ({ ...p, refreshToken: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                    placeholder="If applicable"
                  />
                </div>

                <div className="flex items-start gap-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
                  <FiAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    Tokens are stored on the server. Use restricted scopes and rotate tokens if needed.
                  </div>
                </div>
              </div>
            )}

            {step === 2 && platform === 'linkedin' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900">LinkedIn is coming soon</h3>
                <p className="text-sm text-gray-600 mt-2">
                  The backend currently supports only WhatsApp, Facebook, and Instagram. If you want LinkedIn next, we’ll add:
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li>Extend `MarketingPlatform` enum</li>
                  <li>Add OAuth fields/flow for LinkedIn</li>
                  <li>Add webhook ingestion for messages</li>
                </ul>
              </div>
            )}

            {step === 3 && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded p-4">
                <FiCheck className="w-6 h-6 text-green-700" />
                <div>
                  <div className="text-sm font-semibold text-green-900">Connected successfully</div>
                  <div className="text-sm text-green-800">
                    You can now manage this channel in Marketing → Channels.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => (step === 1 ? close() : setStep((s) => (s === 2 ? 1 : 2) as Step))}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              disabled={submitting}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Continue <FiChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && platform !== 'linkedin' && (
                <button
                  onClick={handleSave}
                  disabled={!canProceedStep2 || submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Connecting…' : existingAccount?.id ? 'Update Connection' : 'Connect'}
                </button>
              )}

              {step === 2 && platform === 'linkedin' && (
                <button
                  onClick={close}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={close}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


