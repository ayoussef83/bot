'use client';

import { useEffect, useState } from 'react';
import { instructorsService, Instructor } from '@/lib/services';
import { FiClock, FiCalendar } from 'react-icons/fi';

export default function AvailabilityPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await instructorsService.getAll();
      const instructorsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
      setInstructors(instructorsData);
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load people';
      setError(errorMessage);
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading availability...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FiClock className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
          <p className="text-sm text-gray-500 mt-1">View team availability and schedules</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Availability Calendar</h2>
        <p className="text-gray-500 mb-4">
          Team availability calendar view coming soon
        </p>
        <p className="text-sm text-gray-400">
          This will show all people's schedules, time off, and availability in a calendar format
        </p>
      </div>
    </div>
  );
}

