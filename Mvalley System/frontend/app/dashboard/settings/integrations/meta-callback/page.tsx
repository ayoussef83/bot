'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { marketingService } from '@/lib/services';

export default function MetaCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  const code = params.get('code') || '';
  const state = params.get('state') || '';

  const redirectUri = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/dashboard/settings/integrations/meta-callback`;
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!code || !state) {
        setError('Missing OAuth code/state');
        return;
      }
      try {
        await marketingService.exchangeMetaOAuth({ code, state, redirectUri });
        router.replace('/dashboard/settings/integrations?connected=facebook_messenger');
      } catch (e: any) {
        const msg = e?.response?.data?.message;
        setError(typeof msg === 'string' ? msg : msg?.message || 'Failed to connect Facebook Messenger');
      }
    };
    run();
  }, [code, state, redirectUri, router]);

  return (
    <div className="p-8 space-y-3">
      <h1 className="text-lg font-semibold text-gray-900">Connecting Meta…</h1>
      <p className="text-sm text-gray-600">
        Please wait while we finalize your Facebook Page/Messenger connection.
      </p>
      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}


