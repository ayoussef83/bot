'use client';

import { useState, ReactNode } from 'react';
import TabNavigation from './TabNavigation';
import { FiChevronRight } from 'react-icons/fi';

export interface Breadcrumb {
  label: string;
  href: string;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ReactNode;
}

export interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  content: ReactNode;
}

interface StandardDetailViewProps {
  title: string;
  subtitle?: string;
  actions?: ActionButton[];
  tabs: Tab[];
  defaultTab?: string;
  sidebar?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  onTabChange?: (tabId: string) => void;
}

export default function StandardDetailView({
  title,
  subtitle,
  actions,
  tabs,
  defaultTab,
  sidebar,
  breadcrumbs,
  onTabChange,
}: StandardDetailViewProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href}>
                <div className="flex items-center">
                  {index > 0 && (
                    <FiChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <a
                    href={crumb.href}
                    className={`text-sm font-medium ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {crumb.label}
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    action.variant === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : action.variant === 'secondary'
                      ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={sidebar ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}>
        {/* Main Content */}
        <div className={sidebar ? 'lg:col-span-2' : ''}>
          {/* Tab Navigation */}
          {tabs.length > 1 && (
            <div className="mb-6">
              <TabNavigation
                tabs={tabs.map((tab) => ({
                  id: tab.id,
                  label: tab.label,
                  count: tab.count,
                  icon: tab.icon,
                }))}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            {activeTabContent}
          </div>
        </div>

        {/* Sidebar */}
        {sidebar && (
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sticky top-6">
              {sidebar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}







