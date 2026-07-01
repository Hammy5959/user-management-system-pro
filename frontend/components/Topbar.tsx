"use client";

import { Menu, User } from "lucide-react";
import type { ApiUser } from "@/types";
import ProfileDropdown from "@/components/ProfileDropdown";

interface TopbarProps {
  pageTitle: string;
  userName: string;
  userRole: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onEditProfile?: () => void;
  currentUser: ApiUser | null;
  isLoading: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Topbar({
  pageTitle,
  userName,
  userRole,
  onToggleSidebar,
  onLogout,
  onEditProfile,
  currentUser,
  isLoading,
}: TopbarProps) {
  const initials = getInitials(userName);

  const rightContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1.5" />
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
      );
    }

    if (currentUser) {
      return (
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
              {userName}
            </p>
            <span
              className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${
                userRole === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {userRole || "user"}
            </span>
          </div>
          <ProfileDropdown user={currentUser} onLogout={onLogout} onEditProfile={onEditProfile} />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User size={16} className="text-gray-400" />
        </div>
      </div>
    );
  };

  return (
    <header className="h-18 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 shrink-0 ">
      {/* Left side */}
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {rightContent()}
      </div>
    </header>
  );
}