import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Member, Photo, Announcement, Coach, Message, Session } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

function getAuthHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// â”€â”€â”€ Members â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type MembersPage = {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type UseListMembersOptions = {
  pageSize?: number | "all";
};

export function useListMembers(
  page: number = 1,
  search?: string,
  status?: string,
  type?: string,
  options?: UseListMembersOptions
) {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || memberCode;
  const pageSize = options?.pageSize;
  return useQuery<MembersPage>({
    queryKey: ["members", page, search, status, type, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (pageSize) params.set("pageSize", String(pageSize));
      if (search) params.set("search", search);
      if (status && status !== "all") params.set("status", status);
      if (type && type !== "all") params.set("type", type);
      const res = await fetch(`/api/members?${params.toString()}`, {
        headers: getAuthHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!token,
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
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Member not found");
      }
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
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || memberCode;
  const queryClient = useQueryClient();
  return useMutation<Member, Error, { id: number; data: Partial<Member> }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    }
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

/**
 * Search members that are not yet assigned to any coach.
 * Used by the "Add Client" drawer so a coach can claim existing members.
 */
export function useSearchUnassignedMembers(search: string) {
  const { coachToken } = useAuth();
  return useQuery<MembersPage>({
    queryKey: ["members", "unassigned", search],
    queryFn: async () => {
      const qs = new URLSearchParams({ unassigned: "true", pageSize: "all" });
      if (search) qs.set("search", search);
      const res = await fetch(`/api/members?${qs.toString()}`, {
        headers: getAuthHeaders(coachToken),
      });
      if (!res.ok) throw new Error("Failed to search members");
      return res.json();
    },
    enabled: !!coachToken,
    // Only re-fetch when search string changes (debounced by caller)
    staleTime: 5000,
  });
}

/**
 * Assign an existing member to the currently authenticated coach's roster,
 * or unassign them (remove from roster).
 */
export function useAssignMember() {
  const { coachToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<Member, Error, { id: number; action: "assign" | "unassign" }>({
    mutationFn: async ({ id, action }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(coachToken),
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update member assignment");
      }
      return res.json();
    },
    onSuccess: () => {
      // Refresh both the coach's roster and the unassigned pool
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// â”€â”€â”€ Photos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useListPhotos(params?: { memberId?: number; global?: boolean; category?: string }) {
  const { adminToken, memberCode } = useAuth();
  return useQuery<Photo[]>({
    queryKey: ["photos", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.memberId) queryParams.append("memberId", String(params.memberId));
      if (params?.global) queryParams.append("global", "true");
      if (params?.category) queryParams.append("category", params.category);
      
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const res = await fetch(`/api/photos${qs}`, {
        headers: getAuthHeaders(adminToken || memberCode),
      });
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
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

// â”€â”€â”€ Announcements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
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

// â”€â”€â”€ Admin Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Coach Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        throw new Error(err.error || "Invalid credentials");
      }
      return res.json();
    },
  });
}

export function useCoachRegister() {
  return useMutation<
    { success: boolean; token: string; coach: Coach },
    Error,
    { name: string; password: string }
  >({
    mutationFn: async ({ name, password }) => {
      const res = await fetch("/api/coach/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }
      return res.json();
    },
  });
}

// â”€â”€â”€ Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useListConversations() {
  const { coachToken } = useAuth();
  return useQuery<(Message & { member_name: string })[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages", {
        headers: getAuthHeaders(coachToken),
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    enabled: !!coachToken,
  });
}

export function useListMessages(memberId: number | null) {
  const { coachToken, memberCode, currentMember } = useAuth();
  const token = coachToken || memberCode || currentMember?.membership_code;
  return useQuery<Message[]>({
    queryKey: ["messages", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const res = await fetch(`/api/messages?memberId=${memberId}`, {
        headers: getAuthHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!memberId && !!token,
    refetchInterval: 5000, // Poll every 5s
  });
}

export function useSendMessage() {
  const { coachToken, currentMember } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<Message, Error, { memberId: number; content?: string; senderType?: string; imageUrl?: string }>({
    mutationFn: async ({ memberId, content = "", senderType = "member", imageUrl }) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (coachToken) headers["Authorization"] = `Bearer ${coachToken}`;
      else if (currentMember?.membership_code) headers["Authorization"] = `Bearer ${currentMember.membership_code}`;
      const res = await fetch("/api/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({ memberId, content, senderType, imageUrl }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.memberId] });
    },
  });
}

export function useUploadMessageImage() {
  const { coachToken } = useAuth();
  return useMutation<string, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/messages/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${coachToken}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload image");
      }
      const data = await res.json();
      return data.url;
    },
  });
}

// â”€â”€â”€ Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useListSessions(date?: string) {
  const { coachToken } = useAuth();
  return useQuery<(Session & { member_name?: string })[]>({
    queryKey: ["sessions", date],
    queryFn: async () => {
      const qs = date ? `?date=${date}` : "";
      const res = await fetch(`/api/sessions${qs}`, {
        headers: getAuthHeaders(coachToken),
      });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: !!coachToken,
  });
}

export function useCreateSession() {
  const { coachToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<
    Session,
    Error,
    {
      memberId?: number;
      sessionType?: string;
      scheduledAt: string;
      durationMinutes?: number;
      notes?: string;
    }
  >({
    mutationFn: async (data) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(coachToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  });
}

export function useUpdateSession() {
  const { coachToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<
    Session,
    Error,
    { id: number; status?: string; started_at?: string; ended_at?: string }
  >({
    mutationFn: async (data) => {
      const res = await fetch("/api/sessions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(coachToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  });
}

// â”€â”€â”€ Calories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CalorieLog {
  id: number;
  member_id: number | null;
  coach_id: number | null;
  meal: string;
  result: {
    totals: { calories: number; protein: number; carbs: number; fat: number };
    items?: FoodItem[];
    confidence?: "high" | "medium" | "low";
    confidence_score?: number;
    display_title?: string;
    meal_type?: string;
    portion_analysis?: string;
    notes?: string;
    client_suggestion?: string | null;
    coach_alert?: string | null;
    [key: string]: any;
  };
  category: string;
  verified_status: "pending" | "verified" | "edited";
  coach_note: string | null;
  created_at: string;
  // Populated by join in some queries
  member_name?: string;
}

export function useListCalorieLogs(memberId?: number | "null" | "all") {
  const { adminToken, coachToken, memberCode, currentMember } = useAuth();
  const token = currentMember && memberCode ? memberCode : (coachToken || adminToken || memberCode);
  return useQuery<CalorieLog[]>({
    queryKey: ["calorie_logs", memberId],
    queryFn: async () => {
      const qs = memberId && memberId !== "all" ? `?memberId=${memberId}` : "";
      const res = await fetch(`/api/calories${qs}`, {
        headers: getAuthHeaders(token || ""),
      });
      if (!res.ok) throw new Error("Failed to fetch calorie logs");
      return res.json();
    },
    refetchInterval: 8000, // Realtime hook handles instant updates; polling is fallback
  });
}

export function useVerifyCalorieLog() {
  const { coachToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<
    CalorieLog,
    Error,
    { id: number; action: "verified" | "edited"; coach_note?: string; edited_result?: any }
  >({
    mutationFn: async ({ id, action, coach_note, edited_result }) => {
      const res = await fetch(`/api/calories/${id}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(coachToken),
        },
        body: JSON.stringify({ action, coach_note, edited_result }),
      });
      if (!res.ok) throw new Error("Failed to verify log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calorie_logs"] });
    },
  });
}

export function useSaveCalorieLog() {
  const { adminToken, coachToken, memberCode, currentMember } = useAuth();
  const token = currentMember && memberCode ? memberCode : (coachToken || adminToken || memberCode);
  const queryClient = useQueryClient();
  return useMutation<CalorieLog, Error, Partial<CalorieLog>>({
    mutationFn: async (data) => {
      const res = await fetch("/api/calories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token || ""),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save calorie log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calorie_logs"] });
    }
  });
}

export function useDeleteCalorieLog() {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || memberCode;
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/calories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token || ""),
      });
      if (!res.ok) throw new Error("Failed to delete calorie log");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calorie_logs"] });
    }
  });
}

// â”€â”€â”€ Client Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ClientTask {
  id: number;
  member_id: number;
  type: string;
  title: string;
  status: string;
  duration: string | null;
  assigned_by: string | null;
  coach_assigned: boolean;
  created_at: string;
}

export function useListTasks(memberId?: number) {
  return useQuery<ClientTask[]>({
    queryKey: ["client_tasks", memberId],
    queryFn: async () => {
      const qs = memberId ? `?memberId=${memberId}` : "";
      const res = await fetch(`/api/client-tasks${qs}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!memberId,
    refetchInterval: 5000,
  });
}

export function useCreateTask() {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || "";
  const queryClient = useQueryClient();
  return useMutation<ClientTask, Error, Partial<ClientTask>>({
    mutationFn: async (data) => {
      const res = await fetch("/api/client-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_tasks"] });
    }
  });
}

export function useUpdateTask() {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || "";
  const queryClient = useQueryClient();
  return useMutation<ClientTask, Error, { id: number; data: Partial<ClientTask> }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/client-tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_tasks"] });
    }
  });
}

export function useDeleteTask() {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || "";
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/client-tasks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_tasks"] });
    }
  });
}

// â”€â”€â”€ Client Workouts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ClientWorkout {
  id: number;
  member_id: number;
  title: string;
  coach_assigned: boolean;
  status: string;
  duration: string | null;
  calories: number | null;
  muscles: string[] | null;
  difficulty: string | null;
  sets: any[] | null;
  created_at: string;
}

export function useListWorkouts(memberId?: number) {
  return useQuery<ClientWorkout[]>({
    queryKey: ["client_workouts", memberId],
    queryFn: async () => {
      const qs = memberId ? `?memberId=${memberId}` : "";
      const res = await fetch(`/api/client-workouts${qs}`);
      if (!res.ok) throw new Error("Failed to fetch workouts");
      return res.json();
    },
    enabled: !!memberId,
    refetchInterval: 5000,
  });
}

export function useCreateWorkout() {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || "";
  const queryClient = useQueryClient();
  return useMutation<ClientWorkout, Error, Partial<ClientWorkout>>({
    mutationFn: async (data) => {
      const res = await fetch("/api/client-workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_workouts"] });
    }
  });
}

export function useUpdateWorkout() {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || "";
  const queryClient = useQueryClient();
  return useMutation<ClientWorkout, Error, { id: number; data: Partial<ClientWorkout> }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/client-workouts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_workouts"] });
    }
  });
}

export function useDeleteWorkout() {
  const { adminToken, coachToken, memberCode } = useAuth();
  const token = adminToken || coachToken || "";
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/client-workouts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to delete workout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_workouts"] });
    }
  });
}
