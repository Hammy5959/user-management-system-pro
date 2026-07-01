import { getToken } from "./auth";
import type { ApiUser, ApiRole, CreateUserPayload, UpdateUserPayload } from "@/types";

const BASE_URL = "http://localhost:5000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data.msg || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function fetchUsers(params?: { name?: string; email?: string }): Promise<ApiUser[]> {
  const query = new URLSearchParams();
  if (params?.name) query.set("name", params.name);
  if (params?.email) query.set("email", params.email);
  const qs = query.toString();
  return request<ApiUser[]>(`/users${qs ? `?${qs}` : ""}`);
}

export async function createUser(
  payload: CreateUserPayload
): Promise<{ msg: string }> {
  return request<{ msg: string }>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(
  id: number
): Promise<{ msg: string }> {
  return request<{ msg: string }>(`/users/${id}`, {
    method: "DELETE",
  });
}

export async function toggleUserStatus(
  id: number
): Promise<{ is_active: boolean }> {
  return request<{ is_active: boolean }>(`/users/${id}/toggle-status`, {
    method: "PATCH",
  });
}

export async function fetchRoles(): Promise<ApiRole[]> {
  return request<ApiRole[]>("/roles");
}

export async function updateRolePermissions(
  id: number,
  permissions: string[]
): Promise<{ msg: string }> {
  return request<{ msg: string }>(`/roles/${id}/permissions`, {
    method: "POST",
    body: JSON.stringify({ permissions }),
  });
}

export async function uploadProfilePicture(
  file: File
): Promise<{ profile_picture: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/users/me/profile-picture`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: token } : {}),
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.msg || "Failed to upload profile picture");
  }

  return data;
}

export function getProfilePictureUrl(path?: string | null): string | null {
  if (!path) return null;
  return `${BASE_URL}/${path}`;
}
