"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/PremiumComponents";
import { CoachCard, type CoachListItem } from "@/components/ui/CoachCard";

type CoachPhoto = {
  coach_id: number | null;
  url: string;
  caption?: string | null;
};

const GYM_PHONE = "201009987771";

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
                    ctaHref={getCoachWhatsAppLink(coach.name)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
