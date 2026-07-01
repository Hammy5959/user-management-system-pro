"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface BreadcrumbSegment {
  href: string;
  label: string;
  isCurrent: boolean;
}

const labelMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/roles": "Roles",
  "/permissions": "Permissions",
};

/**
 * Breadcrumb navigation that auto-detects the current route via Next.js usePathname().
 *
 * - Dashboard root → shows "Dashboard" (not clickable).
 * - Child pages → "Dashboard › Users" etc. (Dashboard is a clickable link,
 *   the current page is plain text).
 */
export default function Breadcrumbs() {
  const pathname = usePathname();

  const segments = buildSegments(pathname);
  if (!segments.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-8 lg:px-10 py-2.5 bg-[#E9EBEE]">
      <ol className="flex items-center gap-1.5 text-sm">
        {segments.map((seg, i) => (
          <li key={seg.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
            )}
            {seg.isCurrent ? (
              <span className="font-medium text-gray-900">{seg.label}</span>
            ) : (
              <Link
                href={seg.href}
                className="text-gray-500 hover:text-[#4F0DCB] transition-colors"
              >
                {seg.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function buildSegments(pathname: string): BreadcrumbSegment[] {
  // Root dashboard — single segment marked as current
  if (pathname === "/dashboard") {
    return [{ href: "/dashboard", label: "Dashboard", isCurrent: true }];
  }

  // Child routes: Dashboard (clickable link) + current page (plain text)
  const label = labelMap[pathname];
  if (!label) return [];

  return [
    { href: "/dashboard", label: "Dashboard", isCurrent: false },
    { href: pathname, label, isCurrent: true },
  ];
}
