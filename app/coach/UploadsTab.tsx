"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Edit2,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Utensils,
} from "lucide-react";
import { Button, Input, Label } from "@/components/ui/PremiumComponents";
import { useListMembers } from "@/lib/api-hooks";
import { useAuth } from "@/lib/use-auth";
import type { Member } from "@/lib/supabase";

interface CoachUpload {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: string;
  title: string | null;
  description: string | null;
  member_id: number;
  created_at: string;
  member_name: string | null;
}

interface UploadsTabProps {
  coachId: number;
}

export default function UploadsTab({ coachId }: UploadsTabProps) {
  const { coachToken } = useAuth();
  const { data: membersPage } = useListMembers(1, undefined, undefined, undefined, { pageSize: "all" });
  const members: Member[] = membersPage?.members || [];

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [category, setCategory] = useState<"training_program" | "diet_plan">("training_program");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<CoachUpload[]>([]);
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [editingUpload, setEditingUpload] = useState<CoachUpload | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 8 * 1024 * 1024) {
        alert("File too large. Maximum size is 8MB.");
        return;
      }
      if (
        ![
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
        ].includes(selectedFile.type)
      ) {
        alert("Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, PDF");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedMemberId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("member_id", selectedMemberId.toString());
      formData.append("category", category);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);

      const headers: Record<string, string> = {};
      if (coachToken) {
        headers["Authorization"] = `Bearer ${coachToken}`;
      }

      const response = await fetch("/api/coach-uploads/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        const errorText = contentType.includes("application/json")
          ? (await response.json()).error
          : await response.text();
        throw new Error(errorText || "Upload failed");
      }

      const result = await response.json();
      setUploads([result, ...uploads]);
      setFile(null);
      setTitle("");
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (uploadId: number) => {
    if (!confirm("Are you sure you want to delete this upload?")) return;

    try {
      const headers: Record<string, string> = {};
      if (coachToken) {
        headers["Authorization"] = `Bearer ${coachToken}`;
      }

      const response = await fetch(`/api/coach-uploads/delete?id=${uploadId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setUploads(uploads.filter((u) => u.id !== uploadId));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete upload");
    }
  };

  const handleEdit = (upload: CoachUpload) => {
    setEditingUpload(upload);
    setEditTitle(upload.title || "");
    setEditDescription(upload.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingUpload) return;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (coachToken) {
        headers["Authorization"] = `Bearer ${coachToken}`;
      }

      const response = await fetch(`/api/coach-uploads/update`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: editingUpload.id,
          title: editTitle,
          description: editDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      setUploads(
        uploads.map((u) =>
          u.id === editingUpload.id
            ? { ...u, title: editTitle, description: editDescription }
            : u
        )
      );
      setEditingUpload(null);
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update upload");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const groupedUploads = uploads.reduce((acc, upload) => {
    if (!acc[upload.member_id]) {
      acc[upload.member_id] = [];
    }
    acc[upload.member_id].push(upload);
    return acc;
  }, {} as Record<number, CoachUpload[]>);

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div
        style={{
          background: "#16161A",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
        >
          Upload to Client
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label>Select Client</Label>
            <select
              value={selectedMemberId || ""}
              onChange={(e) => setSelectedMemberId(parseInt(e.target.value))}
              className="w-full rounded-lg p-3 mt-1 outline-none transition-colors"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#FFFFFF",
              }}
              required
            >
              <option value="">Choose a client...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.membership_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Category</Label>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setCategory("training_program")}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all"
                style={{
                  background:
                    category === "training_program"
                      ? "rgba(124,252,0,0.15)"
                      : "rgba(0,0,0,0.4)",
                  border:
                    category === "training_program"
                      ? "1px solid rgba(124,252,0,0.3)"
                      : "1px solid rgba(255,255,255,0.1)",
                  color:
                    category === "training_program" ? "#7CFC00" : "#FFFFFF",
                }}
              >
                <Dumbbell size={18} />
                Training Program
              </button>
              <button
                type="button"
                onClick={() => setCategory("diet_plan")}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all"
                style={{
                  background:
                    category === "diet_plan"
                      ? "rgba(124,252,0,0.15)"
                      : "rgba(0,0,0,0.4)",
                  border:
                    category === "diet_plan"
                      ? "1px solid rgba(124,252,0,0.3)"
                      : "1px solid rgba(255,255,255,0.1)",
                  color: category === "diet_plan" ? "#7CFC00" : "#FFFFFF",
                }}
              >
                <Utensils size={18} />
                Diet Plan
              </button>
            </div>
          </div>

          <div>
            <Label>Title (Optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 1 Program"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes for your client..."
              rows={3}
              className="w-full rounded-lg p-3 mt-1 outline-none transition-colors resize-none"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#FFFFFF",
              }}
            />
          </div>

          <div>
            <Label>File (Photo or PDF, max 8MB)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="w-full rounded-lg p-3 mt-1 outline-none transition-colors"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#FFFFFF",
              }}
              required
            />
            {file && (
              <p className="text-sm mt-2" style={{ color: "#7CFC00" }}>
                Selected: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!file || !selectedMemberId || uploading}
            className="w-full py-3 rounded-xl font-bold text-black"
            style={{ background: "#7CFC00" }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </div>

      {/* Uploads List */}
      <div
        style={{
          background: "#16161A",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
        >
          Previous Uploads
        </h2>

        {Object.keys(groupedUploads).length === 0 ? (
          <p style={{ color: "#8B8B8B" }}>No uploads yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedUploads).map(([memberId, memberUploads]) => {
              const member = members.find((m) => m.id === parseInt(memberId));
              const isExpanded = expandedMemberId === parseInt(memberId);

              return (
                <div key={memberId}>
                  <button
                    onClick={() =>
                      setExpandedMemberId(
                        isExpanded ? null : parseInt(memberId)
                      )
                    }
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span
                      className="font-semibold"
                      style={{ color: "#FFFFFF" }}
                    >
                      {member?.name || "Unknown Client"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={20} style={{ color: "#8B8B8B" }} />
                    ) : (
                      <ChevronDown size={20} style={{ color: "#8B8B8B" }} />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 mt-3 pl-4"
                      >
                        {memberUploads.map((upload) => (
                          <div
                            key={upload.id}
                            className="flex items-start gap-3 p-3 rounded-lg"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            {upload.file_type === "image" ? (
                              <img
                                src={upload.file_url}
                                alt={upload.file_name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded flex items-center justify-center"
                                style={{
                                  background: "rgba(139,92,246,0.2)",
                                  border: "1px solid rgba(139,92,246,0.3)",
                                }}
                              >
                                <FileText
                                  size={24}
                                  style={{ color: "#8B5CF6" }}
                                />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p
                                className="font-semibold truncate"
                                style={{ color: "#FFFFFF" }}
                              >
                                {upload.title || upload.file_name}
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: "#8B8B8B" }}
                              >
                                {upload.category === "training_program"
                                  ? "Training Program"
                                  : "Diet Plan"}
                                {" • "}
                                {formatFileSize(upload.file_size)}
                              </p>
                              {upload.description && (
                                <p
                                  className="text-sm mt-1"
                                  style={{ color: "#5A5A5A" }}
                                >
                                  {upload.description}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(upload)}
                                className="p-2 rounded transition-colors hover:bg-white/10"
                                style={{ color: "#8B8B8B" }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(upload.id)}
                                className="p-2 rounded transition-colors hover:bg-white/10"
                                style={{ color: "#ef4444" }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setEditingUpload(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: "#16161A",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 440,
                position: "relative",
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-xl font-bold"
                  style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
                >
                  Edit Upload
                </h2>
                <button
                  onClick={() => setEditingUpload(null)}
                  style={{ color: "#8B8B8B" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg p-3 mt-1 outline-none transition-colors resize-none"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#FFFFFF",
                    }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setEditingUpload(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex-1 py-2.5 rounded-xl font-bold text-black"
                    style={{ background: "#7CFC00" }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
