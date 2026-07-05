"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Trash2, Edit, Dumbbell, Check, X, ArrowUp, ArrowDown, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { useCoachPackages, useAddCoachPackage, useUpdateCoachPackage, useDeleteCoachPackage } from "@/features/admin/services/api";

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
  const [activeTab, setActiveTab] = useState<"memberships" | "coach-sessions">("memberships");
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
          <h1 className="text-3xl font-display text-white">Packages & Bundles</h1>
          <p className="text-muted-foreground">Manage gym membership bundles and coach private session pricing.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab("memberships")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "memberships" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white"}`}
        >
          <Dumbbell className="w-4 h-4" /> Gym Memberships
        </button>
        <button 
          onClick={() => setActiveTab("coach-sessions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "coach-sessions" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white"}`}
        >
          <Users className="w-4 h-4" /> Coach Sessions
        </button>
      </div>

      {activeTab === "memberships" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end mb-6">
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
              <h3 className="text-2xl font-display text-white mb-2" dir="auto">{bundle.name}</h3>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-black text-white">EGP {bundle.price}</span>
                <span className="text-muted-foreground mb-1" dir="auto">{bundle.period}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {bundle.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> <bdi dir="auto">{feature}</bdi>
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
        </div>
      )}

      {activeTab === "coach-sessions" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PackagePricingTab />
        </div>
      )}
    </AdminLayout>
  );
}

function PackagePricingTab() {
  const { data: packages = [], isLoading } = useCoachPackages();
  const addMutation = useAddCoachPackage();
  const updateMutation = useUpdateCoachPackage();
  const deleteMutation = useDeleteCoachPackage();

  const [isAdding, setIsAdding] = useState(false);
  const [newPkg, setNewPkg] = useState({ sessions: 10, label_en: "", label_ar: "", price: 0, popular: false, display_order: 0 });
  const [editingPkgId, setEditingPkgId] = useState<number | null>(null);
  const [editPkg, setEditPkg] = useState({ sessions: 10, label_en: "", label_ar: "", price: 0, popular: false, display_order: 0 });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(newPkg, {
      onSuccess: () => {
        setIsAdding(false);
        setNewPkg({ sessions: 10, label_en: "", label_ar: "", price: 0, popular: false, display_order: 0 });
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkgId === null) return;
    updateMutation.mutate({ id: editingPkgId, ...editPkg }, {
      onSuccess: () => {
        setEditingPkgId(null);
      }
    });
  };

  const togglePopular = (pkg: any) => {
    updateMutation.mutate({ ...pkg, popular: !pkg.popular });
  };

  const startEdit = (pkg: any) => {
    setEditingPkgId(pkg.id);
    setEditPkg({
      sessions: pkg.sessions,
      label_en: pkg.label_en,
      label_ar: pkg.label_ar,
      price: pkg.price,
      popular: pkg.popular,
      display_order: pkg.display_order
    });
  };

  if (isLoading) return <p className="text-muted-foreground">Loading packages...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-white/70 text-sm">Manage the private session pricing tiers shown on the homepage.</p>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "ghost" : "primary"}>
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Package</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-5 bg-secondary/50 border border-white/10">
          <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
            <div><Label>Sessions</Label><Input type="number" value={newPkg.sessions} onChange={e => setNewPkg({...newPkg, sessions: parseInt(e.target.value)})} required /></div>
            <div><Label>Label (EN)</Label><Input value={newPkg.label_en} onChange={e => setNewPkg({...newPkg, label_en: e.target.value})} placeholder="e.g. 10 Sessions" required /></div>
            <div><Label>Label (AR)</Label><Input value={newPkg.label_ar} onChange={e => setNewPkg({...newPkg, label_ar: e.target.value})} placeholder="e.g. 10 جلسات" dir="rtl" required /></div>
            <div><Label>Price (EGP)</Label><Input type="number" value={newPkg.price} onChange={e => setNewPkg({...newPkg, price: parseInt(e.target.value)})} required /></div>
            <div><Label>Order</Label><Input type="number" value={newPkg.display_order} onChange={e => setNewPkg({...newPkg, display_order: parseInt(e.target.value)})} /></div>
            <Button type="submit" disabled={addMutation.isPending} className="w-full">Save</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.sort((a, b) => a.display_order - b.display_order).map((pkg: any) => (
          <Card key={pkg.id} className={`p-5 border flex flex-col gap-3 ${pkg.popular ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-secondary/30'}`}>
            {editingPkgId === pkg.id ? (
              <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                <div><Label className="text-xs">Sessions</Label><Input type="number" value={editPkg.sessions} onChange={e => setEditPkg({...editPkg, sessions: parseInt(e.target.value)})} required className="h-8" /></div>
                <div><Label className="text-xs">Label (EN)</Label><Input value={editPkg.label_en} onChange={e => setEditPkg({...editPkg, label_en: e.target.value})} required className="h-8" /></div>
                <div><Label className="text-xs">Label (AR)</Label><Input value={editPkg.label_ar} onChange={e => setEditPkg({...editPkg, label_ar: e.target.value})} dir="rtl" required className="h-8" /></div>
                <div><Label className="text-xs">Price (EGP)</Label><Input type="number" value={editPkg.price} onChange={e => setEditPkg({...editPkg, price: parseInt(e.target.value)})} required className="h-8" /></div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" type="submit" disabled={updateMutation.isPending} className="flex-1">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingPkgId(null)} className="flex-1">Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-white">{pkg.label_en}</h3>
                  {pkg.popular && <Badge className="bg-primary text-black hover:bg-primary text-[10px]">Popular</Badge>}
                </div>
                <p className="text-right font-medium text-white/80" dir="rtl">{pkg.label_ar}</p>
                <p className="text-2xl font-black text-primary">{pkg.price.toLocaleString()} <span className="text-sm font-medium text-white/50">EGP</span></p>
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/10">
                  <button 
                    onClick={() => togglePopular(pkg)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${pkg.popular ? 'text-primary bg-primary/10' : 'text-white/50 hover:bg-white/5'}`}
                  >
                    Make {pkg.popular ? "Normal" : "Popular"}
                  </button>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEdit(pkg)}
                      className="text-white/50 hover:text-white hover:bg-white/5 p-1.5 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { if(confirm("Delete this package?")) deleteMutation.mutate(pkg.id); }}
                      className="text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
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
            dir="auto"
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
            dir="ltr"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Period *</Label>
          <Input
            required
            dir="auto"
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
              dir="auto"
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
              <Badge key={i} variant="outline" className="gap-1" dir="auto">
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
