import type { JWTPayload } from "@/types";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function decodeToken(): JWTPayload | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload)) as JWTPayload;

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      clearAuth();
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return decodeToken() !== null;
}

export function isSuperAdmin(): boolean {
  const decoded = decodeToken();
  return decoded?.role === "super_admin";
}

export function setCookie(name: string, value: string): void {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function removeCookie(name: string): void {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function setAuthCookie(token: string): void {
  setCookie("auth_token", token);
}

export function setPendingOtpCookie(email: string): void {
  setCookie("pending-otp", email);
}

export function clearPendingOtpCookie(): void {
  removeCookie("pending-otp");
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("permissions");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  removeCookie("auth_email");
  removeCookie("auth_token");
  removeCookie("pending-otp");
}
