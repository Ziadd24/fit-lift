"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button, Card, Label } from "@/components/ui/PremiumComponents";
import { Upload, ImageIcon, Calendar, Trash2, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSettings() {
  const { adminToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scheduleImage, setScheduleImage] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchSetting() {
      try {
        const res = await fetch("/api/settings?key=schedule_image_url");
        if (res.ok) {
          const data = await res.json();
          setScheduleImage(data.value || "");
        }
      } catch {}
    }
    fetchSetting();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

    const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", "schedule-image");
      const headers: Record<string, string> = {};
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;
      if (!imageUrl) throw new Error("No URL returned");
      const saveRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ key: "schedule_image_url", value: imageUrl }),
      });
      if (!saveRes.ok) throw new Error("Failed to save setting");
      setScheduleImage(imageUrl);
      setFile(null);
      setPreview(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["setting"] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

    const handleRemove = async () => {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ key: "schedule_image_url", value: "" }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      setScheduleImage("");
      queryClient.invalidateQueries({ queryKey: ["setting"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to remove schedule image");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white">Site Settings</h1>
        <p className="text-muted-foreground">
          Manage schedule image and other site-wide settings.
        </p>
      </div>

      <Card className="p-6 mb-8 bg-secondary/50 border border-white/5">
        <h2 className="text-xl font-display text-white mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Schedule Image
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a schedule image (PNG, JPG, PDF) that will be displayed on the homepage schedule section. 
          This replaces the default schedule table.
        </p>

        {scheduleImage && (
          <div className="mb-6 relative rounded-xl overflow-hidden border border-white/10">
            <img
              src={scheduleImage}
              alt="Current Schedule"
              className="w-full h-auto max-h-[500px] object-contain bg-black/30"
            />
            <button
              onClick={handleRemove}
              className="absolute top-3 right-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/90 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-black/20 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              id="schedule-upload"
              onChange={handleFileChange}
              required
            />
            <label htmlFor="schedule-upload" className="cursor-pointer flex flex-col items-center">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-60 h-40 object-contain rounded-xl mb-3 border border-white/10"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
              )}
              <span className="text-white font-medium mb-1">
                {file ? file.name : "Click to browse or drag and drop"}
              </span>
              <span className="text-sm text-muted-foreground">PNG, JPG, PDF — max 10MB</span>
            </label>
          </div>

          <div className="flex items-center gap-4 justify-end">
            {success && (
              <span className="flex items-center gap-2 text-primary text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Saved successfully!
              </span>
            )}
            <Button type="submit" disabled={!file || isUploading}>
              {isUploading ? "Uploading..." : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Schedule
                </span>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  );
}