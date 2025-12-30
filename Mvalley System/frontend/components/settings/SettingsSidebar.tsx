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
  FiX,
} from 'react-icons/fi';

type SettingsSection = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  children?: SettingsSection[];
  group?: string; // Visual grouping
};

const settingsSections: SettingsSection[] = [
  // System Group
  {
    id: 'general',
    label: 'General',
    icon: <FiSettings className="w-4 h-4" />,
    path: '/dashboard/settings/general',
    roles: ['super_admin'],
    group: 'System',
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <FiHome className="w-4 h-4" />,
    path: '/dashboard/settings/organization',
    roles: ['super_admin', 'management'],
    group: 'System',
  },
  {
    id: 'users-roles',
    label: 'Users & Roles',
    icon: <FiUsers className="w-4 h-4" />,
    path: '/dashboard/settings/users-roles',
    roles: ['super_admin'],
    group: 'System',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <FiShield className="w-4 h-4" />,
    path: '/dashboard/settings/security',
    roles: ['super_admin'],
    group: 'System',
  },
  // Operations Group
  {
    id: 'communications',
    label: 'Communications',
    icon: <FiMail className="w-4 h-4" />,
    path: '/dashboard/settings/communications',
    roles: ['super_admin', 'operations'],
    group: 'Operations',
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
    group: 'Operations',
  },
  // Finance Group
  {
    id: 'finance',
    label: 'Finance',
    icon: <FiDollarSign className="w-4 h-4" />,
    path: '/dashboard/settings/finance',
    roles: ['super_admin', 'management', 'accounting'],
    group: 'Finance',
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
  // Platform Group
  {
    id: 'custom-fields',
    label: 'Custom Fields',
    icon: <FiFileText className="w-4 h-4" />,
    path: '/dashboard/settings/custom-fields',
    roles: ['super_admin'],
    group: 'Platform',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: <FiLink className="w-4 h-4" />,
    path: '/dashboard/settings/integrations',
    roles: ['super_admin'],
    group: 'Platform',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <FiSliders className="w-4 h-4" />,
    path: '/dashboard/settings/advanced',
    roles: ['super_admin'],
    group: 'Platform',
  },
];

interface SettingsSidebarProps {
  userRole: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SettingsSidebar({ userRole, isOpen = false, onClose }: SettingsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Filter sections based on role
  const visibleSections = settingsSections.filter((section) => {
    if (!section.roles) return true;
    return section.roles.includes(userRole);
  });

  // Group sections by group
  const groupedSections = visibleSections.reduce((acc, section) => {
    const group = section.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(section);
    return acc;
  }, {} as { [key: string]: SettingsSection[] });

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

  const renderNavContent = (onLinkClick?: () => void) => (
    <nav className="p-2">
      {Object.entries(groupedSections).map(([groupName, sections]) => (
        <div key={groupName} className="mb-6">
          <div className="px-3 py-2 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {groupName}
            </h3>
          </div>
          <ul className="space-y-1">
            {sections.map((section) => {
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
                                  onClick={onLinkClick}
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
                      onClick={onLinkClick}
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
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-500 mt-1">System configuration</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderNavContent(onClose)}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 bottom-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <p className="text-xs text-gray-500 mt-1">System configuration</p>
        </div>
        {renderNavContent()}
      </div>
    </>
  );
}
