"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Trash2, Edit, Eye, EyeOff, ArrowUp, ArrowDown, ImageIcon, Sparkles, X, Upload } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { validateImageFile, validateImageBytes } from "@/lib/validate-file";

interface CoachItem {
  id: number;
  name: string;
}

interface Transformation {
  id: string;
  member_name: string;
  duration_weeks: number;
  weight_lost_kg: number | null;
  muscle_gained_kg: number | null;
  before_image_url: string | null;
  after_image_url: string | null;
  coach_id: number | null;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  coaches?: CoachItem | null;
}

function getAuthHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Client-side direct upload to Supabase to bypass Vercel 4.5MB payload limit
async function uploadTransformationImage(
  file: File,
  adminToken: string,
  filename: string
): Promise<string> {
  // Validate file type and extension
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);

  // Validate file content matches type
  const bytes = await file.arrayBuffer();
  if (!validateImageBytes(bytes, file.type)) {
    throw new Error("File content does not match declared type.");
  }

  const safeContentType = file.type || "image/jpeg";

  // Step 1: Get signed URL from Next.js server
  const signedUrlRes = await fetch("/api/transformations/signed-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ filename, contentType: safeContentType }),
  });

  if (!signedUrlRes.ok) {
    const data = await signedUrlRes.json();
    throw new Error(data.error || "Failed to get upload URL");
  }

  const { signedUrl, path } = await signedUrlRes.json();

  // Step 2: Upload directly to Supabase Storage using signed URL
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": safeContentType,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  // Build public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/transformations/${path}`;

  return publicUrl;
}

export default function AdminTransformations() {
  const { adminToken } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTrans, setEditingTrans] = useState<Transformation | null>(null);

  // Fetch transformations
  const { data: transformations = [], isLoading } = useQuery<Transformation[]>({
    queryKey: ["transformations"],
    queryFn: async () => {
      const res = await fetch("/api/transformations", {
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to fetch transformations");
      return res.json();
    },
    enabled: !!adminToken,
  });

  // Fetch coaches list for dropdown selection
  const { data: coaches = [] } = useQuery<CoachItem[]>({
    queryKey: ["coaches-list-simple"],
    queryFn: async () => {
      const res = await fetch("/api/coaches");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!adminToken,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Transformation, "created_at" | "coaches">) => {
      const res = await fetch("/api/transformations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create transformation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transformations"] });
      setIsAddOpen(false);
      alert("Transformation saved ✓");
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transformation> }) => {
      const res = await fetch(`/api/transformations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update transformation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transformations"] });
      setEditingTrans(null);
      alert("Transformation saved ✓");
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  // Toggle visibility mutation (optimistic / fast toggle)
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const res = await fetch(`/api/transformations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify({ is_visible }),
      });
      if (!res.ok) throw new Error("Failed to toggle visibility");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transformations"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (trans: Transformation) => {
      const res = await fetch(`/api/transformations/${trans.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to delete transformation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transformations"] });
      alert("Deleted successfully");
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  // Reorder list order
  const reorderMutation = useMutation({
    mutationFn: async (swaps: { id: string; display_order: number }[]) => {
      const res = await fetch("/api/transformations/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify({ swaps }),
      });
      if (!res.ok) throw new Error("Failed to reorder transformations");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transformations"] });
    },
  });

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= transformations.length) return;

    const current = transformations[index];
    const target = transformations[targetIndex];

    reorderMutation.mutate([
      { id: current.id, display_order: target.display_order },
      { id: target.id, display_order: current.display_order },
    ]);
  };

  const handleDelete = (trans: Transformation) => {
    if (confirm(`Are you sure you want to delete ${trans.member_name}'s transformation? This cannot be undone.`)) {
      deleteMutation.mutate(trans);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display text-white">Transformations</h1>
          <p className="text-muted-foreground">Manage before & after member success stories.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Add New
        </Button>
      </div>

      {(isAddOpen || editingTrans) && (
        <TransformationForm
          trans={editingTrans}
          coaches={coaches}
          adminToken={adminToken}
          onClose={() => {
            setIsAddOpen(false);
            setEditingTrans(null);
          }}
          onSubmit={(id, data) => {
            if (editingTrans) {
              updateMutation.mutate({ id: editingTrans.id, data });
            } else {
              createMutation.mutate({ id, ...data });
            }
          }}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <Card className="overflow-hidden bg-card border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <th className="p-4 w-32">Photo Preview</th>
                <th className="p-4">Name</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Weight Lost</th>
                <th className="p-4">Muscle Gained</th>
                <th className="p-4">Coach</th>
                <th className="p-4">Visible</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading transformations...
                  </td>
                </tr>
              ) : transformations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    No transformations added yet.
                  </td>
                </tr>
              ) : (
                transformations.map((trans, index) => (
                  <tr key={trans.id} className="text-white hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex gap-1 h-14 w-24 border border-white/10 rounded overflow-hidden bg-black/40">
                        {trans.before_image_url ? (
                          <img src={trans.before_image_url} alt="Before" className="w-1/2 h-full object-cover" />
                        ) : (
                          <div className="w-1/2 h-full flex items-center justify-center bg-white/5 text-[9px] text-muted-foreground">N/A</div>
                        )}
                        {trans.after_image_url ? (
                          <img src={trans.after_image_url} alt="After" className="w-1/2 h-full object-cover" />
                        ) : (
                          <div className="w-1/2 h-full flex items-center justify-center bg-white/5 text-[9px] text-muted-foreground">N/A</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold" dir="auto">{trans.member_name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{trans.duration_weeks} Weeks</td>
                    <td className="p-4 text-sm font-semibold text-primary">{trans.weight_lost_kg ? `–${trans.weight_lost_kg} kg` : "—"}</td>
                    <td className="p-4 text-sm font-semibold text-green-400">{trans.muscle_gained_kg ? `+${trans.muscle_gained_kg} kg` : "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{trans.coaches?.name || trans.coach_id || "None"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleVisibilityMutation.mutate({ id: trans.id, is_visible: !trans.is_visible })}
                        className={`p-1.5 rounded-lg transition-colors ${trans.is_visible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-white/10"}`}
                        title={trans.is_visible ? "Visible on Homepage" : "Hidden"}
                      >
                        {trans.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0 || reorderMutation.isPending}
                          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMove(index, "down")}
                          disabled={index === transformations.length - 1 || reorderMutation.isPending}
                          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTrans(trans)}
                          className="p-2 rounded-lg text-white hover:bg-white/5"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(trans)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}

interface FormState {
  member_name: string;
  duration_weeks: string;
  weight_lost_kg: string;
  muscle_gained_kg: string;
  coach_id: string;
  is_visible: boolean;
  display_order: string;
}

function TransformationForm({
  trans,
  coaches,
  adminToken,
  onClose,
  onSubmit,
  isPending,
}: {
  trans: Transformation | null;
  coaches: CoachItem[];
  adminToken: string | null;
  onClose: () => void;
  onSubmit: (id: string, data: Omit<Transformation, "id" | "created_at" | "coaches">) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FormState>({
    member_name: trans?.member_name || "",
    duration_weeks: trans?.duration_weeks ? String(trans.duration_weeks) : "",
    weight_lost_kg: trans?.weight_lost_kg ? String(trans.weight_lost_kg) : "",
    muscle_gained_kg: trans?.muscle_gained_kg ? String(trans.muscle_gained_kg) : "",
    coach_id: trans?.coach_id ? String(trans.coach_id) : "",
    is_visible: trans?.is_visible !== undefined ? trans.is_visible : true,
    display_order: trans?.display_order !== undefined ? String(trans.display_order) : "",
  });

  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(trans?.before_image_url || null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(trans?.after_image_url || null);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleToggle = () => {
    setForm((prev) => ({ ...prev, is_visible: !prev.is_visible }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.member_name.trim()) newErrors.member_name = "Member Name is required";
    if (!form.duration_weeks.trim() || isNaN(Number(form.duration_weeks))) {
      newErrors.duration_weeks = "Valid duration in weeks is required";
    }
    if (!beforePreview && !afterPreview) {
      newErrors.images = "At least one image (Before or After) is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setUploading(true);

    try {
      // Create a unique UUID for the transformation record if it's new
      const recordId = trans?.id || crypto.randomUUID();
      
      let beforeUrl = trans?.before_image_url || null;
      let afterUrl = trans?.after_image_url || null;

      // Upload Before image directly if selected
      if (beforeFile) {
        beforeUrl = await uploadTransformationImage(
          beforeFile,
          adminToken || "",
          `before/${recordId}.jpg`
        );
      }

      // Upload After image directly if selected
      if (afterFile) {
        afterUrl = await uploadTransformationImage(
          afterFile,
          adminToken || "",
          `after/${recordId}.jpg`
        );
      }

      onSubmit(recordId, {
        member_name: form.member_name.trim(),
        duration_weeks: parseInt(form.duration_weeks),
        weight_lost_kg: form.weight_lost_kg ? parseFloat(form.weight_lost_kg) : null,
        muscle_gained_kg: form.muscle_gained_kg ? parseFloat(form.muscle_gained_kg) : null,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        coach_id: form.coach_id ? parseInt(form.coach_id) : null,
        is_visible: form.is_visible,
        display_order: form.display_order ? parseInt(form.display_order) : 0,
      });
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto relative p-6 bg-card border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-display text-white mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          {trans ? "Edit Transformation" : "Add New Transformation"}
        </h2>

        {errors.images && <p className="text-red-400 text-sm mb-4 text-center font-semibold">{errors.images}</p>}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <Label>Member Name *</Label>
            <Input
              name="member_name"
              value={form.member_name}
              onChange={handleChange}
              placeholder="e.g. Ahmed"
              required
              dir="auto"
            />
            {errors.member_name && <p className="text-red-400 text-xs mt-1">{errors.member_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (Weeks) *</Label>
              <Input
                type="number"
                name="duration_weeks"
                value={form.duration_weeks}
                onChange={handleChange}
                placeholder="e.g. 12"
                required
                min="1"
              />
              {errors.duration_weeks && <p className="text-red-400 text-xs mt-1">{errors.duration_weeks}</p>}
            </div>
            <div>
              <Label>Assign Coach (Optional)</Label>
              <select
                name="coach_id"
                value={form.coach_id}
                onChange={handleChange}
                className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:border-primary"
              >
                <option value="">Choose a coach...</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Weight Lost (kg)</Label>
              <Input
                type="number"
                name="weight_lost_kg"
                value={form.weight_lost_kg}
                onChange={handleChange}
                placeholder="e.g. 10"
                step="0.1"
              />
            </div>
            <div>
              <Label>Muscle Gained (kg)</Label>
              <Input
                type="number"
                name="muscle_gained_kg"
                value={form.muscle_gained_kg}
                onChange={handleChange}
                placeholder="e.g. 3"
                step="0.1"
              />
            </div>
          </div>

          {/* Image Upload Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before Image */}
            <div className="space-y-2">
              <Label>Before Image</Label>
              <div className="border border-dashed border-white/20 rounded-xl p-4 text-center hover:border-primary/50 bg-black/20">
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setBeforeFile(f);
                    if (f) {
                      const r = new FileReader();
                      r.onloadend = () => setBeforePreview(r.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                />
                <div
                  className="cursor-pointer flex flex-col items-center justify-center min-h-[100px]"
                  onClick={() => beforeInputRef.current?.click()}
                >
                  {beforePreview ? (
                    <img src={beforePreview} alt="Before Preview" className="w-full h-24 object-cover rounded-lg mb-2" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  )}
                  <span className="text-white text-xs font-medium line-clamp-1">{beforeFile ? beforeFile.name : "Choose Before Photo"}</span>
                </div>
              </div>
            </div>

            {/* After Image */}
            <div className="space-y-2">
              <Label>After Image</Label>
              <div className="border border-dashed border-white/20 rounded-xl p-4 text-center hover:border-primary/50 bg-black/20">
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setAfterFile(f);
                    if (f) {
                      const r = new FileReader();
                      r.onloadend = () => setAfterPreview(r.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                />
                <div
                  className="cursor-pointer flex flex-col items-center justify-center min-h-[100px]"
                  onClick={() => afterInputRef.current?.click()}
                >
                  {afterPreview ? (
                    <img src={afterPreview} alt="After Preview" className="w-full h-24 object-cover rounded-lg mb-2" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  )}
                  <span className="text-white text-xs font-medium line-clamp-1">{afterFile ? afterFile.name : "Choose After Photo"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <Label>Display Order (Optional)</Label>
              <Input
                type="number"
                name="display_order"
                value={form.display_order}
                onChange={handleChange}
                placeholder="e.g. 0"
              />
            </div>
            <div className="flex items-center gap-3 pt-6 select-none">
              <button
                type="button"
                onClick={handleToggle}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${form.is_visible ? "bg-primary" : "bg-white/10"}`}
              >
                <div className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${form.is_visible ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <span className="text-white text-sm font-medium">Visible on Homepage</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={uploading || isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || isPending}
            >
              {uploading ? "Uploading Images..." : isPending ? "Saving..." : "Save Transformation"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
