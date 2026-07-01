"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { updateUser, fetchRoles, uploadProfilePicture } from "@/lib/api";
import type { ApiUser, ApiRole } from "@/types";
import Avatar from "@/components/Avatar";

interface EditUserModalProps {
  user: ApiUser;
  onClose: () => void;
  onSave: () => void;
  hideRole?: boolean;
}

export default function EditUserModal({
  user,
  onClose,
  onSave,
  hideRole,
}: EditUserModalProps) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Revoke object URL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    fetchRoles()
      .then((data) => {
        setRoles(data);
        const currentRole = data.find((r) => r.name === user.role);
        if (currentRole) {
          setRoleId(currentRole.id);
        }
      })
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoadingRoles(false));
  }, [user.role]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email format");
      return;
    }

    setSaving(true);
    try {
      // Upload profile picture first if one was selected
      if (selectedFile) {
        setUploading(true);
        await uploadProfilePicture(selectedFile);
        setUploading(false);
      }

      const payload: Record<string, string | number> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      };
      if (roleId !== null) {
        payload.role_id = roleId;
      }
      await updateUser(user.id, payload);
      toast.success("User updated successfully");
      onSave();
      onClose();
    } catch (err) {
      setUploading(false);
      toast.error(
        err instanceof Error ? err.message : "Failed to update user"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors hover:cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-6">
          {/* User info header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="flex flex-col items-center gap-1">
              <Avatar user={user} size="lg" overrideSrc={previewUrl} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-medium text-[#4F0DCB] hover:underline hover:cursor-pointer whitespace-nowrap"
              >
                Change Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            </div>
            <span
              className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${
                user.role === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {user.role}
            </span>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-[#4F0DCB] transition-colors"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-[#4F0DCB] transition-colors"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-[#4F0DCB] transition-colors"
            />
          </div>

          {/* Role */}
          {!hideRole && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                value={roleId ?? ""}
                onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
                disabled={loadingRoles}
                className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-[#4F0DCB] transition-colors disabled:opacity-50"
              >
                {loadingRoles ? (
                  <option value="">Loading roles...</option>
                ) : (
                  roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 hover:cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#4F0DCB] rounded-lg hover:bg-[#5b21d4] transition-colors disabled:opacity-50 flex items-center gap-2.5 hover:cursor-pointer"
          >
            {uploading ? (
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
                Uploading...
              </>
            ) : saving ? (
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
  );
}
