export interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  permissions: string[];
  profile_picture?: string;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: number;
}

export interface ApiRole {
  id: number;
  name: string;
  users_count: number;
  permissions: string[];
}

export interface JWTPayload {
  id: number;
  role: string;
  permissions: string[];
  exp: number;
}

export const ALL_PERMISSIONS = [
  "View Users",
  "Create Users",
  "Delete Users",
  "Manage Users",
  "Manage Roles",
];
