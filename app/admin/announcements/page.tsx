"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useListMembers,
} from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Megaphone, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const { data: announcements, isLoading } = useListAnnouncements();
  const { data: membersData } = useListMembers();
  const members = membersData?.members ?? [];

  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [memberId, setMemberId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const isGlobal = !memberId;

    createMutation.mutate(
      {
        title,
        content,
        is_global: isGlobal,
        target_member_id: isGlobal ? null : parseInt(memberId),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
          setTitle("");
          setContent("");
          setMemberId("");
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this announcement?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["announcements"] }),
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white">Announcements</h1>
        <p className="text-muted-foreground">
          Broadcast messages to all members or send direct notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Post form */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h2 className="text-xl font-display text-white mb-6 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" /> Post Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Holiday Hours"
                />
              </div>
              <div>
                <Label>Message Content *</Label>
                <textarea
                  required
                  className="flex w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white focus-visible:outline-none focus-visible:border-primary min-h-[120px] resize-none placeholder:text-muted-foreground"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your message here..."
                />
              </div>
              <div>
                <Label>Target Audience</Label>
                <select
                  className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:border-primary"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                >
                  <option value="">Global (All Members)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.membership_code})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Posting..." : "Post Announcement"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-display text-white mb-4">Feed History</h2>

          {isLoading ? (
            <p className="text-muted-foreground">Loading feed...</p>
          ) : announcements?.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
              <p className="text-muted-foreground">No announcements posted yet.</p>
            </Card>
          ) : (
            announcements?.map((a) => (
              <Card key={a.id} className="p-6 relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={a.is_global ? "default" : "outline"}
                      className={!a.is_global ? "border-blue-500/30 text-blue-400" : ""}
                    >
                      {a.is_global ? "Global" : `To: ${a.target_member_name}`}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(a.created_at), "MMM dd, yyyy h:mm a")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive opacity-0 group-hover:opacity-100 px-2 h-8"
                    onClick={() => handleDelete(a.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{a.title}</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{a.content}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}