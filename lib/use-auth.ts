import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Member } from "@/lib/supabase";

interface AuthState {
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;

  memberCode: string | null;
  currentMember: Member | null;
  setMemberAuth: (code: string | null, member: Member | null) => void;

  logoutMember: () => void;
  logoutAdmin: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      adminToken: null,
      setAdminToken: (token) => set({ adminToken: token }),

      memberCode: null,
      currentMember: null,
      setMemberAuth: (code, member) =>
        set({ memberCode: code, currentMember: member }),

      logoutMember: () => set({ memberCode: null, currentMember: null }),
      logoutAdmin: () => set({ adminToken: null }),
    }),
    {
      name: "fitgym-auth-storage",
    }
  )
);
