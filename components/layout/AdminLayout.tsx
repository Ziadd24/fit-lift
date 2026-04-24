"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Megaphone, Image as ImageIcon, LogOut, Activity, Dumbbell, Settings, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: Activity },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Bundles", href: "/admin/bundles", icon: Dumbbell },
  { label: "Coaches", href: "/admin/coaches", icon: UserCheck },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Photos", href: "/admin/photos", icon: ImageIcon },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminToken, logoutAdmin, _hasHydrated } = useAuth();

  React.useEffect(() => {
    if (_hasHydrated && !adminToken) {
      router.push("/admin/login");
    }
  }, [_hasHydrated, adminToken, router]);

  if (!_hasHydrated || !adminToken) return null;

  return (
    <div className="h-screen overflow-hidden flex bg-background font-sans">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0 bg-card border-r border-white/5">
        {/* Logo */}
        <div className="p-5 flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="FitGym" className="h-10 w-auto object-contain" />
            <span className="text-lg font-black text-primary tracking-widest">FIT & LIFT</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground box-glow"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span className={cn(isActive && "font-bold")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 flex-shrink-0 border-t border-white/5">
          <button
            onClick={() => { logoutAdmin(); router.push("/admin/login"); }}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 lg:px-10 py-4 md:py-6 pb-24 md:pb-6 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 min-h-[64px] bg-[#0a0a0f]/98 backdrop-blur-xl border-t border-white/10 flex items-stretch justify-around z-50 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 space-y-0.5 relative transition-colors",
                isActive ? "text-primary" : "text-white/50"
              )}
            >
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-b-md" />}
              <item.icon className="w-4 h-4" />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}