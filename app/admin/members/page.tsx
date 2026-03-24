"use client";

import React, { useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListMembers,
  useCreateMember,
  useDeleteMember,
  type MembersFilters,
} from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Trash2, Search, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { isMembershipActive } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/supabase";

export default function AdminMembers() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filters, setFilters] = useState<MembersFilters>({
    page: 1,
    search: "",
    status: "all",
    type: "all",
  });
  const [searchInput, setSearchInput] = useState("");

  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, isFetching } = useListMembers(filters);
  const deleteMutation = useDeleteMember();

  const members = data?.members ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Debounce search — only fires after user stops typing for 400ms
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      const timer = setTimeout(() => {
        setFilters((f) => ({ ...f, search: value, page: 1 }));
      }, 400);
      return () => clearTimeout(timer);
    },
    []
  );

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this member? All their data will be lost.")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
          },
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display text-white">Members Directory</h1>
          <p className="text-muted-foreground">
            {total > 0 ? `${total.toLocaleString()} members total` : "Manage gym members and subscriptions."}
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Add Member
        </Button>
      </div>

      {isAddOpen && <AddMemberForm onClose={() => setIsAddOpen(false)} />}

      <Card>
        {/* Search + Filters */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3 flex-1 bg-white/5 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, code or email..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-muted-foreground py-3 text-sm"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setFilters((f) => ({ ...f, search: "", page: 1 })); }}>
                <X className="w-4 h-4 text-muted-foreground hover:text-white" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-primary"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as MembersFilters["status"], page: 1 }))}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>

          {/* Type filter */}
          <select
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-primary"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
          >
            <option value="all">All Types</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        {/* Table */}
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
            <tbody className={`divide-y divide-white/5 transition-opacity ${isFetching ? "opacity-50" : "opacity-100"}`}>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4">
                      <div className="h-4 bg-white/10 rounded w-40 mb-2 animate-pulse" />
                      <div className="h-3 bg-white/5 rounded w-28 animate-pulse" />
                    </td>
                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-20 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-16 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-14 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {filters.page} of {totalPages} — {total.toLocaleString()} members
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page === 1 || isFetching}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const currentPage = filters.page ?? 1;
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setFilters((f) => ({ ...f, page: pageNum }))}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === currentPage
                        ? "bg-primary text-black"
                        : "text-muted-foreground hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page === totalPages || isFetching}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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