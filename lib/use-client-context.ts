/**
 * use-client-context.ts
 * ─────────────────────────────────────────────────────────────
 * Shared Zustand store for the "currently selected client" so
 * the coach can drill into one client's data across pages
 * (Calories, Schedule, Messages, etc.) without losing context
 * when navigating between routes.
 *
 * Usage:
 *   const { selectedClientId, setSelectedClient } = useClientContext();
 */

import { create } from "zustand";

interface ClientContextState {
  /** The numeric DB id of the client the coach is currently viewing */
  selectedClientId: number | null;
  /** Display name — stored alongside id to avoid extra fetches in breadcrumbs */
  selectedClientName: string | null;

  /** Select a client to drill into */
  setSelectedClient: (id: number, name: string) => void;
  /** Return to the roster overview */
  clearSelectedClient: () => void;
}

export const useClientContext = create<ClientContextState>()((set) => ({
  selectedClientId: null,
  selectedClientName: null,

  setSelectedClient: (id, name) =>
    set({ selectedClientId: id, selectedClientName: name }),

  clearSelectedClient: () =>
    set({ selectedClientId: null, selectedClientName: null }),
}));
