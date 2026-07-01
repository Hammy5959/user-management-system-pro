"use client";

import { getProfilePictureUrl } from "@/lib/api";
import type { ApiUser } from "@/types";

interface AvatarProps {
  user: ApiUser;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "solid" | "light";
  className?: string;
  /** Override the image source (e.g. for local preview before upload) */
  overrideSrc?: string | null;
}

const sizeClasses: Record<string, string> = {
  sm: "w-9 h-9 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-sm",
  xl: "w-20 h-20 text-xl",
};

const variantClasses: Record<string, string> = {
  solid: "bg-[#4F0DCB] text-white",
  light: "bg-[#4F0DCB]/10 text-[#4F0DCB]",
};

export default function Avatar({
  user,
  size = "md",
  variant = "solid",
  className = "",
  overrideSrc,
}: AvatarProps) {
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const imageUrl = overrideSrc || getProfilePictureUrl(user.profile_picture);

  const baseClasses = "rounded-full flex items-center justify-center shrink-0 overflow-hidden";

  if (imageUrl) {
    return (
      <div
        className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      >
        <img
          src={imageUrl}
          alt={`${user.first_name} ${user.last_name}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} font-bold ${className}`}
    >
      {initials}
    </div>
  );
}
