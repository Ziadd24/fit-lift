"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Trash2, Dumbbell, UserCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { format } from "date-fns";

interface CoachItem {
  id: number;
  name: string;
  created_at: string;
}

export default function AdminCoaches() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const { data: coaches = [], isLoading } = useQuery<CoachItem[]>({
    queryKey: ["coaches-list"],
    queryFn: async () => {
      const res = await fetch("/api/coach/list", {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!adminToken,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/coach/list", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add coach"); setAdding(false); return; }
      setName("");
      queryClient.invalidateQueries({ queryKey: ["coaches-list"] });
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (coach: CoachItem) => {
    if (!confirm(`Delete coach "${coach.name}" and all their photos?`)) return;
    try {
      const res = await fetch("/api/coach/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id: coach.id }),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to delete"); return; }
      queryClient.invalidateQueries({ queryKey: ["coaches-list"] });
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    } catch {
      alert("Something went wrong");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white">Manage Coaches</h1>
        <p className="text-muted-foreground">Add, remove, and manage your coaching staff.</p>
      </div>

      <Card className="p-6 mb-8 bg-secondary/50 border border-white/5">
        <h2 className="text-xl font-display text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Add New Coach
        </h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Coach Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mahmoud" required />
          </div>
          <Button type="submit" disabled={!name.trim() || adding}>
            {adding ? "Adding..." : "Add Coach"}
          </Button>
        </form>
      </Card>

      <h2 className="text-2xl font-display text-white mb-4">Coaches ({coaches.length})</h2>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : coaches.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-white/10 bg-transparent">
          <Dumbbell className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-muted-foreground">No coaches added yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => (
            <Card key={coach.id} className="p-5 flex items-center justify-between border border-white/10 bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{coach.name}</p>
                  <p className="text-muted-foreground text-xs">{format(new Date(coach.created_at), "MMM dd, yyyy")}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(coach)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}