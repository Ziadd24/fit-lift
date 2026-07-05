import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";

// --- Coaches ---

export interface AdminCoach {
  id: number;
  name: string;
  display_name: string | null;
  created_at: string;
  display_order: number;
  is_display_only: boolean;
}

export function useAdminCoaches() {
  const { adminToken } = useAuth();
  return useQuery<AdminCoach[]>({
    queryKey: ["admin-coaches"],
    queryFn: async () => {
      const res = await fetch("/api/coach/list", {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch coaches");
      return res.json();
    },
    enabled: !!adminToken,
  });
}

export function useAddAdminCoach() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  return useMutation({
    mutationFn: async (data: { name: string; display_name?: string; password?: string; is_display_only: boolean }) => {
      const res = await fetch("/api/coach/list", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add coach");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coaches"] }),
  });
}

export function useUpdateAdminCoach() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  return useMutation({
    mutationFn: async (data: { id: number; name: string; display_name: string | null }) => {
      const res = await fetch("/api/coach/list", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update coach");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coaches"] }),
  });
}

export function useDeleteAdminCoach() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch("/api/coach/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete coach");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["photos"] }); // Photos might be deleted
    },
  });
}

// --- Coach Packages ---

export interface CoachPackage {
  id: number;
  sessions: number;
  label_ar: string;
  label_en: string;
  price: number;
  popular: boolean;
  display_order: number;
}

export function useCoachPackages() {
  return useQuery<CoachPackage[]>({
    queryKey: ["coach-packages"],
    queryFn: async () => {
      const res = await fetch("/api/coach-packages");
      if (!res.ok) throw new Error("Failed to fetch coach packages");
      return res.json();
    },
  });
}

export function useAddCoachPackage() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  return useMutation({
    mutationFn: async (data: Omit<CoachPackage, "id">) => {
      const res = await fetch("/api/coach-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add package");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coach-packages"] }),
  });
}

export function useUpdateCoachPackage() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  return useMutation({
    mutationFn: async (data: CoachPackage) => {
      const res = await fetch("/api/coach-packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update package");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coach-packages"] }),
  });
}

export function useDeleteCoachPackage() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/coach-packages?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete package");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coach-packages"] }),
  });
}

// --- Member Assignment ---

export function useAdminAssignMember() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  return useMutation({
    mutationFn: async (data: { id: number; action: "assign" | "unassign"; coach_id?: number | null }) => {
      const res = await fetch(`/api/members/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update assignment");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate members queries to refresh the roster
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
  });
}

export function useAdminMembers(search: string = "") {
  const { adminToken } = useAuth();
  return useQuery({
    queryKey: ["admin-members", search],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: "all", sortBy: "name_asc" });
      if (search) params.append("search", search);
      const res = await fetch(`/api/members?${params.toString()}`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!adminToken,
  });
}
