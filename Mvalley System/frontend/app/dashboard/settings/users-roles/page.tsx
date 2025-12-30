'use client';

import { useEffect, useState } from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiUsers, FiShield, FiInfo } from 'react-icons/fi';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersRolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setError('');
    setLoading(true);
    try {
      const resp = await api.get('/users');
      setUsers(resp.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: 'active' | 'inactive' | 'warning' } = {
      super_admin: 'active',
      management: 'active',
      operations: 'active',
      accounting: 'active',
      sales: 'active',
      instructor: 'inactive',
    };
    return colors[role] || 'inactive';
  };

  const activeUsers = users.filter((u) => u.status === 'active');
  const inactiveUsers = users.filter((u) => u.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage system users and their role assignments
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Role Information */}
      <SettingsCard
        title="System Roles"
        description="Available roles and their permissions"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FiShield className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-900">Super Admin</h3>
            </div>
            <p className="text-sm text-indigo-700">
              Full system access. Can manage all settings, users, and configurations.
            </p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Management</h3>
            </div>
            <p className="text-sm text-blue-700">
              Access to management dashboard, finance, and organization settings.
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Operations</h3>
            </div>
            <p className="text-sm text-green-700">
              Access to students, classes, sessions, and communication settings.
            </p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Accounting</h3>
            </div>
            <p className="text-sm text-purple-700">
              Access to finance dashboard and payment management.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Sales</h3>
            </div>
            <p className="text-sm text-yellow-700">
              Access to leads management and sales dashboard.
            </p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Instructor</h3>
            </div>
            <p className="text-sm text-gray-700">
              Access to assigned classes and sessions only.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Active Users */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeUsers.length > 0 && (
            <SettingsCard title={`Active Users (${activeUsers.length})`}>
              <div className="space-y-3">
                {activeUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <StatusBadge
                          status={getRoleBadgeColor(user.role)}
                          label={user.role.replace('_', ' ').toUpperCase()}
                        />
                        <StatusBadge status="active" label="Active" />
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>
          )}

          {/* Inactive Users */}
          {inactiveUsers.length > 0 && (
            <SettingsCard title={`Inactive Users (${inactiveUsers.length})`}>
              <div className="space-y-3">
                {inactiveUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <StatusBadge
                          status={getRoleBadgeColor(user.role)}
                          label={user.role.replace('_', ' ').toUpperCase()}
                        />
                        <StatusBadge status="inactive" label="Inactive" />
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>
          )}

          {users.length === 0 && (
            <SettingsCard title="No Users">
              <p className="text-sm text-gray-500">No users found in the system.</p>
            </SettingsCard>
          )}
        </>
      )}

      {/* Info Card */}
      <SettingsCard
        title="User Management"
        description="Additional user management features"
      >
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Coming Soon</p>
            <p className="text-sm text-blue-700 mt-1">
              User creation, editing, role assignment, and deactivation features will be available here.
              Currently, user management is handled through the backend API.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

