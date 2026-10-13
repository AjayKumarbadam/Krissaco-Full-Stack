import { apiRequest } from "./client";
import type { StatementResponse } from "../types";

export async function getStatement(
  startDate: string,
  endDate: string
): Promise<StatementResponse> {
  return apiRequest<StatementResponse>("/statement", {
    query: { start_date: startDate, end_date: endDate },
  });
}

export async function downloadStatementPdf(startDate: string, endDate: string): Promise<void> {
  const blob = await apiRequest<Blob>("/statement/pdf", {
    query: { start_date: startDate, end_date: endDate },
    responseType: "blob",
  });

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", `Krissaco_Statement_${startDate}_to_${endDate}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
