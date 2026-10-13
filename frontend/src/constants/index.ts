import type { Role, TransactionHead, TransactionStatus } from "../types";

export const TRANSACTION_HEADS: readonly TransactionHead[] = [
  "Coffee Beans",
  "Chicory",
  "Roasting",
  "Grinding",
  "Blending",
  "Packaging",
  "Transport",
  "Promotion",
  "Commission",
  "Audit",
  "Licenses",
  "Other Operational Expenses",
] as const;

export const LIMIT_OPTIONS = [50, 100, 200, 500] as const;

export const DEFAULT_PAGE_LIMIT = 100;

export const DEMO_CREDENTIALS: Record<Role, { username: string; password: string; name: string }> = {
  Accountant: {
    username: "accountant@krissaco.com",
    password: "accountant123",
    name: "Alice Accountant",
  },
  Manager: {
    username: "manager@krissaco.com",
    password: "manager123",
    name: "Bob Manager",
  },
  Auditor: {
    username: "auditor@krissaco.com",
    password: "auditor123",
    name: "Carol Auditor",
  },
};

export const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; badgeClass: string }
> = {
  Pending: {
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  Approved: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  Rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export const ROLE_CONFIG: Record<
  Role,
  { label: string; badgeClass: string }
> = {
  Accountant: {
    label: "Accountant",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  Manager: {
    label: "Manager",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  Auditor: {
    label: "Auditor",
    badgeClass: "bg-blue-100 text-blue-800",
  },
};
