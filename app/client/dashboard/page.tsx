"use client";

// Suppress hydration warnings from dynamic localStorage-dependent state

import React, { useState, useEffect, useRef } from "react";
import NutritionTab from "./NutritionTab";
import WorkoutsTab from "./WorkoutsTab";
import ProgressTab from "./ProgressTab";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useListMessages, useSendMessage, useListTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/lib/api-hooks";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  CheckCircle,
  Check,
  Copy,
  Apple,
  MoreHorizontal,
  MessageCircle,
  Phone,
  Video,
  Paperclip,
  Smile,
  Mic,
  Send,
  FileText,
  Download,
  ThumbsUp,
  X,
  Bell,
  Calendar,
  Settings,
  LogOut,
  HelpCircle,
  Crown,
  Eye,
  Plus,
  ArrowLeft,
  UserCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
  Play,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────
const CLIENT_DATA = {
  id: "FIT-2024-8842",
  name: "Ziad",
  username: "@ziad_member",
  photo: null,
  status: "active",
  isPrivate: true,
  subscription: {
    daysRemaining: 23,
    totalDays: 30,
    type: "Premium",
  },
  coach: {
    id: "coach_001",
    name: "Coach Mike",
    photo: null,
    isOnline: true,
    lastActive: "2h ago",
  },
  stats: {
    finished: 18,
    finishedChange: 8,
    tracked: "31h",
    trackedChange: -6,
    efficiency: "93%",
    efficiencyChange: 12,
  },
  tasks: [
    {
      id: 1,
      type: "workout",
      title: "Leg Day - Heavy Squats",
      status: "in-progress",
      duration: "45 min",
      assignedBy: "Coach Mike",
      coachAssigned: true,
    },
    {
      id: 2,
      type: "nutrition",
      title: "Hit Your Protein Goal",
      status: "done",
      duration: "All Day",
      assignedBy: "Coach Mike",
      coachAssigned: true,
    },
    {
      id: 3,
      type: "recovery",
      title: "10-Minute Stretch Routine",
      status: "todo",
      duration: "10 min",
      assignedBy: "Coach Mike",
      coachAssigned: false,
    },
    {
      id: 4,
      type: "workout",
      title: "Upper Body — Bench Press",
      status: "todo",
      duration: "60 min",
      assignedBy: "Coach Mike",
      coachAssigned: true,
    },
  ],
  activities: [
    {
      id: 1,
      type: "message",
      actor: "Coach Mike",
      time: "10:15 AM",
      message: "Great job yesterday! Let's push harder today.",
      priority: true,
    },
    {
      id: 2,
      type: "assignment",
      actor: "Coach Mike",
      time: "09:42 AM",
      action: "Assigned new workout: Upper Body Power",
      priority: true,
    },
    {
      id: 3,
      type: "file",
      actor: "Coach Mike",
      time: "Yesterday",
      filename: "Workout-Plan-Week-3.pdf",
      filesize: "2.4 MB",
      priority: false,
    },
    {
      id: 4,
      type: "assignment",
      actor: "System",
      time: "Yesterday",
      action: "You completed 3 workouts this week",
      priority: false,
    },
  ],
};

// ─── Chart Data ────────────────────────────────────────────────────────────────
const CHART_DATA = {
  labels: ["01", "02", "03", "04", "05", "06", "07"],
  current: [3, 5, 7, 4, 6, 8, 5],
  previous: [2, 4, 6, 3, 5, 6, 4],
};

// ─── Avatar Component ─────────────────────────────────────────────────────────
function Avatar({
  name,
  size = 40,
  isCoach = false,
  ring = false,
  ringColor = "#7CFC00",
  fontSize = 14,
}: {
  name: string;
  size?: number;
  isCoach?: boolean;
  ring?: boolean;
  ringColor?: string;
  fontSize?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: isCoach
          ? "linear-gradient(135deg, #7CFC00, #4CAF50)"
          : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 700,
        color: "#FFFFFF",
        flexShrink: 0,
        border: ring ? `2px solid ${ringColor}` : undefined,
        boxShadow: ring ? `0 0 8px ${ringColor}40` : undefined,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Mini Line Chart ─────────────────────────────────────────────────────────
function PerformanceChart({ isPrivate }: { isPrivate: boolean }) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    index: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 600;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = 12;
  const yLabels = ["0h", "2h", "4h", "6h", "8h", "12h"];
  const yVals = [0, 2, 4, 6, 8, 12];

  const getX = (i: number) => PAD.left + (i / (CHART_DATA.labels.length - 1)) * chartW;
  const getY = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  const buildPath = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`).join(" ");

  return (
    <div style={{ position: "relative" }}>
      {isPrivate && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "rgba(124,252,0,0.15)",
            border: "1px solid rgba(124,252,0,0.3)",
            borderRadius: 8,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 10,
          }}
        >
          <Eye size={12} color="#7CFC00" />
          <span style={{ fontSize: 12, color: "#7CFC00" }}>Coach reviewed your progress 2h ago</span>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        onMouseMove={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const closest = CHART_DATA.labels.reduce((best, _, i) => {
            return Math.abs(getX(i) - svgX) < Math.abs(getX(best) - svgX) ? i : best;
          }, 0);
          setTooltip({ visible: true, x: getX(closest), y: getY(CHART_DATA.current[closest]), index: closest });
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Horizontal grid lines */}
        {yVals.map((v, i) => (
          <g key={v}>
            <line
              x1={PAD.left}
              y1={getY(v)}
              x2={W - PAD.right}
              y2={getY(v)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={getY(v) + 4}
              fill="#5A5A5A"
              fontSize={10}
              textAnchor="end"
            >
              {yLabels[i]}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {CHART_DATA.labels.map((label, i) => (
          <text
            key={label}
            x={getX(i)}
            y={H - 4}
            fill="#5A5A5A"
            fontSize={10}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* Previous period line (dashed, gray) */}
        <path
          d={buildPath(CHART_DATA.previous)}
          fill="none"
          stroke="#8B8B8B"
          strokeWidth={2}
          strokeDasharray="5,4"
          opacity={0.5}
        />

        {/* Current period line (lime) */}
        <path
          d={buildPath(CHART_DATA.current)}
          fill="none"
          stroke="#7CFC00"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots on current line */}
        {CHART_DATA.current.map((v, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(v)}
            r={4}
            fill="#7CFC00"
            stroke="#0D0D10"
            strokeWidth={2}
          />
        ))}

        {/* Tooltip */}
        {tooltip?.visible && (
          <g>
            <line
              x1={tooltip.x}
              y1={PAD.top}
              x2={tooltip.x}
              y2={H - PAD.bottom}
              stroke="rgba(124,252,0,0.3)"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
          </g>
        )}
      </svg>

      {/* HTML Tooltip overlay */}
      {tooltip?.visible && (() => {
        const svgEl = svgRef.current;
        if (!svgEl) return null;
        const rect = svgEl.getBoundingClientRect();
        const scaleX = rect.width / W;
        const scaleY = rect.height / H;
        const px = tooltip.x * scaleX;
        const py = tooltip.y * scaleY;
        const idx = tooltip.index;
        return (
          <div
            style={{
              position: "absolute",
              left: px + 12,
              top: py - 30,
              background: "#1A1A1F",
              border: "1px solid rgba(124,252,0,0.3)",
              borderRadius: 10,
              padding: "10px 14px",
              pointerEvents: "none",
              zIndex: 20,
              minWidth: 140,
            }}
          >
            <div style={{ fontSize: 12, color: "#8B8B8B", marginBottom: 6 }}>
              0{idx + 1} May 2023
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7CFC00" }} />
              <span style={{ fontSize: 14, color: "#7CFC00" }}>This month: {CHART_DATA.current[idx]}h</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B8B8B" }} />
              <span style={{ fontSize: 14, color: "#8B8B8B" }}>Last month: {CHART_DATA.previous[idx]}h</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Use Count Up Hook ──────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// ─── Task Item ───────────────────────────────────────────────────────────────
function TaskItem({ task, isPrivate, delay, onEdit, onDelete }: { task: any; isPrivate: boolean; delay: number; onEdit?: () => void; onDelete?: () => void; }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const typeColors: Record<string, { bg: string; iconColor: string }> = {
    workout: { bg: "#7CFC00", iconColor: "#000000" },
    nutrition: { bg: "#10B981", iconColor: "#FFFFFF" },
    recovery: { bg: "#8B5CF6", iconColor: "#FFFFFF" },
  };

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    todo: { bg: "rgba(255,255,255,0.1)", color: "#8B8B8B", label: "To Do" },
    "in-progress": { bg: "rgba(139,92,246,0.2)", color: "#8B5CF6", label: "In Progress" },
    done: { bg: "rgba(16,185,129,0.2)", color: "#10B981", label: "Done" },
  };

  const typeIcon: Record<string, React.ReactNode> = {
    workout: <Dumbbell size={20} color={typeColors[task.type].iconColor} />,
    nutrition: <Apple size={20} color={typeColors[task.type].iconColor} />,
    recovery: <Zap size={20} color={typeColors[task.type].iconColor} />,
  };

  const tc = typeColors[task.type];
  const sc = statusConfig[task.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 + 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "#16161A",
        border: `1px solid ${task.coachAssigned && isPrivate ? "rgba(124,252,0,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
        cursor: "pointer",
        transition: "all 0.2s ease",
        borderLeft: task.coachAssigned && isPrivate ? "3px solid #7CFC00" : task.coachAssigned ? "3px solid rgba(124,252,0,0.4)" : "1px solid rgba(255,255,255,0.06)",
        transform: hovered ? "translateX(4px)" : "translateX(0px)",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
      }}
    >
      {/* Coach assigned tag */}
      {task.coachAssigned && isPrivate && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 48,
            fontSize: 10,
            color: "#7CFC00",
            background: "rgba(124,252,0,0.1)",
            border: "1px solid rgba(124,252,0,0.2)",
            borderRadius: 6,
            padding: "2px 6px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Crown size={8} color="#7CFC00" />
          Coach Assigned
        </div>
      )}

      {/* Type icon circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: tc.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {typeIcon[task.type]}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>
          {task.title}
        </div>
        {isPrivate && (
          <div style={{ fontSize: 12, color: "#8B8B8B" }}>
            Assigned by {task.assignedBy}
          </div>
        )}
      </div>

      {/* Duration */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8B8B" }}>
        <Clock size={13} />
        <span style={{ fontSize: 13 }}>{task.duration}</span>
      </div>

      {/* Status badge */}
      <div
        style={{
          background: sc.bg,
          color: sc.color,
          borderRadius: 20,
          padding: "5px 12px",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        {task.status === "in-progress" && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B5CF6" }}
          />
        )}
        {task.status === "done" && <Check size={11} />}
        {sc.label}
      </div>

      {/* Three-dot menu */}
      <div style={{ position: "relative" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8B8B8B",
          }}
        >
          <MoreHorizontal size={16} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                right: 0,
                top: 32,
                background: "#1A1A1F",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                overflow: "hidden",
                zIndex: 100,
                minWidth: 130,
              }}
            >
              {["Edit", "Skip", "Delete"].map((action) => (
                <button
                  key={action}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    color: action === "Delete" ? "#EF4444" : "#FFFFFF",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  onClick={() => {
                    setMenuOpen(false);
                    if (action === "Edit" && onEdit) onEdit();
                    if (action === "Delete" && onDelete) onDelete();
                  }}
                >
                  {action}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────
function ActivityItem({ activity, isPrivate }: { activity: typeof CLIENT_DATA.activities[0]; isPrivate: boolean }) {
  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={activity.actor} size={36} isCoach={activity.actor !== "System"} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>{activity.actor}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isPrivate && activity.priority && (
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CFC00" }} />
              )}
              <span style={{ fontSize: 12, color: "#5A5A5A" }}>{activity.time}</span>
            </div>
          </div>

          {activity.type === "message" && (
            <div>
              <div
                style={{
                  background: "rgba(124,252,0,0.1)",
                  border: "1px solid rgba(124,252,0,0.2)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#FFFFFF",
                  lineHeight: 1.5,
                }}
              >
                {activity.message}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#5A5A5A",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <ThumbsUp size={14} />
                </button>
              </div>
            </div>
          )}

          {activity.type === "assignment" && (
            <div style={{ fontSize: 13, color: "#8B8B8B" }}>{activity.action}</div>
          )}

          {activity.type === "file" && (
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FileText size={22} color="#8B5CF6" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#FFFFFF" }}>{activity.filename}</div>
                <div style={{ fontSize: 11, color: "#5A5A5A" }}>{activity.filesize}</div>
              </div>
              <button
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px",
                  cursor: "pointer",
                  color: "#8B8B8B",
                  display: "flex",
                }}
              >
                <Download size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Daily Score Component ────────────────────────────────────────────────────
function DailyScore({ score }: { score: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Daily Score</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
            {score}<span style={{ fontSize: 16, color: "#8B8B8B", fontWeight: 400 }}>/100</span>
          </div>
        </div>
        <div style={{ fontSize: 28 }}>{score >= 80 ? "🔥" : score >= 50 ? "💪" : "📈"}</div>
      </div>
      <div className="daily-score-track">
        <motion.div
          className="daily-score-fill"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
      <div style={{ fontSize: 12, color: "#8B8B8B", marginTop: 8 }}>
        {score >= 80 ? "Crushing it today! Keep going 🚀" : score >= 50 ? "Good progress — finish strong 💪" : "Let's get moving — log your first activity!"}
      </div>
    </motion.div>
  );
}

// ─── Quick Log Bottom Sheet ───────────────────────────────────────────────────
function QuickLogSheet({ onClose, onNavigate }: { onClose: () => void; onNavigate: (tab: string) => void }) {
  const options = [
    { icon: <Dumbbell size={22} color="#7CFC00" />, bg: "rgba(124,252,0,0.1)", label: "Log Workout", sub: "Mark sets done", tab: "workouts" },
    { icon: <Apple size={22} color="#10B981" />, bg: "rgba(16,185,129,0.1)", label: "Log Meal", sub: "AI nutrition tracker", tab: "nutrition" },
    { icon: <MessageCircle size={22} color="#8B5CF6" />, bg: "rgba(139,92,246,0.1)", label: "Message Coach", sub: "Open chat", tab: "chat" },
  ];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 250 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="bottom-sheet"
        style={{ zIndex: 251, paddingTop: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "12px auto 20px" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>Quick Log</div>
        {options.map(o => (
          <button
            key={o.label}
            onClick={() => { onNavigate(o.tab === "chat" ? "home" : o.tab); if (o.tab === "chat") onClose(); else onClose(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "16px 4px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "left" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: o.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {o.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{o.label}</div>
              <div style={{ fontSize: 13, color: "#8B8B8B" }}>{o.sub}</div>
            </div>
            <ChevronRight size={18} color="#5A5A5A" style={{ marginLeft: "auto" }} />
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("home");
  const [copied, setCopied] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [message, setMessage] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [taskPeriod, setTaskPeriod] = useState("Week");
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const { currentMember, logoutMember } = useAuth();
  const isPrivate = CLIENT_DATA.isPrivate;
  const memberName = currentMember?.name ?? CLIENT_DATA.name;
  const memberCode = currentMember?.membership_code ?? CLIENT_DATA.id;
  const memberType = currentMember?.membership_type ?? CLIENT_DATA.subscription.type;
  // Calculate subscription days from real expiry date
  const expiryDate = currentMember?.sub_expiry_date ? new Date(currentMember.sub_expiry_date) : null;
  const daysRemaining = expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : CLIENT_DATA.subscription.daysRemaining;
  const totalDays = 30; // Default display
  const daysLow = daysRemaining < 7;

  // Stat count-up values
  const finishedCount = useCountUp(CLIENT_DATA.stats.finished, 1100);
  const effCount = useCountUp(93, 1200);

  // Messaging hooks
  const { data: messages } = useListMessages(memberId);
  const sendMutation = useSendMessage();
  const chatInputRef = useRef<HTMLInputElement>(null);

  const { data: dbTasks } = useListTasks(memberId || undefined);

  const navItems = [
    { key: "home",      label: "Home",      icon: <LayoutDashboard size={20} /> },
    { key: "workouts",  label: "Workouts",  icon: <Dumbbell size={20} /> },
    { key: "nutrition", label: "Nutrition", icon: <Utensils size={20} /> },
    { key: "progress",  label: "Progress",  icon: <TrendingUp size={20} /> },
    { key: "coach",     label: "Coach",     icon: <UserCircle size={20} /> },
  ];
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const displayTasks = dbTasks && dbTasks.length > 0 ? dbTasks : CLIENT_DATA.tasks;

  // Auth check + mount guard + data load
  useEffect(() => {
    setMounted(true);
    // Wait for Zustand persist to hydrate before checking auth
    const t = setTimeout(() => setHydrated(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentMember) {
      router.push("/client/login");
      return;
    }
    setMemberId(currentMember.id);
    const d = new Date();
    setDateRange(`${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.getFullYear()}`);
  }, [currentMember, router, hydrated]);

  // Show loading skeleton while checking auth
  if (!mounted || !hydrated || (!currentMember && mounted && hydrated)) {
    return (
      <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[rgba(124,252,0,0.3)] border-t-[#7CFC00] rounded-full animate-spin" />
          <span className="text-sm text-[#8B8B8B]">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(memberCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutMember();
    router.push("/client/login");
  };

  const handleSendMessage = () => {
    if (!message.trim() || !memberId) return;
    
    sendMutation.mutate({ 
      memberId, 
      content: message 
    });
    setMessage("");
  };



  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    }),
  };

  return (
    <div
      className="min-h-screen bg-[#0D0D10] text-[#FFFFFF] flex flex-col overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Private Client Banner */}
      <AnimatePresence>
        {isPrivate && bannerVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "#7CFC00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <Crown size={14} color="#000000" style={{ marginRight: 8 }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#000000",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              YOU HAVE A PRIVATE COACH — PREMIUM SUPPORT ACTIVE
            </span>
            <button
              onClick={() => setBannerVisible(false)}
              style={{
                position: "absolute",
                right: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#000",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative" style={{ minWidth: 0 }}>
        {/* ─── Left Sidebar (Desktop Only) ──────────────────────────────────── */}
        <aside
          className="hidden lg:flex w-[240px] bg-[#16161A] border-r border-white/5 flex-col flex-shrink-0 sticky top-0 overflow-y-auto"
          style={{
            height: "calc(100vh - " + (isPrivate && bannerVisible ? "40px" : "0px") + ")",
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: "24px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "rgba(124,252,0,0.1)",
                border: "1px solid rgba(124,252,0,0.3)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Dumbbell size={18} color="#7CFC00" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "2px", color: "#FFFFFF" }}>
              FIT & LIFT
            </span>
          </div>

          {/* Nav */}
          <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: isActive ? "rgba(124,252,0,0.1)" : "none",
                    border: "none",
                    borderLeft: isActive ? "3px solid #7CFC00" : "3px solid transparent",
                    color: isActive ? "#7CFC00" : "#8B8B8B",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                background: "none",
                border: "none",
                color: "#8B8B8B",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                marginBottom: 4,
              }}
            >
              <HelpCircle size={18} />
              Help & Support
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                background: "none",
                border: "none",
                color: "#EF4444",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </aside>

        {/* ─── Main Content ────────────────────────────────────────────────────── */}
        <main
          className="flex-1 min-w-0 w-full overflow-y-auto pb-32 lg:pb-8 px-4 lg:px-8"
        >
          {/* Header */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            style={{
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 24,
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="text-xl lg:text-2xl font-bold text-white leading-tight">
                  Hello, {memberName} 👋
                </div>
                <div className="text-xs lg:text-sm text-gray-500 mt-1">
                  Track your progress. <span className="text-[#7CFC00] font-semibold">7 days</span> to goal.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 14, color: "#8B8B8B" }}>{dateRange}</div>
              <button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#8B8B8B",
                }}
              >
                <Calendar size={16} />
              </button>
              <button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#8B8B8B",
                  position: "relative",
                }}
              >
                <Bell size={16} />
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#7CFC00",
                    border: "1px solid #0D0D10",
                  }}
                />
              </button>
            </div>
          </motion.div>

          {/* ── Coach Presence Indicator ── */}
          {activeNav === "home" && isPrivate && (
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: "#7CFC00" }}
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#7CFC00" }}
              />
              Coach is watching your progress
            </motion.div>
          )}

          {/* ── Daily Score (mobile) ── */}
          {activeNav === "home" && (
            <div className="block lg:hidden">
              <DailyScore score={72} />
            </div>
          )}

          {/* ── Client Identity Bar ───────────────────────────────────────────── */}
          {activeNav === "home" && (
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              style={{
                background: "rgba(124,252,0,0.05)",
                border: `1px solid ${isPrivate ? "rgba(124,252,0,0.3)" : "rgba(124,252,0,0.2)"}`,
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                display: "flex",
                gap: 32,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
            {/* Member ID */}
            <div style={{ flex: "1 1 150px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#8B8B8B",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 6,
                }}
              >
                MEMBER ID
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#7CFC00",
                    fontFamily: "monospace",
                  }}
                >
                  {memberCode}
                </span>
                <button
                  onClick={handleCopy}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: copied ? "#7CFC00" : "#5A5A5A",
                    transition: "color 0.2s",
                    display: "flex",
                    padding: 0,
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Status */}
            <div style={{ flex: "1 1 150px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#8B8B8B",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 6,
                }}
              >
                STATUS
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: isPrivate ? "#7CFC00" : "rgba(16,185,129,0.2)",
                  color: isPrivate ? "#000000" : "#10B981",
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {isPrivate && <Crown size={12} />}
                {isPrivate ? "PRIVATE TRAINING" : "ACTIVE"}
              </div>
            </div>

            {/* Days Remaining */}
            <div style={{ flex: "2 1 200px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#8B8B8B",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 6,
                }}
              >
                DAYS REMAINING
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {daysLow && <AlertTriangle size={14} color="#EF4444" />}
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: daysLow ? "#EF4444" : "#FFFFFF",
                  }}
                >
                  {daysRemaining} DAYS
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(daysRemaining / totalDays) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{
                    height: "100%",
                    background: daysLow ? "#EF4444" : "#7CFC00",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            {/* Coach (private only) */}
            {isPrivate && (
              <div style={{ flex: "1 1 150px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Avatar
                    name={CLIENT_DATA.coach.name}
                    size={48}
                    isCoach
                    ring
                    ringColor="#7CFC00"
                    fontSize={16}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: CLIENT_DATA.coach.isOnline ? "#7CFC00" : "#5A5A5A",
                      border: "2px solid #16161A",
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#8B8B8B",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: 4,
                    }}
                  >
                    YOUR COACH
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>
                    {CLIENT_DATA.coach.name}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          )}

          {/* ── Stats Carousel ── */}
          {activeNav === "home" && (
            <div style={{ marginBottom: 20 }}>
              {/* Mobile: snap carousel */}
              <div className="block lg:hidden" style={{ position: "relative" }}>
                <div
                  className="snap-carousel"
                  style={{ borderRadius: 16, width: "100%" }}
                >
                  {[
                    { icon: <CheckCircle size={24} color="#7CFC00" />, iconBg: "rgba(124,252,0,0.1)", label: "Workouts Done", value: `${finishedCount}`, change: `+${CLIENT_DATA.stats.finishedChange} this week`, up: true },
                    { icon: <Clock size={24} color="#8B5CF6" />, iconBg: "rgba(139,92,246,0.1)", label: "Hours Tracked", value: CLIENT_DATA.stats.tracked, change: `-${Math.abs(CLIENT_DATA.stats.trackedChange)} hours`, up: false },
                    { icon: <Zap size={24} color="#F59E0B" />, iconBg: "rgba(245,158,11,0.1)", label: "Efficiency", value: `${effCount}%`, change: `+${CLIENT_DATA.stats.efficiencyChange}%`, up: true },
                    { icon: <Flame size={24} color="#EF4444" />, iconBg: "rgba(239,68,68,0.1)", label: "Day Streak", value: "5", change: "Keep it up!", up: true },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="snap-card"
                      style={{ width: "100%", minWidth: "100%", background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "24px 20px" }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: stat.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        {stat.icon}
                      </div>
                      <div style={{ fontSize: 13, color: "#8B8B8B", marginBottom: 6 }}>{stat.label}</div>
                      <div style={{ fontSize: 44, fontWeight: 800, color: "#FFFFFF", lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        {stat.up ? <TrendingUp size={14} color="#7CFC00" /> : <TrendingDown size={14} color="#EF4444" />}
                        <span style={{ color: stat.up ? "#7CFC00" : "#EF4444", fontWeight: 600 }}>{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Swipe hint dots */}
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ width: i === 0 ? 16 : 5, height: 5, borderRadius: 3, background: i === 0 ? "#7CFC00" : "rgba(255,255,255,0.15)", transition: "all 0.25s" }} />
                  ))}
                </div>
              </div>

              {/* Desktop: grid */}

              <div className="hidden lg:grid grid-cols-3 gap-4">
                {[
                  { icon: <CheckCircle size={22} color="#7CFC00" />, iconBg: "rgba(124,252,0,0.1)", label: "Finished", value: `${finishedCount}`, change: `+${CLIENT_DATA.stats.finishedChange} this week`, up: true },
                  { icon: <Clock size={22} color="#8B5CF6" />, iconBg: "rgba(139,92,246,0.1)", label: "Tracked", value: CLIENT_DATA.stats.tracked, change: `-${Math.abs(CLIENT_DATA.stats.trackedChange)} hours`, up: false },
                  { icon: <Zap size={22} color="#F59E0B" />, iconBg: "rgba(245,158,11,0.1)", label: "Efficiency", value: `${effCount}%`, change: `+${CLIENT_DATA.stats.efficiencyChange}%`, up: true },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#16161A] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.iconBg }}>{stat.icon}</div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-white leading-none mb-1">{stat.value}</div>
                      <div className={cn("text-[10px] flex items-center gap-1", stat.up ? "text-[#7CFC00]" : "text-red-500")}>
                        {stat.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {stat.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Today's Workout (mobile home) ── */}
          {activeNav === "home" && (
            <div className="block mb-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                style={{ background: "#16161A", border: "1px solid rgba(124,252,0,0.2)", borderLeft: "3px solid #7CFC00", borderRadius: 16, padding: "18px 20px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Dumbbell size={18} color="#7CFC00" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2 }}>Today&apos;s Workout</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>Leg Day — Heavy Squats</div>
                  </div>
                  <div style={{ background: "rgba(139,92,246,0.2)", color: "#8B5CF6", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>In Progress</div>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: "50%" }} transition={{ duration: 0.8, delay: 0.4 }}
                    style={{ height: "100%", background: "linear-gradient(90deg, #7CFC00, #39FF14)", borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: "#8B8B8B", marginBottom: 14 }}>2 of 4 exercises completed · 50%</div>
                <button
                  onClick={() => setActiveNav("workouts")}
                  style={{ width: "100%", height: 50, borderRadius: 12, background: "linear-gradient(135deg, #7CFC00, #39FF14)", border: "none", color: "#000", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Play size={16} fill="#000" /> RESUME WORKOUT
                </button>
              </motion.div>
            </div>
          )}

          {/* ── Performance Chart ──────────────────────────────────────────────── */}
          {activeNav === "home" && (
            <>
            <motion.div
              custom={6}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              style={{
                background: "#16161A",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 600, color: "#FFFFFF" }}>Performance</span>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "8px 14px",
                    color: "#8B8B8B",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#7CFC00")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8B8B8B")}
                >
                  {dateRange}
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 3, background: "#7CFC00", borderRadius: 2 }} />
                  <span style={{ fontSize: 12, color: "#8B8B8B" }}>This Month</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 20,
                      height: 2,
                      background: "#8B8B8B",
                      borderRadius: 2,
                      opacity: 0.5,
                      backgroundImage: "repeating-linear-gradient(90deg, #8B8B8B 0, #8B8B8B 4px, transparent 4px, transparent 8px)",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#8B8B8B" }}>Last Month</span>
                </div>
              </div>

              <PerformanceChart isPrivate={isPrivate} />
            </motion.div>

            {/* ── Current Tasks ──────────────────────────────────────────────────── */}
            <motion.div
              custom={7}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "#FFFFFF" }}>Current Tasks</span>
                  <span style={{ fontSize: 14, color: "#8B8B8B" }}>Done 30%</span>
                </div>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "6px 12px",
                    color: "#8B8B8B",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {taskPeriod}
                  <ChevronDown size={13} />
                </button>
                <button
                  onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#7CFC00", border: "none", borderRadius: 10,
                    padding: "6px 12px", color: "#000", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {displayTasks.map((task: any, i: number) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  isPrivate={isPrivate} 
                  delay={i + 8} 
                  onEdit={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                  onDelete={() => { if(confirm("Delete this task?")) deleteTaskMutation.mutate({ id: task.id }); }}
                />
              ))}
            </motion.div>
            </>
          )}

            {/* ── Tabs Content ─────────────────────────────────────────────────── */}
              {activeNav === "workouts" && <WorkoutsTab isPrivate={isPrivate} memberId={memberId!} />}

              {activeNav === "nutrition" && (
                <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={0} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <NutritionTab isPrivate={isPrivate} />
                </motion.div>
              )}

              {activeNav === "progress" && <ProgressTab isPrivate={isPrivate} />}

              {activeNav === "coach" && (
                <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={0}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <Star size={24} color="#7CFC00" />
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>My Coach</span>
                  </div>
                  <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                      <div style={{ position: "relative" }}>
                        <Avatar name={CLIENT_DATA.coach.name} size={72} isCoach ring ringColor="#7CFC00" fontSize={24} />
                        <div style={{ position: "absolute", bottom: 3, right: 3, width: 14, height: 14, borderRadius: "50%", background: "#7CFC00", border: "2px solid #16161A" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>{CLIENT_DATA.coach.name}</div>
                        <div style={{ fontSize: 13, color: "#7CFC00", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7CFC00" }} />
                          Online Now
                        </div>
                        <div style={{ fontSize: 13, color: "#8B8B8B", marginTop: 4 }}>Certified Personal Trainer · 5+ years exp.</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                      {[
                        { label: "Clients", value: "24" },
                        { label: "Sessions", value: "340+" },
                        { label: "Rating", value: "4.9 ★" },
                      ].map(s => (
                        <div key={s.label} style={{ background: "rgba(124,252,0,0.05)", border: "1px solid rgba(124,252,0,0.15)", borderRadius: 12, padding: 16, textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: "#7CFC00" }}>{s.value}</div>
                          <div style={{ fontSize: 12, color: "#8B8B8B", marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ color: "#8B8B8B", fontSize: 14, lineHeight: 1.6, borderLeft: "3px solid #7CFC00", paddingLeft: 16 }}>
                      Specializes in strength & hypertrophy training. Use the chat on the right to send a message directly to your coach anytime.
                    </div>
                  </div>
                </motion.div>
              )}
            </main>

        {/* ─── Right Sidebar / Chat Panel ────────────────────────────────────────── */}
        {/* Desktop: visible, Mobile: Hidden/Portal */}
        <aside
          style={{
            background: "#16161A",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            flexDirection: "column",
            flexShrink: 0,
            height: "calc(100vh - " + (isPrivate && bannerVisible ? "40px" : "0px") + ")",
            overflowY: "auto",
          }}
          className={cn(
            "fixed inset-0 z-[200] flex lg:sticky lg:top-0 lg:w-[320px] lg:z-auto transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isChatOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 lg:translate-y-0 lg:opacity-100",
            !isChatOpen && "pointer-events-none lg:pointer-events-auto"
          )}
        >
          {/* Mobile Back Button */}
          <div className="lg:hidden p-4 border-bottom border-white/5 flex items-center justify-between">
            <button onClick={() => setIsChatOpen(false)} className="text-white flex items-center gap-2">
              <X size={20} /> Close Chat
            </button>
          </div>
          {/* Profile Card */}
          <motion.div
            custom={8}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            style={{
              padding: 24,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7CFC00, #4CAF50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#000",
                  border: "3px solid #7CFC00",
                  boxShadow: "0 0 20px rgba(124,252,0,0.3)",
                }}
              >
                {memberName.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF" }}>{memberName}</div>
            <div style={{ fontSize: 14, color: "#8B8B8B", marginTop: 2 }}>{memberType}</div>

            {/* Private badge */}
            {isPrivate && (
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(124,252,0,0.4)",
                    "0 0 0 8px rgba(124,252,0,0)",
                    "0 0 0 0 rgba(124,252,0,0.4)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: "100%",
                  background: "#7CFC00",
                  borderRadius: 8,
                  padding: "6px 0",
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Crown size={14} color="#000" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#000",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  PRIVATE TRAINING CLIENT
                </span>
              </motion.div>
            )}

            {/* Quick actions */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 16,
              }}
            >
              {[
                { icon: <Phone size={16} />, label: "Call" },
                { icon: <Video size={16} />, label: "Video" },
                { icon: <MoreHorizontal size={16} />, label: "More" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  title={btn.label}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#16161A",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#8B8B8B",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,252,0,0.4)";
                    e.currentTarget.style.color = "#7CFC00";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#8B8B8B";
                  }}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF" }}>Activity</span>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                paddingTop: 16,
              }}
            >
              {(messages || []).map((msg) => {
                const isCoach = msg.sender_type === "coach";
                return (
                  <div key={msg.id} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isCoach ? "flex-start" : "flex-end",
                  }}>
                    <div style={{
                      fontSize: 11,
                      color: "#5A5A5A",
                      marginBottom: 4,
                      marginLeft: isCoach ? 4 : 0,
                      marginRight: isCoach ? 0 : 4,
                    }}>
                      {isCoach ? (CLIENT_DATA.coach.name || "Coach") : "You"} • {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </div>
                    <div style={{
                      maxWidth: "85%",
                      background: isCoach ? "rgba(255,255,255,0.05)" : "rgba(124,252,0,0.1)",
                      color: isCoach ? "#FFFFFF" : "#7CFC00",
                      border: isCoach ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(124,252,0,0.2)",
                      padding: "10px 14px",
                      borderRadius: 16,
                      borderTopLeftRadius: isCoach ? 4 : 16,
                      borderTopRightRadius: isCoach ? 16 : 4,
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {(!messages || messages.length === 0) && (
                <div style={{ textAlign: "center", color: "#5A5A5A", fontSize: 13, marginTop: 40 }}>
                  No messages yet. Say hi to your coach!
                </div>
              )}
            </div>

            {/* Message Input */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Paperclip size={18} color="#5A5A5A" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  placeholder="Type to coach..."
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#FFFFFF",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <Smile size={18} color="#5A5A5A" style={{ flexShrink: 0, cursor: "pointer" }} />
                <Send
                  size={18}
                  color={isPrivate ? "#7CFC00" : "#5A5A5A"}
                  style={{ flexShrink: 0, cursor: "pointer" }}
                  onClick={handleSendMessage}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Private Floating DM Button ──────────────────────────────────────── */}
      {isPrivate && (
        <motion.button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setIsChatOpen(true);
            } else {
              const input = document.querySelector('input[placeholder="Type to coach..."]') as HTMLInputElement;
              if (input) input.focus();
            }
          }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(124,252,0,0.7)",
              "0 0 0 12px rgba(124,252,0,0)",
              "0 0 0 0 rgba(124,252,0,0.7)",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 lg:bottom-8 right-6 lg:right-340 w-14 h-14 rounded-full bg-[#7CFC00] flex items-center justify-center z-[90] shadow-2xl"
        >
          <MessageCircle size={26} color="#000000" />
        </motion.button>
      )}

      {/* ─── Task Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400 }}
            >
              <h2 style={{ color: "#FFF", marginBottom: 20 }}>{editingTask ? "Edit Task" : "Add Task"}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                const type = formData.get("type") as string;
                const duration = formData.get("duration") as string;
                if (editingTask) {
                  updateTaskMutation.mutate(
                    { id: editingTask.id, data: { title, type, duration } },
                    {
                      onSuccess: () => setIsTaskModalOpen(false),
                      onError: () => alert("Cannot save task: Database table 'client_tasks' is missing! Please run the SQL script in your Supabase dashboard.")
                    }
                  );
                } else {
                  createTaskMutation.mutate(
                    { member_id: memberId!, title, type, duration, status: "todo", coach_assigned: false },
                    {
                      onSuccess: () => setIsTaskModalOpen(false),
                      onError: () => alert("Cannot save task: Database table 'client_tasks' is missing! Please run the SQL script in your Supabase dashboard.")
                    }
                  );
                }
              }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 8 }}>Task Title</label>
                  <input name="title" defaultValue={editingTask?.title || ""} required style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 8 }}>Type</label>
                  <select name="type" defaultValue={editingTask?.type || "workout"} style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }}>
                    <option value="workout">Workout</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="recovery">Recovery</option>
                  </select>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 8 }}>Duration</label>
                  <input name="duration" defaultValue={editingTask?.duration || "15 min"} required style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending} style={{ flex: 1, padding: 12, background: "#7CFC00", color: "#000", fontWeight: 600, border: "none", borderRadius: 8, cursor: "pointer" }}>Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Quick Log Sheet ─────────────────────────────────────────────────── */}
      {isQuickLogOpen && (
        <QuickLogSheet
          onClose={() => setIsQuickLogOpen(false)}
          onNavigate={(tab) => { setActiveNav(tab); setIsQuickLogOpen(false); }}
        />
      )}

      {/* ─── Mobile Bottom Navigation ────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent h-20 -top-20 pointer-events-none opacity-50" />
        <div className="bg-[#16161A]/97 backdrop-blur-xl border-t border-white/5 pb-safe-nav pt-1 px-2">
          <div className="flex items-end justify-around max-w-md mx-auto">
            {/* Home */}
            {[navItems[0], navItems[1]].map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  className="flex flex-col items-center gap-0.5 py-2 flex-1"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div className={cn(
                    "w-11 h-9 rounded-xl flex items-center justify-center transition-all duration-300 relative",
                    isActive ? "text-[#7CFC00]" : "text-gray-500"
                  )}>
                    {isActive && (
                      <motion.div layoutId="nav-bg" className="absolute inset-0 bg-[#7CFC00]/10 rounded-xl"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} />
                    )}
                    <div className="relative z-10">{item.icon}</div>
                  </div>
                  <span className={cn("text-[9px] font-bold uppercase tracking-tight",
                    isActive ? "text-[#7CFC00]" : "text-gray-500")}>{item.label}</span>
                </button>
              );
            })}

            {/* Central Plus FAB */}
            <div className="flex flex-col items-center pb-1 flex-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsQuickLogOpen(true)}
                style={{
                  width: 58, height: 58,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7CFC00, #39FF14)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 -4px 20px rgba(124,252,0,0.5), 0 4px 16px rgba(0,0,0,0.5)",
                  marginTop: -22,
                  WebkitTapHighlightColor: "transparent",
                } as React.CSSProperties}
              >
                <Plus size={26} color="#000" strokeWidth={2.5} />
              </motion.button>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#7CFC00", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>Log</span>
            </div>

            {/* Nutrition + Progress */}
            {[navItems[2], navItems[3]].map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  className="flex flex-col items-center gap-0.5 py-2 flex-1"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div className={cn(
                    "w-11 h-9 rounded-xl flex items-center justify-center transition-all duration-300 relative",
                    isActive ? "text-[#7CFC00]" : "text-gray-500"
                  )}>
                    {isActive && (
                      <motion.div layoutId="nav-bg2" className="absolute inset-0 bg-[#7CFC00]/10 rounded-xl"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} />
                    )}
                    <div className="relative z-10">{item.icon}</div>
                  </div>
                  <span className={cn("text-[9px] font-bold uppercase tracking-tight",
                    isActive ? "text-[#7CFC00]" : "text-gray-500")}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(124,252,0,0.3); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .pb-safe-nav { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
}

