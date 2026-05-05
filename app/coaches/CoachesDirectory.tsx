"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/PremiumComponents";
import { CoachCard, type CoachListItem } from "@/components/ui/CoachCard";
import { cn } from "@/lib/utils";

type CoachPhoto = {
  coach_id: number | null;
  url: string;
  caption?: string | null;
};

const GYM_PHONE = "201009987771";

const COACH_PACKAGES = [
  { sessions: 10, label: "10 جلسات", price: 1500, popular: false },
  { sessions: 15, label: "15 جلسة", price: 1900, popular: false },
  { sessions: 20, label: "20 جلسة", price: 2400, popular: true },
  { sessions: 30, label: "30 جلسة", price: 3400, popular: false },
] as const;

function getCoachPackageWhatsAppLink(packageLabel: string, price: number) {
  const message = `أهلاً، أنا عايز أشترك في باقة ${packageLabel} بـ ${price} جنيه. ممكن نكمل التفاصيل؟`;
  return `https://wa.me/${GYM_PHONE}?text=${encodeURIComponent(message)}`;
}

function CoachPackagesModal({
  open,
  onClose,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  lang: "en" | "ar";
}) {
  const [isMobileSheet, setIsMobileSheet] = useState(false);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const handleMediaChange = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobileSheet(event.matches);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handlePopState = () => {
      onClose();
    };

    handleMediaChange(mediaQuery);
    document.body.style.overflow = "hidden";
    window.history.pushState({ coachPackagesModal: true }, "");
    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = "";
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.coachPackagesModal) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  const copy = lang === "ar"
    ? {
        title: "اختر باقتك",
        subtitle: "اختر عدد الجلسات الللي يناسبك، وتواصل معانا على واتساب عشان تدفع.",
        cta: "احجز دلوقتي",
        badge: "الأكثر طلبًا",
        footer: "الدفع بيكون كاش أو فودافون كاش عند الحجز.",
        close: "إغلاق",
        currency: "جنيه",
      }
    : {
        title: "Choose Your Package",
        subtitle: "Pick the number of sessions that fits you, then message us on WhatsApp to complete payment.",
        cta: "Pay on WhatsApp",
        badge: "Most Popular",
        footer: "Payment is available in cash or via Vodafone Cash when booking.",
        close: "Close",
        currency: "EGP",
      };

  const panelAnimation = isMobileSheet
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { opacity: 1, scale: 0.96, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 1, scale: 0.96, y: 16 } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className={cn("flex min-h-full justify-center", isMobileSheet ? "items-end" : "items-center p-4 sm:p-6")} dir={lang === "ar" ? "rtl" : "ltr"}>
            <motion.div
              {...panelAnimation}
              transition={{ duration: 0.24, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                "w-full border bg-[#0b0b0b] text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-y-auto",
                isMobileSheet
                  ? "rounded-t-[24px] px-5 pb-8 pt-5 border-white/15 max-h-[85vh]"
                  : "max-w-[520px] rounded-[24px] p-6 border-white/10"
              )}
            >
              {isMobileSheet && <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-black", isMobileSheet ? "text-xl" : "text-2xl")}>{copy.title}</h3>
                  <p className={cn("leading-relaxed text-white/70", isMobileSheet ? "mt-1.5 text-sm" : "mt-2 text-sm")}>
                    {copy.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={copy.close}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/80 transition-all hover:border-primary/50 hover:text-white hover:bg-white/[0.08]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className={cn("mt-5", isMobileSheet ? "space-y-4" : "space-y-3")}>
                {COACH_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.sessions}
                    className={cn(
                      "rounded-2xl border transition-all",
                      isMobileSheet ? "px-5 py-5" : "px-4 py-4",
                      pkg.popular
                        ? "border-primary/50 bg-primary/[0.12] shadow-[0_0_32px_rgba(124,252,0,0.15)]"
                        : "border-white/15 bg-white/[0.05]"
                    )}
                  >
                    <div className={cn(
                      "flex gap-4",
                      isMobileSheet ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between"
                    )}>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className={cn("font-black", isMobileSheet ? "text-xl" : "text-lg")}>{pkg.label}</h4>
                          {pkg.popular && (
                            <span className="rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                              {copy.badge}
                            </span>
                          )}
                        </div>
                        <p className={cn("font-black text-primary", isMobileSheet ? "text-3xl" : "text-2xl")}>
                          {pkg.price.toLocaleString()} <span className="text-base font-semibold text-white/70">{copy.currency}</span>
                        </p>
                      </div>
                      <a
                        href={getCoachPackageWhatsAppLink(pkg.label, pkg.price)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center justify-center rounded-full bg-primary font-black text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(124,252,0,0.4)] active:scale-95",
                          isMobileSheet ? "w-full min-h-14 px-6 text-base" : "min-h-12 px-5 text-sm"
                        )}
                      >
                        {copy.cta}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <p className={cn("text-center", isMobileSheet ? "mt-6 text-sm leading-6 text-white/60" : "mt-5 text-xs leading-5 text-white/55")}>
                {copy.footer}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const copy = {
  en: {
    back: "Back to Home",
    eyebrow: "The Full Team",
    title: "All Coaches",
    subtitle: "Meet every coach on the FIT & LIFT roster and find the right fit for your training goals.",
    searchPlaceholder: "Search coaches",
    sortLabel: "Sort",
    sortAsc: "A-Z",
    sortDesc: "Z-A",
    empty: "No coaches match your criteria. Try adjusting your filters.",
    cta: "Subscribe Now",
  },
  ar: {
    back: "\u0627\u0644\u0631\u062c\u0648\u0639 \u0644\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
    eyebrow: "\u0641\u0631\u064a\u0642\u0646\u0627 \u0643\u0627\u0645\u0644\u0627\u064b",
    title: "\u0643\u0644 \u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646",
    subtitle: "\u062a\u0639\u0631\u0641 \u0639\u0644\u0649 \u0641\u0631\u064a\u0642 FIT & LIFT \u0643\u0627\u0645\u0644\u0627\u064b \u0648\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u062f\u0631\u0628 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0647\u062f\u0641\u0643.",
    searchPlaceholder: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u062f\u0631\u0628",
    sortLabel: "\u0627\u0644\u062a\u0631\u062a\u064a\u0628",
    sortAsc: "\u0623-\u064a",
    sortDesc: "\u064a-\u0623",
    empty: "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u062f\u0631\u0628\u0648\u0646 \u064a\u0637\u0627\u0628\u0642\u0648\u0646 \u0645\u0639\u0627\u064a\u064a\u0631\u0643. \u062d\u0627\u0648\u0644 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0628\u062d\u062b.",
    cta: "\u0627\u0634\u062a\u0631\u0643 \u062f\u0644\u0648\u0642\u062a\u064a",
  },
} as const;

function getCoachWhatsAppLink(coachName: string) {
  const message = `كنت حابب اشترك برايفت مع كابتن ${coachName} وحابب اعرف التفاصيل`;
  return `https://wa.me/${GYM_PHONE}?text=${encodeURIComponent(message)}`;
}

function CoachesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse">
          <div className="aspect-[3/4] bg-white/10" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-2/3 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/5" />
            <div className="h-11 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoachesDirectory({
  lang,
  initialSearch,
  initialSort,
}: {
  lang: "en" | "ar";
  initialSearch: string;
  initialSort: "asc" | "desc";
}) {
  const t = copy[lang];
  const [isCoachPackagesOpen, setIsCoachPackagesOpen] = useState(false);

  const { data: coaches = [], isLoading } = useQuery<CoachListItem[]>({
    queryKey: ["coaches-page-list"],
    queryFn: async () => {
      const res = await fetch("/api/coaches");
      if (!res.ok) throw new Error("Failed to load coaches");
      return res.json();
    },
    retry: false,
  });

  const { data: coachPhotos = [] } = useQuery<CoachPhoto[]>({
    queryKey: ["coaches-page-photos"],
    queryFn: async () => {
      const res = await fetch("/api/photos?category=coach");
      if (!res.ok) throw new Error("Failed to load coach photos");
      return res.json();
    },
    retry: false,
  });

  const photoMap = useMemo(() => {
    const next: Record<number, { url: string; caption?: string }> = {};
    coachPhotos.forEach((photo) => {
      if (photo.coach_id && !next[photo.coach_id]) {
        next[photo.coach_id] = { url: photo.url, caption: photo.caption ?? undefined };
      }
    });
    return next;
  }, [coachPhotos]);

  const visibleCoaches = useMemo(() => {
    const next = coaches.filter((coach) => coach.name.toLowerCase().includes(initialSearch.toLowerCase()));
    next.sort((a, b) => (initialSort === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
    return next;
  }, [coaches, initialSearch, initialSort]);

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 py-8 text-foreground md:px-8 lg:px-12"
      style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-[1440px]"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:border-primary/50 hover:bg-white/[0.03] hover:text-white"
        >
          {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {t.back}
        </Link>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">{t.title}</h1>
            <p className="mt-3 text-sm text-white/65 md:text-base">{t.subtitle}</p>
          </div>
          <form method="get" className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
            <input type="hidden" name="lang" value={lang} />
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 rtl:left-auto rtl:right-4" />
              <Input
                defaultValue={initialSearch}
                name="search"
                placeholder={t.searchPlaceholder}
                className="min-h-11 rounded-full border-white/10 bg-white/[0.03] pl-11 rtl:pl-4 rtl:pr-11"
              />
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/70">
              <span>{t.sortLabel}</span>
              <select name="sort" defaultValue={initialSort} className="w-full bg-transparent text-white outline-none">
                <option value="asc" className="bg-black">{t.sortAsc}</option>
                <option value="desc" className="bg-black">{t.sortDesc}</option>
              </select>
            </label>
          </form>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <CoachesSkeleton />
          ) : visibleCoaches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center text-white/65">
              {t.empty}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4 md:gap-6">
              {visibleCoaches.map((coach) => (
                <motion.div
                  key={coach.id ?? coach.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CoachCard
                    coach={coach}
                    caption={photoMap[coach.id ?? -1]?.caption}
                    imageUrl={photoMap[coach.id ?? -1]?.url}
                    ctaLabel={t.cta}
                    onCtaClick={() => setIsCoachPackagesOpen(true)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
      <CoachPackagesModal 
        open={isCoachPackagesOpen} 
        onClose={() => setIsCoachPackagesOpen(false)} 
        lang={lang} 
      />
    </main>
  );
}
