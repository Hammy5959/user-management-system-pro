"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { LogOut, Mail, Phone, Shield, Pencil } from "lucide-react";
import type { ApiUser } from "@/types";
import Avatar from "@/components/Avatar";

interface ProfileDropdownProps {
  user: ApiUser;
  onLogout: () => void;
  onEditProfile?: () => void;
}

export default function ProfileDropdown({
  user,
  onLogout,
  onEditProfile,
}: ProfileDropdownProps) {
  const displayName = `${user.first_name} ${user.last_name}`;

  return (
    <HoverCard.Root openDelay={0} closeDelay={150}>
      <HoverCard.Trigger asChild>
        <span
          className="relative inline-flex cursor-pointer"
        >
          <Avatar user={user} size="md" />
          {/* Online status dot */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white rounded-full" />
        </span>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="bg-white rounded-xl shadow-lg border border-gray-100 w-72"
        >
          {/* Avatar + Name + Role */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-4">
              <Avatar user={user} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate ">
                  {displayName}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 pb-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-600 truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-600">{user.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-600">
                ID: <span className="font-mono">{user.id}</span>
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Edit Profile */}
          {onEditProfile && (
            <div className="p-2">
              <button
                onClick={onEditProfile}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors hover:cursor-pointer"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="p-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-200 transition-colors hover:cursor-pointer"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <HoverCard.Arrow className="fill-white" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
