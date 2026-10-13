// Shared HTTP client used by every module in src/api/.
// Supports JWT Authorization headers and file uploads.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | undefined>;
  responseType?: "json" | "blob";
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const cleanBase = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  const cleanPath = path.replace(/^\//, "");
  const url = new URL(cleanPath, cleanBase);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export function getAuthToken(): string | null {
  return localStorage.getItem("krissaco_jwt_token");
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("krissaco_jwt_token", token);
  } else {
    localStorage.removeItem("krissaco_jwt_token");
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, query, responseType = "json" } = options;

  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let requestBody: any = undefined;
  if (formData) {
    requestBody = formData;
    // Browser sets multipart/form-data with boundary automatically
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: requestBody,
    });
  } catch {
    throw new ApiError("Could not reach the backend server. Make sure it is running on " + BASE_URL, 0);
  }

  if (response.status === 401) {
    // If unauthorized, token might be invalid
    // We can clear token if needed
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") message = data.detail;
      else if (Array.isArray(data?.detail)) message = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
    } catch {
      // response had no JSON body — keep default message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;

  if (responseType === "blob") {
    return (await response.blob()) as unknown as T;
  }

  return (await response.json()) as T;
}
