"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Heart, Zap, Users, Timer, Target } from "lucide-react";
import { useRouter } from "next/navigation";

const classes = [
  {
    id: 1,
    name: { en: "CrossFit", ar: "كروسفت" },
    description: { en: "High-intensity functional training combining weightlifting, gymnastics, and cardio", ar: "تمارين شاقة بتعمل على كل عضلاتك وبتجمع رفع أثقال وجمباز وكارديو" },
    duration: "60 min",
    level: "Advanced",
    icon: Dumbbell,
    color: "from-red-500/20 to-orange-500/20",
    borderColor: "border-red-500/30",
  },
  {
    id: 2,
    name: { en: "Yoga", ar: "يوغا" },
    description: { en: "Mind-body practice improving flexibility, balance, and mental clarity", ar: "تمارين بتخففك وبتخليك مرتاح وبتحسن مرونة جسمك وتوازنك" },
    duration: "45 min",
    level: "All Levels",
    icon: Heart,
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: 3,
    name: { en: "HIIT", ar: "تمارين شاقة سريعة" },
    description: { en: "Maximum calorie burn with alternating intense exercise and recovery periods", ar: "بتحرق أكبر عدد من السعرات بالتبديل بين تمارين شاقة وفترات راحة" },
    duration: "30 min",
    level: "Intermediate",
    icon: Zap,
    color: "from-yellow-500/20 to-amber-500/20",
    borderColor: "border-yellow-500/30",
  },
  {
    id: 4,
    name: { en: "Strength Training", ar: "تمارين القوة" },
    description: { en: "Build muscle and increase strength with resistance exercises and weights", ar: "بتخلي عضلاتك أكبر وأقوى بالأوزان وتمارين المقاومة" },
    duration: "50 min",
    level: "Intermediate",
    icon: Target,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: 5,
    name: { en: "Cardio Blast", ar: "كارديو ناري" },
    description: { en: "Heart-pumping cardio workout designed to improve endurance and burn fat", ar: "تمارين كارديو بتخلي قلبك يخبط عالي وبتحرق دهونك وبتقوي تحملك" },
    duration: "40 min",
    level: "All Levels",
    icon: Timer,
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
  },
  {
    id: 6,
    name: { en: "Group Fitness", ar: "تمارين جماعية" },
    description: { en: "Fun and motivating group classes led by our expert trainers", ar: "كلاسات جماعية ممتعة ومحفزة مع مدربينا الخبراء" },
    duration: "50 min",
    level: "All Levels",
    icon: Users,
    color: "from-indigo-500/20 to-purple-500/20",
    borderColor: "border-indigo-500/30",
  },
];

const translations = {
  en: {
    backToHome: "Back to Home",
    ourClasses: "Our Classes",
    fitnessClasses: "Fitness Classes",
    fitnessDescription: "Choose from our wide range of classes designed to help you reach your fitness goals",
  },
  ar: {
    backToHome: "الرجوع للرئيسية",
    ourClasses: "الكلاسات بتاعتنا",
    fitnessClasses: "كلاسات اللياقة",
    fitnessDescription: "اختار من مجموعة كبيرة من الكلاسات اللي هتساعدك توصل لأهدافك في اللياقة",
  },
};

export default function ClassesPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ar">("en");
  
  useEffect(() => {
    // Check URL parameter first, then fallback to document lang
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const docLang = document.documentElement.lang || 'en';
    const detectedLang = (urlLang || docLang) as "en" | "ar";
    setLang(detectedLang);
  }, []);
  
  const t = translations[lang];
  const isRTL = lang === "ar";

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-primary transition-colors"
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              {t.backToHome}
            </Link>
            <h1 className="text-lg md:text-xl font-display font-bold text-primary uppercase tracking-widest">
              {t.ourClasses}
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase mb-3">
            {t.fitnessClasses}
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            {t.fitnessDescription}
          </p>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {classes.map((classItem) => {
            const Icon = classItem.icon;
            return (
              <div
                key={classItem.id}
                className={`group relative rounded-2xl border ${classItem.borderColor} bg-gradient-to-br ${classItem.color} p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(124,252,0,0.15)]`}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,252,0,0.1),transparent_50%)]" />
                </div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-display font-bold text-white mb-2" dir="auto">
                    {classItem.name[lang]}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 leading-relaxed" dir="auto">
                    {classItem.description[lang]}
                  </p>

                                  </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
