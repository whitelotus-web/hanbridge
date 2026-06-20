const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  locale: string;
  is_staff: boolean;
  vip_until: string | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResult extends TokenPair {
  user: AuthUser;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_V1}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg)
        detail = body.detail[0].msg;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface RegisterPayload {
  email?: string;
  phone?: string;
  password: string;
  display_name?: string;
  locale?: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  login: (identifier: string, password: string) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    }),

  refresh: (refreshToken: string) =>
    request<TokenPair>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken })
    }),

  me: (token: string) => request<AuthUser>("/auth/me", { token }),

  forgotPassword: (email: string) =>
    request<{ detail: string; reset_token?: string }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) }
    ),

  resetPassword: (token: string, password: string) =>
    request<{ detail: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    })
};
