"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button, Card } from "@/components/ui/PremiumComponents";
import { Upload, ImageIcon, Calendar, Trash2, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSettings() {
  const { adminToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scheduleImage, setScheduleImage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings?key=schedule_image_url")
      .then((r) => r.json())
      .then((d) => setScheduleImage(d.value || ""))
      .catch(() => {});
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const r = new FileReader();
      r.onloadend = () => setPreview(r.result as string);
      r.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const saveUrl = async (url: string) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ key: "schedule_image_url", value: url }),
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", "schedule-image");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Server error: " + JSON.stringify(data));
        setSaving(false);
        return;
      }
      const imageUrl = data.url;
      await saveUrl(imageUrl);
      setScheduleImage(imageUrl);
      setFile(null);
      setPreview(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["setting"] });
      queryClient.invalidateQueries({ queryKey: ["photos"] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    try {
      await saveUrl("");
      setScheduleImage("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["setting"] });
    } catch {
      alert("Failed to remove");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white">Site Settings</h1>
        <p className="text-muted-foreground">Manage schedule image and other site-wide settings.</p>
      </div>
      <Card className="p-6 mb-8 bg-secondary/50 border border-white/5">
        <h2 className="text-xl font-display text-white mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Schedule Image
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a schedule image that will be displayed on the homepage schedule section.
        </p>
        {scheduleImage && (
          <div className="mb-6 relative rounded-xl overflow-hidden border border-white/10">
            <img src={scheduleImage} alt="Schedule" className="w-full h-auto max-h-[500px] object-contain bg-black/30" />
            <button onClick={onRemove} className="absolute top-3 right-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/90 text-white text-sm font-medium hover:bg-red-600">
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 bg-black/20 mb-4">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" id="schedule-upload" onChange={onFile} required />
            <label htmlFor="schedule-upload" className="cursor-pointer flex flex-col items-center">
              {preview ? (
                <img src={preview} alt="Preview" className="w-60 h-40 object-contain rounded-xl mb-3 border border-white/10" />
              ) : (
                <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
              )}
              <span className="text-white font-medium mb-1">{file ? file.name : "Click to browse"}</span>
              <span className="text-sm text-muted-foreground">PNG, JPG - max 10MB</span>
            </label>
          </div>
          <div className="flex items-center gap-4 justify-end">
            {success && (
              <span className="flex items-center gap-2 text-primary text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Saved!
              </span>
            )}
            <Button type="submit" disabled={!file || saving}>
              {saving ? "Uploading..." : <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Schedule</span>}
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  );
}