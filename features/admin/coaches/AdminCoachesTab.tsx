"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Users, UserCheck, Plus, Trash2, Edit2, ChevronDown, Check,
  Dumbbell, ArrowUpDown, Tag, DollarSign, Activity
} from "lucide-react";
import { 
  Button, Card, Input, Label, Badge 
} from "@/components/ui/PremiumComponents";
import { 
  useAdminCoaches, useAddAdminCoach, useUpdateAdminCoach, useDeleteAdminCoach,
  useAdminMembers, useAdminAssignMember
} from "../services/api";

// Helper components for the three sub-tabs
function CoachDirectoryTab() {
  const { data: coaches = [], isLoading } = useAdminCoaches();
  const addCoachMutation = useAddAdminCoach();
  const updateCoachMutation = useUpdateAdminCoach();
  const deleteCoachMutation = useDeleteAdminCoach();
  
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isDisplayOnly, setIsDisplayOnly] = useState(true);

  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isDisplayOnly && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    addCoachMutation.mutate({ 
      name: name.trim(), 
      display_name: displayName.trim() || undefined,
      password: isDisplayOnly ? undefined : password,
      is_display_only: isDisplayOnly
    }, {
      onSuccess: () => {
        setName("");
        setDisplayName("");
        setPassword("");
      },
      onError: (err: any) => setError(err.message)
    });
  };

  const handleEdit = (coach: any) => {
    setEditingId(coach.id);
    setEditName(coach.name);
    setEditDisplayName(coach.display_name || "");
  };

  const saveEdit = (id: number) => {
    updateCoachMutation.mutate({ id, name: editName, display_name: editDisplayName || null }, {
      onSuccess: () => setEditingId(null)
    });
  };

  if (isLoading) return <p className="text-muted-foreground">Loading coaches...</p>;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-secondary/50 border border-white/5">
        <h2 className="text-xl font-display text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Add Coach
        </h2>
        <p className="text-sm text-white/60 mb-6">
          Create a public profile for marketing, or a real account that can log in and manage clients.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="flex bg-black/40 p-1 rounded-lg w-fit mb-4 border border-white/5">
            <button 
              type="button" 
              onClick={() => setIsDisplayOnly(true)} 
              className={`px-4 py-2 text-sm rounded-md transition-all ${isDisplayOnly ? 'bg-primary text-black font-bold' : 'text-white/60 hover:text-white'}`}
            >
              Display Only
            </button>
            <button 
              type="button" 
              onClick={() => setIsDisplayOnly(false)} 
              className={`px-4 py-2 text-sm rounded-md transition-all ${!isDisplayOnly ? 'bg-primary text-black font-bold' : 'text-white/60 hover:text-white'}`}
            >
              Real Coach
            </button>
          </div>
          
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label>System Name (Login / Search)</Label>
              <Input dir="auto" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mahmoud" required />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Display Name (Arabic/Public)</Label>
              <Input dir="auto" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. كابتن محمود" />
            </div>
            {!isDisplayOnly && (
              <div className="flex-1 min-w-[200px]">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 chars" required={!isDisplayOnly} />
              </div>
            )}
            <Button type="submit" className="w-full sm:w-auto" disabled={!name.trim() || addCoachMutation.isPending}>
              {addCoachMutation.isPending ? "Adding..." : "Add Coach"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coaches.map((coach) => (
          <Card key={coach.id} className="p-5 flex flex-col justify-between border border-white/10 bg-secondary/30 gap-4">
            {editingId === coach.id ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">System Name (Login / Search)</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Display Name (Arabic/Public)</Label>
                  <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className="h-8 text-sm" dir="auto" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(coach.id)} disabled={updateCoachMutation.isPending}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate" dir="auto">{coach.display_name || coach.name}</p>
                    <p className="text-white/50 text-xs truncate">{coach.name}</p>
                    <p className="text-muted-foreground text-xs mt-1">{format(new Date(coach.created_at), "MMM dd, yyyy")}</p>
                    <Badge variant={coach.is_display_only ? "outline" : "default"} className="mt-2 text-[10px]">
                      {coach.is_display_only ? "Display Only" : "Real Coach"}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(coach)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      if (confirm(`Delete coach "${coach.name}"?`)) {
                        deleteCoachMutation.mutate(coach.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
        {coaches.length === 0 && (
          <div className="col-span-full p-8 text-center border-dashed border-white/10 rounded-xl">
            <p className="text-muted-foreground">No coaches found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientAssignmentsTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminMembers(search);
  const { data: coaches = [] } = useAdminCoaches();
  const assignMutation = useAdminAssignMember();

  const members = data?.members || [];

  const handleAssign = (memberId: number, coachId: string) => {
    if (coachId === "unassign") {
      assignMutation.mutate({ id: memberId, action: "unassign" });
    } else {
      assignMutation.mutate({ id: memberId, action: "assign", coach_id: parseInt(coachId) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-xl border border-white/5">
        <div className="flex-1 max-w-md relative">
          <Input 
            placeholder="Search members..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <p className="text-sm text-muted-foreground">Total: {data?.total || 0}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-secondary/20">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Membership Code</th>
              <th className="px-4 py-3 font-medium">Assigned Coach</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-white/50">Loading members...</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-white/50">No members found.</td></tr>
            ) : (
              members.map((member: any) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{member.name}</td>
                  <td className="px-4 py-3 text-white/70">{member.membership_code}</td>
                  <td className="px-4 py-3">
                    <select
                      className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary w-48"
                      value={member.coach_id?.toString() || "unassign"}
                      onChange={(e) => handleAssign(member.id, e.target.value)}
                      disabled={assignMutation.isPending}
                    >
                      <option value="unassign">-- Unassigned --</option>
                      {coaches.map(c => (
                        <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCoachesTab() {
  const [activeTab, setActiveTab] = useState<"directory" | "assignments">("directory");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black tracking-tight text-white mb-2">Coach Management</h1>
        <p className="text-muted-foreground text-sm">Manage coach directories and client rosters.</p>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "directory" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white"}`}
        >
          <UserCheck className="w-4 h-4" /> Directory
        </button>
        <button 
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "assignments" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white"}`}
        >
          <Users className="w-4 h-4" /> Assignments
        </button>
      </div>

      {activeTab === "directory" && <CoachDirectoryTab />}
      {activeTab === "assignments" && <ClientAssignmentsTab />}
    </div>
  );
}
