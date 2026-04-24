"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CoachLayout } from "@/components/layout/CoachLayout";
import { useListMembers, useUpdateMember, useSearchUnassignedMembers, useAssignMember, useCreateWorkout } from "@/lib/api-hooks";
import { useClientContext } from "@/lib/use-client-context";
import { Button, Badge, Input, Label } from "@/components/ui/PremiumComponents";
import {
  Users, Activity,
  MessageSquare, ChevronLeft, ChevronRight,
  Tag, Calendar, Smartphone, User, Star,
  Search, Edit2, UserPlus, X, Plus,
  Flame,
  Utensils, ChevronRight as ArrowRight,
  Upload,
  Dumbbell,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/use-auth";
import type { Member } from "@/lib/supabase";
import {
  displayOrFallback,
  getDisplayInitial,
  normalizeMaybeMojibake,
} from "@/lib/text";
import { useCoachLanguage } from "@/lib/coach-language";
import UploadsTab from "./UploadsTab";

interface AssignmentMeasurementFields {
  weight: string;
  chest: string;
  waist: string;
  hips: string;
  arms: string;
  thighs: string;
}

interface AssignmentPreviewFile {
  file: File;
  previewUrl: string | null;
}

/* Semi-circle Gauge for Nutrition */
function SemiGauge({ percent = 95.5 }: { percent?: number }) {
  const w = 200, h = 100, r = 80;
  const cx = w / 2, cy = h;
  const circ = Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={12} strokeLinecap="round" />
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7CFC00" />
          <stop offset="75%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Status colour for client cards */
function clientStatus(m: Member) {
  return new Date(m.sub_expiry_date) > new Date() ? "#7CFC00" : "#ef4444";
}

const MAX_PRIVATE_ROSTER = 11;

function buildPrivateRoster(members: Member[]) {
  const preferredName = "zooksh";
  const prioritized = [...members].sort((a, b) => {
    const aPriority = a.name.trim().toLowerCase() === preferredName ? 0 : 1;
    const bPriority = b.name.trim().toLowerCase() === preferredName ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.name.localeCompare(b.name);
  });

  return prioritized.slice(0, MAX_PRIVATE_ROSTER);
}

/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â
   MAIN PAGE
   ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */
export default function CoachDashboard() {
  const router = useRouter();
  const { currentCoach, coachToken } = useAuth();
  const { setSelectedClient } = useClientContext();
  const { t, isRTL, language, setLanguage, formatNumber } = useCoachLanguage();
  const { data: membersPage, refetch: refetchMembers } = useListMembers(1, undefined, undefined, undefined, { pageSize: "all" });
  const updateMemberMutation = useUpdateMember();

  const members: Member[] = membersPage?.members || [];
  const privateRoster = buildPrivateRoster(members);
  const totalMembers = privateRoster.length;
  const currentPage = membersPage?.page || 1;
  const totalPages = membersPage?.totalPages || 1;

  /* UI State */
  const [activeTab, setActiveTab] = useState<"dashboard" | "uploads">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(50); // Show 50 at a time in table

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Daily calorie totals from Nutrition Tracker (localStorage) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [clientGoals, setClientGoals] = useState<Record<string, number>>({});
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        const key = `fitgym_cal_totals_${new Date().toISOString().split("T")[0]}`;
        const raw = localStorage.getItem(key);
        if (raw) setDailyTotals(JSON.parse(raw));
        const goalsRaw = localStorage.getItem("fitgym_client_goals");
        if (goalsRaw) setClientGoals(JSON.parse(goalsRaw));
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isSendingRenewalReminder, setIsSendingRenewalReminder] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Member>>({});
  const [selectedMemberForWorkout, setSelectedMemberForWorkout] = useState<Member | null>(null);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState<Member | null>(null);
  const [workoutFormData, setWorkoutFormData] = useState({
    title: "",
    duration: "45 min",
    difficulty: "Medium",
    calories: 300,
    muscles: [] as string[],
    exercises: [] as Array<{ exercise: string; sets: number; reps: string; weight: number; unit: string }>,
  });
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentPreviewFile[]>([]);
  const [assignmentMeasurements, setAssignmentMeasurements] = useState<AssignmentMeasurementFields>({
    weight: "",
    chest: "",
    waist: "",
    hips: "",
    arms: "",
    thighs: "",
  });
  const [showMeasurementFields, setShowMeasurementFields] = useState(true);
  const [assignmentUploadProgress, setAssignmentUploadProgress] = useState(0);
  const [assignmentError, setAssignmentError] = useState("");
  const [isSendingAssignment, setIsSendingAssignment] = useState(false);
  const assignmentInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Search & Assign Unassigned Members ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [debouncedAssignSearch, setDebouncedAssignSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAssignSearch(assignSearchQuery), 500);
    return () => clearTimeout(t);
  }, [assignSearchQuery]);

  const { data: unassignedPage, isLoading: isSearchingUnassigned } = useSearchUnassignedMembers(debouncedAssignSearch);
  const unassignedMembers = unassignedPage?.members || [];
  const assignMemberMutation = useAssignMember();
  const createWorkoutMutation = useCreateWorkout();

  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient.id) return;
    updateMemberMutation.mutate({ id: editingClient.id, data: editingClient }, {
      onSuccess: () => setIsEditClientOpen(false)
    });
  };

  // Client-side filtering for search (with debounced API search for large datasets)
  const filteredMembers = privateRoster.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.membership_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const expiredMembers = privateRoster.filter(
    (member) => new Date(member.sub_expiry_date) < new Date(new Date().toDateString())
  );
  
  // Paginate the filtered results for performance
  const displayedMembers = filteredMembers.slice(0, displayLimit);
  const hasMoreMembers = filteredMembers.length > displayLimit;
  const safeIdx = filteredMembers.length > 0 ? ((activeIdx % filteredMembers.length) + filteredMembers.length) % filteredMembers.length : 0;
  const activeClient = filteredMembers[safeIdx] || null;
  const activeClientId = activeClient?.id || "default";
  const CALORIE_GOAL = clientGoals[activeClientId] || 2500;
  const rosterHeaders = isRTL
    ? [t("actions"), t("type"), t("status"), t("code"), t("client")]
    : [t("client"), t("code"), t("status"), t("type"), t("actions")];

  const getStatusLabel = (member: Member) =>
    new Date(member.sub_expiry_date) > new Date() ? t("active") : t("expired");

  const handleSaveGoal = () => {
    const g = parseInt(tempGoal);
    if (g > 0) {
      const newGoals = { ...clientGoals, [activeClientId]: g };
      setClientGoals(newGoals);
      localStorage.setItem("fitgym_client_goals", JSON.stringify(newGoals));
    }
    setIsEditingGoal(false);
  };

  const handleSendRenewalReminder = async () => {
    if (!coachToken || expiredMembers.length === 0 || isSendingRenewalReminder) return;

    setIsSendingRenewalReminder(true);

    try {
      const response = await fetch("/api/coach/renewal-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${coachToken}`,
        },
        body: JSON.stringify({
          memberIds: expiredMembers.map((member) => member.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send renewal reminders");
      }
    } finally {
      setIsSendingRenewalReminder(false);
    }
  };

  /* Client carousel navigation */
  const switchClient = useCallback((idx: number) => {
    setActiveIdx(((idx % filteredMembers.length) + filteredMembers.length) % filteredMembers.length);
  }, [filteredMembers.length]);

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Scroll carousel to active card ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  useEffect(() => {
    if (carouselRef.current && filteredMembers.length > 0) {
      const card = carouselRef.current.children[safeIdx] as HTMLElement;
      card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [safeIdx, filteredMembers.length]);

  const cardStyle = {
    background: "var(--color-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-card)",
  } as React.CSSProperties;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetAssignmentState = useCallback(() => {
    assignmentFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setAssignmentTitle("");
    setAssignmentNotes("");
    setAssignmentDueDate("");
    setAssignmentFiles([]);
    setAssignmentUploadProgress(0);
    setAssignmentError("");
    setShowMeasurementFields(true);
    setAssignmentMeasurements({
      weight: "",
      chest: "",
      waist: "",
      hips: "",
      arms: "",
      thighs: "",
    });
    if (assignmentInputRef.current) {
      assignmentInputRef.current.value = "";
    }
  }, [assignmentFiles]);

  const openAssignmentModal = useCallback((member: Member) => {
    resetAssignmentState();
    setSelectedMemberForAssignment(member);
    setAssignmentTitle(`Body Assessment - ${member.name}`);
    setIsAssignmentModalOpen(true);
  }, [resetAssignmentState]);

  const closeAssignmentModal = useCallback(() => {
    if (isSendingAssignment) return;
    resetAssignmentState();
    setSelectedMemberForAssignment(null);
    setIsAssignmentModalOpen(false);
  }, [isSendingAssignment, resetAssignmentState]);

  const handleAssignmentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const totalBytes = [...assignmentFiles.map((item) => item.file), ...selectedFiles].reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 50 * 1024 * 1024) {
      setAssignmentError("Combined file size must stay under 50MB.");
      e.target.value = "";
      return;
    }

    const nextFiles = selectedFiles.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") || file.type.startsWith("video/") ? URL.createObjectURL(file) : null,
    }));

    setAssignmentError("");
    setAssignmentFiles((current) => [...current, ...nextFiles]);
    e.target.value = "";
  };

  const removeAssignmentFile = (index: number) => {
    setAssignmentFiles((current) => {
      const target = current[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleSendAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForAssignment || assignmentFiles.length === 0 || !coachToken) return;

    setIsSendingAssignment(true);
    setAssignmentError("");
    setAssignmentUploadProgress(0);

    const measurementFields = Object.entries(assignmentMeasurements).reduce<Record<string, string>>((acc, [key, value]) => {
      const trimmed = value.trim();
      if (trimmed) acc[key] = trimmed;
      return acc;
    }, {});

    const formData = new FormData();
    formData.append("member_id", String(selectedMemberForAssignment.id));
    formData.append("title", assignmentTitle.trim() || `Body Assessment - ${selectedMemberForAssignment.name}`);
    formData.append("notes", assignmentNotes.trim());
    if (assignmentDueDate) {
      formData.append("due_date", assignmentDueDate);
    }
    formData.append("measurement_fields", JSON.stringify(measurementFields));
    assignmentFiles.forEach((item) => formData.append("files", item.file));

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/coach-assignments/send");
        xhr.setRequestHeader("Authorization", `Bearer ${coachToken}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setAssignmentUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || "Failed to send assessment"));
          } catch {
            reject(new Error("Failed to send assessment"));
          }
        };

        xhr.onerror = () => reject(new Error("Failed to send assessment"));
        xhr.send(formData);
      });

      closeAssignmentModal();
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Failed to send assessment");
    } finally {
      setIsSendingAssignment(false);
      setAssignmentUploadProgress(0);
    }
  };

  return (
    <CoachLayout>
      <div className={isRTL ? "text-right" : "text-left"}>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â HEADER ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
        <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 ${isRTL ? "lg:flex-row-reverse" : ""}`}>
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontWeight: 700 }}>{t("welcomeBack", { name: currentCoach?.name || "Coach" })}</h1>
            <p className="text-sm mt-1" style={{ color: "#8B8B8B" }}>{t("coachingOverview")}</p>
          </div>

          <div className={`flex items-center gap-3 flex-wrap ${isRTL ? "justify-end" : ""}`}>
            <div
              className={`flex items-center rounded-xl border border-white/10 bg-white/5 p-1 ${isRTL ? "flex-row-reverse" : ""}`}
              aria-label="Language switcher"
            >
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: language === "en" ? "rgba(124,252,0,0.18)" : "transparent",
                  color: language === "en" ? "#7CFC00" : "#D4D4D8",
                }}
              >
                {t("languageEnglish")}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ar")}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: language === "ar" ? "rgba(124,252,0,0.18)" : "transparent",
                  color: language === "ar" ? "#7CFC00" : "#D4D4D8",
                }}
              >
                {t("languageArabic")}
              </button>
            </div>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t("clientsCount", { count: formatNumber(totalMembers) })}
              </span>
            </div>
            {expiredMembers.length > 0 && (
              <button
                onClick={handleSendRenewalReminder}
                disabled={isSendingRenewalReminder}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${isRTL ? "flex-row-reverse" : ""}`}
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#FCA5A5",
                }}
              >
                {isSendingRenewalReminder
                  ? t("sendingReminder", { count: formatNumber(expiredMembers.length) })
                  : t("sendRenewalReminder", { count: formatNumber(expiredMembers.length) })}
              </button>
            )}
            <button
              onClick={() => setIsAddOpen(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-black transition-all ${isRTL ? "flex-row-reverse" : ""}`}
              style={{ background: "#7CFC00", boxShadow: "0 0 20px rgba(124,252,0,0.3)" }}
            >
              <UserPlus className="w-4 h-4" /> {t("addClient")}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <div className={`flex gap-2 ${isRTL ? "justify-end" : ""}`}>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${isRTL ? "flex-row-reverse" : ""}`}
              style={{
                background: activeTab === "dashboard" ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.05)",
                border: activeTab === "dashboard" ? "1px solid rgba(124,252,0,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: activeTab === "dashboard" ? "#7CFC00" : "#FFFFFF",
              }}
            >
              <Activity size={16} /> {t("dashboard")}
            </button>
            <button
              onClick={() => setActiveTab("uploads")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${isRTL ? "flex-row-reverse" : ""}`}
              style={{
                background: activeTab === "uploads" ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.05)",
                border: activeTab === "uploads" ? "1px solid rgba(124,252,0,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: activeTab === "uploads" ? "#7CFC00" : "#FFFFFF",
              }}
            >
              <Upload size={16} /> {t("uploads")}
            </button>
          </div>
          <button
            onClick={() => activeClient && openAssignmentModal(activeClient)}
            disabled={!activeClient}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 ${isRTL ? "flex-row-reverse" : ""}`}
            style={{
              background: "rgba(124,252,0,0.12)",
              border: "1px solid rgba(124,252,0,0.25)",
              color: "#7CFC00",
            }}
          >
            <Paperclip size={16} /> New Assessment
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" ? (
          <>
        {/* ══ NUTRITION OVERVIEW ══ */}
        <div className="mb-8 hidden">
          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }} className="max-w-md">
            <div style={{ ...cardStyle, padding: 24, height: 280, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-semibold text-white" style={{ fontSize: 18 }}>{t("dailyNutrition")}</span>
                <Link href="/coach/calories"
                  className={`flex items-center gap-1 text-[11px] font-bold transition-opacity hover:opacity-80 ${isRTL ? "flex-row-reverse" : ""}`}
                  style={{ color: "#7CFC00" }}>
                  <Utensils className="w-3 h-3" /> {t("track")} <ArrowRight className={`w-3 h-3 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
              </div>
              <div className="relative" style={{ marginTop: 8 }}>
                <SemiGauge percent={CALORIE_GOAL > 0 ? Math.min((dailyTotals.calories / CALORIE_GOAL) * 100, 100) : 0} />
                <div className="absolute" style={{ bottom: -4, left: "50%", transform: "translateX(-50%)" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center -mt-6 mx-auto"
                    style={{ background: "rgba(124,252,0,0.15)", border: "2px solid rgba(124,252,0,0.3)" }}>
                    <Flame className="w-7 h-7" style={{ color: "#7CFC00" }} />
                  </div>
                </div>
              </div>

              {isEditingGoal ? (
                <div className="mt-2 text-center w-full px-4">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    placeholder={t("newGoal")}
                    className="w-full text-center bg-transparent border-b border-[#7CFC00] text-xl font-bold text-white outline-none mb-2"
                  />
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleSaveGoal} className="text-xs px-3 py-1 rounded bg-[#7CFC00] text-black font-semibold">{t("save")}</button>
                    <button onClick={() => setIsEditingGoal(false)} className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-500 font-semibold">{t("cancel")}</button>
                  </div>
                </div>
              ) : (
                <>
                  {dailyTotals.calories > 0 ? (
                    <div className="mt-2 text-center">
                      <p className="font-bold text-white relative group" style={{ fontSize: 22 }}>
                        {formatNumber(dailyTotals.calories)} <span className="text-sm font-normal" style={{ color: "#8B8B8B" }}>kcal</span>
                      </p>
                      <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "#8B8B8B" }}>
                        {t("ofGoal", {
                          percent: Math.min(Math.round((dailyTotals.calories / CALORIE_GOAL) * 100), 100),
                          goal: formatNumber(CALORIE_GOAL),
                        })}
                        <button onClick={() => { setTempGoal(CALORIE_GOAL.toString()); setIsEditingGoal(true); }} className="hover:text-[#7CFC00]">
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 text-center">
                      <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "#5A5A5A" }}>
                        {t("noMealsToday", { goal: formatNumber(CALORIE_GOAL) })}
                        <button onClick={() => { setTempGoal(CALORIE_GOAL.toString()); setIsEditingGoal(true); }} className="hover:text-[#7CFC00]">
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </p>
                      <Link href="/coach/calories"
                        className={`inline-flex items-center gap-1 mt-2 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 ${isRTL ? "flex-row-reverse" : ""}`}
                        style={{ background: "rgba(124,252,0,0.12)", color: "#7CFC00", border: "1px solid rgba(124,252,0,0.2)" }}>
                        <Utensils className="w-3 h-3" /> {t("logFirstMeal")}
                      </Link>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between w-full mt-3 px-2">
                <span className="text-[10px]" style={{ color: "#5A5A5A" }}>0</span>
                <span className="text-[10px]" style={{ color: "#5A5A5A" }}>{formatNumber(CALORIE_GOAL)} kcal</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â CLIENT ROSTER CAROUSEL ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-white" style={{ fontSize: 20 }}>{t("clientRoster")}</h2>
              <span className="font-semibold text-black text-xs px-2.5 py-0.5 rounded-xl" style={{ background: "#7CFC00" }}>
                {formatNumber(filteredMembers.length)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => switchClient(safeIdx - 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "rgba(22,22,26,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#7CFC00"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(22,22,26,0.8)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              >
                <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => switchClient(safeIdx + 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "rgba(22,22,26,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#7CFC00"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(22,22,26,0.8)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              >
                <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Carousel with edge mask - limited to first 15 for performance with hundreds of clients */}
          <div className="relative carousel-mask" style={{ height: 180 }}>
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto no-scrollbar h-full items-center px-4"
              style={{ scrollSnapType: "x mandatory", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
            >
              {/* Show first 15 clients in carousel for optimal performance */}
              {filteredMembers.slice(0, 15).map((member, idx) => {
                const selected = idx === safeIdx;
                const sColor = clientStatus(member);
                return (
                  <motion.button
                    key={member.id}
                    onClick={() => switchClient(idx)}
                    animate={{ scale: selected ? 1.05 : 1 }}
                    whileHover={{ y: -4 }}
                    title={normalizeMaybeMojibake(member.name)}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-4 transition-all"
                    style={{
                      width: 156, height: 172,
                      background: "#16161A",
                      border: selected ? `2px solid #7CFC00` : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 16,
                      boxShadow: selected ? "0 0 20px rgba(124,252,0,0.3)" : "0 4px 20px rgba(0,0,0,0.4)",
                      scrollSnapAlign: "start",
                    }}
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-black flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #7CFC00, #39FF14)",
                        border: `2px solid ${sColor}`,
                        boxShadow: `0 0 0 3px ${sColor}33`,
                      }}>
                      {getDisplayInitial(member.name)}
                    </div>
                    <p
                      className="text-white font-semibold text-xs text-center w-full px-1"
                      title={normalizeMaybeMojibake(member.name)}
                      style={{
                        minHeight: 32,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {normalizeMaybeMojibake(member.name)}
                    </p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(124,252,0,0.15)", color: "#7CFC00" }}>
                      {member.membership_type || t("membershipType")}
                    </span>
                    <div className="flex items-center gap-1.5 mt-auto">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: sColor }} />
                      <span className="text-[10px]" style={{ color: "#8B8B8B" }}>
                        {getStatusLabel(member)}
                      </span>
                    </div>
                  </motion.button>
                );
              })}

              {/* View All card - shown when more than 15 clients */}
              {filteredMembers.length > 15 && (
                <button
                  onClick={() => document.getElementById('roster-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-2 transition-all"
                  style={{
                    width: 120, height: 160,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16, scrollSnapAlign: "start",
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <span className="text-sm font-bold text-white">+{formatNumber(filteredMembers.length - 15)}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#8B8B8B" }}>{t("viewAll")}</span>
                </button>
              )}

              {/* Add Client card */}
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-2 transition-all"
                style={{
                  width: 120, height: 160,
                  background: "rgba(124,252,0,0.08)",
                  border: "2px dashed #7CFC00",
                  borderRadius: 16, scrollSnapAlign: "start",
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(124,252,0,0.15)" }}>
                  <Plus className="w-6 h-6" style={{ color: "#7CFC00" }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "#7CFC00" }}>{t("addNew")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ CLIENT SPOTLIGHT ══ */}
        <div className="mb-8">
            <AnimatePresence mode="wait">
              {!activeClient ? (
                <div style={{ ...cardStyle, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                  <Users className="w-10 h-10 mb-3 opacity-30 text-white" />
                  <p className="text-white font-semibold">{t("noClientsYet")}</p>
                  <p className="text-sm mt-1" style={{ color: "#8B8B8B" }}>{t("addClientToBegin")}</p>
                </div>
              ) : (
                <motion.div
                  key={activeClient.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{ ...cardStyle, padding: 24, background: "linear-gradient(135deg, rgba(124,252,0,0.04), #16161A)" }}>
                    {/* Header row */}
                    <div className={`flex justify-between items-start mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div>
                        <p className="font-bold uppercase tracking-widest text-[10px] mb-1" style={{ color: "#7CFC00" }}>{t("clientSpotlight")}</p>
                        <h2 className="text-2xl font-bold text-white">{normalizeMaybeMojibake(activeClient.name)}</h2>
                      </div>
                      <div className={`flex flex-col gap-2 ${isRTL ? "items-start" : "items-end"}`}>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isRTL ? "flex-row-reverse" : ""}`}
                          style={{ border: "1px solid rgba(234,179,8,0.3)", background: "rgba(0,0,0,0.4)", color: "#F59E0B" }}>
                          <Star className="w-3 h-3 fill-current" /> {t("client")}
                        </div>
                        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <button onClick={() => router.push(`/coach/messages?memberId=${activeClient.id}`)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors hover:bg-white/10"
                            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                            <MessageSquare className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button onClick={() => { setEditingClient(activeClient); setIsEditClientOpen(true); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white border transition-colors hover:bg-white/10 ${isRTL ? "flex-row-reverse" : ""}`}
                            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                            {t("edit")} <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
                      {[
                        { Icon: Tag, val: displayOrFallback(activeClient.membership_code, t("notProvided")) },
                        { Icon: Calendar, val: t("joinedOn", { date: new Date(activeClient.created_at || Date.now()).toLocaleDateString() }) },
                        { Icon: Smartphone, val: displayOrFallback(activeClient.phone, t("notProvided")) },
                        { Icon: User, val: `${t("type")}: ${displayOrFallback(activeClient.membership_type, t("notProvided"))}` },
                      ].map(({ Icon, val }, i) => (
                        <div key={i} className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)" }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: "#7CFC00" }} />
                          </div>
                          <span className="text-xs font-semibold text-white truncate" title={val}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar - real calorie progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white">{t("nutritionProgressToday")}</span>
                        <span className="font-bold text-sm" style={{ color: "#7CFC00" }}>
                          {Math.min(Math.round((dailyTotals.calories / CALORIE_GOAL) * 100), 100)}%
                        </span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 10, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #7CFC00, #39FF14)", boxShadow: "0 0 10px rgba(124,252,0,0.5)" }}
                          initial={{ width: 0 }} 
                          animate={{ width: `${Math.min((dailyTotals.calories / CALORIE_GOAL) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[10px] mt-2" style={{ color: "#8B8B8B" }}>
                        {formatNumber(dailyTotals.calories)} / {formatNumber(CALORIE_GOAL)} kcal {t("consumedToday")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* ══ ROSTER TABLE ══ */}
        <div id="roster-section" style={{ ...cardStyle, overflow: "hidden" }}>
          <div className={`p-5 flex flex-col lg:flex-row justify-between items-center gap-4 ${isRTL ? "lg:flex-row-reverse" : ""}`}
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-white italic" style={{ fontSize: 20 }}>{t("clientRoster")}</h2>
              <span className="font-bold text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(124,252,0,0.15)", color: "#7CFC00" }}>
                {formatNumber(filteredMembers.length)}
              </span>
              {filteredMembers.length > displayLimit && (
                <span className="text-xs text-muted-foreground">
                  ({t("showingCount", { count: formatNumber(displayedMembers.length) })})
                </span>
              )}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isRTL ? "right-3" : "left-3"}`} style={{ color: "#5A5A5A" }} />
              <input
                type="text"
                placeholder={t("filterByNameOrCode")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full rounded-full py-2 text-sm text-white outline-none transition-colors ${isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"}`}
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full ${isRTL ? "text-right" : "text-left"}`}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  {rosterHeaders.map((h, i) => (
                    <th key={h} className="p-4 text-[10px] uppercase tracking-widest" style={{ color: "#5A5A5A", paddingLeft: !isRTL && i === 0 ? 24 : undefined, paddingRight: isRTL || i === 4 ? 24 : undefined, textAlign: i === 4 ? (isRTL ? "left" : "right") : undefined }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedMembers.map((m) => (
                  <tr key={m.id} className="border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {isRTL ? (
                      <>
                        <td className="p-4 text-left" style={{ paddingLeft: 24 }}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditingClient(m); setIsEditClientOpen(true); }}
                              className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-white/30"
                              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#8B8B8B" }}
                              title={t("edit")}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMemberForWorkout(m);
                                setIsWorkoutModalOpen(true);
                                setWorkoutFormData({ title: "", duration: "45 min", difficulty: "Medium", calories: 300, muscles: [], exercises: [] });
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-white/30"
                              style={{ border: "1px solid rgba(124,252,0,0.2)", color: "#7CFC00" }}
                              title={t("assignWorkout")}
                            >
                              <Dumbbell className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openAssignmentModal(m)}
                              className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-white/30"
                              style={{ border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD" }}
                              title="New Assessment"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClient(m.id, m.name);
                                router.push("/coach/calories");
                              }}
                              className="text-xs font-bold transition-colors hover:opacity-80"
                              style={{ color: "#7CFC00" }}
                            >
                              {t("select")}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-xs" style={{ color: "#8B8B8B" }}>{m.membership_type}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: new Date(m.sub_expiry_date) > new Date() ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: new Date(m.sub_expiry_date) > new Date() ? "#10B981" : "#ef4444" }}>
                            {getStatusLabel(m)}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: "#8B8B8B" }}>{m.membership_code}</td>
                        <td className="p-4" style={{ paddingRight: 24 }}>
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-semibold text-white">{normalizeMaybeMojibake(m.name)}</span>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ background: "linear-gradient(135deg, #7CFC00, #39FF14)" }}>
                              {getDisplayInitial(m.name)}
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4" style={{ paddingLeft: 24 }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ background: "linear-gradient(135deg, #7CFC00, #39FF14)" }}>
                              {getDisplayInitial(m.name)}
                            </div>
                            <span className="text-sm font-semibold text-white" title={normalizeMaybeMojibake(m.name)}>{normalizeMaybeMojibake(m.name)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: "#8B8B8B" }}>{m.membership_code}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: new Date(m.sub_expiry_date) > new Date() ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: new Date(m.sub_expiry_date) > new Date() ? "#10B981" : "#ef4444" }}>
                            {getStatusLabel(m)}
                          </span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: "#8B8B8B" }}>{m.membership_type}</td>
                        <td className="p-4 text-right" style={{ paddingRight: 24 }}>
                          <button
                            onClick={() => {
                              setSelectedClient(m.id, m.name);
                              router.push("/coach/calories");
                            }}
                            className="text-xs font-bold mr-2 transition-colors hover:opacity-80"
                            style={{ color: "#7CFC00" }}
                          >
                            {t("select")}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMemberForWorkout(m);
                              setIsWorkoutModalOpen(true);
                              setWorkoutFormData({ title: "", duration: "45 min", difficulty: "Medium", calories: 300, muscles: [], exercises: [] });
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-white/30 mr-2"
                            style={{ border: "1px solid rgba(124,252,0,0.2)", color: "#7CFC00" }}
                            title={t("assignWorkout")}
                          >
                            <Dumbbell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openAssignmentModal(m)}
                            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-white/30 mr-2"
                            style={{ border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD" }}
                            title="New Assessment"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingClient(m); setIsEditClientOpen(true); }}
                            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-white/30"
                            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#8B8B8B" }}
                            title={t("edit")}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Load More Button - for handling hundreds of clients */}
            {hasMoreMembers && (
              <div className="p-4 text-center">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 50)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ 
                    background: "rgba(124,252,0,0.1)", 
                    border: "1px solid rgba(124,252,0,0.2)",
                    color: "#7CFC00"
                  }}
                >
                  {t("loadMore")} ({formatNumber(filteredMembers.length - displayLimit)} {t("remaining")})
                </button>
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          <UploadsTab coachId={currentCoach?.id || 0} />
        )}
      </div>

      {/* ══ ASSIGN CLIENT MODAL ══ */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={isRTL ? "text-right" : ""} style={{ ...cardStyle, width: "100%", maxWidth: 520, padding: 32, position: "relative" }}>
              <div className={`flex justify-between items-center mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h2 className="text-xl font-bold text-white">{t("assignClientToRoster")}</h2>
                <button onClick={() => setIsAddOpen(false)} style={{ color: "#8B8B8B" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <Input
                  placeholder={t("searchUnassigned")}
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto space-y-2 mt-4 pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                  {isSearchingUnassigned ? (
                     <div className="text-sm text-gray-400 text-center py-4">{t("searchInProgress")}</div>
                  ) : unassignedMembers.length === 0 ? (
                     <div className="text-sm text-gray-500 text-center py-4">{t("noUnassignedMembers")}</div>
                  ) : (
                    unassignedMembers.map((m: Member) => (
                      <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                        <div>
                          <div className="text-white font-bold">{m.name}</div>
                          <div className="text-xs text-gray-400">{m.membership_code}</div>
                        </div>
                        <button
                          onClick={() => assignMemberMutation.mutate({ id: m.id, action: "assign" }, { onSuccess: () => { refetchMembers(); setIsAddOpen(false); setAssignSearchQuery(""); }})}
                          disabled={assignMemberMutation.isPending}
                          className="px-4 py-1.5 rounded-lg text-sm font-bold text-black hover:opacity-80 disabled:opacity-50 transition-opacity"
                          style={{ background: "#7CFC00" }}
                        >
                          {assignMemberMutation.isPending ? t("assigningWorkout") : t("assign")}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â EDIT CLIENT MODAL ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
      <AnimatePresence>
        {isEditClientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditClientOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={isRTL ? "text-right" : ""} style={{ ...cardStyle, width: "100%", maxWidth: 440, padding: 28, position: "relative" }}>
              <div className={`flex justify-between items-center mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h2 className="text-xl font-bold text-white">{t("editClient")}</h2>
                <button onClick={() => setIsEditClientOpen(false)} style={{ color: "#8B8B8B" }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditClient} className="space-y-4">
                <div><Label>{t("fullName")}</Label><Input value={editingClient.name || ""} onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} required /></div>
                <div><Label>{t("email")}</Label><Input type="email" value={editingClient.email || ""} onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} /></div>
                <div><Label>{t("phone")}</Label><Input value={normalizeMaybeMojibake(editingClient.phone || "")} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} /></div>
                <div><Label>{t("membershipType")}</Label><Input value={editingClient.membership_type || ""} onChange={e => setEditingClient({ ...editingClient, membership_type: e.target.value })} /></div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsEditClientOpen(false)}>{t("cancel")}</Button>
                  <button type="submit" disabled={updateMemberMutation.isPending} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-black" style={{ background: "#7CFC00" }}>
                    {updateMemberMutation.isPending ? t("saving") : t("saveChanges")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ ASSIGN WORKOUT MODAL ══ */}
      <AnimatePresence>
        {isAssignmentModalOpen && selectedMemberForAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeAssignmentModal} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className={isRTL ? "text-right" : ""} style={{ ...cardStyle, width: "100%", maxWidth: 720, padding: 28, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
              <div className={`flex justify-between items-start mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div>
                  <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <ClipboardList className="w-5 h-5" style={{ color: "#7CFC00" }} />
                    <h2 className="text-xl font-bold text-white">Assess {selectedMemberForAssignment.name}</h2>
                  </div>
                  <p className="text-sm" style={{ color: "#8B8B8B" }}>
                    Share body measurements, progress photos, reports, and movement checks in one assessment.
                  </p>
                </div>
                <button onClick={closeAssignmentModal} style={{ color: "#8B8B8B" }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSendAssignment} className="space-y-5">
                <div>
                  <Label>{t("client")}</Label>
                  <select
                    value={selectedMemberForAssignment.id}
                    onChange={(e) => {
                      const nextMember = members.find((member) => member.id === Number(e.target.value));
                      if (nextMember) {
                        setSelectedMemberForAssignment(nextMember);
                        setAssignmentTitle(`Body Assessment - ${nextMember.name}`);
                      }
                    }}
                    className="w-full rounded-xl p-3 mt-1 outline-none transition-colors"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#FFFFFF",
                    }}
                  >
                    {privateRoster.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.membership_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>{t("assignmentTitle")}</Label>
                  <Input value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} placeholder="Body assessment - Week 4" />
                </div>
                <div>
                  <Label>{t("coachNotes")}</Label>
                  <textarea value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} rows={4} placeholder="Check waist circumference, shoulder width, hip flexor mobility..." className="w-full rounded-xl p-3 mt-1 outline-none resize-none" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFFFFF" }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("dueDate")}</Label>
                    <Input type="date" value={assignmentDueDate} onChange={(e) => setAssignmentDueDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("files")}</Label>
                    <button type="button" onClick={() => assignmentInputRef.current?.click()} className={`w-full mt-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${isRTL ? "flex-row-reverse" : ""}`} style={{ background: "rgba(124,252,0,0.12)", border: "1px dashed rgba(124,252,0,0.35)", color: "#7CFC00" }}>
                      <Paperclip className="w-4 h-4" /> {t("addFiles")}
                    </button>
                    <input ref={assignmentInputRef} type="file" multiple accept="application/pdf,image/*,video/mp4,video/webm,video/quicktime" onChange={handleAssignmentFileSelect} className="hidden" />
                    <p className="text-xs mt-2" style={{ color: "#8B8B8B" }}>PDF, photos, and video supported. Combined size limit: 50MB.</p>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
                  <div className={`flex items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div>
                      <h3 className="text-sm font-bold text-white">{t("measurementFields")}</h3>
                      <p className="text-xs" style={{ color: "#8B8B8B" }}>{t("optionalValuesUpload")}</p>
                    </div>
                    <button type="button" onClick={() => setShowMeasurementFields((current) => !current)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#FFFFFF" }}>{showMeasurementFields ? t("hide") : t("show")}</button>
                  </div>
                  {showMeasurementFields && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {([
                        ["weight", t("weight")],
                        ["chest", t("chest")],
                        ["waist", t("waist")],
                        ["hips", t("hips")],
                        ["arms", t("arms")],
                        ["thighs", t("thighs")],
                      ] as const).map(([key, label]) => (
                        <div key={key}>
                          <Label>{label}</Label>
                          <Input value={assignmentMeasurements[key]} onChange={(e) => setAssignmentMeasurements((current) => ({ ...current, [key]: e.target.value }))} placeholder={label} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className={`flex items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <h3 className="text-sm font-bold text-white">{t("preview")}</h3>
                    <span className="text-xs" style={{ color: "#8B8B8B" }}>{formatFileSize(assignmentFiles.reduce((sum, item) => sum + item.file.size, 0))}</span>
                  </div>
                  {assignmentFiles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#8B8B8B" }}>{t("noFilesSelected")}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignmentFiles.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="h-32 flex items-center justify-center overflow-hidden" style={{ background: "rgba(0,0,0,0.35)" }}>
                            {item.file.type.startsWith("image/") && item.previewUrl ? (
                              <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                            ) : item.file.type.startsWith("video/") && item.previewUrl ? (
                              <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                            ) : (
                              <div className="flex flex-col items-center gap-2" style={{ color: "#8B8B8B" }}>
                                {item.file.type === "application/pdf" ? <FileText className="w-8 h-8" /> : item.file.type.startsWith("video/") ? <Video className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                                <span className="text-xs">{t("readyToSend")}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="text-sm font-semibold text-white truncate">{item.file.name}</div>
                            <div className="text-xs mt-1" style={{ color: "#8B8B8B" }}>{formatFileSize(item.file.size)}</div>
                            <button type="button" onClick={() => removeAssignmentFile(index)} className="text-xs mt-3 px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {assignmentError && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>{assignmentError}</div>
                )}
                {isSendingAssignment && (
                  <div>
                    <div className={`flex items-center justify-between text-xs mb-2 ${isRTL ? "flex-row-reverse" : ""}`} style={{ color: "#8B8B8B" }}>
                      <span>{t("uploadProgress")}</span>
                      <span>{assignmentUploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${assignmentUploadProgress}%`, background: "linear-gradient(90deg, #7CFC00, #39FF14)" }} />
                    </div>
                  </div>
                )}
                <div className={`flex gap-3 pt-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Button type="button" variant="ghost" className="flex-1" onClick={closeAssignmentModal}>{t("cancel")}</Button>
                  <button type="submit" disabled={isSendingAssignment || assignmentFiles.length === 0} className="flex-1 py-3 rounded-xl font-bold text-sm text-black disabled:opacity-60" style={{ background: "#7CFC00" }}>
                    {isSendingAssignment ? t("sendingAssignment") : t("sendAssignment")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWorkoutModalOpen && selectedMemberForWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsWorkoutModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={isRTL ? "text-right" : ""} style={{ ...cardStyle, width: "100%", maxWidth: 480, padding: 28, position: "relative" }}>
              <div className={`flex justify-between items-center mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h2 className="text-xl font-bold text-white">{t("assignWorkout")}</h2>
                <button onClick={() => setIsWorkoutModalOpen(false)} style={{ color: "#8B8B8B" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="mb-4 text-sm" style={{ color: "#8B8B8B" }}>
                {t("assignWorkoutTo", { name: selectedMemberForWorkout.name })}
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!selectedMemberForWorkout.id || !workoutFormData.title.trim()) return;
                createWorkoutMutation.mutate({
                  member_id: selectedMemberForWorkout.id,
                  title: workoutFormData.title,
                  duration: workoutFormData.duration,
                  difficulty: workoutFormData.difficulty,
                  calories: workoutFormData.calories,
                  muscles: workoutFormData.muscles,
                  coach_assigned: true,
                  status: "todo",
                  sets: workoutFormData.exercises,
                }, {
                  onSuccess: () => {
                    setIsWorkoutModalOpen(false);
                    setSelectedMemberForWorkout(null);
                    setWorkoutFormData({
                      title: "",
                      duration: "45 min",
                      difficulty: "Medium",
                      calories: 300,
                      muscles: [],
                      exercises: [],
                    });
                  },
                });
              }} className="space-y-4">
                <div><Label>{t("workoutTitle")}</Label><Input value={workoutFormData.title} onChange={e => setWorkoutFormData({ ...workoutFormData, title: e.target.value })} placeholder={isRTL ? "مثال: يوم الأرجل - سكوات ثقيل" : "e.g., Leg Day - Heavy Squats"} required /></div>
                <div><Label>{t("duration")}</Label>
                  <select
                    value={workoutFormData.duration}
                    onChange={e => setWorkoutFormData({ ...workoutFormData, duration: e.target.value })}
                    className="w-full rounded-lg py-2 px-3 text-white outline-none transition-colors"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <option value="30 min">{isRTL ? "30 دقيقة" : "30 min"}</option>
                    <option value="45 min">{isRTL ? "45 دقيقة" : "45 min"}</option>
                    <option value="60 min">{isRTL ? "60 دقيقة" : "60 min"}</option>
                    <option value="90 min">{isRTL ? "90 دقيقة" : "90 min"}</option>
                  </select>
                </div>
                <div><Label>{t("difficulty")}</Label>
                  <select
                    value={workoutFormData.difficulty}
                    onChange={e => setWorkoutFormData({ ...workoutFormData, difficulty: e.target.value })}
                    className="w-full rounded-lg py-2 px-3 text-white outline-none transition-colors"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <option value="Easy">{t("easy")}</option>
                    <option value="Medium">{t("medium")}</option>
                    <option value="Hard">{t("hard")}</option>
                  </select>
                </div>
                <div><Label>{t("estimatedCalories")}</Label><Input type="number" value={workoutFormData.calories} onChange={e => setWorkoutFormData({ ...workoutFormData, calories: parseInt(e.target.value) || 0 })} /></div>
                
                {/* Exercise Editor Section */}
                <div>
                  <div className={`flex justify-between items-center mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Label>{t("exercises")}</Label>
                    <button
                      type="button"
                      onClick={() => setWorkoutFormData({
                        ...workoutFormData,
                        exercises: [...workoutFormData.exercises, { exercise: "", sets: 3, reps: "10", weight: 0, unit: "kg" }]
                      })}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{ background: "rgba(124,252,0,0.15)", color: "#7CFC00", border: "1px solid rgba(124,252,0,0.3)" }}
                    >
                      {isRTL ? "+ إضافة تمرين" : "+ Add Exercise"}
                    </button>
                  </div>
                  {workoutFormData.exercises.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className={`flex justify-between items-start mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-semibold text-white">{t("exercise", { index: idx + 1 })}</span>
                        <button
                          type="button"
                          onClick={() => setWorkoutFormData({
                            ...workoutFormData,
                            exercises: workoutFormData.exercises.filter((_, i) => i !== idx)
                          })}
                          className="text-xs text-red-500 hover:text-red-400"
                        >
                          {t("remove")}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder={isRTL ? "اسم التمرين" : "Exercise name (e.g., Bench Press)"}
                          value={ex.exercise}
                          onChange={e => {
                            const newExercises = [...workoutFormData.exercises];
                            newExercises[idx] = { ...ex, exercise: e.target.value };
                            setWorkoutFormData({ ...workoutFormData, exercises: newExercises });
                          }}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">{t("sets")}</Label>
                            <Input
                              type="number"
                              value={ex.sets}
                              onChange={e => {
                                const newExercises = [...workoutFormData.exercises];
                                newExercises[idx] = { ...ex, sets: parseInt(e.target.value) || 0 };
                                setWorkoutFormData({ ...workoutFormData, exercises: newExercises });
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">{t("reps")}</Label>
                            <Input
                              value={ex.reps}
                              onChange={e => {
                                const newExercises = [...workoutFormData.exercises];
                                newExercises[idx] = { ...ex, reps: e.target.value };
                                setWorkoutFormData({ ...workoutFormData, exercises: newExercises });
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">{t("weight")}</Label>
                            <Input
                              type="number"
                              value={ex.weight || ""}
                              onChange={e => {
                                const newExercises = [...workoutFormData.exercises];
                                newExercises[idx] = { ...ex, weight: parseInt(e.target.value) || 0 };
                                setWorkoutFormData({ ...workoutFormData, exercises: newExercises });
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">{t("unit")}</Label>
                          <select
                            value={ex.unit}
                            onChange={e => {
                              const newExercises = [...workoutFormData.exercises];
                              newExercises[idx] = { ...ex, unit: e.target.value };
                              setWorkoutFormData({ ...workoutFormData, exercises: newExercises });
                            }}
                            className="w-full rounded-lg py-2 px-3 text-white outline-none transition-colors text-sm"
                            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                            <option value="—">{t("bodyweight")}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {workoutFormData.exercises.length === 0 && (
                    <div className="text-center py-4 text-sm" style={{ color: "#5A5A5A" }}>
                      {isRTL ? 'لم تتم إضافة تمارين بعد. اضغط "+ إضافة تمرين" لتجهيز التمرين.' : 'No exercises added yet. Click "+ Add Exercise" to design your workout.'}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsWorkoutModalOpen(false)}>{t("cancel")}</Button>
                  <button type="submit" disabled={createWorkoutMutation.isPending || !workoutFormData.title.trim()} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-black" style={{ background: "#7CFC00" }}>
                    {createWorkoutMutation.isPending ? t("assigningWorkout") : t("assignWorkout")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </CoachLayout>
  );
}


