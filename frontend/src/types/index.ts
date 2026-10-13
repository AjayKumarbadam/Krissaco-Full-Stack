export type Role = "Accountant" | "Manager" | "Auditor";

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: Role;
}

export type TransactionType = "Revenue" | "Expense";

export type TransactionStatus = "Pending" | "Approved" | "Rejected";

export type TransactionHead =
  | "Coffee Beans"
  | "Chicory"
  | "Roasting"
  | "Grinding"
  | "Blending"
  | "Packaging"
  | "Transport"
  | "Promotion"
  | "Commission"
  | "Audit"
  | "Licenses"
  | "Other Operational Expenses";

export interface Transaction {
  TransactionID: string;
  TransactionDate: string; // "DD-MM-YYYY"
  TransactionType: TransactionType;
  TransactionHead: TransactionHead;
  Amount: number;
  Vendor: string;
  Description: string;
  Remarks: string | null;
  Status: TransactionStatus;
  CreatedBy: string;
  CreatedByName: string;
  ReceiptURL?: string | null;
  ApprovedBy?: string | null;
  ApprovedByName?: string | null;
  ApprovedAt?: string | null;
  RejectionReason?: string | null;
  CreatedAt: string; // ISO datetime
}

export interface TransactionCreate {
  TransactionDate: string; // "DD-MM-YYYY"
  TransactionType: TransactionType;
  TransactionHead: TransactionHead;
  Amount: number;
  Vendor: string;
  Description: string;
  Remarks?: string;
}

export interface TransactionUpdate {
  TransactionDate?: string;
  TransactionType?: TransactionType;
  TransactionHead?: TransactionHead;
  Amount?: number;
  Vendor?: string;
  Description?: string;
  Remarks?: string;
}

export interface LatestTransactionsResponse {
  count: number;
  transactions: Transaction[];
}

export interface StatementResponse {
  count: number;
  total_revenue: number;
  total_expense: number;
  net: number;
  transactions: Transaction[];
}

export interface AuditLog {
  id: number;
  transaction_id: string | null;
  action: string;
  actor_username: string;
  actor_name: string;
  actor_role: string;
  details: string | null;
  timestamp: string;
}

export interface AuditLogsResponse {
  count: number;
  logs: AuditLog[];
}

export type View = "transactions" | "statement" | "audit-logs";

export interface ToastMessage {
  id: string;
  variant: "success" | "error";
  text: string;
}
