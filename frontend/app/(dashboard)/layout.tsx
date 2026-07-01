"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { UserProvider, useUserDisplay } from "@/lib/UserContext";
import { fetchUsers } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import EditUserModal from "@/components/modals/EditUserModal";
import { decodeToken, clearAuth } from "@/lib/auth";
import { ChevronLeft, ChevronRight } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/roles": "Roles",
  "/permissions": "Permissions",
};

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    displayName,
    currentUser,
    isLoading,
    setCurrentUser,
    setDisplayName,
  } = useUserDisplay();
  const pageTitle = pageTitles[pathname] || "Dashboard";
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const decoded = decodeToken();
    setUserRole(decoded?.role ?? "");
  }, []);

  const [editingSelf, setEditingSelf] = useState(false);

  const handleEditProfile = useCallback(() => {
    setEditingSelf(true);
  }, []);

  const handleEditProfileSave = useCallback(async () => {
    try {
      const uid = decodeToken()?.id;
      if (uid) {
        const data = await fetchUsers();
        const me = data.find((u) => u.id === uid);
        if (me) {
          setCurrentUser(me);
          setDisplayName(`${me.first_name} ${me.last_name}`);
        }
      }
    } catch {
      // Silently fail — next page load will refresh the data
    }
    setEditingSelf(false);
  }, [setCurrentUser, setDisplayName]);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <>
      <div className="flex h-screen bg-[#E9EBEE] relative">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Floating collapse button (desktop) — sits on the sidebar edge */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
          className="hidden lg:flex absolute z-40 items-center justify-center
            w-7 h-7 rounded-full
            bg-[#0B1120] border border-white/10 shadow-lg shadow-black/20
            text-gray-400 hover:text-white 
            -translate-y-1/2 -translate-x-1/2
            transition-all duration-300
            hover:cursor-pointer"
          style={{
            top: "50%",
            left: sidebarCollapsed ? 64 : 256,
          }}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            pageTitle={pageTitle}
            userName={displayName}
            userRole={userRole}
            isLoading={isLoading}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            onLogout={handleLogout}
            onEditProfile={handleEditProfile}
            currentUser={currentUser}
          />

          <main className="flex-1 overflow-y-auto">
            <Breadcrumbs />
            <div className="px-8 lg:px-10 pb-10 lg:pb-14 space-y-20">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Profile Modal (self-edit — no Role dropdown) */}
      {editingSelf && currentUser && (
        <EditUserModal
          user={currentUser}
          hideRole
          onClose={() => setEditingSelf(false)}
          onSave={handleEditProfileSave}
        />
      )}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
