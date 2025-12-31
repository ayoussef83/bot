'use client';

import { useEffect, useState } from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import SettingsBreadcrumbs from '@/components/settings/SettingsBreadcrumbs';
import { FiUsers, FiShield, FiLock, FiSettings } from 'react-icons/fi';
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

// Role permission previews (read-only, for future reference)
const rolePermissions: { [key: string]: { access: string[]; restrictions: string[] } } = {
  super_admin: {
    access: ['All modules', 'All settings', 'User management', 'System configuration'],
    restrictions: [],
  },
  management: {
    access: ['Dashboard', 'Finance', 'Organization settings', 'Reports'],
    restrictions: ['No user management', 'No system settings'],
  },
  operations: {
    access: ['Dashboard', 'Students', 'Classes', 'Sessions', 'Communications', 'Scheduling'],
    restrictions: ['No finance access', 'No delete permissions'],
  },
  accounting: {
    access: ['Dashboard', 'Finance', 'Payments', 'Reports'],
    restrictions: ['No user management', 'No system settings'],
  },
  sales: {
    access: ['Dashboard', 'Leads', 'Reports'],
    restrictions: ['No user management', 'No system settings', 'No finance access'],
  },
  instructor: {
    access: ['Assigned classes', 'Sessions', 'Student attendance'],
    restrictions: ['No user management', 'No settings access', 'Read-only for most data'],
  },
};

export default function UsersRolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showManageModal, setShowManageModal] = useState(false);

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
      {/* Breadcrumbs */}
      <SettingsBreadcrumbs />

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
        title={
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-gray-600" />
            <span>System Roles</span>
          </div>
        }
        description="System roles are predefined and cannot be modified."
      >
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(rolePermissions).map(([role, permissions]) => {
            const roleLabels: { [key: string]: { label: string; color: string; bgColor: string; borderColor: string } } = {
              super_admin: {
                label: 'Super Admin',
                color: 'text-indigo-900',
                bgColor: 'bg-indigo-50',
                borderColor: 'border-indigo-200',
              },
              management: {
                label: 'Management',
                color: 'text-blue-900',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
              },
              operations: {
                label: 'Operations',
                color: 'text-green-900',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
              },
              accounting: {
                label: 'Accounting',
                color: 'text-purple-900',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
              },
              sales: {
                label: 'Sales',
                color: 'text-yellow-900',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
              },
              instructor: {
                label: 'Instructor',
                color: 'text-gray-900',
                bgColor: 'bg-gray-50',
                borderColor: 'border-gray-200',
              },
            };

            const roleStyle = roleLabels[role] || roleLabels.instructor;
            const roleLabel = roleStyle.label;

            return (
              <div
                key={role}
                className={`p-4 ${roleStyle.bgColor} border ${roleStyle.borderColor} rounded-lg relative`}
              >
                {/* Lock Icon */}
                <div className="absolute top-3 right-3">
                  <FiLock className="w-4 h-4 text-gray-400" title="System role - cannot be modified" />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {role === 'super_admin' ? (
                    <FiShield className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <FiUsers className="w-5 h-5 text-gray-600" />
                  )}
                  <h3 className={`font-semibold ${roleStyle.color}`}>{roleLabel}</h3>
                </div>

                {/* Permission Preview (Read-only) */}
                <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Access:</p>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      {permissions.access.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-gray-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {permissions.restrictions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Restrictions:</p>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {permissions.restrictions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      {/* Active Users */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeUsers.length > 0 && (
            <SettingsCard
              title={`Active Users (${activeUsers.length})`}
              description="User access changes affect system security."
              footer={
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    <FiSettings className="w-4 h-4" />
                    Manage Users
                  </button>
                </div>
              }
            >
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

      {/* Manage Users Modal Placeholder */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowManageModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Manage Users</h3>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <FiSettings className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Coming Soon</p>
                        <p className="text-sm text-blue-700 mt-1">
                          User management features (create, edit, deactivate, role assignment) will be available here.
                          This interface will provide a safe, controlled way to manage user access.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowManageModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
