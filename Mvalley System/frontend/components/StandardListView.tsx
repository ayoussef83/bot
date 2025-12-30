'use client';

import { ReactNode } from 'react';
import DataTable, { Column, ActionButton } from './DataTable';
import SearchBar from './SearchBar';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

interface StandardListViewProps<T = any> {
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  filters?: FilterConfig[];
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationConfig;
  actions?: (row: T) => ActionButton[];
  emptyMessage?: string;
  emptyState?: ReactNode;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selected: string[]) => void;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  summaryCards?: ReactNode;
}

export default function StandardListView<T = any>({
  title,
  subtitle,
  primaryAction,
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue = '',
  filters,
  columns,
  data,
  loading = false,
  pagination,
  actions,
  emptyMessage = 'No data available',
  emptyState,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId,
  onRowClick,
  summaryCards,
}: StandardListViewProps<T>) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summaryCards && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{summaryCards}</div>}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        {onSearch && (
          <div className="max-w-md">
            <SearchBar
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearch}
            />
          </div>
        )}
        {filters && filters.length > 0 && (
          <div className="flex gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' && filter.options ? (
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    placeholder={filter.label}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        actions={actions}
        emptyMessage={emptyMessage}
        selectable={selectable}
        selectedRows={selectedRows}
        onSelectionChange={onSelectionChange}
        getRowId={getRowId}
        onRowClick={onRowClick}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
            </span>{' '}
            of <span className="font-medium">{pagination.totalItems}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Custom Empty State */}
      {!loading && data.length === 0 && emptyState && (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          {emptyState}
        </div>
      )}
    </div>
  );
}

