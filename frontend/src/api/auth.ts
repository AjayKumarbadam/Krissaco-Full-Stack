import { apiRequest, setAuthToken } from "./client";
import type { User } from "../types";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(username: string, password: string):(Promise<LoginResponse>) {
  const res = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { username, password },
  });
  setAuthToken(res.access_token);
  return res;
}

export async function getMe(): Promise<User> {
  return apiRequest<User>("/auth/me");
}

export async function getDemoUsers(): Promise<Array<{ username: string; password: string; role: string; name: string }>> {
  return apiRequest("/auth/demo-users");
}
