"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  ArrowUpDown,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ApiUser } from "@/types";
import Avatar from "@/components/Avatar";

type SortField = "name" | "email" | "role";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 5;

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);
  return pages;
}

interface UsersTableProps {
  users: ApiUser[];
  onView: (user: ApiUser) => void;
  onEdit?: (user: ApiUser) => void;
  onDelete?: (user: ApiUser) => void;
  onAddUser?: () => void;
  onToggleStatus?: (user: ApiUser) => void;
  canCreate?: boolean;
  canDelete?: boolean;
  canEditUser?: boolean;
  canToggleStatus?: boolean;
  currentUserId?: number | null;
  nameFilter: string;
  emailFilter: string;
  onNameFilterChange: (value: string) => void;
  onEmailFilterChange: (value: string) => void;
}

export default function UsersTable({
  users,
  onView,
  onEdit,
  onDelete,
  onAddUser,
  onToggleStatus,
  canCreate = false,
  canDelete = false,
  canEditUser = false,
  canToggleStatus = false,
  currentUserId,
  nameFilter,
  emailFilter,
  onNameFilterChange,
  onEmailFilterChange,
}: UsersTableProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">(
    "all"
  );
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, emailFilter]);

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === "email") {
        cmp = a.email.toLowerCase().localeCompare(b.email.toLowerCase());
      } else if (sortField === "role") {
        cmp = a.role.localeCompare(b.role);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    // Pin the current user to the top regardless of sort order
    if (currentUserId != null) {
      const idx = result.findIndex((u) => u.id === currentUserId);
      if (idx > 0) {
        const [pinned] = result.splice(idx, 1);
        result.unshift(pinned);
      }
    }

    return result;
  }, [users, roleFilter, sortField, sortDir, currentUserId]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = () => (
    <ArrowUpDown size={14} className="text-gray-400" />
  );

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const displayPage = Math.min(currentPage, pageCount);
  const paginatedUsers = filteredUsers.slice(
    (displayPage - 1) * ITEMS_PER_PAGE,
    displayPage * ITEMS_PER_PAGE
  );
  const startItem = filteredUsers.length === 0 ? 0 : (displayPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(displayPage * ITEMS_PER_PAGE, filteredUsers.length);

  // Loading skeleton
  if (users.length === 0 && nameFilter === "" && emailFilter === "" && roleFilter === "all") {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users size={32} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            No users yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Add your first user to get started.
          </p>
          {canCreate && onAddUser && (
            <button
              onClick={onAddUser}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4F0DCB] rounded-lg hover:bg-[#5b21d4] transition-colors"
            >
              <Plus size={16} />
              Add User
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mt-3">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          {/* Name filter */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name..."
              value={nameFilter}
              onChange={(e) => onNameFilterChange(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-[#4F0DCB] transition-colors shadow"
            />
          </div>

          {/* Email filter */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by email..."
              value={emailFilter}
              onChange={(e) => onEmailFilterChange(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-[#4F0DCB] transition-colors shadow"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "all" | "admin" | "user")
            }
            className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-[#4F0DCB] transition-colors shadow"
          >
            <option value="all">All Users</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="flex items-center gap-6 w-full sm:w-auto">
          {/* Sort */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <button
              onClick={() => toggleSort("name")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors hover:cursor-pointer ${
                sortField === "name"
                  ? "bg-gray-100 text-gray-700 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              Name
              {sortField === "name" && (
                <span className="text-xs">
                  {sortDir === "asc" ? "↑" : "↓"}
                </span>
              )}
              {sortField !== "name" && <SortIcon />}
            </button>
            <button
              onClick={() => toggleSort("email")}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors hover:cursor-pointer ${
                sortField === "email"
                  ? "bg-gray-100 text-gray-700 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              Email
              {sortField === "email" && (
                <span className="text-xs">
                  {sortDir === "asc" ? "↑" : "↓"}
                </span>
              )}
              {sortField !== "email" && <SortIcon />}
            </button>
          </div>

          {/* Add User */}
          {canCreate && onAddUser && (
            <button
              onClick={onAddUser}
              className="flex items-center gap-2 px-5 h-10 text-sm font-medium text-white bg-[#4F0DCB] rounded-xl hover:bg-[#5b21d4] transition-colors shrink-0 hover:cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty state (when filters produce no results) */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={32} className="text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              No matching users
            </h3>
            <p className="text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F5F2FF]">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-8 py-5">
                    Name
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-8 py-5 hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-8 py-5">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-8 py-5">
                    Role
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-8 py-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* User */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} size="sm" variant="light" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-400 md:hidden">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-8 py-5 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>

                    {/* Status */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.is_active ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm text-gray-600">
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-8 py-5">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-1">
                        {canToggleStatus && onToggleStatus && currentUserId !== user.id && user.role !== "admin" && (
                          <button
                            onClick={() => onToggleStatus(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active
                                ? "text-green-600 hover:bg-green-50 hover:cursor-pointer"
                                : "text-gray-400 hover:bg-gray-100 hover:cursor-pointer"
                            }`}
                            title={
                              user.is_active
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            <div
                              className={`w-7 h-[14px] rounded-full relative transition-colors ${
                                user.is_active ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              <div
                                className={`absolute top-[1px] left-[1px] w-3 h-3 rounded-full bg-white shadow transition-transform ${
                                  user.is_active
                                    ? "translate-x-[14px]"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </button>
                        )}
                        {currentUserId !== user.id && (
                          <button
                            onClick={() => onView(user)}
                            className="p-2 rounded-lg text-gray-400 hover:text-[#4F0DCB] hover:bg-purple-50 transition-colors cursor-pointer"
                            title="View user"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {canEditUser && onEdit && currentUserId !== user.id && (
                          <button
                            onClick={() => onEdit(user)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors hover:cursor-pointer"
                            title="Edit user"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDelete && onDelete && currentUserId !== user.id && (
                          <button
                            onClick={() => onDelete(user)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors hover:cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with pagination */}
          <div className="px-8 py-4 border-t border-gray-50 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {filteredUsers.length}
                </span>{" "}
                users
              </p>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={displayPage === 1}
                  className="p-2 rounded-lg text-black font-extrabold  hover:bg-gray-100 hover:text-black hover:cursor-pointer transition-colors disabled:opacity-50  disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {getPageNumbers(displayPage, pageCount).map((page, idx) =>
                  page === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-xs text-gray-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 text-xs font-medium rounded-lg transition-colors hover:cursor-pointer ${
                        displayPage === page
                          ? "bg-[#4F0DCB] text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      aria-label={`Page ${page}`}
                      aria-current={displayPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                  disabled={displayPage === pageCount}
                  className="p-2 rounded-lg text-black font-extrabold hover:text-black hover:bg-gray-100 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
