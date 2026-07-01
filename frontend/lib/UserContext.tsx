"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ApiUser } from "@/types";

interface UserContextValue {
  displayName: string;
  setDisplayName: (name: string) => void;
  currentUser: ApiUser | null;
  setCurrentUser: (user: ApiUser | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const UserContext = createContext<UserContextValue>({
  displayName: "",
  setDisplayName: () => {},
  currentUser: null,
  setCurrentUser: () => {},
  isLoading: true,
  setIsLoading: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState("");
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  return (
    <UserContext.Provider value={{ displayName, setDisplayName, currentUser, setCurrentUser, isLoading, setIsLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserDisplay() {
  return useContext(UserContext);
}