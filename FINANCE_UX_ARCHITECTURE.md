# Finance System (MV-OS) - Information Architecture & UX Design

## Sidebar IA

### Finance Navigation Structure

```
Finance
 ├─ Overview
 ├─ Revenue
 │   ├─ Invoices
 │   ├─ Subscriptions
 │   └─ Deferred Revenue
 ├─ Cash
 │   ├─ Payments
 │   ├─ Cash Accounts
 │   └─ Transfers
 ├─ Expenses
 │   ├─ Expenses
 │   ├─ Categories
 │   └─ Approvals
 ├─ Reconciliation
 ├─ Reports
 │   ├─ Profit & Loss
 │   ├─ Cash Flow
 │   ├─ Class Profitability
 │   └─ Instructor Costs
 └─ Settings
     ├─ Payment Methods
     ├─ Financial Periods
     └─ Taxes
```

### Why Revenue and Cash are Separated

**Revenue (Expected Money):**
- Represents **commitments** and **obligations**
- Created when: Student enrolls, subscription starts, class is scheduled
- Status: Issued, Partially Paid, Paid, Overdue, Cancelled
- **Purpose**: Track what we expect to receive, manage collections, identify overdue accounts
- **Mental Model**: "What should we receive?"

**Cash (Actual Money):**
- Represents **physical/digital money received**
- Created when: Payment physically received (cash, bank transfer, wallet)
- Status: Received, Pending, Reversed, Failed
- **Purpose**: Track actual cash position, manage bank accounts, reconcile with bank statements
- **Mental Model**: "What did we actually receive?"

**Separation Benefits:**
1. **Clear Mental Model**: Users understand the difference between "what we're owed" vs "what we have"
2. **Collection Management**: Outstanding invoices are visible separately from received cash
3. **Cash Flow Planning**: Can see expected cash (revenue) vs actual cash position
4. **Reconciliation**: Easy to compare expected vs actual for period reconciliation
5. **Audit Trail**: Clear separation of commitments (revenue) from actual transactions (cash)

**Example Scenario:**
- Student enrolls → Invoice created (Revenue: Expected)
- Student pays cash → Payment recorded (Cash: Actual)
- Payment allocated to invoice → Invoice status updates (Revenue: Partially Paid → Paid)
- Cash account balance increases (Cash: Actual)

### Why Reconciliation is a Top-Level Item

**Reconciliation is Critical Because:**
1. **Trust Building**: Management needs to verify that expected revenue matches actual cash
2. **Error Detection**: Identifies missing payments, duplicate entries, data entry errors
3. **Period Closing**: Required workflow before closing financial periods
4. **Audit Requirement**: External auditors need reconciliation records
5. **Decision Making**: Management can't make decisions without reconciled data

**Reconciliation Workflow:**
- Monthly process (end of month)
- Compare expected revenue (invoices) vs actual cash (payments)
- Identify discrepancies (missing payments, extra payments, errors)
- Create adjustments with mandatory reasons
- Lock period after reconciliation complete

**Why Not Under Reports:**
- Reconciliation is an **action** (workflow), not a report (read-only)
- Requires write access (create adjustments)
- Has approval workflow
- Period locking is a reconciliation action, not a report feature

### Why Reports are Read-Only

**Reports are Read-Only Because:**
1. **Data Integrity**: Reports reflect actual transactions; editing reports would create confusion
2. **Audit Safety**: Reports must match source data; no manual overrides
3. **Single Source of Truth**: All changes must go through transaction entry (invoices, payments, expenses)
4. **Role Separation**: Accounting enters data; Management views reports; no overlap
5. **Version Control**: Reports are snapshots; regenerating reports shows current state

**If Reports Were Editable:**
- Risk of data inconsistency
- Audit trail confusion
- Multiple sources of truth
- Management could "fix" numbers without proper accounting workflow

**Correct Workflow:**
- If report shows wrong number → Fix source transaction (invoice, payment, expense)
- Regenerate report → Shows corrected number
- Audit trail maintained in source transaction, not in report

---

## KPIs

### Executive / Management KPIs

**Purpose**: High-level financial health for strategic decisions

1. **Total Revenue (MTD)**
   - **Definition**: Sum of all invoices issued this month (expected revenue)
   - **Calculation**: `SUM(invoices.totalAmount WHERE issueDate IN current_month AND status != 'cancelled')`
   - **Why**: Shows business growth, enrollment trends
   - **Decision**: "Are we growing? Should we invest more?"

2. **Net Cash Position**
   - **Definition**: Total cash across all active cash accounts
   - **Calculation**: `SUM(cashAccounts.balance WHERE isActive = true)`
   - **Why**: Shows actual money available for operations
   - **Decision**: "Can we pay bills? Do we need financing?"

3. **Gross Margin %**
   - **Definition**: (Revenue - Direct Costs) / Revenue * 100
   - **Calculation**: `(Total Revenue - Instructor Costs) / Total Revenue * 100`
   - **Why**: Shows profitability before overhead
   - **Decision**: "Are we pricing correctly? Is the business model sustainable?"

4. **Burn Rate**
   - **Definition**: Average monthly expenses (last 3 months)
   - **Calculation**: `AVG(monthly_expenses WHERE period IN last_3_months)`
   - **Why**: Shows how fast we're spending money
   - **Decision**: "How long until we run out of cash?"

5. **Cash Runway (months)**
   - **Definition**: Net Cash Position / Burn Rate
   - **Calculation**: `Net Cash Position / Burn Rate`
   - **Why**: Shows months of operations remaining at current burn rate
   - **Decision**: "Do we need to raise money? Cut costs? Increase revenue?"

### Operational Finance KPIs

**Purpose**: Day-to-day finance operations and collections

1. **Outstanding Receivables**
   - **Definition**: Sum of unpaid invoices (issued + partially paid)
   - **Calculation**: `SUM(invoices.totalAmount WHERE status IN ['issued', 'partially_paid', 'overdue'])`
   - **Why**: Shows money owed to us
   - **Decision**: "Who needs follow-up? What's our collection strategy?"

2. **Collection Rate %**
   - **Definition**: (Payments Received / Invoices Issued) * 100
   - **Calculation**: `(SUM(payments.amount) / SUM(invoices.totalAmount)) * 100`
   - **Why**: Shows how effective we are at collecting payments
   - **Decision**: "Do we need better payment terms? More follow-up?"

3. **Deferred Revenue**
   - **Definition**: Money received for future services (prepaid subscriptions)
   - **Calculation**: `SUM(payments.amount WHERE allocated_to_future_invoices)`
   - **Why**: Shows future obligations (we owe services)
   - **Decision**: "How much service do we owe? Can we recognize this revenue?"

4. **Expense Growth %**
   - **Definition**: Month-over-month expense growth
   - **Calculation**: `(Current Month Expenses - Previous Month Expenses) / Previous Month Expenses * 100`
   - **Why**: Shows if expenses are growing faster than revenue
   - **Decision**: "Are we spending too much? Is growth sustainable?"

5. **Instructor Cost Ratio**
   - **Definition**: Instructor Costs / Total Revenue * 100
   - **Calculation**: `SUM(expenses.amount WHERE category = 'instructor') / Total Revenue * 100`
   - **Why**: Shows if instructor costs are sustainable
   - **Decision**: "Are we paying instructors too much? Should we adjust pricing?"

### Risk & Control KPIs

**Purpose**: Identify financial risks and control issues

1. **Unreconciled Transactions**
   - **Definition**: Count of payments/expenses not yet reconciled in current period
   - **Calculation**: `COUNT(transactions WHERE period = current AND reconciled = false)`
   - **Why**: Shows reconciliation backlog (risk of errors)
   - **Decision**: "Do we need more accounting resources? Is reconciliation process broken?"

2. **Late Payments Count**
   - **Definition**: Count of invoices past due date
   - **Calculation**: `COUNT(invoices WHERE dueDate < today AND status != 'paid')`
   - **Why**: Shows collection risk
   - **Decision**: "Do we need better payment terms? More aggressive follow-up?"

3. **Expense Approval Delays**
   - **Definition**: Average days from expense creation to approval
   - **Calculation**: `AVG(approvedAt - createdAt WHERE status = 'approved')`
   - **Why**: Shows if approval workflow is bottleneck
   - **Decision**: "Is approval process too slow? Do we need more approvers?"

4. **Negative Margin Classes**
   - **Definition**: Count of classes where revenue < instructor cost
   - **Calculation**: `COUNT(classes WHERE revenue_per_class < instructor_cost_per_class)`
   - **Why**: Shows unprofitable classes (need pricing or cost adjustment)
   - **Decision**: "Should we cancel these classes? Increase prices? Reduce instructor costs?"

5. **Locked Period Violations**
   - **Definition**: Count of transactions created/modified in locked periods
   - **Calculation**: `COUNT(transactions WHERE period.status = 'locked' AND created/modified)`
   - **Why**: Shows audit control violations (should be zero)
   - **Decision**: "Do we need better access controls? Training?"

### KPIs That Should NOT Be Shown

**1. "Total Students" (Finance Context)**
   - **Why**: This is an Academic Ops metric, not Finance
   - **Where it belongs**: Academic Operations dashboard
   - **Finance equivalent**: "Total Revenue" or "Active Subscriptions"

**2. "Average Class Size"**
   - **Why**: Operational metric, not financial
   - **Where it belongs**: Academic Operations dashboard
   - **Finance equivalent**: "Revenue per Class" or "Class Profitability"

**3. "Conversion Rate" (Lead to Student)**
   - **Why**: This is a CRM/Sales metric
   - **Where it belongs**: CRM dashboard
   - **Finance equivalent**: "Revenue per Lead" (if needed)

**4. "Total Expenses" (Without Context)**
   - **Why**: Raw number without comparison is meaningless
   - **Better**: "Expense Growth %" or "Expenses vs Budget"
   - **Show with**: Revenue comparison, period comparison, category breakdown

**5. "Cash Balance" (Single Account)**
   - **Why**: Management needs total cash position, not individual accounts
   - **Better**: "Net Cash Position" (sum of all accounts)
   - **Individual accounts**: Show in Cash Accounts detail page, not dashboard

**6. "Pending Payments" (Count Only)**
   - **Why**: Count without amount is not actionable
   - **Better**: "Outstanding Receivables" (amount) or "Late Payments" (count + amount)
   - **Show with**: Amount, due dates, aging analysis

**7. "Profit" (Without Margin)**
   - **Why**: Absolute profit without margin % doesn't show efficiency
   - **Better**: "Gross Margin %" or "Net Profit Margin %"
   - **Show with**: Revenue context, period comparison

**8. "Revenue Growth" (Without Expenses)**
   - **Why**: Revenue growth alone doesn't show if business is sustainable
   - **Better**: "Gross Margin %" or "Cash Runway"
   - **Show with**: Expense growth, margin trends

---

## Reconciliation UX

### Reconciliation Workflow

**Step 1: Period Selection**
- **UI**: Dropdown with current month highlighted, previous months (closed/locked), future months (read-only)
- **Default**: Current month (if open) or most recent closed month
- **Rules**: 
  - Only open and closed periods can be selected
  - Locked periods are read-only (view only)
  - Future periods show "Not Started"

**Step 2: Expected vs Actual Summary**
- **UI**: Large cards showing:
  - Expected Revenue (sum of invoices in period)
  - Actual Revenue (sum of payments in period)
  - Variance (Expected - Actual)
  - Status badge (Matched / Discrepancy / Needs Review)
- **Color Coding**:
  - Green: Variance < 1% (acceptable)
  - Yellow: Variance 1-5% (needs review)
  - Red: Variance > 5% (requires investigation)

**Step 3: Reconciliation Table**
- **UI**: Table with columns:
  - **Invoice #** (link to invoice detail)
  - **Student Name**
  - **Expected Amount** (invoice total)
  - **Actual Amount** (sum of allocated payments)
  - **Variance** (Expected - Actual)
  - **Status** (Matched / Missing / Extra / Partial)
  - **Actions** (View Details / Create Adjustment)
- **Filtering**: 
  - Show All / Matched Only / Discrepancies Only
  - Search by invoice number, student name
- **Sorting**: By variance (largest first), by status, by date

**Step 4: Adjustment Modal (Controlled)**
- **Trigger**: Click "Create Adjustment" on discrepancy row
- **Fields**:
  - **Type** (dropdown): Adjustment, Correction, Write-off, Reversal
  - **Amount** (read-only, pre-filled from variance)
  - **Reason** (textarea, required, min 20 characters)
  - **Related Transaction** (auto-linked to invoice/payment)
  - **Approval Required** (checkbox, checked by default for amounts > threshold)
- **Validation**:
  - Reason is mandatory and must be descriptive
  - Adjustment amount cannot exceed variance
  - Cannot adjust locked periods
- **Audit Log**: 
  - Automatically logs: User, timestamp, type, amount, reason
  - Creates ReconciliationRecord in database
  - Links to related invoice/payment

**Step 5: Period Locking**
- **UI**: Button "Lock Period" (only visible to super_admin)
- **Rules**:
  - Period must be closed first
  - All adjustments must be approved
  - Cannot lock if variance > threshold (configurable)
- **Confirmation**: 
  - Modal: "Are you sure? Locked periods cannot be modified."
  - Requires reason for locking
- **After Locking**:
  - Period status changes to "locked"
  - All transactions in period become read-only
  - Reports for locked period are final
  - Only super_admin can unlock (with reason logged)

### How Reconciliation Builds Trust

**1. Transparency**
- Management can see exactly what was expected vs what was received
- No hidden adjustments or unexplained discrepancies
- All adjustments are visible with reasons

**2. Accountability**
- Every adjustment requires a reason
- Approval workflow ensures oversight
- Audit log shows who made what changes and when

**3. Accuracy**
- Reconciliation catches errors (data entry, missing payments, duplicates)
- Period locking prevents retroactive changes
- Final reports are based on reconciled data

**4. Decision Confidence**
- Management can trust the numbers because they're reconciled
- External auditors can verify reconciliation process
- Investors can see financial controls are in place

### How Adjustments are Controlled

**1. Mandatory Reason**
- Every adjustment requires a descriptive reason (min 20 characters)
- Reason is stored in audit log
- Cannot create adjustment without reason

**2. Approval Workflow**
- Adjustments above threshold require management approval
- Approval history is tracked
- Rejected adjustments cannot be applied

**3. Type Restrictions**
- Only specific types allowed: Adjustment, Correction, Write-off, Reversal
- Each type has specific use case and rules
- Cannot create arbitrary adjustments

**4. Amount Validation**
- Adjustment amount cannot exceed variance
- Cannot create negative adjustments without proper type
- System prevents impossible adjustments

**5. Period Locking**
- Locked periods cannot be adjusted
- Prevents retroactive changes after period close
- Ensures audit trail integrity

### How Audit Safety is Guaranteed

**1. Immutable Audit Log**
- Every transaction, adjustment, and period lock is logged
- Logs include: User, timestamp, action, amount, reason
- Logs cannot be deleted or modified

**2. Period Locking**
- Locked periods cannot be modified
- Prevents changes after external audit
- Ensures reports match audit records

**3. Role-Based Access**
- Only accounting can create adjustments
- Only management can approve adjustments
- Only super_admin can lock/unlock periods
- Operations is read-only

**4. Reconciliation Records**
- All adjustments create ReconciliationRecord
- Records link to related transactions
- Records include approval status and history

**5. Export Capability**
- All reconciliation data can be exported
- Export includes audit log
- Export format is audit-friendly (CSV, PDF)

---

## Reports Architecture

### Standard Report UI Structure

**1. Report Header**
- **Title**: Report name (e.g., "Profit & Loss Statement")
- **Description**: What the report shows, period covered
- **Last Updated**: Timestamp of when report was generated
- **Export Buttons**: PDF, Excel (read-only exports)

**2. Period Selector**
- **UI**: Dropdown with available periods
- **Options**: Current month, Previous months, Custom range (future)
- **Default**: Current month
- **Rules**: 
  - Can select any closed or locked period
  - Cannot select future periods
  - Custom range limited to 12 months

**3. Filters (Optional)**
- **Location**: Collapsible section below period selector
- **Available Filters** (report-specific):
  - **Branch/Location**: Filter by physical location
  - **Program/Class Type**: Filter by program (AI, Robotics, Coding, General)
  - **Instructor**: Filter by specific instructor
  - **Student**: Filter by specific student (for student-specific reports)
- **Filter Rules**:
  - Filters are optional (can view all data)
  - Multiple filters can be applied
  - Filters persist in URL (shareable links)
  - Clear filters button

**4. Report Table**
- **Structure**: 
  - Header row with column names
  - Data rows (read-only)
  - Summary row at bottom (totals, averages)
- **Features**:
  - Sortable columns (click header)
  - Expandable rows (for drill-down, if applicable)
  - Row highlighting (for negative values, thresholds)
  - Pagination (if > 100 rows)

**5. Summary Section**
- **Location**: Below table or in sidebar
- **Content**: 
  - Key metrics (totals, averages, percentages)
  - Period comparison (vs previous period, if available)
  - Visual indicators (trends, warnings)

**6. Export Options**
- **PDF Export**:
  - Includes header, filters, table, summary
  - Formatted for printing
  - Includes timestamp and user who generated
- **Excel Export**:
  - Raw data in spreadsheet format
  - Includes all columns and rows
  - Suitable for further analysis

### Required Reports (MVP)

#### 1. Profit & Loss Statement

**Purpose**: Shows revenue, expenses, and profit for a period

**Structure**:
```
Revenue
  ├─ Class Fees
  ├─ Subscriptions
  └─ Other Revenue
Total Revenue

Expenses
  ├─ Instructor Costs
  ├─ Rent
  ├─ Marketing
  ├─ Utilities
  ├─ Operations
  └─ Other Expenses
Total Expenses

Net Profit (Revenue - Expenses)
Gross Margin % ((Revenue - Direct Costs) / Revenue * 100)
```

**Filters**: Period (required), Location (optional), Program (optional)

**Export**: PDF (formatted), Excel (raw data)

**Access**: Management, Accounting, Operations (read-only)

---

#### 2. Cash Flow Statement

**Purpose**: Shows cash inflows and outflows for a period

**Structure**:
```
Cash Inflows
  ├─ Payments Received
  ├─ Bank Transfers
  └─ Other Inflows
Total Inflows

Cash Outflows
  ├─ Expenses Paid
  ├─ Instructor Payouts
  └─ Other Outflows
Total Outflows

Net Cash Flow (Inflows - Outflows)
Opening Balance (previous period closing)
Closing Balance (opening + net flow)
```

**Filters**: Period (required), Cash Account (optional)

**Export**: PDF, Excel

**Access**: Management, Accounting, Operations (read-only)

---

#### 3. Class Profitability Report

**Purpose**: Shows revenue and costs per class to identify profitable/unprofitable classes

**Structure**:
```
Class Name | Location | Revenue | Instructor Cost | Net Profit | Margin %
[Class 1]  | [Loc]    | [Amt]   | [Amt]          | [Amt]     | [%]
[Class 2]  | [Loc]    | [Amt]   | [Amt]          | [Amt]     | [%]
...
Total      |          | [Amt]   | [Amt]          | [Amt]     | [%]
```

**Filters**: Period (required), Location (optional), Program (optional), Instructor (optional)

**Export**: PDF, Excel

**Access**: Management, Accounting, Operations (read-only)

**Special Features**:
- Highlight negative margin classes (red)
- Sort by margin % (lowest first)
- Show class utilization (students enrolled / capacity)

---

#### 4. Instructor Cost Report

**Purpose**: Shows instructor costs and efficiency metrics

**Structure**:
```
Instructor Name | Sessions | Hours | Total Cost | Cost per Session | Cost per Hour | Revenue Generated | Net Contribution
[Instructor 1]  | [Count]  | [Hrs] | [Amt]      | [Amt]            | [Amt]         | [Amt]            | [Amt]
[Instructor 2]  | [Count]  | [Hrs] | [Amt]      | [Amt]            | [Amt]         | [Amt]            | [Amt]
...
Total           | [Count]  | [Hrs] | [Amt]      | [Amt]            | [Amt]         | [Amt]            | [Amt]
```

**Filters**: Period (required), Instructor (optional), Cost Type (hourly/monthly)

**Export**: PDF, Excel

**Access**: Management, Accounting, Operations (read-only)

**Special Features**:
- Show cost model (hourly vs monthly)
- Calculate efficiency (revenue / cost)
- Highlight high-cost, low-revenue instructors

---

### Report Access Rules

**Accounting**:
- Can view all reports
- Can export all reports
- Cannot edit reports (read-only)

**Management**:
- Can view all reports
- Can export all reports
- Cannot edit reports (read-only)

**Operations**:
- Can view all reports (except sensitive financial details)
- Can export reports (filtered)
- Cannot edit reports (read-only)

**Sales**:
- No access to Finance reports
- Finance data not relevant to sales workflow

**Super Admin**:
- Full access to all reports
- Can export all reports
- Cannot edit reports (read-only, but can unlock periods if needed)

---

## Role Access

### Accounting

**Full Access**:
- Create/edit invoices
- Record payments
- Allocate payments to invoices
- Create/edit expenses
- Approve expenses (if assigned)
- Create cash accounts
- Create expense categories
- Create reconciliation adjustments
- Close financial periods
- View all reports
- Export all reports

**Restrictions**:
- Cannot lock periods (super_admin only)
- Cannot unlock locked periods (super_admin only)
- Cannot delete transactions (only reverse with reason)

---

### Management

**View + Approve**:
- View all financial data (read-only)
- Approve expenses (if approval required)
- Approve reconciliation adjustments (if threshold exceeded)
- View all reports
- Export all reports
- View reconciliation (read-only, cannot create adjustments)

**Restrictions**:
- Cannot create invoices (unless specifically assigned)
- Cannot record payments (unless specifically assigned)
- Cannot create expenses (unless specifically assigned)
- Cannot close/lock periods (unless super_admin)
- Cannot create adjustments (accounting only)

---

### Operations

**Read-Only**:
- View Finance Overview (dashboard)
- View payments list (read-only)
- View expenses list (read-only, own expenses if created)
- View cash accounts (read-only)
- View reports (read-only, filtered)
- Export reports (filtered)

**Restrictions**:
- Cannot create invoices
- Cannot record payments
- Cannot create expenses (unless specifically assigned for operational expenses)
- Cannot approve expenses
- Cannot access reconciliation
- Cannot view sensitive financial details (deferred revenue, profit margins in some contexts)

---

### Sales

**No Access**:
- No Finance module access
- Finance data not relevant to sales workflow
- Sales uses CRM for lead management
- Finance handles revenue after enrollment

**Rationale**:
- Sales focuses on lead conversion, not financial transactions
- Finance handles invoicing and payments after enrollment
- Separation of concerns: Sales = relationships, Finance = money

---

### Super Admin

**Full Control + System Admin**:
- All Accounting permissions
- Lock/unlock periods
- Override approval requirements (emergency only)
- System configuration (payment methods, tax rates, period settings)
- Full audit log access
- Can unlock locked periods (with reason logged)

**Special Powers**:
- Period locking (audit requirement)
- System-level settings
- Emergency overrides (with audit trail)

---

## What Finance Does NOT Do

### Not in MVP

**1. Payroll Automation**
- **What**: Automatic payroll processing, tax calculations, payslip generation
- **Why Not**: Complex, requires tax rules, integration with payroll providers
- **What We Do Instead**: Calculate instructor costs, create expense entries
- **Future**: Phase 2 or Phase 3

**2. Bank API Integration**
- **What**: Automatic bank statement import, transaction matching
- **Why Not**: Bank APIs are complex, require compliance, vary by bank
- **What We Do Instead**: Manual payment entry, manual reconciliation
- **Future**: Phase 3 (if bank APIs become available)

**3. Forecasting & Budgeting**
- **What**: Revenue forecasts, expense budgets, variance analysis
- **Why Not**: Requires historical data, assumptions, complex models
- **What We Do Instead**: Historical reports, current period analysis
- **Future**: Phase 2 or Phase 3

**4. Tax Calculation & Filing**
- **What**: Automatic tax calculation, tax return generation
- **Why Not**: Tax rules are complex, vary by jurisdiction, require tax expertise
- **What We Do Instead**: Tax amount field (manual entry), export data for external tax filing
- **Future**: Phase 3 (if tax rules can be codified)

**5. Multi-Currency Support**
- **What**: Handle multiple currencies, currency conversion
- **Why Not**: Complex, requires exchange rates, conversion rules
- **What We Do Instead**: Single currency (EGP) only
- **Future**: Phase 3 (if multi-currency needed)

**6. Advanced Analytics**
- **What**: Predictive analytics, trend analysis, AI-powered insights
- **Why Not**: Requires data science, complex algorithms
- **What We Do Instead**: Basic reports, period comparison
- **Future**: Phase 3

**7. Credit Notes & Refunds**
- **What**: Create credit notes, process refunds
- **Why Not**: Complex workflow, requires approval, affects cash flow
- **What We Do Instead**: Payment reversal, manual refund tracking
- **Future**: Phase 2

**8. Recurring Expenses Automation**
- **What**: Automatic recurring expense creation (monthly rent, subscriptions)
- **Why Not**: Requires scheduling, template management
- **What We Do Instead**: Manual expense entry each period
- **Future**: Phase 2

---

### Belongs to External Systems

**1. Full Accounting System (Ledger, Journal Entries)**
- **What**: Double-entry bookkeeping, general ledger, chart of accounts
- **Why Not**: MV-OS is operational finance, not full accounting
- **What We Do Instead**: Export data to external accounting system (QuickBooks, Xero, etc.)
- **Integration**: CSV/Excel export, API export (future)

**2. Tax Filing**
- **What**: Generate tax returns, file with tax authorities
- **Why Not**: Requires tax expertise, jurisdiction-specific rules
- **What We Do Instead**: Provide data export for external tax filing
- **Integration**: Export financial data for tax accountant

**3. Bank Reconciliation (Advanced)**
- **What**: Automatic bank statement matching, transaction categorization
- **Why Not**: Requires bank API integration, complex matching algorithms
- **What We Do Instead**: Manual reconciliation, manual bank statement import (future)
- **Integration**: Manual CSV import (future Phase 2)

**4. Payroll Processing**
- **What**: Calculate payroll, deduct taxes, generate payslips, process payments
- **Why Not**: Complex, requires tax rules, compliance, payroll provider integration
- **What We Do Instead**: Calculate instructor costs, create expense entries
- **Integration**: Export instructor cost data for payroll system (future)

---

## Risks & Mitigations

### Risk 1: Data Entry Errors

**Risk**: Manual data entry leads to incorrect amounts, duplicate entries, missing transactions

**Mitigation**:
- **Validation**: Amount validation, duplicate detection, required fields
- **Reconciliation**: Monthly reconciliation catches errors
- **Audit Trail**: All changes logged with user and timestamp
- **Approval Workflow**: Large amounts require approval
- **Period Locking**: Locked periods prevent retroactive changes

---

### Risk 2: Unreconciled Periods

**Risk**: Periods not reconciled lead to inaccurate financial reports

**Mitigation**:
- **Reconciliation Dashboard**: Shows unreconciled periods prominently
- **Period Status**: Clear status indicators (open, closed, locked)
- **Workflow Enforcement**: Cannot close period without reconciliation
- **Alerts**: Notify management of unreconciled periods
- **Role-Based Access**: Only accounting can reconcile, only super_admin can lock

---

### Risk 3: Cash Account Balance Drift

**Risk**: Cash account balances don't match actual bank balances due to missing transactions or errors

**Mitigation**:
- **Manual Reconciliation**: Regular manual reconciliation with bank statements
- **Balance Tracking**: Show balance history, transaction history
- **Transfer Tracking**: Track transfers between accounts
- **Adjustment Records**: All balance adjustments require reason and approval
- **Audit Log**: All balance changes logged

---

### Risk 4: Unauthorized Adjustments

**Risk**: Users create adjustments without proper authorization or reason

**Mitigation**:
- **Mandatory Reason**: All adjustments require descriptive reason (min 20 characters)
- **Approval Workflow**: Large adjustments require management approval
- **Role-Based Access**: Only accounting can create adjustments
- **Audit Log**: All adjustments logged with user, timestamp, reason
- **Period Locking**: Locked periods cannot be adjusted

---

### Risk 5: Performance with Large Datasets

**Risk**: Reports and reconciliation slow with years of transaction data

**Mitigation**:
- **Period-Based Queries**: Only query relevant periods, not all history
- **Pagination**: Large tables paginated (100 rows per page)
- **Indexing**: Database indexes on period, date, status fields
- **Caching**: Dashboard metrics cached (refresh every 5 minutes)
- **Aggregated Data**: Pre-calculate summary metrics for reports
- **Background Jobs**: Heavy calculations run in background

---

### Risk 6: Concurrent Period Closing

**Risk**: Multiple users try to close/lock period simultaneously

**Mitigation**:
- **Database Locking**: Period status update uses database transaction lock
- **Single User**: Only one user can close period at a time
- **Status Check**: Verify period status before closing
- **Transaction Rollback**: Rollback on conflict, show error to user

---

### Risk 7: Missing Payment Allocations

**Risk**: Payments received but not allocated to invoices, leading to incorrect invoice status

**Mitigation**:
- **Allocation Dashboard**: Show unallocated payments prominently
- **Invoice Status**: Invoice status automatically updates on allocation
- **Validation**: Cannot allocate more than payment amount
- **Reconciliation**: Reconciliation identifies unallocated payments
- **Alerts**: Notify accounting of unallocated payments

---

### Risk 8: Expense Approval Bottleneck

**Risk**: Expenses stuck in approval queue, delaying payments

**Mitigation**:
- **Approval Dashboard**: Show pending approvals with aging
- **Multiple Approvers**: Assign multiple approvers for redundancy
- **Auto-Approval**: Small amounts auto-approved (configurable threshold)
- **Escalation**: Notify management of delayed approvals
- **KPIs**: Track approval delay time

---

### Risk 9: Period Locking Mistakes

**Risk**: Period locked incorrectly, preventing necessary adjustments

**Mitigation**:
- **Confirmation Modal**: Require confirmation before locking
- **Lock Reason**: Require reason for locking (audit trail)
- **Super Admin Override**: Super admin can unlock (with reason logged)
- **Unlock Audit**: All unlocks logged with reason
- **Lock Validation**: Cannot lock if unreconciled or unapproved adjustments

---

### Risk 10: Report Data Inconsistency

**Risk**: Reports show different numbers than source transactions

**Mitigation**:
- **Read-Only Reports**: Reports are read-only, cannot be edited
- **Source of Truth**: Reports always generated from source transactions
- **Regeneration**: Reports can be regenerated to reflect latest data
- **Version Timestamp**: Reports show generation timestamp
- **Export Validation**: Export matches report display

---

## Summary

The Finance module is designed as a **360-degree, audit-ready, scalable financial system** that:

1. **Separates Revenue from Cash** - Clear mental model of expected vs actual
2. **Prioritizes Reconciliation** - Top-level workflow for trust and accuracy
3. **Provides Decision-Grade KPIs** - Grouped by decision type, not vanity metrics
4. **Controls Adjustments** - Mandatory reasons, approval workflow, audit trail
5. **Offers Read-Only Reports** - Data integrity, single source of truth
6. **Enforces Role-Based Access** - Accounting controls, Management approves, Operations views
7. **Maintains Audit Safety** - Immutable logs, period locking, reconciliation records
8. **Scales for Growth** - Period-based queries, pagination, caching, background jobs

**MVP Focus**: Core operations (invoices, payments, expenses, reconciliation, basic reports)

**Future Phases**: Payroll automation, bank API integration, forecasting, advanced analytics, multi-currency







