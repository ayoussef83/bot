'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { instructorsService, Instructor } from '@/lib/services';
import api from '@/lib/api';
import { FiClock, FiCalendar, FiUser, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';

interface Session {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  class?: {
    id: string;
    name: string;
    location: string;
  };
  instructor?: {
    id: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchInstructors();
    fetchSessions();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await instructorsService.getAll();
      const instructorsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
      setInstructors(instructorsData);
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
      setError(err.response?.data?.message || 'Failed to load people');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions', {
        params: {
          status: 'scheduled',
        },
      });
      setSessions(response.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions by selected instructor
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    if (selectedInstructor) {
      filtered = filtered.filter((session) => session.instructor?.id === selectedInstructor);
    }

    // Filter by current date range (week or month)
    const startOfPeriod = new Date(currentDate);
    const endOfPeriod = new Date(currentDate);

    if (viewMode === 'week') {
      const day = startOfPeriod.getDay();
      startOfPeriod.setDate(startOfPeriod.getDate() - day);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod.setDate(startOfPeriod.getDate() + 6);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else {
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
      endOfPeriod.setDate(0);
      endOfPeriod.setHours(23, 59, 59, 999);
    }

    return filtered.filter((session) => {
      const sessionDate = new Date(session.scheduledDate);
      return sessionDate >= startOfPeriod && sessionDate <= endOfPeriod;
    });
  }, [sessions, selectedInstructor, currentDate, viewMode]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: { [key: string]: Session[] } = {};
    filteredSessions.forEach((session) => {
      const dateKey = new Date(session.scheduledDate).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  }, [filteredSessions]);

  // Get week days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get month days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const current = new Date(startDate);
    while (current <= lastDay || days.length < 35) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length >= 42) break;
    }
    return days;
  };

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return sessionsByDate[dateKey] || [];
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in current month (for month view)
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading availability...</div>
      </div>
    );
  }

  const weekDays = viewMode === 'week' ? getWeekDays() : [];
  const monthDays = viewMode === 'month' ? getMonthDays() : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiClock className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
            <p className="text-sm text-gray-500 mt-1">View team schedules and availability</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Instructor Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Instructors</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.user?.firstName} {instructor.user?.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[150px] text-center">
              {viewMode === 'week'
                ? `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateDate('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {viewMode === 'week' ? (
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {weekDays.map((day, index) => {
              const daySessions = getSessionsForDate(day);
              return (
                <div key={index} className="min-h-[400px]">
                  <div
                    className={`p-3 text-center border-b border-gray-200 ${
                      isToday(day) ? 'bg-indigo-50 font-semibold' : 'bg-gray-50'
                    }`}
                  >
                    <div className="text-xs text-gray-500 uppercase">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-lg mt-1 ${
                        isToday(day) ? 'text-indigo-600' : 'text-gray-900'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="p-2 space-y-2">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-blue-50 border border-blue-200 rounded p-2 text-xs cursor-pointer hover:bg-blue-100"
                        onClick={() => router.push(`/dashboard/sessions/details?id=${session.id}`)}
                      >
                        <div className="font-medium text-blue-900">
                          {new Date(session.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-blue-700 truncate">
                          {session.class?.name || 'Unnamed Class'}
                        </div>
                        {session.instructor && (
                          <div className="text-blue-600 text-[10px] mt-1">
                            <FiUser className="w-3 h-3 inline mr-1" />
                            {session.instructor.user?.firstName} {session.instructor.user?.lastName}
                          </div>
                        )}
                      </div>
                    ))}
                    {daySessions.length === 0 && (
                      <div className="text-center text-gray-400 text-xs py-4">No sessions</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Month Header */}
            <div className="grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>
            {/* Month Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
              {monthDays.map((day, index) => {
                const daySessions = getSessionsForDate(day);
                const isCurrent = isCurrentMonth(day);
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] ${!isCurrent ? 'bg-gray-50' : ''}`}
                  >
                    <div
                      className={`p-2 text-sm ${
                        isToday(day)
                          ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                          : isCurrent
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="px-1 pb-1 space-y-1">
                      {daySessions.slice(0, 2).map((session) => (
                        <div
                          key={session.id}
                          className="bg-blue-50 border border-blue-200 rounded px-1 py-0.5 text-[10px] cursor-pointer hover:bg-blue-100 truncate"
                          onClick={() => router.push(`/dashboard/sessions/details?id=${session.id}`)}
                          title={session.class?.name}
                        >
                          {new Date(session.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          {session.class?.name}
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <div className="text-[10px] text-gray-500 px-1">
                          +{daySessions.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredSessions.length}</p>
            </div>
            <FiCalendar className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Instructors Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Set(filteredSessions.map((s) => s.instructor?.id).filter(Boolean)).size}
              </p>
            </div>
            <FiUser className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Classes Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Set(filteredSessions.map((s) => s.class?.id).filter(Boolean)).size}
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
