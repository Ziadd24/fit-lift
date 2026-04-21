"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Dumbbell,
  Utensils,
  Filter,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

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
}

interface CoachUploadsTabProps {
  isPrivate: boolean;
  memberId: number;
}

export default function CoachUploadsTab({ isPrivate, memberId }: CoachUploadsTabProps) {
  const { currentMember } = useAuth();
  const isMobile = useIsMobile();
  const [uploads, setUploads] = useState<CoachUpload[]>([]);
  const [filter, setFilter] = useState<"all" | "training_program" | "diet_plan">("all");
  const [loading, setLoading] = useState(true);
  const [assignedCoach, setAssignedCoach] = useState<{ id: number; name: string } | null>(null);
  const [coachLoading, setCoachLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetchUploads();

    // Set up realtime subscription
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
        (payload) => {
          console.log("Realtime change:", payload);
          fetchUploads();
        }
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

  const filteredUploads = uploads.filter((upload) => {
    if (filter === "all") return true;
    return upload.category === filter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Assigned Coach Card */}
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
              Assigned Coach
            </div>
            {assignedCoach ? (
              <div
                className="text-lg font-bold"
                style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
              >
                {assignedCoach.name}
              </div>
            ) : (
              <div
                className="text-sm"
                style={{ color: "#8B8B8B", fontFamily: "Inter, sans-serif" }}
              >
                Not assigned to a coach
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`${isMobile ? "flex flex-col gap-3" : "flex items-center justify-between"}`}>
        <h2
          className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}
          style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
        >
          Coach Uploads
        </h2>

        {/* Filter */}
        <div className={`${isMobile ? "flex flex-wrap gap-2" : "flex gap-2"}`}>
          <button
            onClick={() => setFilter("all")}
            className={`${isMobile ? "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold" : "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"} transition-all`}
            style={{
              background:
                filter === "all"
                  ? "rgba(124,252,0,0.15)"
                  : "rgba(255,255,255,0.05)",
              border:
                filter === "all"
                  ? "1px solid rgba(124,252,0,0.3)"
                  : "1px solid rgba(255,255,255,0.1)",
              color: filter === "all" ? "#7CFC00" : "#FFFFFF",
            }}
          >
            <Filter size={isMobile ? 14 : 16} /> All
          </button>
          <button
            onClick={() => setFilter("training_program")}
            className={`${isMobile ? "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold" : "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"} transition-all`}
            style={{
              background:
                filter === "training_program"
                  ? "rgba(124,252,0,0.15)"
                  : "rgba(255,255,255,0.05)",
              border:
                filter === "training_program"
                  ? "1px solid rgba(124,252,0,0.3)"
                  : "1px solid rgba(255,255,255,0.1)",
              color: filter === "training_program" ? "#7CFC00" : "#FFFFFF",
            }}
          >
            <Dumbbell size={isMobile ? 14 : 16} /> Training
          </button>
          <button
            onClick={() => setFilter("diet_plan")}
            className={`${isMobile ? "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold" : "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"} transition-all`}
            style={{
              background:
                filter === "diet_plan"
                  ? "rgba(124,252,0,0.15)"
                  : "rgba(255,255,255,0.05)",
              border:
                filter === "diet_plan"
                  ? "1px solid rgba(124,252,0,0.3)"
                  : "1px solid rgba(255,255,255,0.1)",
              color: filter === "diet_plan" ? "#7CFC00" : "#FFFFFF",
            }}
          >
            <Utensils size={isMobile ? 14 : 16} /> Diet
          </button>
        </div>
      </div>

      {/* Uploads List */}
      {loading ? (
        <div
          className="flex items-center justify-center py-12"
          style={{ color: "#8B8B8B" }}
        >
          Loading uploads...
        </div>
      ) : filteredUploads.length === 0 ? (
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
            <FileText size={32} style={{ color: "#7CFC00" }} />
          </div>
          <p
            className="font-semibold mb-2"
            style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
          >
            No uploads yet
          </p>
          <p style={{ color: "#8B8B8B" }}>
            Your coach will share training programs and diet plans here
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUploads.map((upload) => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${isMobile ? "flex flex-col gap-3 p-3" : "flex items-start gap-4 p-4"} rounded-xl`}
              style={{
                background: "#16161A",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Thumbnail / Icon */}
              {upload.file_type === "image" ? (
                <img
                  src={upload.file_url}
                  alt={upload.file_name}
                  className={`${isMobile ? "w-full h-32 object-cover rounded-lg cursor-pointer" : "w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer"}`}
                  onClick={() => setZoomedImage({ url: upload.file_url, name: upload.title || upload.file_name })}
                  style={{ transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                />
              ) : (
                <div
                  className={`${isMobile ? "w-full h-24 rounded-lg flex items-center justify-center" : "w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"}`}
                  style={{
                    background: "rgba(139,92,246,0.2)",
                    border: "1px solid rgba(139,92,246,0.3)",
                  }}
                >
                  <FileText size={isMobile ? 40 : 32} style={{ color: "#8B5CF6" }} />
                </div>
              )}

              {/* Content */}
              <div className={`${isMobile ? "w-full" : "flex-1"} min-w-0`}>
                <div className={`${isMobile ? "flex flex-col gap-2" : "flex items-start justify-between gap-4 mb-2"}`}>
                  <div>
                    <h3
                      className={`${isMobile ? "font-semibold text-base" : "font-semibold text-lg"} mb-1`}
                      style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
                    >
                      {upload.title || upload.file_name}
                    </h3>
                    <div className={`${isMobile ? "flex items-center gap-2 text-xs flex-wrap" : "flex items-center gap-2 text-sm"}`} style={{ color: "#8B8B8B" }}>
                      {upload.category === "training_program" ? (
                        <>
                          <Dumbbell size={isMobile ? 12 : 14} /> Training Program
                        </>
                      ) : (
                        <>
                          <Utensils size={isMobile ? 12 : 14} /> Diet Plan
                        </>
                      )}
                      <span>•</span>
                      <span>{formatFileSize(upload.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(upload.created_at)}</span>
                    </div>
                  </div>
                  <a
                    href={`${upload.file_url}?download=${encodeURIComponent(upload.file_name)}`}
                    className={`${isMobile ? "flex items-center gap-1 px-3 py-1.5 rounded-md font-semibold text-xs" : "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"} transition-all hover:opacity-80`}
                    style={{
                      background: "rgba(124,252,0,0.15)",
                      border: "1px solid rgba(124,252,0,0.3)",
                      color: "#7CFC00",
                    }}
                  >
                    <Download size={isMobile ? 14 : 16} /> Download
                  </a>
                </div>

                {upload.description && (
                  <p
                    className={`${isMobile ? "text-xs" : "text-sm"} mt-2`}
                    style={{ color: "#5A5A5A", lineHeight: 1.5 }}
                  >
                    {upload.description}
                  </p>
                )}

                {upload.coach_name && (
                  <p className={`${isMobile ? "text-xs" : "text-sm"} mt-2`} style={{ color: "#7CFC00" }}>
                    From: {upload.coach_name}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setZoomedImage(null)}
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
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <img
                src={zoomedImage.url}
                alt={zoomedImage.name}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <div className="mt-4 text-center">
                <p style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 600 }}>
                  {zoomedImage.name}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
