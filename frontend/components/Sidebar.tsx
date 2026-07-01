"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  Sparkles,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/roles", label: "Roles", icon: Shield },
  { href: "/permissions", label: "Permissions", icon: KeyRound },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    // Exact match for /dashboard, prefix match for sub-routes
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-[#0B1120] text-white transition-all duration-300 overflow-hidden ${
          collapsed ? "w-16" : "w-64"
        } ${collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center h-18 px-6 border-b border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#4F0DCB] flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                collapsed ? "max-w-0" : "max-w-[160px]"
              }`}
            >
              <span
                className={`block transition-all duration-300 ${
                  collapsed
                    ? "opacity-0 -translate-x-4"
                    : "opacity-100 translate-x-0 delay-[50ms]"
                }`}
              >
                User Management
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-7">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-lg transition-all duration-200 hover:cursor-pointer ${
                  active
                    ? "bg-[#4F0DCB]/20 text-[#4F0DCB] border-l-[3px] border-[#4F0DCB] rounded-l-none"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <Icon size={22} className="shrink-0" />
                <div
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                    collapsed ? "max-w-0" : "max-w-[120px]"
                  }`}
                >
                  <span
                    className={`block transition-all duration-300 ${
                      collapsed
                        ? "opacity-0 -translate-x-3"
                        : "opacity-100 translate-x-0 delay-[50ms]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
