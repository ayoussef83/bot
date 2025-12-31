'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiHome,
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiUserCheck,
  FiUserPlus,
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiTrendingDown,
  FiSettings,
  FiChevronRight,
  FiPhone,
  FiBarChart2,
  FiLayers,
  FiUser,
  FiClock,
  FiX,
  FiMail,
  FiMessageSquare,
  FiFileText,
  FiLink,
  FiShield,
  FiSliders,
  FiShare2,
  FiMessageCircle,
  FiTrendingUp,
  FiRefreshCw,
  FiBriefcase,
  FiTarget,
  FiRadio,
} from 'react-icons/fi';
import {
  RiTeamFill,
  RiPresentationFill,
  RiWalkFill,
} from 'react-icons/ri';
import { MdContactPhone } from 'react-icons/md';
import { TbCash } from 'react-icons/tb';
import { AiTwotoneDashboard } from 'react-icons/ai';

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
    icon: <AiTwotoneDashboard className="w-4 h-4" />,
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
        icon: <RiPresentationFill className="w-4 h-4" />,
        path: '/dashboard/instructors',
        roles: ['super_admin', 'operations', 'management', 'accounting'],
      },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: <MdContactPhone className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin', 'sales', 'management'],
    children: [
      {
        id: 'crm-dashboard',
        label: 'Dashboard',
        icon: <FiBarChart2 className="w-4 h-4" />,
        path: '/dashboard/crm',
        roles: ['super_admin', 'sales', 'management'],
      },
      {
        id: 'crm-pipeline',
        label: 'Pipeline',
        icon: <FiLayers className="w-4 h-4" />,
        path: '/dashboard/crm/pipeline',
        roles: ['super_admin', 'sales', 'management'],
      },
      {
        id: 'crm-leads',
        label: 'Leads',
        icon: <RiWalkFill className="w-4 h-4" />,
        path: '/dashboard/crm/leads',
        roles: ['super_admin', 'sales', 'management'],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <FiDollarSign className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin', 'management', 'accounting', 'operations'],
    children: [
      {
        id: 'finance-overview',
        label: 'Overview',
        icon: <FiBarChart2 className="w-4 h-4" />,
        path: '/dashboard/finance',
        roles: ['super_admin', 'management', 'accounting', 'operations'],
      },
      {
        id: 'finance-revenue',
        label: 'Revenue',
        icon: <FiTrendingUp className="w-4 h-4" />,
        roles: ['super_admin', 'management', 'accounting', 'operations'],
        children: [
          {
            id: 'finance-invoices',
            label: 'Invoices',
            icon: <FiFileText className="w-4 h-4" />,
            path: '/dashboard/finance/revenue/invoices',
            roles: ['super_admin', 'management', 'accounting', 'operations'],
          },
          {
            id: 'finance-subscriptions',
            label: 'Subscriptions',
            icon: <FiClock className="w-4 h-4" />,
            path: '/dashboard/finance/revenue/subscriptions',
            roles: ['super_admin', 'management', 'accounting', 'operations'],
          },
        ],
      },
      {
        id: 'finance-cash',
        label: 'Cash',
        icon: <TbCash className="w-4 h-4" />,
        roles: ['super_admin', 'management', 'accounting'],
        children: [
          {
            id: 'finance-payments',
            label: 'Payments',
            icon: <FiCreditCard className="w-4 h-4" />,
            path: '/dashboard/finance/cash/payments',
            roles: ['super_admin', 'management', 'accounting'],
          },
          {
            id: 'finance-cash-accounts',
            label: 'Cash Accounts',
            icon: <FiDollarSign className="w-4 h-4" />,
            path: '/dashboard/finance/cash/accounts',
            roles: ['super_admin', 'management', 'accounting'],
          },
        ],
      },
      {
        id: 'finance-expenses',
        label: 'Expenses',
        icon: <FiFileText className="w-4 h-4" />,
        roles: ['super_admin', 'management', 'accounting'],
        children: [
          {
            id: 'finance-expenses-list',
            label: 'Expenses',
            icon: <FiFileText className="w-4 h-4" />,
            path: '/dashboard/finance/expenses',
            roles: ['super_admin', 'management', 'accounting'],
          },
          {
            id: 'finance-expense-categories',
            label: 'Categories',
            icon: <FiSliders className="w-4 h-4" />,
            path: '/dashboard/finance/expenses/categories',
            roles: ['super_admin', 'management', 'accounting'],
          },
        ],
      },
      {
        id: 'finance-reconciliation',
        label: 'Reconciliation',
        icon: <FiRefreshCw className="w-4 h-4" />,
        path: '/dashboard/finance/reconciliation',
        roles: ['super_admin', 'management', 'accounting'],
      },
      {
        id: 'finance-reports',
        label: 'Reports',
        icon: <FiBarChart2 className="w-4 h-4" />,
        roles: ['super_admin', 'management', 'accounting', 'operations'],
        children: [
          {
            id: 'finance-report-pl',
            label: 'Profit & Loss',
            icon: <FiTrendingUp className="w-4 h-4" />,
            path: '/dashboard/finance/reports/profit-loss',
            roles: ['super_admin', 'management', 'accounting', 'operations'],
          },
          {
            id: 'finance-report-cashflow',
            label: 'Cash Flow',
            icon: <FiDollarSign className="w-4 h-4" />,
            path: '/dashboard/finance/reports/cash-flow',
            roles: ['super_admin', 'management', 'accounting', 'operations'],
          },
          {
            id: 'finance-report-class-profit',
            label: 'Class Profitability',
            icon: <FiUsers className="w-4 h-4" />,
            path: '/dashboard/finance/reports/class-profitability',
            roles: ['super_admin', 'management', 'accounting', 'operations'],
          },
          {
            id: 'finance-report-instructor-costs',
            label: 'Instructor Costs',
            icon: <FiUserCheck className="w-4 h-4" />,
            path: '/dashboard/finance/reports/instructor-costs',
            roles: ['super_admin', 'management', 'accounting', 'operations'],
          },
        ],
      },
    ],
  },
  {
    id: 'hr',
    label: 'HR',
    icon: <RiTeamFill className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin', 'operations', 'management', 'accounting'],
    children: [
      {
        id: 'hr-dashboard',
        label: 'Dashboard',
        icon: <FiBarChart2 className="w-4 h-4" />,
        path: '/dashboard/hr',
        roles: ['super_admin', 'operations', 'management', 'accounting'],
      },
      {
        id: 'hr-people',
        label: 'People',
        icon: <FiUsers className="w-4 h-4" />,
        path: '/dashboard/hr/people',
        roles: ['super_admin', 'operations', 'management', 'accounting'],
      },
      {
        id: 'hr-availability',
        label: 'Availability',
        icon: <FiClock className="w-4 h-4" />,
        path: '/dashboard/hr/availability',
        roles: ['super_admin', 'operations', 'management'],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <FiShare2 className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin', 'management', 'operations', 'sales'],
    children: [
      {
        id: 'marketing-overview',
        label: 'Overview',
        icon: <FiBarChart2 className="w-4 h-4" />,
        path: '/dashboard/marketing',
        roles: ['super_admin', 'management', 'operations', 'sales'],
      },
      {
        id: 'marketing-conversations',
        label: 'Conversations',
        icon: <FiMessageCircle className="w-4 h-4" />,
        path: '/dashboard/marketing/conversations',
        roles: ['super_admin', 'management', 'operations', 'sales'],
      },
      {
        id: 'marketing-campaigns',
        label: 'Campaigns',
        icon: <FiTarget className="w-4 h-4" />,
        path: '/dashboard/marketing/campaigns',
        roles: ['super_admin', 'management', 'operations', 'sales'],
      },
      {
        id: 'marketing-channels',
        label: 'Channels',
        icon: <FiRadio className="w-4 h-4" />,
        path: '/dashboard/marketing/channels',
        roles: ['super_admin', 'management'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <FiSettings className="w-4 h-4" />,
    group: 'Main',
    roles: ['super_admin'],
    children: [
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
        id: 'security',
        label: 'Security',
        icon: <FiShield className="w-4 h-4" />,
        path: '/dashboard/settings/security',
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
        id: 'advanced',
        label: 'Advanced',
        icon: <FiSliders className="w-4 h-4" />,
        path: '/dashboard/settings/advanced',
        roles: ['super_admin'],
      },
    ],
  },
];

interface DashboardSidebarProps {
  userRole: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ userRole, isOpen = false, onClose }: DashboardSidebarProps) {
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
    // Auto-expand if any child (or nested child) is active
    const section = navigationSections.find((s) => s.id === sectionId);
    if (section?.children) {
      const hasActiveChild = section.children.some((child) => {
        // Check if child path is active
        if (child.path && isActive(child.path)) return true;
        // Check if any grandchild is active (recursive)
        if (child.children) {
          return child.children.some((grandchild) => {
            if (grandchild.path && isActive(grandchild.path)) return true;
            // Check deeper nesting if needed
            if (grandchild.children) {
              return grandchild.children.some((ggchild) => ggchild.path && isActive(ggchild.path));
            }
            return false;
          });
        }
        return false;
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
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <Link href={getDashboardPath(userRole)} className="flex items-center justify-center flex-1">
              <Image
                src="/mindvalley-logo.png"
                alt="MindValley"
                height={60}
                width={150}
                className="h-16 w-auto object-contain"
                unoptimized
              />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
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
                            onClick={onClose}
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
                              type="button"
                              onClick={() => toggleSection(section.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
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
                                    const childHasChildren = child.children && child.children.length > 0;
                                    const childExpanded = isExpanded(child.id);
                                    
                                    return (
                                      <li key={child.id}>
                                        {childHasChildren ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => toggleSection(child.id)}
                                              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                                                childActive
                                                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                  : 'text-gray-600 hover:bg-gray-50'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                {child.icon}
                                                <span>{child.label}</span>
                                              </div>
                                              <FiChevronRight
                                                className={`w-4 h-4 transition-transform ${childExpanded ? 'rotate-90' : ''}`}
                                              />
                                            </button>
                                            {childExpanded && (
                                              <ul className="ml-6 mt-1 space-y-1">
                                                {child.children!
                                                  .filter(isChildVisible)
                                                  .map((grandchild) => {
                                                    const grandchildActive = grandchild.path ? isActive(grandchild.path) : false;
                                                    return (
                                                      <li key={grandchild.id}>
                                                        <Link
                                                          href={grandchild.path || '#'}
                                                          onClick={onClose}
                                                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                                            grandchildActive
                                                              ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                              : 'text-gray-600 hover:bg-gray-50'
                                                          }`}
                                                        >
                                                          {grandchild.icon}
                                                          <span>{grandchild.label}</span>
                                                        </Link>
                                                      </li>
                                                    );
                                                  })}
                                              </ul>
                                            )}
                                          </>
                                        ) : (
                                          <Link
                                            href={child.path || '#'}
                                            onClick={onClose}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                              childActive
                                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                          >
                                            {child.icon}
                                            <span>{child.label}</span>
                                          </Link>
                                        )}
                                      </li>
                                    );
                                  })}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={section.path || '#'}
                            onClick={onClose}
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
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen flex-shrink-0 fixed left-0 top-0 bottom-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <Link href={getDashboardPath(userRole)} className="flex items-center justify-center">
            <Image
              src="/mindvalley-logo.png"
              alt="MindValley"
              height={80}
              width={200}
              className="h-20 w-auto object-contain"
              unoptimized
            />
          </Link>
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
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
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
                                  const childHasChildren = child.children && child.children.length > 0;
                                  const childExpanded = isExpanded(child.id);
                                  
                                  return (
                                    <li key={child.id}>
                                      {childHasChildren ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => toggleSection(child.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                                              childActive
                                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              {child.icon}
                                              <span>{child.label}</span>
                                            </div>
                                            <FiChevronRight
                                              className={`w-4 h-4 transition-transform ${childExpanded ? 'rotate-90' : ''}`}
                                            />
                                          </button>
                                          {childExpanded && (
                                            <ul className="ml-6 mt-1 space-y-1">
                                              {child.children!
                                                .filter(isChildVisible)
                                                .map((grandchild) => {
                                                  const grandchildActive = grandchild.path ? isActive(grandchild.path) : false;
                                                  return (
                                                    <li key={grandchild.id}>
                                                      <Link
                                                        href={grandchild.path || '#'}
                                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                                          grandchildActive
                                                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                      >
                                                        {grandchild.icon}
                                                        <span>{grandchild.label}</span>
                                                      </Link>
                                                    </li>
                                                  );
                                                })}
                                            </ul>
                                          )}
                                        </>
                                      ) : (
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
                                      )}
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
    </>
  );
}

/* Force rebuild 1767195562 */
