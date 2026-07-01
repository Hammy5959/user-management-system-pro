"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Shield, Settings, X } from "lucide-react";

import { decodeToken, clearAuth } from "@/lib/auth";
import { fetchRoles, updateRolePermissions, fetchUsers } from "@/lib/api";
import { useUserDisplay } from "@/lib/UserContext";
import { ALL_PERMISSIONS } from "@/types";
import type { ApiRole } from "@/types";

export default function RolesPage() {
  const router = useRouter();
  const { setDisplayName, setCurrentUser, setIsLoading } = useUserDisplay();

  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);

  // Manage permissions modal state
  const [managingRole, setManagingRole] = useState<ApiRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const decoded = decodeToken();
      if (decoded) {
        setCurrentUserPermissions(decoded.permissions);
      }

      const [rolesData, usersData] = await Promise.all([
        fetchRoles(),
        fetchUsers(),
      ]);
      setRoles(rolesData);

      // Update display name and current user
      const uid = decoded?.id;
      if (uid) {
        const me = usersData.find((u) => u.id === uid);
        if (me) {
          setDisplayName(`${me.first_name} ${me.last_name}`);
          setCurrentUser(me);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load data";
      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("token")
      ) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setError(message);
      toast.error(message);
    }
  }, [router, setDisplayName]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => { setLoading(false); setIsLoading(false); });
  }, [loadData, setIsLoading]);

  // Handle bfcache restoration: re-fetch data when page is restored from cache
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setLoading(true);
        loadData().finally(() => { setLoading(false); setIsLoading(false); });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [loadData, setIsLoading]);

  const canManageRoles = currentUserPermissions.includes("Manage Roles");

  const openManagePermissions = (role: ApiRole) => {
    setManagingRole(role);
    setSelectedPermissions([...role.permissions]);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  };

  const handleSavePermissions = async () => {
    if (!managingRole) return;
    setSavingPermissions(true);
    try {
      await updateRolePermissions(managingRole.id, selectedPermissions);
      toast.success("Permissions updated successfully");
      // Refresh roles data
      const rolesData = await fetchRoles();
      setRoles(rolesData);
      setManagingRole(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update permissions"
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-pulse"
          >
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-16" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
          <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load roles
        </h3>
        <p className="text-sm text-gray-500 mb-8 max-w-md">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            loadData().finally(() => setLoading(false));
          }}
          className="px-6 py-2.5 text-sm font-medium text-white bg-[#4F0DCB] rounded-lg hover:bg-[#5b21d4] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 mt-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  role.name === "admin"
                    ? "bg-purple-100"
                    : "bg-gray-100"
                }`}>
                  <Shield size={24} className={
                    role.name === "admin"
                      ? "text-purple-700"
                      : "text-gray-500"
                  } />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 capitalize">
                    {role.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {role.users_count} {role.users_count === 1 ? "user" : "users"}
                  </p>
                </div>
              </div>

              {/* Manage Permissions button */}
              {canManageRoles && (
                <button
                  onClick={() => openManagePermissions(role)}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#4F0DCB] hover:bg-purple-50 hover:cursor-pointer transition-colors"
                  title="Manage permissions"
                >
                  <Settings size={18} />
                </button>
              )}
            </div>

            {/* Permissions list */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Permissions
              </h4>
              <div className="flex flex-wrap gap-2">
                {role.permissions.length > 0 ? (
                  role.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">
                    No permissions assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manage Permissions Modal */}
      {managingRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setManagingRole(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Manage Permissions
              </h2>
              <button
                onClick={() => setManagingRole(null)}
                disabled={savingPermissions}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {/* Role info */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  managingRole.name === "admin"
                    ? "bg-purple-100"
                    : "bg-gray-100"
                }`}>
                  <Shield size={24} className={
                    managingRole.name === "admin"
                      ? "text-purple-700"
                      : "text-gray-500"
                  } />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {managingRole.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {managingRole.users_count} {managingRole.users_count === 1 ? "user" : "users"}
                  </p>
                </div>
              </div>

              {/* Permission checkboxes */}
              <div className="space-y-3.5">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className={`flex items-center gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? "border-purple-200 bg-purple-50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isChecked
                            ? "bg-[#4F0DCB] border-[#4F0DCB]"
                            : "border-gray-300"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {perm}
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-4">
              <button
                onClick={() => setManagingRole(null)}
                disabled={savingPermissions}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#4F0DCB] rounded-lg hover:bg-[#5b21d4] hover:cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2.5"
              >
                {savingPermissions ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
