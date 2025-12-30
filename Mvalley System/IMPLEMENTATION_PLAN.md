# MV-OS Implementation Plan

**Based on:** MV-OS_PRODUCT_ARCHITECTURE.md  
**Date:** 2025-12-30  
**Status:** Ready to Begin

---

## Phase 1: Standard Components (Foundation)

### Priority 1: Core UI Components

#### 1.1 Standard List View Component
**File:** `frontend/components/StandardListView.tsx`

**Features:**
- Page header with title and primary action button
- Search bar
- Filter bar (optional, configurable)
- Data table with consistent styling
- Pagination
- Bulk actions (optional, future)
- Empty state
- Loading state

**Props:**
```typescript
interface StandardListViewProps {
  title: string;
  primaryAction?: { label: string; onClick: () => void };
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filters?: FilterConfig[];
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: PaginationConfig;
  emptyState?: React.ReactNode;
}
```

#### 1.2 Standard Detail View Component
**File:** `frontend/components/StandardDetailView.tsx`

**Features:**
- Page header with title and action buttons
- Tab navigation
- Content area (renders tab content)
- Sidebar for quick actions (optional)
- Breadcrumbs (optional)

**Props:**
```typescript
interface StandardDetailViewProps {
  title: string;
  subtitle?: string;
  actions?: ActionButton[];
  tabs: Tab[];
  sidebar?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
}
```

#### 1.3 Standard Dashboard Component
**File:** `frontend/components/StandardDashboard.tsx`

**Features:**
- Grid layout system
- Summary cards
- Chart widgets
- Activity feed
- Date range selector
- Customizable layout (future)

**Props:**
```typescript
interface StandardDashboardProps {
  title: string;
  widgets: Widget[];
  dateRange?: boolean;
  onDateRangeChange?: (range: DateRange) => void;
}
```

#### 1.4 Data Table Component
**File:** `frontend/components/DataTable.tsx`

**Features:**
- Sortable columns
- Selectable rows (optional)
- Action buttons per row
- Responsive design
- Loading skeleton

**Props:**
```typescript
interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  actions?: (row: any) => ActionButton[];
}
```

### Priority 2: Supporting Components

#### 2.1 Summary Cards
**File:** `frontend/components/SummaryCard.tsx`

#### 2.2 Tab Navigation
**File:** `frontend/components/TabNavigation.tsx`

#### 2.3 Action Button Group
**File:** `frontend/components/ActionButtonGroup.tsx`

#### 2.4 Empty State
**File:** `frontend/components/EmptyState.tsx`

#### 2.5 Loading Skeleton
**File:** `frontend/components/LoadingSkeleton.tsx`

---

## Phase 2: Refactor Existing Screens

### 2.1 Academic Operations Screens

**Students List**
- Replace custom implementation with `StandardListView`
- Use `DataTable` component
- Add proper filtering and search

**Student Profile**
- Replace custom implementation with `StandardDetailView`
- Use `TabNavigation` for tabs
- Embed related data (classes, payments, sessions)

**Classes List**
- Refactor to use `StandardListView`
- Standardize with Students List

**Class Detail**
- Refactor to use `StandardDetailView`
- Use tabs for Students, Sessions, Attendance

**Sessions List**
- Refactor to use `StandardListView`

**Session Detail**
- Refactor to use `StandardDetailView`

**Instructors List**
- Refactor to use `StandardListView`

**Instructor Profile**
- Refactor to use `StandardDetailView`

### 2.2 Sales & Growth Screens

**Leads List**
- Refactor to use `StandardListView`
- Add view toggle (List/Kanban - future)

**Lead Detail**
- Refactor to use `StandardDetailView`
- Add activity timeline tab

### 2.3 Finance Screens

**Payments List**
- Refactor to use `StandardListView`
- Add summary cards at top

**Payment Detail**
- Refactor to use `StandardDetailView`

**Expenses List**
- Refactor to use `StandardListView`
- Add summary cards at top

**Expense Detail**
- Refactor to use `StandardDetailView`

### 2.4 Dashboard Screens

**Management Dashboard**
- Refactor to use `StandardDashboard`
- Create reusable dashboard widgets

**Operations Dashboard**
- Refactor to use `StandardDashboard`

**Accounting Dashboard**
- Refactor to use `StandardDashboard`

---

## Phase 3: New MVP Screens

### 3.1 Communications Screens

**Templates List**
- Create using `StandardListView`

**Template Editor**
- Create custom editor (full-page, not modal)

**Message Logs**
- Create using `StandardListView`

### 3.2 Settings Screens

**Settings pages already exist** - verify they follow architecture

---

## Phase 4: Enhancements

### 4.1 Advanced Features
- Bulk actions
- Export functionality
- Advanced filtering
- Keyboard shortcuts

### 4.2 Performance
- Virtual scrolling for long lists
- Lazy loading for tabs
- Optimistic updates

### 4.3 Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support

---

## Implementation Order

### Week 1: Foundation
1. Create `DataTable` component
2. Create `StandardListView` component
3. Create `StandardDetailView` component
4. Create supporting components (SummaryCard, TabNavigation, etc.)

### Week 2: Refactor Academic Operations
1. Refactor Students List
2. Refactor Student Profile
3. Refactor Classes List
4. Refactor Class Detail
5. Refactor Sessions List & Detail
6. Refactor Instructors List & Profile

### Week 3: Refactor Sales & Finance
1. Refactor Leads List & Detail
2. Refactor Payments List & Detail
3. Refactor Expenses List & Detail

### Week 4: Dashboards & Communications
1. Create `StandardDashboard` component
2. Refactor all dashboards
3. Create Communications screens (Templates, Logs)

---

## Testing Strategy

### Component Testing
- Unit tests for all standard components
- Storybook stories for component library
- Visual regression tests

### Integration Testing
- Test each refactored screen
- Test role-based visibility
- Test navigation flows

### E2E Testing
- Critical user flows
- Role-specific workflows
- Data integrity

---

## Success Criteria

✅ All screens use standard components  
✅ Consistent UI/UX across all screens  
✅ Role-based visibility working correctly  
✅ No navigation restructuring needed  
✅ Performance acceptable (< 2s load time)  
✅ Accessibility standards met  
✅ Mobile-responsive

---

## Notes

- Start with components, then refactor existing screens
- Test each component thoroughly before using in screens
- Document component usage patterns
- Create Storybook for component library
- Maintain backward compatibility during refactoring

