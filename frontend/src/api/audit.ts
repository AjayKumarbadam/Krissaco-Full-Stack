import { apiRequest } from "./client";
import type { AuditLogsResponse } from "../types";

export async function getAuditLogs(
  limit: number = 100,
  action?: string
): Promise<AuditLogsResponse> {
  return apiRequest<AuditLogsResponse>("/audit-logs", {
    query: { limit, action },
  });
}
