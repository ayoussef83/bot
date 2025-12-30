'use client';

import { useEffect, useState } from 'react';
import { settingsService } from '@/lib/services';
import SettingsCard from '@/components/settings/SettingsCard';
import { FiClock } from 'react-icons/fi';

export default function SchedulingPage() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [smsTest, setSmsTest] = useState({ mobile: '', message: '' });
  const [smsResult, setSmsResult] = useState<any>(null);
  const [smsError, setSmsError] = useState<any>(null);
  const [sendingSms, setSendingSms] = useState(false);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!scheduledTime) return null;
    const scheduled = new Date(scheduledTime);
    const now = currentTime;
    const diff = scheduled.getTime() - now.getTime();
    if (diff <= 0) return { expired: true, text: 'Time has passed' };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      expired: false,
      hours,
      minutes,
      seconds,
      text: `${hours}h ${minutes}m ${seconds}s`,
    };
  };

  const timeRemaining = getTimeRemaining();

  const scheduleSms = async () => {
    if (!scheduledTime) {
      setSmsError('Please select a scheduled time first');
      return;
    }
    if (!smsTest.mobile || !smsTest.message) {
      setSmsError('Mobile number and message are required');
      return;
    }
    const scheduled = new Date(scheduledTime);
    if (scheduled <= new Date()) {
      setSmsError('Scheduled time must be in the future');
      return;
    }
    setSendingSms(true);
    setSmsResult(null);
    setSmsError(null);
    try {
      const resp = await settingsService.scheduleSms(
        smsTest.mobile,
        smsTest.message,
        scheduled.toISOString(),
      );
      setSmsResult(resp.data);
      // Clear form after successful scheduling
      setSmsTest({ mobile: '', message: '' });
      setScheduledTime('');
    } catch (e: any) {
      const errorData = e?.response?.data || e?.message || 'Unknown error';
      setSmsError(typeof errorData === 'string' ? errorData : JSON.stringify(errorData, null, 2));
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scheduling</h1>
        <p className="text-sm text-gray-500 mt-1">
          Schedule SMS messages and manage automated reminders. All times use Cairo timezone.
        </p>
      </div>

      {/* Time Information */}
      <SettingsCard
        title="Time Information"
        description="Current time and schedule configuration"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Time (Cairo)</label>
            <div className="text-lg font-mono text-gray-900">
              {currentTime.toLocaleString('en-US', {
                timeZone: 'Africa/Cairo',
                dateStyle: 'full',
                timeStyle: 'long',
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule SMS</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm"
              min={new Date().toISOString().slice(0, 16)}
            />
            {timeRemaining && (
              <div className="mt-2 text-sm">
                {timeRemaining.expired ? (
                  <span className="text-red-600">⚠️ {timeRemaining.text}</span>
                ) : (
                  <span className="text-indigo-600">
                    ⏱️ Time remaining: <strong>{timeRemaining.text}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* SMS Scheduling Form */}
      <SettingsCard
        title="Schedule SMS"
        description="Schedule a one-time SMS message to be sent at a specific time"
        footer={
          <div className="flex justify-end">
            <button
              onClick={scheduleSms}
              disabled={sendingSms || !smsTest.mobile || !smsTest.message || !scheduledTime || timeRemaining?.expired}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FiClock className="w-4 h-4" />
              {sendingSms ? 'Scheduling...' : 'Schedule SMS'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={smsTest.mobile}
                onChange={(e) => setSmsTest({ ...smsTest, mobile: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g. 0127..., +20127..., 20127..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={smsTest.message}
                onChange={(e) => setSmsTest({ ...smsTest, message: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="SMS message"
                required
              />
            </div>
          </div>

          {/* Results */}
          {(smsResult || smsError) && (
            <div className="mt-4">
              {smsResult && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="text-xs font-semibold text-green-700 mb-2">Success</div>
                  <pre className="whitespace-pre-wrap text-xs text-green-800">
                    {typeof smsResult === 'string' ? smsResult : JSON.stringify(smsResult, null, 2)}
                  </pre>
                </div>
              )}
              {smsError && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="text-xs font-semibold text-red-700 mb-2">Error</div>
                  <pre className="whitespace-pre-wrap text-xs text-red-800">
                    {typeof smsError === 'string' ? smsError : JSON.stringify(smsError, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </SettingsCard>
    </div>
  );
}

