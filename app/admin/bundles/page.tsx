"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Trash2, Edit, Dumbbell, Check, X, ArrowUp, ArrowDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";

interface Bundle {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlight: boolean;
  display_order: number;
  created_at: string;
}

function getAuthHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminBundles() {
  const { adminToken } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  const { data: bundles, isLoading } = useQuery<Bundle[]>({
    queryKey: ["bundles"],
    queryFn: async () => {
      const res = await fetch("/api/bundles", {
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to fetch bundles");
      return res.json();
    },
    enabled: !!adminToken,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Bundle, "id" | "created_at">) => {
      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create bundle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      setIsAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Bundle> }) => {
      const res = await fetch(`/api/bundles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update bundle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      setEditingBundle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bundles/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Failed to delete bundle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (swaps: { id: number; display_order: number }[]) => {
      const res = await fetch("/api/bundles/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify({ swaps }),
      });
      if (!res.ok) throw new Error("Failed to reorder bundles");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!bundles) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bundles.length) return;

    const current = bundles[index];
    const target = bundles[targetIndex];

    reorderMutation.mutate([
      { id: current.id, display_order: target.display_order },
      { id: target.id, display_order: current.display_order },
    ]);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display text-white">Membership Bundles</h1>
          <p className="text-muted-foreground">Manage gym membership packages and pricing.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Add Bundle
        </Button>
      </div>

      {(isAddOpen || editingBundle) && (
        <BundleForm
          bundle={editingBundle}
          onClose={() => {
            setIsAddOpen(false);
            setEditingBundle(null);
          }}
          onSubmit={(data) => {
            if (editingBundle) {
              updateMutation.mutate({ id: editingBundle.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading bundles...</p>
      ) : bundles?.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
          <Dumbbell className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-muted-foreground">No bundles created yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles?.map((bundle: Bundle, index: number) => (
            <Card key={bundle.id} className={`p-6 flex flex-col ${bundle.highlight ? "border border-primary/50 bg-primary/5" : ""}`}>
              {bundle.highlight && <Badge className="mb-4 w-fit">Most Popular</Badge>}
              <h3 className="text-2xl font-display text-white mb-2">{bundle.name}</h3>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-black text-white">EGP {bundle.price}</span>
                <span className="text-muted-foreground mb-1">{bundle.period}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {bundle.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0 || reorderMutation.isPending}
                  className="text-muted-foreground"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(index, "down")}
                  disabled={index === (bundles?.length ?? 0) - 1 || reorderMutation.isPending}
                  className="text-muted-foreground"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingBundle(bundle)}
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this bundle?")) deleteMutation.mutate(bundle.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function BundleForm({
  bundle,
  onClose,
  onSubmit,
  isPending,
}: {
  bundle: Bundle | null;
  onClose: () => void;
  onSubmit: (data: Omit<Bundle, "id" | "created_at">) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    period: "/ mo",
    features: [] as string[],
    highlight: false,
    display_order: 0,
  });
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    setFormData({
      name: bundle?.name || "",
      price: bundle?.price || 0,
      period: bundle?.period || "/ mo",
      features: bundle?.features || [],
      highlight: bundle?.highlight || false,
      display_order: bundle?.display_order ?? 0,
    });
  }, [bundle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Omit<Bundle, "id" | "created_at">);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  return (
    <Card className="mb-8 border border-primary p-6 bg-background relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-2xl font-display text-white mb-6">
        {bundle ? "Edit Bundle" : "Create New Bundle"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Bundle Name *</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Basic, Premium, VIP"
          />
        </div>
        <div>
          <Label>Price (EGP) *</Label>
          <Input
            required
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Period *</Label>
          <Input
            required
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            placeholder="/ mo, / week, / year"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="relative flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="highlight"
              checked={formData.highlight}
              onChange={(e) => setFormData({ ...formData, highlight: e.target.checked })}
              className="peer sr-only"
            />
            <span className="w-5 h-5 rounded border border-white/20 bg-white/5 peer-checked:bg-[#47D84B] peer-checked:border-[#47D84B] transition-colors flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </label>
          <Label htmlFor="highlight" className="mb-0 text-white cursor-pointer">Highlight as Most Popular</Label>
        </div>

        <div className="md:col-span-2">
          <Label>Features</Label>
          <div className="flex gap-2 mb-3">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Add a feature"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
            />
            <Button type="button" variant="outline" onClick={addFeature}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, i) => (
              <Badge key={i} variant="outline" className="gap-1">
                {feature}
                <button type="button" onClick={() => removeFeature(i)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : (bundle ? "Update Bundle" : "Create Bundle")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
