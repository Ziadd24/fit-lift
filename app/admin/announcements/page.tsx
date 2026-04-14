"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useListMembers,
} from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { useAuth } from "@/lib/use-auth";
import { Megaphone, Trash2, Bell, BellOff, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const { adminToken } = useAuth();
  const { data: announcements, isLoading } = useListAnnouncements();
  const { data: membersPage } = useListMembers();
  const members = membersPage?.members || [];

  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [memberId, setMemberId] = useState<string>("");

  // Popup settings
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupLoaded, setPopupLoaded] = useState(false);

  useEffect(() => {
    async function fetchPopupSettings() {
      try {
        const [enabledRes, titleRes, msgRes] = await Promise.all([
          fetch("/api/settings?key=popup_enabled"),
          fetch("/api/settings?key=popup_title"),
          fetch("/api/settings?key=popup_message"),
        ]);
        const [enabledData, titleData, msgData] = await Promise.all([
          enabledRes.json(),
          titleRes.json(),
          msgRes.json(),
        ]);
        setPopupEnabled(enabledData.value === "true");
        setPopupTitle(titleData.value || "");
        setPopupMessage(msgData.value || "");
      } catch (e) {
        console.error("Failed to fetch popup settings:", e);
      } finally {
        setPopupLoaded(true);
      }
    }
    fetchPopupSettings();
  }, []);

  const handleSavePopup = async () => {
    setPopupSaving(true);
    try {
      await Promise.all([
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}) },
          body: JSON.stringify({ key: "popup_enabled", value: popupEnabled ? "true" : "false" }),
        }),
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}) },
          body: JSON.stringify({ key: "popup_title", value: popupTitle }),
        }),
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}) },
          body: JSON.stringify({ key: "popup_message", value: popupMessage }),
        }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["setting", "popup_enabled"] });
      queryClient.invalidateQueries({ queryKey: ["setting", "popup_title"] });
      queryClient.invalidateQueries({ queryKey: ["setting", "popup_message"] });
      alert("Popup settings saved!");
    } catch (e) {
      console.error("Failed to save popup settings:", e);
      alert("Failed to save popup settings.");
    } finally {
      setPopupSaving(false);
    }
  };

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
        <div className="lg:col-span-1 space-y-6">

          {/* Popup Banner Control */}
          <Card className="p-6">
            <h2 className="text-xl font-display text-white mb-4 flex items-center gap-2">
              {popupEnabled ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
              Homepage Popup Banner
            </h2>

            {!popupLoaded ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="mb-0">Show Popup on Homepage</Label>
                  <button
                    type="button"
                    onClick={() => setPopupEnabled(!popupEnabled)}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${popupEnabled ? "bg-primary" : "bg-white/10"}`}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${popupEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {popupEnabled && (
                  <>
                    <div>
                      <Label>Popup Title</Label>
                      <Input value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} placeholder="e.g. Special Offer!" />
                    </div>
                    <div>
                      <Label>Popup Message</Label>
                      <textarea
                        className="flex w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white focus-visible:outline-none focus-visible:border-primary min-h-[80px] resize-none placeholder:text-muted-foreground"
                        value={popupMessage}
                        onChange={(e) => setPopupMessage(e.target.value)}
                        placeholder="e.g. Join now and get 50% off your first month!"
                      />
                    </div>
                  </>
                )}

                <Button onClick={handleSavePopup} disabled={popupSaving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {popupSaving ? "Saving..." : "Save Popup Settings"}
                </Button>
              </div>
            )}
          </Card>

          {/* Announcement Form */}
          <Card className="p-6">
            <h2 className="text-xl font-display text-white mb-6 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" /> Post Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday Hours" />
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
                  {members?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.membership_code})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
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
                    <Badge variant={a.is_global ? "default" : "outline"} className={!a.is_global ? "border-blue-500/30 text-blue-400" : ""}>
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