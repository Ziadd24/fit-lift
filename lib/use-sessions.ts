import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionOverride {
  id: number;
  status: "scheduled" | "in_progress" | "paused" | "completed";
  started_at?: string | null;
  paused_at?: string | null;
  ended_at?: string | null;
}

interface SessionState {
  overrides: Record<number, SessionOverride>;
  setOverride: (id: number, override: Partial<SessionOverride>) => void;
  clearOverrides: () => void;
}

export const useSessions = create<SessionState>()(
  persist(
    (set) => ({
      overrides: {},
      setOverride: (id, update) => set((state) => ({
        overrides: {
          ...state.overrides,
          [id]: { ...(state.overrides[id] || { id }), ...update }
        }
      })),
      clearOverrides: () => set({ overrides: {} }),
    }),
    {
      name: "fitgym-session-storage",
    }
  )
);
