# MV-OS Component Library

**Status:** Foundation Components Complete  
**Date:** 2025-12-30

---

## Overview

This document describes the standard components available for building MV-OS screens according to the product architecture.

---

## Core Components

### 1. DataTable

Reusable data table component with sorting, selection, and actions.

**Location:** `frontend/components/DataTable.tsx`

**Features:**
- Sortable columns
- Row selection (optional)
- Action buttons per row
- Loading skeleton
- Empty state
- Responsive design

**Usage:**
```tsx
import DataTable, { Column, ActionButton } from '@/components/DataTable';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { 
    key: 'status', 
    label: 'Status',
    render: (value) => <StatusBadge status={value} />
  },
];

const actions = (row: any): ActionButton[] => [
  { label: 'Edit', onClick: () => handleEdit(row) },
  { label: 'Delete', onClick: () => handleDelete(row), variant: 'danger' },
];

<DataTable
  columns={columns}
  data={students}
  loading={loading}
  actions={actions}
  onRowClick={(row) => router.push(`/students/${row.id}`)}
  selectable={true}
  selectedRows={selectedIds}
  onSelectionChange={setSelectedIds}
/>
```

---

### 2. StandardListView

Complete list view page component with header, search, filters, table, and pagination.

**Location:** `frontend/components/StandardListView.tsx`

**Features:**
- Page header with title and primary action
- Search bar
- Filter bar (select, date, text)
- Summary cards (optional)
- DataTable integration
- Pagination
- Empty state

**Usage:**
```tsx
import StandardListView, { FilterConfig, PaginationConfig } from '@/components/StandardListView';

const filters: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    value: filterStatus,
    onChange: setFilterStatus,
  },
];

const pagination: PaginationConfig = {
  currentPage: page,
  totalPages: totalPages,
  pageSize: 20,
  totalItems: total,
  onPageChange: setPage,
};

<StandardListView
  title="Students"
  subtitle="Manage student records"
  primaryAction={{
    label: 'Add Student',
    onClick: () => router.push('/students/new'),
    icon: <FiPlus />,
  }}
  searchPlaceholder="Search students..."
  onSearch={setSearchQuery}
  searchValue={searchQuery}
  filters={filters}
  columns={columns}
  data={students}
  loading={loading}
  pagination={pagination}
  actions={actions}
  summaryCards={
    <>
      <SummaryCard title="Total Students" value={total} />
      <SummaryCard title="Active" value={active} variant="success" />
    </>
  }
/>
```

---

### 3. StandardDetailView

Tabbed detail view component for entity profiles.

**Location:** `frontend/components/StandardDetailView.tsx`

**Features:**
- Page header with title and actions
- Breadcrumbs (optional)
- Tab navigation
- Tab content area
- Sidebar for quick actions (optional)

**Usage:**
```tsx
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';

const tabs: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: <OverviewTab student={student} />,
  },
  {
    id: 'classes',
    label: 'Classes',
    count: student.classes.length,
    content: <ClassesTab student={student} />,
  },
  {
    id: 'payments',
    label: 'Payments',
    content: <PaymentsTab student={student} />,
  },
];

const actions: ActionButton[] = [
  {
    label: 'Edit',
    onClick: () => router.push(`/students/${id}/edit`),
    icon: <FiEdit />,
  },
  {
    label: 'Delete',
    onClick: handleDelete,
    variant: 'danger',
  },
];

const breadcrumbs: Breadcrumb[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Students', href: '/students' },
  { label: student.name, href: `/students/${id}` },
];

<StandardDetailView
  title={student.name}
  subtitle={student.email}
  actions={actions}
  tabs={tabs}
  breadcrumbs={breadcrumbs}
  sidebar={
    <div>
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <button onClick={sendSMS}>Send SMS</button>
      <button onClick={sendEmail}>Send Email</button>
    </div>
  }
/>
```

---

### 4. SummaryCard

Summary card component for displaying metrics.

**Location:** `frontend/components/SummaryCard.tsx`

**Features:**
- Variants (default, success, warning, danger, info)
- Trend indicators
- Icons
- Clickable (optional)

**Usage:**
```tsx
import SummaryCard from '@/components/SummaryCard';
import { FiDollarSign } from 'react-icons/fi';

<SummaryCard
  title="Total Revenue"
  value={10000}
  subtitle="This month"
  icon={<FiDollarSign className="w-8 h-8" />}
  trend={{
    value: 12.5,
    label: "vs last month",
    positive: true,
  }}
  variant="success"
  onClick={() => router.push('/finance')}
/>
```

---

### 5. TabNavigation

Reusable tab navigation component.

**Location:** `frontend/components/TabNavigation.tsx`

**Usage:**
```tsx
import TabNavigation from '@/components/TabNavigation';

<TabNavigation
  tabs={[
    { id: 'overview', label: 'Overview', count: 5 },
    { id: 'details', label: 'Details' },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

---

### 6. EmptyState

Empty state component for when there's no data.

**Location:** `frontend/components/EmptyState.tsx`

**Usage:**
```tsx
import EmptyState from '@/components/EmptyState';

<EmptyState
  title="No students found"
  message="Get started by adding your first student"
  action={{
    label: 'Add Student',
    onClick: () => router.push('/students/new'),
  }}
/>
```

---

## Component Architecture

### List Views
All list views should use `StandardListView`:
- Students List
- Classes List
- Sessions List
- Instructors List
- Leads List
- Payments List
- Expenses List
- Templates List
- Message Logs

### Detail Views
All detail views should use `StandardDetailView`:
- Student Profile
- Class Detail
- Session Detail
- Instructor Profile
- Lead Detail
- Payment Detail
- Expense Detail

### Dashboards
Dashboards use custom layouts but can leverage:
- `SummaryCard` for metrics
- Standard grid layouts
- Date range selectors

---

## Best Practices

### 1. Consistent Column Definitions
```tsx
// ✅ Good: Reusable column definitions
const studentColumns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
];

// ❌ Bad: Inline column definitions
<DataTable columns={[{ key: 'name', label: 'Name' }]} />
```

### 2. Action Button Patterns
```tsx
// ✅ Good: Consistent action patterns
const actions = (row: any): ActionButton[] => [
  { label: 'View', onClick: () => view(row) },
  { label: 'Edit', onClick: () => edit(row) },
  { label: 'Delete', onClick: () => delete(row), variant: 'danger' },
];
```

### 3. Filter Configuration
```tsx
// ✅ Good: Type-safe filter configs
const filters: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: statusOptions,
    value: filterStatus,
    onChange: setFilterStatus,
  },
];
```

### 4. Tab Organization
```tsx
// ✅ Good: Logical tab grouping
const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', content: <Overview /> },
  { id: 'related', label: 'Related Data', content: <Related /> },
  { id: 'history', label: 'History', content: <History /> },
];
```

---

## Migration Guide

### Migrating Existing List Views

**Before:**
```tsx
<div>
  <h1>Students</h1>
  <button>Add Student</button>
  <table>...</table>
</div>
```

**After:**
```tsx
<StandardListView
  title="Students"
  primaryAction={{ label: 'Add Student', onClick: handleAdd }}
  columns={columns}
  data={students}
  // ... other props
/>
```

### Migrating Existing Detail Views

**Before:**
```tsx
<div>
  <h1>Student Profile</h1>
  <div className="tabs">...</div>
  <div className="content">...</div>
</div>
```

**After:**
```tsx
<StandardDetailView
  title="Student Profile"
  tabs={tabs}
  actions={actions}
  // ... other props
/>
```

---

## Component Status

| Component | Status | Usage |
|-----------|--------|-------|
| DataTable | ✅ Complete | Ready for use |
| StandardListView | ✅ Complete | Ready for use |
| StandardDetailView | ✅ Complete | Ready for use |
| SummaryCard | ✅ Complete | Ready for use |
| TabNavigation | ✅ Complete | Ready for use |
| EmptyState | ✅ Complete | Ready for use |
| StandardDashboard | ⏳ Pending | Future phase |

---

## Next Steps

1. **Refactor Existing Screens**
   - Start with Students List (example implementation)
   - Refactor all Academic Operations screens
   - Refactor Sales & Finance screens

2. **Create StandardDashboard**
   - Dashboard grid layout system
   - Widget components
   - Date range selector

3. **Documentation**
   - Storybook stories for all components
   - Visual examples
   - Accessibility guidelines

---

## Questions?

Refer to:
- `MV-OS_PRODUCT_ARCHITECTURE.md` for screen structure guidelines
- `IMPLEMENTATION_PLAN.md` for implementation roadmap
- Component source files for detailed prop definitions







