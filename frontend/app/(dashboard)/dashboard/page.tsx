"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Users,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Shield,
} from "lucide-react";

import { decodeToken, clearAuth } from "@/lib/auth";
import { fetchUsers } from "@/lib/api";
import { useUserDisplay } from "@/lib/UserContext";
import { ALL_PERMISSIONS } from "@/types";
import type { ApiUser } from "@/types";
import StatsCard from "@/components/StatsCard";

export default function DashboardOverview() {
  const router = useRouter();
  const { setDisplayName, setCurrentUser, setIsLoading } = useUserDisplay();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);

      // Look up current user name from the fetched list
      const uid = decodeToken()?.id;
      if (uid) {
        const me = data.find((u: ApiUser) => u.id === uid);
        if (me) {
          setDisplayName(`${me.first_name} ${me.last_name}`);
          setCurrentUser(me);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load data";
      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("token")
      ) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setError(message);
      toast.error(message);
    }
  }, [router, setDisplayName]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => { setLoading(false); setIsLoading(false); });
  }, [loadData, setIsLoading]);

  // Handle bfcache restoration: re-fetch data when page is restored from cache
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setLoading(true);
        loadData().finally(() => { setLoading(false); setIsLoading(false); });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [loadData, setIsLoading]);

  // Stats
  const totalUsers = users.length;
  const adminUsers = users.filter((u: ApiUser) => u.role === "admin").length;
  const standardUsers = users.filter((u: ApiUser) => u.role === "user").length;
  const totalPermissions = ALL_PERMISSIONS.length;

  return (
    <>
      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-pulse"
            >
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
            <Shield size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load data
          </h3>
          <p className="text-sm text-gray-500 mb-8 max-w-md">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadData().finally(() => setLoading(false));
            }}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#4F0DCB] rounded-lg hover:bg-[#5b21d4] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <StatsCard icon={Users} label="Total Users" value={totalUsers} />
          <StatsCard
            icon={ShieldCheck}
            label="Admin Users"
            value={adminUsers}
          />
          <StatsCard
            icon={UserCheck}
            label="Standard Users"
            value={standardUsers}
          />
          <StatsCard
            icon={KeyRound}
            label="Total Permissions"
            value={totalPermissions}
          />
        </div>
      )}
    </>
  );
}
