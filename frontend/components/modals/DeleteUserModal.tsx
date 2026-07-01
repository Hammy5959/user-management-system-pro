"use client";

import { useEffect } from "react";
import { TriangleAlert, X } from "lucide-react";
import type { ApiUser } from "@/types";

interface DeleteUserModalProps {
  user: ApiUser;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export default function DeleteUserModal({
  user,
  onClose,
  onConfirm,
  deleting,
}: DeleteUserModalProps) {
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
          <button
            onClick={onClose}
            disabled={deleting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-7 py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <TriangleAlert size={30} className="text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Are you sure?
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            You are about to delete{" "}
            <span className="font-semibold text-gray-700">
              {user.first_name} {user.last_name}
            </span>
            . This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-100 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2.5"
          >
            {deleting ? (
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
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
