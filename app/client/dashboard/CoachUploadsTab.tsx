"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Download,
  FileText,
  Image as ImageIcon,
  Upload,
  User,
  Video,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import { useClientLanguage } from "@/lib/client-language";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

interface CoachUpload {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: string;
  title: string | null;
  description: string | null;
  created_at: string;
  coach_name: string | null;
  assignment_id?: string | null;
  assignment_title?: string | null;
  assignment_kind?: string | null;
  due_date?: string | null;
  coach_notes?: string | null;
  measurement_fields?: Record<string, string | number> | null;
  assignment_status?: "pending" | "submitted" | "reviewed" | null;
}

interface CoachUploadsTabProps {
  isPrivate: boolean;
  memberId: number;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CoachUploadsTab({ isPrivate, memberId }: CoachUploadsTabProps) {
  const { currentMember } = useAuth();
  const { language, t } = useClientLanguage();
  const isMobile = useIsMobile();
  const [uploads, setUploads] = useState<CoachUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedCoach, setAssignedCoach] = useState<{ id: number; name: string } | null>(null);
  const [coachLoading, setCoachLoading] = useState(true);
  const [zoomedMedia, setZoomedMedia] = useState<{ url: string; name: string; type: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "assessments" | "files">("assessments");

  useEffect(() => {
    fetchUploads();

    const channel = supabase
      .channel("coach_uploads_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coach_uploads",
          filter: `member_id=eq.${memberId}`,
        },
        () => fetchUploads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId]);

  useEffect(() => {
    const fetchAssignedCoach = async () => {
      if (!currentMember?.coach_id) {
        setAssignedCoach(null);
        setCoachLoading(false);
        return;
      }

      setCoachLoading(true);
      try {
        const response = await fetch("/api/coaches");
        if (!response.ok) throw new Error("Failed to fetch coaches");
        const coaches = await response.json();
        const coach = coaches.find((c: any) => c.id === currentMember.coach_id);
        setAssignedCoach(coach || null);
      } catch (error) {
        console.error("Error fetching assigned coach:", error);
        setAssignedCoach(null);
      } finally {
        setCoachLoading(false);
      }
    };

    fetchAssignedCoach();
  }, [currentMember?.coach_id]);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coach-uploads/list?member_id=${memberId}`);
      if (!response.ok) throw new Error("Failed to fetch uploads");
      const data = await response.json();
      setUploads(data.uploads || []);
    } catch (error) {
      console.error("Error fetching uploads:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignmentGroups = useMemo(() => {
    const grouped = uploads
      .filter((upload) => upload.assignment_kind === "body_measurement_assignment" && upload.assignment_id)
      .reduce<Record<string, CoachUpload[]>>((acc, upload) => {
        const key = upload.assignment_id as string;
        if (!acc[key]) acc[key] = [];
        acc[key].push(upload);
        return acc;
      }, {});

    return Object.entries(grouped)
      .map(([assignmentId, files]) => {
        const lead = files[0];
        return {
          assignmentId,
          lead,
          files,
        };
      })
      .sort((a, b) => new Date(b.lead.created_at).getTime() - new Date(a.lead.created_at).getTime());
  }, [uploads]);

  const legacyFiles = useMemo(
    () => uploads.filter((upload) => upload.assignment_kind !== "body_measurement_assignment"),
    [uploads]
  );

  const visibleAssignments = filter === "files" ? [] : assignmentGroups;
  const visibleFiles = filter === "assessments" ? [] : legacyFiles;

  const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: t("pending"), color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
    submitted: { label: t("submitted"), color: "#38BDF8", bg: "rgba(56,189,248,0.12)" },
    reviewed: { label: t("reviewed"), color: "#7CFC00", bg: "rgba(124,252,0,0.12)" },
  };

  return (
    <div className="space-y-6">
      {!coachLoading && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background: "rgba(124,252,0,0.08)",
            border: "1px solid rgba(124,252,0,0.2)",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(124,252,0,0.2)",
              border: "1px solid rgba(124,252,0,0.3)",
            }}
          >
            <User size={20} style={{ color: "#7CFC00" }} />
          </div>
          <div>
            <div
              className="text-xs font-semibold mb-1"
              style={{ color: "#7CFC00", textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              {t("assignedCoach")}
            </div>
            {assignedCoach ? (
              <div className="text-lg font-bold" style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
                {assignedCoach.name}
              </div>
            ) : (
              <div className="text-sm" style={{ color: "#8B8B8B", fontFamily: "Inter, sans-serif" }}>
                {t("noAssignedCoach")}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`${isMobile ? "flex flex-col gap-3" : "flex items-center justify-between"}`}>
        <div>
          <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`} style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
            {t("assessmentsTitle")}
          </h2>
          <p className="text-sm mt-1" style={{ color: "#8B8B8B" }}>
            {t("assessmentsBody")}
          </p>
        </div>

        <div className={`${isMobile ? "flex flex-wrap gap-2" : "flex gap-2"}`}>
          {[
            { key: "assessments", label: t("assessmentsTitle") },
            { key: "files", label: t("sharedFiles") },
            { key: "all", label: t("all") },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key as typeof filter)}
              className={`${isMobile ? "px-2 py-1.5 rounded-md text-xs font-semibold" : "px-3 py-2 rounded-lg text-sm font-semibold"} transition-all`}
              style={{
                background: filter === option.key ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.05)",
                border: filter === option.key ? "1px solid rgba(124,252,0,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: filter === option.key ? "#7CFC00" : "#FFFFFF",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12" style={{ color: "#8B8B8B" }}>
          {t("loadingAssessments")}
        </div>
      ) : visibleAssignments.length === 0 && visibleFiles.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12"
          style={{
            background: "#16161A",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "rgba(124,252,0,0.1)",
              border: "1px solid rgba(124,252,0,0.2)",
            }}
          >
            <ClipboardList size={32} style={{ color: "#7CFC00" }} />
          </div>
          <p className="font-semibold mb-2" style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
            {t("noAssessmentsYet")}
          </p>
          <p style={{ color: "#8B8B8B" }}>
            {t("noAssessmentsBody")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleAssignments.length > 0 && (
            <div className="space-y-4">
              {visibleAssignments.map(({ assignmentId, lead, files }) => {
                const status = statusStyles[lead.assignment_status || "pending"] || statusStyles.pending;
                const measurementEntries = Object.entries(lead.measurement_fields || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined);

                return (
                  <motion.div
                    key={assignmentId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5"
                    style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className={`${isMobile ? "space-y-3" : "flex items-start justify-between gap-4"} mb-4`}>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList size={18} style={{ color: "#7CFC00" }} />
                          <h3 className="text-lg font-bold" style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
                            {lead.assignment_title || lead.title || (t("assessmentsTitle"))}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "#8B8B8B" }}>
                          <span>{isNaN(files.length) ? "" : `${files.length} ${files.length === 1 ? (language === "ar" ? "ملف" : "file") : (language === "ar" ? "ملفات" : "files")}`}</span>
                          <span>•</span>
                          <span>{formatDate(lead.created_at)}</span>
                          {lead.due_date && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={12} /> {t("due")} {formatDate(lead.due_date)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ color: status.color, background: status.bg }}
                      >
                        {status.label}
                      </span>
                    </div>

                    {lead.coach_notes && (
                      <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "#7CFC00" }}>
                          {t("instructions")}
                        </div>
                        <p style={{ color: "#D4D4D8", lineHeight: 1.6 }}>{lead.coach_notes}</p>
                      </div>
                    )}

                    {measurementEntries.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "#7CFC00" }}>
                          {t("requestedMeasurements")}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {measurementEntries.map(([key, value]) => (
                            <div key={key} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div className="text-xs mb-1" style={{ color: "#8B8B8B", textTransform: "capitalize" }}>
                                {key}
                              </div>
                              <div className="font-semibold" style={{ color: "#FFFFFF" }}>{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {files.map((file) => (
                        <div key={file.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="h-36 flex items-center justify-center overflow-hidden" style={{ background: "rgba(0,0,0,0.35)" }}>
                            {file.file_type === "image" ? (
                              <img
                                src={file.file_url}
                                alt={file.file_name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setZoomedMedia({ url: file.file_url, name: file.file_name, type: file.file_type })}
                              />
                            ) : file.file_type === "video" ? (
                              <video
                                src={file.file_url}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setZoomedMedia({ url: file.file_url, name: file.file_name, type: file.file_type })}
                              />
                            ) : (
                              <FileText size={36} style={{ color: "#8B5CF6" }} />
                            )}
                          </div>
                          <div className="p-4">
                            <div className="font-semibold truncate mb-1" style={{ color: "#FFFFFF" }}>{file.file_name}</div>
                            <div className="text-xs mb-3" style={{ color: "#8B8B8B" }}>{formatFileSize(file.file_size)}</div>
                            <a
                              href={`${file.file_url}?download=${encodeURIComponent(file.file_name)}`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: "rgba(124,252,0,0.12)", color: "#7CFC00", border: "1px solid rgba(124,252,0,0.25)" }}
                            >
                              <Download size={14} /> {t("download")}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {visibleFiles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Upload size={18} style={{ color: "#7CFC00" }} />
                <h3 className="text-lg font-bold" style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
                  {t("sharedFiles")}
                </h3>
              </div>
              <div className="grid gap-4">
                {visibleFiles.map((upload) => (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${isMobile ? "flex flex-col gap-3 p-3" : "flex items-start gap-4 p-4"} rounded-xl`}
                    style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {upload.file_type === "image" ? (
                      <img
                        src={upload.file_url}
                        alt={upload.file_name}
                        className={`${isMobile ? "w-full h-32 object-cover rounded-lg cursor-pointer" : "w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer"}`}
                        onClick={() => setZoomedMedia({ url: upload.file_url, name: upload.file_name, type: upload.file_type })}
                      />
                    ) : upload.file_type === "video" ? (
                      <video
                        src={upload.file_url}
                        className={`${isMobile ? "w-full h-32 object-cover rounded-lg cursor-pointer" : "w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer"}`}
                        onClick={() => setZoomedMedia({ url: upload.file_url, name: upload.file_name, type: upload.file_type })}
                      />
                    ) : (
                      <div
                        className={`${isMobile ? "w-full h-24 rounded-lg flex items-center justify-center" : "w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"}`}
                        style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}
                      >
                        <FileText size={32} style={{ color: "#8B5CF6" }} />
                      </div>
                    )}

                    <div className={`${isMobile ? "w-full" : "flex-1"} min-w-0`}>
                      <div className={`${isMobile ? "flex flex-col gap-2" : "flex items-start justify-between gap-4 mb-2"}`}>
                        <div>
                          <h3 className={`${isMobile ? "font-semibold text-base" : "font-semibold text-lg"} mb-1`} style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
                            {upload.title || upload.file_name}
                          </h3>
                          <div className={`${isMobile ? "flex items-center gap-2 text-xs flex-wrap" : "flex items-center gap-2 text-sm"}`} style={{ color: "#8B8B8B" }}>
                            <span>{formatFileSize(upload.file_size)}</span>
                            <span>•</span>
                            <span>{formatDate(upload.created_at)}</span>
                          </div>
                        </div>
                        <a
                          href={`${upload.file_url}?download=${encodeURIComponent(upload.file_name)}`}
                          className={`${isMobile ? "flex items-center gap-1 px-3 py-1.5 rounded-md font-semibold text-xs" : "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"} transition-all hover:opacity-80`}
                          style={{ background: "rgba(124,252,0,0.15)", border: "1px solid rgba(124,252,0,0.3)", color: "#7CFC00" }}
                        >
                          <Download size={isMobile ? 14 : 16} /> {t("download")}
                        </a>
                      </div>

                      {upload.description && (
                        <p className={`${isMobile ? "text-xs" : "text-sm"} mt-2`} style={{ color: "#5A5A5A", lineHeight: 1.5 }}>
                          {upload.description}
                        </p>
                      )}

                      {upload.coach_name && (
                        <p className={`${isMobile ? "text-xs" : "text-sm"} mt-2`} style={{ color: "#7CFC00" }}>
                          {t("fromCoach", { name: upload.coach_name })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {zoomedMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setZoomedMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)" }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-full w-full"
          >
            <div className="relative">
              <button
                onClick={() => setZoomedMedia(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              {zoomedMedia.type === "video" ? (
                <video src={zoomedMedia.url} controls className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
              ) : (
                <img src={zoomedMedia.url} alt={zoomedMedia.name} className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
              )}
              <div className="mt-4 text-center">
                <p style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 600 }}>
                  {zoomedMedia.name}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
