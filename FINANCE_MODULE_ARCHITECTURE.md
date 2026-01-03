# Finance Module Architecture (MV-OS)

## Purpose

MV-OS Finance is the **source of financial truth** for the education operating system. It provides:
- **Cash control**: Real-time visibility into actual cash position
- **Revenue recognition**: Expected vs actual revenue tracking
- **Expense management**: Complete expense lifecycle with approval workflows
- **Financial intelligence**: Profit, margin, burn rate, and cash runway calculations
- **Audit readiness**: Complete audit trail for all financial transactions
- **Scalability**: Designed for multi-school, multi-branch, investor-ready growth

**Core Philosophy:**
1. MV-OS is the source of truth (not external accounting systems)
2. Separate expected cash from actual cash
3. Support manual reality (Egypt context: cash, Vodafone Cash, bank transfers)
4. Audit-friendly by design
5. Scale without bank API dependencies

---

## Financial Domains

### 1️⃣ Revenue (Expected)
**Definition**: Money we expect to receive based on commitments, subscriptions, and class enrollments.

**Components:**
- **Subscriptions**: Recurring student subscriptions (monthly, quarterly, annual)
- **Class Pricing**: One-time or recurring class fees
- **Discounts**: Applied discounts (percentage, fixed amount, promotional codes)
- **Installments**: Multi-payment plans for large fees
- **Refunds (Future)**: Expected refunds to issue

**Key Characteristics:**
- Created when: Student enrolls, subscription starts, class is scheduled
- Updated when: Discount applied, installment plan created, refund issued
- Recognized when: Payment received and allocated
- **Status**: Expected (not yet received), Partially Received, Fully Received, Overdue

**Ownership**: Finance module (read from Academic Ops for enrollments)

---

### 2️⃣ Cash In (Actual)
**Definition**: Money actually received in bank accounts, cash registers, or digital wallets.

**Payment Methods:**
- **Cash**: Physical cash received
- **Bank Transfer**: Direct bank transfers (manual entry)
- **Vodafone Cash**: Mobile wallet payments
- **Instapay**: Instant payment network
- **POS (Future)**: Point-of-sale card payments

**Key Characteristics:**
- Recorded when: Payment physically received
- Linked to: Invoice(s) via Payment Allocation
- Stored in: Cash Account (Bank, Cash Register, Wallet)
- **Status**: Pending, Received, Reversed, Failed

**Ownership**: Finance module (manual entry, no bank API)

---

### 3️⃣ Expenses (Actual)
**Definition**: Money actually paid out for operations, instructors, rent, marketing, etc.

**Categories:**
- **Instructor Payouts**: Session-based or monthly salaries
- **Rent**: Office/classroom rent
- **Marketing**: Campaign costs, advertising
- **Utilities**: Electricity, water, internet
- **Operations**: Office supplies, maintenance, software subscriptions
- **One-off Expenses**: Unexpected or irregular expenses

**Key Characteristics:**
- Recorded when: Expense incurred (commitment) or paid (actual)
- Categorized: By expense category for reporting
- Approved: Optional approval workflow for management oversight
- **Status**: Draft, Pending Approval, Approved, Paid, Reversed

**Ownership**: Finance module (reads instructor sessions from HR/Academic Ops)

---

### 4️⃣ Liabilities & Obligations
**Definition**: Money we owe or have committed to pay.

**Components:**
- **Instructor Unpaid Balances**: Accumulated instructor fees not yet paid
- **Deferred Revenue**: Money received for future services (prepaid subscriptions)
- **Outstanding Refunds**: Refunds approved but not yet paid
- **Prepaid Subscriptions**: Revenue received but not yet recognized (service not delivered)

**Key Characteristics:**
- Calculated: Automatically from payment allocations and expense commitments
- Tracked: Per instructor, per student, per period
- **Status**: Current, Overdue, Paid

**Ownership**: Finance module (calculated, not manually entered)

---

### 5️⃣ Financial Intelligence
**Definition**: Derived metrics for decision-making and financial health.

**Metrics:**
- **Profit**: Revenue - Expenses (per period)
- **Margin**: (Revenue - Expenses) / Revenue * 100
- **Burn Rate**: Monthly expense rate
- **Cash Runway**: Cash balance / Burn rate (months remaining)
- **Expected vs Actual**: Variance analysis
- **Class Profitability**: Revenue per class - Instructor cost per class

**Key Characteristics:**
- Calculated: Real-time from transactions
- Period-based: Monthly, quarterly, annual views
- **Status**: Healthy, Warning, Critical

**Ownership**: Finance module (calculated, read-only)

---

## Core Entities

### Invoice (Logical, Internal)
**Purpose**: Represents expected revenue from a student enrollment, subscription, or class.

**Fields:**
- `id`: UUID
- `studentId`: Link to Student (Academic Ops)
- `classId`: Link to Class (optional, for class-based invoices)
- `subscriptionId`: Link to Subscription (optional, for recurring invoices)
- `invoiceNumber`: Auto-generated (INV-YYYY-MM-####)
- `issueDate`: Date invoice created
- `dueDate`: Payment due date
- `subtotal`: Amount before discounts
- `discountAmount`: Total discounts applied
- `taxAmount`: Tax (if applicable, future)
- `totalAmount`: Final amount due
- `status`: `draft`, `issued`, `partially_paid`, `paid`, `overdue`, `cancelled`
- `installmentPlanId`: Link to Installment Plan (optional)
- `notes`: Internal notes
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- One Invoice → Many Payment Allocations
- One Invoice → One Installment Plan (optional)
- One Invoice → One Student
- One Invoice → One Class (optional)

**Ownership**: Finance module (created from Academic Ops enrollment data)

---

### Payment
**Purpose**: Records actual cash received.

**Fields:**
- `id`: UUID
- `paymentNumber`: Auto-generated (PAY-YYYY-MM-####)
- `receivedDate`: Date payment received
- `amount`: Amount received
- `method`: `cash`, `bank_transfer`, `vodafone_cash`, `instapay`, `pos`
- `cashAccountId`: Link to Cash Account (where money was received)
- `referenceNumber`: Bank reference, transaction ID, receipt number
- `receivedBy`: User ID who recorded the payment
- `status`: `pending`, `received`, `reversed`, `failed`
- `reversedAt`: Date if reversed
- `reversalReason`: Reason for reversal
- `notes`: Payment notes
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- One Payment → Many Payment Allocations
- One Payment → One Cash Account

**Ownership**: Finance module (manual entry)

---

### Payment Allocation
**Purpose**: Links payments to invoices (supports partial payments, overpayments).

**Fields:**
- `id`: UUID
- `paymentId`: Link to Payment
- `invoiceId`: Link to Invoice
- `amount`: Amount allocated to this invoice
- `allocatedAt`: Date allocation created
- `allocatedBy`: User ID who created allocation
- `notes`: Allocation notes
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- Many Payment Allocations → One Payment
- Many Payment Allocations → One Invoice

**Business Rules:**
- Sum of allocations for a payment ≤ Payment amount
- Sum of allocations for an invoice ≤ Invoice total
- Overpayment: If sum > invoice total, create credit note (future)

**Ownership**: Finance module

---

### Expense
**Purpose**: Records money paid out.

**Fields:**
- `id`: UUID
- `expenseNumber`: Auto-generated (EXP-YYYY-MM-####)
- `expenseDate`: Date expense incurred
- `paidDate`: Date actually paid (null if unpaid)
- `amount`: Expense amount
- `categoryId`: Link to Expense Category
- `description`: Expense description
- `vendor`: Vendor/payee name
- `paymentMethod`: `cash`, `bank_transfer`, `vodafone_cash`, `instapay`
- `cashAccountId`: Link to Cash Account (where money was paid from)
- `paidBy`: User ID who recorded payment
- `status`: `draft`, `pending_approval`, `approved`, `paid`, `reversed`
- `approvedBy`: User ID who approved (if applicable)
- `approvedAt`: Date approved
- `recurringExpenseId`: Link to Recurring Expense (optional, future)
- `instructorId`: Link to Instructor (if instructor payout)
- `sessionId`: Link to Session (if session-based instructor payout)
- `periodId`: Link to Financial Period
- `notes`: Expense notes
- `receiptUrl`: Receipt/document URL (future)
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- One Expense → One Expense Category
- One Expense → One Cash Account
- One Expense → One Financial Period
- One Expense → One Instructor (optional)
- One Expense → One Session (optional)

**Ownership**: Finance module (reads instructor sessions from HR/Academic Ops)

---

### Expense Category
**Purpose**: Categorizes expenses for reporting and budgeting.

**Fields:**
- `id`: UUID
- `name`: Category name (e.g., "Instructor Payouts", "Rent", "Marketing")
- `code`: Category code (e.g., "INSTR", "RENT", "MKTG")
- `parentCategoryId`: Link to parent category (for hierarchical categories, future)
- `description`: Category description
- `isActive`: Active/inactive flag
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- One Expense Category → Many Expenses

**Ownership**: Finance module

---

### Wallet / Cash Account
**Purpose**: Represents physical or digital locations where cash is stored.

**Fields:**
- `id`: UUID
- `name`: Account name (e.g., "Main Bank Account", "Cash Register", "Vodafone Cash")
- `type`: `bank`, `cash`, `wallet`
- `accountNumber`: Bank account number or identifier
- `bankName`: Bank name (if type is bank)
- `balance`: Current balance (calculated from payments and expenses)
- `currency`: Currency code (default: EGP)
- `isActive`: Active/inactive flag
- `notes`: Account notes
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- One Cash Account → Many Payments (received)
- One Cash Account → Many Expenses (paid)

**Ownership**: Finance module

---

### Financial Period
**Purpose**: Represents a time period (month) for financial reporting and locking.

**Fields:**
- `id`: UUID
- `periodCode`: Format: "YYYY-MM" (e.g., "2025-01")
- `startDate`: Period start date (first day of month)
- `endDate`: Period end date (last day of month)
- `status`: `open`, `closed`, `locked`
- `closedAt`: Date period was closed
- `closedBy`: User ID who closed the period
- `lockedAt`: Date period was locked (no more changes allowed)
- `lockedBy`: User ID who locked the period
- `notes`: Period notes
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- One Financial Period → Many Expenses
- One Financial Period → Many Invoices (optional, for period-based reporting)

**Business Rules:**
- Only current period and future periods can be open
- Closed periods can be reopened by super_admin
- Locked periods cannot be modified (audit requirement)

**Ownership**: Finance module

---

### Reconciliation Record
**Purpose**: Records manual adjustments and reconciliations between expected and actual.

**Fields:**
- `id`: UUID
- `reconciliationNumber`: Auto-generated (REC-YYYY-MM-####)
- `periodId`: Link to Financial Period
- `reconciliationDate`: Date reconciliation performed
- `type`: `adjustment`, `correction`, `write_off`, `reversal`
- `amount`: Adjustment amount (positive or negative)
- `description`: Reason for reconciliation
- `reconciledBy`: User ID who performed reconciliation
- `approvedBy`: User ID who approved reconciliation
- `approvedAt`: Date approved
- `relatedInvoiceId`: Link to Invoice (if applicable)
- `relatedPaymentId`: Link to Payment (if applicable)
- `relatedExpenseId`: Link to Expense (if applicable)
- `notes`: Reconciliation notes
- `createdAt`, `updatedAt`: Audit timestamps

**Relationships:**
- One Reconciliation Record → One Financial Period
- One Reconciliation Record → One Invoice (optional)
- One Reconciliation Record → One Payment (optional)
- One Reconciliation Record → One Expense (optional)

**Ownership**: Finance module

---

## Primary Screens

### 1️⃣ Finance Overview (Dashboard)
**Purpose**: High-level financial health and cash position.

**Sections:**
1. **Cash Position**
   - Total cash across all accounts
   - Breakdown by account (bank, cash, wallets)
   - Cash trend (last 3 months)

2. **Expected vs Actual**
   - Expected revenue (sum of unpaid invoices)
   - Actual revenue (sum of received payments)
   - Variance (expected - actual)
   - Overdue invoices count and amount

3. **Net Result (This Period)**
   - Revenue (actual)
   - Expenses (paid)
   - Profit/Loss
   - Margin percentage

4. **Alerts**
   - Low cash balance warnings
   - Overdue invoices
   - Unpaid instructor balances
   - Period closing reminders

5. **Quick Actions**
   - Record Payment
   - Record Expense
   - Create Invoice
   - Reconcile

**Navigation**: `/dashboard/finance`

---

### 2️⃣ Payments
**Purpose**: Manage all incoming payments and allocations.

**Sections:**
1. **Payments List**
   - Table: Date, Amount, Method, Account, Status, Allocated, Unallocated
   - Filters: Date range, Method, Account, Status
   - Search: By reference number, student name

2. **Payment Details (Modal/Page)**
   - Payment information
   - Allocation list (which invoices paid)
   - Unallocated amount
   - Add allocation button

3. **Outstanding Balances**
   - Students with unpaid invoices
   - Overdue invoices
   - Installment schedules

**Actions:**
- Record Payment
- Allocate Payment to Invoice(s)
- Reverse Payment
- View Payment Details

**Navigation**: `/dashboard/finance/payments`

---

### 3️⃣ Expenses
**Purpose**: Manage all outgoing expenses.

**Sections:**
1. **Expenses List**
   - Table: Date, Amount, Category, Vendor, Status, Approved By
   - Filters: Date range, Category, Status, Approval State
   - Search: By vendor, description

2. **Expense Details (Modal/Page)**
   - Expense information
   - Category assignment
   - Approval workflow
   - Receipt attachment (future)

3. **Expense Categories**
   - Category list with totals
   - Category breakdown chart

**Actions:**
- Record Expense
- Approve Expense (management)
- Edit Expense (before approval)
- Reverse Expense

**Navigation**: `/dashboard/finance/expenses`

---

### 4️⃣ Cash Accounts
**Purpose**: Manage bank accounts, cash registers, and digital wallets.

**Sections:**
1. **Accounts List**
   - Table: Name, Type, Account Number, Balance, Status
   - Filters: Type, Status

2. **Account Details (Page)**
   - Account information
   - Transaction history (payments in, expenses out)
   - Balance over time chart
   - Reconciliation records

**Actions:**
- Add Account
- Edit Account
- View Transactions
- Reconcile Account

**Navigation**: `/dashboard/finance/accounts`

---

### 5️⃣ Reconciliation
**Purpose**: Period-based reconciliation and adjustments.

**Sections:**
1. **Period Selector**
   - Current period highlighted
   - Previous periods (closed/locked)
   - Future periods (read-only)

2. **Reconciliation Summary**
   - Expected revenue (invoices)
   - Actual revenue (payments)
   - Variance
   - Adjustments made

3. **Reconciliation Records**
   - List of all adjustments
   - Filter by type, date, user
   - Approval status

**Actions:**
- Create Adjustment
- Approve Adjustment
- Close Period
- Lock Period (super_admin only)

**Navigation**: `/dashboard/finance/reconciliation`

---

### 6️⃣ Reports
**Purpose**: Financial reports and analytics.

**Sections:**
1. **Monthly P&L**
   - Revenue breakdown
   - Expense breakdown by category
   - Profit/Loss
   - Margin
   - Period comparison

2. **Class Profitability**
   - Revenue per class
   - Instructor cost per class
   - Net profit per class
   - Top/bottom performing classes

3. **Instructor Cost Ratios**
   - Total instructor costs
   - Cost per session
   - Cost as % of revenue
   - Instructor efficiency metrics

4. **Cash Flow**
   - Cash in (payments)
   - Cash out (expenses)
   - Net cash flow
   - Cash runway projection

**Actions:**
- Export Report (PDF, Excel, future)
- Filter by period
- Compare periods

**Navigation**: `/dashboard/finance/reports`

---

## Payment Flow

### Lifecycle

```
1. Price Defined (Academic Ops)
   ↓
2. Invoice Generated (Finance)
   - Created when student enrolls
   - Total amount = Class price - Discounts
   - Status: "issued"
   ↓
3. Payment Received (Finance)
   - Manual entry by accounting
   - Linked to Cash Account
   - Status: "received"
   ↓
4. Allocation Applied (Finance)
   - Link payment to invoice(s)
   - Supports partial payments
   - Update invoice status
   ↓
5. Balance Updated (Finance)
   - Invoice: "partially_paid" or "paid"
   - Cash Account balance increased
   ↓
6. Revenue Recognized (Finance)
   - Counted in period revenue
   - Available for reporting
```

### Special Cases

**Partial Payments:**
- Payment amount < Invoice total
- Create Payment Allocation for partial amount
- Invoice status = "partially_paid"
- Remaining balance tracked on invoice

**Overpayments:**
- Payment amount > Invoice total
- Create Payment Allocation for full invoice amount
- Remaining amount = "Unallocated" (future: create credit note)
- Can be allocated to other invoices

**Advance Payments:**
- Payment received before invoice created
- Create Payment with status "received"
- Mark as "Unallocated"
- When invoice created, allocate advance payment

**Failed or Reversed Payments:**
- Payment status = "reversed" or "failed"
- Reverse Payment Allocations
- Update invoice status back to "issued" or "partially_paid"
- Update Cash Account balance

---

## Expense Flow

### Lifecycle

```
1. Expense Recorded (Finance)
   - Manual entry or auto-generated (instructor payouts)
   - Amount, category, vendor
   - Status: "draft" or "pending_approval"
   ↓
2. Category Assigned (Finance)
   - Link to Expense Category
   - For reporting and budgeting
   ↓
3. Optional Approval (Management)
   - If approval required: Status = "pending_approval"
   - Management reviews and approves
   - Status = "approved"
   ↓
4. Paid / Unpaid (Finance)
   - If paid: Record payment date, cash account
   - Status = "paid"
   - If unpaid: Status = "approved" (commitment)
   ↓
5. Reflected in Cash (Finance)
   - Cash Account balance decreased
   - Counted in period expenses
   - Available for reporting
```

### Separation of Concerns

**Commitment:**
- Expense created with status "approved" but not yet paid
- Represents future cash outflow
- Tracked separately from actual cash

**Payment:**
- Expense marked as "paid" with payment date
- Actual cash outflow
- Updates Cash Account balance

**Accounting Impact:**
- Unpaid expenses = Liabilities
- Paid expenses = Actual expenses (P&L)
- Both tracked for complete financial picture

---

## Instructor Finance Integration

### Cost Models

**Hourly Rate:**
- Cost = Hours × Hourly Rate
- Calculated per session
- Aggregated monthly

**Monthly Salary:**
- Fixed monthly amount
- Independent of session count
- Prorated if partial month

### Session-Based Cost Calculation

**Flow:**
1. **Read Sessions** (Academic Ops)
   - Fetch sessions for instructor in period
   - Session duration, class type

2. **Calculate Cost** (Finance)
   - If hourly: Sum (session hours × hourly rate)
   - If monthly: Fixed amount (prorated if needed)

3. **Create Expense** (Finance)
   - Expense type: "Instructor Payout"
   - Category: "Instructor Payouts"
   - Amount: Calculated cost
   - Link to instructor and sessions
   - Status: "approved" (ready to pay)

4. **Monthly Aggregation** (Finance)
   - Group expenses by instructor
   - Total payable amount
   - Track paid vs unpaid

### Payable vs Paid

**Payable:**
- Expenses created but not yet paid
- Status: "approved"
- Represents liability

**Paid:**
- Expenses marked as paid
- Status: "paid"
- Cash Account balance decreased
- Actual expense (P&L)

**Ownership:**
- Finance reads sessions from Academic Ops (read-only)
- Finance writes expenses (write)
- Finance does NOT manage payroll logic (future phase)

---

## Reconciliation Logic

### Period-Based Reconciliation

**Monthly Process:**
1. **Close Period** (End of Month)
   - Lock all transactions for the period
   - Calculate final revenue and expenses
   - Generate period report

2. **Reconcile Expected vs Actual**
   - Expected: Sum of invoices issued
   - Actual: Sum of payments received
   - Variance: Expected - Actual
   - Identify discrepancies

3. **Create Adjustments** (If Needed)
   - Write-offs (uncollectible invoices)
   - Corrections (data entry errors)
   - Reversals (incorrect transactions)

4. **Lock Period** (Super Admin)
   - No more changes allowed
   - Audit requirement
   - Can only be unlocked by super_admin

### Manual Adjustments

**Types:**
- **Adjustment**: Correct data entry errors
- **Correction**: Fix calculation errors
- **Write-off**: Mark invoice as uncollectible
- **Reversal**: Reverse incorrect payment or expense

**Workflow:**
1. Create Reconciliation Record
2. Link to related transaction (invoice, payment, expense)
3. Enter adjustment amount and reason
4. Require approval (management)
5. Apply adjustment
6. Update related transaction status

---

## Role Access

### Accounting
**Access Level**: Full Control

**Permissions:**
- Create, edit, delete invoices
- Record payments and allocations
- Record expenses
- Approve expenses (if assigned)
- Create reconciliation records
- Close and lock periods
- View all reports
- Manage cash accounts

**Restrictions**: None (within Finance module)

---

### Management
**Access Level**: View + Approve

**Permissions:**
- View all financial data
- Approve expenses (if approval required)
- Approve reconciliation records
- View all reports
- Export reports

**Restrictions:**
- Cannot create invoices (unless assigned)
- Cannot record payments (unless assigned)
- Cannot close/lock periods (unless super_admin)

---

### Operations
**Access Level**: Read-Only

**Permissions:**
- View Finance Overview (dashboard)
- View payments list
- View expenses list (own expenses if created)
- View reports (read-only)

**Restrictions:**
- Cannot create invoices
- Cannot record payments
- Cannot record expenses (unless specifically assigned)
- Cannot approve expenses
- Cannot access reconciliation

---

### Sales
**Access Level**: No Access

**Permissions:**
- None (Sales uses CRM, not Finance)

**Restrictions:**
- No Finance module access

---

### Super Admin
**Access Level**: Full Control + System Admin

**Permissions:**
- All Accounting permissions
- Lock/unlock periods
- Override approval requirements
- System configuration
- Audit log access

---

## What Finance Does NOT Do

### Not in MVP

1. **Payroll Automation**
   - Finance calculates instructor costs
   - Finance does NOT automate payroll processing
   - Payroll is manual (future phase)

2. **Bank API Integration**
   - No automatic bank statement import
   - All payments manually entered
   - Bank reconciliation is manual

3. **Tax Calculation**
   - Tax fields exist but calculation is manual
   - No automatic tax computation
   - Tax reporting is future phase

4. **Multi-Currency**
   - Single currency (EGP) only
   - No currency conversion
   - Multi-currency is future phase

5. **Advanced Reporting**
   - Basic P&L and cash flow
   - No advanced analytics (future)
   - No custom report builder (future)

6. **Budgeting & Forecasting**
   - No budget creation
   - No forecast generation
   - Budgeting is future phase

7. **Credit Notes**
   - Overpayments tracked as "unallocated"
   - No credit note system yet
   - Credit notes are future phase

8. **Recurring Expenses**
   - One-time expenses only
   - No recurring expense automation
   - Recurring expenses are future phase

---

### Belongs to External Systems

1. **Full Accounting System**
   - MV-OS Finance is operational finance
   - Full accounting (ledger, journal entries) belongs to external system
   - MV-OS exports data for external accounting

2. **Tax Filing**
   - Tax calculation and reporting
   - Tax filing belongs to external accounting system
   - MV-OS provides data export

3. **Audit Services**
   - External auditors use MV-OS data
   - MV-OS provides audit trail
   - Audit execution is external

4. **Bank Reconciliation (Advanced)**
   - Basic reconciliation in MV-OS
   - Advanced bank reconciliation belongs to external system
   - MV-OS provides transaction export

---

## Scalability Risks

### High Volume Transactions

**Risk**: Large number of payments and expenses per period

**Mitigation:**
- Efficient database indexing (period, status, date)
- Pagination in all lists
- Lazy loading for reports
- Background job for period closing

---

### Multi-School / Multi-Branch

**Risk**: Need to separate finances by school/branch

**Mitigation:**
- Add `schoolId` / `branchId` to all entities (future)
- Filter all queries by school/branch
- Separate cash accounts per school/branch
- School/branch-level reports

---

### Concurrent Period Closing

**Risk**: Multiple users closing period simultaneously

**Mitigation:**
- Database-level locking for period status
- Only one user can close period at a time
- Transaction rollback on conflict

---

### Data Integrity

**Risk**: Payment allocations don't match payments/invoices

**Mitigation:**
- Database constraints (sum of allocations ≤ payment amount)
- Validation on allocation creation
- Reconciliation checks
- Audit logs for all changes

---

### Performance with Large Datasets

**Risk**: Reports slow with years of data

**Mitigation:**
- Period-based queries (only query relevant periods)
- Aggregated data tables (pre-calculated metrics)
- Caching for dashboard metrics
- Background jobs for heavy calculations

---

## MVP Scope

### Phase 1: Core Finance (MVP)

**Included:**
1. **Invoices**
   - Create invoice from enrollment
   - Invoice list with filters
   - Invoice status tracking

2. **Payments**
   - Record payment (manual entry)
   - Payment allocation to invoices
   - Payment list with filters

3. **Expenses**
   - Record expense (manual entry)
   - Expense categories
   - Expense list with filters
   - Basic approval workflow

4. **Cash Accounts**
   - Add/edit cash accounts
   - Balance tracking
   - Transaction history

5. **Finance Overview**
   - Cash position
   - Expected vs actual
   - Net result (this period)
   - Basic alerts

6. **Basic Reports**
   - Monthly P&L (revenue - expenses)
   - Expense breakdown by category

7. **Instructor Integration**
   - Read sessions from Academic Ops
   - Calculate instructor costs (hourly/monthly)
   - Create expense entries
   - Track payable vs paid

**Not Included:**
- Reconciliation (Phase 2)
- Advanced reports (Phase 2)
- Installment plans (Phase 2)
- Refunds (Phase 3)
- Period locking (Phase 2)

---

## Phase 2 Scope

### Enhanced Finance

**Included:**
1. **Reconciliation**
   - Period-based reconciliation
   - Expected vs actual variance
   - Manual adjustments
   - Period closing and locking

2. **Advanced Reports**
   - Class profitability
   - Instructor cost ratios
   - Cash flow statement
   - Period comparison

3. **Installment Plans**
   - Multi-payment plans
   - Installment schedule
   - Partial payment tracking

4. **Expense Approval Workflow**
   - Multi-level approval
   - Approval history
   - Rejection workflow

5. **Financial Periods**
   - Period management
   - Period locking
   - Period-based reporting

6. **Enhanced Cash Accounts**
   - Account reconciliation
   - Transfer between accounts
   - Account balance history

**Not Included:**
- Refunds (Phase 3)
- Credit notes (Phase 3)
- Recurring expenses (Phase 3)
- Multi-currency (Phase 3)

---

## Phase 3 Scope

### Advanced Finance

**Included:**
1. **Refunds**
   - Refund requests
   - Refund approval
   - Refund processing
   - Refund tracking

2. **Credit Notes**
   - Create credit notes
   - Apply to invoices
   - Credit note tracking

3. **Recurring Expenses**
   - Recurring expense setup
   - Automatic expense generation
   - Recurring expense management

4. **Advanced Analytics**
   - Custom report builder
   - Forecasting
   - Budget vs actual
   - Trend analysis

5. **Multi-School / Multi-Branch**
   - School/branch separation
   - Consolidated reporting
   - School/branch-level access

6. **Export & Integration**
   - Export to accounting systems
   - API for external systems
   - Bank statement import (if available)

**Future Considerations:**
- Multi-currency support
- Tax automation
- Payroll automation
- Investor reporting

---

## Summary

The Finance module is designed as a **360-degree, audit-ready, scalable financial system** that:

1. **Separates expected from actual** (invoices vs payments)
2. **Tracks all cash movements** (payments in, expenses out)
3. **Integrates with other modules** (Academic Ops for enrollments, HR for instructor costs)
4. **Supports manual reality** (no bank APIs, cash, digital wallets)
5. **Provides financial intelligence** (profit, margin, burn rate, cash runway)
6. **Maintains audit trail** (all transactions logged, periods lockable)
7. **Scales for growth** (multi-school, multi-branch ready)

**MVP focuses on core operations**: Invoices, Payments, Expenses, Cash Accounts, Basic Reports, Instructor Integration.

**Phase 2 adds control**: Reconciliation, Period Management, Advanced Reports, Installment Plans.

**Phase 3 adds sophistication**: Refunds, Credit Notes, Recurring Expenses, Advanced Analytics, Multi-School Support.






