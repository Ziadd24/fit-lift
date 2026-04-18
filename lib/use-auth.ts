import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Member, Coach } from "@/lib/supabase";

// Session expires after 24 hours of inactivity
const MEMBER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
// Admin JWT is already time-limited server-side (8h), but we also
// clear it client-side after 8 hours to force re-login
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
// Coach sessions: 24h default, 30 days if rememberMe
const COACH_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const COACH_SESSION_REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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
  coachRememberMe: boolean;
  setCoachAuth: (token: string | null, coach: Coach | null, rememberMe?: boolean) => void;

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
      coachRememberMe: false,
      setCoachAuth: (token, coach, rememberMe = false) =>
        set({
          coachToken: token,
          currentCoach: coach,
          coachLoginAt: token ? Date.now() : null,
          coachRememberMe: rememberMe,
        }),

      logoutMember: () =>
        set({ memberCode: null, currentMember: null, memberLoginAt: null }),

      logoutAdmin: () =>
        set({ adminToken: null, adminLoginAt: null }),

      logoutCoach: () =>
        set({ coachToken: null, currentCoach: null, coachLoginAt: null, coachRememberMe: false }),

      checkSessionExpiry: () => {
        const { memberLoginAt, adminLoginAt, coachLoginAt, coachRememberMe } = get();
        const now = Date.now();

        // Clear expired member session
        if (memberLoginAt && now - memberLoginAt > MEMBER_SESSION_TTL_MS) {
          set({ memberCode: null, currentMember: null, memberLoginAt: null });
        }

        // Clear expired admin session
        if (adminLoginAt && now - adminLoginAt > ADMIN_SESSION_TTL_MS) {
          set({ adminToken: null, adminLoginAt: null });
        }

        // Clear expired coach session (with rememberMe support)
        const coachTTL = coachRememberMe ? COACH_SESSION_REMEMBER_TTL_MS : COACH_SESSION_TTL_MS;
        if (coachLoginAt && now - coachLoginAt > coachTTL) {
          set({ coachToken: null, currentCoach: null, coachLoginAt: null, coachRememberMe: false });
        }
      },
    }),
    {
      name: "fitgym-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state && state.coachToken && state.coachToken.length < 20) {
          state.coachToken = null;
          state.currentCoach = null;
          state.coachLoginAt = null;
        }
        if (state && state.adminToken && state.adminToken.length < 20) {
          state.adminToken = null;
          state.adminLoginAt = null;
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
        coachRememberMe: state.coachRememberMe,
      }),
    }
  )
);
