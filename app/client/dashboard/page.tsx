"use client";

// Suppress hydration warnings from dynamic localStorage-dependent state

import React, { useState, useEffect, useRef } from "react";
import NutritionTab from "./NutritionTab";
import WorkoutsTab from "./WorkoutsTab";
import ProgressTab from "./ProgressTab";
import CoachUploadsTab from "./CoachUploadsTab";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, useListAnnouncements, useListPhotos, useListCalorieLogs, useListWorkouts } from "@/lib/api-hooks";
import { useAuth } from "@/lib/use-auth";
import { useProgressDashboardStore, useProgressDashboard } from "@/lib/use-progress-dashboard";
import { cn, getMembershipStatus, getDaysRemainingText } from "@/lib/utils";
import { moveFocusWithArrows, SECONDARY_TEXT_COLOR, TOUCH_TARGET_SIZE, useAccessibleDialog } from "@/lib/accessibility";
import { getErrorMessage, showConfirmToast } from "@/lib/feedback";
import { LazyRenderSection, SkeletonBlock, useDashboardMotion } from "@/lib/performance";
import { DashboardErrorBoundary } from "@/components/ui/DashboardErrorBoundary";
import { useClientLanguage } from "@/lib/client-language";
import { toast } from "react-hot-toast";
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
  FileText,
  Download,
  X,
  Bell,
  Calendar,
  Settings,
  LogOut,
  HelpCircle,
  Crown,
  Eye,
  Plus,
  Camera,
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
  Filter,
  Target,
  Timer,
  Trophy,
  Activity,
  Search,
  BookOpen,
  Upload,
} from "lucide-react";

// ─── Motion Sensitivity Hook ─────────────────────────────────────────────────
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const GYM_WHATSAPP = "2010099887771";

function formatSubscriptionDate(dateValue?: string | null, language: "en" | "ar" = "en") {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
    timeZone: "Africa/Cairo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  return day && month && year ? `${day} / ${month} / ${year}` : null;
}

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


interface AchievementBadge {
  key: string;
  title: string;
  description: string;
  achieved: boolean;
  icon: React.ReactNode;
}

interface WeeklyChallenge {
  title: string;
  description: string;
  progress: number;
  completed: boolean;
  helper: string;
}

interface SearchWorkoutItem {
  id: string;
  title: string;
  muscleGroup: string;
  difficulty: "Easy" | "Medium" | "Hard";
  durationMinutes: number;
  tags: string[];
  exercises: string[];
}

interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  videoUrl: string;
}

type ThemeMode = "dark";
type UnitPreference = "kg" | "lbs";
type HomeSectionKey = "workoutSummary" | "nutritionToday" | "goals";

function hasPrivateAccess(membershipType?: string | null) {
  if (!membershipType) return false;
  const normalizedType = membershipType.trim().toLowerCase();
  return normalizedType === "vip" || normalizedType.includes("private");
}

const DEFAULT_WIDGET_ORDER: HomeSectionKey[] = ["goals"];

function normalizeWidgetOrder(value: unknown): HomeSectionKey[] {
  const allowed = new Set<HomeSectionKey>(DEFAULT_WIDGET_ORDER);
  const ordered = Array.isArray(value)
    ? value.filter((item): item is HomeSectionKey => typeof item === "string" && allowed.has(item as HomeSectionKey))
    : [];
  const unique = Array.from(new Set(ordered));
  for (const key of DEFAULT_WIDGET_ORDER) {
    if (!unique.includes(key)) unique.push(key);
  }
  return unique;
}

function normalizeWorkoutTagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((tag) => (typeof tag === "string" ? tag.trim().toLowerCase() : ""))
        .filter(Boolean)
    )
  );
}

function normalizeWorkoutTags(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string[]>>((acc, [workoutId, tags]) => {
    if (!workoutId) return acc;

    const normalizedTags = normalizeWorkoutTagList(tags);
    if (normalizedTags.length > 0) {
      acc[workoutId] = normalizedTags;
    }
    return acc;
  }, {});
}

// ─── Chart Data ────────────────────────────────────────────────────────────────
const CHART_DATA = {
  labels: ["01", "02", "03", "04", "05", "06", "07"],
  current: [3, 5, 7, 4, 6, 8, 5],
  previous: [2, 4, 6, 3, 5, 6, 4],
};

const SEARCH_WORKOUT_LIBRARY: SearchWorkoutItem[] = [
  {
    id: "legs-heavy",
    title: "Leg Day - Heavy Squats",
    muscleGroup: "Lower Body",
    difficulty: "Hard",
    durationMinutes: 45,
    tags: ["strength", "coach"],
    exercises: ["Barbell Back Squat", "Romanian Deadlift", "Leg Press"],
  },
  {
    id: "upper-power",
    title: "Upper Body - Bench Press",
    muscleGroup: "Upper Body",
    difficulty: "Medium",
    durationMinutes: 60,
    tags: ["push", "hypertrophy"],
    exercises: ["Flat Bench Press", "Incline Dumbbell Press", "Overhead Press"],
  },
  {
    id: "conditioning",
    title: "Conditioning Circuit",
    muscleGroup: "Full Body",
    difficulty: "Hard",
    durationMinutes: 30,
    tags: ["conditioning", "fat-loss"],
    exercises: ["Assault Bike", "Walking Lunges", "Burpees"],
  },
  {
    id: "recovery-flow",
    title: "Recovery Flow",
    muscleGroup: "Mobility",
    difficulty: "Easy",
    durationMinutes: 20,
    tags: ["recovery", "mobility"],
    exercises: ["Hip Flexor Stretch", "Thoracic Rotation", "Foam Roll"],
  },
];

const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  { id: "squat", name: "Barbell Back Squat", muscleGroup: "Lower Body", difficulty: "Advanced", videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8" },
  { id: "bench", name: "Flat Bench Press", muscleGroup: "Upper Body", difficulty: "Intermediate", videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg" },
  { id: "rdl", name: "Romanian Deadlift", muscleGroup: "Lower Body", difficulty: "Intermediate", videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM" },
  { id: "row", name: "Chest Supported Row", muscleGroup: "Upper Body", difficulty: "Beginner", videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8" },
  { id: "lunge", name: "Walking Lunge", muscleGroup: "Lower Body", difficulty: "Beginner", videoUrl: "https://www.youtube.com/watch?v=wrwwXE_x-pQ" },
  { id: "press", name: "Overhead Press", muscleGroup: "Upper Body", difficulty: "Intermediate", videoUrl: "https://www.youtube.com/watch?v=2yjwXTZQDDI" },
];

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

function WhatsAppIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
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

        <path
          d={buildPath(CHART_DATA.previous)}
          fill="none"
          stroke="var(--color-text-secondary)"
          strokeWidth={2}
          strokeDasharray="5,4"
          opacity={0.5}
        />

        <path
          d={buildPath(CHART_DATA.current)}
          fill="none"
          stroke="#7CFC00"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

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
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>
              0{idx + 1} May 2023
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7CFC00" }} />
              <span style={{ fontSize: 14, color: "#7CFC00" }}>This month: {CHART_DATA.current[idx]}h</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-secondary)" }} />
              <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Last month: {CHART_DATA.previous[idx]}h</span>
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
      const eased = 1 - Math.pow(1 - progress, 4);
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
    todo: { bg: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)", label: "To Do" },
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

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>
          {task.title}
        </div>
        {isPrivate && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            Assigned by {task.assignedBy}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-secondary)" }}>
        <Clock size={13} />
        <span style={{ fontSize: 13 }}>{task.duration}</span>
      </div>

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
            color: "var(--color-text-secondary)",
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

          {activity.type === "assignment" && (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{activity.action}</div>
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
                  color: "var(--color-text-secondary)",
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
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Daily Score</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
            {score}<span style={{ fontSize: 16, color: "var(--color-text-secondary)", fontWeight: 400 }}>/100</span>
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
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 8 }}>
        {score >= 80 ? "Crushing it today! Keep going 🚀" : score >= 50 ? "Good progress — finish strong 💪" : "Let's get moving — log your first activity!"}
      </div>
    </motion.div>
  );
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const width = 92;
  const height = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / range) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeSectionCard({
  title,
  sectionKey,
  isOpen,
  onToggle,
  badge,
  children,
}: {
  title: string;
  sectionKey: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: "18px 18px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          textAlign: "left",
        }}
        aria-expanded={isOpen}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{title}</span>
          {badge}
        </div>
        {isOpen ? <ChevronUp size={18} color="var(--color-text-secondary)" /> : <ChevronDown size={18} color="var(--color-text-secondary)" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 18px 18px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AchievementBadgeCard({ badge }: { badge: AchievementBadge }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 16,
        background: badge.achieved ? "linear-gradient(135deg, rgba(124,252,0,0.14), rgba(22,22,26,0.96))" : "rgba(255,255,255,0.03)",
        border: badge.achieved ? "1px solid rgba(124,252,0,0.18)" : "1px solid rgba(255,255,255,0.06)",
        minHeight: 112,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: badge.achieved ? "rgba(124,252,0,0.12)" : "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: badge.achieved ? "#B9FF8B" : "var(--color-text-secondary)",
          }}
        >
          {badge.icon}
        </div>
        <span
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            background: badge.achieved ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.06)",
            color: badge.achieved ? "#86EFAC" : "var(--color-text-secondary)",
          }}
        >
          {badge.achieved ? "Unlocked" : "In Progress"}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF" }}>{badge.title}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.45, marginTop: 4 }}>{badge.description}</div>
      </div>
    </div>
  );
}

function ChallengeRing({ progress }: { progress: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 68,
        height: 68,
        borderRadius: "50%",
        background: `conic-gradient(#7CFC00 ${progress}%, rgba(255,255,255,0.08) ${progress}% 100%)`,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#111114",
          display: "grid",
          placeItems: "center",
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        {progress}%
      </div>
    </div>
  );
}

// ─── Mobile Bottom Navigation ──────────────────────────────────────────────
function GlobalSearchModal({
  isOpen,
  onClose,
  query,
  onQueryChange,
  activeType,
  onTypeChange,
  muscleFilter,
  onMuscleFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  durationFilter,
  onDurationFilterChange,
  workoutResults,
  nutritionResults,
  exerciseResults,
  workoutTags,
  onAddTag,
  onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  activeType: "all" | "workouts" | "nutrition" | "exercises";
  onTypeChange: (value: "all" | "workouts" | "nutrition" | "exercises") => void;
  muscleFilter: string;
  onMuscleFilterChange: (value: string) => void;
  difficultyFilter: string;
  onDifficultyFilterChange: (value: string) => void;
  durationFilter: string;
  onDurationFilterChange: (value: string) => void;
  workoutResults: SearchWorkoutItem[];
  nutritionResults: { id: string; title: string; subtitle: string }[];
  exerciseResults: ExerciseLibraryItem[];
  workoutTags: Record<string, string[]>;
  onAddTag: (workoutId: string, tag: string) => void;
  onNavigate: (tab: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { titleId, descriptionId } = useAccessibleDialog(isOpen, dialogRef, onClose, inputRef);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = (event?: MediaQueryListEvent) => {
      setIsPhoneViewport(event ? event.matches : mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const filters = [
    { key: "all", label: "All" },
    { key: "workouts", label: "Workouts" },
    { key: "nutrition", label: "Nutrition" },
    { key: "exercises", label: "Exercises" },
  ] as const;

  const resultCount = workoutResults.length + nutritionResults.length + exerciseResults.length;
  const modalPadding = isPhoneViewport ? 14 : 20;

  return (
    <AnimatePresence>
      <motion.div
        key="global-search-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 260 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        key="global-search-dialog"
        ref={dialogRef}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: isPhoneViewport ? "max(12px, env(safe-area-inset-top))" : "7vh",
          left: isPhoneViewport ? 12 : "50%",
          right: isPhoneViewport ? 12 : undefined,
          bottom: isPhoneViewport ? "max(12px, env(safe-area-inset-bottom))" : undefined,
          transform: isPhoneViewport ? "none" : "translateX(-50%)",
          width: isPhoneViewport ? "auto" : "min(960px, calc(100vw - 24px))",
          maxHeight: isPhoneViewport
            ? "calc(100dvh - max(24px, env(safe-area-inset-top)) - max(24px, env(safe-area-inset-bottom)))"
            : "86vh",
          overflow: "hidden",
          background: "#111114",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: isPhoneViewport ? 20 : 24,
          boxShadow: "0 40px 120px rgba(0,0,0,0.45)",
          zIndex: 261,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: modalPadding, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: isPhoneViewport ? 10 : 12 }}>
            <div style={{ width: isPhoneViewport ? 40 : 44, height: isPhoneViewport ? 40 : 44, borderRadius: 14, background: "rgba(124,252,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7CFC00", flexShrink: 0 }}>
              <Search size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div id={titleId} style={{ fontSize: isPhoneViewport ? 16 : 18, fontWeight: 800, color: "#FFFFFF" }}>Global Search</div>
              <div id={descriptionId} style={{ fontSize: isPhoneViewport ? 12 : 13, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
                Search workouts, nutrition logs, and the exercise library. Use Cmd/Ctrl+K to open this anytime.
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#FFFFFF", cursor: "pointer", flexShrink: 0 }} aria-label="Close search">
              <X size={18} />
            </button>
          </div>
          <div style={{ position: "relative", marginTop: isPhoneViewport ? 12 : 16 }}>
            <Search size={18} color="var(--color-text-secondary)" style={{ position: "absolute", left: 14, top: 13 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search workouts, meals, or exercises"
              style={{ width: "100%", minHeight: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#FFFFFF", padding: "12px 14px 12px 44px", outline: "none", fontSize: isPhoneViewport ? 16 : 15 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => onTypeChange(filter.key)}
                style={{
                  minHeight: 40,
                  padding: "9px 12px",
                  borderRadius: 999,
                  border: activeType === filter.key ? "1px solid rgba(124,252,0,0.18)" : "1px solid rgba(255,255,255,0.08)",
                  background: activeType === filter.key ? "rgba(124,252,0,0.12)" : "rgba(255,255,255,0.03)",
                  color: activeType === filter.key ? "#D9FFBF" : "#FFFFFF",
                  fontSize: isPhoneViewport ? 12 : 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ marginTop: 14 }}>
            <select value={muscleFilter} onChange={(event) => onMuscleFilterChange(event.target.value)} style={{ minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#FFFFFF", padding: "0 12px", fontSize: isPhoneViewport ? 16 : 14 }}>
              <option value="all">All muscle groups</option>
              <option value="Upper Body">Upper Body</option>
              <option value="Lower Body">Lower Body</option>
              <option value="Full Body">Full Body</option>
              <option value="Mobility">Mobility</option>
            </select>
            <select value={difficultyFilter} onChange={(event) => onDifficultyFilterChange(event.target.value)} style={{ minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#FFFFFF", padding: "0 12px", fontSize: isPhoneViewport ? 16 : 14 }}>
              <option value="all">All difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select value={durationFilter} onChange={(event) => onDurationFilterChange(event.target.value)} style={{ minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#FFFFFF", padding: "0 12px", fontSize: isPhoneViewport ? 16 : 14 }}>
              <option value="all">Any duration</option>
              <option value="short">Under 30 min</option>
              <option value="medium">30-45 min</option>
              <option value="long">45+ min</option>
            </select>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: modalPadding, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{resultCount} results</div>
          {(activeType === "all" || activeType === "workouts") && (
            <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFFFFF", fontWeight: 800 }}><Dumbbell size={16} color="#7CFC00" />Workouts</div>
              {workoutResults.length === 0 && <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", color: "var(--color-text-secondary)" }}>No workouts matched these filters.</div>}
              {workoutResults.map((item) => {
                const mergedTags = normalizeWorkoutTagList([...(item.tags || []), ...(workoutTags[item.id] || [])]);
                return (
                  <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 6 }}>{item.muscleGroup} • {item.difficulty} • {item.durationMinutes} min</div>
                      </div>
                      <button type="button" onClick={() => { onNavigate("workouts"); onClose(); }} style={{ minHeight: 40, padding: "9px 12px", borderRadius: 12, border: "none", background: "#7CFC00", color: "#111114", fontWeight: 800, cursor: "pointer" }}>Open Workouts</button>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      {mergedTags.map((tagValue, tagIndex) => <span key={`${item.id}-tag-${tagValue}-${tagIndex}`} style={{ padding: "5px 9px", borderRadius: 999, background: "rgba(139,92,246,0.12)", color: "#DDD6FE", fontSize: 11, fontWeight: 700 }}>#{tagValue}</span>)}
                      {query.trim().length >= 2 && !mergedTags.includes(query.trim().toLowerCase()) && <button type="button" onClick={() => onAddTag(item.id, query.trim().toLowerCase())} style={{ minHeight: 32, padding: "6px 10px", borderRadius: 999, border: "1px dashed rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: "#FCD34D", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Add "{query.trim()}" as tag</button>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 12 }}>Exercises: {item.exercises.join(", ")}</div>
                  </div>
                );
              })}
            </section>
          )}
          {(activeType === "all" || activeType === "nutrition") && (
            <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFFFFF", fontWeight: 800 }}><Apple size={16} color="#10B981" />Nutrition Logs</div>
              {nutritionResults.length === 0 && <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", color: "var(--color-text-secondary)" }}>No nutrition entries matched.</div>}
              {nutritionResults.map((item, index) => <button key={`${item.id}-${index}`} type="button" onClick={() => { onNavigate("nutrition"); onClose(); }} style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "left", cursor: "pointer" }}><div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}>{item.title}</div><div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 6 }}>{item.subtitle}</div></button>)}
            </section>
          )}
          {(activeType === "all" || activeType === "exercises") && (
            <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFFFFF", fontWeight: 800 }}><BookOpen size={16} color="#60A5FA" />Exercise Library</div>
              {exerciseResults.length === 0 && <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", color: "var(--color-text-secondary)" }}>No exercises matched.</div>}
              {exerciseResults.map((item, index) => <a key={`${item.id}-${index}`} href={item.videoUrl} target="_blank" rel="noreferrer" style={{ display: "block", padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}>{item.name}</div><span style={{ padding: "5px 8px", borderRadius: 999, background: "rgba(96,165,250,0.14)", color: "#BFDBFE", fontSize: 11, fontWeight: 700 }}>Demo</span></div><div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 6 }}>{item.muscleGroup} • {item.difficulty} • Opens a video guide</div></a>)}
            </section>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SettingsModal({
  isOpen,
  onClose,
  unitPreference,
  onUnitPreferenceChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  unitPreference: UnitPreference;
  onUnitPreferenceChange: (value: UnitPreference) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { titleId, descriptionId } = useAccessibleDialog(isOpen, dialogRef, onClose);
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 270 }} onClick={onClose} aria-hidden="true" />
      <motion.div key="dialog" ref={dialogRef} initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} onClick={(event) => event.stopPropagation()} style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxHeight: "80vh", overflowY: "auto", background: "#16161A", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "24px 20px 32px", zIndex: 271 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <div id={titleId} style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>Settings</div>
            <div id={descriptionId} style={{ fontSize: 13, color: "#8B8B8B", marginTop: 2 }}>Customize your experience</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#FFFFFF", cursor: "pointer" }} aria-label="Close settings"><X size={16} /></button>
        </div>
        <div style={{ padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "#F59E0B", fontWeight: 800, marginBottom: 12 }}>Units</div>
          <div style={{ display: "flex", gap: 8 }}>{(["kg", "lbs"] as UnitPreference[]).map((unit) => <button key={unit} type="button" onClick={() => onUnitPreferenceChange(unit)} style={{ flex: 1, minHeight: 40, padding: "8px 12px", borderRadius: 10, border: unitPreference === unit ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.1)", background: unitPreference === unit ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)", color: unitPreference === unit ? "#FCD34D" : "#FFFFFF", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>{unit.toUpperCase()}</button>)}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MobileBottomNav({ activeNav, setActiveNav, onOpenSettings }: { activeNav: string; setActiveNav: (nav: string) => void; onOpenSettings: () => void }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primaryItems = [
    { key: "home", label: "Dashboard", icon: <LayoutDashboard size={22} strokeWidth={2.2} /> },
    { key: "workouts", label: "Workouts", icon: <Dumbbell size={22} strokeWidth={2.2} /> },
    { key: "nutrition", label: "Nutrition", icon: <Utensils size={22} strokeWidth={2.2} /> },
  ];
  const moreItems = [
    { key: "progress", label: "Progress", icon: <TrendingUp size={18} /> },
  ];
  const moreActive = activeNav === "progress";
  const startLongPress = (key: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => setTooltipKey(key), 420);
  };
  const stopLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
    setTimeout(() => setTooltipKey(null), 140);
  };
  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: "var(--dashboard-surface)", borderTop: "1px solid var(--dashboard-border)" }}>
        <div className="flex items-center justify-around px-2 py-2">
          {primaryItems.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <div key={item.key} style={{ position: "relative", flex: 1 }}>
                {tooltipKey === item.key && <div style={{ position: "absolute", bottom: 56, left: "50%", transform: "translateX(-50%)", padding: "6px 10px", borderRadius: 999, background: "#111114", color: "#FFFFFF", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", border: "1px solid var(--dashboard-border)" }}>{item.label}</div>}
                <motion.button whileTap={{ scale: 0.96 }} animate={isActive ? { scale: 1.05 } : { scale: 1 }} transition={{ duration: 0.18 }} onClick={() => { setIsMoreOpen(false); setActiveNav(item.key); }} onTouchStart={() => startLongPress(item.key)} onTouchEnd={stopLongPress} onMouseDown={() => startLongPress(item.key)} onMouseUp={stopLongPress} onMouseLeave={stopLongPress} className="w-full flex flex-col items-center justify-center" style={{ minHeight: 60, borderRadius: 16, background: isActive ? "rgba(124,252,0,0.14)" : "transparent", color: isActive ? "var(--dashboard-accent)" : "var(--color-text-secondary)", border: "none", cursor: "pointer" }}>
                  {item.icon}
                  <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{item.label}</span>
                </motion.button>
              </div>
            );
          })}
          <div style={{ position: "relative", flex: 1 }}>
            {tooltipKey === "more" && <div style={{ position: "absolute", bottom: 56, left: "50%", transform: "translateX(-50%)", padding: "6px 10px", borderRadius: 999, background: "#111114", color: "#FFFFFF", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", border: "1px solid var(--dashboard-border)" }}>More</div>}
            <motion.button whileTap={{ scale: 0.96 }} animate={moreActive || isMoreOpen ? { scale: 1.05 } : { scale: 1 }} transition={{ duration: 0.18 }} onClick={() => setIsMoreOpen((current) => !current)} onTouchStart={() => startLongPress("more")} onTouchEnd={stopLongPress} onMouseDown={() => startLongPress("more")} onMouseUp={stopLongPress} onMouseLeave={stopLongPress} className="w-full flex flex-col items-center justify-center" style={{ minHeight: 60, borderRadius: 16, background: moreActive || isMoreOpen ? "rgba(124,252,0,0.14)" : "transparent", color: moreActive || isMoreOpen ? "var(--dashboard-accent)" : "var(--color-text-secondary)", border: "none", cursor: "pointer" }}>
              <MoreHorizontal size={22} strokeWidth={2.2} />
              <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>More</span>
            </motion.button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isMoreOpen && <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-[54]" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setIsMoreOpen(false)} />
          <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} className="lg:hidden fixed left-4 right-4 z-[55]" style={{ bottom: 84, background: "var(--dashboard-surface)", border: "1px solid var(--dashboard-border)", borderRadius: 22, padding: 16, boxShadow: "var(--dashboard-shadow)" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 800, marginBottom: 12 }}>More</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {moreItems.map((item) => <button key={item.key} type="button" onClick={() => { setActiveNav(item.key); setIsMoreOpen(false); }} style={{ minHeight: 48, borderRadius: 14, border: "1px solid var(--dashboard-border)", background: activeNav === item.key ? "rgba(124,252,0,0.12)" : "rgba(255,255,255,0.04)", color: activeNav === item.key ? "#D9FFBF" : "var(--dashboard-text-primary)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", cursor: "pointer", fontWeight: 700 }}>{item.icon}{item.label}</button>)}
              <button type="button" onClick={() => { setIsMoreOpen(false); onOpenSettings(); }} style={{ minHeight: 48, borderRadius: 14, border: "1px solid var(--dashboard-border)", background: "rgba(255,255,255,0.04)", color: "var(--dashboard-text-primary)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", cursor: "pointer", fontWeight: 700 }}><Settings size={18} />Settings</button>
            </div>
          </motion.div>
        </>}
      </AnimatePresence>
    </>
  );
}

// ─── Quick Log Bottom Sheet ───────────────────────────────────────────────────
function QuickLogSheet({ onClose, onNavigate }: { onClose: () => void; onNavigate: (tab: string) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { titleId, descriptionId } = useAccessibleDialog(true, dialogRef, onClose);
  const options = [
    { icon: <Dumbbell size={22} color="#7CFC00" />, bg: "rgba(124,252,0,0.1)", label: "Log Workout", sub: "Mark sets done", tab: "workouts" },
    { icon: <Apple size={22} color="#10B981" />, bg: "rgba(16,185,129,0.1)", label: "Log Meal", sub: "AI nutrition tracker", tab: "nutrition" },
    { icon: <TrendingUp size={22} color="#8B5CF6" />, bg: "rgba(139,92,246,0.1)", label: "Update your weight", sub: "Log your weight", tab: "progress" },
  ];
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 250 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        key="sheet"
        ref={dialogRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="bottom-sheet"
        style={{ zIndex: 251, paddingTop: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "12px auto 20px" }} />
        <div id={titleId} style={{ fontSize: 13, fontWeight: 700, color: SECONDARY_TEXT_COLOR, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>Quick Log</div>
        <p id={descriptionId} className="sr-only">Choose one quick action. Use left and right arrow keys to move between options, then press Enter.</p>
        {options.map((o, index) => (
          <button
            key={o.label}
            ref={(element) => { optionRefs.current[index] = element; }}
            onClick={() => { onNavigate(o.tab); onClose(); }}
            onKeyDown={(event) => moveFocusWithArrows(event, optionRefs.current.filter(Boolean) as HTMLButtonElement[])}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "16px 4px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "left" }}
            aria-label={`${o.label}. ${o.sub}`}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: o.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {o.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{o.label}</div>
              <div style={{ fontSize: 13, color: SECONDARY_TEXT_COLOR }}>{o.sub}</div>
            </div>
            <ChevronRight size={18} color="#5A5A5A" style={{ marginLeft: "auto" }} />
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Task Filter Component ──────────────────────────────────────────────────
function TaskFilter({ activeFilter, setActiveFilter, taskStats }: {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  taskStats: { total: number; completed: number; coach: number; personal: number }
}) {
  const filters = [
    { key: "all", label: "All", count: taskStats.total },
    { key: "coach", label: "Coach", count: taskStats.coach },
    { key: "personal", label: "Personal", count: taskStats.personal },
    { key: "completed", label: "Done", count: taskStats.completed },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => setActiveFilter(filter.key)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === filter.key
              ? 'bg-[#7CFC00] text-black'
              : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
          }`}
        >
          {filter.label}
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
            activeFilter === filter.key
              ? 'bg-black/20 text-black'
              : 'bg-white/10 text-[var(--color-text-secondary)]'
          }`}>
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const router = useRouter();
  const { disableHeavyAnimations } = useDashboardMotion();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { language, t, setLanguage } = useClientLanguage();
  const [activeNav, setActiveNav] = useState("home");
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeNav]);

  const [copied, setCopied] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [dateRange, setDateRange] = useState("");
  const [taskPeriod, setTaskPeriod] = useState("Week");
  const [demoMode, setDemoMode] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "workouts" | "nutrition" | "exercises">("all");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [workoutTags, setWorkoutTags] = useState<Record<string, string[]>>({});
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [unitPreference, setUnitPreference] = useState<UnitPreference>("kg");
  const [widgetOrder, setWidgetOrder] = useState<HomeSectionKey[]>(DEFAULT_WIDGET_ORDER);
  const [homeSections, setHomeSections] = useState({
    workoutSummary: true,
    nutritionToday: true,
    goals: false,
  });
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("all");
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const { currentMember, memberCode: sessionMemberCode, setMemberAuth, logoutMember } = useAuth();
  const memberName = (() => {
  const name = currentMember?.name ?? "Member";
  const parts = name.trim().split(/\s+/);
  return parts.length > 2 ? `${parts[0]} ${parts[1]}` : name;
})();
  const memberCode = currentMember?.membership_code ?? sessionMemberCode ?? "";
  const memberType = currentMember?.membership_type ?? CLIENT_DATA.subscription.type;
  const isPrivate = hasPrivateAccess(currentMember?.membership_type);

  const expiryDate = currentMember?.sub_expiry_date ? new Date(currentMember.sub_expiry_date) : null;
  const startDate = currentMember?.start_date ? new Date(currentMember.start_date) : null;

  const rawDaysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : CLIENT_DATA.subscription.daysRemaining;
  const daysRemaining = Math.max(0, rawDaysRemaining);
  const totalDays = (startDate && expiryDate)
    ? Math.max(1, Math.ceil((expiryDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 30;
  const memberStatus = expiryDate ? getMembershipStatus(expiryDate.toISOString()) : "active";
  const daysLow = memberStatus === "expiring_soon" || memberStatus === "expired";
  const formattedStartDate = formatSubscriptionDate(currentMember?.start_date, language);

  const { data: refreshedMember } = useQuery({
    queryKey: ["member-dashboard-refresh", memberCode],
    queryFn: async () => {
      const res = await fetch("/api/members/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipCode: memberCode }),
      });
      if (!res.ok) throw new Error("Failed to refresh member");
      return res.json();
    },
    enabled: !!memberCode,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const sideNavRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bottomNavRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const taskModalRef = useRef<HTMLDivElement>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const lastCelebrationRef = useRef("");
  const pendingSyncCount = useProgressDashboardStore((state) => state.pendingCount);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const { data: announcements, isLoading: announcementsLoading } = useListAnnouncements({ memberId: memberId ?? undefined });
  const { data: photos, isLoading: photosLoading } = useListPhotos({ global: true, category: "gallery" });
  const { data: nutritionLogs = [] } = useListCalorieLogs(memberId ?? undefined);
  const { data: workouts = [] } = useListWorkouts(memberId ?? undefined);
  const galleryPhotos = Array.isArray(photos) ? photos.filter((p: any) => p.category === "gallery") : [];

  const { data: dbTasks, isLoading: tasksLoading } = useListTasks(memberId ?? undefined);
  const { bodyMetricCards: weightCards, goals: progressGoals = [] } = useProgressDashboard(memberId ?? undefined);
  const proteinGoal = progressGoals.find((g: any) => g.metric === "protein")?.target ?? 180;

  const navItems = [
    { key: "home", label: t("home"), icon: <LayoutDashboard size={20} /> },
    { key: "workouts", label: t("workouts"), icon: <Dumbbell size={20} /> },
    { key: "nutrition", label: t("nutrition"), icon: <Utensils size={20} /> },
    { key: "progress", label: t("progress"), icon: <TrendingUp size={20} /> },
    { key: "coach_uploads", label: t("assessments"), icon: <Upload size={20} /> },
  ];

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { titleId: taskModalTitleId, descriptionId: taskModalDescriptionId } = useAccessibleDialog(
    isTaskModalOpen,
    taskModalRef,
    () => setIsTaskModalOpen(false)
  );

  const displayTasks = dbTasks || [];

  const taskStats = {
    total: displayTasks.length,
    completed: displayTasks.filter((t: any) => t.status === 'done').length,
    coach: displayTasks.filter((t: any) => t.coach_assigned || t.coachAssigned).length,
    personal: displayTasks.filter((t: any) => !t.coach_assigned && !t.coachAssigned).length,
  };

  const finishedWorkouts = displayTasks.filter((t: any) => t.type === "workout" && t.status === "done").length + workouts.filter((w: any) => w.status === "done" || w.done).length;
  const efficiency = displayTasks.length > 0 ? Math.round((displayTasks.filter((t: any) => t.status === "done").length / displayTasks.length) * 100) : 0;
  const finishedCount = useCountUp(finishedWorkouts, 1100);
  const effCount = useCountUp(efficiency, 1200);

  const filteredTasks = displayTasks.filter((task: any) => {
    switch (taskFilter) {
      case 'coach': return task.coach_assigned || task.coachAssigned;
      case 'personal': return !task.coach_assigned && !task.coachAssigned;
      case 'completed': return task.status === 'done';
      default: return true;
    }
  });
    const demoKeyRef = useRef<string | null>(null);
  const workoutTagKeyRef = useRef<string | null>(null);
  const settingsKeyRef = useRef<string | null>(null);
  const isEmptyDashboard =
    displayTasks.length === 0 &&
    workouts.length === 0 &&
    nutritionLogs.length === 0 &&
    galleryPhotos.length === 0 &&
    (!announcements || announcements.length === 0);
  const checklistItems = [
    { key: "profile", label: "Complete your profile", done: Boolean(currentMember?.name && memberCode) },
    { key: "workout", label: "Finish your first workout", done: workouts.length > 0 },
    { key: "meal", label: "Log your first meal", done: nutritionLogs.length > 0 },
    { key: "goal", label: "Set your first goal", done: workouts.length > 0 || nutritionLogs.length > 0 },
  ].filter(Boolean) as { key: string; label: string; done: boolean }[];
  const nextWorkoutTask = (displayTasks.find((task: any) => task.type === "workout" && task.status !== "done") || null) as any;
  const todayCalories = nutritionLogs.reduce((sum: number, entry: any) => sum + (entry.result?.totals?.calories || 0), 0);
  const todayProtein = nutritionLogs.reduce((sum: number, entry: any) => sum + (entry.result?.totals?.protein || 0), 0);
  const todayWorkoutCount = displayTasks.filter((task: any) => task.type === "workout" && task.status === "done").length + workouts.filter((w: any) => w.status === "done" || w.done).length;
  const workoutsInProgress = workouts.filter((w: any) => w.status === "in-progress" || w.status === "in_progress").length;
  const nutritionRisk = todayCalories > 0 && (todayCalories < 1600 || todayProtein < 120);
  const urgentItems = [
    nextWorkoutTask ? { key: "workout", label: "Workout pending", detail: nextWorkoutTask.title } : null,
    nutritionRisk ? { key: "nutrition", label: "Nutrition risk", detail: "Calories or protein too low today" } : null,
  ].filter(Boolean) as { key: string; label: string; detail: string }[];
  const dailyScoreValue = Math.min(
    100,
    Math.round(
      (taskStats.total ? (taskStats.completed / taskStats.total) * 45 : 15) +
      Math.min(todayCalories / 22, 35) +
      Math.min(todayProtein / 6, 20)
    )
  );
  const weightCard = weightCards?.find((m) => m.label === "Body Weight");
  const weightValue = weightCard?.latest?.value;
  const weightUnit = weightCard?.latest?.unit || "kg";
  const weightPoints = weightCard?.history || [];
  const weightDelta = weightCard?.trendValue ? `${weightCard.trendValue >= 0 ? "+" : ""}${weightCard.trendValue.toFixed(1)} ${weightUnit}` : "--";
  const statTrendCards = [
    { key: "weight", label: "Weight", value: weightValue ? `${weightValue} ${weightUnit}` : "--", delta: weightDelta, color: "#8B5CF6", points: weightPoints.length > 0 ? weightPoints : [83.7] },
    { key: "workouts", label: "Workouts in progress", value: `${workoutsInProgress}`, delta: "in progress", color: "#7CFC00", points: [0, 1, 1, 2, 1, 2, Math.max(workoutsInProgress, 1)] },
    { key: "calories", label: "Calories", value: `${todayCalories || 0} kcal`, delta: `${todayProtein || 0}g protein`, color: "#F59E0B", points: [1750, 1880, 1930, 2010, 1840, 2060, todayCalories || 1920] },
  ];
  const streakDays = Math.max(1, Math.min(30, workouts.length * 3 + taskStats.completed + (nutritionLogs.length > 0 ? 2 : 0)));
  const weeklyWorkoutGoal = 4;
  const weeklyChallenge: WeeklyChallenge = {
    title: "Momentum Builder",
    description: "Finish 4 meaningful actions this week across training and nutrition.",
    progress: Math.min(100, Math.round((((workouts.length * 2) + Math.min(nutritionLogs.length, 4)) / weeklyWorkoutGoal) * 100)),
    completed: ((workouts.length * 2) + Math.min(nutritionLogs.length, 4)) >= weeklyWorkoutGoal,
    helper: `${Math.min(workouts.length * 2 + nutritionLogs.length, weeklyWorkoutGoal)} of ${weeklyWorkoutGoal} actions done`,
  };
  const achievements: AchievementBadge[] = [
    {
      key: "first-workout",
      title: "First Workout",
      description: "You broke the seal and showed up for session one.",
      achieved: workouts.length > 0,
      icon: <Dumbbell size={20} />,
    },
    {
      key: "ten-workouts",
      title: "10 Workouts Completed",
      description: "Consistency is starting to compound in a real way.",
      achieved: workouts.length >= 10,
      icon: <Trophy size={20} />,
    },
    {
      key: "thirty-streak",
      title: "30-Day Streak",
      description: "Your momentum has turned into a real training habit.",
      achieved: streakDays >= 30,
      icon: <Flame size={20} />,
    },
    {
      key: "first-pr",
      title: "First PR",
      description: "A new best means you are clearly stronger than yesterday.",
      achieved: workouts.length >= 2,
      icon: <Star size={20} />,
    },
    {
      key: "early-bird",
      title: "Early Bird",
      description: "Up before the noise. Your first 5AM-style effort is on the board.",
      achieved: new Date().getHours() <= 5 && workouts.length > 0,
      icon: <Clock size={20} />,
    },
  ];
  const unlockedAchievements = achievements.filter((badge) => badge.achieved);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchWorkoutResults = SEARCH_WORKOUT_LIBRARY.filter((item) => {
    const matchesQuery =
      !normalizedSearchQuery ||
      item.title.toLowerCase().includes(normalizedSearchQuery) ||
      item.muscleGroup.toLowerCase().includes(normalizedSearchQuery) ||
      item.exercises.some((exercise) => exercise.toLowerCase().includes(normalizedSearchQuery)) ||
      [...item.tags, ...(workoutTags[item.id] || [])].some((tagValue) => tagValue.toLowerCase().includes(normalizedSearchQuery));
    const matchesMuscle = muscleFilter === "all" || item.muscleGroup === muscleFilter;
    const matchesDifficulty = difficultyFilter === "all" || item.difficulty === difficultyFilter;
    const matchesDuration =
      durationFilter === "all" ||
      (durationFilter === "short" && item.durationMinutes < 30) ||
      (durationFilter === "medium" && item.durationMinutes >= 30 && item.durationMinutes <= 45) ||
      (durationFilter === "long" && item.durationMinutes > 45);
    return matchesQuery && matchesMuscle && matchesDifficulty && matchesDuration;
  });
  const searchNutritionResults = nutritionLogs
    .map((entry: any, index: number) => ({
      id: `${entry.id || index}`,
      title: entry.meal_type || entry.result?.category || `Meal ${index + 1}`,
      subtitle: `${entry.result?.totals?.calories || 0} kcal • ${entry.result?.totals?.protein || 0}g protein`,
    }))
    .filter((item) => !normalizedSearchQuery || `${item.title} ${item.subtitle}`.toLowerCase().includes(normalizedSearchQuery));
  const searchExerciseResults = EXERCISE_LIBRARY.filter((item) => {
    const matchesQuery =
      !normalizedSearchQuery ||
      item.name.toLowerCase().includes(normalizedSearchQuery) ||
      item.muscleGroup.toLowerCase().includes(normalizedSearchQuery) ||
      item.difficulty.toLowerCase().includes(normalizedSearchQuery);
    const matchesMuscle = muscleFilter === "all" || item.muscleGroup === muscleFilter;
    return matchesQuery && matchesMuscle;
  });
  const goalItems = [
    { key: "renewal", label: "Subscription runway", value: memberStatus === "expired" ? `Expired ${Math.abs(rawDaysRemaining)} days ago` : `${daysRemaining} of ${totalDays} days left`, urgent: daysLow },
    { key: "protein", label: "Protein target", value: `${todayProtein}g of ${proteinGoal}g`, urgent: nutritionRisk },
  ];
  const celebrationSignature = `${unlockedAchievements.map((badge) => badge.key).join("|")}:${weeklyChallenge.completed ? "challenge" : "in-progress"}:${dailyScoreValue >= 90 ? "score" : "score-pending"}`;
  
  useEffect(() => {
    if (!refreshedMember || !memberCode) return;
    const hasChanged =
      !currentMember ||
      refreshedMember.start_date !== currentMember.start_date ||
      refreshedMember.sub_expiry_date !== currentMember.sub_expiry_date ||
      refreshedMember.membership_type !== currentMember.membership_type;

    if (hasChanged) {
      setMemberAuth(memberCode, refreshedMember);
    }
  }, [currentMember, memberCode, refreshedMember, setMemberAuth]);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setHydrated(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isPrivate && activeNav === "coach") {
      setActiveNav("home");
    }
  }, [activeNav, isPrivate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentMember) {
      // Again, replace "/" with your main website's URL
      window.location.replace("/");
      return;
    }
    setMemberId(currentMember.id);
    const d = new Date();
    setDateRange(`${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.getFullYear()}`);
  }, [currentMember, router, hydrated]);

  useEffect(() => {
    if (!hydrated || !currentMember) return;
    demoKeyRef.current = `fitlift:demo:${currentMember.id}`;
    workoutTagKeyRef.current = `fitlift:workout-tags:${currentMember.id}`;
    settingsKeyRef.current = `fitlift:dashboard-settings:${currentMember.id}`;
    const demoEnabled = window.localStorage.getItem(demoKeyRef.current) === "on";
    const storedTags = workoutTagKeyRef.current ? window.localStorage.getItem(workoutTagKeyRef.current) : null;
    const storedSettings = settingsKeyRef.current ? window.localStorage.getItem(settingsKeyRef.current) : null;
    setDemoMode(demoEnabled);
    if (storedTags) {
      try {
        setWorkoutTags(normalizeWorkoutTags(JSON.parse(storedTags)));
      } catch {
        setWorkoutTags({});
      }
    }
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setThemeMode("dark");
        setUnitPreference(parsed.unitPreference || "kg");
        setWidgetOrder(normalizeWidgetOrder(parsed.widgetOrder));
      } catch {
        setThemeMode("dark");
        setUnitPreference("kg");
        setWidgetOrder(DEFAULT_WIDGET_ORDER);
      }
    }
  }, [hydrated, currentMember, isEmptyDashboard]);

  useEffect(() => {
    if (!hydrated) return;
    if (!lastCelebrationRef.current) {
      lastCelebrationRef.current = celebrationSignature;
      return;
    }
    if (lastCelebrationRef.current === celebrationSignature) return;
    lastCelebrationRef.current = celebrationSignature;
    if (prefersReducedMotion || disableHeavyAnimations) {
      return;
    }

    import("canvas-confetti")
      .then(({ default: confetti }) => {
        confetti({
          particleCount: 140,
          spread: 78,
          origin: { y: 0.65 },
          colors: ["#7CFC00", "#F59E0B", "#FFFFFF"],
        });
      })
      .catch(() => {
        // Quiet fallback keeps the UI responsive even if the celebration bundle fails.
      });
  }, [celebrationSignature, hydrated, prefersReducedMotion, disableHeavyAnimations, weeklyChallenge.completed]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.setAttribute("data-dashboard-theme", "dark");
    if (settingsKeyRef.current) {
      window.localStorage.setItem(settingsKeyRef.current, JSON.stringify({ themeMode: "dark", unitPreference, widgetOrder: normalizeWidgetOrder(widgetOrder) }));
    }
  }, [hydrated, themeMode, unitPreference, widgetOrder]);

  useEffect(() => {
    if (!hydrated) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hydrated]);

  const enableDemoMode = (target: "home" | "workouts" | "nutrition") => {
    setDemoMode(true);
    if (demoKeyRef.current) window.localStorage.setItem(demoKeyRef.current, "on");
    setActiveNav(target);
    toast.success("Demo mode enabled.");
  };

  const disableDemoMode = () => {
    setDemoMode(false);
    if (demoKeyRef.current) window.localStorage.removeItem(demoKeyRef.current);
    toast.success("Back to your live dashboard.");
  };


  const toggleHomeSection = (key: string) => {
    setHomeSections((current) => ({ ...current, [key]: !current[key as keyof typeof current] }));
  };

  const addWorkoutTag = (workoutId: string, tag: string) => {
    setWorkoutTags((current) => {
      const normalizedTag = tag.trim().toLowerCase();
      if (!normalizedTag) return current;
      const next = {
        ...current,
        [workoutId]: normalizeWorkoutTagList([...(current[workoutId] || []), normalizedTag]),
      };
      if (workoutTagKeyRef.current) {
        window.localStorage.setItem(workoutTagKeyRef.current, JSON.stringify(next));
      }
      toast.success(`Saved #${normalizedTag} to this workout.`);
      return next;
    });
  };

  const moveWidget = (key: HomeSectionKey, direction: "up" | "down") => {
    setWidgetOrder((current) => {
      const index = current.indexOf(key);
      if (index === -1) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = normalizeWidgetOrder(current);
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center">
        <div className="w-full max-w-3xl px-6">
          <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 24 }}>
            <SkeletonBlock width={220} height={28} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <SkeletonBlock width="100%" height={180} style={{ background: "#1C1C21" }} />
              <SkeletonBlock width="100%" height={180} style={{ background: "#1C1C21" }} />
            </div>
            <SkeletonBlock width="100%" height={260} style={{ marginTop: 16, background: "#1C1C21" }} />
            <div className="text-sm text-[var(--color-text-secondary)] mt-4">Loading your dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(memberCode);
    setCopied(true);
    setLiveAnnouncement(t("copiedMembershipCode"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutMember();
    // Replace "/" with the actual URL path of your main website.
    // Using window.location breaks the SPA history loop.
    window.location.replace("/"); 
  };

  const cardVariants = {
    hidden: { opacity: 0, y: disableHeavyAnimations ? 0 : 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: disableHeavyAnimations ? 0 : i * 0.05, duration: disableHeavyAnimations ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] },
    }),
  };

  return (
    <div
      className={cn("cd-root min-h-screen flex flex-col overflow-hidden", disableHeavyAnimations && "reduced-motion")}
      style={{ fontFamily: "'Inter', sans-serif", background: "var(--dashboard-bg)", color: "var(--dashboard-text-primary)" }}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        unitPreference={unitPreference}
        onUnitPreferenceChange={setUnitPreference}
      />
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        activeType={searchType}
        onTypeChange={setSearchType}
        muscleFilter={muscleFilter}
        onMuscleFilterChange={setMuscleFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyFilterChange={setDifficultyFilter}
        durationFilter={durationFilter}
        onDurationFilterChange={setDurationFilter}
        workoutResults={searchWorkoutResults}
        nutritionResults={searchNutritionResults}
        exerciseResults={searchExerciseResults}
        workoutTags={workoutTags}
        onAddTag={addWorkoutTag}
        onNavigate={(tab) => setActiveNav(tab)}
      />
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

        {/* ─── Left Sidebar (Desktop Only) ─────────────────────────────────── */}
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
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src="/images/logo.png"
                alt="Fit & Lift"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "2px", color: "#FFFFFF" }}>
              FIT & LIFT
            </span>
          </div>

          {/* Nav */}
          <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item, index) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  ref={(element) => { sideNavRefs.current[index] = element; }}
                  onClick={() => setActiveNav(item.key)}
                  onKeyDown={(event) => moveFocusWithArrows(event, sideNavRefs.current.filter(Boolean) as HTMLButtonElement[], "vertical")}
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
                    color: isActive ? "#7CFC00" : SECONDARY_TEXT_COLOR,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.2s ease",
                  }}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${item.label} tab`}
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
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                marginBottom: 4,
              }}
            >
              <HelpCircle size={18} />
              {t("helpSupport")}
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
              {t("logOut")}
            </button>
          </div>
        </aside>

        {/* ─── Main Content ──────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 w-full overflow-y-auto pb-32 lg:pb-8 px-4 lg:px-8">

          {/* ── Header (date + icons only, no greeting) ── */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 24,
              gap: 12,
            }}
          >
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>{dateRange}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  padding: "8px 12px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.24)",
                  color: "#EF4444",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                aria-label={t("logOut")}
              >
                <LogOut size={14} />
                {t("logOut")}
              </button>
              {demoMode && (
                <button
                  type="button"
                  onClick={disableDemoMode}
                  style={{
                    minHeight: 36,
                    borderRadius: 999,
                    border: "1px solid rgba(139,92,246,0.24)",
                    background: "rgba(139,92,246,0.14)",
                    color: "#DDD6FE",
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Demo Mode On
                </button>
              )}
              <div
                role="group"
                aria-label="Toggle language"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  height: 40,
                  padding: 4,
                  borderRadius: 999,
                  background: "#111114",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  aria-pressed={language === "en"}
                  style={{
                    minWidth: 52,
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: language === "en" ? "#7CFC00" : "transparent",
                    color: language === "en" ? "#111114" : "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: 800,
                    transition: "all 0.2s ease",
                  }}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ar")}
                  aria-pressed={language === "ar"}
                  style={{
                    minWidth: 52,
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: language === "ar" ? "#7CFC00" : "transparent",
                    color: language === "ar" ? "#111114" : "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: 800,
                    transition: "all 0.2s ease",
                  }}
                >
                  عربي
                </button>
              </div>
              <button
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--color-text-secondary)",
                }}
                onClick={() => setIsSettingsOpen(true)}
                aria-label={t("openSettings")}
              >
                <Settings size={16} />
              </button>
            </div>
          </motion.div>

          {/* ── Unified Member Card ───────────────────────────────────────────── */}
          {activeNav === "home" && (
            <DashboardErrorBoundary label="Dashboard">
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              style={{
                background: "#16161A",
                border: `1px solid ${isPrivate ? "rgba(124,252,0,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 20,
                padding: 24,
                marginBottom: 24,
              }}
            >
            {/* Top: Greeting + Badges */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#888888", lineHeight: 1.3 }}>
                       , أهلا
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: 0.5 }}>
                        {memberName}
                      </div>
                      {isPrivate && (
                        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 3 }}>
                          Private coaching active — keep pushing
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {/* Status badge — dynamic */}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: memberStatus === "active"
                          ? "rgba(16,185,129,0.15)"
                          : memberStatus === "expiring_soon"
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: memberStatus === "active"
                          ? "#10B981"
                          : memberStatus === "expiring_soon"
                          ? "#F59E0B"
                          : "#EF4444",
                        borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: memberStatus === "active" ? "#10B981" : memberStatus === "expiring_soon" ? "#F59E0B" : "#EF4444" }} />
                        {memberStatus === "active" ? "Active" : memberStatus === "expiring_soon" ? "Expiring Soon" : "Expired"}
                      </div>
                      {/* Plan badge */}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: memberStatus === "active" ? "#7CFC00" : "rgba(139,92,246,0.15)",
                        color: memberStatus === "active" ? "#000" : "#8B5CF6",
                        borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: memberStatus === "active" ? 700 : 600,
                      }}>
                        <Crown size={10} color={memberStatus === "active" ? "#000" : "#8B5CF6"} />
                        {memberType}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

              {/* Member ID + Join Date row */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>
                    {t("memberId")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#7CFC00", fontFamily: "monospace" }}>
                      {memberCode}
                    </span>
                    <button
                      onClick={handleCopy}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: copied ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${copied ? "rgba(124,252,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: copied ? "#7CFC00" : "#5A5A5A", transition: "all 0.2s",
                        minWidth: TOUCH_TARGET_SIZE,
                        minHeight: TOUCH_TARGET_SIZE,
                      }}
                      aria-label={copied ? t("copiedMembershipCode") : t("copyMembershipCode")}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>
                    {t("startDate")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                    {memberStatus === "expired" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.24)", borderRadius: 999, padding: "2px 8px" }}>
                        {language === "ar" ? "منتهي" : "Expired"}
                      </span>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 500, color: currentMember?.start_date ? "#FFFFFF" : "var(--color-text-secondary)" }}>
                      {formattedStartDate || (language === "ar" ? "مش مشترك لسه" : "--")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Bar */}
              <div style={{ marginBottom: isPrivate ? 20 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "1.2px" }}>
                    {t("plan", { type: memberType })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {daysLow && <AlertTriangle size={12} color={memberStatus === "expired" ? "#EF4444" : "#F59E0B"} />}
                    <span style={{ fontSize: 13, color: daysLow ? (memberStatus === "expired" ? "#EF4444" : "#F59E0B") : "var(--color-text-secondary)", fontWeight: daysLow ? 600 : 400 }}>
                      {memberStatus === "expired"
                        ? t("expiredDaysAgo", { count: Math.abs(rawDaysRemaining) })
                        : memberStatus === "expiring_soon"
                        ? t("daysLeft", { count: daysRemaining })
                        : t("daysProgress", { remaining: daysRemaining, total: totalDays })}
                    </span>
                  </div>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${memberStatus === "expired" ? 0 : (daysRemaining / totalDays) * 100}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                    style={{ height: "100%", background: memberStatus === "active" ? "#7CFC00" : memberStatus === "expiring_soon" ? "#F59E0B" : "#EF4444", borderRadius: 4 }}
                  />
                </div>
                {/* Start & Expiry dates */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  {startDate && (
                    <div>
                      <div style={{ fontSize: 9, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.8px" }}>{t("start")}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        {startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  )}
                  {expiryDate && (
                    <div style={{ textAlign: startDate ? "right" : "left" }}>
                      <div style={{ fontSize: 9, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.8px" }}>{t("expires")}</div>
                      <div style={{ fontSize: 12, color: daysLow ? (memberStatus === "expired" ? "#EF4444" : "#F59E0B") : "var(--color-text-secondary)", fontWeight: 500 }}>
                        {expiryDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  )}
                </div>
                {daysLow && (
                  <div style={{ fontSize: 12, color: memberStatus === "expired" ? "#EF4444" : "#F59E0B", marginTop: 6 }}>
                    {memberStatus === "expired"
                      ? t("subscriptionExpired")
                      : t("subscriptionExpiring")}
                  </div>
                )}
                              {/* Renew Now Button — shows when ≤5 days remaining or expired */}
                {(daysRemaining <= 5 || memberStatus === "expired") && (
                  <motion.a
                    href={`https://wa.me/${GYM_WHATSAPP}?text=${encodeURIComponent(`Hi, I'd like to renew my ${memberType} membership (${memberCode}). My plan expires ${memberStatus === "expired" ? `(${Math.abs(rawDaysRemaining)} days ago)` : `in ${daysRemaining} days`}.`)}}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      marginTop: 12,
                      padding: "13px 20px",
                      background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                      borderRadius: 14,
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: "none",
                      cursor: "pointer",
                      border: "none",
                      boxShadow: "0 4px 16px rgba(76, 175, 80, 0.25)",
                      width: "100%",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    <WhatsAppIcon size={18} color="#FFFFFF" />
                    {t("renewNow")}
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        fontSize: 10,
                        background: "rgba(255,255,255,0.25)",
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {memberStatus === "expired" ? t("urgent") : t("daysLeftShort", { count: daysRemaining })}
                    </motion.span>
                  </motion.a>
                )}  
              </div>

              {/* Coach Row (private only) */}
              {isPrivate && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative" }}>
                        <Avatar
                          name={CLIENT_DATA.coach.name}
                          size={40}
                          isCoach
                          ring
                          ringColor="#7CFC00"
                          fontSize={14}
                        />
                        <div style={{
                          position: "absolute", bottom: 1, right: 1,
                          width: 9, height: 9, borderRadius: "50%",
                          background: CLIENT_DATA.coach.isOnline ? "#7CFC00" : "#5A5A5A",
                          border: "2px solid #16161A",
                        }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>
                          {CLIENT_DATA.coach.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#7CFC00", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CFC00" }}
                          />
                          {t("onlineWatching")}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveNav("home")}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(124,252,0,0.1)",
                        border: "1px solid rgba(124,252,0,0.25)",
                        borderRadius: 10, padding: "8px 14px",
                        color: "#7CFC00", fontSize: 13, fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {t("viewDashboard")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
            </DashboardErrorBoundary>
          )}

          {/* ── Gym Updates & Announcements ──────────────────────────────────── */}
          {activeNav === "home" && (
            <DashboardErrorBoundary label="Dashboard">
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              style={{
                background: "#16161A",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <Bell size={24} color="#7CFC00" />
                <span style={{ fontSize: 20, fontWeight: 600, color: "#FFFFFF" }}>{t("gymUpdates")}</span>
              </div>

              {(announcementsLoading || photosLoading) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <SkeletonBlock width="42%" height={18} />
                  <SkeletonBlock width="100%" height={88} style={{ background: "#1C1C21" }} />
                  <SkeletonBlock width="100%" height={88} style={{ background: "#1C1C21" }} />
                  <SkeletonBlock width="36%" height={18} style={{ marginTop: 10 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <SkeletonBlock key={index} width="100%" height={120} style={{ background: "#1C1C21" }} />
                    ))}
                  </div>
                </div>
              )}

              {!announcementsLoading && !photosLoading && announcements && announcements.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginBottom: 16 }}>
                    {t("latestAnnouncements")}
                  </div>
                  <LazyRenderSection
                    minHeight={184}
                    fallback={<SkeletonBlock width="100%" height={184} style={{ background: "#1C1C21" }} />}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {announcements.slice(0, showAllAnnouncements ? announcements.length : 3).map((announcement: any) => (
                        <motion.div
                          key={announcement.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderRadius: 12,
                            padding: 16,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: "#7CFC00", marginTop: 6, flexShrink: 0,
                            }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>
                                {announcement.title}
                              </div>
                              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                                {announcement.content}
                              </div>
                              <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
                                {new Date(announcement.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </LazyRenderSection>
                  {announcements.length > 3 && (
                    <button
                      onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}
                      style={{
                        marginTop: 12,
                        padding: "8px 16px",
                        background: "rgba(124,252,0,0.1)",
                        border: "1px solid rgba(124,252,0,0.2)",
                        borderRadius: 8,
                        color: "#7CFC00",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        opacity: 0.7,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
                    >
                      {showAllAnnouncements ? t("seeLess") : t("seeMore")}
                    </button>
                  )}
                </div>
              )}


              {!announcementsLoading && !photosLoading && (!announcements || announcements.length === 0) && (!photos || photos.length === 0) && (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>
                    {t("dashboardReady")}
                  </div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                    {t("dashboardReadyBody")}
                  </div>
                </div>
              )}
            </motion.div>
            </DashboardErrorBoundary>
          )}

          {activeNav === "home" && !isEmptyDashboard && (
            <DashboardErrorBoundary label="Dashboard">
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}
              >
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-4">


                  <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "#10B981", fontWeight: 800 }}>{t("todaysNutrition")}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 4 }}>{todayCalories} kcal</div>
                      </div>
                      {nutritionRisk && (
                        <div style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.24)", color: "#FCA5A5", fontSize: 12, fontWeight: 800 }}>
                          {t("urgentBadge")}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                      <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t("protein")}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginTop: 4 }}>{todayProtein}g</div>
                      </div>
                      <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t("mealsLogged")}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginTop: 4 }}>{nutritionLogs.length}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav("nutrition")}
                      style={{ minHeight: 44, width: "100%", marginTop: 16, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.22)", background: "rgba(16,185,129,0.1)", color: "#86EFAC", fontWeight: 700, cursor: "pointer" }}
                    >
                      {t("openNutrition")}
                    </button>
                  </div>
                </div>


                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {urgentItems.map((item) => (
                    <div
                      key={item.key}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.18)",
                        color: "#FCA5A5",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>{item.label}: {item.detail}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {statTrendCards.map((card) => (
                    <div key={card.key} style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{card.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 6 }}>{card.value}</div>
                          <div style={{ fontSize: 12, color: card.color, marginTop: 4, fontWeight: 700 }}>{card.delta}</div>
                        </div>
                        <Sparkline points={card.points} color={card.color} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {false && <HomeSectionCard
                    title="Workout Summary"
                    sectionKey="workoutSummary"
                    isOpen={homeSections.workoutSummary}
                    onToggle={toggleHomeSection}
                    badge={nextWorkoutTask ? <span style={{ padding: "4px 8px", borderRadius: 999, background: "rgba(124,252,0,0.12)", color: "#D9FFBF", fontSize: 11, fontWeight: 800 }}>Next Up</span> : undefined}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {filteredTasks.filter((task: any) => task.type === "workout").slice(0, 3).map((task: any) => (
                        <div key={task.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{task.title}</div>
                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>{task.duration} • {task.assignedBy || "Self paced"}</div>
                          </div>
                          <div style={{ padding: "5px 10px", borderRadius: 999, background: task.status === "done" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.12)", color: task.status === "done" ? "#6EE7B7" : "#FCD34D", fontSize: 11, fontWeight: 800 }}>
                            {task.status === "done" ? "Done" : "Pending"}
                          </div>
                        </div>
                      ))}
                      {filteredTasks.filter((task: any) => task.type === "workout").length === 0 && (
                        <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>No workout tasks yet. Open the workouts tab to schedule your first one.</div>
                      )}
                    </div>
                  </HomeSectionCard>}

                  <HomeSectionCard
                    title={t("goals")}
                    sectionKey="goals"
                    isOpen={homeSections.goals}
                    onToggle={toggleHomeSection}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {goalItems.map((item) => (
                        <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 14, background: item.urgent ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)", border: item.urgent ? "1px solid rgba(239,68,68,0.16)" : "1px solid rgba(255,255,255,0.04)" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>{item.value}</div>
                          </div>
                          {item.urgent && <span style={{ padding: "4px 8px", borderRadius: 999, background: "rgba(239,68,68,0.12)", color: "#FCA5A5", fontSize: 10, fontWeight: 800 }}>{t("urgentBadge")}</span>}
                        </div>
                      ))}
                    </div>
                  </HomeSectionCard>
                </div>
              </motion.div>
            </DashboardErrorBoundary>
          )}

          {activeNav === "home" && isEmptyDashboard && (
            <DashboardErrorBoundary label="Dashboard">
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(124,252,0,0.12), rgba(22,22,26,0.96))",
                    border: "1px solid rgba(124,252,0,0.18)",
                    borderRadius: 20,
                    padding: 20,
                    minHeight: 220,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(124,252,0,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Play size={20} color="#7CFC00" />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{t("homeEmptyTitle")}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                        {t("homeEmptyBody")}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "#E5E7EB" }}>
                    {t("homeEmptyBody2")}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "auto" }}>
                    <button
                      type="button"
                      onClick={() => enableDemoMode("workouts")}
                      style={{ minHeight: 44, padding: "10px 14px", borderRadius: 12, border: "none", background: "#7CFC00", color: "#111114", fontWeight: 800, cursor: "pointer" }}
                    >
                      {t("tryDemoWorkout")}
                    </button>
                    <button
                      type="button"
                      onClick={() => enableDemoMode("nutrition")}
                      style={{ minHeight: 44, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}
                    >
                      {t("tryDemoNutrition")}
                    </button>
                  </div>
                </div>

                {isPrivate && (
                  <div
                    style={{
                      background: "#16161A",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 20,
                      padding: 20,
                      minHeight: 220,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <Avatar name={CLIENT_DATA.coach.name} size={44} isCoach ring ringColor="#7CFC00" fontSize={14} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{t("meetCoach", { name: CLIENT_DATA.coach.name })}</div>
                        <div style={{ fontSize: 12, color: "#7CFC00", marginTop: 4 }}>{t("coachReady")}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-secondary)", marginBottom: 16 }}>
                      {t("welcomeFitLift")}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav("home")}
                      style={{ minHeight: 44, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(124,252,0,0.22)", background: "rgba(124,252,0,0.1)", color: "#7CFC00", fontWeight: 700, cursor: "pointer" }}
                    >
                      {t("viewDashboard")}
                    </button>
                  </div>
                )}

                <div
                  style={{
                    background: "#16161A",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 20,
                    padding: 20,
                    minHeight: 220,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 14 }}>{t("getStartedChecklist")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {checklistItems.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: item.done ? "rgba(124,252,0,0.08)" : "rgba(255,255,255,0.03)",
                          border: item.done ? "1px solid rgba(124,252,0,0.14)" : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: item.done ? "#7CFC00" : "rgba(255,255,255,0.06)",
                            color: item.done ? "#111114" : "var(--color-text-secondary)",
                            flexShrink: 0,
                          }}
                        >
                          {item.done ? <Check size={13} /> : <Clock size={13} />}
                        </div>
                        <div style={{ fontSize: 14, color: item.done ? "#FFFFFF" : "var(--color-text-secondary)" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </DashboardErrorBoundary>
          )}

          {/* ── Tabs Content ─────────────────────────────────────────────────── */}
          {activeNav === "workouts" && (
            <DashboardErrorBoundary label="Workouts">
              <WorkoutsTab isPrivate={isPrivate} memberId={memberId!} unitPreference={unitPreference} />
            </DashboardErrorBoundary>
          )}

          {activeNav === "nutrition" && (
            <DashboardErrorBoundary label="Nutrition">
              <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={0} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <NutritionTab isPrivate={isPrivate} memberId={memberId!} demoMode={demoMode} />
              </motion.div>
            </DashboardErrorBoundary>
          )}

          {activeNav === "progress" && (
            <DashboardErrorBoundary label="Progress">
              <ProgressTab isPrivate={isPrivate} memberId={memberId!} />
            </DashboardErrorBoundary>
          )}

          {activeNav === "coach_uploads" && (
            <DashboardErrorBoundary label="Assessments">
              <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={0} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CoachUploadsTab isPrivate={isPrivate} memberId={memberId!} />
              </motion.div>
            </DashboardErrorBoundary>
          )}

          {isPrivate && activeNav === "coach" && (
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
                      {t("onlineWatching")}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>Certified Personal Trainer · 5+ years exp.</div>
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
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6, borderLeft: "3px solid #7CFC00", paddingLeft: 16 }}>
                  Specializes in strength & hypertrophy training. Your coach is here to guide you through workouts, nutrition, and accountability.
                </div>
              </div>
            </motion.div>
          )}
        </main>

      </div>

      <MobileBottomNav activeNav={activeNav} setActiveNav={setActiveNav} onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* ─── Task Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setIsTaskModalOpen(false)} aria-hidden="true">
            <motion.div
              ref={taskModalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(event) => event.stopPropagation()}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={taskModalTitleId}
              aria-describedby={taskModalDescriptionId}
              tabIndex={-1}
            >
              <h2 id={taskModalTitleId} style={{ color: "#FFF", marginBottom: 8 }}>{editingTask ? (language === "ar" ? "تعديل المهمة" : "Edit Task") : t("addTask")}</h2>
              <p id={taskModalDescriptionId} className="sr-only">{language === "ar" ? "نافذة تعديل المهمة. اضغط Escape للإغلاق." : "Task editor dialog. Press Escape to close the dialog."}</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                setTaskFormError(null);
                const formData = new FormData(e.currentTarget);
                const title = String(formData.get("title") || "").trim();
                const type = String(formData.get("type") || "workout");
                const duration = String(formData.get("duration") || "").trim();
                if (title.length < 3) {
                  setTaskFormError(language === "ar" ? "عنوان المهمة لازم يكون ٣ حروف على الأقل." : "Task title should be at least 3 characters.");
                  return;
                }
                if (!duration) {
                  setTaskFormError(language === "ar" ? "اكتب مدة زي 15 min أو All Day." : "Add a duration like 15 min or All Day.");
                  return;
                }
                if (editingTask) {
                  updateTaskMutation.mutate(
                    { id: editingTask.id, data: { title, type, duration } },
                    {
                      onSuccess: () => {
                        toast.success(language === "ar" ? "اتحدثت المهمة." : "Task updated.");
                        setIsTaskModalOpen(false);
                      },
                      onError: (error) => setTaskFormError(getErrorMessage(error, language === "ar" ? "ماقدرناش نحدّث المهمة دلوقتي." : "Couldn't update that task right now."))
                    }
                  );
                } else {
                  createTaskMutation.mutate(
                    { member_id: memberId!, title, type, duration, status: "todo", coach_assigned: false },
                    {
                      onSuccess: () => {
                        toast.success(language === "ar" ? "اتعملت المهمة." : "Task created.");
                        setIsTaskModalOpen(false);
                      },
                      onError: (error) => setTaskFormError(getErrorMessage(error, language === "ar" ? "ماقدرناش نعمل المهمة دلوقتي." : "Couldn't create that task right now."))
                    }
                  );
                }
              }}>
                {taskFormError && (
                  <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#FCA5A5", fontSize: 13 }}>
                    {taskFormError}
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: SECONDARY_TEXT_COLOR, fontSize: 13, marginBottom: 8 }}>{language === "ar" ? "عنوان المهمة" : "Task Title"}</label>
                  <input aria-label={language === "ar" ? "عنوان المهمة" : "Task title"} name="title" defaultValue={editingTask?.title || ""} required style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: SECONDARY_TEXT_COLOR, fontSize: 13, marginBottom: 8 }}>{language === "ar" ? "النوع" : "Type"}</label>
                  <select aria-label="Task type" name="type" defaultValue={editingTask?.type || "workout"} style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }}>
                    <option value="workout">{language === "ar" ? "تمرين" : "Workout"}</option>
                    <option value="nutrition">{language === "ar" ? "تغذية" : "Nutrition"}</option>
                    <option value="recovery">{language === "ar" ? "استشفاء" : "Recovery"}</option>
                  </select>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: SECONDARY_TEXT_COLOR, fontSize: 13, marginBottom: 8 }}>{language === "ar" ? "المدة" : "Duration"}</label>
                  <input aria-label={language === "ar" ? "مدة المهمة" : "Task duration"} name="duration" defaultValue={editingTask?.duration || "15 min"} required style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer", minHeight: TOUCH_TARGET_SIZE }}>{t("cancel")}</button>
                  <button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending} style={{ flex: 1, padding: 12, background: "#7CFC00", color: "#000", fontWeight: 600, border: "none", borderRadius: 8, cursor: "pointer", minHeight: TOUCH_TARGET_SIZE }}>{t("save")}</button>
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
            {navItems.slice(0, 2).map((item, index) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  ref={(element) => { bottomNavRefs.current[index] = element; }}
                  onClick={() => setActiveNav(item.key)}
                  onKeyDown={(event) => moveFocusWithArrows(event, bottomNavRefs.current.filter(Boolean) as HTMLButtonElement[])}
                  className="flex flex-col items-center gap-0.5 py-2 flex-1"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${item.label} tab`}
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
                  width: 58, height: 58, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7CFC00, #39FF14)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 -4px 20px rgba(124,252,0,0.5), 0 4px 16px rgba(0,0,0,0.5)",
                  marginTop: -22,
                  WebkitTapHighlightColor: "transparent",
                } as React.CSSProperties}
                aria-label="Open quick log menu"
              >
                <Plus size={26} color="#000" strokeWidth={2.5} />
              </motion.button>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#7CFC00", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>Log</span>
            </div>

            {navItems.slice(2).map((item, offset) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  ref={(element) => { bottomNavRefs.current[offset + 2] = element; }}
                  onClick={() => setActiveNav(item.key)}
                  onKeyDown={(event) => moveFocusWithArrows(event, bottomNavRefs.current.filter(Boolean) as HTMLButtonElement[])}
                  className="flex flex-col items-center gap-0.5 py-2 flex-1"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${item.label} tab`}
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

    
    </div>
  );
}
