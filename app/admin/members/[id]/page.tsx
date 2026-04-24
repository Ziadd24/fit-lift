"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useGetMember,
  useListAnnouncements,
  useDeleteAnnouncement,
  useCreateAnnouncement,
  useUpdateMember,
} from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { format, addMonths, isAfter, parseISO } from "date-fns";
import { isMembershipActive } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Megaphone,
  RefreshCw,
  MessageCircle,
  CheckCircle,
  Edit3,
  Save,
  X,
  Trash2,
} from "lucide-react";

const GYM_WHATSAPP = "2010099887771";

export default function AdminMemberProfile() {
  const params = useParams<{ id: string }>();
  const memberId = parseInt(params.id, 10);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: member, isLoading: memberLoading } = useGetMember(memberId);
  const { data: announcements } = useListAnnouncements({ memberId });

  const deleteAnnouncementMutation = useDeleteAnnouncement();
  const createAnnouncementMutation = useCreateAnnouncement();
  const updateMemberMutation = useUpdateMember();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [renewMonths, setRenewMonths] = useState(1);
  const [renewSuccess, setRenewSuccess] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    name: string;
    email: string;
    phone: string;
    membership_type: string;
  } | null>(null);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createAnnouncementMutation.mutate(
      { title, content, is_global: false, target_member_id: memberId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
          setTitle("");
          setContent("");
        },
      }
    );
  };

  const handleRenew = () => {
    if (!member) return;
    const today = new Date();
    const currentExpiry = parseISO(member.sub_expiry_date);
    const baseDate = isAfter(currentExpiry, today) ? currentExpiry : today;
    const newExpiry = addMonths(baseDate, renewMonths);
    const newExpiryStr = format(newExpiry, "yyyy-MM-dd");

    updateMemberMutation.mutate(
      { id: memberId, data: { sub_expiry_date: newExpiryStr } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["members", memberId] });
          setRenewSuccess(true);
          setTimeout(() => setRenewSuccess(false), 3000);
        },
      }
    );
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    updateMemberMutation.mutate(
      { id: memberId, data: editData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["members", memberId] });
          setIsEditing(false);
          setEditData(null);
        },
      }
    );
  };

  if (memberLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading member...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!member) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground text-xl">Member not found.</p>
          <Button className="mt-4" onClick={() => router.push("/admin/members")}>
            Back to Members
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isActive = isMembershipActive(member.sub_expiry_date);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/members")}
          className="text-muted-foreground hover:text-white px-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-display text-white">{member.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{member.membership_code}</p>
        </div>
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Active" : "Expired"}
        </Badge>
        <a
          href={`https://wa.me/${GYM_WHATSAPP}?text=${encodeURIComponent(`Hi, regarding member ${member.name} (${member.membership_code})`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold uppercase tracking-wider h-9 px-4 rounded-xl transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — member details */}
        <div className="space-y-6">
          {/* Info card */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-display text-white">Member Info</h2>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-muted-foreground hover:text-white"
                  onClick={() => {
                    setIsEditing(true);
                    setEditData({
                      name: member.name,
                      email: member.email || "",
                      phone: member.phone || "",
                      membership_type: member.membership_type,
                    });
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-destructive"
                    onClick={() => { setIsEditing(false); setEditData(null); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="px-3"
                    onClick={handleSaveEdit}
                    disabled={updateMemberMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing && editData ? (
              <div className="space-y-3">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Membership Type</Label>
                  <select
                    className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:border-primary"
                    value={editData.membership_type}
                    onChange={(e) => setEditData({ ...editData, membership_type: e.target.value })}
                  >
                    {["Basic", "Standard", "Premium", "VIP"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  { label: "Email", value: member.email || "—" },
                  { label: "Phone", value: member.phone || "—" },
                  { label: "Type", value: member.membership_type },
                  {
                    label: "Joined",
                    value: format(new Date(member.created_at), "MMM dd, yyyy"),
                  },
                  {
                    label: "Expires",
                    value: format(new Date(member.sub_expiry_date), "MMM dd, yyyy"),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between items-center py-2 border-b border-white/5"
                  >
                    <span className="text-muted-foreground uppercase tracking-wider text-xs">
                      {row.label}
                    </span>
                    <span className="text-white font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Renew card */}
          <Card className="p-6">
            <h2 className="text-lg font-display text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> Renew Subscription
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <Label className="mb-0 shrink-0">Months</Label>
              <input
                type="number"
                min={1}
                max={24}
                value={renewMonths}
                onChange={(e) => setRenewMonths(parseInt(e.target.value) || 1)}
                className="flex h-10 w-20 rounded-xl border border-white/10 bg-black/40 px-3 text-white text-center focus:outline-none focus:border-primary"
              />
            </div>
            {renewSuccess ? (
              <div className="flex items-center gap-2 text-green-400 font-medium py-2">
                <CheckCircle className="w-5 h-5" /> Subscription renewed!
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleRenew}
                disabled={updateMemberMutation.isPending}
              >
                {updateMemberMutation.isPending ? "Renewing..." : `Renew +${renewMonths} month${renewMonths > 1 ? "s" : ""}`}
              </Button>
            )}
          </Card>

          {/* Direct message card */}
          <Card className="p-6">
            <h2 className="text-lg font-display text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Send Direct Note
            </h2>
            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Session reminder"
                />
              </div>
              <div>
                <Label>Message *</Label>
                <textarea
                  required
                  className="flex w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary min-h-[80px] resize-none placeholder:text-muted-foreground"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note..."
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createAnnouncementMutation.isPending}
              >
                {createAnnouncementMutation.isPending ? "Sending..." : "Send Note"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right column — announcements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Announcements */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              Notes & Announcements ({announcements?.length || 0})
            </h2>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <Card key={a.id} className="p-4 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <Badge variant={a.is_global ? "default" : "outline"} className="text-[10px]">
                          {a.is_global ? "Global" : "Personal"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                        onClick={() => {
                          if (confirm("Delete this note?")) {
                            deleteAnnouncementMutation.mutate(
                              { id: a.id },
                              {
                                onSuccess: () =>
                                  queryClient.invalidateQueries({ queryKey: ["announcements"] }),
                              }
                            );
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-white mb-1">{a.title}</h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{a.content}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-white/10 bg-transparent">
                <p className="text-muted-foreground">No notes for this member yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
