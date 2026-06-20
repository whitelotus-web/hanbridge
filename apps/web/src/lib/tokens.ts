export const ACCESS_KEY = "hb_access";
export const REFRESH_KEY = "hb_refresh";

export function getAccessToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(ACCESS_KEY) ?? undefined;
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
