export * from './students.service';
export * from './classes.service';
export * from './courses.service';
export * from './groups.service';
export * from './allocation.service';
export * from './teaching-slots.service';
export * from './rooms.service';
export * from './sales.service';
export * from './instructors.service';
export * from './marketing.service';
export * from './parents.service';
export * from './settings.service';
export * from './notifications.service';
export { 
  financeReportsService, 
  type FinancialPeriod,
  type ProfitAndLossReport,
  type CashFlowReport,
  type ClassProfitabilityReport,
  type InstructorCostsReport,
} from './finance.service';
export {
  financeService,
  type Invoice,
  type CreateInvoiceDto,
  type FinanceOverview,
  type Payment,
  type Expense,
  type CashAccount,
  type ExpenseCategory,
} from './finance-operations.service';

