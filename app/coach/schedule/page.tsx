"use client";

import React, { useState, useEffect } from "react";
import { CoachLayout } from "@/components/layout/CoachLayout";
import {
  useListSessions,
  useCreateSession,
  useUpdateSession,
  useListMembers,
} from "@/lib/api-hooks";
import { Card, Button, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { Calendar, Clock, Plus, Play, Pause, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessions } from "@/lib/use-sessions";

export default function CoachSchedule() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Session Form State
  const [newSessionMemberId, setNewSessionMemberId] = useState("");
  const [newSessionType, setNewSessionType] = useState("Personal Training");
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionDuration, setNewSessionDuration] = useState("60");

  const { data: allSessions } = useListSessions(); // Fetch all sessions to avoid timezone API filtering bugs
  const { data: membersPage } = useListMembers();
  const membersList = membersPage?.members || [];
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();

  const displaySessions = allSessions
    ? allSessions.filter((s) => {
        const d = new Date(s.scheduled_at);
        const localDate =
          d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        return localDate === selectedDate;
      })
    : [];

  // Handle Session Timer Tick
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTime) return;

    const scheduledAt = new Date(`${selectedDate}T${newSessionTime}`).toISOString();
    
    createMutation.mutate(
      {
        memberId: parseInt(newSessionMemberId) || undefined,
        sessionType: newSessionType,
        scheduledAt,
        durationMinutes: parseInt(newSessionDuration) || 60,
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setNewSessionMemberId("");
          setNewSessionTime("");
        },
      }
    );
  };

  const { overrides, setOverride } = useSessions();
  
  const finalSessions = displaySessions.map((s: any) => ({ ...s, ...(overrides[s.id] || {}) }));

  const handleTimerAction = (sessionId: number, action: "start" | "pause" | "end") => {
    const now = new Date().toISOString();
    
    const existing = overrides[sessionId] || displaySessions.find((s: any) => s.id === sessionId);
    const updated: any = { ...existing, id: sessionId };

    if (action === "start") {
      updated.status = "in_progress";
      if (!updated.started_at) {
        updated.started_at = now;
      } 
      else if (updated.paused_at) {
        const pauseDuration = new Date(now).getTime() - new Date(updated.paused_at).getTime();
        updated.started_at = new Date(new Date(updated.started_at).getTime() + pauseDuration).toISOString();
        updated.paused_at = null;
      }
    } else if (action === "pause") {
      updated.status = "paused";
      updated.paused_at = now;
    } else if (action === "end") {
      updated.status = "completed";
      updated.ended_at = now;
    }

    setOverride(sessionId, updated);

    // We still attempt the api mutation quietly
    try {
      const payload: any = { id: sessionId, status: action === "end" ? "completed" : action === "pause" ? "scheduled" : "in_progress" };
      if (action === "end") payload.ended_at = now;
      if (action === "start") payload.started_at = updated.started_at;
      updateMutation.mutate(payload);
    } catch(e) {}
  };

  // Format elapsed time HH:MM:SS
  const formatTime = (session: any) => {
    if (!session.started_at) return "00:00:00";
    let elapsed = currentTime - new Date(session.started_at).getTime();
    
    if (session.status === "paused" && session.paused_at) {
      elapsed = new Date(session.paused_at).getTime() - new Date(session.started_at).getTime();
    }
    
    if (elapsed < 0) return "00:00:00";
    
    const h = Math.floor(elapsed / 3600000);
    const m = Math.floor((elapsed % 3600000) / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);
    
    return [h, m, s]
      .map((val) => val.toString().padStart(2, "0"))
      .join(":");
  };

  return (
    <CoachLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display text-white">Schedule</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your daily sessions and track time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto bg-black border-white/10"
          />
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {finalSessions.map((session: any) => (
            <motion.div
              layout
              key={session.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge
                      variant={
                        session.status === "completed"
                          ? "success"
                          : session.status === "in_progress"
                          ? "default"
                          : session.status === "paused"
                          ? "outline"
                          : "outline"
                      }
                      className="mb-2"
                    >
                      {session.status.replace("_", " ")}
                    </Badge>
                    <h3 className="text-xl font-display text-white text-glow">
                      {session.member_name || "Guest Client"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {session.session_type} • {session.duration_minutes} min
                    </p>
                  </div>
                  <div className="bg-black/40 rounded-lg px-3 py-2 text-center border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-bold">
                      Time
                    </p>
                    <p className="text-white font-mono text-lg leading-none">
                      {new Date(session.scheduled_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5">
                  {session.status === "scheduled" && (
                    <Button
                      className="w-full text-lg h-14"
                      onClick={() => handleTimerAction(session.id, "start")}
                    >
                      <Play className="w-5 h-5 mr-2 fill-current" />
                      Start Session
                    </Button>
                  )}

                  {session.status === "in_progress" && session.started_at && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        className="h-14 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/30 transition-colors"
                        onClick={() => handleTimerAction(session.id, "pause")}
                      >
                        <Pause className="w-5 h-5 mr-2 fill-current" />
                        <span className="font-mono text-lg truncate">
                          {formatTime(session)}
                        </span>
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-14 transition-colors"
                        onClick={() => handleTimerAction(session.id, "end")}
                      >
                        <Square className="w-5 h-5 mr-2 fill-current" />
                        End Session
                      </Button>
                    </div>
                  )}

                  {session.status === "paused" && session.started_at && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        className="h-14 bg-green-500 hover:bg-green-600 border-none text-white transition-colors"
                        onClick={() => handleTimerAction(session.id, "start")}
                      >
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        Resume
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-14 transition-colors"
                        onClick={() => handleTimerAction(session.id, "end")}
                      >
                        <Square className="w-5 h-5 mr-2 fill-current" />
                        End Session
                      </Button>
                    </div>
                  )}

                  {session.status === "completed" && (
                    <div className="flex justify-between items-center text-muted-foreground bg-black/40 rounded-xl px-4 py-3 border border-white/5">
                      <span className="text-sm font-medium">Session Ended</span>
                      <span className="font-mono">
                        {session.ended_at
                          ? new Date(session.ended_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--"}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
          
          {displaySessions.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-white/10 rounded-2xl"
            >
              <Clock className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-lg">No sessions scheduled for this date.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Session Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
            >
              <Card className="p-6">
                <h2 className="text-2xl font-display text-white mb-6">
                  Schedule Session
                </h2>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <Label>Client</Label>
                    <select
                      value={newSessionMemberId}
                      onChange={(e) => setNewSessionMemberId(e.target.value)}
                      className="w-full flex h-12 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-black/60 shadow-sm transition-all"
                    >
                      <option value="">Guest Client</option>
                      {membersList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Session Type</Label>
                    <Input
                      value={newSessionType}
                      onChange={(e) => setNewSessionType(e.target.value)}
                      placeholder="e.g. Personal Training"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={newSessionTime}
                        onChange={(e) => setNewSessionTime(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Duration (min)</Label>
                      <Input
                        type="number"
                        min="15"
                        step="15"
                        value={newSessionDuration}
                        onChange={(e) => setNewSessionDuration(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Saving..." : "Schedule"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CoachLayout>
  );
}
