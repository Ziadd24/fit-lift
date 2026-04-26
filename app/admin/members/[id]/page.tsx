"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useGetMember,
  useListAnnouncements,
  useDeleteAnnouncement,
  useCreateAnnouncement,
  useUpdateMember,
} from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { format, addMonths, isAfter, parseISO } from "date-fns";
import { isMembershipActive } from "@/lib/utils";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Megaphone,
  RefreshCw,
  MessageCircle,
  CheckCircle,
  Edit3,
  Save,
  X,
  Trash2,
  ClipboardList,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
} from "lucide-react";

const GYM_WHATSAPP = "2010099887771";

export default function AdminMemberProfile() {
  const params = useParams<{ id: string }>();
  const memberId = parseInt(params.id, 10);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: member, isLoading: memberLoading } = useGetMember(memberId);
  const { data: announcements } = useListAnnouncements({ memberId });

  const deleteAnnouncementMutation = useDeleteAnnouncement();
  const createAnnouncementMutation = useCreateAnnouncement();
  const updateMemberMutation = useUpdateMember();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [renewMonths, setRenewMonths] = useState(1);
  const [renewSuccess, setRenewSuccess] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    name: string;
    email: string;
    phone: string;
    membership_type: string;
  } | null>(null);

  const { adminToken } = useAuth();

  /* ── Assessment state ── */
  interface AssignmentPreviewFile {
    file: File;
    previewUrl: string | null;
  }
  interface AssignmentMeasurementFields {
    weight: string;
    chest: string;
    waist: string;
    hips: string;
    arms: string;
    thighs: string;
  }
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentPreviewFile[]>([]);
  const [assignmentMeasurements, setAssignmentMeasurements] = useState<AssignmentMeasurementFields>({
    weight: "",
    chest: "",
    waist: "",
    hips: "",
    arms: "",
    thighs: "",
  });
  const [showMeasurementFields, setShowMeasurementFields] = useState(true);
  const [assignmentUploadProgress, setAssignmentUploadProgress] = useState(0);
  const [assignmentError, setAssignmentError] = useState("");
  const [isSendingAssignment, setIsSendingAssignment] = useState(false);
  const assignmentInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch assessments for this member ── */
  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["member-assessments", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/coach-uploads/list?member_id=${memberId}`);
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
    enabled: !!memberId,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetAssignmentState = useCallback(() => {
    assignmentFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setAssignmentTitle("");
    setAssignmentNotes("");
    setAssignmentDueDate("");
    setAssignmentFiles([]);
    setAssignmentUploadProgress(0);
    setAssignmentError("");
    setShowMeasurementFields(true);
    setAssignmentMeasurements({
      weight: "",
      chest: "",
      waist: "",
      hips: "",
      arms: "",
      thighs: "",
    });
    if (assignmentInputRef.current) {
      assignmentInputRef.current.value = "";
    }
  }, [assignmentFiles]);

  const openAssignmentModal = useCallback(() => {
    resetAssignmentState();
    if (member) {
      setAssignmentTitle(`Body Assessment - ${member.name}`);
    }
    setIsAssignmentModalOpen(true);
  }, [resetAssignmentState, member]);

  const closeAssignmentModal = useCallback(() => {
    if (isSendingAssignment) return;
    resetAssignmentState();
    setIsAssignmentModalOpen(false);
  }, [isSendingAssignment, resetAssignmentState]);

  const handleAssignmentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const totalBytes = [...assignmentFiles.map((item) => item.file), ...selectedFiles].reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 50 * 1024 * 1024) {
      setAssignmentError("Combined file size must stay under 50MB.");
      e.target.value = "";
      return;
    }

    const nextFiles = selectedFiles.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") || file.type.startsWith("video/") ? URL.createObjectURL(file) : null,
    }));

    setAssignmentError("");
    setAssignmentFiles((current) => [...current, ...nextFiles]);
    e.target.value = "";
  };

  const removeAssignmentFile = (index: number) => {
    setAssignmentFiles((current) => {
      const target = current[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleSendAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignmentFiles.length === 0 || !adminToken) return;

    setIsSendingAssignment(true);
    setAssignmentError("");
    setAssignmentUploadProgress(0);

    const measurementFields = Object.entries(assignmentMeasurements).reduce<Record<string, string>>((acc, [key, value]) => {
      const trimmed = value.trim();
      if (trimmed) acc[key] = trimmed;
      return acc;
    }, {});

    const formData = new FormData();
    formData.append("member_id", String(memberId));
    formData.append("title", assignmentTitle.trim() || `Body Assessment - ${member?.name || "Member"}`);
    formData.append("notes", assignmentNotes.trim());
    if (assignmentDueDate) {
      formData.append("due_date", assignmentDueDate);
    }
    formData.append("measurement_fields", JSON.stringify(measurementFields));
    assignmentFiles.forEach((item) => formData.append("files", item.file));

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/coach-assignments/send");
        xhr.setRequestHeader("Authorization", `Bearer ${adminToken}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setAssignmentUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || "Failed to send assessment"));
          } catch {
            reject(new Error("Failed to send assessment"));
          }
        };

        xhr.onerror = () => reject(new Error("Failed to send assessment"));
        xhr.send(formData);
      });

      closeAssignmentModal();
      queryClient.invalidateQueries({ queryKey: ["member-assessments", memberId] });
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Failed to send assessment");
    } finally {
      setIsSendingAssignment(false);
      setAssignmentUploadProgress(0);
    }
  };

  /* ── Group assessments by assignment_id ── */
  const allUploads: any[] = assessmentsData?.uploads || [];
  const assignmentGroups = useMemo(() => {
    const grouped = allUploads
      .filter((upload: any) => upload.assignment_kind === "body_measurement_assignment" && upload.assignment_id)
      .reduce<Record<string, any[]>>((acc, upload: any) => {
        const key = upload.assignment_id as string;
        if (!acc[key]) acc[key] = [];
        acc[key].push(upload);
        return acc;
      }, {});

    return Object.entries(grouped)
      .map(([assignmentId, files]) => {
        const lead = files[0];
        return { assignmentId, lead, files };
      })
      .sort((a, b) => new Date(b.lead.created_at).getTime() - new Date(a.lead.created_at).getTime());
  }, [allUploads]);

  const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pending", color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
    submitted: { label: "Submitted", color: "#38BDF8", bg: "rgba(56,189,248,0.12)" },
    reviewed: { label: "Reviewed", color: "#7CFC00", bg: "rgba(124,252,0,0.12)" },
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createAnnouncementMutation.mutate(
      { title, content, is_global: false, target_member_id: memberId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
          setTitle("");
          setContent("");
        },
      }
    );
  };

  const handleRenew = () => {
    if (!member) return;
    const today = new Date();
    const currentExpiry = parseISO(member.sub_expiry_date);
    const baseDate = isAfter(currentExpiry, today) ? currentExpiry : today;
      const newExpiry = addMonths(baseDate, renewMonths);
      const newExpiryStr = format(newExpiry, "yyyy-MM-dd");

      updateMemberMutation.mutate(
      { id: memberId, data: { sub_expiry_date: newExpiryStr, renewal_processed: true } as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members", memberId] });
          setRenewSuccess(true);
          setTimeout(() => setRenewSuccess(false), 3000);
        },
      }
    );
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    updateMemberMutation.mutate(
      { id: memberId, data: editData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["members", memberId] });
          setIsEditing(false);
          setEditData(null);
        },
      }
    );
  };

  if (memberLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading member...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!member) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground text-xl">Member not found.</p>
          <Button className="mt-4" onClick={() => router.push("/admin/members")}>
            Back to Members
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isActive = isMembershipActive(member.sub_expiry_date);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/members")}
          className="text-muted-foreground hover:text-white px-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-display text-white" dir="auto">{member.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{member.membership_code}</p>
        </div>
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Active" : "Expired"}
        </Badge>
        <button
          onClick={openAssignmentModal}
          className="inline-flex items-center gap-2 bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-sm font-bold uppercase tracking-wider h-9 px-4 rounded-xl transition-colors"
        >
          <ClipboardList className="w-4 h-4" /> New Assessment
        </button>
        <a
          href={`https://wa.me/${GYM_WHATSAPP}?text=${encodeURIComponent(`Hi, regarding member ${member.name} (${member.membership_code})`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold uppercase tracking-wider h-9 px-4 rounded-xl transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — member details */}
        <div className="space-y-6">
          {/* Info card */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-display text-white">Member Info</h2>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-muted-foreground hover:text-white"
                  onClick={() => {
                    setIsEditing(true);
                    setEditData({
                      name: member.name,
                      email: member.email || "",
                      phone: member.phone || "",
                      membership_type: member.membership_type,
                    });
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-destructive"
                    onClick={() => { setIsEditing(false); setEditData(null); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="px-3"
                    onClick={handleSaveEdit}
                    disabled={updateMemberMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing && editData ? (
              <div className="space-y-3">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    dir="auto"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    dir="auto"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    dir="auto"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Membership Type</Label>
                  <select
                    className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:border-primary"
                    value={editData.membership_type}
                    onChange={(e) => setEditData({ ...editData, membership_type: e.target.value })}
                  >
                    {["Basic", "Standard", "Premium", "VIP"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  { label: "Email", value: member.email || "—" },
                  { label: "Phone", value: member.phone || "—" },
                  { label: "Type", value: member.membership_type },
                  {
                    label: "Joined",
                    value: format(new Date(member.created_at), "MMM dd, yyyy"),
                  },
                  {
                    label: "Expires",
                    value: format(new Date(member.sub_expiry_date), "MMM dd, yyyy"),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between items-center py-2 border-b border-white/5"
                  >
                    <span className="text-muted-foreground uppercase tracking-wider text-xs">
                      {row.label}
                    </span>
                    <span className="text-white font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Renew card */}
          <Card className="p-6">
            <h2 className="text-lg font-display text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> Renew Subscription
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <Label className="mb-0 shrink-0">Months</Label>
              <input
                type="number"
                dir="ltr"
                min={1}
                max={24}
                value={renewMonths}
                onChange={(e) => setRenewMonths(parseInt(e.target.value) || 1)}
                className="flex h-10 w-20 rounded-xl border border-white/10 bg-black/40 px-3 text-white text-center focus:outline-none focus:border-primary"
              />
            </div>
            {renewSuccess ? (
              <div className="flex items-center gap-2 text-green-400 font-medium py-2">
                <CheckCircle className="w-5 h-5" /> Subscription renewed!
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleRenew}
                disabled={updateMemberMutation.isPending}
              >
                {updateMemberMutation.isPending ? "Renewing..." : `Renew +${renewMonths} month${renewMonths > 1 ? "s" : ""}`}
              </Button>
            )}
          </Card>

          {/* Direct message card */}
          <Card className="p-6">
            <h2 className="text-lg font-display text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Send Direct Note
            </h2>
            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input
                  required
                  dir="auto"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Session reminder"
                />
              </div>
              <div>
                <Label>Message *</Label>
                <textarea
                  required
                  dir="auto"
                  className="flex w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary min-h-[80px] resize-none placeholder:text-muted-foreground"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note..."
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createAnnouncementMutation.isPending}
              >
                {createAnnouncementMutation.isPending ? "Sending..." : "Send Note"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right column — assessments & announcements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Assessments */}
          <div>
            <h2 className="text-xl font-display text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Assessments ({assignmentGroups.length})
            </h2>
            {assessmentsLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading assessments...</p>
              </Card>
            ) : assignmentGroups.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-white/10 bg-transparent">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
                    <ClipboardList className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">No assessments for this member yet.</p>
                  <Button variant="outline" size="sm" onClick={openAssignmentModal}>
                    <ClipboardList className="w-4 h-4 mr-2" /> Send First Assessment
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {assignmentGroups.map(({ assignmentId, lead, files }) => {
                  const status = statusStyles[lead.assignment_status || "pending"] || statusStyles.pending;
                  const measurementEntries = Object.entries(lead.measurement_fields || {}).filter(([, v]: any) => v !== "" && v !== null && v !== undefined);
                  const senderName = lead.coaches?.name || lead.coach_name || "Admin";

                  return (
                    <Card key={assignmentId} className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <ClipboardList className="w-4 h-4 text-primary" />
                            <h3 className="text-base font-bold text-white">{lead.assignment_title || lead.title || "Body Assessment"}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>By {senderName}</span>
                            <span>•</span>
                            <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>
                            <span>•</span>
                            <span>{format(new Date(lead.created_at), "MMM dd, yyyy")}</span>
                            {lead.due_date && (
                              <>
                                <span>•</span>
                                <span>Due: {format(new Date(lead.due_date), "MMM dd, yyyy")}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ color: status.color, background: status.bg }}
                        >
                          {status.label}
                        </span>
                      </div>

                      {lead.coach_notes && (
                        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{lead.coach_notes}</p>
                      )}

                      {measurementEntries.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {measurementEntries.map(([key, value]: any) => (
                            <div key={key} className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{key}</div>
                              <div className="text-sm font-semibold text-white">{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {files.map((file: any) => (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                          >
                            {file.file_type === "pdf" ? <FileText className="w-3.5 h-3.5 text-red-400" /> :
                             file.file_type === "video" ? <Video className="w-3.5 h-3.5 text-blue-400" /> :
                             <ImageIcon className="w-3.5 h-3.5 text-green-400" />}
                            <span className="text-white truncate max-w-[120px]">{file.file_name}</span>
                            <Download className="w-3 h-3 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              Notes & Announcements ({announcements?.length || 0})
            </h2>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <Card key={a.id} className="p-4 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <Badge variant={a.is_global ? "default" : "outline"} className="text-[10px]">
                          {a.is_global ? "Global" : "Personal"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                        onClick={() => {
                          if (confirm("Delete this note?")) {
                            deleteAnnouncementMutation.mutate(
                              { id: a.id },
                              {
                                onSuccess: () =>
                                  queryClient.invalidateQueries({ queryKey: ["announcements"] }),
                              }
                            );
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-white mb-1" dir="auto">{a.title}</h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap" dir="auto">{a.content}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-white/10 bg-transparent">
                <p className="text-muted-foreground">No notes for this member yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ══ ASSESSMENT MODAL ══ */}
      <AnimatePresence>
        {isAssignmentModalOpen && member && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeAssignmentModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              style={{ background: "var(--color-card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", width: "100%", maxWidth: 720, padding: 28, position: "relative", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-white">Assess {member.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share body measurements, progress photos, reports, and movement checks in one assessment.
                  </p>
                </div>
                <button onClick={closeAssignmentModal} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSendAssignment} className="space-y-5">
                <div>
                  <Label>Assessment Title</Label>
                  <Input value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} placeholder="Body assessment - Week 4" />
                </div>
                <div>
                  <Label>Notes</Label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={4}
                    placeholder="Check waist circumference, shoulder width, hip flexor mobility..."
                    className="flex w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary min-h-[80px] resize-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={assignmentDueDate} onChange={(e) => setAssignmentDueDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Files</Label>
                    <button
                      type="button"
                      onClick={() => assignmentInputRef.current?.click()}
                      className="w-full mt-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all"
                      style={{ background: "rgba(124,252,0,0.12)", border: "1px dashed rgba(124,252,0,0.35)", color: "#7CFC00" }}
                    >
                      <Paperclip className="w-4 h-4" /> Add Files
                    </button>
                    <input ref={assignmentInputRef} type="file" multiple accept="application/pdf,image/*,video/mp4,video/webm,video/quicktime" onChange={handleAssignmentFileSelect} className="hidden" />
                    <p className="text-xs mt-2 text-muted-foreground">PDF, photos, and video supported. Combined size limit: 50MB.</p>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Measurement Fields</h3>
                      <p className="text-xs text-muted-foreground">Optional — fill in values to include with the assessment.</p>
                    </div>
                    <button type="button" onClick={() => setShowMeasurementFields((current) => !current)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#FFFFFF" }}>{showMeasurementFields ? "Hide" : "Show"}</button>
                  </div>
                  {showMeasurementFields && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {([
                        ["weight", "Weight"],
                        ["chest", "Chest"],
                        ["waist", "Waist"],
                        ["hips", "Hips"],
                        ["arms", "Arms"],
                        ["thighs", "Thighs"],
                      ] as const).map(([key, label]) => (
                        <div key={key}>
                          <Label>{label}</Label>
                          <Input value={assignmentMeasurements[key]} onChange={(e) => setAssignmentMeasurements((current) => ({ ...current, [key]: e.target.value }))} placeholder={label} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white">Preview</h3>
                    <span className="text-xs text-muted-foreground">{formatFileSize(assignmentFiles.reduce((sum, item) => sum + item.file.size, 0))}</span>
                  </div>
                  {assignmentFiles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground" style={{ borderColor: "rgba(255,255,255,0.12)" }}>No files selected</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignmentFiles.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="h-32 flex items-center justify-center overflow-hidden" style={{ background: "rgba(0,0,0,0.35)" }}>
                            {item.file.type.startsWith("image/") && item.previewUrl ? (
                              <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                            ) : item.file.type.startsWith("video/") && item.previewUrl ? (
                              <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                {item.file.type === "application/pdf" ? <FileText className="w-8 h-8" /> : item.file.type.startsWith("video/") ? <Video className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                                <span className="text-xs">Ready to send</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="text-sm font-semibold text-white truncate">{item.file.name}</div>
                            <div className="text-xs mt-1 text-muted-foreground">{formatFileSize(item.file.size)}</div>
                            <button type="button" onClick={() => removeAssignmentFile(index)} className="text-xs mt-3 px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {assignmentError && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>{assignmentError}</div>
                )}
                {isSendingAssignment && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2 text-muted-foreground">
                      <span>Upload progress</span>
                      <span>{assignmentUploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${assignmentUploadProgress}%`, background: "linear-gradient(90deg, #7CFC00, #39FF14)" }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={closeAssignmentModal}>Cancel</Button>
                  <button type="submit" disabled={isSendingAssignment || assignmentFiles.length === 0} className="flex-1 py-3 rounded-xl font-bold text-sm text-black disabled:opacity-60" style={{ background: "#7CFC00" }}>
                    {isSendingAssignment ? "Sending..." : "Send Assessment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
