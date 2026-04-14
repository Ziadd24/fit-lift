"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useLookupMember, useListAnnouncements, useListPhotos } from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { AnnouncementPopup } from "@/components/ui/AnnouncementPopup";
import { motion, AnimatePresence } from "framer-motion";
import {
   Dumbbell, Calendar, CreditCard, LogOut, Bell, ImageIcon, LayoutDashboard,
  ChevronRight, ChevronLeft, X, Menu, Check, MapPin, Clock, Star, ChevronDown, ArrowRight, Play,
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

  // Fallback plans from translations if DB is empty or loading
  const displayBundles = bundles && bundles.length > 0 ? bundles : [
    { name: t.pricing.plans[0].name, price: 700, period: t.pricing.plans[0].period, features: t.pricing.plans[0].features, highlight: false },
    { name: t.pricing.plans[1].name, price: 1200, period: t.pricing.plans[1].period, features: t.pricing.plans[1].features, highlight: false },
    { name: t.pricing.plans[2].name, price: 1700, period: t.pricing.plans[2].period, features: t.pricing.plans[2].features, highlight: false },
    { name: t.pricing.plans[3].name, price: 2950, period: t.pricing.plans[3].period, features: t.pricing.plans[3].features, highlight: true },
    { name: t.pricing.plans[4].name, price: 5000, period: t.pricing.plans[4].period, features: t.pricing.plans[4].features, highlight: false },
  ];

  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className="relative">
      {/* Mobile: Horizontal scroll with proper card sizing */}
      <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-5 gap-4 px-4 md:px-0 -mx-4 md:mx-0 max-w-full"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const scrollLeft = target.scrollLeft;
          const cardWidth = target.offsetWidth * 0.85;
          const newIndex = Math.round(scrollLeft / cardWidth);
          setActiveIndex(newIndex);
        }}
      >
        {displayBundles.map((bundle: any, i: number) => (
          <motion.div
            key={i}
            className="shrink-0 snap-center w-[85vw] sm:w-[60vw] md:w-full"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <div className={`relative rounded-2xl p-6 flex flex-col h-full transition-all duration-300 ${bundle.highlight ? "border-2 border-primary bg-card shadow-[0_0_30px_rgba(124,252,0,0.15)]" : "border border-white/10 bg-card"}`}>
              {/* Badge */}
              {bundle.highlight && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#7CFC00] text-black text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
                  {lang === "ar" ? "بننصح بيه" : "RECOMMENDED"}
                </span>
              )}

              {/* Plan Name */}
              <div className="text-center mb-4">
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-[0.2em]">{bundle.name}</h4>
              </div>

              {/* Price */}
              <div className="text-center mb-2">
                <span className={`font-black text-white ${bundle.highlight ? "text-4xl" : "text-3xl"}`}>{bundle.price.toLocaleString()}</span>
                <span className="text-sm text-white/50 ml-1">{t.pricing.currency}</span>
              </div>

              {/* Period */}
              <p className="text-center text-xs text-white/40 mb-4">{bundle.period}</p>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />

              {/* Features - Simplified for mobile */}
              <ul className="space-y-2 mb-5 flex-1">
                {bundle.features.slice(0, 2).map((f: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#7CFC00] flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <a
                href={`https://wa.me/201009987771?text=${encodeURIComponent(t.pricing.msg.replace("{plan}", bundle.name).replace("{price}", bundle.price.toString()))}`}
                target="_blank" rel="noopener noreferrer"
                className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider text-center transition-all active:scale-95 ${bundle.highlight ? "bg-[#7CFC00] text-black" : "bg-white/10 text-white hover:bg-[#7CFC00] hover:text-black"}`}
              >
                {t.pricing.button}
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile Pagination Dots */}
      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {displayBundles.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-[#7CFC00]" : "w-1.5 bg-white/20"}`} />
        ))}
      </div>
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

const scheduleData = [
  { id: 'sat', day: 'Saturday', men_morn: '24 Hours', women: '3PM – 9PM', men_eve: '9PM – 7AM' },
  { id: 'sun', day: 'Sunday', men_morn: '24 Hours', women: '9AM – 5PM', men_eve: '5PM – 7AM' },
  { id: 'mon', day: 'Monday', men_morn: '24 Hours', women: '3PM – 9PM', men_eve: '9PM – 7AM' },
  { id: 'tue', day: 'Tuesday', men_morn: '24 Hours', women: '9AM – 5PM', men_eve: '5PM – 7AM' },
  { id: 'wed', day: 'Wednesday', men_morn: '24 Hours', women: '3PM – 9PM', men_eve: '9PM – 7AM' },
  { id: 'thu', day: 'Thursday', men_morn: '12AM – 3PM', women: '3PM – 9PM', men_eve: '9PM – 12AM' },
  { id: 'fri', day: 'Friday', men_morn: '24 Hours', women: '2PM – 8PM', men_eve: '8PM – 7AM' },
];

const translations = {
  en: {
    nav: { about: "About Us", services: "Services", schedule: "Schedule", pricing: "Pricing", coaches: "Coaches", contact: "Contact", login: "Member Login" },
    hero: { title1: "Push Your", title2: "Limits", desc: "Premium equipment, expert trainers, and a community that pushes you to be your best self. Welcome to the next level of fitness.", join: "Join Now", login: "Member Login" },
    about: { tag: "About Us", title: "More Than Just A Gym", p1: "FIT & LIFT was founded on a simple principle: provide the best environment for people who are serious about their fitness journey. We are not just a place with weights; we are a community of dedicated individuals.", p2: "Whether you are a beginner learning the ropes or a seasoned athlete prepping for competition, our state-of-the-art facility and expert staff are here to support your goals.", years: "Years", members: "Members", coaches: "Coaches", active: "Active Members" },
    services: { tag: "What We Offer", title: "World-Class Facilities", items: [
      { title: "Free Weights", desc: "Fully equipped weight room with barbells, dumbbells, and cable machines for all fitness levels." },
      { title: "Group Classes", desc: "Daily classes in HIIT, yoga, spinning, boxing, and more, led by certified expert trainers." },
      { title: "Personal Training", desc: "One-on-one sessions with certified personal trainers tailored to your specific goals." }
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
    nav: { about: "إحنا مين", services: "خدماتنا", schedule: "المواعيد", pricing: "الاشتراكات", coaches: "الكباتن", contact: "تواصل معانا", login: "دخول الأعضاء" },
    hero: { title1: "اكسر", title2: "حدودك", desc: "أحدث الأجهزة، أكفأ المدربين، ومجتمع هيشجعك توصل لأحسن نسخة من نفسك. أهلاً بيك في المستوى الجديد للفيتنس.", join: "اشترك دلوقتي", login: "دخول الأعضاء" },
    about: { tag: "إحنا مين", title: "مش مجرد چيم عادي", p1: "فيت أند ليفت اتأسس على مبدأ بسيط: إننا نوفر أحسن بيئة للناس اللي واخدين رحلة الفيتنس بتاعتهم بجدية. إحنا مش مجرد مكان فيه شوية أجهزة، إحنا مجتمع للابطال.", p2: "سواء كنت مبتدئ لسه بتبدأ طريقك، أو رياضي محترف بتجهز لبطولة، أجهزتنا الحديثة والكباتن بتوعنا هنا عشان يقفوا في ضهرك ويساعدوك توصل لهدفك.", years: "سنة خبرة", members: "عضو", coaches: "كابتن", active: "عضو معانا" },
    services: { tag: "بنقدملك إيه", title: "صالة على أعلى مستوى", items: [
      { title: "صالة أوزان حرة", desc: "صالة حديد مجهزة بالكامل بكل اللي هتحتاجه من دنابل وبارات وأجهزة تناسب كل المستويات." },
      { title: "كلاسات جماعية", desc: "كلاسات يومية زي الكروس فيت، اليوجا، البوكسينج، وغيرها كتير مع كباتن متخصصين." },
      { title: "تدريب شخصي P.T", desc: "حصص خاصة 'ون-تو-ون' مع كباتن محترفين عشان يعملولك برنامج متفصل على هدفك بالظبط." }
    ]},
    schedule: { tag: "جدول الأسبوع", title1: "مواعيد", title2: "الچيم", filters: { all: "كل المواعيد", men: "مواعيد الرجالة", women: "مواعيد السيدات" }, labels: { menMorn: "رجالة (الصبح)", women: "سيدات", menEve: "رجالة (بالليل)" } },
    coaches: { tag: "أكفأ فريق", title: "الكباتن بتوعنا", coaches: [
      { name: "كابتن محمود", role: "خبير كمال أجسام", tagline: "أكتر من ١٠ سنين خبرة" },
      { name: "كابتن أحمد", role: "متخصص كروس فيت", tagline: "بطل سابق" },
      { name: "كابتن سارة", role: "تغذية ويوجا", tagline: "مدربة معتمدة" },
      { name: "كابتن زياد", role: "بطل باورليفتنج", tagline: "مدرب محترف" }
    ], book: "احجز سيشن" },
    pricing: { tag: "باقات الاشتراك", title1: "اختار", title2: "باقتك", plans: [
      { name: "شهر واحد", period: "في الشهر", badge: null, features: ["دخول الچيم بالكامل", "لوكر مجاني"] },
      { name: "شهرين", period: "لمدة شهرين", badge: null, features: ["دخول الچيم بالكامل", "لوكر مجاني"] },
      { name: "٣ شهور", period: "كل ٣ شهور", badge: null, features: ["دخول الچيم بالكامل", "لوكر مجاني"] },
      { name: "٦ شهور", period: "كل ٦ شهور", badge: "بننصح بيه", features: ["دخول الچيم بالكامل", "لوكر مجاني"] },
      { name: "سنة كاملة", period: "في السنة", badge: null, features: ["دخول الچيم بالكامل", "لوكر مجاني"] }
    ], currency: "جنيه", button: "اشترك دلوقتي", msg: "أهلاً! أنا مهتم باشتراك الـ {plan} اللي بـ {price} جنيه." },
    contact: { tag: "تواصل معانا", title1: "كلمنا", title2: "", desc: "عندك استفسار؟ هنكون مبسوطين لو كلمتنا. ابعتلنا رسالة وهنرد عليك في أسرع وقت ممكن.", labels: { address: "العنوان", phone: "التليفون", hours: "مواعيد العمل" }, hoursText: "مفتوح ٢٤ ساعة (ماعدا الخميس: بيقفل ١٢ بالليل)", mapTitle: "زورنا في فرعنا", mapBtn: "افتح على جوجل ماب", form: { name: "اسمك", phone: "رقم الموبايل", email: "الإيميل", subject: "الموضوع", subj1: "استفسار عن الاشتراكات", subj2: "سؤال عن الكلاسات", subj3: "تدريب شخصي P.T", subj4: "حاجة تانية", message: "رسالتك", send: "ابعت الرسالة", success: "الرسالة اتبعتت بنجاح!" } },
    footer: { rights: "فيت أند ليفت. جميع الحقوق محفوظة." },
    modal: { title: "دخول الأعضاء", desc: "دخل كود العضوية بتاعك عشان تدخل على الحساب يابطل.", code: "كود العضوية", placeholder: "مثال: FL-1234", btn: "أدخل الحساب", loading: "بنتأكد..." }
  }
};

function DynamicPopup() {
  const { data: popupTitle } = useQuery<{ value: string }>({
    queryKey: ["setting", "popup_title"],
    queryFn: async () => {
      const res = await fetch("/api/settings?key=popup_title");
      if (!res.ok) return { value: "" };
      return res.json();
    },
    retry: false,
  });

  const { data: popupMessage } = useQuery<{ value: string }>({
    queryKey: ["setting", "popup_message"],
    queryFn: async () => {
      const res = await fetch("/api/settings?key=popup_message");
      if (!res.ok) return { value: "" };
      return res.json();
    },
    retry: false,
  });

  const { data: popupEnabled } = useQuery<{ value: string }>({
    queryKey: ["setting", "popup_enabled"],
    queryFn: async () => {
      const res = await fetch("/api/settings?key=popup_enabled");
      if (!res.ok) return { value: "" };
      return res.json();
    },
    retry: false,
  });

  const isEnabled = popupEnabled?.value === "true";
  const title = popupTitle?.value || "";
  const message = popupMessage?.value || "";

  if (!isEnabled || !title || !message) return null;

  return <AnnouncementPopup />;
}

function PhotoGallery() {
  const { data: photos, isLoading } = useListPhotos({ global: true, category: "gallery" });
  const [index, setIndex] = useState(0);

  const images = photos && photos.length > 0
    ? photos.filter((p: any) => !p.category || p.category === "gallery").map((p: any) => p.url)
    : ["/images/gym-hero.png"];

  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [next, images.length]);

  // Pre-load images
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden h-80 bg-black/40 animate-pulse flex items-center justify-center border border-white/10">
        <ImageIcon className="w-8 h-8 text-white/20" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden h-80 relative group bg-black">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt="Gallery photo"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      {images.length > 1 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-50 transition-all hover:bg-primary hover:text-black hover:scale-110 hover:opacity-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-50 transition-all hover:bg-primary hover:text-black hover:scale-110 hover:opacity-100">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-50 transition-opacity duration-300">
            {images.map((_, i) => (
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
    // Fetch schedule image from settings
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

  // Fetch coaches from DB
  const { data: dbCoaches } = useQuery<any[]>({
    queryKey: ["db-coaches"],
    queryFn: async () => {
      const res = await fetch("/api/coaches");
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  // Fetch coach photos and build map by coach_id
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

  // Build lookup: coach_id -> latest photo URL
  const coachPhotoMapById: Record<number, string> = {};
  if (coachPhotos) {
    coachPhotos.forEach((p) => {
      if (p.coach_id && !coachPhotoMapById[p.coach_id]) coachPhotoMapById[p.coach_id] = p.url;
    });
  }

  // Convert to name-based lookup using dbCoaches
  const coachPhotoMap: Record<string, string> = {};
  if (dbCoaches) {
    dbCoaches.forEach((c: any) => {
      if (coachPhotoMapById[c.id]) {
        coachPhotoMap[c.name] = coachPhotoMapById[c.id];
      }
    });
  }

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

  // ─── Landing Page (always visible) ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
      <DynamicPopup />

      {/* ═══ HERO SECTION ═══ */}
<section className="relative min-h-screen overflow-hidden" style={{ fontFamily: "'Montserrat', 'Inter', sans-serif" }}>

  {/* ── Background Photo + Overlays ── */}
  <div className="absolute inset-0 z-0">
    <img
      src="/images/gym-hero.jpg"
      alt="Fit & Lift Gym Interior"
      className="w-full h-full object-cover object-center"
    />
    {/* Dark overlay using website background color (dark navy) */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.55) 100%)' }} />
    {/* Bottom fade into page background */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(10,10,10) 0%, transparent 40%)' }} />
    {/* Subtle lime grid overlay */}
    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(124,252,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,252,0,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
  </div>

  {/* Side accent bars */}
  <div className="absolute top-0 left-0 w-[5px] h-full bg-primary z-30" />

  {/* ── Navbar ── */}
  <nav className="fixed top-0 left-0 right-0 z-50 h-[80px]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)', backdropFilter: 'blur(8px)' }}>
    <div className="max-w-[1440px] mx-auto px-8 lg:px-[120px] h-full flex items-center justify-between">
      {/* Logo */}
      <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 flex-shrink-0">
        <img src="/images/logo.png" alt="Fit and Lift" className="h-[56px] w-auto object-contain" />
        <span className="text-base font-black text-primary tracking-widest hidden sm:block">FIT & LIFT</span>
      </a>

      {/* Nav Links */}
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

      {/* Right: Lang + Auth */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1" dir="ltr">
          <button onClick={() => setLang("en")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>EN</button>
          <button onClick={() => setLang("ar")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-white/50 hover:text-white"}`}>عربي</button>
        </div>
        {currentMember ? (
          <>
            <span className="text-sm text-white/70 font-medium">{currentMember.name}</span>
            <Button onClick={() => router.push("/client/dashboard")} className="bg-primary text-primary-foreground rounded-full px-5 font-bold text-sm hover:scale-105 hover:shadow-[0_4px_20px_rgba(124,252,0,0.4)] active:scale-95 flex items-center gap-2 transition-all">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
            <button onClick={() => { logoutMember(); router.push("/"); }} className="text-white/40 hover:text-white transition-colors px-2">
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

      {/* Mobile hamburger */}
      <div className="lg:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </div>
  </nav>

  {/* Mobile Menu */}
  <AnimatePresence>
    {isMobileMenuOpen && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
        className="lg:hidden fixed top-[80px] left-0 right-0 backdrop-blur-md border-b border-white/10 z-40"
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
            <button onClick={() => { setLang("ar"); setIsMobileMenuOpen(false); }} className={`px-4 py-2 rounded-full text-sm font-bold ${lang === "ar" ? "bg-primary text-primary-foreground" : "border border-white/10 text-white/60"}`}>عربي</button>
          </div>
          <Button onClick={() => { router.push("/client/login"); setIsMobileMenuOpen(false); }} className="bg-primary text-primary-foreground w-full mt-2 font-bold">{t.nav.login}</Button>
          {currentMember && (
            <>
              <Button onClick={() => { router.push("/client/dashboard"); setIsMobileMenuOpen(false); }} className="bg-white/10 text-white w-full font-bold flex items-center gap-2 justify-center">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Button>
              <Button onClick={() => { logoutMember(); setIsMobileMenuOpen(false); }} className="bg-white/5 text-white/60 w-full font-bold flex items-center gap-2 justify-center hover:text-red-400">
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* ── Hero Content ── */}
  <div className="relative z-20 max-w-[1440px] mx-auto px-8 lg:px-[120px] flex flex-col justify-center min-h-screen pt-[100px] pb-24">

    {/* Tag line */}
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
      className="flex items-center gap-3 mb-6">
      <div className="w-2 h-2 rounded-full bg-primary" />
      <span className="text-primary text-[11px] font-bold uppercase tracking-[3px]">
        {lang === "ar" ? "الچيم رقم 1 في بنها" : "Benha's No.1 Gym"}
      </span>
    </motion.div>

    {/* Headline */}
    <motion.h1
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 70, damping: 18 }}
      className="font-black uppercase leading-[1.0] mb-6 max-w-3xl"
      style={{ fontSize: 'clamp(48px, 7vw, 108px)', letterSpacing: '-3px', fontFamily: "'Montserrat', sans-serif" }}
    >
      <span className="text-white block">{lang === "ar" ? "اكسر" : "Push Your"}</span>
      <span className="text-primary block">{lang === "ar" ? "حدودك." : "Limits."}</span>
      <span className="block" style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.35)', paintOrder: 'stroke fill' }}>
        {lang === "ar" ? "حقق إمكاناتك." : "Reach Your Potential."}
      </span>
    </motion.h1>

    {/* Accent line */}
    <motion.div
      initial={{ scaleX: 0, originX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.55, duration: 0.5 }}
      className="w-16 h-[3px] bg-primary mb-6"
    />

    {/* Description */}
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
      className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-10">
      {lang === "ar"
        ? "أحدث الأجهزة، أكفأ المدربين، ومجتمع هيشجعك توصل لأحسن نسخة من نفسك."
        : "Premium equipment, expert trainers, and a community that pushes you to be your best self."}
    </motion.p>

    {/* CTA Buttons */}
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
      className="flex flex-wrap gap-4">
      <a href="#pricing"
        className="inline-flex items-center justify-center bg-primary text-primary-foreground font-black uppercase tracking-[1.5px] text-[11px] px-8 h-14 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,252,0,0.45)] active:scale-95">
        {lang === "ar" ? "انضم إلينا" : "Join Now"}
      </a>
      <button onClick={() => router.push('/client/login')}
        className="inline-flex items-center justify-center border border-white/20 text-white font-bold uppercase tracking-[1.5px] text-[11px] px-8 h-14 rounded-full transition-all hover:border-primary/60 hover:text-primary active:scale-95">
        {t.nav.login}
      </button>
    </motion.div>
  </div>

  {/* Social sidebar — desktop only */}
  <motion.div
    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}
    className="hidden lg:flex flex-col absolute left-8 top-1/2 -translate-y-1/2 items-center gap-5 z-20">
    <a href="https://www.facebook.com/share/1E86b6Vp3n/" target="_blank" rel="noopener noreferrer"
      className="text-white/30 hover:text-primary transition-colors">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    </a>
    <div className="w-px h-10 bg-white/10" />
    <a href="https://www.instagram.com/fit.and.lift.gym" target="_blank" rel="noopener noreferrer"
      className="text-white/30 hover:text-primary transition-colors">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
    </a>
  </motion.div>

</section>

      {/* About */}
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
                {[{ n: "15+", l: t.about.years }, { n: "5K+", l: t.about.members }, { n: "25", l: t.about.coaches }].map((s) => (
                  <div key={s.l}>
                    <p className="text-3xl font-black text-primary">{s.n}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.15 }} viewport={{ once: true, margin: "-50px" }} className="relative">
              <PhotoGallery />
              <div className="absolute -bottom-6 -left-6 bg-primary text-black p-6 rounded-2xl font-bold rtl:-right-6 rtl:-left-auto">
                <p className="text-4xl font-black">500+</p>
                <p className="text-sm uppercase tracking-widest">{t.about.active}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.services.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.services.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 px-4 md:px-0 max-w-full">
            {[
              { icon: Dumbbell, title: t.services.items[0].title, desc: t.services.items[0].desc },
              { icon: Calendar, title: t.services.items[1].title, desc: t.services.items[1].desc },
              { icon: CreditCard, title: t.services.items[2].title, desc: t.services.items[2].desc },
            ].map((s, i) => (
              <motion.div key={s.title} className="snap-start" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="p-6 md:p-8 h-full bg-card border-white/10 transition-all active:scale-[0.98]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#7CFC00]/10 flex items-center justify-center flex-shrink-0">
                      <s.icon className="w-6 h-6 md:w-7 md:h-7 text-[#7CFC00]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg md:text-xl font-bold text-white mb-2">{s.title}</h4>
                      <p className="text-sm md:text-base text-white/60 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

            {/* Schedule Section — displays uploaded schedule image */}
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
            className="rounded-2xl overflow-hidden border border-white/10 bg-black/40"
          >
            {scheduleImageUrl ? (
              <img
                src={scheduleImageUrl}
                alt="Gym Schedule"
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Calendar className="w-16 h-16 text-white/10 mb-4" />
                <p className="text-muted-foreground text-lg">{lang === "ar" ? "مفيش جدول متاح حالياً" : "No schedule uploaded yet"}</p>
                <p className="text-muted-foreground text-sm mt-1">{lang === "ar" ? "الجدول هيتحمل من لوحة التحكم" : "Schedule image will appear here once uploaded from admin panel"}</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Expert Coaches */}
      <section id="coaches" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.coaches.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.coaches.title}</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0 max-w-full">
            {(dbCoaches && dbCoaches.length > 0 ? dbCoaches : t.coaches.coaches.map(c => ({ name: c.name }))).map((coach: any, i: number) => {
              const uploadedPhoto = coachPhotoMap[coach.name];
              return (
              <motion.div key={coach.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="group border border-white/10 bg-card overflow-hidden active:scale-[0.98] transition-transform">
                  <div className="aspect-square md:aspect-[3/4] overflow-hidden bg-black/40 relative">
                    <img
                      src={uploadedPhoto || `/images/coach${i+1}.png`}
                      alt={coach.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.name}`; }}
                    />
                  </div>
                  <div className="p-3 md:p-4">
                    <h4 className="text-white font-bold text-sm md:text-lg">{lang === "ar" ? "كابتن " + coach.name : "Coach " + coach.name}</h4>
                  </div>
                </Card>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 18 }} viewport={{ once: true, margin: "-50px" }} className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.pricing.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.pricing.title1} <span className="text-primary">{t.pricing.title2}</span></h3>
          </motion.div>
          <PricingSection lang={lang} t={t} />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Left Column (Info & Map Link) */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }} viewport={{ once: true }}>
              <h2 className="text-xs md:text-sm text-[#7CFC00] font-bold uppercase tracking-widest mb-2">{t.contact.tag}</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 uppercase">{t.contact.title1} {t.contact.title2 && <span className="text-[#7CFC00]">{t.contact.title2}</span>}</h3>
              <p className="text-white/60 text-base mb-8 max-w-md">
                {t.contact.desc}
              </p>

              <div className="space-y-4 md:space-y-6">
                {[
                  { icon: MapPin, label: t.contact.labels.address, value: "بنها - زهور - بجانب بن ريان" },
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

              {/* Map Link Container */}
              <div className="mt-8 rounded-2xl overflow-hidden h-[200px] md:h-[250px] bg-[linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('/images/hero_bg.png')] bg-center bg-cover flex flex-col items-center justify-center border border-white/10">
                <MapPin className="w-8 h-8 md:w-10 md:h-10 text-[#7CFC00] mb-3" />
                <h3 className="text-white font-bold text-lg md:text-xl mb-4">{t.contact.mapTitle}</h3>
                <a
                  href="https://maps.app.goo.gl/6zSWUcQR2dnzYNwY7"
                  target="_blank" rel="noopener noreferrer"
                  className="bg-[#7CFC00] text-black font-bold uppercase tracking-wider text-xs md:text-sm px-6 md:px-8 py-3 rounded-xl active:scale-95"
                >
                  {t.contact.mapBtn}
                </a>
              </div>
            </motion.div>

            {/* Right Column (Form) */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }} viewport={{ once: true }}>
              <div className="bg-card border border-white/10 rounded-2xl p-5 md:p-8">
                <form onSubmit={(e) => { e.preventDefault(); alert(t.contact.form.success); }} className="space-y-4 md:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm font-medium">{t.contact.form.name}</Label>
                      <input type="text" required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm font-medium">{t.contact.form.phone}</Label>
                      <input type="tel" required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm font-medium">{t.contact.form.email}</Label>
                    <input type="email" required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm font-medium">{t.contact.form.subject}</Label>
                    <select required className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all text-sm appearance-none cursor-pointer">
                      <option value="membership">{t.contact.form.subj1}</option>
                      <option value="class">{t.contact.form.subj2}</option>
                      <option value="pt">{t.contact.form.subj3}</option>
                      <option value="other">{t.contact.form.subj4}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm font-medium">{t.contact.form.message}</Label>
                    <textarea required rows={3} className="w-full px-4 py-3 border border-white/10 rounded-xl bg-secondary text-white outline-none focus:border-[#7CFC00] transition-all min-h-[100px] text-sm resize-y"></textarea>
                  </div>

                  <button type="submit" className="w-full bg-[#7CFC00] text-black font-bold uppercase tracking-wider text-sm py-4 rounded-xl active:scale-95">
                    {t.contact.form.send}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/201009987771"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-110 transition-transform"
        aria-label="Contact us on WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
      </a>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center justify-center gap-0 mb-4 hover:opacity-80 transition-opacity">
            <img src="/images/logo.png" alt="FIT & LIFT" className="h-[128px] w-auto object-contain" />
            <span className="text-xl font-black text-primary tracking-widest -ml-4">FIT & LIFT</span>
          </a>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} {t.footer.rights}</p>
        </div>
      </footer>

      {/* Login Modal */}
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

      {/* Photo Zoom Modal */}
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
              alt="Zoomed"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
