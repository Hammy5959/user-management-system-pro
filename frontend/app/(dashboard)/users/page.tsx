"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { decodeToken, clearAuth } from "@/lib/auth";
import { fetchUsers, deleteUser, toggleUserStatus } from "@/lib/api";
import { useUserDisplay } from "@/lib/UserContext";
import type { ApiUser } from "@/types";

import UsersTable from "@/components/UsersTable";
import ViewUserModal from "@/components/modals/ViewUserModal";
import EditUserModal from "@/components/modals/EditUserModal";
import DeleteUserModal from "@/components/modals/DeleteUserModal";
import AddUserModal from "@/components/modals/AddUserModal";

export default function UsersPage() {
  const router = useRouter();
  const { setDisplayName, setCurrentUser, setIsLoading } = useUserDisplay();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<
    string[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Modal states
  const [viewUser, setViewUser] = useState<ApiUser | null>(null);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<ApiUser | null>(
    null,
  );
  const [showAddUser, setShowAddUser] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search state (backed by API)
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const filterInProgress = useRef(false);

  const loadData = useCallback(
    async (searchName?: string, searchEmail?: string) => {
      try {
        const name = searchName ?? "";
        const email = searchEmail ?? "";
        const params: { name?: string; email?: string } = {};
        if (name.trim()) params.name = name.trim();
        if (email.trim()) params.email = email.trim();
        const data = await fetchUsers(
          Object.keys(params).length > 0 ? params : undefined,
        );
        setUsers(data);

        // Update display name and current user in shared context
        const uid = decodeToken()?.id;
        if (uid) {
          const me = data.find((u: ApiUser) => u.id === uid);
          if (me) {
            setDisplayName(`${me.first_name} ${me.last_name}`);
            setCurrentUser(me);
            setCurrentUserPermissions(me.permissions);
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
    },
    [router, setDisplayName],
  );

  useEffect(() => {
    const decoded = decodeToken();
    if (decoded) {
      setCurrentUserPermissions(decoded.permissions);
      setCurrentUserId(decoded?.id ?? null);
    }

    setLoading(true);
    loadData().finally(() => { setLoading(false); setIsLoading(false); });
  }, [loadData, setIsLoading]);

  // Handle bfcache restoration: re-fetch data and re-read token
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const decoded = decodeToken();
        if (decoded) {
          setCurrentUserPermissions(decoded.permissions);
          setCurrentUserId(decoded?.id ?? null);
        }

        setLoading(true);
        loadData().finally(() => { setLoading(false); setIsLoading(false); });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [loadData]);

  // Fetch with filters when search inputs change (debounced)
  useEffect(() => {
    if (!filterInProgress.current) {
      filterInProgress.current = true;
      return;
    }
    const timer = setTimeout(() => {
      loadData(nameFilter, emailFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [nameFilter, emailFilter, loadData]);

  const handleDelete = async () => {
    if (!deleteUserTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteUserTarget.id);
      toast.success("User deleted successfully");
      setDeleteUserTarget(null);
      loadData(nameFilter, emailFilter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const canCreate = currentUserPermissions.includes("Create Users");
  const canDelete = currentUserPermissions.includes("Delete Users");
  const canEditUser = currentUserPermissions.includes("Manage Users");
  const canToggleStatus = currentUserPermissions.includes("Manage Users");

  const handleToggleStatus = async (user: ApiUser) => {
    const action = user.is_active ? "deactivated" : "activated";
    try {
      const result = await toggleUserStatus(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: result.is_active } : u,
        ),
      );
      toast.success(`User ${action} successfully`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${action} user`,
      );
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-pulse">
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded w-full max-w-xs" />
          <div className="h-72 bg-gray-200 rounded" />
        </div>
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
          Failed to load users
        </h3>
        <p className="text-sm text-gray-500 mb-8 max-w-md">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            loadData(nameFilter, emailFilter).finally(() => setLoading(false));
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
      <UsersTable
        users={users}
        onView={setViewUser}
        onEdit={canEditUser ? setEditUser : undefined}
        onDelete={canDelete ? setDeleteUserTarget : undefined}
        onAddUser={canCreate ? () => setShowAddUser(true) : undefined}
        onToggleStatus={canToggleStatus ? handleToggleStatus : undefined}
        canCreate={canCreate}
        canDelete={canDelete}
        canEditUser={canEditUser}
        canToggleStatus={canToggleStatus}
        currentUserId={currentUserId}
        nameFilter={nameFilter}
        emailFilter={emailFilter}
        onNameFilterChange={setNameFilter}
        onEmailFilterChange={setEmailFilter}
      />

      {/* Modals */}
      {viewUser && (
        <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={() => loadData(nameFilter, emailFilter)}
        />
      )}
      {deleteUserTarget && (
        <DeleteUserModal
          user={deleteUserTarget}
          onClose={() => setDeleteUserTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSave={() => loadData(nameFilter, emailFilter)}
        />
      )}
    </>
  );
}
