import { useMutation } from "@tanstack/react-query";
import type { Coach, Member } from "@/lib/supabase";

export function useAdminLogin() {
  return useMutation<
    { success: boolean; token: string },
    Error,
    { username: string; password: string }
  >({
    mutationFn: async ({ username, password }) => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      return res.json();
    },
  });
}

export function useCoachLogin() {
  return useMutation<
    { success: boolean; token: string; coach: Coach },
    Error,
    { name: string; password: string }
  >({
    mutationFn: async ({ name, password }) => {
      const res = await fetch("/api/coach/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        const error = new Error(err.error || "Invalid credentials") as any;
        error.statusCode = res.status;
        throw error;
      }
      return res.json();
    },
  });
}



export function useMemberLogin() {
  return useMutation<
    { success: boolean; token: string; member: Member },
    Error,
    { membershipCode: string; phone: string }
  >({
    mutationFn: async ({ membershipCode, phone }) => {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipCode, phone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const error = new Error(err?.error || "Invalid credentials") as any;
        error.errorCode = err?.errorCode;
        throw error;
      }
      return res.json();
    },
  });
}
