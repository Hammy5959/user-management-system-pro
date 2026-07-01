"use client";

import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { createUser } from "@/lib/api";

interface AddUserModalProps {
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export default function AddUserModal({ onClose, onSave }: AddUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const normalizePhoneInput = (value: string): string => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("92") && digits.length > 10) {
      digits = digits.slice(2);
    }
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 10);
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const PASSWORD_REGEX =
      /^(?=.*[0-9])(?=.*[!@#$%^&*()_\-+=?])[A-Za-z0-9!@#$%^&*()_\-+=?]{8,20}$/;

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    } else if (!/^3\d{9}$/.test(formData.phone)) {
      errors.phone = "Invalid phone number";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      errors.password =
        "Password must be 8-20 characters and include at least one number and one special character";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await createUser({ ...formData, phone: `+92${formData.phone}` });
      toast.success("User created successfully");
      onSave();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Add New User</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors hover:cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              placeholder="Enter first name"
              value={formData.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              className={`w-full h-12 px-4 rounded-lg border text-sm bg-white outline-none transition-colors ${
                fieldErrors.first_name
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-[#4F0DCB]"
              }`}
            />
            {fieldErrors.first_name && (
              <p className="text-xs text-red-500 mt-1">
                {fieldErrors.first_name}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Enter last name"
              value={formData.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              className={`w-full h-12 px-4 rounded-lg border text-sm bg-white outline-none transition-colors ${
                fieldErrors.last_name
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-[#4F0DCB]"
              }`}
            />
            {fieldErrors.last_name && (
              <p className="text-xs text-red-500 mt-1">
                {fieldErrors.last_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={`w-full h-12 px-4 rounded-lg border text-sm bg-white outline-none transition-colors ${
                fieldErrors.email
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-[#4F0DCB]"
              }`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div
              className={`flex items-center h-12 px-4 rounded-lg border bg-white transition-colors ${
                fieldErrors.phone
                  ? "border-red-400"
                  : "border-gray-200 focus-within:border-[#4F0DCB]"
              }`}
            >
              <span className="text-gray-600 font-medium text-sm mr-1 shrink-0">
                +92
              </span>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  updateField("phone", normalizePhoneInput(e.target.value))
                }
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div
              className={`flex items-center h-12 px-4 rounded-lg border bg-white transition-colors ${
                fieldErrors.password
                  ? "border-red-400"
                  : "border-gray-200 focus-within:border-[#4F0DCB]"
              }`}
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-500 mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-5 border-t border-gray-100 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 hover:cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#4F0DCB] rounded-lg hover:bg-[#5b21d4] transition-colors disabled:opacity-50 flex items-center gap-2.5 hover:cursor-pointer"
          >
            {saving ? (
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
                Adding...
              </>
            ) : (
              "Add User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
