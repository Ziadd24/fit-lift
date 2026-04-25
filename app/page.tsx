"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useLookupMember, useListAnnouncements, useListPhotos } from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { AnnouncementPopup } from "@/components/ui/AnnouncementPopup";
import { motion, AnimatePresence } from "framer-motion";
import {
   Dumbbell, Calendar, CreditCard, LogOut, Bell, ImageIcon, LayoutDashboard,
  ChevronRight, ChevronLeft, X, Menu, Check, MapPin, Clock, Star, ChevronDown, ArrowRight, Play,
  Activity, Wind,
} from "lucide-react";
import { format } from "date-fns";
import { isMembershipActive, cn } from "@/lib/utils";
import type { Member } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

interface Bundle {
  id?: number;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlight: boolean;
  display_order?: number;
}

const HOME_LIFT = "transition-all duration-300 hover:scale-[1.03] active:scale-95";
const HOME_GLOW = "hover:shadow-[0_0_30px_rgba(124,252,0,0.24)]";
const HOME_CARD = `${HOME_LIFT} ${HOME_GLOW}`;
const HOME_BUTTON_PRIMARY = "transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(124,252,0,0.45)] active:scale-95";
const HOME_BUTTON_SECONDARY = "transition-all duration-300 hover:scale-105 hover:border-primary/60 hover:shadow-[0_0_24px_rgba(124,252,0,0.18)] active:scale-95";
const ARABIC_LANG_LABEL = "\u0639\u0631\u0628\u064a";
const GYM_PHONE = "201009987771";

const getCoachWhatsAppLink = (coachName: string, _lang: "en" | "ar") => {
  const message = `كنت حابب اشترك برايفت مع كابتن ${coachName} وحابب اعرف التفاصيل`;
  return `https://wa.me/${GYM_PHONE}?text=${encodeURIComponent(message)}`;
};

function useIsVisible(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return isVisible;
}

function useCarousel(itemsLength: number, intervalMs = 4000) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(containerRef);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement | undefined;
    if (!card) return;
    container.scrollTo({ left: card.offsetLeft - container.offsetLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (itemsLength > 0) scrollToIndex(0);
  }, [itemsLength, scrollToIndex]);

  useEffect(() => {
    if (itemsLength <= 1 || !isVisible) return;
    const timer = window.setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % itemsLength;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scrollToIndex(nextIndex);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [itemsLength, scrollToIndex, isVisible, intervalMs]);

  const goTo = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
    scrollToIndex(index);
  }, [scrollToIndex]);

  const setActiveIndexOnly = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  const goNext = useCallback(() => { const n = (activeIndexRef.current + 1) % itemsLength; goTo(n); }, [itemsLength, goTo]);
  const goPrev = useCallback(() => { const n = (activeIndexRef.current - 1 + itemsLength) % itemsLength; goTo(n); }, [itemsLength, goTo]);

  return { activeIndex, setActiveIndex: goTo, setActiveIndexOnly, containerRef, isVisible, scrollToIndex, goNext, goPrev };
}

function PricingSection({ lang, t }: { lang: "en" | "ar"; t: any }) {
  const { data: bundles, isLoading } = useQuery<Bundle[]>({
    queryKey: ["bundles"],
    queryFn: async () => {
      const res = await fetch("/api/bundles");
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  const displayBundles = bundles && bundles.length > 0 ? bundles : [
    { name: t.pricing.plans[0].name, price: 700, period: t.pricing.plans[0].period, features: t.pricing.plans[0].features, highlight: false },
    { name: t.pricing.plans[1].name, price: 1200, period: t.pricing.plans[1].period, features: t.pricing.plans[1].features, highlight: false },
    { name: t.pricing.plans[2].name, price: 1700, period: t.pricing.plans[2].period, features: t.pricing.plans[2].features, highlight: false },
    { name: t.pricing.plans[3].name, price: 2950, period: t.pricing.plans[3].period, features: t.pricing.plans[3].features, highlight: true },
    { name: t.pricing.plans[4].name, price: 5000, period: t.pricing.plans[4].period, features: t.pricing.plans[4].features, highlight: false },
  ];

  const { activeIndex, setActiveIndex, setActiveIndexOnly, containerRef: pricingCarouselRef, goNext: pricingNext, goPrev: pricingPrev } = useCarousel(displayBundles.length, 4000);

  return (
    <div className="relative">
      <div
        ref={pricingCarouselRef}
        className="flex overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar gap-5 px-[9vw] md:px-0 -mx-4 md:mx-0 max-w-full scroll-smooth touch-pan-x overscroll-x-contain"
        dir="ltr"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const firstCard = target.children[0] as HTMLElement | undefined;
          if (!firstCard) return;
          const cardWidth = firstCard.offsetWidth + 20;
          const newIndex = Math.round(target.scrollLeft / cardWidth);
          setActiveIndexOnly(newIndex);
        }}
      >
        {displayBundles.map((bundle: any, i: number) => (
          <motion.div
            key={i}
            className="shrink-0 snap-center w-[82vw] sm:w-[60vw] md:w-[calc(50%-10px)] xl:w-[calc(25%-12px)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <div
              className={`relative overflow-hidden rounded-[24px] md:rounded-[28px] p-4 md:p-6 flex flex-col min-h-[440px] md:min-h-[500px] transition-all duration-300 ${
                bundle.highlight
                  ? "border-2 border-[#47D84B] shadow-[0_0_0_1px_rgba(71,216,75,0.14),0_0_38px_rgba(71,216,75,0.22)]"
                  : "border border-white/[0.08]"
              }`}
              style={{
                background: bundle.highlight
                  ? "linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.98) 100%)"
                  : "linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(12,12,12,0.98) 100%)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: bundle.highlight
                    ? "radial-gradient(circle at top center, rgba(71,216,75,0.16), transparent 42%)"
                    : "radial-gradient(circle at top center, rgba(255,255,255,0.05), transparent 38%)",
                }}
              />

              {bundle.highlight && (
                <span className="absolute top-0 right-0 bg-[#47D84B] text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] md:tracking-[0.14em] px-4 md:px-6 py-2.5 md:py-3 rounded-bl-2xl shadow-[0_10px_24px_rgba(71,216,75,0.28)]">
                  {lang === "ar" ? "الأفضل قيمة" : "RECOMMENDED"}
                </span>
              )}

              <div className="relative z-10 flex flex-col items-center text-center flex-1">
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 md:mb-4 ${
                    bundle.highlight ? "bg-[#47D84B]/12 border border-[#47D84B]/25" : "bg-white/[0.03] border border-white/[0.08]"
                  }`}
                >
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-[#47D84B]" strokeWidth={2.2} />
                </div>

                <div className="mb-3 md:mb-4">
                  <h4 className="text-[14px] md:text-[17px] font-black text-white uppercase tracking-[0.12em] md:tracking-[0.18em]">{bundle.name}</h4>
                </div>

                <div className="flex items-end justify-center gap-2 md:gap-3 mb-1 md:mb-2">
                  <span className={`font-black text-white leading-none ${bundle.highlight ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
                    {bundle.price.toLocaleString()}
                  </span>
                  <span className="text-[15px] md:text-[18px] text-white/55 font-bold mb-1.5 md:mb-2">{t.pricing.currency}</span>
                </div>

                <p className="text-center text-[14px] md:text-[15px] text-white/45 mb-4 md:mb-6">{bundle.period}</p>

                <div className="w-full h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)] mb-4 md:mb-6" />

                <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1 w-full text-left">
                  {bundle.features.map((f: string, index: number) => (
                    <li key={index} className="flex items-center gap-2.5 md:gap-3 text-white/72 text-[13px] md:text-[15px]">
                      <span className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#47D84B]/10 flex-shrink-0">
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#47D84B]" strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`https://wa.me/${GYM_PHONE}?text=${encodeURIComponent(t.pricing.msg.replace("{plan}", bundle.name).replace("{price}", bundle.price.toString()))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto w-full py-3 md:py-3.5 rounded-full font-black text-[14px] md:text-[15px] tracking-wide text-center transition-all active:scale-95 ${
                    bundle.highlight
                      ? "bg-[#47D84B] text-white shadow-[0_14px_30px_rgba(71,216,75,0.28)] hover:scale-105 hover:shadow-[0_0_34px_rgba(71,216,75,0.36)]"
                      : "bg-[#111111] text-white hover:bg-[#47D84B] hover:text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(124,252,0,0.22)]"
                  }`}
                >
                  {t.pricing.button}
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4 md:hidden" dir="ltr">
        {displayBundles.map((_b: any, i: number) => (
          <button
            key={i}
            onClick={() => { setActiveIndex(i); }}
            aria-label={`Go to plan ${i + 1}`}
            className={`h-1.5 rounded-full transition-[width,background-color,box-shadow] duration-300 ease-out ${i === activeIndex ? "w-6 bg-[#47D84B] shadow-[0_0_8px_rgba(71,216,75,0.5)]" : "w-1.5 bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

function CoachesSection({ lang, t, dbCoaches, coachPhotoMap }: { lang: "en" | "ar"; t: any; dbCoaches: any[] | undefined; coachPhotoMap: Record<string, { url: string; caption?: string }> }) {
  const allCoaches = dbCoaches && dbCoaches.length > 0 ? dbCoaches : t.coaches.coaches.map((c: any) => ({ name: c.name }));
  const { activeIndex: activeCoachIndex, setActiveIndex: setActiveCoachIndex, setActiveIndexOnly: setActiveCoachIndexOnly, containerRef: coachCarouselRef, goNext: coachNext, goPrev: coachPrev } = useCarousel(allCoaches.length, 4000);

  return (
    <div className="relative">
      <div
        ref={coachCarouselRef}
        dir="ltr"
        className="flex overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar gap-4 md:gap-6 px-4 md:px-0 -mx-4 md:mx-0 max-w-full scroll-smooth touch-pan-x overscroll-x-contain"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const firstCard = target.children[0] as HTMLElement | undefined;
          if (!firstCard) return;
          const cardWidth = firstCard.offsetWidth + (window.innerWidth >= 768 ? 24 : 16);
          const newIndex = Math.round(target.scrollLeft / cardWidth);
          setActiveCoachIndexOnly(newIndex);
        }}
      >
        {allCoaches.map((coach: any, i: number) => {
          const coachData = coachPhotoMap[coach.name];
          const uploadedPhoto = coachData?.url;
          const caption = coachData?.caption;
          return (
            <motion.div key={coach.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="shrink-0 snap-center w-[65vw] sm:w-[45vw] md:w-[280px] lg:w-[300px]">
              <Card className={cn("group border border-white/10 bg-card overflow-hidden h-full", HOME_CARD)}>
                <div className="aspect-[3/4] overflow-hidden bg-black/40 relative">
                  <img
                    src={uploadedPhoto || `/images/coach${i+1}.png`}
                    alt={coach.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.name}`; }}
                  />
                </div>
                <div className="p-3 md:p-4 flex flex-col flex-grow">
                  <h4 className="text-white font-bold text-sm md:text-lg">{coach.name}</h4>
                  <div className="h-6 mt-1">
                    {caption ? <p className="text-white/60 text-xs line-clamp-1">{caption}</p> : <span className="invisible text-xs">&nbsp;</span>}
                  </div>
                  <a
                    href={getCoachWhatsAppLink(coach.name, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block w-full py-2.5 rounded-full bg-[#7CFC00] text-black font-bold text-xs text-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(124,252,0,0.4)] active:scale-95"
                  >
                    {lang === "ar" ? "اشترك دلوقتي" : "Subscribe Now"}
                  </a>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-center gap-2 mt-4" dir="ltr">
        {allCoaches.map((_coach: any, i: number) => (
          <button
            key={i}
            onClick={() => { setActiveCoachIndex(i); }}
            aria-label={`Go to coach ${i + 1}`}
            className={`h-1.5 rounded-full transition-[width,background-color,box-shadow] duration-300 ease-out ${i === activeCoachIndex ? "w-6 bg-[#7CFC00] shadow-[0_0_8px_rgba(124,252,0,0.5)]" : "w-1.5 bg-white/20"}`}
          />
        ))}
      </div>
      <button onClick={coachPrev} aria-label="Previous coach" className="flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/60 border border-white/15 text-white items-center justify-center opacity-60 hover:opacity-100 hover:bg-[#7CFC00] hover:text-black hover:scale-110 transition-all z-10">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={coachNext} aria-label="Next coach" className="flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/60 border border-white/15 text-white items-center justify-center opacity-60 hover:opacity-100 hover:bg-[#7CFC00] hover:text-black hover:scale-110 transition-all z-10">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const translations = {
  en: {
    nav: { about: "About Us", services: "Services", schedule: "Schedule", pricing: "Pricing", coaches: "Coaches", contact: "Contact", login: "Member Login", dashboard: "Dashboard", logout: "Logout" },
    hero: { title1: "Push Your", title2: "Limits", desc: "Premium equipment, expert trainers, and a community that pushes you to be your best self. Welcome to the next level of fitness.", join: "Join Now", login: "Member Login" },
    about: { tag: "About Us", title: "More Than Just A Gym", p1: "FIT & LIFT was founded on a simple principle: provide the best environment for people who are serious about their fitness journey. We are not just a place with weights; we are a community of dedicated individuals.", p2: "Whether you are a beginner learning the ropes or a seasoned athlete prepping for competition, our state-of-the-art facility and expert staff are here to support your goals.", years: "Years", members: "Members", coaches: "Coaches", active: "Active Members" },
    services: { tag: "What We Offer", title: "World-Class Facilities", items: [
      { title: "Equipment Zone", desc: "State-of-the-art fitness floor featuring premium resistance machines, free weights, and cable systems for comprehensive strength training at every level." },
      { title: "High Quality Fitness Room", desc: "Spacious workout area with top-tier equipment, climate control, and dedicated zones for cardio, strength, and functional training." },
      { title: "Sauna & Spa", desc: "Recover and relax in our premium sauna and spa facilities—perfect for muscle recovery, stress relief, and post-workout rejuvenation." }
    ]},
    schedule: { tag: "Weekly Schedule", title1: "HRS", title2: "Schedule", filters: { all: "All Hours", men: "Men's Hours", women: "Women's Hours" }, labels: { menMorn: "Men (Morning)", women: "Women", menEve: "Men (Evening)" } },
    coaches: { tag: "The Elite Team", title: "Expert Coaches", coaches: [
      { name: "Coach Mahmoud", role: "Bodybuilding Expert", tagline: "10+ Years Experience" },
      { name: "Coach Ahmed", role: "Crossfit Specialist", tagline: "Former Champion" },
      { name: "Coach Sarah", role: "Nutrition & Yoga", tagline: "Certified Pro" },
      { name: "Coach Ziad", role: "Powerlifting Pro", tagline: "Elite Trainer" }
    ], book: "Book Session" },
    pricing: { tag: "Membership Plans", title1: "Choose Your", title2: "Plan", plans: [
      { name: "1 MONTH", period: "per month", badge: null, features: ["Full gym access", "Locker included"] },
      { name: "2 MONTHS", period: "for 2 months", badge: null, features: ["Full gym access", "Locker included"] },
      { name: "3 MONTHS", period: "per quarter", badge: null, features: ["Full gym access", "Locker included"] },
      { name: "6 MONTHS", period: "per 6 months", badge: "RECOMMENDED", features: ["Full gym access", "Locker included"] },
      { name: "12 MONTHS", period: "per year", badge: null, features: ["Full gym access", "Locker included"] }
    ], currency: "EGP", button: "Subscribe Now", msg: "Hi! I'm interested in the {plan} membership plan (EGP {price})." },
    contact: { tag: "Get In Touch", title1: "Contact", title2: "Us", desc: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.", labels: { address: "Address", phone: "Phone", hours: "Working Hours" }, hoursText: "24/7 (Except Thu: Ends at 12AM)", mapTitle: "Visit Our Real Location", mapBtn: "Open in Google Maps", form: { name: "Your Name", phone: "Phone Number", email: "Email Address", subject: "Subject", subj1: "Membership Inquiry", subj2: "Class Question", subj3: "Personal Training", subj4: "Other", message: "Message", send: "Send Message", success: "Message sent successfully!" } },
    footer: { rights: "FIT & LIFT. All rights reserved." },
    modal: { title: "Member Login", desc: "Enter your membership code to access your portal.", code: "Membership Code", placeholder: "e.g. FL-1234", btn: "Access Portal", loading: "Verifying..." }
  },
  ar: {
    nav: { 
      about: "عنّا", 
      services: "خدماتنا", 
      schedule: "المواعيد", 
      pricing: "الاشتراكات", 
      coaches: "المدربين", 
      contact: "تواصل معانا", 
      login: "دخول الأعضاء", 
      dashboard: "لوحة التحكم", 
      logout: "تسجيل الخروج" 
    },
    hero: { 
      title1: "اكسر", 
      title2: "حدودك.", 
      desc: "أحدث معدات، مدربين محترفين، وجوّ هيخليك توصل لأحسن نسخة منك. أهلاً بيك في FIT & LIFT.", 
      join: "اشترك دلوقتي", 
      login: "دخول الأعضاء" 
    },
    about: { 
      tag: "عنّا", 
      title: "أكتر من مجرد جيم", 
      p1: "FIT & LIFT اتأسس على مبدأ بسيط: نخلق أحسن بيئة للناس الجادة في مشوارها الرياضي. مش مجرد أوزان وآلات، احنا عيلة بتتشارك نفس الهدف.", 
      p2: "سواء كنت لسّه بتبدأ ولا رياضي محترف، عندنا اللي يساعدك توصل لهدفك. معداتنا على أعلى مستوى وفريقنا جاهز يقف جنبك في كل خطوة.", 
      years: "سنين خبرة", 
      members: "عضو نشط", 
      coaches: "مدرب محترف", 
      active: "عضو بيتمرن" 
    },
    services: { 
      tag: "إيه اللي بنقدّمهولك", 
      title: "مرافق عالمية المستوى", 
      items: [
        { title: "منطقة المعدات", desc: "أرضية رياضية مجهزة بأحدث أجهزة المقاومة والأوزان الحرة والكابلات. مناسبة للمبتدئين والمحترفين." },
        { title: "غرفة فيتنيس متكاملة", desc: "مساحة تمرين واسعة ومكيّفة. فيها مناطق للكارديو والقوة والتمارين الوظيفية." },
        { title: "ساونا وسبا", desc: "ريح عضلاتك بعد التمرين في ساونا وسبا VIP. مثالي للاستشفاء والاسترخاء." }
      ]
    },
    schedule: { 
      tag: "الجدول الأسبوعي", 
      title1: "مواعيد", 
      title2: "التمرين", 
      filters: { all: "كل المواعيد", men: "مواعيد الرجال", women: "مواعيد السيدات" }, 
      labels: { menMorn: "رجال (صباحاً)", women: "سيدات", menEve: "رجال (مساءً)" } 
    },
    coaches: { 
      tag: "نخبة المدربين", 
      title: "مدربينا الخبراء", 
      coaches: [
        { name: "كابتن محمود", role: "خبير كمال أجسام", tagline: "+10 سنين خبرة" },
        { name: "كابتن أحمد", role: "متخصص كروسفت", tagline: "بطل سابق" },
        { name: "كابتن سارة", role: "أخصائية تغذية ويوجا", tagline: "محترفة معتمدة" },
        { name: "كابتن زياد", role: "متخصص رفع أثقال", tagline: "مدرب على أعلى مستوى" }
      ], 
      book: "احجز جلستك" 
    },
    pricing: { 
      tag: "باقات الاشتراك", 
      title1: "اختار", 
      title2: "باقتك", 
      plans: [
        { name: "شهر", period: "شهرياً", badge: null, features: ["دخول شامل للجيم", "لوكر"] },
        { name: "شهرين", period: "كل شهرين", badge: null, features: ["دخول شامل للجيم", "لوكر"] },
        { name: "3 شهور", period: "كل 3 شهور", badge: null, features: ["دخول شامل للجيم", "لوكر"] },
        { name: "6 شهور", period: "كل 6 شهور", badge: "الأفضل قيمة", features: ["دخول شامل للجيم", "لوكر"] },
        { name: "سنة", period: "سنوياً", badge: null, features: ["دخول شامل للجيم", "لوكر"] }
      ], 
      currency: "ج.م", 
      button: "اشترك دلوقتي", 
      msg: "السلام عليكم، عايز أعرف تفاصيل باقة {plan} بسعر {price} ج.م." 
    },
    contact: { 
      tag: "تواصل معانا", 
      title1: "تواصل", 
      title2: "معنا", 
      desc: "عندك سؤال؟ احنا هنا عشان نساعدك. سيب لنا رسالة وهنرد عليك في أسرع وقت.", 
      labels: { address: "العنوان", phone: "الموبايل", hours: "ساعات العمل" }, 
      hoursText: "مفتوح 24/7 (الخميس بيقفل 12 بالليل)", 
      mapTitle: "زور مكاننا", 
      mapBtn: "افتح في خرائط جوجل", 
      form: { 
        name: "الاسم", 
        phone: "رقم التليفون", 
        email: "الإيميل", 
        subject: "الموضوع", 
        subj1: "استفسار عن الاشتراك", 
        subj2: "سؤال عن الحصص", 
        subj3: "تدريب شخصي", 
        subj4: "أمر آخر", 
        message: "الرسالة", 
        send: "إرسال", 
        success: "تم إرسال الرسالة بنجاح!" 
      } 
    },
    footer: { rights: "FIT & LIFT. كل الحقوق محفوظة." },
    modal: { 
      title: "تسجيل دخول الأعضاء", 
      desc: "ادخل كود العضوية بتاعك عشان تفتح حسابك.", 
      code: "كود العضوية", 
      placeholder: "مثال: FL-1234", 
      btn: "دخول", 
      loading: "جاري التحقق..." 
    }
  }
};

function DynamicPopup() {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ["popup-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: ["popup_enabled", "popup_title", "popup_message"] }),
      });
      if (!res.ok) return {};
      return res.json();
    },
    retry: false,
  });

  const isEnabled = data?.popup_enabled === "true";
  const title = data?.popup_title || "";
  const message = data?.popup_message || "";

  if (!isEnabled || !title || !message) return null;

  return <AnnouncementPopup title={title} message={message} />;
}

function PhotoGallery({ lang }: { lang: "en" | "ar" }) {
  const { data: photos, isLoading } = useListPhotos({ global: true, category: "gallery" });
  const [index, setIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const galleryItems = useMemo(() => {
    if (photos && photos.length > 0) {
      const filtered = photos.filter(
        (p: any) => (!p.category || p.category === "gallery") && typeof p.url === "string" && p.url.trim().length > 0
      );
      if (filtered.length > 0) {
        return filtered.map((p: any, photoIndex: number) => ({
          key: `${p.id ?? "photo"}-${photoIndex}`,
          src: p.url.trim(),
        }));
      }
    }
    return [{ key: "fallback-0", src: "/images/gym-hero.jpg" }];
  }, [photos]);

  const totalImages = galleryItems.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % totalImages), [totalImages]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + totalImages) % totalImages), [totalImages]);

  useEffect(() => {
    if (totalImages <= 1) return;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      setIndex((i) => (i + 1) % totalImages);
    };
    const timer = setInterval(tick, 2000);
    return () => clearInterval(timer);
  }, [totalImages]);

  useEffect(() => {
    galleryItems.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, [galleryItems]);

  return (
    <div ref={galleryRef} className="rounded-2xl overflow-hidden h-72 md:h-80 relative group bg-black">
      {isLoading && (
        <div className="absolute inset-0 bg-black/40 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-white/20" />
        </div>
      )}
      {galleryItems.map((item, idx) => (
        <img
          key={item.key}
          src={item.src}
          alt={lang === "ar" ? "\u0635\u0648\u0631\u0629 \u0645\u0646 \u0627\u0644\u062c\u064a\u0645" : "Gallery photo"}
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: idx === index ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            willChange: 'opacity',
            zIndex: idx === index ? 1 : 0,
          }}
        />
      ))}
      {totalImages > 1 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
          <button onClick={prev} aria-label="Previous photo" className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 md:bg-black/50 text-white flex items-center justify-center opacity-95 md:opacity-50 transition-all hover:bg-primary hover:text-black hover:scale-110 hover:opacity-100 z-10 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} aria-label="Next photo" className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 md:bg-black/50 text-white flex items-center justify-center opacity-95 md:opacity-50 transition-all hover:bg-primary hover:text-black hover:scale-110 hover:opacity-100 z-10 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-90 md:opacity-50 transition-opacity duration-300 z-10">
            {galleryItems.map((_item, i: number) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-primary" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MemberPortal() {
  const router = useRouter();
  const { currentMember, setMemberAuth, logoutMember } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "announcements" | "photos">("overview");
  const [contactSuccess, setContactSuccess] = useState(false);
  const { data: scheduleSetting } = useQuery<{ value: string }>({
    queryKey: ["setting", "schedule_image_url"],
    queryFn: async () => {
      const res = await fetch("/api/settings?key=schedule_image_url");
      if (!res.ok) return { value: "" };
      return res.json();
    },
    retry: false,
  });
  const scheduleImageUrl = scheduleSetting?.value || "";
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const t = translations[lang];
  
  const lookupMutation = useLookupMember();
  const { data: announcements } = useListAnnouncements();
  const { data: photos } = useListPhotos(
    currentMember ? { memberId: currentMember.id } : undefined
  );

  const { data: dbCoaches } = useQuery<any[]>({
    queryKey: ["db-coaches"],
    queryFn: async () => {
      const res = await fetch("/api/coaches");
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  const { data: coachPhotos } = useQuery<any[]>({
    queryKey: ["photos-coach"],
    queryFn: async () => {
      const res = await fetch("/api/photos");
      if (!res.ok) return [];
      const allPhotos = await res.json();
      return allPhotos.filter((p: any) => p.category === "coach");
    },
    retry: false,
  });

  const coachPhotoMap: Record<string, { url: string; caption?: string }> = useMemo(() => {
    const byId: Record<number, { url: string; caption?: string }> = {};
    if (coachPhotos) {
      coachPhotos.forEach((p) => {
        if (p.coach_id && !byId[p.coach_id]) byId[p.coach_id] = { url: p.url, caption: p.caption };
      });
    }
    const byName: Record<string, { url: string; caption?: string }> = {};
    if (dbCoaches) {
      dbCoaches.forEach((c: any) => {
        if (byId[c.id]) byName[c.name] = byId[c.id];
      });
    }
    return byName;
  }, [coachPhotos, dbCoaches]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "photo.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
      window.open(url, "_blank");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) return;
    lookupMutation.mutate(
      { membershipCode: code },
      {
        onSuccess: (member: Member) => {
          setMemberAuth(member.membership_code, member);
          setIsLoginModalOpen(false);
          setCode("");
        },
        onError: () => {
          setError("Invalid membership code. Please check and try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
      <DynamicPopup />

      <section className="relative min-h-screen overflow-hidden" style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}>
      
        <div className="absolute inset-0 z-0">
          <img
            src="/images/gym-hero.jpg"
            alt={lang === "ar" ? "\u062c\u064a\u0645 FIT & LIFT" : "Fit & Lift Gym Interior"}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.55) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(10,10,10) 0%, transparent 40%)' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(124,252,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,252,0,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
      
        <div className="absolute top-0 left-0 w-[5px] h-full bg-primary z-30" />
      
        <nav className="fixed top-0 left-0 right-0 z-50 h-[72px]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)', backdropFilter: 'blur(4px)' }}>
          <div className="max-w-[1440px] mx-auto px-8 lg:px-[120px] h-full flex items-center justify-between">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 flex-shrink-0">
              <img src="/images/logo.png" alt="Fit and Lift" className="h-[72px] w-auto object-contain" />
              <span className="text-lg font-black text-primary tracking-widest hidden sm:block">FIT & LIFT</span>
            </a>
      
            <div className="hidden lg:flex items-center gap-10">
              {[
                { href: '#about', label: t.nav.about },
                { href: '#services', label: t.nav.services },
                { href: '#schedule', label: t.nav.schedule },
                { href: '#pricing', label: t.nav.pricing },
                { href: '#coaches', label: t.nav.coaches },
                { href: '#contact', label: t.nav.contact },
              ].map((link) => (
                <a key={link.href} href={link.href} className="nav-link-hero text-xs font-semibold text-white/70 hover:text-white uppercase tracking-widest transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
      
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1" dir="ltr">
                <button onClick={() => setLang("en")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>EN</button>
                <button onClick={() => setLang("ar")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>{ARABIC_LANG_LABEL}</button>
              </div>
              {currentMember ? (
                <>
                  <span className="text-sm text-white/70 font-medium">{currentMember.name}</span>
                  <Button onClick={() => router.push("/client/dashboard")} className="bg-primary text-primary-foreground rounded-full px-5 font-bold text-sm hover:scale-105 hover:shadow-[0_4px_20px_rgba(124,252,0,0.4)] active:scale-95 flex items-center gap-2 transition-all">
                    <LayoutDashboard className="w-4 h-4" /> {t.nav.dashboard}
                  </Button>
                  <button onClick={() => { logoutMember(); router.push("/"); }} aria-label={t.nav.logout} className="text-white/40 hover:text-white transition-colors px-2">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Button onClick={() => router.push("/client/login")} className="bg-primary text-primary-foreground rounded-full px-6 font-bold text-sm hover:scale-105 hover:shadow-[0_4px_20px_rgba(124,252,0,0.4)] active:scale-95 flex items-center gap-2 transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {t.nav.login}
                </Button>
              )}
            </div>
      
            <div className="lg:hidden flex items-center gap-2">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5" dir="ltr">
                <button onClick={() => setLang("en")} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>EN</button>
                <button onClick={() => setLang("ar")} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>{ARABIC_LANG_LABEL}</button>
              </div>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 relative z-[60]">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden fixed top-[72px] left-0 right-0 backdrop-blur-sm border-b border-white/10 z-40"
              style={{ background: 'rgba(0,0,0,0.97)' }}>
              <div className="px-6 py-6 flex flex-col gap-4">
                {[
                  { href: '#about', label: t.nav.about },
                  { href: '#services', label: t.nav.services },
                  { href: '#schedule', label: t.nav.schedule },
                  { href: '#pricing', label: t.nav.pricing },
                  { href: '#coaches', label: t.nav.coaches },
                  { href: '#contact', label: t.nav.contact },
                ].map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-white/80 hover:text-primary transition-colors">{link.label}</a>
                ))}
                <div className="flex items-center gap-2 mt-2 pt-4 border-t border-white/10" dir="ltr">
                  <button onClick={() => { setLang("en"); setIsMobileMenuOpen(false); }} className={`px-4 py-2 rounded-full text-sm font-bold ${lang === "en" ? "bg-primary text-primary-foreground" : "border border-white/10 text-white/60"}`}>EN</button>
                  <button onClick={() => { setLang("ar"); setIsMobileMenuOpen(false); }} className={`px-4 py-2 rounded-full text-sm font-bold ${lang === "ar" ? "bg-primary text-primary-foreground" : "border border-white/10 text-white/60"}`}>{ARABIC_LANG_LABEL}</button>
                </div>
                <Button onClick={() => { router.push("/client/login"); setIsMobileMenuOpen(false); }} className="bg-primary text-primary-foreground w-full mt-2 font-bold">{t.nav.login}</Button>
                {currentMember && (
                  <>
                    <Button onClick={() => { router.push("/client/dashboard"); setIsMobileMenuOpen(false); }} className="bg-white/10 text-white w-full font-bold flex items-center gap-2 justify-center">
                      <LayoutDashboard className="w-4 h-4" /> {t.nav.dashboard}
                    </Button>
                    <Button onClick={() => { logoutMember(); setIsMobileMenuOpen(false); }} className="bg-white/5 text-white/60 w-full font-bold flex items-center gap-2 justify-center hover:text-red-400">
                      <LogOut className="w-4 h-4" /> {t.nav.logout}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      
        <div className="relative z-20 max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-[120px] flex flex-col justify-center min-h-screen pt-[126px] pb-20 sm:pb-24">
      
          <motion.div animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="text-primary text-[12px] sm:text-xs font-bold uppercase tracking-[3px] sm:tracking-[4px]">
              {lang === "ar" ? "جيم رقم 1 في بنها" : "Benha's No.1 Gym"}
            </span>
          </motion.div>
      
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 70, damping: 18 }}
            className="font-extrabold uppercase leading-[1.1] mb-5 sm:mb-6 max-w-3xl"
            style={{ fontSize: 'clamp(54px, 14vw, 108px)', letterSpacing: '2px', fontFamily: "'Montserrat', sans-serif" }}
          >
            <span className="text-white block">{lang === "ar" ? "اكسر" : "Push Your"}</span>
            <span className="text-primary block">{lang === "ar" ? "حدودك." : "Limits."}</span>
            <span className="block" style={{ color: '#0a0a0a', WebkitTextStroke: '2px rgba(255,255,255,0.5)', paintOrder: 'stroke fill', letterSpacing: '-1px', fontSize: '0.82em', lineHeight: '1.15', marginTop: '0.1em', display: 'block' }}>
              {lang === "ar" ? "أوصل لأقصى إمكانياتك." : "Reach Your Potential."}
            </span>
          </motion.h1>
      
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="w-14 sm:w-16 h-[3px] bg-primary mb-5 sm:mb-6"
          />
      
          <motion.p animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="text-white/60 text-[15px] sm:text-base leading-relaxed max-w-[90%] sm:max-w-md mb-10 sm:mb-10">
            {lang === "ar"
              ? "جيم متكامل مش ناقصه غيرك."
              : "Premium equipment, expert trainers, and a community that pushes you to be your best self."}
          </motion.p>
      
          <motion.div animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <a href="#pricing"
              className={cn("inline-flex items-center justify-center bg-primary text-primary-foreground font-black uppercase tracking-[1.5px] text-sm sm:text-sm px-8 sm:px-10 h-14 sm:h-14 rounded-full w-full sm:w-auto", HOME_BUTTON_PRIMARY)}>
              {lang === "ar" ? "اشترك دلوقتي" : "Join Now"}
            </a>
            <button onClick={() => router.push('/client/login')}
              className={cn("inline-flex items-center justify-center border border-white/25 text-white font-bold uppercase tracking-[1.5px] text-sm sm:text-sm px-8 sm:px-10 h-14 sm:h-14 rounded-full hover:text-primary w-full sm:w-auto", HOME_BUTTON_SECONDARY)}>
              {t.nav.login}
            </button>
          </motion.div>

        </div>
      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-center gap-5 z-20 absolute bottom-8 left-0 right-0"
        >
          <a href="https://www.facebook.com/share/1E86b6Vp3n/" target="_blank" rel="noopener noreferrer"
            className="text-white/30 hover:text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <div className="w-8 h-px bg-white/10" />
          <a href="https://www.instagram.com/fit.and.lift.gym" target="_blank" rel="noopener noreferrer"
            className="text-white/30 hover:text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
          <div className="w-8 h-px bg-white/10" />
          <a href="https://www.tiktok.com/@fit.and.lift.gym" target="_blank" rel="noopener noreferrer"
            className="text-white/30 hover:text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
          </a>
        </motion.div>
      
      </section>

      <section id="about" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }} viewport={{ once: true, margin: "-50px" }}>
              <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.about.tag}</h2>
              <h3 className="text-4xl md:text-5xl font-display text-white font-bold mb-6 uppercase">{t.about.title}</h3>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                {t.about.p1}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t.about.p2}
              </p>
              <div className="flex gap-8 mt-8">
                {[{ n: "6+", l: t.about.years }, { n: "25", l: t.about.coaches }].map((s) => (
                  <div key={s.l}>
                    <p className="text-3xl font-black text-primary">{s.n}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.15 }} viewport={{ once: true, margin: "-50px" }} className="flex flex-col gap-5">
              <div className="relative">
                <PhotoGallery lang={lang} />
                
              </div>
              <div className="flex justify-center">
                <a
                  href="https://youtu.be/13Tr4BRMQUg?si=A_lNALVebJ_bsfVH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 bg-[#7CFC00] text-black font-black uppercase tracking-wider text-sm px-8 py-3.5 rounded-full shadow-[0_0_24px_rgba(124,252,0,0.35)]",
                    HOME_BUTTON_PRIMARY
                  )}
                >
                  <Play className="w-4 h-4 fill-black" />
                  {lang === "ar" ? "شوف أكتر" : "See Details"}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.services.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.services.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 px-4 md:px-0 max-w-full">
            {[
              { icon: Dumbbell, title: t.services.items[0].title, desc: t.services.items[0].desc },
              { icon: Activity, title: t.services.items[1].title, desc: t.services.items[1].desc },
              { icon: Wind, title: t.services.items[2].title, desc: t.services.items[2].desc },
            ].map((s, i) => (
              <motion.div key={s.title} className="snap-start" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className={cn("p-3 md:p-5 h-full bg-card border-white/10", HOME_CARD)}>
                  <div className="flex flex-col gap-2 h-full items-center text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <s.icon className="w-5 h-5 md:w-6 md:h-6 text-[#7CFC00]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white mb-1">{s.title}</h4>
                      <p className="text-xs text-white/60 leading-tight">{s.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="schedule" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 18 }} viewport={{ once: true, margin: "-50px" }} className="mb-10">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.schedule.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.schedule.title1} <span className="text-primary text-glow">{t.schedule.title2}</span></h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
            viewport={{ once: true, margin: "-50px" }}
            className={cn("rounded-2xl overflow-hidden border border-white/10 bg-black/40", HOME_CARD)}
          >
            {scheduleImageUrl ? (
              <img
                src={scheduleImageUrl}
                alt={lang === "ar" ? "\u062c\u062f\u0648\u0644 \u0627\u0644\u062c\u064a\u0645" : "Gym Schedule"}
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Calendar className="w-16 h-16 text-white/10 mb-4" />
                <p className="text-muted-foreground text-lg">{lang === "ar" ? "الجدول لسه ما اتنزلش" : "No schedule uploaded yet"}</p>
                <p className="text-muted-foreground text-sm mt-1">{lang === "ar" ? "الجدول هيظهر هنا لما يتنزل من لوحة التحكم" : "Schedule image will appear here once uploaded from admin panel"}</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section id="coaches" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.coaches.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.coaches.title}</h3>
          </div>
          <CoachesSection lang={lang} t={t} dbCoaches={dbCoaches} coachPhotoMap={coachPhotoMap} />
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 18 }} viewport={{ once: true, margin: "-50px" }} className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.pricing.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.pricing.title1} <span className="text-primary">{t.pricing.title2}</span></h3>
          </motion.div>
          <PricingSection lang={lang} t={t} />
        </div>
      </section>

      <section id="contact" className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }} viewport={{ once: true }}>
              <h2 className="text-xs md:text-sm text-[#7CFC00] font-bold uppercase tracking-widest mb-2">{t.contact.tag}</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 uppercase">{t.contact.title1} {t.contact.title2 && <span className="text-[#7CFC00]">{t.contact.title2}</span>}</h3>
              <p className="text-white/60 text-base mb-8 max-w-md">
                {t.contact.desc}
              </p>

              <div className="space-y-4 md:space-y-6">
                {[
                  { icon: MapPin, label: t.contact.labels.address, value: lang === "ar" ? "بنها - حي الزهور - بجوار بن ريان" : "Banha - Al Zohour - Beside Ben Rayyan" },
                  { icon: WhatsAppIcon, label: t.contact.labels.phone, value: "+20 10 09987771", isLTR: true },
                  { icon: Clock, label: t.contact.labels.hours, value: t.contact.hoursText },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-card/50">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-[#7CFC00]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#7CFC00]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{item.label}</h4>
                      <p className={`text-white/60 text-sm ${item.isLTR ? 'dir-ltr' : ''}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl overflow-hidden h-[200px] md:h-[250px] bg-[linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('/images/gym-hero.jpg')] bg-center bg-cover flex flex-col items-center justify-center border border-white/10">
                <MapPin className="w-8 h-8 md:w-10 md:h-10 text-[#7CFC00] mb-3" />
                <h3 className="text-white font-bold text-lg md:text-xl mb-4">{t.contact.mapTitle}</h3>
                <a
                  href="https://maps.app.goo.gl/6zSWUcQR2dnzYNwY7"
                  target="_blank" rel="noopener noreferrer"
                  className={cn("bg-[#7CFC00] text-black font-bold uppercase tracking-wider text-xs md:text-sm px-6 md:px-8 py-3 rounded-xl", HOME_BUTTON_PRIMARY)}
                >
                  {t.contact.mapBtn}
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }} viewport={{ once: true }}>
              <div className="bg-card border border-white/10 rounded-2xl p-5 md:p-8">
                <form onSubmit={(e) => { e.preventDefault(); setContactSuccess(false); fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))}).then(r=>{if(r.ok){setContactSuccess(true);(e.target as HTMLFormElement).reset();}}); }} className="space-y-4 md:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm font-medium">{t.contact.form.name}</Label>
                      <input name="name" type="text" required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm font-medium">{t.contact.form.phone}</Label>
                      <input name="phone" type="tel" required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm font-medium">{t.contact.form.email}</Label>
                    <input name="email" type="email" required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm font-medium">{t.contact.form.subject}</Label>
                    <div className="relative">
                      <select name="subject" required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm appearance-none cursor-pointer pr-10">
                        <option value="membership">{t.contact.form.subj1}</option>
                        <option value="class">{t.contact.form.subj2}</option>
                        <option value="pt">{t.contact.form.subj3}</option>
                        <option value="other">{t.contact.form.subj4}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm font-medium">{t.contact.form.message}</Label>
                    <textarea name="message" required rows={3} className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all min-h-[100px] text-sm resize-y"></textarea>
                  </div>

                  {contactSuccess && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[#47D84B] text-sm font-medium flex items-center gap-2">
                      <Check className="w-4 h-4" /> {t.contact.form.success}
                    </motion.p>
                  )}

                  <button type="submit" className={cn("w-full bg-[#7CFC00] text-black font-bold uppercase tracking-wider text-sm py-4 rounded-xl", HOME_BUTTON_PRIMARY)}>
                    {t.contact.form.send}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <a
        href={`https://wa.me/${GYM_PHONE}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30", HOME_BUTTON_PRIMARY)}
        aria-label="Contact us on WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
      </a>

      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center justify-center gap-0 mb-4 hover:opacity-80 transition-opacity">
            <img src="/images/logo.png" alt="FIT & LIFT" className="h-[128px] w-auto object-contain" />
            <span className="text-xl font-black text-primary tracking-widest -ml-4">FIT & LIFT</span>
          </a>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} {t.footer.rights}</p>
        </div>
      </footer>

      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setIsLoginModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <Card className="p-8">
                <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display text-white mb-2">{t.modal.title}</h2>
                <p className="text-muted-foreground text-sm mb-6">{t.modal.desc}</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>{t.modal.code}</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.modal.placeholder} autoFocus />
                  </div>
                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                  <Button type="submit" className="bg-primary text-black w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-95" disabled={lookupMutation.isPending}>
                    {lookupMutation.isPending ? t.modal.loading : t.modal.btn}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 md:p-10"
            onClick={() => setZoomedPhoto(null)}
          >
            <button
              onClick={() => setZoomedPhoto(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomedPhoto}
              alt={lang === "ar" ? "\u0635\u0648\u0631\u0629 \u0645\u0643\u0628\u0631\u0629" : "Zoomed photo"}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}