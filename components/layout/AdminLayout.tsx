"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Megaphone, Image as ImageIcon, LogOut, Activity, Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: Activity },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Bundles", href: "/admin/bundles", icon: Dumbbell },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Photos", href: "/admin/photos", icon: ImageIcon },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminToken, logoutAdmin } = useAuth();

  React.useEffect(() => {
    if (!adminToken) {
      router.push("/admin/login");
    }
  }, [adminToken, router]);

  if (!adminToken) return null;

  return (
    <div className="min-h-screen bg-background flex pb-24 md:pb-0 font-sans">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-card border-r border-white/5 flex-col flex-shrink-0 z-10 sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-0">
            <img
              src="/images/logo.png"
              alt="FitGym"
              className="h-[112px] w-auto object-contain"
            />
            <span className="text-xl font-black text-primary tracking-widest -ml-4">FIT & LIFT</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
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

        <div className="p-4 mt-auto border-t border-white/5">
          <button
            onClick={() => {
              logoutAdmin();
              router.push("/admin/login");
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative z-10 p-4 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 min-h-[72px] bg-[#0a0a0f]/98 backdrop-blur-xl border-t border-white/10 flex items-stretch justify-around z-50 px-1 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors duration-200",
                isActive ? "text-primary" : "text-white/50 hover:text-white/80"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-b-md shadow-[0_0_8px_rgba(124,252,0,0.8)]" />
              )}
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(124,252,0,0.5)]")} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
        {/* Mobile Sign Out */}
        <button
          onClick={() => {
            logoutAdmin();
            router.push("/admin/login");
          }}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-destructive/80 hover:text-destructive transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Exit</span>
        </button>
      </div>
    </div>
  );
}
