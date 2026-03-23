"use client";

import React, { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListPhotos,
  useUploadPhoto,
  useDeletePhoto,
  useListMembers,
} from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminPhotos() {
  const queryClient = useQueryClient();
  const { data: photos, isLoading } = useListPhotos();
  const { data: members } = useListMembers();

  const uploadMutation = useUploadPhoto();
  const deleteMutation = useDeletePhoto();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [memberId, setMemberId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);

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

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    uploadMutation.mutate(
      {
        file,
        caption: caption || undefined,
        memberId: memberId ? parseInt(memberId) : undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["photos"] });
          setFile(null);
          setCaption("");
          setMemberId("");
          setPreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this photo?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photos"] }),
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white">Media Gallery</h1>
        <p className="text-muted-foreground">
          Upload and manage gym progress photos.
        </p>
      </div>

      {/* Upload form */}
      <Card className="p-6 mb-10 bg-secondary/50 border border-white/5">
        <h2 className="text-xl font-display text-white mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" /> Upload New Photo
        </h2>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>Select Image File *</Label>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-black/20">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                id="photo-upload"
                onChange={handleFileChange}
                required
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-40 h-32 object-cover rounded-xl mb-3 border border-white/10"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
                )}
                <span className="text-white font-medium mb-1">
                  {file ? file.name : "Click to browse or drag and drop"}
                </span>
                <span className="text-sm text-muted-foreground">JPG, PNG, WEBP — max 10MB</span>
              </label>
            </div>
          </div>

          <div>
            <Label>Target Member (Optional)</Label>
            <select
              className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:border-primary"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">Global (All Members)</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.membership_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Caption (Optional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Great form today!"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={!file || uploadMutation.isPending}>
              {uploadMutation.isPending ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="text-2xl font-display text-white mb-6">Gallery Archive</h2>

      {isLoading ? (
        <p className="text-muted-foreground">Loading photos...</p>
      ) : photos?.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
          <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-muted-foreground">No photos uploaded yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos?.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group flex flex-col">
              <div className="h-48 relative overflow-hidden bg-black">
                <img
                  src={photo.url}
                  alt={photo.caption || "Gym"}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 h-8 transition-opacity"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant={photo.member_id ? "outline" : "default"}
                    className="text-[10px]"
                  >
                    {photo.member_name || "Global"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(photo.created_at), "MMM dd")}
                  </span>
                </div>
                <p className="text-sm text-white line-clamp-2">
                  {photo.caption || "No caption"}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
