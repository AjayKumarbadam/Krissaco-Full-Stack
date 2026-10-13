import { apiRequest } from "./client";
import type {
  LatestTransactionsResponse,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
} from "../types";

export async function getLatestTransactions(
  limit: number = 50,
  statusFilter?: string
): Promise<LatestTransactionsResponse> {
  return apiRequest<LatestTransactionsResponse>("/transaction", {
    query: { limit, status_filter: statusFilter },
  });
}

export async function createTransaction(payload: TransactionCreate): Promise<Transaction> {
  return apiRequest<Transaction>("/transaction", {
    method: "POST",
    body: payload,
  });
}

export async function updateTransaction(
  transactionId: string,
  payload: TransactionUpdate
): Promise<Transaction> {
  return apiRequest<Transaction>(`/transaction/${transactionId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function approveTransaction(transactionId: string): Promise<Transaction> {
  return apiRequest<Transaction>(`/transaction/${transactionId}/approve`, {
    method: "POST",
  });
}

export async function rejectTransaction(
  transactionId: string,
  reason?: string
): Promise<Transaction> {
  return apiRequest<Transaction>(`/transaction/${transactionId}/reject`, {
    method: "POST",
    body: { reason },
  });
}

export async function uploadReceipt(
  transactionId: string,
  file: File
): Promise<Transaction> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Transaction>(`/transaction/${transactionId}/receipt`, {
    method: "POST",
    formData,
  });
}
