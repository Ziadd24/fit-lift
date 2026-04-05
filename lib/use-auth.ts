import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Member, Coach } from "@/lib/supabase";

// Session expires after 24 hours of inactivity
const MEMBER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
// Admin JWT is already time-limited server-side (8h), but we also
// clear it client-side after 8 hours to force re-login
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
// Coach sessions also 24h
const COACH_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface AuthState {
  adminToken: string | null;
  adminLoginAt: number | null;
  setAdminToken: (token: string | null) => void;

  memberCode: string | null;
  currentMember: Member | null;
  memberLoginAt: number | null;
  setMemberAuth: (code: string | null, member: Member | null) => void;

  coachToken: string | null;
  currentCoach: Coach | null;
  coachLoginAt: number | null;
  setCoachAuth: (token: string | null, coach: Coach | null) => void;

  logoutMember: () => void;
  logoutAdmin: () => void;
  logoutCoach: () => void;

  // Call this on app init to clear expired sessions
  checkSessionExpiry: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      adminToken: null,
      adminLoginAt: null,
      setAdminToken: (token) =>
        set({ adminToken: token, adminLoginAt: token ? Date.now() : null }),

      memberCode: null,
      currentMember: null,
      memberLoginAt: null,
      setMemberAuth: (code, member) =>
        set({
          memberCode: code,
          currentMember: member,
          memberLoginAt: code ? Date.now() : null,
        }),

      coachToken: null,
      currentCoach: null,
      coachLoginAt: null,
      setCoachAuth: (token, coach) =>
        set({
          coachToken: token,
          currentCoach: coach,
          coachLoginAt: token ? Date.now() : null,
        }),

      logoutMember: () =>
        set({ memberCode: null, currentMember: null, memberLoginAt: null }),

      logoutAdmin: () =>
        set({ adminToken: null, adminLoginAt: null }),

      logoutCoach: () =>
        set({ coachToken: null, currentCoach: null, coachLoginAt: null }),

      checkSessionExpiry: () => {
        const { memberLoginAt, adminLoginAt, coachLoginAt } = get();
        const now = Date.now();

        // Clear expired member session
        if (memberLoginAt && now - memberLoginAt > MEMBER_SESSION_TTL_MS) {
          set({ memberCode: null, currentMember: null, memberLoginAt: null });
        }

        // Clear expired admin session
        if (adminLoginAt && now - adminLoginAt > ADMIN_SESSION_TTL_MS) {
          set({ adminToken: null, adminLoginAt: null });
        }

        // Clear expired coach session
        if (coachLoginAt && now - coachLoginAt > COACH_SESSION_TTL_MS) {
          set({ coachToken: null, currentCoach: null, coachLoginAt: null });
        }
      },
    }),
    {
      name: "fitgym-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state && state.coachToken && !state.coachToken.startsWith("fitgym-coach-")) {
          state.coachToken = null;
          state.currentCoach = null;
          state.coachLoginAt = null;
        }
      },
      // Only persist what we need — don't persist functions
      partialize: (state) => ({
        adminToken: state.adminToken,
        adminLoginAt: state.adminLoginAt,
        memberCode: state.memberCode,
        currentMember: state.currentMember,
        memberLoginAt: state.memberLoginAt,
        coachToken: state.coachToken,
        currentCoach: state.currentCoach,
        coachLoginAt: state.coachLoginAt,
      }),
    }
  )
);
