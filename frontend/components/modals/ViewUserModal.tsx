"use client";

import { useEffect } from "react";
import { X, Shield, Mail, Phone, LogOut } from "lucide-react";
import type { ApiUser } from "@/types";
import Avatar from "@/components/Avatar";

interface ViewUserModalProps {
  user: ApiUser;
  onClose: () => void;
  onLogout?: () => void;
}

export default function ViewUserModal({ user, onClose, onLogout }: ViewUserModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

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
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors hover:cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* Avatar + Name */}
          <div className="flex items-center gap-5 mb-8">
            <Avatar user={user} size="xl" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              <span
                className={`inline-block text-xs font-medium px-3 py-1 rounded-full mt-1.5 ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 text-sm">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-600">{user.email}</span>
            </div>
            <div className="flex items-center gap-3.5 text-sm">
              <Phone size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-600">{user.phone}</span>
            </div>
            <div className="flex items-center gap-3.5 text-sm">
              <Shield size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-600">
                ID: <span className="font-mono">{user.id}</span>
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
          {onLogout ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-200 transition-colors hover:cursor-pointer"
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors hover:cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
