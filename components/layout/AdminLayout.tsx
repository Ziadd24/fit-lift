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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-white/5 flex flex-col z-10 relative">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="FitGym"
              className="h-10 w-auto object-contain"
            />
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

        <div className="p-4 mt-auto">
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
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
