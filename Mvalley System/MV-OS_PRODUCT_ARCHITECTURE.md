# MV-OS Product Architecture & UI System Design

**Version:** 1.0  
**Date:** 2025-12-30  
**Purpose:** Scalable, role-aware, implementation-ready UI architecture

---

## Architecture Principles

1. **Screen Standardization**: All primary screens follow the same layout pattern
2. **2-Level Navigation Maximum**: Sidebar → Page (no nested sidebars)
3. **Role Intent Over Permissions**: UI shows/hides based on role purpose, not granular permissions
4. **MVP-First, Future-Ready**: Clear separation of MVP vs future features
5. **Embedded Over Separate**: Related data embedded in detail views when possible

---

## System: Academic Operations

### Purpose
Manage student enrollment, class scheduling, session delivery, and instructor assignments.

### MVP Features
- Student CRUD
- Class CRUD
- Session CRUD
- Instructor CRUD
- Student → Class enrollment
- Session → Class assignment
- Instructor → Session assignment
- Basic student profile (contact, enrollment history)

### Future Features
- Attendance tracking
- Grade management
- Student progress tracking
- Class capacity management
- Waitlists
- Recurring session templates
- Bulk operations

### Primary Screens

#### 1. Students List
- **Layout**: Standard list view
- **Header**: "Students" + "Add Student" button
- **Filters**: Status, Class, Search
- **Content**: Table (Name, Email, Phone, Classes, Status, Actions)
- **Actions**: View, Edit, Delete, Enroll in Class

#### 2. Student Profile (Detail)
- **Layout**: Tabbed detail view
- **Tabs**: 
  - Overview (contact info, status, notes)
  - Classes (enrolled classes, history)
  - Payments (read-only, links to Finance)
  - Sessions (attendance, upcoming)
- **Header**: Student name + Edit button
- **Sidebar**: Quick actions (Send SMS, Send Email, Add Note)

#### 3. Classes List
- **Layout**: Standard list view
- **Header**: "Classes" + "Add Class" button
- **Filters**: Status, Instructor, Date range
- **Content**: Table (Name, Instructor, Students count, Sessions, Status, Actions)
- **Actions**: View, Edit, Delete, Manage Students

#### 4. Class Detail
- **Layout**: Tabbed detail view
- **Tabs**:
  - Overview (info, schedule, capacity)
  - Students (enrolled list, add/remove)
  - Sessions (session list, add session)
  - Attendance (future: embedded attendance grid)
- **Header**: Class name + Edit button

#### 5. Sessions List
- **Layout**: Standard list view
- **Header**: "Sessions" + "Add Session" button
- **Filters**: Class, Instructor, Date range, Status
- **Content**: Table (Date/Time, Class, Instructor, Students, Status, Actions)
- **Actions**: View, Edit, Delete, Mark Complete

#### 6. Session Detail
- **Layout**: Single-page detail view
- **Content**: 
  - Session info (date, time, class, instructor)
  - Student list (with attendance checkboxes - future)
  - Notes
- **Header**: Session date/time + Edit button

#### 7. Instructors List
- **Layout**: Standard list view
- **Header**: "Instructors" + "Add Instructor" button
- **Filters**: Status, Search
- **Content**: Table (Name, Email, Phone, Classes count, Status, Actions)
- **Actions**: View, Edit, Delete

#### 8. Instructor Profile
- **Layout**: Tabbed detail view
- **Tabs**:
  - Overview (contact info, bio, status)
  - Classes (assigned classes)
  - Sessions (upcoming sessions)
  - Payments (read-only, links to Finance)
- **Header**: Instructor name + Edit button

### Secondary Screens
- **Student Enrollment Modal**: Quick enroll in class (from Student Profile or Classes)
- **Bulk Actions Modal**: Select multiple students/classes for bulk operations (future)
- **Session Recurrence Wizard**: Create recurring sessions (future)

### UI Structure Notes
- All list views use the same table component with consistent columns
- Detail views use tabs for related data (avoiding separate screens)
- Payments data is read-only embedded (full CRUD in Finance module)
- Search and filters are always in the same position

### Roles
- **super_admin**: Full CRUD on all entities
- **management**: Read all, edit students/classes, view reports
- **operations**: Full CRUD on students, classes, sessions, instructors
- **accounting**: Read-only access to all (for payment context)
- **sales**: Read-only access to students/classes (for lead conversion)
- **instructor**: Read-only access to own classes/sessions, view own students

### Navigation Placement
- **Sidebar**: "Academics" (expandable)
  - Students
  - Classes
  - Sessions
  - Instructors
- **No sub-navigation**: All detail views are reached via list → detail

### Risks
- **Risk**: Student profile tabs could become overloaded
- **Mitigation**: Move advanced features (grades, attendance) to separate embedded components, not new tabs
- **Risk**: Session list could become too large
- **Mitigation**: Default to upcoming sessions, strong date filtering

---

## System: Sales & Growth

### Purpose
Manage leads, track sales pipeline, convert leads to students.

### MVP Features
- Lead CRUD
- Lead status tracking (New, Contacted, Qualified, Converted, Lost)
- Lead → Student conversion
- Basic pipeline view

### Future Features
- Sales forecasting
- Lead scoring
- Campaign tracking
- Conversion analytics
- Email/SMS automation triggers
- Lead assignment rules

### Primary Screens

#### 1. Leads List
- **Layout**: Standard list view with view toggle
- **Header**: "Leads" + "Add Lead" button + View toggle (List/Kanban)
- **Filters**: Status, Source, Date range, Search
- **Content**: 
  - List view: Table (Name, Email, Phone, Status, Source, Created, Actions)
  - Kanban view: Status columns with lead cards (future)
- **Actions**: View, Edit, Delete, Convert to Student, Send Message

#### 2. Lead Detail
- **Layout**: Tabbed detail view
- **Tabs**:
  - Overview (contact info, status, source, notes)
  - Activity (timeline of interactions, messages sent)
  - Conversion (convert to student wizard)
- **Header**: Lead name + Edit button + Status badge
- **Sidebar**: Quick actions (Send SMS, Send Email, Schedule Follow-up)

#### 3. Sales Pipeline (Future)
- **Layout**: Dashboard-style view
- **Content**: 
  - Pipeline funnel chart
  - Status distribution
  - Conversion rate metrics
  - Recent conversions
- **Header**: "Sales Pipeline" + Date range selector

### Secondary Screens
- **Convert to Student Wizard**: Modal/stepper to convert lead to student
- **Lead Import Modal**: Bulk import leads (future)
- **Campaign Tracking View**: Embedded in Leads list (future)

### UI Structure Notes
- Leads list supports both table and kanban views (kanban future)
- Conversion is a wizard, not a separate screen
- Activity timeline embedded in lead detail (not separate screen)
- Pipeline view is dashboard-style, not a list

### Roles
- **super_admin**: Full CRUD on leads
- **sales**: Full CRUD on leads, view pipeline
- **management**: Read all leads, view pipeline, convert leads
- **operations**: Read-only access (for student context)
- **accounting**: No access
- **instructor**: No access

### Navigation Placement
- **Sidebar**: "Sales" (expandable)
  - Leads
  - Pipeline (future, hidden in MVP)
- **No sub-navigation**: Lead detail reached via list

### Risks
- **Risk**: Pipeline view could become complex dashboard
- **Mitigation**: Keep it as a summary view, detailed analytics go to Reports module
- **Risk**: Lead activity timeline could become cluttered
- **Mitigation**: Paginate timeline, group by date, collapse old items

---

## System: Finance & Cash Control

### Purpose
Track payments, expenses, financial health, and cash flow.

### MVP Features
- Payment CRUD
- Expense CRUD
- Payment status tracking
- Outstanding balance calculation
- Basic financial summaries

### Future Features
- Installment plans
- Discounts and promotions
- Tax management
- Financial forecasting
- Budget planning
- Payment reminders automation
- Expense categories and budgets
- Financial reports and charts

### Primary Screens

#### 1. Payments List
- **Layout**: Standard list view with summary cards
- **Header**: "Payments" + "Add Payment" button
- **Summary Cards**: Total Payments, Outstanding, Collected (this month)
- **Filters**: Student, Status, Date range, Type
- **Content**: Table (Student, Amount, Type, Status, Date, Due Date, Actions)
- **Actions**: View, Edit, Delete, Mark Paid, Send Reminder

#### 2. Payment Detail
- **Layout**: Single-page detail view
- **Content**:
  - Payment info (student, amount, type, dates, status)
  - Payment history (status changes)
  - Related expenses (if any)
  - Notes
- **Header**: Payment ID + Edit button + Status badge

#### 3. Expenses List
- **Layout**: Standard list view with summary cards
- **Header**: "Expenses" + "Add Expense" button
- **Summary Cards**: Total Expenses, This Month, By Category
- **Filters**: Category, Date range, Instructor
- **Content**: Table (Description, Category, Amount, Date, Instructor, Actions)
- **Actions**: View, Edit, Delete

#### 4. Expense Detail
- **Layout**: Single-page detail view
- **Content**:
  - Expense info (description, category, amount, date, instructor)
  - Receipt attachment (future)
  - Notes
- **Header**: Expense description + Edit button

#### 5. Financial Intelligence (Future)
- **Layout**: Dashboard-style view
- **Content**:
  - Revenue vs Expenses chart
  - Cash flow forecast
  - Outstanding payments breakdown
  - Category-wise expense analysis
  - Payment trends
- **Header**: "Financial Intelligence" + Date range selector

### Secondary Screens
- **Payment Reminder Modal**: Send reminder to student (from Payment Detail)
- **Installment Plan Wizard**: Create payment plan (future)
- **Bulk Payment Import**: Import payments from file (future)
- **Tax Report View**: Embedded in Financial Intelligence (future)

### UI Structure Notes
- Payments and Expenses are separate lists (different mental models)
- Financial Intelligence is a dashboard, not a list
- Summary cards always visible at top of list views
- Payment reminders are actions, not separate screens

### Roles
- **super_admin**: Full CRUD on payments and expenses
- **management**: Full CRUD, view Financial Intelligence
- **accounting**: Full CRUD on payments and expenses, view Financial Intelligence
- **operations**: Read-only access (for context)
- **sales**: Read-only access to payments (for student context)
- **instructor**: Read-only access to own expenses

### Navigation Placement
- **Sidebar**: "Finance" (expandable)
  - Payments
  - Expenses
  - Financial Intelligence (future, hidden in MVP)
- **No sub-navigation**: Detail views reached via list

### Risks
- **Risk**: Financial Intelligence could become overloaded
- **Mitigation**: Use tabs within dashboard for different views (Revenue, Expenses, Forecast)
- **Risk**: Payment list could become very long
- **Mitigation**: Strong filtering, default to recent/unpaid, pagination

---

## System: Communications

### Purpose
Manage communication providers, templates, automation, and message logs.

### MVP Features
- Provider configuration (Email, SMS)
- Template CRUD (Email, SMS)
- Message sending (manual)
- Message logs (read-only)

### Future Features
- Automation rules (triggers, conditions, actions)
- Template variables and personalization
- Campaign management
- A/B testing
- Delivery analytics
- Message scheduling

### Primary Screens

#### 1. Providers (Settings)
- **Layout**: Card-based configuration view
- **Header**: "Communication Providers" + "Configure" buttons
- **Content**: 
  - Provider cards (Email, SMS)
  - Status badges (Active/Inactive, Configured/Not Configured)
  - Configuration forms (expandable)
- **Actions**: Configure, Test Connection, View Status

#### 2. Templates List
- **Layout**: Standard list view with channel filter
- **Header**: "Templates" + "Add Template" button + Channel filter (All/Email/SMS)
- **Filters**: Channel, Status, Search
- **Content**: Table (Name, Channel, Status, Last Modified, Actions)
- **Actions**: View, Edit, Delete, Duplicate, Test Send

#### 3. Template Editor
- **Layout**: Single-page editor view
- **Content**:
  - Template form (name, channel, subject, body)
  - Variable reference guide
  - Preview panel
  - Test send form
- **Header**: Template name + Save button

#### 4. Message Logs
- **Layout**: Standard list view
- **Header**: "Message Logs" + Filters
- **Filters**: Channel, Status, Date range, Recipient, Search
- **Content**: Table (Recipient, Channel, Template, Status, Sent At, Actions)
- **Actions**: View Details, Resend (if failed)

#### 5. Automation Rules (Future)
- **Layout**: Standard list view
- **Header**: "Automation Rules" + "Create Rule" button
- **Content**: Table (Name, Trigger, Actions, Status, Actions)
- **Actions**: View, Edit, Delete, Enable/Disable

#### 6. Automation Rule Editor (Future)
- **Layout**: Wizard-style editor
- **Steps**: Trigger → Conditions → Actions → Review
- **Content**: Step-by-step form with preview

### Secondary Screens
- **Test Send Modal**: Send test message from template editor
- **Message Detail Modal**: View full message content and delivery status
- **Provider Test Modal**: Test provider connection

### UI Structure Notes
- Providers are in Settings (not main navigation)
- Templates are main navigation item
- Logs are read-only, embedded in Communications
- Automation is future, will be main navigation item when added
- Template editor is full-page (not modal) for better editing experience

### Roles
- **super_admin**: Full access to all communications features
- **operations**: Full access to templates, logs, send messages
- **management**: Read templates, view logs, send messages
- **sales**: Send messages, view own sent messages
- **accounting**: No access (unless payment reminders)
- **instructor**: No access

### Navigation Placement
- **Sidebar**: "Settings" → "Communications" (expandable)
  - Providers
  - Templates
  - Logs
  - Automation (future, hidden in MVP)
- **Alternative**: Could be top-level "Communications" if it grows (future decision)

### Risks
- **Risk**: Communications could outgrow Settings submenu
- **Mitigation**: Monitor usage, can promote to top-level sidebar item if needed
- **Risk**: Template editor could become complex
- **Mitigation**: Keep variables simple, advanced features in "Advanced" section
- **Risk**: Automation rules could become too complex for wizard
- **Mitigation**: Start with simple triggers, add complexity gradually

---

## System: Management & Intelligence

### Purpose
Provide dashboards, reports, analytics, and alerts for decision-making.

### MVP Features
- Role-based dashboards
- Basic metrics (student count, payment totals, etc.)
- Simple charts

### Future Features
- Custom reports builder
- Advanced analytics
- Alerts and notifications
- Data exports
- Scheduled reports
- Comparative analytics
- Predictive insights

### Primary Screens

#### 1. Management Dashboard
- **Layout**: Dashboard grid layout
- **Header**: "Management Dashboard" + Date range selector
- **Content**: 
  - Summary cards (Students, Classes, Revenue, Expenses)
  - Charts (Revenue trend, Student growth, Class occupancy)
  - Recent activity feed
  - Quick actions
- **Widgets**: Customizable (future)

#### 2. Operations Dashboard
- **Layout**: Dashboard grid layout
- **Header**: "Operations Dashboard"
- **Content**:
  - Summary cards (Active Classes, Upcoming Sessions, Pending Tasks)
  - Session calendar view
  - Recent enrollments
  - Communication queue

#### 3. Accounting Dashboard
- **Layout**: Dashboard grid layout
- **Header**: "Accounting Dashboard" + Date range selector
- **Content**:
  - Summary cards (Total Revenue, Outstanding, Expenses, Net)
  - Payment status breakdown
  - Expense by category
  - Recent transactions

#### 4. Reports & Analytics (Future)
- **Layout**: Tabbed view with report builder
- **Tabs**:
  - Saved Reports
  - Report Builder
  - Analytics
- **Content**: Report list, builder interface, chart gallery

#### 5. Alerts & Insights (Future)
- **Layout**: List view with filters
- **Header**: "Alerts & Insights" + Filters
- **Content**: Alert cards (type, severity, message, action)
- **Filters**: Type, Severity, Status, Date

### Secondary Screens
- **Report Builder Modal**: Create custom report (future)
- **Alert Detail Modal**: View alert details and history
- **Export Modal**: Export dashboard data (future)

### UI Structure Notes
- Dashboards are role-specific (different content per role)
- Reports are future, will be separate module
- Alerts are future, could be embedded in dashboards or separate
- All dashboards use same grid layout system
- Widgets are customizable (future)

### Roles
- **super_admin**: Access to all dashboards and reports
- **management**: Management dashboard, all reports
- **operations**: Operations dashboard, operational reports
- **accounting**: Accounting dashboard, financial reports
- **sales**: Sales dashboard (future), lead reports
- **instructor**: Personal dashboard (own classes, students)

### Navigation Placement
- **Sidebar**: "Dashboard" (role-specific, default landing page)
- **Sidebar**: "Reports" (future, top-level)
- **Sidebar**: "Alerts" (future, could be icon badge on Dashboard)

### Risks
- **Risk**: Dashboards could become cluttered
- **Mitigation**: Use tabs or collapsible sections, limit widgets per dashboard
- **Risk**: Reports module could become too complex
- **Mitigation**: Start with pre-built reports, add builder later
- **Risk**: Alerts could overwhelm users
- **Mitigation**: Filterable, groupable, dismissible, severity-based

---

## System: System & Platform

### Purpose
System configuration, integrations, security, and platform management.

### MVP Features
- Settings (General, Organization, Users & Roles, Security)
- Integrations (Email, SMS providers)
- Custom fields
- User management

### Future Features
- Advanced security (2FA, SSO)
- API management
- Webhook configuration
- Audit logs
- Backup and restore
- System health monitoring

### Primary Screens

#### 1. Settings (Multiple Pages)
- **Layout**: Sidebar navigation with content area
- **Structure**: Left sidebar + main content (already implemented)
- **Sections**:
  - General
  - Organization
  - Users & Roles
  - Security
  - Communications (Providers, Templates, Logs)
  - Scheduling
  - Finance (Payments, Expenses, Taxes)
  - Custom Fields
  - Integrations
  - Advanced

#### 2. User Management (Settings)
- **Layout**: List view within Settings
- **Content**: User list with role badges, status, actions
- **Actions**: Edit, Deactivate, Reset Password

#### 3. Role Management (Settings)
- **Layout**: Card-based view within Settings
- **Content**: Role cards with permissions summary (read-only in MVP)
- **Note**: Roles are system-defined, not editable in MVP

#### 4. Integrations (Settings)
- **Layout**: Card-based view within Settings
- **Content**: Integration cards (Email, SMS, future: Payment gateways, etc.)
- **Actions**: Configure, Test, View Status

### Secondary Screens
- **User Edit Modal**: Edit user details
- **Integration Config Modal**: Configure integration
- **Custom Field Editor**: Add/edit custom fields

### UI Structure Notes
- All settings use the same sidebar + content layout
- Settings are grouped logically (System, Operations, Finance, Platform)
- Each settings page follows standard card-based layout
- Integrations are embedded in Settings, not separate module

### Roles
- **super_admin**: Full access to all settings
- **management**: Access to Organization, Finance settings
- **operations**: Access to Communications, Scheduling settings
- **accounting**: Access to Finance settings only
- **sales**: No settings access
- **instructor**: No settings access

### Navigation Placement
- **Sidebar**: "Settings" (top-level, expandable sidebar within)
- **No sub-navigation**: Settings uses its own sidebar navigation

### Risks
- **Risk**: Settings sidebar could become too long
- **Mitigation**: Group settings, use collapsible sections, search
- **Risk**: Settings pages could become inconsistent
- **Mitigation**: Use standardized SettingsCard component
- **Risk**: Integrations could outgrow Settings
- **Mitigation**: Can promote to top-level if needed, but keep in Settings for MVP

---

## System: Parent & Student Experience (Later Phase)

### Purpose
Self-service portals for parents and students to view information and interact.

### MVP Features
- (Deferred to future phase)

### Future Features
- Parent portal (view student progress, payments, schedule)
- Student portal (view classes, assignments, grades)
- Mobile app (iOS/Android)
- Notifications (push, email, SMS)
- Online payment
- Class registration

### Primary Screens (Future)
- Parent Dashboard
- Student Dashboard
- Payment Portal
- Class Registration
- Progress Reports

### UI Structure Notes
- Separate application/domain (not in admin dashboard)
- Mobile-responsive web app
- Native mobile apps (future)

### Roles
- **parent**: Access to own children's data
- **student**: Access to own data

### Navigation Placement
- **Separate Application**: Not in admin sidebar
- **Mobile App**: Native apps (future)

### Risks
- **Risk**: Portal could become feature-heavy
- **Mitigation**: Start with read-only views, add actions gradually
- **Risk**: Mobile app could duplicate web features
- **Mitigation**: Use shared API, mobile-first design for app

---

## MVP UI Surface Summary

### Primary Screens (MVP)
1. **Academic Operations** (8 screens)
   - Students List, Student Profile, Classes List, Class Detail, Sessions List, Session Detail, Instructors List, Instructor Profile

2. **Sales & Growth** (2 screens)
   - Leads List, Lead Detail

3. **Finance & Cash Control** (4 screens)
   - Payments List, Payment Detail, Expenses List, Expense Detail

4. **Communications** (4 screens)
   - Providers (Settings), Templates List, Template Editor, Message Logs

5. **Management & Intelligence** (3 screens)
   - Management Dashboard, Operations Dashboard, Accounting Dashboard

6. **System & Platform** (1 screen with multiple pages)
   - Settings (with sidebar navigation)

**Total MVP Primary Screens: 22 screens**

### Secondary Screens (MVP)
- Various modals for actions (enrollment, conversion, reminders, etc.)
- Estimated: 10-15 modals/wizards

---

## Future UI Expansion Plan

### Phase 2 (Near-term)
- Sales Pipeline view
- Financial Intelligence dashboard
- Automation Rules (list + editor)
- Reports module (saved reports + builder)
- Alerts & Insights

**Estimated Additional Screens: 8-10**

### Phase 3 (Mid-term)
- Attendance tracking (embedded in Sessions)
- Grade management (embedded in Classes)
- Advanced analytics
- Custom report builder
- Parent/Student portals (separate app)

**Estimated Additional Screens: 5-7 (plus portal screens)**

### Phase 4 (Long-term)
- Mobile apps
- Advanced automation
- Predictive analytics
- Advanced security features

**Estimated Additional Screens: Variable**

---

## Navigation Stability Assessment

### Current Sidebar Structure (MVP)
```
- Dashboard (role-specific)
- Academics
  - Students
  - Classes
  - Sessions
  - Instructors
- Sales
  - Leads
- Finance
  - Payments
  - Expenses
- Settings
  - [Settings sidebar with multiple pages]
```

### Future Sidebar Structure (Projected)
```
- Dashboard (role-specific)
- Academics
  - Students
  - Classes
  - Sessions
  - Instructors
- Sales
  - Leads
  - Pipeline (future)
- Finance
  - Payments
  - Expenses
  - Financial Intelligence (future)
- Communications (future, if promoted from Settings)
  - Templates
  - Automation
  - Logs
- Reports (future)
  - Saved Reports
  - Analytics
- Settings
  - [Settings sidebar]
```

### Stability Assessment
✅ **Stable**: Core navigation structure (Academics, Sales, Finance) will not change  
✅ **Stable**: Settings structure is self-contained and scalable  
⚠️ **Monitor**: Communications may need promotion from Settings if it grows  
✅ **Stable**: Future additions (Reports, Pipeline) fit existing pattern  
✅ **Stable**: No nested sidebars needed (2-level max maintained)

---

## Risks & Mitigation

### Risk 1: Screen Overload
**Risk**: Detail screens (Student Profile, Class Detail) could become cluttered as features are added.

**Mitigation**:
- Use tabs for logical grouping
- Move advanced features to embedded components, not new tabs
- Implement progressive disclosure (show advanced options on demand)
- Set maximum tab count (5-6 tabs max)

### Risk 2: Navigation Depth
**Risk**: Future features could require 3+ level navigation.

**Mitigation**:
- Enforce 2-level maximum (Sidebar → Page)
- Use tabs within pages for related views
- Use modals/drawers for actions, not navigation
- Embed related data instead of separate screens

### Risk 3: Settings Growth
**Risk**: Settings sidebar could become too long.

**Mitigation**:
- Group settings logically (already implemented)
- Use collapsible sections
- Add search functionality
- Consider promoting high-usage settings to top-level

### Risk 4: Role Complexity
**Risk**: Role-based visibility could become too complex to maintain.

**Mitigation**:
- Use role intent, not granular permissions
- Group roles by purpose (admin, operations, finance, etc.)
- Document role → feature mapping clearly
- Consider role templates for future custom roles

### Risk 5: Feature Creep
**Risk**: New features could break established patterns.

**Mitigation**:
- Enforce screen standardization (all lists use same component)
- Review new features against architecture principles
- Document exceptions and rationale
- Regular architecture reviews

### Risk 6: Mobile Responsiveness
**Risk**: Desktop-first design may not translate well to mobile.

**Mitigation**:
- Use responsive design patterns from start
- Test on mobile devices regularly
- Consider mobile-specific layouts for complex screens
- Plan for native apps separately (don't force web UI into mobile)

---

## Implementation Readiness

### Screen Components Needed
1. **Standard List View Component**
   - Header with title + primary action
   - Filters/search bar
   - Table with consistent styling
   - Pagination
   - Bulk actions (future)

2. **Standard Detail View Component**
   - Header with title + actions
   - Tab navigation
   - Content area
   - Sidebar for quick actions (optional)

3. **Standard Dashboard Component**
   - Grid layout system
   - Widget components (cards, charts)
   - Date range selector
   - Customizable layout (future)

4. **Standard Settings Page Component**
   - SettingsCard component (already exists)
   - Form sections
   - Save/Cancel actions
   - Confirmation modals

### Data Architecture Notes
- **Students**: Core entity, referenced by Classes, Sessions, Payments
- **Classes**: Core entity, contains Students, Sessions
- **Sessions**: Core entity, belongs to Class, has Instructor
- **Instructors**: Core entity, referenced by Sessions, Expenses
- **Leads**: Independent entity, converts to Student
- **Payments**: Belongs to Student, read-only in Academics
- **Expenses**: Independent entity, can reference Instructor
- **Templates**: Independent entity, used by Communications
- **Users**: System entity, managed in Settings

### API Endpoints Needed
- Standard CRUD endpoints for all entities
- List endpoints with filtering/pagination
- Detail endpoints with related data
- Action endpoints (convert, enroll, send, etc.)
- Dashboard data endpoints (aggregated metrics)

---

## Conclusion

This architecture provides:

1. ✅ **Clear Feature → Screen Mapping**: Every feature has a defined UI location
2. ✅ **Scalable Structure**: Future features fit existing patterns
3. ✅ **Role-Aware Design**: UI adapts to user role without complexity
4. ✅ **Implementation-Ready**: Clear component requirements and data model
5. ✅ **Resistant to Creep**: Principles and patterns prevent ad-hoc additions

The system is designed to grow from 22 MVP screens to 30-40 screens without requiring navigation restructuring or UI pattern changes.

---

**Document Status**: Ready for Design & Engineering Review  
**Next Steps**: 
1. Review with product team
2. Create detailed wireframes for MVP screens
3. Implement standard components
4. Build MVP screens following this architecture

