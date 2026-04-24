"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CoachLayout } from "@/components/layout/CoachLayout";
import {
  useListSessions,
  useCreateSession,
  useUpdateSession,
  useListMembers,
} from "@/lib/api-hooks";
import { useCoachLanguage } from "@/lib/coach-language";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Search, HelpCircle, Plus, X,
  Clock, Calendar, Users, Dumbbell, Zap, Heart, Bike, Star,
  Filter, ChevronDown, Edit2, Trash2, Check, Play, Pause, Square,
  MoreHorizontal, GripVertical,
} from "lucide-react";
import { useSessions } from "@/lib/use-sessions";

// ─── Mobile Detection Hook ───────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── Type Definitions ────────────────────────────────────────────────────────

interface Resource {
  id: string;
  name: string;
  type: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
}

interface Booking {
  id: number | string;
  clientName: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  resourceId: string;
  activityType: string;
  status: string;
  participants: { initials: string; color: string }[];
  memberId?: number;
  durationMinutes?: number;
  scheduledAt?: string;
  isReal?: boolean;
  started_at?: string;
  paused_at?: string;
  ended_at?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GRID_START_HOUR = 7;   // 7 AM
const GRID_END_HOUR   = 21;  // 9 PM
const SLOT_HEIGHT_PX  = 60;  // px per 30 min
const TOTAL_SLOTS     = (GRID_END_HOUR - GRID_START_HOUR) * 2; // 30-min intervals

const RESOURCES: Resource[] = [
  { id: "personal",  name: "Personal Training", type: "training",  icon: Dumbbell,  color: "rgba(124,252,0,0.15)",    glowColor: "#7CFC00" },
  { id: "group",     name: "Group Class",        type: "class",     icon: Users,     color: "rgba(139,92,246,0.15)",   glowColor: "#8B5CF6" },
  { id: "hiit",      name: "HIIT",               type: "cardio",    icon: Zap,       color: "rgba(245,158,11,0.15)",   glowColor: "#F59E0B" },
  { id: "yoga",      name: "Yoga & Recovery",    type: "recovery",  icon: Heart,     color: "rgba(236,72,153,0.15)",   glowColor: "#EC4899" },
  { id: "cardio",    name: "Cardio Zone",         type: "cardio",    icon: Bike,      color: "rgba(16,185,129,0.15)",   glowColor: "#10B981" },
  { id: "vip",       name: "VIP Coaching",        type: "vip",       icon: Star,      color: "rgba(251,191,36,0.15)",   glowColor: "#FBB924" },
];

const ACTIVITY_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  "Personal Training": { bg: "rgba(124,252,0,0.12)",  border: "rgba(124,252,0,0.35)",  glow: "rgba(124,252,0,0.25)",  text: "#7CFC00" },
  "Group Class":       { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.35)", glow: "rgba(139,92,246,0.25)", text: "#8B5CF6" },
  "HIIT":              { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", glow: "rgba(245,158,11,0.25)", text: "#F59E0B" },
  "Yoga & Recovery":   { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.35)", glow: "rgba(236,72,153,0.25)", text: "#EC4899" },
  "Cardio Zone":       { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", glow: "rgba(16,185,129,0.25)", text: "#10B981" },
  "VIP Coaching":      { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)", glow: "rgba(251,191,36,0.25)", text: "#FBB924" },
};

const AVATAR_COLORS = ["#7CFC00","#8B5CF6","#F59E0B","#EC4899","#10B981","#FBB924","#38BDF8"];

const SESSION_TYPE_TO_RESOURCE: Record<string, string> = {
  "Personal Training": "personal",
  "Group Class":       "group",
  "HIIT":              "hiit",
  "Yoga":              "yoga",
  "Yoga & Recovery":   "yoga",
  "Cardio":            "cardio",
  "Cardio Zone":       "cardio",
  "VIP Coaching":      "vip",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - GRID_START_HOUR) * 2 + Math.floor(m / 30);
}

function slotToTime(slot: number): string {
  const totalMin = GRID_START_HOUR * 60 + slot * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function formatDisplayTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function dateToISO(date: Date): string {
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2,"0") + "-" +
    String(date.getDate()).padStart(2,"0");
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function minutesDuration(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function TimeLabel({ slot }: { slot: number }) {
  const time = slotToTime(slot);
  const [h, m] = time.split(":").map(Number);
  const isHour = m === 0;
  const label = formatDisplayTime(time);
  return (
    <div
      className="flex items-start justify-end pr-3 select-none"
      style={{
        height: SLOT_HEIGHT_PX,
        paddingTop: 4,
        opacity: isHour ? 0.7 : 0.3,
        fontSize: isHour ? 11 : 10,
        fontFamily: "ui-monospace, monospace",
        color: "#ffffff",
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {isHour ? label : `— ${m}`}
    </div>
  );
}

function EmptySlot({
  slot, resourceId, onClickCreate, addLabel
}: {
  slot: number;
  resourceId: string;
  onClickCreate: (slot: number, resourceId: string) => void;
  addLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClickCreate(slot, resourceId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: SLOT_HEIGHT_PX,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "background 0.15s",
        background: hovered ? "rgba(124,252,0,0.04)" : "transparent",
        position: "relative",
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 10, color: "rgba(124,252,0,0.7)",
          fontFamily: "Inter,sans-serif", fontWeight: 600,
          pointerEvents: "none",
        }}>
          <Plus size={11} /> {addLabel ?? "New"}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking, onEdit, onStatusChange, currentTime, texts
}: {
  booking: Booking;
  onEdit: (b: Booking) => void;
  onStatusChange: (id: number | string, action: "start" | "pause" | "end") => void;
  currentTime: number;
  texts: {
    start: string;
    resume: string;
    end: string;
    pause: string;
  };
}) {
  const [hovered, setHovered] = useState(false);
  const startSlot = timeToSlot(booking.startTime);
  const endSlot   = timeToSlot(booking.endTime);
  const spanSlots  = Math.max(endSlot - startSlot, 1);
  const height     = spanSlots * SLOT_HEIGHT_PX - 4;
  const top        = startSlot * SLOT_HEIGHT_PX + 2;

  const colors = ACTIVITY_COLORS[booking.activityType] || ACTIVITY_COLORS["Personal Training"];
  const isSmall = height < 80;

  // Timer logic
  let elapsed = 0;
  if (booking.started_at) {
    elapsed = currentTime - new Date(booking.started_at).getTime();
    if (booking.status === "paused" && booking.paused_at) {
      elapsed = new Date(booking.paused_at).getTime() - new Date(booking.started_at).getTime();
    }
    if (elapsed < 0) elapsed = 0;
  }
  const formatElapsed = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return [h, m, s].map(v => String(v).padStart(2,"0")).join(":");
  };

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -2, zIndex: 30 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "absolute",
        top, left: 2, right: 2, height,
        borderRadius: 10,
        background: colors.bg,
        border: `1px solid ${hovered ? colors.border : "rgba(255,255,255,0.08)"}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: hovered
          ? `0 4px 24px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        cursor: "pointer",
        zIndex: hovered ? 20 : 10,
        overflow: "hidden",
        padding: isSmall ? "4px 8px" : "8px 10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      aria-label={`${booking.clientName} - ${booking.activityType} at ${formatDisplayTime(booking.startTime)}`}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: colors.text, borderRadius: "10px 0 0 10px",
        boxShadow: `0 0 8px ${colors.text}`,
      }} />

      <div style={{ paddingLeft: 6 }}>
        {/* Status badge + name */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: isSmall ? 0 : 3 }}>
          <span style={{
            fontSize: isSmall ? 10 : 11,
            fontWeight: 700, color: "#fff",
            fontFamily: "Inter,sans-serif",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: "70%",
          }}>
            {booking.clientName}
          </span>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <StatusDot status={booking.status} />
            {hovered && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(booking); }}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, padding: "2px 4px", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <Edit2 size={9} color="#fff" />
              </button>
            )}
          </div>
        </div>

        {!isSmall && (
          <>
            <div style={{ fontSize: 9, color: colors.text, fontFamily: "ui-monospace,monospace", marginBottom: 3, fontWeight: 600 }}>
              {formatDisplayTime(booking.startTime)} – {formatDisplayTime(booking.endTime)}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 9, fontWeight: 600, color: colors.text,
              background: `${colors.text}18`, borderRadius: 4,
              padding: "1px 5px", letterSpacing: "0.03em",
            }}>
              {booking.activityType}
            </div>
          </>
        )}
      </div>

      {!isSmall && (
        <div>
          {/* Timer if in_progress */}
          {booking.status === "in_progress" && booking.started_at && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
              background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "2px 6px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7CFC00", animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", color: "#7CFC00", fontWeight: 700 }}>
                {formatElapsed(elapsed)}
              </span>
              {hovered && booking.isReal && (
                <>
                  <button onClick={e => { e.stopPropagation(); onStatusChange(booking.id, "pause"); }}
                    style={{ marginLeft: "auto", background: "rgba(245,158,11,0.2)", border: "none", borderRadius: 4, padding: "2px 5px", cursor: "pointer", color: "#F59E0B", fontSize: 9, fontWeight: 700 }}>
                    ⏸
                  </button>
                  <button onClick={e => { e.stopPropagation(); onStatusChange(booking.id, "end"); }}
                    style={{ background: "rgba(239,68,68,0.2)", border: "none", borderRadius: 4, padding: "2px 5px", cursor: "pointer", color: "#EF4444", fontSize: 9, fontWeight: 700 }}>
                    ■
                  </button>
                </>
              )}
            </div>
          )}
          {booking.status === "paused" && hovered && booking.isReal && (
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <button onClick={e => { e.stopPropagation(); onStatusChange(booking.id, "start"); }}
                style={{ flex: 1, background: "rgba(124,252,0,0.2)", border: "none", borderRadius: 6, padding: "4px", cursor: "pointer", color: "#7CFC00", fontSize: 9, fontWeight: 700 }}>
                ▶ {texts.resume}
              </button>
              <button onClick={e => { e.stopPropagation(); onStatusChange(booking.id, "end"); }}
                style={{ flex: 1, background: "rgba(239,68,68,0.2)", border: "none", borderRadius: 6, padding: "4px", cursor: "pointer", color: "#EF4444", fontSize: 9, fontWeight: 700 }}>
                ■ {texts.end}
              </button>
            </div>
          )}
          {booking.status === "scheduled" && hovered && booking.isReal && (
            <button onClick={e => { e.stopPropagation(); onStatusChange(booking.id, "start"); }}
              style={{ width: "100%", background: "rgba(124,252,0,0.15)", border: "1px solid rgba(124,252,0,0.3)", borderRadius: 6, padding: "3px 0", cursor: "pointer", color: "#7CFC00", fontSize: 9, fontWeight: 700, marginBottom: 4 }}>
              ▶ {texts.start}
            </button>
          )}

          {/* Avatars */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {booking.participants.slice(0, 4).map((p, i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: "50%",
                background: p.color, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#000",
                marginLeft: i > 0 ? -4 : 0,
                border: "1px solid rgba(0,0,0,0.4)",
              }}>
                {p.initials.charAt(0)}
              </div>
            ))}
            {booking.participants.length > 4 && (
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#fff", marginLeft: -4, border: "1px solid rgba(0,0,0,0.4)" }}>
                +{booking.participants.length - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: "#8B8B8B",
    in_progress: "#7CFC00",
    paused: "#F59E0B",
    completed: "#10B981",
  };
  return (
    <div style={{
      width: 6, height: 6, borderRadius: "50%",
      background: colors[status] || "#8B8B8B",
      boxShadow: status === "in_progress" ? `0 0 6px ${colors.in_progress}` : "none",
      flexShrink: 0,
    }} />
  );
}

function CurrentTimeLine({ startHour }: { startHour: number }) {
  const now = new Date();
  const minutesSinceStart = (now.getHours() - startHour) * 60 + now.getMinutes();
  if (minutesSinceStart < 0 || minutesSinceStart > (GRID_END_HOUR - GRID_START_HOUR) * 60) return null;
  const top = (minutesSinceStart / 30) * SLOT_HEIGHT_PX;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top,
      height: 2, background: "#EF4444", zIndex: 50,
      boxShadow: "0 0 8px rgba(239,68,68,0.6)",
    }}>
      <div style={{
        position: "absolute", left: -4, top: -4,
        width: 10, height: 10, borderRadius: "50%",
        background: "#EF4444", boxShadow: "0 0 6px rgba(239,68,68,0.8)",
      }} />
    </div>
  );
}

// ─── Mobile Components ───────────────────────────────────────────────────────

function MobileResourceCard({
  resource,
  count,
  isExpanded,
  onToggle,
  bookings,
  onEdit,
  onStatusChange,
  currentTime,
  texts,
}: {
  resource: Resource;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  bookings: Booking[];
  onEdit: (b: Booking) => void;
  onStatusChange: (id: number | string, action: "start" | "pause" | "end") => void;
  currentTime: number;
  texts: {
    resourceName: (name: string) => string;
    sessions: (count: number) => string;
    noSessionsScheduled: string;
    statusLabel: (status: string) => string;
    start: string;
    pause: string;
    end: string;
  };
}) {
  const Icon = resource.icon;
  const activityStyle = ACTIVITY_COLORS[resource.name] || ACTIVITY_COLORS["Personal Training"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--color-card, #16161A)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: resource.color }}
          >
            <Icon size={18} color={resource.glowColor} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">{texts.resourceName(resource.name)}</p>
            <p className="text-xs" style={{ color: count > 0 ? resource.glowColor : "#5A5A5A" }}>
              {texts.sessions(count)}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className="transition-transform"
          style={{ color: "#8B8B8B", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {bookings.length === 0 ? (
                <p className="text-xs text-center py-3" style={{ color: "#5A5A5A" }}>
                  {texts.noSessionsScheduled}
                </p>
              ) : (
                bookings.map((booking) => (
                  <MobileSessionCard
                    key={booking.id}
                    booking={booking}
                    activityStyle={activityStyle}
                    onEdit={onEdit}
                    onStatusChange={onStatusChange}
                    currentTime={currentTime}
                    texts={texts}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MobileSessionCard({
  booking,
  activityStyle,
  onEdit,
  onStatusChange,
  currentTime,
  texts,
}: {
  booking: Booking;
  activityStyle: { bg: string; border: string; glow: string; text: string };
  onEdit: (b: Booking) => void;
  onStatusChange: (id: number | string, action: "start" | "pause" | "end") => void;
  currentTime: number;
  texts: {
    statusLabel: (status: string) => string;
    start: string;
    pause: string;
    end: string;
  };
}) {
  const canStart = booking.status === "scheduled";
  const canPause = booking.status === "in_progress";
  const canEnd = booking.status === "in_progress" || booking.status === "paused";

  const statusColors: Record<string, string> = {
    scheduled: "#8B8B8B",
    in_progress: "#7CFC00",
    paused: "#F59E0B",
    completed: "#10B981",
  };

  return (
    <motion.div
      layout
      className="rounded-xl p-3 cursor-pointer"
      style={{
        background: activityStyle.bg,
        border: `1px solid ${activityStyle.border}`,
      }}
      onClick={() => onEdit(booking)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{booking.clientName}</p>
          <p className="text-xs" style={{ color: activityStyle.text }}>
            {formatDisplayTime(booking.startTime)} · {booking.durationMinutes}min
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: statusColors[booking.status],
              boxShadow: booking.status === "in_progress" ? `0 0 6px ${statusColors.in_progress}` : "none",
            }}
          />
          <span className="text-[10px]" style={{ color: statusColors[booking.status] }}>
            {texts.statusLabel(booking.status)}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mt-3">
        {canStart && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(booking.id, "start");
            }}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
            style={{ background: "rgba(124,252,0,0.2)", color: "#7CFC00" }}
          >
            <Play size={12} /> {texts.start}
          </button>
        )}
        {canPause && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(booking.id, "pause");
            }}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
            style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B" }}
          >
            <Pause size={12} /> {texts.pause}
          </button>
        )}
        {canEnd && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(booking.id, "end");
            }}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
            style={{ background: "rgba(16,185,129,0.2)", color: "#10B981" }}
          >
            <Square size={12} /> {texts.end}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function MobileStatsPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-xs font-semibold text-white">{value}</span>
      <span className="text-[10px]" style={{ color: "#5A5A5A" }}>{label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoachSchedule() {
  const { language, isRTL, formatNumber } = useCoachLanguage();
  const isArabic = language === "ar";
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Mobile
  const isMobile = useIsMobile();
  const swipeRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyColumnsRef = useRef<HTMLDivElement>(null);

  // Modals
  const [createModal, setCreateModal] = useState<{ open: boolean; slot?: number; resourceId?: string }>({ open: false });
  const [editModal, setEditModal] = useState<{ open: boolean; booking?: Booking }>({ open: false });

  // Create form
  const [formClient, setFormClient] = useState("");
  const [formActivity, setFormActivity] = useState("Personal Training");
  const [formResource, setFormResource] = useState("personal");
  const [formStart, setFormStart] = useState("09:00");
  const [formDuration, setFormDuration] = useState("60");

  // API
  const { data: allSessions } = useListSessions();
  const { data: membersPage } = useListMembers(1, undefined, undefined, undefined, { pageSize: "all" });
  const membersList = membersPage?.members || [];
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const { overrides, setOverride } = useSessions();

  // Tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Derive bookings from real sessions
  const dateISO = dateToISO(selectedDate);

  const rawSessions = (allSessions || []).filter((s: any) => {
    const d = new Date(s.scheduled_at);
    return dateToISO(d) === dateISO;
  }).map((s: any) => ({ ...s, ...(overrides[s.id] || {}) }));

  const realBookings: Booking[] = rawSessions.map((s: any) => {
    const start = new Date(s.scheduled_at);
    const startH = String(start.getHours()).padStart(2,"0");
    const startM = String(start.getMinutes()).padStart(2,"0");
    const startTime = `${startH}:${startM}`;
    const dur = s.duration_minutes || 60;
    const endMin = start.getHours() * 60 + start.getMinutes() + dur;
    const endH = String(Math.floor(endMin / 60)).padStart(2,"0");
    const endMm = String(endMin % 60).padStart(2,"0");
    const endTime = `${endH}:${endMm}`;
    const resourceId = SESSION_TYPE_TO_RESOURCE[s.session_type] || "personal";
    const color = AVATAR_COLORS[(s.id || 0) % AVATAR_COLORS.length];
    return {
      id: s.id,
      clientName: s.member_name || (isArabic ? "عميل زائر" : "Guest Client"),
      startTime,
      endTime,
      resourceId,
      activityType: s.session_type || "Personal Training",
      status: s.status || "scheduled",
      participants: [{ initials: getInitials(s.member_name || "GC"), color }],
      memberId: s.member_id,
      durationMinutes: dur,
      scheduledAt: s.scheduled_at,
      isReal: true,
      started_at: s.started_at,
      paused_at: s.paused_at,
      ended_at: s.ended_at,
    };
  });

  // Apply filters
  const allBookings = realBookings.filter(b => {
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (filterActivity !== "all" && b.activityType !== filterActivity) return false;
    if (searchQuery && !b.clientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group bookings by resource
  const bookingsByResource: Record<string, Booking[]> = {};
  RESOURCES.forEach(r => bookingsByResource[r.id] = []);
  allBookings.forEach(b => {
    if (bookingsByResource[b.resourceId]) bookingsByResource[b.resourceId].push(b);
    else bookingsByResource["personal"].push(b);
  });

  // Time slots
  const timeSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
  const totalGridHeight = TOTAL_SLOTS * SLOT_HEIGHT_PX;
  const resourceColumnWidth = isMobile ? 148 : 180;
  const timeColumnWidth = isMobile ? 58 : 72;

  // Handlers
  const handleNavigateDate = (dir: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  // Swipe handlers for mobile
  const handleSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      handleNavigateDate(-1); // Swipe right = previous day
    } else if (info.offset.x < -threshold) {
      handleNavigateDate(1); // Swipe left = next day
    }
  };

  useEffect(() => {
    const bodyColumns = bodyColumnsRef.current;
    const headerColumns = headerScrollRef.current;
    if (!bodyColumns || !headerColumns) return;

    const syncHeader = () => {
      headerColumns.scrollLeft = bodyColumns.scrollLeft;
    };

    bodyColumns.addEventListener("scroll", syncHeader);
    return () => bodyColumns.removeEventListener("scroll", syncHeader);
  }, [isMobile]);

  const handleOpenCreate = (slot?: number, resourceId?: string) => {
    const defaultStart = slot !== undefined ? slotToTime(slot) : "09:00";
    const defaultResource = resourceId || "personal";
    const res = RESOURCES.find(r => r.id === defaultResource);
    setFormStart(defaultStart);
    setFormResource(defaultResource);
    setFormActivity(res?.name || "Personal Training");
    setFormClient("");
    setFormDuration("60");
    setCreateModal({ open: true, slot, resourceId });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledAt = new Date(`${dateISO}T${formStart}:00`).toISOString();
    createMutation.mutate({
      memberId: membersList.find(m => m.name === formClient)?.id,
      sessionType: formActivity,
      scheduledAt,
      durationMinutes: parseInt(formDuration),
    }, {
      onSuccess: () => setCreateModal({ open: false }),
    });
  };

  const handleTimerAction = (sessionId: number | string, action: "start" | "pause" | "end") => {
    const now = new Date().toISOString();
    const existing = overrides[sessionId as number] || rawSessions.find((s: any) => s.id === sessionId);
    const updated: any = { ...existing, id: sessionId };
    if (action === "start") {
      updated.status = "in_progress";
      if (!updated.started_at) updated.started_at = now;
      else if (updated.paused_at) {
        const pause = new Date(now).getTime() - new Date(updated.paused_at).getTime();
        updated.started_at = new Date(new Date(updated.started_at).getTime() + pause).toISOString();
        updated.paused_at = null;
      }
    } else if (action === "pause") {
      updated.status = "paused";
      updated.paused_at = now;
    } else {
      updated.status = "completed";
      updated.ended_at = now;
    }
    setOverride(sessionId as number, updated);
    try {
      updateMutation.mutate({ id: sessionId as number, status: action === "end" ? "completed" : action === "pause" ? "scheduled" : "in_progress" });
    } catch {}
  };

  const cardStyle = {
    background: "var(--color-card, #16161A)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
  } as React.CSSProperties;

  const glassPanel = {
    background: "rgba(22,22,26,0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties;

  const resourceName = (name: string) => {
    const names: Record<string, string> = {
      "Personal Training": "تدريب شخصي",
      "Group Class": "حصة جماعية",
      "HIIT": "هيت",
      "Yoga & Recovery": "يوجا واستشفاء",
      "Cardio Zone": "منطقة الكارديو",
      "VIP Coaching": "تدريب كبار العملاء",
    };
    return isArabic ? (names[name] ?? name) : name;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      all: isArabic ? "كل الحالات" : "All Statuses",
      scheduled: isArabic ? "مجدولة" : "Scheduled",
      in_progress: isArabic ? "قيد التنفيذ" : "In Progress",
      paused: isArabic ? "متوقفة" : "Paused",
      completed: isArabic ? "مكتملة" : "Completed",
    };
    return labels[status] ?? status;
  };

  const activityLabel = (activity: string) => {
    if (activity === "all") return isArabic ? "كل الأنشطة" : "All Activities";
    return resourceName(activity);
  };

  const sessionsLabel = (count: number) =>
    isArabic ? `${formatNumber(count)} جلسة` : `${count} session${count !== 1 ? "s" : ""}`;

  const scheduleDate = (date: Date) =>
    date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const ui = {
    title: isArabic ? "الجدول" : "Schedule",
    searchClient: isArabic ? "ابحث عن عميل..." : "Search client…",
    filters: isArabic ? "التصفية" : "Filters",
    status: isArabic ? "الحالة" : "Status",
    activity: isArabic ? "النشاط" : "Activity",
    day: isArabic ? "يوم" : "Day",
    week: isArabic ? "أسبوع" : "Week",
    help: isArabic ? "مساعدة" : "Help",
    newSession: isArabic ? "جلسة جديدة" : "New Session",
    todayPrefix: isArabic ? "اليوم، " : "Today, ",
    today: isArabic ? "اليوم" : "Today",
    jumpToToday: isArabic ? "الرجوع لليوم" : "Jump to Today",
    addNew: isArabic ? "جديد" : "New",
    noSessionsScheduled: isArabic ? "لا توجد جلسات مجدولة" : "No sessions scheduled",
    guestClient: isArabic ? "عميل زائر" : "Guest Client",
    client: isArabic ? "العميل" : "Client",
    activitySessionType: isArabic ? "النشاط / نوع الجلسة" : "Activity / Session Type",
    startTime: isArabic ? "وقت البداية" : "Start Time",
    durationMin: isArabic ? "المدة (دقيقة)" : "Duration (min)",
    cancel: isArabic ? "إلغاء" : "Cancel",
    scheduling: isArabic ? "جارٍ الجدولة..." : "Scheduling…",
    scheduleSession: isArabic ? "جدولة الجلسة" : "Schedule Session",
    start: isArabic ? "ابدأ" : "Start",
    pause: isArabic ? "إيقاف" : "Pause",
    resume: isArabic ? "استئناف" : "Resume",
    end: isArabic ? "إنهاء" : "End",
    startSession: isArabic ? "ابدأ الجلسة" : "Start Session",
    endSession: isArabic ? "إنهاء الجلسة" : "End Session",
    sessionCompleted: isArabic ? "تمت الجلسة" : "Session Completed",
    duration: isArabic ? "المدة" : "Duration",
  };

  return (
    <CoachLayout>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div
        className={isRTL ? "text-right" : "text-left"}
        style={{ fontFamily: "Inter, sans-serif", minHeight: "calc(100vh - 40px)" }}
      >

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            {ui.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Search toggle */}
            <AnimatePresence>
              {showSearch && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  id="schedule-search"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={ui.searchClient}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 13, outline: "none",
                    fontFamily: "Inter,sans-serif",
                  }}
                />
              )}
            </AnimatePresence>

            <button
              id="schedule-search-btn"
              onClick={() => setShowSearch(v => !v)}
              style={{ ...glassPanel, width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Search size={16} color={showSearch ? "#7CFC00" : "#8B8B8B"} />
            </button>

            {/* Filter - hide label on mobile */}
            <div style={{ position: "relative" }}>
              <button
                id="schedule-filter-btn"
                onClick={() => setShowFilterMenu(v => !v)}
                className="hidden sm:flex"
                style={{ ...glassPanel, height: 38, borderRadius: 10, alignItems: "center", gap: 6, padding: "0 12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", color: showFilterMenu ? "#7CFC00" : "#8B8B8B", fontSize: 12, fontWeight: 600 }}
              >
                <Filter size={14} /> {ui.filters} <ChevronDown size={12} />
              </button>
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className="flex sm:hidden"
                style={{ ...glassPanel, width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", color: showFilterMenu ? "#7CFC00" : "#8B8B8B" }}
              >
                <Filter size={16} />
              </button>
              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: "absolute", right: 0, top: 44, zIndex: 100, minWidth: 220,
                      ...glassPanel, borderRadius: 14, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{ui.status}</p>
                    {["all","scheduled","in_progress","paused","completed"].map(s => (
                      <button key={s}
                        onClick={() => { setFilterStatus(s); setShowFilterMenu(false); }}
                        style={{ width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: filterStatus === s ? 700 : 400, background: filterStatus === s ? "rgba(124,252,0,0.12)" : "transparent", color: filterStatus === s ? "#7CFC00" : "#ccc", marginBottom: 2 }}>
                        {statusLabel(s)}
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8, marginBottom: 8 }} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{ui.activity}</p>
                    {["all", ...Object.keys(ACTIVITY_COLORS)].map(a => (
                      <button key={a}
                        onClick={() => { setFilterActivity(a); setShowFilterMenu(false); }}
                        style={{ width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: filterActivity === a ? 700 : 400, background: filterActivity === a ? "rgba(124,252,0,0.12)" : "transparent", color: filterActivity === a ? "#7CFC00" : "#ccc", marginBottom: 2 }}>
                        {activityLabel(a)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View toggle - desktop only */}
            <div className="hidden sm:flex" style={{ padding: 3, gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["day","week"] as const).map(v => (
                <button key={v}
                  onClick={() => setViewMode(v)}
                  style={{ padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "capitalize", letterSpacing: "0.04em", transition: "all 0.2s", background: viewMode === v ? "#7CFC00" : "transparent", color: viewMode === v ? "#000" : "#8B8B8B" }}>
                  {v === "day" ? ui.day : ui.week}
                </button>
              ))}
            </div>

            {/* Help button - desktop only */}
            <button
              id="schedule-help-btn"
              title={ui.help}
              className="hidden sm:flex"
              style={{ ...glassPanel, width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <HelpCircle size={16} color="#8B8B8B" />
            </button>

            {/* New Session - icon only on mobile */}
            <button
              id="schedule-new-btn"
              onClick={() => handleOpenCreate()}
              className="hidden sm:flex"
              style={{ height: 38, padding: "0 16px", borderRadius: 10, border: "none", cursor: "pointer", background: "#7CFC00", color: "#000", fontSize: 12, fontWeight: 800, alignItems: "center", gap: 6, boxShadow: "0 0 16px rgba(124,252,0,0.35)" }}
            >
              <Plus size={15} /> {ui.newSession}
            </button>
            <button
              onClick={() => handleOpenCreate()}
              className="flex sm:hidden"
              style={{ ...glassPanel, width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid #7CFC00", background: "rgba(124,252,0,0.1)" }}
            >
              <Plus size={18} color="#7CFC00" />
            </button>
          </div>
        </div>

        {/* ── DATE NAV ── */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4">
          <button
            id="schedule-prev-day"
            onClick={() => handleNavigateDate(-1)}
            style={{ width: 34, height: 34, borderRadius: "50%", ...glassPanel, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronLeft size={16} color="#fff" />
          </button>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>
              {dateToISO(selectedDate) === dateToISO(today) ? ui.todayPrefix : ""}{scheduleDate(selectedDate)}
            </div>
            <div style={{ fontSize: 10, color: "#5A5A5A", marginTop: 1 }}>
              {sessionsLabel(allBookings.length)}
            </div>
          </div>

          <button
            id="schedule-next-day"
            onClick={() => handleNavigateDate(1)}
            style={{ width: 34, height: 34, borderRadius: "50%", ...glassPanel, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronRight size={16} color="#fff" />
          </button>

          <button
            onClick={() => setSelectedDate(today)}
            className="hidden sm:block"
            style={{ height: 28, padding: "0 12px", borderRadius: 8, background: dateToISO(selectedDate) === dateToISO(today) ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${dateToISO(selectedDate) === dateToISO(today) ? "rgba(124,252,0,0.3)" : "rgba(255,255,255,0.06)"}`, color: dateToISO(selectedDate) === dateToISO(today) ? "#7CFC00" : "#8B8B8B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {ui.today}
          </button>
        </div>

        {/* Mobile Today button */}
        <div className="flex sm:hidden justify-center mb-4">
          <button
            onClick={() => setSelectedDate(today)}
            style={{ height: 32, padding: "0 16px", borderRadius: 8, background: dateToISO(selectedDate) === dateToISO(today) ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${dateToISO(selectedDate) === dateToISO(today) ? "rgba(124,252,0,0.3)" : "rgba(255,255,255,0.06)"}`, color: dateToISO(selectedDate) === dateToISO(today) ? "#7CFC00" : "#8B8B8B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {dateToISO(selectedDate) === dateToISO(today) ? ui.today : ui.jumpToToday}
          </button>
        </div>

        {/* ── STATS ROW ── */}
        {isMobile ? (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {[
              { label: statusLabel("scheduled"), value: realBookings.filter(b => b.status === "scheduled").length, color: "#8B8B8B" },
              { label: statusLabel("in_progress"), value: realBookings.filter(b => b.status === "in_progress").length, color: "#7CFC00" },
              { label: statusLabel("paused"), value: realBookings.filter(b => b.status === "paused").length, color: "#F59E0B" },
              { label: statusLabel("completed"), value: realBookings.filter(b => b.status === "completed").length, color: "#10B981" },
            ].map(stat => (
              <MobileStatsPill key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: statusLabel("scheduled"), value: realBookings.filter(b => b.status === "scheduled").length, color: "#8B8B8B" },
              { label: statusLabel("in_progress"), value: realBookings.filter(b => b.status === "in_progress").length, color: "#7CFC00" },
              { label: statusLabel("paused"), value: realBookings.filter(b => b.status === "paused").length, color: "#F59E0B" },
              { label: statusLabel("completed"), value: realBookings.filter(b => b.status === "completed").length, color: "#10B981" },
            ].map(stat => (
              <div key={stat.label} style={{ ...cardStyle, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 120 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: stat.color, boxShadow: `0 0 6px ${stat.color}` }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: "#5A5A5A", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SCHEDULE GRID ── */}
        <div style={{ ...cardStyle, overflow: "hidden", position: "relative" }}>
          {/* Header: resource columns */}
          <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 40, ...glassPanel, borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: 0 }}>
            {/* Time label column */}
            <div style={{ width: timeColumnWidth, flexShrink: 0, padding: "12px 0", borderRight: "1px solid rgba(255,255,255,0.04)" }} />

            {/* Resource headers */}
            <div ref={headerScrollRef} style={{ flex: 1, overflowX: "auto", display: "flex" }} id="resource-header-scroll">
              {RESOURCES.map(res => {
                const Icon = res.icon;
                const count = bookingsByResource[res.id]?.length || 0;
                return (
                  <div key={res.id} style={{
                    flex: `0 0 ${resourceColumnWidth}px`, minWidth: resourceColumnWidth,
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    borderRight: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: res.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} color={res.glowColor} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {resourceName(res.name)}
                      </div>
                      <div style={{ fontSize: isMobile ? 8 : 9, color: count > 0 ? res.glowColor : "#5A5A5A", fontWeight: 600 }}>
                        {sessionsLabel(count)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Grid */}
          <>
          {/* Grid body */}
          <motion.div
            ref={swipeRef}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={isMobile ? handleSwipe : undefined}
            style={{ display: "flex", overflowY: "auto", maxHeight: isMobile ? "66vh" : "60vh" }}
          >
            {/* Time labels column */}
            <div style={{ width: timeColumnWidth, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.04)", position: "sticky", left: 0, background: "#16161A", zIndex: 20 }}>
              {timeSlots.map(slot => <TimeLabel key={slot} slot={slot} />)}
            </div>

            {/* Resource columns */}
            <div ref={bodyColumnsRef} style={{ flex: 1, display: "flex", overflowX: "auto" }}>
              {RESOURCES.map((res, resIdx) => (
                <div key={res.id} style={{
                  flex: `0 0 ${resourceColumnWidth}px`, minWidth: resourceColumnWidth,
                  borderRight: resIdx < RESOURCES.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  position: "relative",
                  height: totalGridHeight,
                }}>
                  {/* Subtle column tint */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `linear-gradient(to bottom, ${res.color.replace("0.15","0.04")}, transparent)`,
                    pointerEvents: "none",
                  }} />

                  {/* Empty slot rows */}
                  {timeSlots.map(slot => (
                    <EmptySlot key={slot} slot={slot} resourceId={res.id} onClickCreate={handleOpenCreate} addLabel={ui.addNew} />
                  ))}

                  {/* Current time line */}
                  <CurrentTimeLine startHour={GRID_START_HOUR} />

                  {/* Booking cards */}
                  {(bookingsByResource[res.id] || []).map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onEdit={b => setEditModal({ open: true, booking: b })}
                      onStatusChange={handleTimerAction}
                      currentTime={currentTime}
                      texts={{
                        start: ui.start,
                        resume: ui.resume,
                        end: ui.end,
                        pause: ui.pause,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
          </>
        </div>

        {/* ── CREATE MODAL ── */}
        <AnimatePresence>
          {createModal.open && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
                onClick={() => setCreateModal({ open: false })}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 24 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{ position: "relative", width: "100%", maxWidth: 440, ...glassPanel, borderRadius: 20, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{ui.newSession}</h2>
                    <p style={{ fontSize: 12, color: "#5A5A5A", margin: "4px 0 0" }}>{scheduleDate(selectedDate)}</p>
                  </div>
                  <button onClick={() => setCreateModal({ open: false })} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={15} color="#fff" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <FormField label={ui.client}>
                    <select
                      className="coach-schedule-select"
                      value={formClient}
                      onChange={e => setFormClient(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">{ui.guestClient}</option>
                      {membersList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </FormField>

                  <FormField label={ui.activitySessionType}>
                    <select className="coach-schedule-select" value={formActivity} onChange={e => {
                      setFormActivity(e.target.value);
                      const rid = SESSION_TYPE_TO_RESOURCE[e.target.value] || "personal";
                      setFormResource(rid);
                    }} style={selectStyle}>
                      {Object.keys(ACTIVITY_COLORS).map(a => <option key={a} value={a}>{resourceName(a)}</option>)}
                    </select>
                  </FormField>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FormField label={ui.startTime}>
                      <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} required style={inputStyle} />
                    </FormField>
                    <FormField label={ui.durationMin}>
                      <select className="coach-schedule-select" value={formDuration} onChange={e => setFormDuration(e.target.value)} style={selectStyle}>
                        {[30,45,60,90,120].map(d => <option key={d} value={d}>{isArabic ? `${formatNumber(d)} دقيقة` : `${d} min`}</option>)}
                      </select>
                    </FormField>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <button type="button" onClick={() => setCreateModal({ open: false })}
                      style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#8B8B8B", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {ui.cancel}
                    </button>
                    <button type="submit" disabled={createMutation.isPending}
                      style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "#7CFC00", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 16px rgba(124,252,0,0.4)", opacity: createMutation.isPending ? 0.7 : 1 }}>
                      {createMutation.isPending ? ui.scheduling : ui.scheduleSession}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── EDIT MODAL ── */}
        <AnimatePresence>
          {editModal.open && editModal.booking && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
                onClick={() => setEditModal({ open: false })}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 24 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{ position: "relative", width: "100%", maxWidth: 440, ...glassPanel, borderRadius: 20, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
              >
                {(() => {
                  const b = editModal.booking!;
                  const colors = ACTIVITY_COLORS[b.activityType] || ACTIVITY_COLORS["Personal Training"];
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: colors.text, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{resourceName(b.activityType)}</div>
                          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{b.clientName}</h2>
                          <p style={{ fontSize: 12, color: "#5A5A5A", margin: "4px 0 0" }}>
                            {formatDisplayTime(b.startTime)} – {formatDisplayTime(b.endTime)}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <StatusDot status={b.status} />
                          <span style={{ fontSize: 11, color: "#8B8B8B", fontWeight: 600 }}>{statusLabel(b.status)}</span>
                          <button onClick={() => setEditModal({ open: false })} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
                            <X size={15} color="#fff" />
                          </button>
                        </div>
                      </div>

                      {/* Detail info */}
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                          { label: isArabic ? "المكان" : "Resource", value: resourceName(RESOURCES.find(r => r.id === b.resourceId)?.name || b.resourceId) },
                          { label: ui.duration, value: isArabic ? `${formatNumber(b.durationMinutes || minutesDuration(b.startTime, b.endTime))} دقيقة` : `${b.durationMinutes || minutesDuration(b.startTime, b.endTime)} min` },
                          { label: ui.start, value: formatDisplayTime(b.startTime) },
                          { label: ui.end, value: formatDisplayTime(b.endTime) },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{item.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      {b.isReal && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {b.status === "scheduled" && (
                            <button onClick={() => { handleTimerAction(b.id, "start"); setEditModal({ open: false }); }}
                              style={{ height: 44, borderRadius: 12, border: "none", background: "#7CFC00", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 0 16px rgba(124,252,0,0.35)" }}>
                              <Play size={15} fill="#000" /> {ui.startSession}
                            </button>
                          )}
                          {b.status === "in_progress" && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <button onClick={() => { handleTimerAction(b.id, "pause"); setEditModal({ open: false }); }}
                                style={{ height: 44, borderRadius: 12, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                                ⏸ {ui.pause}
                              </button>
                              <button onClick={() => { handleTimerAction(b.id, "end"); setEditModal({ open: false }); }}
                                style={{ height: 44, borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                                ■ {ui.endSession}
                              </button>
                            </div>
                          )}
                          {b.status === "paused" && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <button onClick={() => { handleTimerAction(b.id, "start"); setEditModal({ open: false }); }}
                                style={{ height: 44, borderRadius: 12, border: "none", background: "#7CFC00", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                                ▶ {ui.resume}
                              </button>
                              <button onClick={() => { handleTimerAction(b.id, "end"); setEditModal({ open: false }); }}
                                style={{ height: 44, borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                                ■ {ui.endSession}
                              </button>
                            </div>
                          )}
                          {b.status === "completed" && (
                            <div style={{ height: 44, borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                              <Check size={16} color="#10B981" />
                              <span style={{ color: "#10B981", fontSize: 13, fontWeight: 700 }}>{ui.sessionCompleted}</span>
                            </div>
                          )}
                          <button onClick={() => setEditModal({ open: false })}
                            style={{ height: 36, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#5A5A5A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            {isArabic ? "إغلاق" : "Close"}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        /* Sync horizontal scroll between header and body */
        #resource-header-scroll { overflow-x: hidden !important; }
      `}</style>
    </CoachLayout>
  );
}

// ─── Small form helpers ───────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "Inter,sans-serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 42, padding: "0 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#fff", fontSize: 13,
  outline: "none", fontFamily: "Inter,sans-serif",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  colorScheme: "dark",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%238B8B8B' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: 18,
  paddingRight: 32,
  cursor: "pointer",
};
