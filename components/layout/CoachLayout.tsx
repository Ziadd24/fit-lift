"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Cairo } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Camera,
  LogOut,
  Menu,
  Pencil,
  Utensils,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/use-auth";
import { useClientContext } from "@/lib/use-client-context";
import { useCoachLanguage } from "@/lib/coach-language";
import { cn } from "@/lib/utils";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });

export function CoachLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { coachToken, currentCoach, logoutCoach, _hasHydrated } = useAuth();
  const { selectedClientName, clearSelectedClient } = useClientContext();
  const { t, language, toggleLanguage, isRTL, dir } = useCoachLanguage();
  const isLoggingOutRef = useRef(false);

  const [coachPhoto, setCoachPhoto] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { label: t("dashboard"), href: "/coach", icon: Activity },
    { label: t("schedule"), href: "/coach/schedule", icon: Calendar },
    { label: t("nutrition"), href: "/coach/calories", icon: Utensils },
  ];

  React.useEffect(() => {
    if (!coachToken && !isLoggingOutRef.current) router.push("/coach/login");
  }, [coachToken, router]);

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
    if (_hasHydrated && !coachToken && !isLoggingOutRef.current) router.push("/coach/login");
  }, [_hasHydrated, coachToken, router]);

  if (!_hasHydrated || !coachToken) return null;

  const initials = currentCoach?.name
    ? currentCoach.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CO";

  const isActive = (href: string) => pathname === href || (href !== "/coach" && pathname.startsWith(href));

  const handleLogout = () => {
    isLoggingOutRef.current = true;
    setIsDrawerOpen(false);
    logoutCoach();
    window.location.replace("/");
  };

  return (
    <div dir={dir} className={cn(cairo.className, "min-h-screen bg-background")}>
      <div className={cn("min-h-screen flex flex-col", isRTL ? "md:flex-row-reverse" : "md:flex-row")}>
        <aside
          className={cn(
            "hidden md:flex md:w-72 bg-card flex-col z-10 relative sticky top-0 h-screen overflow-y-auto",
            isRTL ? "border-l border-white/5" : "border-r border-white/5"
          )}
        >
          <div className="p-6 pb-4">
            <div className="flex flex-col items-center gap-3 text-center">
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
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className={cn(
                    "absolute bottom-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg",
                    isRTL ? "left-0" : "right-0"
                  )}
                >
                  <Pencil className="w-3 h-3 text-black" />
                </button>
              </div>

              <div>
                <h1 className="text-sm font-black text-white tracking-wide">
                  {t("coachHub").split(" ")[0]} <span className="text-primary">{t("coachHub").split(" ").slice(1).join(" ")}</span>
                </h1>
                {currentCoach && (
                  <p className="text-xs text-muted-foreground truncate max-w-[160px] mt-0.5">{currentCoach.name}</p>
                )}
              </div>

            </div>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isRTL ? "flex-row-reverse gap-3 text-right" : "gap-3",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground box-glow"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive(item.href) ? "text-primary-foreground" : "text-muted-foreground")} />
                <span className={cn(isActive(item.href) && "font-bold")}>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 mt-auto space-y-3">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center px-4 py-3 w-full rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors",
                isRTL ? "flex-row-reverse gap-3 justify-center" : "gap-3"
              )}
            >
              <LogOut className="w-5 h-5" />
              {t("signOut")}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative pb-24 md:pb-0">
          <div
            className={cn("flex md:hidden items-center justify-between px-4 py-3 sticky top-0 z-40", isRTL && "flex-row-reverse")}
            style={{
              background: "rgba(13,13,16,0.97)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-wide">{t("coachHub")}</span>
              <button
                onClick={toggleLanguage}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-white/10 bg-white/5 text-white"
              >
                {language === "en" ? "ع" : "EN"}
              </button>
            </div>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{
                background: coachPhoto ? "transparent" : "linear-gradient(135deg, #1a2a1a, #2a3a2a)",
                boxShadow: "0 0 0 2px #7CFC00",
              }}
            >
              {coachPhoto ? (
                <img src={coachPhoto} alt="Coach" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-black text-primary">{initials}</span>
              )}
            </button>
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
          <div className={cn("relative z-10 p-4 md:p-6 lg:p-10 max-w-7xl mx-auto", isRTL ? "text-right" : "text-left")}>
            {selectedClientName && (
              <div className={cn("flex items-center gap-2 mb-6 text-sm", isRTL && "flex-row-reverse justify-start")}>
                <button onClick={clearSelectedClient} className="text-muted-foreground hover:text-white transition-colors">
                  {t("backToClients")}
                </button>
                <ArrowLeft className={cn("w-4 h-4 text-muted-foreground", isRTL && "rotate-180")} />
                <span className="text-primary font-bold">{t("viewingClient", { name: selectedClientName })}</span>
              </div>
            )}
            {children}
          </div>
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
          style={{
            background: "rgba(13,13,16,0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className={cn("flex items-stretch justify-around pt-2 px-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-h-[72px]", isRTL && "flex-row-reverse")}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 py-2 px-3 flex-1 min-w-0"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div
                    className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200",
                      active ? "bg-primary shadow-[0_0_20px_rgba(124,252,0,0.45)]" : "bg-transparent"
                    )}
                  >
                    <item.icon className={cn("w-[22px] h-[22px]", active ? "text-black" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("text-[10px] font-bold truncate w-full text-center leading-none", active ? "text-primary" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] md:hidden"
                style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
                onClick={() => setIsDrawerOpen(false)}
              />

              <motion.div
                initial={{ x: isRTL ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? "100%" : "-100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                className={cn("fixed top-0 bottom-0 z-[201] md:hidden flex flex-col", isRTL ? "right-0" : "left-0")}
                style={{
                  width: 280,
                  background: "#16161A",
                  borderLeft: isRTL ? "1px solid rgba(255,255,255,0.08)" : undefined,
                  borderRight: !isRTL ? "1px solid rgba(255,255,255,0.08)" : undefined,
                }}
              >
                <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className={cn("flex items-center justify-between mb-5", isRTL && "flex-row-reverse")}>
                    <span className="text-base font-extrabold text-white tracking-wide">{t("coachHub")}</span>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-9 h-9 rounded-[10px] bg-white/5 flex items-center justify-center text-[#8B8B8B]"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse text-right")}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #1a2a1a, #2a3a2a)",
                        boxShadow: "0 0 0 2px #7CFC00",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {coachPhoto ? (
                        <img src={coachPhoto} alt="Coach" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#7CFC00" }}>{initials}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{currentCoach?.name || "Coach"}</div>
                      <div style={{ fontSize: 12, color: "#7CFC00" }}>{t("online")}</div>
                    </div>
                  </div>
                </div>

                <nav style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: isRTL ? "flex-end" : "flex-start",
                          flexDirection: isRTL ? "row-reverse" : "row",
                          gap: 14,
                          padding: "13px 16px",
                          borderRadius: 12,
                          marginBottom: 4,
                          background: active ? "rgba(124,252,0,0.1)" : "transparent",
                          borderRight: isRTL ? (active ? "3px solid #7CFC00" : "3px solid transparent") : undefined,
                          borderLeft: !isRTL ? (active ? "3px solid #7CFC00" : "3px solid transparent") : undefined,
                          color: active ? "#7CFC00" : "#8B8B8B",
                          textDecoration: "none",
                          fontSize: 14,
                          fontWeight: active ? 700 : 500,
                          transition: "all 0.18s ease",
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        <item.icon size={20} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div style={{ padding: "12px 12px 32px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: isRTL ? "row-reverse" : "row",
                      gap: 14,
                      padding: "13px 16px",
                      borderRadius: 12,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      color: "#EF4444",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <LogOut size={18} />
                    {t("signOut")}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isEditProfileOpen && (
            <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsEditProfileOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className={cn("relative w-full max-w-sm bg-card border border-white/10 rounded-3xl p-8 shadow-2xl", isRTL && "text-right")}
              >
                <h2 className="text-xl font-black text-white mb-6 tracking-wide">{t("updateProfilePhoto")}</h2>
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
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className={cn(
                    "w-full flex items-center justify-center bg-primary text-black font-black py-4 rounded-2xl hover:bg-primary/90 transition-colors mb-3",
                    isRTL ? "flex-row-reverse gap-3" : "gap-3"
                  )}
                >
                  <Camera className="w-5 h-5" />
                  {t("uploadNewPhoto")}
                </button>
                {coachPhoto && (
                  <button
                    onClick={() => {
                      setCoachPhoto(null);
                      setIsEditProfileOpen(false);
                    }}
                    className="w-full py-4 rounded-2xl border border-white/10 text-muted-foreground text-sm hover:border-white/30 transition-colors"
                  >
                    {t("removePhoto")}
                  </button>
                )}
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className={cn(
                    "absolute top-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors",
                    isRTL ? "left-4" : "right-4"
                  )}
                  aria-label={t("close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
