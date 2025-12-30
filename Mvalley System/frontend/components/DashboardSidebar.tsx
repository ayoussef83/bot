'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome,
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiUserCheck,
  FiUserPlus,
  FiDollarSign,
  FiCreditCard,
  FiTrendingDown,
  FiSettings,
  FiChevronRight,
} from 'react-icons/fi';

type NavigationSection = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  children?: NavigationSection[];
  group?: string;
};

const navigationSections: NavigationSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <FiHome className="w-4 h-4" />,
    path: '/dashboard',
    group: 'Main',
  },
  {
    id: 'academics',
    label: 'Academics',
    icon: <FiBookOpen className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin', 'operations', 'management', 'accounting', 'sales', 'instructor'],
    children: [
      {
        id: 'students',
        label: 'Students',
        icon: <FiUsers className="w-4 h-4" />,
        path: '/dashboard/students',
        roles: ['super_admin', 'operations', 'management', 'accounting', 'sales', 'instructor'],
      },
      {
        id: 'classes',
        label: 'Classes',
        icon: <FiBookOpen className="w-4 h-4" />,
        path: '/dashboard/classes',
        roles: ['super_admin', 'operations', 'management', 'accounting', 'sales', 'instructor'],
      },
      {
        id: 'sessions',
        label: 'Sessions',
        icon: <FiCalendar className="w-4 h-4" />,
        path: '/dashboard/sessions',
        roles: ['super_admin', 'operations', 'management', 'accounting', 'sales', 'instructor'],
      },
      {
        id: 'instructors',
        label: 'Instructors',
        icon: <FiUserCheck className="w-4 h-4" />,
        path: '/dashboard/instructors',
        roles: ['super_admin', 'operations', 'management', 'accounting'],
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <FiUserPlus className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin', 'sales'],
    children: [
      {
        id: 'leads',
        label: 'Leads',
        icon: <FiUserPlus className="w-4 h-4" />,
        path: '/dashboard/leads',
        roles: ['super_admin', 'sales'],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <FiDollarSign className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin', 'management', 'accounting'],
    children: [
      {
        id: 'payments',
        label: 'Payments',
        icon: <FiCreditCard className="w-4 h-4" />,
        path: '/dashboard/finance',
        roles: ['super_admin', 'management', 'accounting'],
      },
      // Future: Expenses, Taxes can be added here
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <FiSettings className="w-4 h-4" />,
    path: '/dashboard/settings',
    group: 'Main',
    roles: ['super_admin'],
  },
];

interface DashboardSidebarProps {
  userRole: string;
}

export default function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Filter sections based on role
  const visibleSections = navigationSections.filter((section) => {
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
  }, {} as { [key: string]: NavigationSection[] });

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

  const isActive = (path?: string) => {
    if (!path) return false;
    if (pathname === path) return true;
    // Check if pathname starts with path (for nested routes)
    return pathname?.startsWith(path + '/');
  };

  const isExpanded = (sectionId: string) => {
    // Auto-expand if any child is active
    const section = navigationSections.find((s) => s.id === sectionId);
    if (section?.children) {
      const hasActiveChild = section.children.some((child) => {
        if (!child.path) return false;
        return isActive(child.path);
      });
      if (hasActiveChild) return true;
    }
    return expandedSections.has(sectionId);
  };

  // Check if child should be visible based on role
  const isChildVisible = (child: NavigationSection) => {
    if (!child.roles) return true;
    return child.roles.includes(userRole);
  };

  // Get dashboard path based on role
  const getDashboardPath = (role: string): string => {
    switch (role) {
      case 'super_admin':
      case 'management':
        return '/dashboard/management';
      case 'operations':
        return '/dashboard/ops';
      case 'accounting':
        return '/dashboard/accounting';
      case 'instructor':
        return '/dashboard/instructor';
      default:
        return '/dashboard/management';
    }
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">MV-OS</h2>
        <p className="text-xs text-gray-400 mt-1">Navigation</p>
      </div>
      <nav className="p-2">
        {Object.entries(groupedSections).map(([groupName, sections]) => (
          <div key={groupName} className="mb-6">
            {groupName !== 'Main' && (
              <div className="px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {groupName}
                </h3>
              </div>
            )}
            <ul className="space-y-1">
              {sections.map((section) => {
                const hasChildren = section.children && section.children.length > 0;
                const expanded = isExpanded(section.id);
                const active = section.path ? isActive(section.path) : false;

                // Special handling for Dashboard
                if (section.id === 'dashboard') {
                  const dashboardPath = getDashboardPath(userRole);
                  const dashboardActive = pathname === dashboardPath || pathname?.startsWith('/dashboard/management') || pathname?.startsWith('/dashboard/ops') || pathname?.startsWith('/dashboard/accounting') || pathname?.startsWith('/dashboard/instructor');
                  
                  return (
                    <li key={section.id}>
                      <Link
                        href={dashboardPath}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          dashboardActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {section.icon}
                        <span>{section.label}</span>
                      </Link>
                    </li>
                  );
                }

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
                            {section.children!
                              .filter(isChildVisible)
                              .map((child) => {
                                const childActive = child.path ? isActive(child.path) : false;
                                return (
                                  <li key={child.id}>
                                    <Link
                                      href={child.path || '#'}
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
                        href={section.path || '#'}
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
    </div>
  );
}

