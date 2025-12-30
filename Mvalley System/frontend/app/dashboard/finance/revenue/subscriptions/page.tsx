'use client';

import { useEffect, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import { FiClock, FiTrendingUp } from 'react-icons/fi';

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FiClock className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage recurring student subscriptions</p>
        </div>
      </div>

      <EmptyState
        icon={<FiTrendingUp className="w-12 h-12 text-gray-400" />}
        title="Subscriptions coming soon"
        message="Recurring subscription management will be available in a future update"
      />
    </div>
  );
}

