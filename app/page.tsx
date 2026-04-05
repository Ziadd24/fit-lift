"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useLookupMember, useListAnnouncements, useListPhotos } from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { AnnouncementPopup } from "@/components/ui/AnnouncementPopup";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Calendar, CreditCard, LogOut, Bell, ImageIcon,
  ChevronRight, ChevronLeft, X, Menu, Check, MapPin, Clock, Star,
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
      if (!res.ok) throw new Error("Failed to fetch bundles");
      return res.json();
    },
  });

  // Fallback plans from translations if DB is empty or loading
  const displayBundles = bundles && bundles.length > 0 ? bundles : [
    { name: t.pricing.plans[0].name, price: 700, period: t.pricing.plans[0].period, features: t.pricing.plans[0].features, highlight: false },
    { name: t.pricing.plans[1].name, price: 1200, period: t.pricing.plans[1].period, features: t.pricing.plans[1].features, highlight: false },
    { name: t.pricing.plans[2].name, price: 1700, period: t.pricing.plans[2].period, features: t.pricing.plans[2].features, highlight: false },
    { name: t.pricing.plans[3].name, price: 2950, period: t.pricing.plans[3].period, features: t.pricing.plans[3].features, highlight: true },
    { name: t.pricing.plans[4].name, price: 5000, period: t.pricing.plans[4].period, features: t.pricing.plans[4].features, highlight: false },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {displayBundles.map((bundle: any, i: number) => (
        <motion.div
          key={i}
          className="w-full"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ y: -6, boxShadow: "0 0 35px hsla(128, 49%, 48%, 0.4)" }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className={`relative rounded-xl p-8 py-10 flex flex-col items-center text-center min-h-[520px] transition-all duration-300 cursor-pointer ${bundle.highlight ? "border-2 border-primary bg-[#111827] shadow-[0_0_30px_rgba(62,182,76,0.15)]" : "border border-white/10 bg-[#111827]"}`}>
            {bundle.highlight && (
              <span className="absolute -top-3.5 right-4 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                {lang === "ar" ? "بننصح بيه" : "RECOMMENDED"}
              </span>
            )}
            <div className="mb-6 mt-2">
              <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-[0.15em] mb-6">{bundle.name}</h4>
            <div className="mb-2">
              <span className={`font-black text-white ${bundle.highlight ? "text-5xl" : "text-4xl"}`}>{bundle.price.toLocaleString()}</span>
              <span className="text-base text-muted-foreground ml-2">{t.pricing.currency}</span>
            </div>
            <p className="text-sm text-muted-foreground italic mb-8">{bundle.period}</p>
            <div className="w-full border-t border-white/10 mb-8" />
            <ul className="space-y-4 mb-10 flex-1">
              {bundle.features.map((f: string, index: number) => (
                <li key={index} className="flex items-center gap-2.5 text-muted-foreground text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a
              href={`https://wa.me/201009987771?text=${encodeURIComponent(t.pricing.msg.replace("{plan}", bundle.name).replace("{price}", bundle.price.toString()))}`}
              target="_blank" rel="noopener noreferrer"
              className={`inline-flex items-center justify-center font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${bundle.highlight ? "bg-primary text-black hover:shadow-[0_0_20px_rgba(62,182,76,0.5)]" : "bg-[#1a2235] text-white hover:bg-primary hover:text-black"}`}
            >
              {t.pricing.button}
            </a>
          </div>
        </motion.div>
      ))}
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

function PhotoGallery() {
  const { data: photos, isLoading } = useListPhotos({ global: true });
  const [index, setIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden h-80 bg-black/40 animate-pulse flex items-center justify-center border border-white/10">
        <ImageIcon className="w-8 h-8 text-white/20" />
      </div>
    );
  }

  const images = photos && photos.length > 0
    ? photos.map(p => p.url)
    : ["/images/gym-hero.png"];

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="rounded-2xl overflow-hidden h-80 relative group bg-black">
      <AnimatePresence initial={false}>
        <motion.img
          key={index}
          src={images[index]}
          alt="Gallery photo"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black hover:scale-110">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black hover:scale-110">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "men" | "women">("all");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const t = translations[lang];
  
  const lookupMutation = useLookupMember();
  const { data: announcements } = useListAnnouncements();
  const { data: photos } = useListPhotos(
    currentMember ? { memberId: currentMember.id } : undefined
  );

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

  if (currentMember) {
    const isActive = isMembershipActive(currentMember.sub_expiry_date);
    const daysRemaining = Math.max(0, Math.ceil((new Date(currentMember.sub_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    
    return (
      <div className="min-h-screen bg-background text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
        {/* Member Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-32">
              <div className="flex items-center gap-0">
                <img src="/images/logo.png" alt="FIT & LIFT" className="h-[112px] w-auto object-contain" />
                <span className="text-xl font-black text-primary tracking-widest -ml-4 hidden sm:block">FIT & LIFT</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={isActive ? "success" : "destructive"}>
                  {isActive ? "Active" : "Expired"}
                </Badge>
                <span className="text-sm text-muted-foreground hidden md:block">{currentMember.name}</span>
                <button
                  onClick={logoutMember}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Welcome banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden mb-8 h-48">
            <img src="/images/gym-hero.png" alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8">
              <div>
                <p className="text-primary text-sm font-bold uppercase tracking-widest mb-1">Welcome Back</p>
                <h1 className="text-3xl md:text-4xl font-display text-white font-black uppercase">{currentMember.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <p className="text-muted-foreground text-sm">Code: <span className="font-mono text-white">{currentMember.membership_code}</span></p>
                  <div className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                  <p className="text-primary text-sm font-bold uppercase tracking-tight">{daysRemaining} Days Remaining</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: CreditCard, label: "Membership",
                value: currentMember.membership_type,
                sub: null, color: "text-primary"
              },
              {
                icon: Calendar, label: "Expires",
                value: format(new Date(currentMember.sub_expiry_date), "MMM dd, yyyy"),
                sub: null, color: isActive ? "text-green-400" : "text-destructive"
              },
              {
                icon: Dumbbell, label: "Status",
                value: isActive ? "Active Member" : "Membership Expired",
                sub: null, color: isActive ? "text-green-400" : "text-destructive"
              },
            ].map((s) => (
              <Card key={s.label} className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-card/50 rounded-xl border border-white/5 mb-6 w-fit">
            {(["overview", "announcements", "photos"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wider transition-all",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="mb-6 p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentMember.membership_code}`} 
                     alt="Access QR Code" 
                     className="w-32 h-32"
                   />
                </div>
                <h3 className="text-lg font-display text-white mb-2 uppercase tracking-wide">GYM ACCESS QR</h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">Scan this code at the reception desk to log your entry.</p>
                <div className="mt-6 pt-6 border-t border-white/5 w-full">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Validated Access Code</p>
                  <p className="text-xl font-mono text-white mt-1">{currentMember.membership_code}</p>
                </div>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" /> Recent Announcements
                  </h3>
                  {announcements && announcements.length > 0 ? (
                    <div className="space-y-3">
                      {announcements.slice(0, 3).map((a) => (
                        <div key={a.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="font-bold text-white text-sm">{a.title}</p>
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No announcements yet.</p>
                  )}
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" /> Recent Photos
                  </h3>
                  {photos && photos.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.slice(0, 8).map((p) => (
                        <div key={p.id} onClick={() => setZoomedPhoto(p.url)} className="aspect-square rounded-lg overflow-hidden bg-black cursor-pointer group relative">
                          <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                             <Star className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No photos uploaded yet.</p>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="space-y-4">
              {announcements && announcements.length > 0 ? (
                announcements.map((a) => (
                  <Card key={a.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={a.is_global ? "default" : "outline"}>
                        {a.is_global ? "Global" : "Personal"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{a.title}</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">No announcements yet.</p>
              )}
            </div>
          )}

          {activeTab === "photos" && (
            <div>
              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {photos.map((p) => (
                    <Card key={p.id} className="overflow-hidden group">
                      <div className="h-48 overflow-hidden bg-black relative cursor-pointer" onClick={() => setZoomedPhoto(p.url)}>
                        <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                           <span className="text-white text-xs font-bold uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full">Click to Zoom</span>
                        </div>
                      </div>
                      <div className="p-3 flex justify-between items-end">
                        <div className="flex-1">
                          {p.caption && <p className="text-sm text-white line-clamp-1">{p.caption}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(p.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDownload(p.url, `photo-${p.id}.jpg`)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
                  <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">No photos for your profile yet.</p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Login modal backdrop close */}
        <AnimatePresence>
          {isLoginModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
              onClick={() => setIsLoginModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="p-8">
                  <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-display text-white mb-6">Member Login</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label>Membership Code</Label>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. FL-1234"
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    <Button type="submit" className="w-full" disabled={lookupMutation.isPending}>
                      {lookupMutation.isPending ? "Verifying..." : "Access Portal"}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── Landing Page (not logged in) ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
      <AnnouncementPopup />

      {/* ═══ NEW HERO SECTION ═══ */}
      <section className="hero-new" style={{ fontFamily: "'Inter', 'Montserrat', sans-serif" }}>
        {/* ── Navbar (transparent, overlays hero) ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 h-[140px]" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.9) 0%, transparent 100%)' }}>
          <div className="max-w-[1440px] mx-auto px-8 lg:px-[120px] h-full flex items-center justify-between">
            {/* Logo */}
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-0 flex-shrink-0">
              <img src="/images/logo.png" alt="Fit and Lift" className="h-[120px] w-auto object-contain" />
              <span className="text-xl font-black text-primary tracking-widest -ml-4 hidden sm:block drop-shadow-md">FIT & LIFT</span>
            </a>

            {/* Nav Links (right-aligned) */}
            <div className="hidden lg:flex items-center gap-12">
              <a href="#about" className="nav-link-hero text-sm font-medium text-white/90 hover:text-white">{t.nav.about}</a>
              <a href="#services" className="nav-link-hero text-sm font-medium text-white/90 hover:text-white">{t.nav.services}</a>
              <a href="#schedule" className="nav-link-hero text-sm font-medium text-white/90 hover:text-white">{t.nav.schedule}</a>
              <a href="#pricing" className="nav-link-hero text-sm font-medium text-white/90 hover:text-white">{t.nav.pricing}</a>
              <a href="#coaches" className="nav-link-hero text-sm font-medium text-white/90 hover:text-white">{t.nav.coaches}</a>
              <a href="#contact" className="nav-link-hero text-sm font-medium text-white/90 hover:text-white">{t.nav.contact}</a>
            </div>

            {/* Right: Language Toggle + Login (desktop) */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center bg-white/5 rounded-full p-1" dir="ltr">
                <button onClick={() => setLang("en")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "en" ? "bg-[#7CFC00] text-black" : "text-white/60 hover:text-white"}`}>EN</button>
                <button onClick={() => setLang("ar")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "ar" ? "bg-[#7CFC00] text-black" : "text-white/60 hover:text-white"}`}>عربي</button>
              </div>
              <Button onClick={() => router.push("/client/login")} className="bg-[#7CFC00] text-black rounded-full px-6 font-bold text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_20px_rgba(124,252,0,0.4)] active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                {t.nav.login}
              </Button>
            </div>

            {/* Mobile hamburger */}
            <div className="lg:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden fixed top-20 left-0 right-0 bg-[#0a0a12]/95 backdrop-blur-md border-b border-white/10 z-40">
              <div className="px-6 py-6 flex flex-col gap-4">
                <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white">{t.nav.about}</a>
                <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white">{t.nav.services}</a>
                <a href="#schedule" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white">{t.nav.schedule}</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white">{t.nav.pricing}</a>
                <a href="#coaches" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white">{t.nav.coaches}</a>
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white">{t.nav.contact}</a>
                <div className="flex items-center gap-2 mt-2" dir="ltr">
                  <button onClick={() => { setLang("en"); setIsMobileMenuOpen(false); }} className={`px-4 py-2 rounded-full text-sm font-bold ${lang === "en" ? "bg-[#7CFC00] text-black" : "border border-white/10 text-white/60 hover:text-white"}`}>EN</button>
                  <button onClick={() => { setLang("ar"); setIsMobileMenuOpen(false); }} className={`px-4 py-2 rounded-full text-sm font-bold ${lang === "ar" ? "bg-[#7CFC00] text-black" : "border border-white/10 text-white/60 hover:text-white"}`}>عربي</button>
                </div>
                <Button onClick={() => { router.push("/client/login"); setIsMobileMenuOpen(false); }} className="bg-[#7CFC00] text-black w-full mt-2 font-bold">{t.nav.login}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Central Athlete Image ── */}
        <motion.img
          src="/images/hero_athlete.png"
          alt="Athlete"
          className="hero-athlete-img"
          initial={{ opacity: 0, scale: 1.05, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />
        {/* Vignette Overlay */}
        <div className="hero-vignette"></div>

        {/* ── Hero Content Layer ── */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-8 lg:px-[120px] h-screen min-h-[600px] flex flex-col justify-center">

          {/* Main Headline — centered */}
          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
            className="text-center text-white font-extrabold uppercase leading-[1.05] pointer-events-none select-none z-0 relative"
            style={{
              fontSize: 'clamp(40px, 7vw, 120px)',
              letterSpacing: '-2px',
              fontFamily: "'Montserrat', 'Inter', sans-serif",
              marginTop: '-5vh',
            }}
          >
            {lang === "ar" ? "حقق أفضل" : "Reach Your Best"}<br />
            {lang === "ar" ? "شكل في حياتك" : "Shape of Your Life"}
          </motion.h1>

          {/* ── Left Sidebar: Social Icons + Line + Social Proof ── */}
          <div className="hidden lg:flex flex-col absolute left-[120px] top-1/2 -translate-y-1/2 items-center gap-0 z-20">
            {/* Social Icons */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col items-center gap-8"
            >
              {/* Facebook */}
              <a href="https://www.facebook.com/share/1E86b6Vp3n/" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-[#7CFC00] transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/fit.and.lift.gym?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-[#7CFC00] transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
            </motion.div>

            {/* Vertical Divider Line */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="hero-social-line my-8 origin-top"
            />

            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="flex flex-col items-start absolute bottom-[-150px] left-0"
            >
              <div className="avatar-stack">
                <img src="/images/avatar1.png" alt="Client" />
                <img src="/images/avatar2.png" alt="Client" />
                <img src="/images/avatar3.png" alt="Client" />
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-[32px] font-bold text-white">1.2k</span>
                <span className="text-sm font-normal text-[#A0A0A0]">{lang === "ar" ? "عميل سعيد" : "Happy Clients"}</span>
              </div>
            </motion.div>
          </div>

          {/* ── Right Side: Subheadline ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="hidden lg:flex flex-col absolute right-[120px] top-[45%] z-20"
            style={{ width: '320px' }}
          >
            <p className="text-sm font-normal leading-relaxed text-[#E0E0E0] opacity-80" style={{ lineHeight: 1.6 }}>
              {lang === "ar"
                ? "اتدرب صح، كل صح، وغيّر حياتك مع كوتشينج مخصص لتمارين وتغذية على مقاسك."
                : "Get stronger, leaner, and more energized with custom fitness and nutrition coaching that fits your lifestyle"}
            </p>
          </motion.div>

          {/* ── CTA Button (bottom right) ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="absolute bottom-[80px] right-8 lg:right-[120px] z-20"
          >
            <a
              href="#pricing"
              className="cta-book inline-flex items-center justify-center rounded-full text-sm font-bold text-black uppercase tracking-[1px] px-10 h-14"
            >
              {lang === "ar" ? "انضم إلينا" : "JOIN IN"}
            </a>
          </motion.div>

          {/* ── Mobile: Subheadline + Social proof (below headline) ── */}
          <div className="lg:hidden mt-8 text-center px-4 z-20 relative">
            <p className="text-sm text-[#E0E0E0] mb-6 max-w-xs mx-auto leading-relaxed">
              {lang === "ar"
                ? "اتدرب صح، كل صح، وغيّر حياتك مع كوتشينج مخصص لتمارين وتغذية على مقاسك."
                : "Get stronger, leaner, and more energized with custom fitness and nutrition coaching that fits your lifestyle"}
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="avatar-stack">
                <img src="/images/avatar1.png" alt="Client" />
                <img src="/images/avatar2.png" alt="Client" />
                <img src="/images/avatar3.png" alt="Client" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">1.2k</span>
                <span className="text-xs text-[#A0A0A0]">{lang === "ar" ? "عميل سعيد" : "Happy Clients"}</span>
              </div>
            </div>
            <a
              href="#pricing"
              className="cta-book inline-flex items-center justify-center rounded-full text-sm font-bold text-black uppercase tracking-[1px] px-10 h-14 w-full max-w-xs"
            >
              {lang === "ar" ? "انضم إلينا" : "JOIN IN"}
            </a>
          </div>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Dumbbell, title: t.services.items[0].title, desc: t.services.items[0].desc },
              { icon: Calendar, title: t.services.items[1].title, desc: t.services.items[1].desc },
              { icon: CreditCard, title: t.services.items[2].title, desc: t.services.items[2].desc },
            ].map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.12 }} viewport={{ once: true, margin: "-50px" }}>
                <Card className="p-8 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-[0.98] cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <s.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="text-xl font-display text-white mb-3">{s.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 18 }} viewport={{ once: true, margin: "-50px" }} className="mb-12">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.schedule.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase mb-8">{t.schedule.title1} <span className="text-primary text-glow">{t.schedule.title2}</span></h3>
            <div className="flex flex-wrap gap-4">
              <Button className={`rounded-full px-6 font-bold tracking-widest uppercase transition-all duration-300 ${scheduleFilter !== "all" ? "border border-white/10 text-muted-foreground hover:text-white bg-transparent" : "bg-primary text-black hover:bg-primary/90"} hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-95`} onClick={() => setScheduleFilter("all")}>{t.schedule.filters.all}</Button>
              <Button className={`rounded-full px-6 font-bold tracking-widest uppercase transition-all duration-300 ${scheduleFilter !== "men" ? "border border-white/10 text-muted-foreground hover:text-white bg-transparent" : "bg-primary text-black hover:bg-primary/90"} hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-95`} onClick={() => setScheduleFilter("men")}>{t.schedule.filters.men}</Button>
              <Button className={`rounded-full px-6 font-bold tracking-widest uppercase transition-all duration-300 ${scheduleFilter !== "women" ? "border border-white/10 text-muted-foreground hover:text-white bg-transparent" : "bg-primary text-black hover:bg-primary/90"} hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-95`} onClick={() => setScheduleFilter("women")}>{t.schedule.filters.women}</Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scheduleData.map((day, i) => (
              <motion.div key={day.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -4, boxShadow: "0 0 30px hsla(128, 49%, 48%, 0.35)" }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} viewport={{ once: true, margin: "-50px" }}>
                <Card className="p-6 h-full flex flex-col border border-white/5 bg-white/5 cursor-pointer">
                  <h4 className="text-xl font-display text-white font-bold mb-6 text-center pb-4 border-b border-white/10">{day.day}</h4>
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    {(scheduleFilter === "all" || scheduleFilter === "men") && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-primary font-bold">{t.schedule.labels.menMorn}</span>
                        <span className="text-white font-bold" dir="ltr">{day.men_morn}</span>
                      </div>
                    )}
                    {(scheduleFilter === "all" || scheduleFilter === "women") && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#f472b6] font-bold">{t.schedule.labels.women}</span>
                        <span className="text-white font-bold" dir="ltr">{day.women}</span>
                      </div>
                    )}
                    {(scheduleFilter === "all" || scheduleFilter === "men") && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-primary font-bold">{t.schedule.labels.menEve}</span>
                        <span className="text-white font-bold" dir="ltr">{day.men_eve}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Coaches */}
      <section id="coaches" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.coaches.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.coaches.title}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.coaches.coaches.map((coach, i) => (
              <motion.div key={coach.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 16, delay: i * 0.1 }} viewport={{ once: true, margin: "-50px" }}>
                <Card className="group border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-[0.98] cursor-pointer">
                  <div className="aspect-[3/4] overflow-hidden bg-black/40 relative rounded-t-xl">
                    <img 
                      src={`/images/coach${i+1}.png`}
                      alt={coach.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.name}`; }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent">
                      <p className="text-primary font-bold text-xs uppercase tracking-widest">{coach.tagline}</p>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h4 className="text-white font-bold text-lg">{coach.name}</h4>
                    <p className="text-muted-foreground text-sm">{coach.role}</p>
                    <Button variant="ghost" size="sm" className="bg-primary/10 mt-3 text-primary uppercase text-[10px] font-bold tracking-widest transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] hover:bg-primary hover:text-black active:scale-95">{t.coaches.book}</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-[#0a0e1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 18 }} viewport={{ once: true, margin: "-50px" }} className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.pricing.tag}</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">{t.pricing.title1} <span className="text-primary">{t.pricing.title2}</span></h3>
          </motion.div>
          <PricingSection lang={lang} t={t} />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
            {/* Left Column (Info & Map Link) */}
            <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }} viewport={{ once: true, margin: "-50px" }}>
              <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">{t.contact.tag}</h2>
              <h3 className="text-4xl md:text-5xl font-display text-white font-bold mb-4 uppercase">{t.contact.title1} {t.contact.title2 && <span className="text-primary">{t.contact.title2}</span>}</h3>
              <p className="text-muted-foreground text-base mb-10 max-w-md">
                {t.contact.desc}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{t.contact.labels.address}</h4>
                    <p className="text-muted-foreground text-sm">بنها - زهور - بجانب بن ريان</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <WhatsAppIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{t.contact.labels.phone}</h4>
                    <p className="text-muted-foreground text-sm" dir="ltr">+20 10 09987771</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{t.contact.labels.hours}</h4>
                    <p className="text-muted-foreground text-sm">{t.contact.hoursText}</p>
                  </div>
                </div>
              </div>

              {/* Map Link Container */}
              <div className="mt-10 rounded-2xl overflow-hidden h-[250px] bg-[linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('/images/hero_bg.png')] bg-center bg-cover flex flex-col items-center justify-center border border-white/5">
                <MapPin className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-white font-bold text-xl mb-6">{t.contact.mapTitle}</h3>
                <a
                  href="https://maps.app.goo.gl/6zSWUcQR2dnzYNwY7"
                  target="_blank" rel="noopener noreferrer"
                  className="bg-primary text-black font-bold uppercase tracking-widest text-sm px-8 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-95"
                >
                  {t.contact.mapBtn}
                </a>
              </div>
            </motion.div>
            
            {/* Right Column (Form) */}
            <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.15 }} viewport={{ once: true, margin: "-50px" }}>
              <div className="bg-surface/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <form onSubmit={(e) => { e.preventDefault(); alert(t.contact.form.success); }} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground font-semibold">{t.contact.form.name}</Label>
                      <input type="text" required className="w-full px-4 py-3.5 border-2 border-white/10 rounded-xl bg-[#121415] text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground font-semibold">{t.contact.form.phone}</Label>
                      <input type="tel" required className="w-full px-4 py-3.5 border-2 border-white/10 rounded-xl bg-[#121415] text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-semibold">{t.contact.form.email}</Label>
                    <input type="email" required className="w-full px-4 py-3.5 border-2 border-white/10 rounded-xl bg-[#121415] text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-medium" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-semibold">{t.contact.form.subject}</Label>
                    <select required className="w-full px-4 py-3.5 border-2 border-white/10 rounded-xl bg-[#121415] text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-medium appearance-none cursor-pointer">
                      <option value="membership">{t.contact.form.subj1}</option>
                      <option value="class">{t.contact.form.subj2}</option>
                      <option value="pt">{t.contact.form.subj3}</option>
                      <option value="other">{t.contact.form.subj4}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-semibold">{t.contact.form.message}</Label>
                    <textarea required rows={4} className="w-full px-4 py-3.5 border-2 border-white/10 rounded-xl bg-[#121415] text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all min-h-[120px] font-medium resize-y"></textarea>
                  </div>

                  <button type="submit" className="w-full mt-2 bg-primary text-black font-bold uppercase tracking-widest text-sm py-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(62,182,76,0.4)] active:scale-95 flex items-center justify-center">
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
