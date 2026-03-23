import { useQuery, useMutation } from "@tanstack/react-query";
import type { Member, Photo, Announcement } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

function getAuthHeaders(token?: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Members ───────────────────────────────────────────────────────────────

export function useListMembers() {
  const { adminToken } = useAuth();
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/members", {
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!adminToken,
  });
}

export function useGetMember(id: number) {
  const { adminToken } = useAuth();
  return useQuery<Member>({
    queryKey: ["members", id],
    queryFn: async () => {
      const res = await fetch(`/api/members/${id}`, {
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Member not found");
      return res.json();
    },
    enabled: !!adminToken && !!id,
  });
}

export function useLookupMember() {
  return useMutation<Member, Error, { membershipCode: string }>({
    mutationFn: async ({ membershipCode }) => {
      const res = await fetch("/api/members/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipCode }),
      });
      if (!res.ok) throw new Error("Member not found");
      return res.json();
    },
  });
}

export function useCreateMember() {
  const { adminToken } = useAuth();
  return useMutation<Member, Error, Omit<Member, "id" | "created_at">>({
    mutationFn: async (data) => {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create member");
      }
      return res.json();
    },
  });
}

export function useUpdateMember() {
  const { adminToken } = useAuth();
  return useMutation<Member, Error, { id: number; data: Partial<Member> }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update member");
      return res.json();
    },
  });
}

export function useDeleteMember() {
  const { adminToken } = useAuth();
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to delete member");
    },
  });
}

// ─── Photos ────────────────────────────────────────────────────────────────

export function useListPhotos(params?: { memberId?: number }) {
  const { adminToken, memberCode } = useAuth();
  return useQuery<Photo[]>({
    queryKey: ["photos", params],
    queryFn: async () => {
      const qs = params?.memberId ? `?memberId=${params.memberId}` : "";
      const res = await fetch(`/api/photos${qs}`, {
        headers: getAuthHeaders(adminToken || memberCode),
      });
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
  });
}

export function useUploadPhoto() {
  const { adminToken } = useAuth();
  return useMutation<
    Photo,
    Error,
    { file: File; caption?: string; memberId?: number }
  >({
    mutationFn: async ({ file, caption, memberId }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (caption) formData.append("caption", caption);
      if (memberId) formData.append("memberId", String(memberId));

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: getAuthHeaders(adminToken),
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
  });
}

export function useDeletePhoto() {
  const { adminToken } = useAuth();
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/photos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to delete photo");
    },
  });
}

// ─── Announcements ─────────────────────────────────────────────────────────

export function useListAnnouncements(params?: { memberId?: number }) {
  const { adminToken, currentMember } = useAuth();
  return useQuery<Announcement[]>({
    queryKey: ["announcements", params],
    queryFn: async () => {
      const qs = params?.memberId
        ? `?memberId=${params.memberId}`
        : currentMember
        ? `?memberId=${currentMember.id}`
        : "";
      const res = await fetch(`/api/announcements${qs}`, {
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
  });
}

export function useCreateAnnouncement() {
  const { adminToken } = useAuth();
  return useMutation<
    Announcement,
    Error,
    {
      title: string;
      content: string;
      is_global: boolean;
      target_member_id?: number | null;
    }
  >({
    mutationFn: async (data) => {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      return res.json();
    },
  });
}

export function useDeleteAnnouncement() {
  const { adminToken } = useAuth();
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
    },
  });
}

// ─── Admin Auth ─────────────────────────────────────────────────────────────

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
