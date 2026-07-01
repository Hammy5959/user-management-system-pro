"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Key } from "lucide-react";

import { decodeToken, clearAuth } from "@/lib/auth";
import { fetchUsers } from "@/lib/api";
import { useUserDisplay } from "@/lib/UserContext";
import { ALL_PERMISSIONS } from "@/types";
import type { ApiUser } from "@/types";

export default function PermissionsPage() {
  const router = useRouter();
  const { setDisplayName, setCurrentUser, setIsLoading } = useUserDisplay();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);

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

  const permissionStats = ALL_PERMISSIONS.map((perm) => ({
    name: perm,
    count: users.filter((u: ApiUser) => u.permissions.includes(perm)).length,
  }));

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {Array.from({ length: 5 }).map((_, i) => (
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
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
          <span className="text-red-500 text-2xl font-bold">!</span>
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
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-3">
      {permissionStats.map((ps) => (
        <div
          key={ps.name}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-8"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Key size={18} className="text-[#4F0DCB]" />
            </div>
            <p className="text-sm font-medium text-gray-700">{ps.name}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{ps.count}</p>
          <p className="text-xs text-gray-400 mt-2">
            users with this permission
          </p>
        </div>
      ))}
    </div>
  );
}
