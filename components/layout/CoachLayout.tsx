"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Calendar,
  MessageCircle,
  LogOut,
  Pencil,
  Camera,
  Utensils,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/coach",          icon: Activity },
  { label: "Schedule",   href: "/coach/schedule",  icon: Calendar },
  { label: "Messages",   href: "/coach/messages",  icon: MessageCircle },
  { label: "Nutrition",  href: "/coach/calories",  icon: Utensils },
];

export function CoachLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { coachToken, currentCoach, logoutCoach } = useAuth();

  // Local state for coach profile photo
  const [coachPhoto, setCoachPhoto] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCoachPhoto(ev.target?.result as string);
      setIsEditProfileOpen(false);
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (!coachToken) {
      router.push("/coach/login");
    }
  }, [coachToken, router]);

  if (!coachToken) return null;

  const initials = currentCoach?.name
    ? currentCoach.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CO";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-white/5 flex flex-col z-10 relative">
        
        {/* Profile Section */}
        <div className="p-6 pb-4">
          <div className="flex flex-col items-center gap-3">
            {/* Profile Photo with Neon Ring */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: coachPhoto ? "transparent" : "linear-gradient(135deg, #1a2a1a, #2a3a2a)",
                  boxShadow: "0 0 0 3px #7CFC00, 0 0 20px rgba(124,252,0,0.3)",
                }}
              >
                {coachPhoto ? (
                  <img src={coachPhoto} alt="Coach" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-primary">{initials}</span>
                )}
              </div>
              {/* Edit Button */}
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg"
                title="Edit profile photo"
              >
                <Pencil className="w-3 h-3 text-black" />
              </button>
            </div>

            {/* Coach Info */}
            <div className="text-center">
              <h1 className="text-sm font-black text-white tracking-wide">
                Captain&apos;s <span className="text-primary">Portal</span>
              </h1>
              {currentCoach && (
                <p className="text-xs text-muted-foreground truncate max-w-[140px] mt-0.5">
                  {currentCoach.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/coach" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground box-glow"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                />
                <span className={cn(isActive && "font-bold")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => {
              logoutCoach();
              router.push("/coach/login");
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsEditProfileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wide">
                Update Profile Photo
              </h2>

              {/* Current Photo Preview */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ boxShadow: "0 0 0 3px #7CFC00, 0 0 20px rgba(124,252,0,0.25)" }}
                >
                  {coachPhoto ? (
                    <img src={coachPhoto} alt="Coach" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-primary">{initials}</span>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-primary text-black font-black py-3 rounded-xl hover:bg-primary/90 transition-colors mb-3"
              >
                <Camera className="w-5 h-5" />
                Upload New Photo
              </button>

              {coachPhoto && (
                <button
                  onClick={() => { setCoachPhoto(null); setIsEditProfileOpen(false); }}
                  className="w-full py-3 rounded-xl border border-white/10 text-muted-foreground text-sm hover:border-white/30 transition-colors"
                >
                  Remove Photo
                </button>
              )}

              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
    </div>
  );
}
