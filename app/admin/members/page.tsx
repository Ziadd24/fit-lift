"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListMembers,
  useCreateMember,
  useDeleteMember,
} from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Trash2, Search, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { isMembershipActive } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/supabase";

export default function AdminMembers() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: members, isLoading } = useListMembers();
  const deleteMutation = useDeleteMember();

  const filteredMembers = members?.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.membership_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this member? All their data will be lost.")) {
      deleteMutation.mutate(
        { id },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display text-white">Members Directory</h1>
          <p className="text-muted-foreground">Manage gym members and subscriptions.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Add Member
        </Button>
      </div>

      {isAddOpen && <AddMemberForm onClose={() => setIsAddOpen(false)} />}

      <Card>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members by name or code..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <th className="p-4">Name / Email</th>
                <th className="p-4">Code</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading members...
                  </td>
                </tr>
              ) : filteredMembers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers?.map((m) => {
                  const active = isMembershipActive(m.sub_expiry_date);
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/members/${m.id}`)}
                    >
                      <td className="p-4">
                        <p className="font-bold text-white">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.email || m.phone || "No contact info"}
                        </p>
                      </td>
                      <td className="p-4 font-mono text-sm text-white">{m.membership_code}</td>
                      <td className="p-4">
                        <Badge variant="outline">{m.membership_type}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={active ? "success" : "destructive"}>
                          {active ? "Active" : "Expired"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exp: {format(new Date(m.sub_expiry_date), "MMM dd, yyyy")}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10 hover:text-primary px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/members/${m.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                            onClick={(e) => handleDelete(e, m.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}

function AddMemberForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateMember();

  const [formData, setFormData] = useState({
    name: "",
    membership_code: `FL-${Math.floor(1000 + Math.random() * 9000)}`,
    email: "",
    phone: "",
    membership_type: "Standard",
    sub_expiry_date: format(
      new Date(new Date().setMonth(new Date().getMonth() + 1)),
      "yyyy-MM-dd"
    ),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData as Omit<Member, "id" | "created_at">, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["members"] });
        onClose();
      },
    });
  };

  return (
    <Card className="mb-8 border border-primary p-6 bg-background relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-muted-foreground hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-2xl font-display text-white mb-6">Register New Member</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Full Name *</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label>Membership Code *</Label>
          <Input
            required
            value={formData.membership_code}
            onChange={(e) => setFormData({ ...formData, membership_code: e.target.value })}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label>Membership Type *</Label>
          <select
            className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:border-primary"
            value={formData.membership_type}
            onChange={(e) => setFormData({ ...formData, membership_type: e.target.value })}
          >
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
        <div>
          <Label>Expiry Date *</Label>
          <Input
            required
            type="date"
            value={formData.sub_expiry_date}
            onChange={(e) => setFormData({ ...formData, sub_expiry_date: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Save Member"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
