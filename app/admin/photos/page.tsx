"use client";

import React, { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListPhotos, useDeletePhoto, useReorderPhotos, useReorderCoaches } from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Upload, Trash2, ImageIcon, Dumbbell, Camera, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { format } from "date-fns";
import { uploadImageDirect } from "@/lib/direct-upload";

interface CoachItem { id: number; name: string; email: string; created_at: string; display_order: number; }

function PhotoGrid({ photos, isLoading, emptyMessage, onDelete, isDeleting, onReorder, isReordering }: {
  photos: any[] | undefined; isLoading: boolean; emptyMessage: string;
  onDelete: (id: number) => void; isDeleting: boolean;
  onReorder?: (index: number, direction: "up" | "down") => void;
  isReordering?: boolean;
}) {
  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (!photos || photos.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-white/10 bg-transparent">
        <ImageIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <Card key={photo.id} className="overflow-hidden group flex flex-col">
          <div className="h-40 relative overflow-hidden bg-black">
            <img src={photo.url} alt={photo.caption || "Photo"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <button onClick={() => onDelete(photo.id)} disabled={isDeleting}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {onReorder && (
              <div className="absolute top-2 left-2 flex gap-1">
                <button
                  onClick={() => onReorder(index, "up")}
                  disabled={index === 0 || isReordering}
                  className="w-7 h-7 rounded-full bg-primary/80 text-black flex items-center justify-center hover:bg-primary disabled:opacity-50"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReorder(index, "down")}
                  disabled={index === photos.length - 1 || isReordering}
                  className="w-7 h-7 rounded-full bg-primary/80 text-black flex items-center justify-center hover:bg-primary disabled:opacity-50"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <Badge variant="outline" className="text-[9px]" dir="auto">{photo.caption || "Photo"}</Badge>
              <span className="text-[10px] text-muted-foreground">{format(new Date(photo.created_at), "MMM dd")}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPhotos() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"gallery" | "coaches">("gallery");
  const [preselectCoachId, setPreselectCoachId] = useState<string>("");
  const uploadFormRef = useRef<HTMLDivElement>(null);

  const { data: allPhotos, isLoading: photosLoading } = useListPhotos();

  const { data: coaches = [] } = useQuery<CoachItem[]>({
    queryKey: ["coaches-list"],
    queryFn: async () => {
      const res = await fetch("/api/coach/list", { headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {} });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!adminToken,
  });

  const galleryPhotos = allPhotos?.filter((p: any) => !p.category || p.category === "gallery") || [];
  const coachPhotos = allPhotos?.filter((p: any) => p.category === "coach") || [];

  const groupedCoachPhotos: Record<number, any[]> = {};
  coachPhotos.forEach((p) => {
    if (p.coach_id) {
      if (!groupedCoachPhotos[p.coach_id]) groupedCoachPhotos[p.coach_id] = [];
      groupedCoachPhotos[p.coach_id].push(p);
    }
  });

  const deleteMutation = useDeletePhoto();
  const reorderMutation = useReorderPhotos();
  const reorderCoachesMutation = useReorderCoaches();

  const handleDelete = (id: number) => {
    if (confirm("Delete this photo?")) {
      deleteMutation.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photos"] }) });
    }
  };

  const handleMove = (photos: any[], index: number, direction: "up" | "down") => {
    if (!photos.length) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    // Swap display_order values between the two photos
    const currentPhoto = photos[index];
    const targetPhoto = photos[newIndex];

    const swaps = [
      { id: currentPhoto.id, display_order: targetPhoto.display_order },
      { id: targetPhoto.id, display_order: currentPhoto.display_order },
    ];

    reorderMutation.mutate({ swaps });
  };

  const handleMoveCoach = (coachList: CoachItem[], index: number, direction: "up" | "down") => {
    if (!coachList.length) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= coachList.length) return;

    // Swap display_order values between the two coaches
    const currentCoach = coachList[index];
    const targetCoach = coachList[newIndex];

    const swaps = [
      { id: currentCoach.id, display_order: targetCoach.display_order },
      { id: targetCoach.id, display_order: currentCoach.display_order },
    ];

    reorderCoachesMutation.mutate({ swaps });
  };

  const handleAddPhotoForCoach = (coachId: string) => {
    setPreselectCoachId(coachId);
    if (uploadFormRef.current) {
      uploadFormRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const tabs = [
    { id: "gallery" as const, label: "Gallery", icon: Camera },
    { id: "coaches" as const, label: "Coaches", icon: Dumbbell },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white">Media Gallery</h1>
        <p className="text-muted-foreground">Upload and manage photos for gallery and coaches.</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-primary text-black" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "gallery" && (
        <div>
          <UploadForm title="Upload Gallery Photo" adminToken={adminToken} captionField
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["photos"] });
              queryClient.invalidateQueries({ queryKey: ["photos-coach"] });
            }} />
          <h3 className="text-xl font-display text-white mb-4">Gallery Photos ({galleryPhotos.length})</h3>
          <PhotoGrid photos={galleryPhotos} isLoading={photosLoading} emptyMessage="No gallery photos yet." onDelete={handleDelete} isDeleting={deleteMutation.isPending} onReorder={(index, direction) => handleMove(galleryPhotos, index, direction)} isReordering={reorderMutation.isPending} />
        </div>
      )}

      {activeTab === "coaches" && (
        <div>
          <div ref={uploadFormRef}>
            <UploadForm title="Upload Coach Photo" adminToken={adminToken} captionField coachSelect={coaches} preselectCoachId={preselectCoachId}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["photos"] });
                queryClient.invalidateQueries({ queryKey: ["photos-coach"] });
                setPreselectCoachId("");
              }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {coaches.map((coach, index) => {
              const coachPhotosList = groupedCoachPhotos[coach.id] || [];
              return (
                <div key={coach.id} className="border border-white/10 rounded-2xl p-6 bg-secondary/30">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-display text-white flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" /> {coach.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* Coach reorder arrows */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveCoach(coaches, index, "up")}
                          disabled={index === 0 || reorderCoachesMutation.isPending}
                          className="w-7 h-7 rounded-full bg-primary/80 text-black flex items-center justify-center hover:bg-primary disabled:opacity-50"
                          title="Move coach up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveCoach(coaches, index, "down")}
                          disabled={index === coaches.length - 1 || reorderCoachesMutation.isPending}
                          className="w-7 h-7 rounded-full bg-primary/80 text-black flex items-center justify-center hover:bg-primary disabled:opacity-50"
                          title="Move coach down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {coachPhotosList.length === 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleAddPhotoForCoach(String(coach.id))}
                          className="bg-primary text-black hover:bg-primary/90"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Photo
                        </Button>
                      )}
                    </div>
                  </div>
                  <PhotoGrid photos={coachPhotosList} isLoading={false}
                    emptyMessage={`No photos for ${coach.name} yet.`} onDelete={handleDelete} isDeleting={deleteMutation.isPending} />
                </div>
              );
            })}
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

function UploadForm({ title, adminToken, captionField, coachSelect, onSuccess, preselectCoachId }: {
  title: string; adminToken: string | null; captionField?: boolean;
  coachSelect?: CoachItem[]; onSuccess: () => void; preselectCoachId?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [coachId, setCoachId] = useState(preselectCoachId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Update coachId when preselectCoachId changes
  React.useEffect(() => {
    if (preselectCoachId) {
      setCoachId(preselectCoachId);
    }
  }, [preselectCoachId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      if (coachSelect && coachSelect.length > 0 && !coachId) {
        setError("Please select a coach");
        setSaving(false);
        return;
      }
      const category = coachId ? "coach" : "gallery";
      
      // Upload directly to Supabase (bypasses Vercel 4.5MB limit)
      const { url } = await uploadImageDirect(file);
      
      // Save record via API (small payload - just the URL)
      const photoData = {
        url,
        caption: caption || "",
        category,
        coachId: coachId ? parseInt(coachId) : null,
      };
      
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}` 
        },
        body: JSON.stringify(photoData),
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const errorText = contentType.includes("application/json")
          ? (await res.json()).error
          : await res.text();
        setError(errorText || "Upload failed");
        setSaving(false);
        return;
      }

      setFile(null);
      setPreview(null);
      setCaption("");
      setCoachId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 bg-secondary/50 border border-white/5">
      <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" /> {title}
      </h3>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-primary/50 bg-black/20">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0] || null; setFile(f);
            if (f) { const r = new FileReader(); r.onloadend = () => setPreview(r.result as string); r.readAsDataURL(f); } else setPreview(null);
          }} required />
          <label className="cursor-pointer flex flex-col items-center" onClick={() => fileInputRef.current?.click()}>
            {preview ? <img src={preview} alt="Preview" className="w-32 h-24 object-cover rounded-xl mb-3 border border-white/10" /> : <ImageIcon className="w-8 h-8 text-muted-foreground mb-3" />}
            <span className="text-white font-medium text-sm">{file ? file.name : "Click to browse"}</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, GIF, WEBP — max 10MB (iPhone HEIC not supported, please convert to JPEG first)</span>
          </label>
        </div>
        {captionField && <div><Label>Caption</Label><Input dir="auto" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption" /></div>}
        {coachSelect && coachSelect.length > 0 && (
          <div><Label>Select Coach</Label>
            <select className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white" value={coachId} onChange={(e) => setCoachId(e.target.value)}>
              <option value="">Choose a coach...</option>
              {coachSelect.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={!file || saving}>{saving ? "Uploading..." : "Upload Photo"}</Button>
        </div>
      </form>
    </Card>
  );
}
