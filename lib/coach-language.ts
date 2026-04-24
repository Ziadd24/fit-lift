"use client";

import { useEffect, useMemo, useState } from "react";

export type CoachLanguage = "en" | "ar";

const STORAGE_KEY = "fitlift_coach_language";
const EVENT_NAME = "fitlift-coach-language-change";

type TranslationValue = string | ((params?: Record<string, string | number>) => string);

const translations = {
  en: {
    languageEnglish: "EN",
    languageArabic: "ع",
    dashboard: "Dashboard",
    schedule: "Schedule",
    nutrition: "Nutrition",
    coachHub: "Coach Hub",
    signOut: "Sign Out",
    backToClients: "Back to Clients",
    viewingClient: ({ name }: Record<string, string | number> = {}) => `Viewing: ${name ?? ""}`,
    online: "Online",
    updateProfilePhoto: "Update Profile Photo",
    uploadNewPhoto: "Upload New Photo",
    removePhoto: "Remove Photo",
    close: "Close",
    welcomeBack: ({ name }: Record<string, string | number> = {}) => `Welcome back, ${name ?? "Coach"}`,
    coachingOverview: "Here's your coaching overview",
    clientsCount: ({ count }: Record<string, string | number> = {}) =>
      `${count ?? 0} client${Number(count ?? 0) === 1 ? "" : "s"}`,
    sendRenewalReminder: ({ count }: Record<string, string | number> = {}) => `Send Renewal Reminder (${count ?? 0})`,
    sendingReminder: ({ count }: Record<string, string | number> = {}) => `Sending Reminder (${count ?? 0})`,
    addClient: "Add Client",
    uploads: "Uploads",
    dailyNutrition: "Daily Nutrition",
    track: "Track",
    newGoal: "New Goal",
    save: "Save",
    cancel: "Cancel",
    ofGoal: ({ percent, goal }: Record<string, string | number> = {}) => `${percent ?? 0}% of ${goal ?? 0} goal`,
    noMealsToday: ({ goal }: Record<string, string | number> = {}) => `No meals today. Goal: ${goal ?? 0}`,
    logFirstMeal: "Log your first meal",
    clientRoster: "Client Roster",
    active: "Active",
    expired: "Expired",
    viewAll: "View All",
    addNew: "Add New",
    clientSpotlight: "Client Spotlight",
    notProvided: "Not provided",
    filterByNameOrCode: "Filter by name or code...",
    client: "Client",
    code: "Code",
    status: "Status",
    type: "Type",
    actions: "Actions",
    select: "Select",
    edit: "Edit",
    assignClientToRoster: "Assign Client to Roster",
    searchUnassigned: "Search unassigned members by name or code...",
    assign: "Assign",
    editClient: "Edit Client",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    membershipType: "Membership Type",
    saving: "Saving...",
    saveChanges: "Save Changes",
    assignWorkoutTo: ({ name }: Record<string, string | number> = {}) => `Assigning to: ${name ?? ""}`,
    assignWorkout: "Assign Workout",
    assigningWorkout: "Assigning...",
    nutritionProgressToday: "Today's Nutrition Progress",
    consumedToday: "consumed today",
    showingCount: ({ count }: Record<string, string | number> = {}) => `showing ${count ?? 0}`,
    loadMore: "Load More",
    remaining: "remaining",
    joinedOn: ({ date }: Record<string, string | number> = {}) => `Joined ${date ?? ""}`,
    noClientsYet: "No clients yet",
    addClientToBegin: "Add a client to get started.",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    bodyweight: "bodyweight",
    reps: "Reps",
    remove: "Remove",
    searchInProgress: "Searching...",
    noUnassignedMembers: "No unassigned members found.",
    workoutTitle: "Workout Title",
    duration: "Duration",
    difficulty: "Difficulty",
    estimatedCalories: "Estimated Calories",
    exercises: "Exercises",
    exercise: ({ index }: Record<string, string | number> = {}) => `Exercise ${index ?? ""}`,
    sets: "Sets",
    weight: "Weight",
    unit: "Unit",
    assignmentTitle: "Assessment Title",
    coachNotes: "Coach Notes",
    dueDate: "Due Date",
    files: "Files",
    addFiles: "Add Files",
    measurementFields: "Measurement Fields",
    optionalValuesUpload: "Optional values to include alongside the assessment package.",
    hide: "Hide",
    show: "Show",
    chest: "Chest",
    waist: "Waist",
    hips: "Hips",
    arms: "Arms",
    thighs: "Thighs",
    preview: "Preview",
    noFilesSelected: "No files selected yet.",
    readyToSend: "Ready to send",
    uploadProgress: "Upload progress",
    sendAssignment: "Send Assessment",
    sendingAssignment: "Sending Assessment...",
  },
  ar: {
    languageEnglish: "EN",
    languageArabic: "ع",
    dashboard: "لوحة التحكم",
    schedule: "الجدول",
    nutrition: "التغذية",
    coachHub: "مركز الكوتش",
    signOut: "تسجيل الخروج",
    backToClients: "الرجوع للعملاء",
    viewingClient: ({ name }: Record<string, string | number> = {}) => `عرض بيانات: ${name ?? ""}`,
    online: "متصل الآن",
    updateProfilePhoto: "تحديث صورة الملف الشخصي",
    uploadNewPhoto: "رفع صورة جديدة",
    removePhoto: "إزالة الصورة",
    close: "إغلاق",
    welcomeBack: ({ name }: Record<string, string | number> = {}) => `أهلًا بعودتك، ${name ?? "كوتش"}`,
    coachingOverview: "هذه نظرة سريعة على متابعة العملاء اليوم.",
    clientsCount: ({ count }: Record<string, string | number> = {}) => `${count ?? 0} عميل`,
    sendRenewalReminder: ({ count }: Record<string, string | number> = {}) => `إرسال تنبيه بالتجديد (${count ?? 0})`,
    sendingReminder: ({ count }: Record<string, string | number> = {}) => `جارٍ إرسال تنبيه التجديد (${count ?? 0})`,
    addClient: "إضافة عميل",
    uploads: "الملفات المرفوعة",
    dailyNutrition: "التغذية اليومية",
    track: "متابعة",
    newGoal: "هدف جديد",
    save: "حفظ",
    cancel: "إلغاء",
    ofGoal: ({ percent, goal }: Record<string, string | number> = {}) => `${percent ?? 0}% من هدف ${goal ?? 0}`,
    noMealsToday: ({ goal }: Record<string, string | number> = {}) => `لا توجد وجبات اليوم. الهدف: ${goal ?? 0}`,
    logFirstMeal: "سجّل أول وجبة",
    clientRoster: "قائمة العملاء",
    active: "نشط",
    expired: "منتهي",
    viewAll: "عرض الجميع",
    addNew: "إضافة جديد",
    clientSpotlight: "ملف العميل",
    notProvided: "غير متوفر",
    filterByNameOrCode: "ابحث بالاسم أو الكود...",
    client: "العميل",
    code: "الكود",
    status: "الحالة",
    type: "النوع",
    actions: "الإجراءات",
    select: "اختيار",
    edit: "تعديل",
    assignClientToRoster: "إضافة عميل إلى القائمة",
    searchUnassigned: "ابحث عن عميل غير مضاف بالاسم أو الكود...",
    assign: "إضافة",
    editClient: "تعديل بيانات العميل",
    fullName: "الاسم بالكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    membershipType: "نوع الاشتراك",
    saving: "جارٍ الحفظ...",
    saveChanges: "حفظ التعديلات",
    assignWorkoutTo: ({ name }: Record<string, string | number> = {}) => `تعيين التمرين إلى: ${name ?? ""}`,
    assignWorkout: "تعيين التمرين",
    assigningWorkout: "جارٍ التعيين...",
    nutritionProgressToday: "متابعة التغذية اليوم",
    consumedToday: "تم استهلاكها اليوم",
    showingCount: ({ count }: Record<string, string | number> = {}) => `المعروض ${count ?? 0}`,
    loadMore: "عرض المزيد",
    remaining: "متبقي",
    joinedOn: ({ date }: Record<string, string | number> = {}) => `تاريخ الإضافة: ${date ?? ""}`,
    noClientsYet: "لا يوجد عملاء بعد",
    addClientToBegin: "أضف عميلًا لبدء المتابعة.",
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
    bodyweight: "وزن الجسم",
    reps: "التكرارات",
    remove: "إزالة",
    searchInProgress: "جارٍ البحث...",
    noUnassignedMembers: "لا يوجد عملاء غير مضافين.",
    workoutTitle: "عنوان التمرين",
    duration: "المدة",
    difficulty: "المستوى",
    estimatedCalories: "السعرات المتوقعة",
    exercises: "التمارين",
    exercise: ({ index }: Record<string, string | number> = {}) => `تمرين ${index ?? ""}`,
    sets: "المجموعات",
    weight: "الوزن",
    unit: "الوحدة",
    assignmentTitle: "عنوان التكليف",
    coachNotes: "ملاحظات الكوتش",
    dueDate: "تاريخ التسليم",
    files: "الملفات",
    addFiles: "إضافة ملفات",
    measurementFields: "قياسات الجسم",
    optionalValuesUpload: "قيم اختيارية تقدر تضيفها مع ملف التكليف.",
    hide: "إخفاء",
    show: "إظهار",
    chest: "الصدر",
    waist: "الوسط",
    hips: "الورك",
    arms: "الذراعين",
    thighs: "الفخذين",
    preview: "معاينة",
    noFilesSelected: "لا توجد ملفات محددة بعد.",
    readyToSend: "جاهز للإرسال",
    uploadProgress: "تقدم الرفع",
    sendAssignment: "إرسال التكليف",
    sendingAssignment: "جارٍ إرسال التكليف...",
  },
} satisfies Record<CoachLanguage, Record<string, TranslationValue>>;

function readLanguage(): CoachLanguage {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "ar" ? "ar" : "en";
}

export function setCoachLanguage(language: CoachLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: language }));
}

export function useCoachLanguage() {
  const [language, setLanguageState] = useState<CoachLanguage>("en");

  useEffect(() => {
    setLanguageState(readLanguage());

    const sync = () => setLanguageState(readLanguage());
    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<CoachLanguage>).detail;
      setLanguageState(detail === "ar" ? "ar" : "en");
    };

    window.addEventListener("storage", sync);
    window.addEventListener(EVENT_NAME, onCustom as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT_NAME, onCustom as EventListener);
    };
  }, []);

  const isRTL = language === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  const t = useMemo(() => {
    return (key: keyof typeof translations.en, params?: Record<string, string | number>) => {
      const value = translations[language][key];
      return typeof value === "function" ? value(params) : value;
    };
  }, [language]);

  const toggleLanguage = () => {
    const next = language === "en" ? "ar" : "en";
    setLanguageState(next);
    setCoachLanguage(next);
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US").format(value);

  return {
    language,
    isRTL,
    dir,
    t,
    toggleLanguage,
    setLanguage: (next: CoachLanguage) => {
      setLanguageState(next);
      setCoachLanguage(next);
    },
    formatNumber,
  };
}
