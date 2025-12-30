'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiSettings,
  FiHome,
  FiUsers,
  FiMail,
  FiMessageSquare,
  FiClock,
  FiDollarSign,
  FiCreditCard,
  FiTrendingDown,
  FiFileText,
  FiLink,
  FiShield,
  FiSliders,
  FiChevronRight,
} from 'react-icons/fi';

type SettingsSection = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  children?: SettingsSection[];
};

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    label: 'General',
    icon: <FiSettings className="w-4 h-4" />,
    path: '/dashboard/settings/general',
    roles: ['super_admin'],
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <FiHome className="w-4 h-4" />,
    path: '/dashboard/settings/organization',
    roles: ['super_admin', 'management'],
  },
  {
    id: 'users-roles',
    label: 'Users & Roles',
    icon: <FiUsers className="w-4 h-4" />,
    path: '/dashboard/settings/users-roles',
    roles: ['super_admin'],
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: <FiMail className="w-4 h-4" />,
    path: '/dashboard/settings/communications',
    roles: ['super_admin', 'operations'],
    children: [
      {
        id: 'providers',
        label: 'Providers',
        icon: <FiLink className="w-4 h-4" />,
        path: '/dashboard/settings/communications/providers',
      },
      {
        id: 'templates',
        label: 'Templates',
        icon: <FiFileText className="w-4 h-4" />,
        path: '/dashboard/settings/communications/templates',
      },
      {
        id: 'logs',
        label: 'Logs',
        icon: <FiMessageSquare className="w-4 h-4" />,
        path: '/dashboard/settings/communications/logs',
      },
    ],
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    icon: <FiClock className="w-4 h-4" />,
    path: '/dashboard/settings/scheduling',
    roles: ['super_admin', 'operations'],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <FiDollarSign className="w-4 h-4" />,
    path: '/dashboard/settings/finance',
    roles: ['super_admin', 'management', 'accounting'],
    children: [
      {
        id: 'payments',
        label: 'Payments',
        icon: <FiCreditCard className="w-4 h-4" />,
        path: '/dashboard/settings/finance/payments',
      },
      {
        id: 'expenses',
        label: 'Expenses',
        icon: <FiTrendingDown className="w-4 h-4" />,
        path: '/dashboard/settings/finance/expenses',
      },
      {
        id: 'taxes',
        label: 'Taxes',
        icon: <FiDollarSign className="w-4 h-4" />,
        path: '/dashboard/settings/finance/taxes',
      },
    ],
  },
  {
    id: 'custom-fields',
    label: 'Custom Fields',
    icon: <FiFileText className="w-4 h-4" />,
    path: '/dashboard/settings/custom-fields',
    roles: ['super_admin'],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: <FiLink className="w-4 h-4" />,
    path: '/dashboard/settings/integrations',
    roles: ['super_admin'],
  },
  {
    id: 'security',
    label: 'Security',
    icon: <FiShield className="w-4 h-4" />,
    path: '/dashboard/settings/security',
    roles: ['super_admin'],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <FiSliders className="w-4 h-4" />,
    path: '/dashboard/settings/advanced',
    roles: ['super_admin'],
  },
];

interface SettingsSidebarProps {
  userRole: string;
}

export default function SettingsSidebar({ userRole }: SettingsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Filter sections based on role
  const visibleSections = settingsSections.filter((section) => {
    if (!section.roles) return true;
    return section.roles.includes(userRole);
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const isActive = (path: string) => {
    if (pathname === path) return true;
    // Check if pathname starts with path (for nested routes)
    return pathname?.startsWith(path + '/');
  };

  const isExpanded = (sectionId: string) => {
    // Auto-expand if any child is active
    const section = settingsSections.find((s) => s.id === sectionId);
    if (section?.children) {
      const hasActiveChild = section.children.some((child) => isActive(child.path));
      if (hasActiveChild) return true;
    }
    return expandedSections.has(sectionId);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-xs text-gray-500 mt-1">System configuration</p>
      </div>
      <nav className="p-2">
        <ul className="space-y-1">
          {visibleSections.map((section) => {
            const hasChildren = section.children && section.children.length > 0;
            const expanded = isExpanded(section.id);
            const active = isActive(section.path);

            return (
              <li key={section.id}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        active
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {section.icon}
                        <span>{section.label}</span>
                      </div>
                      <FiChevronRight
                        className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {expanded && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {section.children!.map((child) => {
                          const childActive = isActive(child.path);
                          return (
                            <li key={child.id}>
                              <Link
                                href={child.path}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                  childActive
                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {child.icon}
                                <span>{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={section.path}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {section.icon}
                    <span>{section.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

