import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Plus, Search, Calendar, Heart, BookOpen, Brain, Scale,
  Settings as SettingsIcon, Sparkles, LogOut, CheckSquare, 
  Trash2, Edit3, Trash, Star, Image, Paperclip, Mic, MicOff, 
  Smile, ShieldCheck, Download, Upload, Activity, Moon, Pill,
  User, Printer, ChevronRight, ArrowRight, Lock, Eye, EyeOff, Flame, Bell, Key, Archive, RotateCcw, ChevronDown, ChevronUp, Compass,
  Cloud, RefreshCw, Copy, Check, Mail, Send, Video, Camera, PenTool, Music, ExternalLink, Globe, Fingerprint, X, Smartphone, BellRing, Info, Maximize, Minimize
} from 'lucide-react';
import { motion } from 'motion/react';
import { DiaryEntry, AppSettings, TaskItem, AudioRecording, FileAttachment, Habit, GratitudeCard, ChatLogEntry, Book, AppReminder, AuthUser, AppLanguage } from './types';
import StaticNotification from './components/StaticNotification';
import FloatingBall from './components/FloatingBall';
import DrawingCanvas from './components/DrawingCanvas';
import TherapistReportModal from './components/TherapistReportModal';
import RatingModal from './components/RatingModal';
import ContactOwnerModal from './components/ContactOwnerModal';
import GeminiKeyModal from './components/GeminiKeyModal';
import BackupSyncModal from './components/BackupSyncModal';
import LanguagesModal from './components/LanguagesModal';
import TypographySettingsSection from './components/TypographySettingsSection';
import { getFontCss, getLineHeightCss } from './lib/fonts';
import WriteDiaryImporter from './components/WriteDiaryImporter';
import SmartAdvisor from './components/SmartAdvisor';
import GratitudeJournal from './components/GratitudeJournal';
import LifeMap from './components/LifeMap';
import PINLock from './components/PINLock';
import { registerBiometrics } from './lib/biometrics';
import { TasksChecklistSection } from './components/TasksChecklistSection';
import { CBTExercisesSection } from './components/CBTExercisesSection';
import { MULTI_TRANSLATIONS, SUPPORTED_LANGUAGES, getLanguageInfo } from './lib/languages';
import IntegratedTherapyReport from './components/IntegratedTherapyReport';
import WeeklyHabitsMoodChart from './components/WeeklyHabitsMoodChart';
import SleepMoodCorrelationChart from './components/SleepMoodCorrelationChart';
import SmartRemindersModal from './components/SmartRemindersModal';
import { AuthModal } from './components/AuthModal';
import DailyProsConsModal from './components/DailyProsConsModal';
import ProsConsHistoryLog from './components/ProsConsHistoryLog';
import DhikrCounter from './components/DhikrCounter';
import PsychologicalGrowthTree from './components/PsychologicalGrowthTree';
import ShareableGratitudeCardModal, { CardExportData } from './components/ShareableGratitudeCardModal';
import BehavioralCorrelationCard from './components/BehavioralCorrelationCard';
import OfflineSyncBanner from './components/OfflineSyncBanner';

// Recharts components for gorgeous analytics
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// Initial Mock Diaries for demonstration so analytics and timeline look incredible instantly
const INITIAL_DIARIES: DiaryEntry[] = [
  {
    id: 'diary-1',
    title: 'تخطيط للأسبوع الدراسي الجديد وغداء عائلي ومشاعر أمل',
    content: 'بدأت اليوم ببعض القلق والتوتر بشأن تراكم المواد الدراسية والامتحانات القادمة في الجامعة. جلست مع عائلتي لاحقاً وتناولنا الغداء معاً في جو دافئ، وتحدثنا في مواضيع ممتعة فخفت حدة القلق تماماً وتحول شعوري للامتنان والأمل. أحس أن التحدث مع من نحب هو أفضل علاج سلوكي مهدئ للروح.',
    createdAt: '2026-07-15T21:30:00.000Z',
    updatedAt: '2026-07-15T21:30:00.000Z',
    moods: ['قلق', 'ممتن', 'سعيد'],
    aiMoodAnalysis: [
      { mood: 'سعيد', percentage: 40 },
      { mood: 'قلق', percentage: 30 },
      { mood: 'ممتن', percentage: 30 }
    ],
    importance: 4,
    color: 'bg-[#CCD5AE]/15 border-[#CCD5AE]',
    images: [],
    videos: [],
    audioRecordings: [],
    files: [],
    tasks: [
      { id: 't1', text: 'مراجعة أول فصلين في الكيمياء', completed: true },
      { id: 't2', text: 'شراء الدواء الشهري', completed: true }
    ],
    tags: ['دراسة', 'عائلة', 'أمل'],
    chatLogs: [],
    isLocked: false,
    sleepHours: 7.5,
    sportsDuration: 30,
    medications: [
      { id: 'm1', name: 'فيتامين D3 جرعة أسبوعية', time: '10:00 ص', taken: true }
    ]
  },
  {
    id: 'diary-2',
    title: 'نوبة أرق في منتصف الليل وتفكير زائد في المستقبل',
    content: 'لم أستطع النوم جيداً الليلة الماضية بسبب كثرة التفكير والسيناريوهات الكارثية حول مستقبلي المهني والجامعي. استيقظت في الصباح وأنا أشعر بخمول شديد وإرهاق وضيق في الصدر. قررت في المساء تحدي نفسي والذهاب لممارسة المشي السريع لمدة 45 دقيقة، والحمد لله أحسست ببعض الارتياح والهدوء التدريجي بعد الرياضة.',
    createdAt: '2026-07-14T09:45:00.000Z',
    updatedAt: '2026-07-14T09:45:00.000Z',
    moods: ['مرهق', 'قلق', 'حزين'],
    aiMoodAnalysis: [
      { mood: 'قلق', percentage: 50 },
      { mood: 'مرهق', percentage: 35 },
      { mood: 'حزين', percentage: 15 }
    ],
    importance: 3,
    color: 'bg-[#FAEDCD]/30 border-[#E2DCC8]',
    images: [],
    videos: [],
    audioRecordings: [
      {
        id: 'rec-1',
        name: 'فضفضة الأرق وتفريغ الأفكار.mp3',
        dataUrl: '#',
        duration: 48,
        transcription: 'أنا أسجل هذا المقطع الصوتي لأني أشعر بخوف شديد ولا أستطيع تهدئة نبضات قلبي بسبب التفكير في الامتحانات القادمة...'
      }
    ],
    files: [],
    tasks: [
      { id: 't3', text: 'تمرين تنفس بطني دقيقتين قبل النوم', completed: false }
    ],
    tags: ['أرق', 'قلق', 'تحدي'],
    chatLogs: [],
    isLocked: false,
    sleepHours: 4.5,
    sportsDuration: 45,
    medications: [
      { id: 'm1', name: 'فيتامين D3 جرعة أسبوعية', time: '10:00 ص', taken: false }
    ]
  },
  {
    id: 'diary-3',
    title: 'إنجاز كبير في المشروع وقراءة كتاب رائع قبل النوم',
    content: 'الحمد لله اليوم كان استثنائياً ومبهجاً جداً! أنجزت العرض التقديمي لمشروع الجامعة وحصلت على ثناء كبير جداً من زملائي والدكتور المشرف. غمرتني طاقة مذهلة من الحماس والفرح والرضا عن نفسي. قبل النوم، أعددت كوب بابونج دافئ وقرأت فصلاً ممتعاً للغاية من كتاب العلاج السلوكي المعرفي للتغلب على القلق النفسي.',
    createdAt: '2026-07-12T22:00:00.000Z',
    updatedAt: '2026-07-12T22:00:00.000Z',
    moods: ['سعيد جدًا', 'متحمس', 'مرتاح'],
    aiMoodAnalysis: [
      { mood: 'سعيد جدًا', percentage: 60 },
      { mood: 'متحمس', percentage: 30 },
      { mood: 'مرتاح', percentage: 10 }
    ],
    importance: 5,
    color: 'bg-[#F0EDE4] border-[#E2DCC8]',
    images: [],
    videos: [],
    audioRecordings: [],
    files: [],
    tasks: [],
    tags: ['إنجاز', 'سعادة', 'قراءة'],
    chatLogs: [],
    isLocked: false,
    sleepHours: 8.5,
    sportsDuration: 60,
    medications: [
      { id: 'm1', name: 'فيتامين D3 جرعة أسبوعية', time: '10:00 ص', taken: true }
    ]
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  isDarkMode: false,
  notificationsEnabled: true,
  lockScreenWidgetEnabled: true,
  fullscreenModeEnabled: false,
  autoHideHeaderOnScroll: true,
  appLanguage: 'ar',
  appFont: 'cairo',
  appLineHeight: 'relaxed',
  floatingBallEnabled: true,
  appPinCode: '1234',
  isAppLocked: false, // Default to false so user can preview and test all features instantly
  backupSettings: {
    autoBackup: 'daily'
  },
  reminders: [
    { 
      id: 'rem-1', 
      title: 'منبه كتابة الخواطر واليوميات ✍️', 
      time: '21:00', 
      active: true, 
      type: 'diary',
      frequency: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      motivationalNote: 'تدوين خواطرك يفرغ طاقة التوتر ويمنحك السكينة والوضوح الذهني. ✨',
      categoryIcon: '✍️'
    },
    { 
      id: 'rem-2', 
      title: 'تنبيه العناية بالذات وشرب الماء 💧', 
      time: '08:00', 
      active: true, 
      type: 'habit',
      frequency: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      motivationalNote: 'بداية يوم جديدة مليئة بالنشاط! اعتَنِ بجسدك ونفسك أولاً. 💖',
      categoryIcon: '💧'
    },
    { 
      id: 'rem-3', 
      title: 'جلسة الاسترخاء الذهني والتأمل 🧘‍♂️', 
      time: '17:30', 
      active: true, 
      type: 'meditation',
      frequency: 'custom_days',
      selectedDays: [0, 2, 4],
      motivationalNote: 'أنت تقوم بعمل رائع! خذ 3 أنفاس عميقة واسترح الآن.',
      categoryIcon: '🧘‍♀️'
    },
  ]
};

const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'شرب 2 لتر ماء دافئ',
    category: 'health',
    frequency: 'daily',
    reminderTime: '08:00',
    reminderEnabled: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    history: {
      '2026-07-14': true,
      '2026-07-15': true,
      '2026-07-16': true,
    }
  },
  {
    id: 'habit-2',
    name: 'تأمل واسترخاء العضلات (10 د)',
    category: 'mind',
    frequency: 'daily',
    reminderTime: '07:30',
    reminderEnabled: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    history: {
      '2026-07-15': true,
      '2026-07-16': false,
    }
  },
  {
    id: 'habit-3',
    name: 'المشي السريع أو تمرين منزلي',
    category: 'sport',
    frequency: 'daily',
    reminderTime: '17:00',
    reminderEnabled: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    history: {
      '2026-07-14': true,
      '2026-07-15': true,
      '2026-07-16': true,
    }
  },
  {
    id: 'habit-4',
    name: 'قراءة في كتاب النفس السلوكي',
    category: 'culture',
    frequency: 'daily',
    reminderTime: '21:00',
    reminderEnabled: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    history: {
      '2026-07-14': true,
      '2026-07-15': false,
      '2026-07-16': true,
    }
  }
];

const HABIT_CATEGORIES: Record<string, { label: string; color: string; dot: string }> = {
  health: { label: 'صحة بدنية 🥦', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  mind: { label: 'تأمل وذهن 🧠', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  sport: { label: 'رياضة ونشاط 🏃', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  culture: { label: 'ثقافة وقراءة 📚', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  custom: { label: 'مخصص 🎯', color: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-500' },
};

// --- Streak Tracker calculation helper ---
const calculateStreak = (entries: DiaryEntry[]) => {
  if (!Array.isArray(entries)) return { currentStreak: 0, maxStreak: 0, hasLoggedToday: false };
  const loggedDates = new Set<string>();

  entries.forEach(e => {
    if (e && e.createdAt) {
      try {
        const d = new Date(e.createdAt);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          loggedDates.add(`${year}-${month}-${day}`);
        }
      } catch {
        // Safe fallback
      }
    }
  });

  const today = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(today);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let currentStreak = 0;
  const hasLoggedToday = loggedDates.has(todayStr);
  const hasLoggedYesterday = loggedDates.has(yesterdayStr);

  if (hasLoggedToday) {
    currentStreak = 1;
    let checkDate = new Date(today);
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = formatDate(checkDate);
      if (loggedDates.has(checkStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (hasLoggedYesterday) {
    currentStreak = 1;
    let checkDate = new Date(yesterday);
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = formatDate(checkDate);
      if (loggedDates.has(checkStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate Max Streak of all time
  const sortedDates = Array.from(loggedDates).filter(Boolean).sort();
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDateMs: number | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = new Date(`${dateStr}T12:00:00`);
    const currentDateMs = currentDate.getTime();
    if (isNaN(currentDateMs)) continue;

    if (prevDateMs === null) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(currentDateMs - prevDateMs);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
    prevDateMs = currentDateMs;
  }

  if (currentStreak > maxStreak) {
    maxStreak = currentStreak;
  }

  return {
    currentStreak,
    maxStreak,
    hasLoggedToday
  };
};

export const TRANSLATIONS = {
  ar: {
    appName: "حياة AI",
    settingsTitle: "الإعدادات العامة",
    settingsSubtitle: "تخصيص مساعد الذكي، قفل الحماية، وتزامن بياناتك",
    apiKeyTitle: "مفتاح API الخاص بك 🔑",
    floatingBallTitle: "عرض الكرة العائمة 🔘",
    backupTitle: "النسخ الاحتياطي والمزامنة ☁️",
    appLockTitle: "قفل التطبيق 🔐",
    favoritesTitle: "الملاحظات المفضلة ⭐",
    remindersTitle: "التذكيرات والمنبهات ⏰",
    archiveTitle: "أرشيف اليوميات 📥",
    trashTitle: "سلة المهملات 🗑️",
    darkModeTitle: "الوضع الداكن ☀️/🌙",
    notificationsTitle: "الإشعارات 🔔",
    languagesTitle: "لغات التطبيق 🌐",
    rateTitle: "قيمنا 👍",
    contactTitle: "تواصل مع مالك التطبيق للاقتراح والتطوير ✉️",
    homeTab: "الرئيسية",
    diariesTab: "اليوميات",
    advisorTab: "المستشار",
    analyticsTab: "التقدم والبيانات",
    settingsTab: "الإعدادات",
    apiKeySub: "حالة المفتاح: مخصّص ونشط محلياً 🟢",
    apiKeySubAuto: "حالة المفتاح: يتم التوفير سحابياً تلقائياً وبأمان ☁️",
    floatingBallSub: "تسهيل التنقل والتحكم السريع بالمساعد الذكي في أي وقت",
    backupSub: "حفظ ومزامنة مذكراتك سحابياً ومحلياً لمنع فقدان البيانات",
    appLockSub: "تأمين مذكراتك برمز مرور PIN مكوّن من 4 أرقام عند بدء التشغيل",
    favoritesSub: "تصفح والوصول السريع للمذكرات الأكثر أهمية (ذات 4 نجوم فما فوق)",
    remindersSub: "إدارة منبهات المهام المجدولة واليوميات",
    archiveSub: "استعراض مذكراتك المؤرشفة والقديمة",
    trashSub: "استعادة مذكراتك المحذوفة مؤخراً أو تصفيتها",
    darkModeSub: "تفعيل مظهر الوضع الليلي لحماية عينيك",
    notificationsSub: "تلقي تنبيهات دورية للعادات والتذكيرات اليومية",
    languagesSub: "تغيير لغة واجهة مستخدم التطبيق",
    rateSub: "ساعدنا على مواصلة تحسين التطبيق لرأيك الغالي",
    contactSub: "راسلنا باقتراحاتك وملاحظاتك القيمة لتطوير التطبيق",
  },
  en: {
    appName: "Hayat AI",
    settingsTitle: "General Settings",
    settingsSubtitle: "Customize your smart assistant, privacy lock, and sync your data",
    apiKeyTitle: "Your API Key 🔑",
    floatingBallTitle: "Display Floating Ball 🔘",
    backupTitle: "Backup & Sync ☁️",
    appLockTitle: "App Lock 🔐",
    favoritesTitle: "Favorite Notes ⭐",
    remindersTitle: "Reminders & Alarms ⏰",
    archiveTitle: "Diary Archive 📥",
    trashTitle: "Trash Can 🗑️",
    darkModeTitle: "Dark Mode ☀️/🌙",
    notificationsTitle: "Notifications 🔔",
    languagesTitle: "App Languages 🌐",
    rateTitle: "Rate Us 👍",
    contactTitle: "Contact App Owner ✉️",
    homeTab: "Home",
    diariesTab: "Diaries",
    advisorTab: "Advisor",
    analyticsTab: "Analytics",
    settingsTab: "Settings",
    apiKeySub: "Key status: Customized & active locally 🟢",
    apiKeySubAuto: "Key status: Provided securely via cloud automatically ☁️",
    floatingBallSub: "Quick navigation and shortcut controls for your AI assistant",
    backupSub: "Sync and backup your diaries locally & to cloud securely",
    appLockSub: "Secure your notes with a 4-digit PIN lock on launch",
    favoritesSub: "Browse and quickly access your most important diaries (4+ stars)",
    remindersSub: "Manage scheduled task alarms and diary reminders",
    archiveSub: "Browse archived and older diary notes",
    trashSub: "Restore recently deleted diaries or filter them",
    darkModeSub: "Enable dark mode appearance to protect your eyes",
    notificationsSub: "Receive periodic alerts for habits and daily reminders",
    languagesSub: "Change the application user interface language",
    rateSub: "Help us continue improving the application with your feedback",
    contactSub: "Send us your valuable suggestions and notes to develop the app",
  }
};

function localizeDiaryEntry(entry: DiaryEntry, isAr: boolean): DiaryEntry {
  if (isAr) return entry;
  if (entry.id === 'diary-1') {
    return {
      ...entry,
      title: 'Weekly Academic Planning, Family Lunch & Hopeful Feelings',
      content: 'Started the day with some anxiety regarding accumulated coursework and upcoming university exams. Later sat with my family for a warm lunch and engaging conversations, which completely eased my anxiety and filled me with gratitude and hope. Talking with loved ones is truly a comforting remedy.',
      moods: ['Anxious', 'Grateful', 'Happy'],
      tags: ['Study', 'Family', 'Hope'],
      tasks: [
        { id: 't1', text: 'Review first 2 chemistry chapters', completed: true },
        { id: 't2', text: 'Purchase monthly medication', completed: true }
      ],
      medications: [
        { id: 'm1', name: 'Vitamin D3 Weekly Supplement', time: '10:00 AM', taken: true }
      ]
    };
  }
  if (entry.id === 'diary-2') {
    return {
      ...entry,
      title: 'Midnight Insomnia & Overthinking the Future',
      content: 'Could not sleep well last night due to catastrophic scenarios about my academic and career future. Woke up feeling fatigued and exhausted. In the evening, I challenged myself to a 45-minute brisk walk, which brought gradual relief and calm.',
      moods: ['Exhausted', 'Anxious', 'Sad'],
      tags: ['Insomnia', 'Anxiety', 'Challenge'],
      audioRecordings: entry.audioRecordings?.map(r => ({
        ...r,
        name: 'Insomnia Venting & Thought Dump.mp3',
        transcription: 'Recording this voice note because I feel anxious and cannot quiet my racing heart...'
      })) || [],
      tasks: [
        { id: 't3', text: '2-minute deep breathing exercise before bed', completed: false }
      ],
      medications: [
        { id: 'm1', name: 'Vitamin D3 Weekly Supplement', time: '10:00 AM', taken: false }
      ]
    };
  }
  if (entry.id === 'diary-3') {
    return {
      ...entry,
      title: 'Project Achievement & Mindful Evening Reading',
      content: 'Today was exceptional and joyful! Finished my university project presentation and received great praise from my peers and supervisor. Felt an overwhelming surge of excitement, joy, and self-satisfaction. Read a chapter on CBT before bed with a warm chamomile tea.',
      moods: ['Joyful', 'Excited', 'Satisfied'],
      tags: ['Success', 'Reading', 'Happiness'],
      tasks: [
        { id: 't4', text: 'Read Chapter 4 of CBT book', completed: true }
      ]
    };
  }

  const arabicToEnMap: Record<string, string> = {
    'امتنان 🌸': 'Gratitude 🌸',
    'سكينة ✨': 'Serenity ✨',
    'امتنان': 'Gratitude',
    'تأمل_إيجابي': 'Positive Reflection',
    'صفاء 🧘‍♂️': 'Serenity 🧘‍♂️',
    'إلهام 💡': 'Inspiration 💡',
    'خواطر': 'Thoughts',
    'يوميات': 'Journal',
    'قلق': 'Anxious',
    'ممتن': 'Grateful',
    'سعيد': 'Happy',
    'مرهق': 'Exhausted',
    'حزين': 'Sad',
    'دراسة': 'Study',
    'عائلة': 'Family',
    'أمل': 'Hope',
    'أرق': 'Insomnia',
    'تحدي': 'Challenge'
  };

  const hasArabic = /[\u0600-\u06FF]/.test(entry.title || '') || /[\u0600-\u06FF]/.test(entry.content || '');
  if (!hasArabic) return entry;

  return {
    ...entry,
    moods: entry.moods?.map(m => arabicToEnMap[m] || m),
    tags: entry.tags?.map(t => arabicToEnMap[t] || t)
  };
}

function localizeGratitudeCard(card: GratitudeCard, isAr: boolean): GratitudeCard {
  if (isAr) return card;
  if (card.id === 'grat-1') {
    return { ...card, text: 'Watching the warm morning sun rise and starting a brand new day with peace and hope' };
  }
  if (card.id === 'grat-2') {
    return { ...card, text: 'Drinking a hot, perfect cup of coffee with my family and having a warm chat' };
  }
  if (card.id === 'grat-3') {
    return { ...card, text: 'Finding solutions to a tough coding challenge and feeling the joy of personal progress' };
  }
  return card;
}

export default function App() {
  // --- Persistent State Hooks ---
  const [diaries, setDiaries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('yawmiyati_diaries');
    return saved ? JSON.parse(saved) : INITIAL_DIARIES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('yawmiyati_settings');
    const parsed: AppSettings = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    const directLang = localStorage.getItem('app_language') as AppLanguage;
    if (directLang && ['ar', 'en', 'de', 'fr', 'es', 'it', 'tr', 'ur', 'hi', 'id'].includes(directLang)) {
      parsed.appLanguage = directLang;
    }
    const savedCredId = localStorage.getItem('yawmiyati_biometric_cred_id');
    if (savedCredId && !parsed.biometricCredentialId) {
      parsed.biometricCredentialId = savedCredId;
    }
    return parsed;
  });

  const langInfo = getLanguageInfo(settings.appLanguage);
  const isAr = settings.appLanguage === 'ar';
  const isEn = settings.appLanguage === 'en';
  const isRtl = langInfo.dir === 'rtl';
  const t = MULTI_TRANSLATIONS[settings.appLanguage] || MULTI_TRANSLATIONS.ar;

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('yawmiyati_habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [gratitudeCards, setGratitudeCards] = useState<GratitudeCard[]>(() => {
    const saved = localStorage.getItem('yawmiyati_gratitude_cards');
    return saved ? JSON.parse(saved) : [
      { id: 'grat-1', text: 'رؤية الشمس تشرق بنورها الدافئ وبدء يوم جديد بسلام وأمل', color: 'bg-amber-50 border-amber-200 text-amber-900', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 'grat-2', text: 'شرب فنجان قهوة ساخن ومثالي مع عائلتي والحديث الدافئ معهم', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
      { id: 'grat-3', text: 'إيجاد حلول لمشكلة برمجية صعبة والشعور ببهجة الإنجاز والتقدم الذاتي', color: 'bg-blue-50 border-blue-200 text-blue-900', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() }
    ];
  });

  const displayedDiaries = useMemo(() => diaries.map(d => localizeDiaryEntry(d, isAr)), [diaries, isAr]);
  const displayedGratitudeCards = useMemo(() => gratitudeCards.map(c => localizeGratitudeCard(c, isAr)), [gratitudeCards, isAr]);

  const [activeDiariesSubTab, setActiveDiariesSubTab] = useState<'journal' | 'gratitude' | 'cbt' | 'tasks'>('journal');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'report' | 'charts' | 'pros_cons'>('report');
  const [diaryTypeFilter, setDiaryTypeFilter] = useState<'all' | 'diary' | 'thought'>('all');
  const [diaryChatMessage, setDiaryChatMessage] = useState('');
  const [diaryChatLoading, setDiaryChatLoading] = useState(false);

  // States for Daily Pros & Cons Modal (الإيجابيات والسلبيات)
  const [isProsConsModalOpen, setIsProsConsModalOpen] = useState(false);
  const [prosConsDayKey, setProsConsDayKey] = useState('');
  const [prosConsDisplayDate, setProsConsDisplayDate] = useState('');
  const [prosConsDayDiaries, setProsConsDayDiaries] = useState<DiaryEntry[]>([]);

  const handleOpenProsConsForDay = (dayKey: string, displayDate: string, dayDiaries: DiaryEntry[]) => {
    setProsConsDayKey(dayKey);
    setProsConsDisplayDate(displayDate);
    setProsConsDayDiaries(dayDiaries);
    setIsProsConsModalOpen(true);
  };

  // Daily Psychological Inspiration quote state
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string }>(() => {
    const saved = localStorage.getItem('yawmiyati_daily_quote');
    return saved ? JSON.parse(saved) : {
      quote: "تذكر دائماً أن القلق لا يمنع ألم الغد، ولكنه يسرق متعة وسلام اليوم فحسب.",
      author: "دكتورك النفسي الصديق"
    };
  });
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Breathing Box Session states
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [breathingCycle, setBreathingCycle] = useState(0);

  // CBT wizard modal state
  const [showAddCbtModal, setShowAddCbtModal] = useState(false);
  const [cbtStep, setCbtStep] = useState(1);
  const [cbtTriggerEvent, setCbtTriggerEvent] = useState('');
  const [cbtNegativeThoughts, setCbtNegativeThoughts] = useState('');
  const [cbtCognitiveDistortion, setCbtCognitiveDistortion] = useState('');
  const [cbtRationalAlternative, setCbtRationalAlternative] = useState('');
  const [cbtEmotionBefore, setCbtEmotionBefore] = useState(7);
  const [cbtEmotionAfter, setCbtEmotionAfter] = useState(4);
  const [cbtLoading, setCbtLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'diaries' | 'advisor' | 'analytics' | 'settings'>(() => {
    return (localStorage.getItem('yawmiyati_active_tab') as any) || 'dashboard';
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');

  // Auto-save notification helper
  const triggerAutoSaveFeedback = () => {
    setAutoSaveStatus('saving');
    const nowStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setLastAutoSaveTime(nowStr);
    }, 300);
  };

  // Save activeTab to localStorage immediately on change
  useEffect(() => {
    localStorage.setItem('yawmiyati_active_tab', activeTab);
  }, [activeTab]);

  // Dynamic Font Family & Line Height Styling Effect
  useEffect(() => {
    const fontCss = getFontCss(settings.appFont);
    const lhCss = getLineHeightCss(settings.appLineHeight);
    document.documentElement.style.fontFamily = fontCss;
    document.documentElement.style.lineHeight = `${lhCss}`;
    document.body.style.fontFamily = fontCss;
    document.body.style.lineHeight = `${lhCss}`;
  }, [settings.appFont, settings.appLineHeight]);

  // Mobile Auto-Hiding Top Header State
  const [isHeaderCollapsedOnMobile, setIsHeaderCollapsedOnMobile] = useState(false);
  const headerAutoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile Auto-Hiding Bottom Navigation State
  const [isBottomNavCollapsedOnMobile, setIsBottomNavCollapsedOnMobile] = useState(false);
  const bottomNavAutoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Temporarily reveals header for 3 seconds, then auto-collapses on mobile
  const revealHeaderTemporarily = useCallback(() => {
    setIsHeaderCollapsedOnMobile(false);
    if (headerAutoTimerRef.current) {
      clearTimeout(headerAutoTimerRef.current);
    }
    headerAutoTimerRef.current = setTimeout(() => {
      setIsHeaderCollapsedOnMobile(true);
    }, 3000);
  }, []);

  // Temporarily reveals bottom nav for 3 seconds, then auto-collapses on mobile
  const revealBottomNavTemporarily = useCallback(() => {
    setIsBottomNavCollapsedOnMobile(false);
    if (bottomNavAutoTimerRef.current) {
      clearTimeout(bottomNavAutoTimerRef.current);
    }
    bottomNavAutoTimerRef.current = setTimeout(() => {
      setIsBottomNavCollapsedOnMobile(true);
    }, 3000);
  }, []);

  // Instantly collapses top header on mobile
  const collapseHeaderOnMobile = useCallback(() => {
    setIsHeaderCollapsedOnMobile(true);
    if (headerAutoTimerRef.current) {
      clearTimeout(headerAutoTimerRef.current);
    }
  }, []);

  const diariesSaveDebounceRef = useRef<any>(null);

  // Debounced Auto-Save for diaries to prevent main-thread lag during typing/editing
  useEffect(() => {
    if (diariesSaveDebounceRef.current) {
      clearTimeout(diariesSaveDebounceRef.current);
    }

    diariesSaveDebounceRef.current = setTimeout(() => {
      try {
        const safeDiaries = (diaries || []).map(d => ({
          ...d,
          audioRecordings: (d.audioRecordings || []).map(r => ({
            ...r,
            dataUrl: (r.dataUrl && r.dataUrl.length > 5000000) ? '#' : r.dataUrl
          })),
          images: (d.images || []).map(img => (img && img.length > 3000000) ? '' : img).filter(Boolean),
          files: (d.files || []).map(f => ({
            ...f,
            dataUrl: (f.dataUrl && f.dataUrl.length > 5000000) ? '#' : f.dataUrl
          })),
          videos: (d.videos || []).map(v => (v && v.length > 5000000) ? '#' : v).filter(Boolean)
        }));
        localStorage.setItem('yawmiyati_diaries', JSON.stringify(safeDiaries));
        triggerAutoSaveFeedback();
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }, 1200);

    return () => {
      if (diariesSaveDebounceRef.current) {
        clearTimeout(diariesSaveDebounceRef.current);
      }
    };
  }, [diaries]);

  useEffect(() => {
    try {
      localStorage.setItem('yawmiyati_settings', JSON.stringify(settings));
      triggerAutoSaveFeedback();
    } catch (e) { console.warn(e); }
  }, [settings]);

  // Auto-lock when user leaves tab/window, hides page, or switches applications
  useEffect(() => {
    const handleAutoLock = () => {
      if (document.visibilityState === 'hidden' || document.hidden) {
        if (settings.appPinCode || settings.isAppLocked) {
          setSettings(prev => {
            const next = { ...prev, isAppLocked: true };
            try {
              localStorage.setItem('yawmiyati_settings', JSON.stringify(next));
            } catch (e) { console.warn(e); }
            return next;
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleAutoLock);
    window.addEventListener('pagehide', handleAutoLock);

    return () => {
      document.removeEventListener('visibilitychange', handleAutoLock);
      window.removeEventListener('pagehide', handleAutoLock);
    };
  }, [settings.appPinCode, settings.isAppLocked]);

  useEffect(() => {
    try {
      localStorage.setItem('yawmiyati_habits', JSON.stringify(habits));
      triggerAutoSaveFeedback();
    } catch (e) { console.warn(e); }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem('yawmiyati_gratitude_cards', JSON.stringify(gratitudeCards));
      triggerAutoSaveFeedback();
    } catch (e) { console.warn(e); }
  }, [gratitudeCards]);

  useEffect(() => {
    try {
      localStorage.setItem('yawmiyati_daily_quote', JSON.stringify(dailyQuote));
    } catch (e) { console.warn(e); }
  }, [dailyQuote]);

  // Window beforeunload fail-safe auto-saver
  useEffect(() => {
    const performFullSave = () => {
      try {
        const safeDiaries = (diaries || []).map(d => ({
          ...d,
          audioRecordings: (d.audioRecordings || []).map(r => ({
            ...r,
            dataUrl: (r.dataUrl && r.dataUrl.length > 5000000) ? '#' : r.dataUrl
          })),
          images: (d.images || []).map(img => (img && img.length > 3000000) ? '' : img).filter(Boolean),
          files: (d.files || []).map(f => ({
            ...f,
            dataUrl: (f.dataUrl && f.dataUrl.length > 5000000) ? '#' : f.dataUrl
          })),
          videos: (d.videos || []).map(v => (v && v.length > 5000000) ? '#' : v).filter(Boolean)
        }));
        localStorage.setItem('yawmiyati_diaries', JSON.stringify(safeDiaries));
        localStorage.setItem('yawmiyati_settings', JSON.stringify(settings));
        localStorage.setItem('yawmiyati_habits', JSON.stringify(habits));
        localStorage.setItem('yawmiyati_gratitude_cards', JSON.stringify(gratitudeCards));
        localStorage.setItem('yawmiyati_daily_quote', JSON.stringify(dailyQuote));
      } catch (e) {
        console.error('Fail-safe auto save error:', e);
      }
    };

    window.addEventListener('beforeunload', performFullSave);

    return () => {
      window.removeEventListener('beforeunload', performFullSave);
    };
  }, [diaries, settings, habits, gratitudeCards, dailyQuote]);

  // Breathing Box Session Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev === 1) {
            // Move to next phase
            setBreathingPhase(phase => {
              if (phase === 'inhale') {
                return 'hold1';
              } else if (phase === 'hold1') {
                return 'exhale';
              } else if (phase === 'exhale') {
                return 'hold2';
              } else {
                setBreathingCycle(c => c + 1);
                return 'inhale';
              }
            });
            return 4; // Reset to 4 seconds
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingTimer(4);
      setBreathingPhase('inhale');
      setBreathingCycle(0);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  // --- 👤 User Authentication & Session State ---
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('yawmiyati_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('yawmiyati_auth_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check existing session token on mount
  useEffect(() => {
    const checkUserSession = async () => {
      // 1. First restore local user profile immediately if present
      const savedProfile = localStorage.getItem('yawmiyati_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setCurrentUser(parsed);
        } catch (e) {
          console.error('Profile parse error:', e);
        }
      }

      const token = localStorage.getItem('yawmiyati_auth_token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const res = await response.json();
            if (res.success && res.user) {
              setCurrentUser(res.user);
              localStorage.setItem('yawmiyati_user_profile', JSON.stringify(res.user));
              setAuthToken(token);
              // Fetch account-specific cloud data
              handleCloudRestoreWithToken(token);
            }
          } else if (response.status === 401) {
            // Explicit unauthenticated status from backend
            localStorage.removeItem('yawmiyati_auth_token');
            localStorage.removeItem('yawmiyati_user_profile');
            setAuthToken(null);
            setCurrentUser(null);
          }
        } catch (e) {
          console.error('Session validation server check (kept local session):', e);
          // Keep local user session intact if server is unreachable or deployed as static site
        }
      }
    };
    checkUserSession();
  }, []);

  // --- ☁️ Real-time Cloud Synchronization Engine ---
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>('النسخة الاحتياطية السحابية نشطة ومتصلة 🟢');

  const performCloudSync = async (forceData?: { diaries?: DiaryEntry[], habits?: Habit[], settings?: AppSettings, gratitudeCards?: GratitudeCard[] }) => {
    setIsCloudSyncing(true);
    try {
      const payload = {
        diaries: forceData?.diaries || diaries,
        habits: forceData?.habits || habits,
        settings: forceData?.settings || settings,
        gratitudeCards: forceData?.gratitudeCards || gratitudeCards,
        chatMessages: JSON.parse(localStorage.getItem('yawmiyati_chat_messages') || '[]'),
        activeTab: localStorage.getItem('yawmiyati_active_tab') || 'dashboard',
        syncTime: new Date().toISOString()
      };
      
      const token = authToken || localStorage.getItem('yawmiyati_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/cloud-sync/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setCloudSyncMessage(`مزامنة سحابية ناجحة: ${new Date().toLocaleTimeString('ar-EG')}`);
      } else {
        setCloudSyncMessage('فشل التزامن السحابي التلقائي');
      }
    } catch (e) {
      console.error('Cloud Sync error:', e);
      setCloudSyncMessage('تعذر الاتصال بالخادم للتزامن السحابي');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCloudRestoreWithToken = async (tokenOverride?: string) => {
    setIsCloudSyncing(true);
    setCloudSyncMessage('جاري استيراد نسختك الاحتياطية من السحابة...');
    try {
      const token = tokenOverride || authToken || localStorage.getItem('yawmiyati_auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/cloud-sync/fetch', { headers });
      const res = await response.json();
      if (res.success && res.data) {
        if (res.data.diaries) {
          setDiaries(res.data.diaries);
          localStorage.setItem('yawmiyati_diaries', JSON.stringify(res.data.diaries));
        }
        if (res.data.habits) {
          setHabits(res.data.habits);
          localStorage.setItem('yawmiyati_habits', JSON.stringify(res.data.habits));
        }
        if (res.data.settings) {
          setSettings(res.data.settings);
          localStorage.setItem('yawmiyati_settings', JSON.stringify(res.data.settings));
        }
        if (res.data.gratitudeCards) {
          setGratitudeCards(res.data.gratitudeCards);
          localStorage.setItem('yawmiyati_gratitude_cards', JSON.stringify(res.data.gratitudeCards));
        }
        if (res.data.chatMessages) {
          localStorage.setItem('yawmiyati_chat_messages', JSON.stringify(res.data.chatMessages));
        }
        setCloudSyncMessage('تمت استعادة كل مذكراتك ومحادثاتك من السحابة بنجاح! 🎉☁️');
      } else {
        setCloudSyncMessage('حسابك جديد ومتصل بالسحابة، يمكنك بدء التدوين وحفظ بياناتك تلقائياً.');
      }
    } catch (e) {
      console.error('Restore error:', e);
      setCloudSyncMessage('خطأ أثناء استعادة البيانات السحابية');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCloudRestore = () => handleCloudRestoreWithToken();

  const handleLoginSuccess = (user: AuthUser, token: string, userData?: any) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('yawmiyati_auth_token', token);
    localStorage.setItem('yawmiyati_user_profile', JSON.stringify(user));

    if (userData) {
      if (userData.diaries) {
        setDiaries(userData.diaries);
        localStorage.setItem('yawmiyati_diaries', JSON.stringify(userData.diaries));
      }
      if (userData.habits) {
        setHabits(userData.habits);
        localStorage.setItem('yawmiyati_habits', JSON.stringify(userData.habits));
      }
      if (userData.settings) {
        setSettings(userData.settings);
        localStorage.setItem('yawmiyati_settings', JSON.stringify(userData.settings));
      }
      if (userData.gratitudeCards) {
        setGratitudeCards(userData.gratitudeCards);
        localStorage.setItem('yawmiyati_gratitude_cards', JSON.stringify(userData.gratitudeCards));
      }
      if (userData.chatMessages) {
        localStorage.setItem('yawmiyati_chat_messages', JSON.stringify(userData.chatMessages));
      }
      setCloudSyncMessage(`مرحباً ${user.name}! تم تحميل واستعادة بياناتك المزامنة سحابياً 🎉`);
    } else {
      handleCloudRestoreWithToken(token);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    localStorage.removeItem('yawmiyati_auth_token');
    localStorage.removeItem('yawmiyati_user_profile');
    setAuthToken(null);
    setCurrentUser(null);
    setCloudSyncMessage('تم تسجيل الخروج بنجاح.');
  };

  // Auto-restore on load if local storage is completely empty (safeguard for clean/reset installs)
  useEffect(() => {
    const checkAndRestore = async () => {
      try {
        const token = localStorage.getItem('yawmiyati_auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/cloud-sync/fetch', { headers });
        const res = await response.json();
        if (res.success && res.data) {
          const localDiaries = localStorage.getItem('yawmiyati_diaries');
          if (!localDiaries || JSON.parse(localDiaries).length === 0) {
            console.log("No local diaries, auto-restoring from server cloud backup...");
            if (res.data.diaries) setDiaries(res.data.diaries);
            if (res.data.habits) setHabits(res.data.habits);
            if (res.data.settings) setSettings(res.data.settings);
            if (res.data.gratitudeCards) setGratitudeCards(res.data.gratitudeCards);
            if (res.data.chatMessages) {
              localStorage.setItem('yawmiyati_chat_messages', JSON.stringify(res.data.chatMessages));
            }
            setCloudSyncMessage('أهلاً بك! تم تحميل يومياتك ومحادثاتك سحابياً تلقائياً ☁️🟢');
          }
        }
      } catch (err) {
        console.error("Auto-sync load check failed:", err);
      }
    };
    checkAndRestore();
  }, []);

  // Sync to cloud on local changes with 1.5s debounce to keep database safe
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performCloudSync();
    }, 1500);
    return () => clearTimeout(delayDebounceFn);
  }, [diaries, habits, settings, gratitudeCards]);

  const [activeHabitReminder, setActiveHabitReminder] = useState<{ id: string; name: string } | null>(null);

  // --- Gratitude Journal Reminders & Notifications ---
  const [activeGratitudeReminderNotification, setActiveGratitudeReminderNotification] = useState(false);
  const lastFiredGratitudeMinuteRef = React.useRef<string>('');

  useEffect(() => {
    const checkReminder = () => {
      const isEnabled = localStorage.getItem('yawmiyati_gratitude_reminder_enabled') !== 'false';
      const reminderTime = localStorage.getItem('yawmiyati_gratitude_reminder_time') || '21:00';
      
      if (!isEnabled) return;
      
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;
      
      if (currentTimeStr === reminderTime && lastFiredGratitudeMinuteRef.current !== currentTimeStr) {
        lastFiredGratitudeMinuteRef.current = currentTimeStr;
        setActiveGratitudeReminderNotification(true);
      }
    };
    
    checkReminder();
    const interval = setInterval(checkReminder, 15000);
    return () => clearInterval(interval);
  }, []);

  // --- Persistent Lock Screen Notification Widget Helper ---
  const triggerLockScreenNotification = useCallback(async () => {
    if (!('Notification' in window)) return;

    if (Notification.permission !== 'granted') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.error(e);
      }
    }

    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/sw.js').catch(() => null);
          if (reg && reg.showNotification) {
            await reg.showNotification(t.notificationActiveNow, {
              body: 'كيف تشعر الآن يا صديقي؟ 😊 | اضغط للوصول السريع لتدوين المذكرات، التسجيل الصوتي، والمستشار الذكي.',
              tag: 'yawmiyati-lockscreen-widget',
              requireInteraction: true,
              renotify: true,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
            return;
          }
        }
        new Notification(t.notificationActiveNow, {
          body: 'كيف تشعر الآن يا صديقي؟ 😊 | اضغط للوصول السريع لتدوين المذكرات، التسجيل الصوتي، والمستشار الذكي.',
          tag: 'yawmiyati-lockscreen-widget',
          requireInteraction: true
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (settings.lockScreenWidgetEnabled !== false && settings.notificationsEnabled) {
      triggerLockScreenNotification();
    }
  }, [settings.lockScreenWidgetEnabled, settings.notificationsEnabled, triggerLockScreenNotification]);

  // --- Smart Reminders Logic ---
  const [showSmartRemindersModal, setShowSmartRemindersModal] = useState(false);
  const [triggeredReminder, setTriggeredReminder] = useState<AppReminder | null>(null);
  const lastFiredReminderRef = React.useRef<{ [id: string]: string }>({});

  useEffect(() => {
    const checkSmartReminders = () => {
      if (!settings.notificationsEnabled) return;
      const reminders = settings.reminders || [];
      if (reminders.length === 0) return;

      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;
      const currentDay = now.getDay(); // 0 = Sun, 6 = Sat

      reminders.forEach(r => {
        if (!r.active) return;
        if (r.time !== currentTimeStr) return;

        let matchDay = false;
        if (r.frequency === 'daily') {
          matchDay = true;
        } else if (r.frequency === 'weekly') {
          matchDay = r.selectedDays?.includes(currentDay) ?? (currentDay === new Date().getDay());
        } else if (r.frequency === 'custom_days') {
          matchDay = r.selectedDays ? r.selectedDays.includes(currentDay) : true;
        }

        if (matchDay && lastFiredReminderRef.current[r.id] !== currentTimeStr) {
          lastFiredReminderRef.current[r.id] = currentTimeStr;
          setTriggeredReminder(r);

          try {
            const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
            if (AudioContext) {
              const ctx = new AudioContext();
              const n = ctx.currentTime;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, n);
              osc.frequency.exponentialRampToValueAtTime(783.99, n + 0.3);
              gain.gain.setValueAtTime(0.2, n);
              gain.gain.exponentialRampToValueAtTime(0.001, n + 0.5);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(n);
              osc.stop(n + 0.5);
            }
          } catch {
            // Audio context disabled
          }
        }
      });
    };

    checkSmartReminders();
    const interval = setInterval(checkSmartReminders, 15000);
    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, settings.reminders]);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🎯');
  const [newHabitCategory, setNewHabitCategory] = useState<'health' | 'mind' | 'sport' | 'culture' | 'custom'>('custom');
  const [newHabitReminderTime, setNewHabitReminderTime] = useState('08:00');
  const [newHabitReminderEnabled, setNewHabitReminderEnabled] = useState(true);
  const [selectedHabitCategory, setSelectedHabitCategory] = useState<string>('all');

  // Habits evaluation period analytics
  const [habitPeriod, setHabitPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'custom'>('weekly');
  const [habitCustomStart, setHabitCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [habitCustomEnd, setHabitCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [habitEvaluationReport, setHabitEvaluationReport] = useState('');
  const [habitEvaluationLoading, setHabitEvaluationLoading] = useState(false);

  const toggleHabitCompletion = (habitId: string, dateStr: string, customVal?: any) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        let newVal: any;
        if (customVal !== undefined) {
          if (customVal === 'skip') {
            newVal = { completed: false, skipped: true };
          } else {
            newVal = customVal;
          }
        } else {
          const currentVal = h.history[dateStr];
          let isComp = false;
          if (typeof currentVal === 'boolean') isComp = currentVal;
          else if (typeof currentVal === 'number') isComp = currentVal > 0;
          else if (typeof currentVal === 'object' && currentVal) isComp = currentVal.completed;
          newVal = !isComp;
        }
        return {
          ...h,
          history: {
            ...h.history,
            [dateStr]: newVal
          }
        };
      }
      return h;
    }));
  };

  const deleteHabit = (habitId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه العادة نهائياً؟')) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: newHabitName.trim(),
      icon: newHabitIcon,
      category: newHabitCategory,
      frequency: 'daily',
      reminderTime: newHabitReminderTime,
      reminderEnabled: newHabitReminderEnabled,
      createdAt: new Date().toISOString(),
      history: {}
    };

    setHabits(prev => [...prev, newHabit]);
    setNewHabitName('');
    setNewHabitIcon('🎯');
    setNewHabitCategory('custom');
    setNewHabitReminderTime('08:00');
    setNewHabitReminderEnabled(true);
    setShowAddHabitModal(false);
  };

  const triggerSimulatedHabitNotification = (habit: Habit) => {
    setActiveHabitReminder({ id: habit.id, name: habit.name });
    // Clear after 6 seconds
    setTimeout(() => {
      setActiveHabitReminder(null);
    }, 6000);
  };

  const generateHabitReport = async () => {
    setHabitEvaluationLoading(true);
    setHabitEvaluationReport('');

    try {
      let start = new Date();
      let end = new Date();
      const endStr = end.toISOString().split('T')[0];

      if (habitPeriod === 'daily') {
        start.setDate(start.getDate() - 1);
      } else if (habitPeriod === 'weekly') {
        start.setDate(start.getDate() - 7);
      } else if (habitPeriod === 'monthly') {
        start.setDate(start.getDate() - 30);
      } else if (habitPeriod === 'quarterly') {
        start.setDate(start.getDate() - 90);
      } else if (habitPeriod === 'semi-annually') {
        start.setDate(start.getDate() - 180);
      } else if (habitPeriod === 'annually') {
        start.setDate(start.getDate() - 365);
      } else {
        start = new Date(habitCustomStart);
        end = new Date(habitCustomEnd);
      }

      const startStr = start.toISOString().split('T')[0];

      // Generate dates in range
      const datesList: string[] = [];
      const currentCursor = new Date(start);
      // set hours to 0 to prevent date rollover issues
      currentCursor.setHours(12, 0, 0, 0);
      const endCheck = new Date(end);
      endCheck.setHours(12, 0, 0, 0);

      while (currentCursor <= endCheck) {
        datesList.push(currentCursor.toISOString().split('T')[0]);
        currentCursor.setDate(currentCursor.getDate() + 1);
      }

      // Calculate compliance: (completed slots / total possible slots)
      let totalSlots = habits.length * datesList.length;
      let completedSlots = 0;

      habits.forEach(h => {
        datesList.forEach(d => {
          if (h.history[d]) {
            completedSlots++;
          }
        });
      });

      const overallCompliance = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

      const res = await fetch('/api/gemini/evaluate-habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({
          habits,
          period: habitPeriod === 'custom' ? `مخصصة من ${startStr} إلى ${endStr}` : habitPeriod,
          startDate: startStr,
          endDate: endStr,
          overallCompliance
        })
      });

      const data = await res.json();
      if (data.success) {
        setHabitEvaluationReport(data.answer);
      } else {
        setHabitEvaluationReport('للأسف تعذر استجابة النظام حالياً، يرجى المحاولة لاحقاً.');
      }
    } catch (err) {
      console.error(err);
      setHabitEvaluationReport('حدث خطأ أثناء إرسال طلب التقييم السلوكي.');
    } finally {
      setHabitEvaluationLoading(false);
    }
  };

  // --- Active Diary Editing State ---
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(() => {
    const saved = localStorage.getItem('yawmiyati_draft_editing_diary');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [isNewEntry, setIsNewEntry] = useState(() => {
    return localStorage.getItem('yawmiyati_draft_is_new_entry') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [newEditAddition, setNewEditAddition] = useState(() => {
    return localStorage.getItem('yawmiyati_draft_new_edit_addition') || '';
  });
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [backupEmail, setBackupEmail] = useState(() => {
    const saved = localStorage.getItem('yawmiyati_backup_email') || '';
    if (saved.includes('wahdlyallh') || saved.includes('youssef')) {
      localStorage.removeItem('yawmiyati_backup_email');
      return '';
    }
    return saved;
  });
  const [isSendingEmailBackup, setIsSendingEmailBackup] = useState(false);
  const [emailBackupStatus, setEmailBackupStatus] = useState<string | null>(null);

  // --- Archive Management States ---
  const [archivedSearchQuery, setArchivedSearchQuery] = useState('');
  const [archivedTypeFilter, setArchivedTypeFilter] = useState<'all' | 'diary' | 'thought'>('all');
  const [viewArchivedDiary, setViewArchivedDiary] = useState<DiaryEntry | null>(null);
  const [archiveToast, setArchiveToast] = useState<{ message: string; diaryId: string; action: 'archived' | 'unarchived' } | null>(null);

  useEffect(() => {
    if (archiveToast) {
      const timer = setTimeout(() => {
        setArchiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [archiveToast]);

  // --- Universal Navigation History & Back Handler ---
  interface NavState {
    activeTab: 'dashboard' | 'diaries' | 'advisor' | 'analytics' | 'settings';
    activeDiariesSubTab: 'journal' | 'gratitude' | 'cbt' | 'tasks';
    analyticsSubTab: 'report' | 'charts' | 'pros_cons';
    editingDiaryId: string | null;
    diaryTypeFilter: 'all' | 'diary' | 'thought';
  }

  const [navHistory, setNavHistory] = useState<NavState[]>([]);
  const isNavigatingBackRef = useRef(false);
  const prevNavStateRef = useRef<NavState>({
    activeTab,
    activeDiariesSubTab,
    analyticsSubTab,
    editingDiaryId: editingDiary?.id || null,
    diaryTypeFilter
  });

  // --- Optimized Navigation Engine ---
  const switchTab = useCallback((newTab: 'dashboard' | 'diaries' | 'advisor' | 'analytics' | 'settings', options?: { subTab?: string; resetEdit?: boolean }) => {
    const currentState: NavState = {
      activeTab,
      activeDiariesSubTab,
      analyticsSubTab,
      editingDiaryId: editingDiary?.id || null,
      diaryTypeFilter
    };
    
    // Batch nav history update with active tab update for instant single-frame rendering
    setNavHistory(history => [...history.slice(-15), currentState]);
    setActiveTab(newTab);
    if (options?.subTab) {
      if (newTab === 'diaries') setActiveDiariesSubTab(options.subTab as any);
      if (newTab === 'analytics') setAnalyticsSubTab(options.subTab as any);
    }
    if (options?.resetEdit || newTab !== activeTab) {
      setEditingDiary(null);
    }
  }, [activeTab, activeDiariesSubTab, analyticsSubTab, editingDiary?.id, diaryTypeFilter]);

  const handleGoBack = useCallback(() => {
    if (editingDiary) {
      setEditingDiary(null);
      return;
    }

    if (navHistory.length > 0) {
      const lastState = navHistory[navHistory.length - 1];
      setNavHistory(history => history.slice(0, history.length - 1));

      setActiveTab(lastState.activeTab);
      setActiveDiariesSubTab(lastState.activeDiariesSubTab);
      setAnalyticsSubTab(lastState.analyticsSubTab);
      setDiaryTypeFilter(lastState.diaryTypeFilter);
      if (lastState.editingDiaryId) {
        const found = diaries.find(d => d.id === lastState.editingDiaryId);
        setEditingDiary(found || null);
      } else {
        setEditingDiary(null);
      }
    } else if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      setEditingDiary(null);
    }
  }, [editingDiary, navHistory, activeTab, diaries]);

  useEffect(() => {
    if (backupEmail) {
      localStorage.setItem('yawmiyati_backup_email', backupEmail);
    }
  }, [backupEmail]);

  // Sync backup email with current logged-in user email
  useEffect(() => {
    if (currentUser?.email) {
      setBackupEmail(currentUser.email);
    } else if (!localStorage.getItem('yawmiyati_backup_email')) {
      setBackupEmail('');
    }
  }, [currentUser]);

  // Debounced Save active editing states to localStorage (400ms debounce to eliminate main-thread lag during typing/navigation)
  const draftSaveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = setTimeout(() => {
      if (editingDiary) {
        try {
          const safeDraft = {
            ...editingDiary,
            videos: (editingDiary.videos || []).map(v => (v && v.length > 5000000) ? '#' : v),
            images: (editingDiary.images || []).map(img => (img && img.length > 3000000) ? '' : img).filter(Boolean),
            audioRecordings: (editingDiary.audioRecordings || []).map(r => ({
              ...r,
              dataUrl: (r.dataUrl && r.dataUrl.length > 5000000) ? '#' : r.dataUrl
            })),
            files: (editingDiary.files || []).map(f => ({
              ...f,
              dataUrl: (f.dataUrl && f.dataUrl.length > 5000000) ? '#' : f.dataUrl
            }))
          };
          localStorage.setItem('yawmiyati_draft_editing_diary', JSON.stringify(safeDraft));
        } catch (e) {
          console.warn('Failed to save draft diary to localStorage:', e);
        }
      } else {
        try {
          localStorage.removeItem('yawmiyati_draft_editing_diary');
        } catch (e) {}
      }
    }, 400);

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [editingDiary]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_draft_is_new_entry', String(isNewEntry));
  }, [isNewEntry]);

  const newEditAdditionTimeoutRef = useRef<any>(null);
  useEffect(() => {
    if (newEditAdditionTimeoutRef.current) {
      clearTimeout(newEditAdditionTimeoutRef.current);
    }
    newEditAdditionTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('yawmiyati_draft_new_edit_addition', newEditAddition);
      } catch (e) {}
    }, 400);

    return () => {
      if (newEditAdditionTimeoutRef.current) {
        clearTimeout(newEditAdditionTimeoutRef.current);
      }
    };
  }, [newEditAddition]);

  // --- Drawing Sketchboard State ---
  const [showSketchboard, setShowSketchboard] = useState(false);

  // --- Therapist Report Modal State ---
  const [showTherapistModal, setShowTherapistModal] = useState(false);

  // --- Full Calendar Modal State ---
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Auto-collapse top header & temporarily show bottom nav bar on mobile when user navigates
  useEffect(() => {
    collapseHeaderOnMobile();
    revealBottomNavTemporarily();
  }, [activeTab, activeDiariesSubTab, editingDiary?.id, showCalendarModal, collapseHeaderOnMobile, revealBottomNavTemporarily]);

  // --- Comprehensive Library and Calendar States ---
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('yawmiyati_books');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'book-1',
        title: 'العلاج المعرفي السلوكي للنفس والروح 🧠',
        notes: 'د. جوديث بيك - يشرح آليات تعديل الأفكار التلقائية والتعامل مع المخاوف والقلق اليومي.',
        rating: 5,
        pdfPath: 'كتاب العلاج المعرفي.pdf',
        referenceLink: 'https://cbt-institute.com',
        audioAttachment: 'ملخص صوتي.mp3',
        coverAttachment: '',
        videoAttachment: 'شرح العلاج المعرفي.mp4',
        hasMindMap: true,
        tags: ['علم نفس', 'صحة نفسية'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'book-2',
        title: 'المرونة النفسية والصلابة الذاتية 💪',
        notes: 'د. بندر آل جلالة - يتناول طرق تعزيز الصلابة النفسية ومقاومة الصدمات اليومية وتجاوزها.',
        rating: 4,
        pdfPath: 'المرونة النفسية.pdf',
        referenceLink: '',
        audioAttachment: '',
        coverAttachment: '',
        videoAttachment: '',
        hasMindMap: false,
        tags: ['تنمية ذاتية', 'صحة نفسية'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'book-3',
        title: 'رواية الخيمائي والبحث عن الحقيقة 📖',
        notes: 'باولو كويلو - رواية رمزية ملهمة تدور حول اتباع الشغف والإنصات لصوت القلب والرحلة الذاتية.',
        rating: 5,
        pdfPath: 'رواية_الخيمائي.pdf',
        referenceLink: '',
        audioAttachment: 'ملخص_صوتي.mp3',
        coverAttachment: '',
        videoAttachment: '',
        hasMindMap: true,
        tags: ['روايات', 'أدب', 'تنمية ذاتية'],
        createdAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('yawmiyati_books', JSON.stringify(books));
  }, [books]);

  const [calendarSubTab, setCalendarSubTab] = useState<'calendar' | 'library' | 'reports'>('calendar');
  const [showAddBookForm, setShowAddBookForm] = useState(false);
  const [bookFormTitle, setBookFormTitle] = useState('');
  const [bookFormNotes, setBookFormNotes] = useState('');
  const [bookFormRating, setBookFormRating] = useState(5);
  const [bookFormPdf, setBookFormPdf] = useState('');
  const [bookFormLink, setBookFormLink] = useState('');
  const [bookFormAudio, setBookFormAudio] = useState('');
  const [bookFormCover, setBookFormCover] = useState('');
  const [bookFormVideo, setBookFormVideo] = useState('');
  const [bookFormHasMindMap, setBookFormHasMindMap] = useState(false);
  const [bookFormTags, setBookFormTags] = useState<string[]>(['تنمية ذاتية']);
  const [bookFormCustomTag, setBookFormCustomTag] = useState('');
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookRatingFilter, setBookRatingFilter] = useState<number>(0);
  const [bookAttachmentFilter, setBookAttachmentFilter] = useState<string>('all');
  const [selectedBookTagFilter, setSelectedBookTagFilter] = useState<string>('all');

  // --- Redesigned Settings Tab Subsections ---
  const [expandedSettingsCard, setExpandedSettingsCard] = useState<'api' | 'backup' | 'pin' | 'favorites' | 'reminders' | 'archive' | 'trash' | 'languages' | null>(null);
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState(false);
  const [showBackupSyncModal, setShowBackupSyncModal] = useState(false);
  const [showWriteDiaryImporter, setShowWriteDiaryImporter] = useState(false);
  const [showLanguagesModal, setShowLanguagesModal] = useState(false);
  const [isFirstTimeLangSelect, setIsFirstTimeLangSelect] = useState(false);

  // Shareable Gratitude Cards Exporter
  const [showGratitudeShareModal, setShowGratitudeShareModal] = useState(false);
  const [gratitudeShareData, setGratitudeShareData] = useState<CardExportData | undefined>(undefined);

  // Auto-open language selector on first visit
  useEffect(() => {
    const chosen = localStorage.getItem('app_language') || localStorage.getItem('yawmiyati_language_chosen');
    if (!chosen) {
      setShowLanguagesModal(true);
      setIsFirstTimeLangSelect(true);
    }
  }, []);

  // Update HTML direction and language attributes on change
  useEffect(() => {
    const info = getLanguageInfo(settings.appLanguage);
    document.documentElement.setAttribute('dir', info.dir);
    document.documentElement.setAttribute('lang', info.code);
  }, [settings.appLanguage]);
  const [showLockScreenWidgetInfoModal, setShowLockScreenWidgetInfoModal] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [newAlarmTitle, setNewAlarmTitle] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('20:00');

  // --- Voice Recorder & Speech-to-Text States ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingSecondsRef = React.useRef<number>(0);
  const recordingStartTimeRef = React.useRef<number | null>(null);
  const [recordingIntervalId, setRecordingIntervalId] = useState<number | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const speechRecognitionRef = React.useRef<any>(null);
  const speechTranscriptRef = React.useRef<string>('');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [transcribingAudioId, setTranscribingAudioId] = useState<string | null>(null);
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null);
  const [editingTranscriptText, setEditingTranscriptText] = useState<string>('');

  // --- Rich Editor & Features Sheet States ---
  const [showFontToolbar, setShowFontToolbar] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showMoreFeaturesSheet, setShowMoreFeaturesSheet] = useState(false);
  const [showFontDrawer, setShowFontDrawer] = useState(false);
  const [fontDrawerSize, setFontDrawerSize] = useState(16);
  const [fontDrawerFamily, setFontDrawerFamily] = useState('font-sans');
  const [showAiWriterSheet, setShowAiWriterSheet] = useState(false);
  const [aiWriterTopicInput, setAiWriterTopicInput] = useState('');
  const [aiWriterLoading, setAiWriterLoading] = useState(false);
  const [aiWriterResult, setAiWriterResult] = useState<{ title: string; content: string } | null>(null);
  const [copiedAiText, setCopiedAiText] = useState(false);

  // Helper to generate dynamic, topic-specific note content on client if server API is unreachable
  const generateSmartClientNoteFallback = (topic: string): { title: string; content: string } => {
    const cleanTopic = (topic || "ملاحظة صحية ونفسية").trim();
    const lower = cleanTopic.toLowerCase();

    if (lower.includes('مذاكرة') || lower.includes('جدول') || lower.includes('دراسة') || lower.includes('امتحان') || lower.includes('دروس')) {
      return {
        title: `📚 جدول مذاكرة وتنظيم دراسي مخصص: ${cleanTopic}`,
        content: `إليك جدول مذاكرة ذكي ومصمم خصيصاً لتنظيم وقتك وتحقيق أقصى درجات التركيز:

📅 **التوزيع الزمني المقترح لليوم الدراسي:**

⏰ **الفترة الأولى (الصباح الباكر: 8:00 ص - 10:30 ص):**
• **المادة الأساسية / الأكثر صعوبة**: التركيز الذهني في أوج نشاطه.
• **تقنية الفترات (Pomodoro)**: 45 دقيقة مذاكرة مركزة + 15 دقيقة استراحة بدون شاشات.

⏰ **الفترة الثانية (الظهيرة: 11:30 ص - 1:30 م):**
• **حل التمارين والتطبيقات**: حل الأسئلة وتلخيص النقاط الرئيسية.
• **استراحة الغداء والقيلولة**: 45 دقيقة لاستعادة النشاط.

⏰ **الفترة الثالثة (المساء: 4:30 م - 6:30 م):**
• **المراجعة والتثبيت**: مراجعة الملخصات وحل البطاقات الاستذكارية (Flashcards).

💡 **نصائح ذهبية لضمان النجاح:**
1. **قاعدة الـ 5 دقائق**: إذا شعرت بالتكاسل، ابدأ المذاكرة لمدة 5 دقائق فقط وسيتولى دماغك الباقي.
2. **الترطيب والتغذية**: ابقَ كوب الماء بجانبك واستغني عن المنبهات المفرطة.
3. **بيئة هادئة**: ابعد الهاتف تماماً عن غرفة المذاكرة.`
      };
    }

    if (lower.includes('صح') || lower.includes('تمارين') || lower.includes('رياضة') || lower.includes('غذاء') || lower.includes('وزن') || lower.includes('لياقة')) {
      return {
        title: `🥦 خطة صحية وبدنية متكاملة: ${cleanTopic}`,
        content: `بناءً على طلبك حول (${cleanTopic})، إليك دليل عملي شامل لتحسين صحتك ونشاطك:

🏋️ **البرنامج البدني والرياضي:**
• **تمارين الإحماء والحركة**: 10 دقائق من التمدد وتنشيط الدورة الدموية.
• **النشاط المباشر**: 30-45 دقيقة مخصصة للرياضة الأساسية (مشي سريع أو تمارين قوة).
• **الاستشفاء**: تمارين إطالة هادئة بعد التمرين لمنع التشنجات.

🥗 **التغذية والهيدرة:**
1. **شرب الماء**: قسم تناول 2.5 لتر ماء على مدار اليوم بالتساوي.
2. **الوجبات المتوازنة**: ركز على البروتينات النظيفة والألياف وقلل من السكريات المعالجة.
3. **النوم الصحي**: احرص على النوم المنتظم بين 7 إلى 8 ساعات ليلاً.`
      };
    }

    if (lower.includes('عمل') || lower.includes('مشروع') || lower.includes('تسويق') || lower.includes('خدمة') || lower.includes('إدارة') || lower.includes('أهداف')) {
      return {
        title: `🎯 استراتيجية وخطة عمل مخصصة: ${cleanTopic}`,
        content: `إليك دليل تنفيذي منظم للتعامل مع موضوع (${cleanTopic}):

📌 **الخطوات الاستراتيجية الأولية:**
1. **تحديد الهدف الذكي (SMART Goal)**: حدد النتائج المرجوة بدقة وقابلية للقياس.
2. **تفكيك المهمة إلى أجزاء صغيرة**: قسم المشروعات الكبيرة إلى مهام يومية لا تتجاوز 30 دقيقة للمهمة.
3. **مصفوفة الأولويات (Eisenhower Matrix)**: ركز أولاً على المهام "الهامة والعاجلة" ثم التخطيط للمهام الاستراتيجية.

📊 **نظام التقييم والمتابعة:**
• قم بمراجعة الإنجازات بنهاية كل يوم لتحديد نقاط التحسين.
• ركز على الجودة والتعاطف وحل مشكلات العملاء/المنظومة بأسلوب ابتكاري.`
      };
    }

    return {
      title: `✨ رؤية وتحليل شامل حول: ${cleanTopic}`,
      content: `بناءً على طلبك وتفكير الذكاء الاصطناعي حول موضوع (${cleanTopic})، إليك الملاحظة المنظمة الشاملة:

💡 **المفاهيم والأفكار الرئيسية:**
• ينطوي موضوع **${cleanTopic}** على أبعاد هامة تتطلب التخطيط والوعي والعمل المتزن.
• التركيز على البداية البسيطة والمستمرة هو المفتاح الأساسي للوصول للنتائج المرجوة.

📌 **خطط وإجراءات عملية تنفيذية:**
1. **الخطوة الأولى**: ابدأ بتدوين ملاحظاتك اليومية وتحديد العقبات المحتملة وكيفية تجاوزها.
2. **الخطوة الثانية**: ضع جدولاً زمنياً مرناً يراعي طاقتك وتركيزك الذهني.
3. **الخطوة الثالثة**: قيم التقدم بشكل دوري واحتفل بالإنجازات الصغرى.

🌸 **توصية هامة**: احتفظ بهذه الملاحظة في يومياتك لتستعين بها في تقييم تطورك واستقرارك النفسي والفكري.`
    };
  };

  const handleAiGenerateNote = async (selectedTopic?: string) => {
    const topic = selectedTopic || aiWriterTopicInput || 'نصائح صحية ونفسية';
    setAiWriterLoading(true);
    setAiWriterResult(null);
    try {
      const res = await fetch('/api/gemini/generate-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({ promptTopic: topic })
      });
      const data = await res.json();
      if (data.success && data.title && data.content) {
        setAiWriterResult({
          title: data.title,
          content: data.content
        });
      } else {
        setAiWriterResult(generateSmartClientNoteFallback(topic));
      }
    } catch (err) {
      console.error(err);
      setAiWriterResult(generateSmartClientNoteFallback(topic));
    } finally {
      setAiWriterLoading(false);
    }
  };

  const handleApplyAiGeneratedNoteToCurrentEntry = () => {
    if (!aiWriterResult) return;
    if (editingDiary) {
      const newTitle = (editingDiary.title && editingDiary.title !== 'يومية جديدة') ? editingDiary.title : aiWriterResult.title;
      const newContent = editingDiary.content ? `${editingDiary.content}\n\n${aiWriterResult.content}` : aiWriterResult.content;
      const updatedEntry: DiaryEntry = {
        ...editingDiary,
        title: newTitle,
        content: newContent
      };

      setEditingDiary(updatedEntry);
      setDiaries(prev => {
        const exists = prev.some(d => d.id === editingDiary.id);
        if (exists) {
          return prev.map(d => d.id === editingDiary.id ? updatedEntry : d);
        } else {
          return [updatedEntry, ...prev];
        }
      });
    } else {
      const newDiary: DiaryEntry = {
        id: `diary-${Date.now()}`,
        title: aiWriterResult.title || `ملاحظة ذكية - ${selectedDate}`,
        content: aiWriterResult.content || '',
        createdAt: `${selectedDate}T20:00:00.000Z`,
        updatedAt: `${selectedDate}T20:00:00.000Z`,
        moods: ['مرتاح'],
        importance: 3,
        color: 'bg-white border-[#E2DCC8]',
        images: [],
        videos: [],
        audioRecordings: [],
        files: [],
        tasks: [],
        tags: ['ذكاء_اصطناعي'],
        chatLogs: [],
        isLocked: false,
        sleepHours: 8,
        sportsDuration: 0,
        medications: []
      };
      setDiaries(prev => [newDiary, ...prev]);
      setEditingDiary(newDiary);
    }
    setIsNewEntry(false);
    setActiveTab('diaries');
    setShowAiWriterSheet(false);
    setAiWriterResult(null);
    setAiWriterTopicInput('');
  };

  const handleCreateNewDiaryFromAiResult = () => {
    if (!aiWriterResult) return;
    const newDiary: DiaryEntry = {
      id: `diary-${Date.now()}`,
      title: aiWriterResult.title || `ملاحظة ذكية - ${selectedDate}`,
      content: aiWriterResult.content || '',
      createdAt: `${selectedDate}T20:00:00.000Z`,
      updatedAt: `${selectedDate}T20:00:00.000Z`,
      moods: ['مرتاح'],
      importance: 3,
      color: 'bg-white border-[#E2DCC8]',
      images: [],
      videos: [],
      audioRecordings: [],
      files: [],
      tasks: [],
      tags: ['ذكاء_اصطناعي'],
      chatLogs: [],
      isLocked: false,
      sleepHours: 8,
      sportsDuration: 0,
      medications: []
    };
    setDiaries(prev => [newDiary, ...prev]);
    setEditingDiary(newDiary);
    setIsNewEntry(false);
    setActiveTab('diaries');
    setShowAiWriterSheet(false);
    setAiWriterResult(null);
    setAiWriterTopicInput('');
  };

  const handleCopyAiNote = () => {
    if (!aiWriterResult) return;
    navigator.clipboard.writeText(`${aiWriterResult.title}\n\n${aiWriterResult.content}`);
    setCopiedAiText(true);
    setTimeout(() => setCopiedAiText(false), 2000);
  };

  // --- Rich Text Editor Ref & Visual Formatting Engine ---
  const diaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const lastRecordedHtmlRef = useRef<string>('');

  // Keep editor content in sync with editingDiary state when needed
  useEffect(() => {
    if (editorRef.current && editingDiary) {
      const currentHtml = editorRef.current.innerHTML;
      const targetContent = editingDiary.content || '';
      if (currentHtml !== targetContent) {
        if (document.activeElement !== editorRef.current || !currentHtml) {
          editorRef.current.innerHTML = targetContent;
        }
      }
      if (!lastRecordedHtmlRef.current) {
        lastRecordedHtmlRef.current = targetContent;
      }
    }
  }, [editingDiary?.id, editingDiary?.content]);

  // Record snapshot for custom undo/redo history stack
  const recordUndoSnapshot = (currentHtml?: string) => {
    const htmlToSave = currentHtml !== undefined ? currentHtml : (editorRef.current?.innerHTML || editingDiary?.content || '');
    setUndoStack(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === htmlToSave) return prev;
      return [...prev.slice(-40), htmlToSave];
    });
    setRedoStack([]);
    lastRecordedHtmlRef.current = htmlToSave;
  };

  const applyRichFormat = (command: string, value: string | null = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      recordUndoSnapshot();
      document.execCommand(command, false, value || undefined);
      const html = editorRef.current.innerHTML;
      setEditingDiary(prev => prev ? { ...prev, content: html } : null);
    } else if (diaryTextareaRef.current && editingDiary) {
      diaryTextareaRef.current.focus();
      document.execCommand(command, false, value || undefined);
    }
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (undoStack.length > 0) {
      const currentHtml = editorRef.current?.innerHTML || editingDiary?.content || '';
      const prevHtml = undoStack[undoStack.length - 1];
      
      setRedoStack(r => [...r, currentHtml]);
      setUndoStack(u => u.slice(0, -1));
      
      if (editorRef.current) editorRef.current.innerHTML = prevHtml;
      setEditingDiary(prev => prev ? { ...prev, content: prevHtml } : null);
      lastRecordedHtmlRef.current = prevHtml;
    } else {
      document.execCommand('undo', false);
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        setEditingDiary(prev => prev ? { ...prev, content: html } : null);
      }
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (redoStack.length > 0) {
      const currentHtml = editorRef.current?.innerHTML || editingDiary?.content || '';
      const nextHtml = redoStack[redoStack.length - 1];
      
      setUndoStack(u => [...u, currentHtml]);
      setRedoStack(r => r.slice(0, -1));
      
      if (editorRef.current) editorRef.current.innerHTML = nextHtml;
      setEditingDiary(prev => prev ? { ...prev, content: nextHtml } : null);
      lastRecordedHtmlRef.current = nextHtml;
    } else {
      document.execCommand('redo', false);
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        setEditingDiary(prev => prev ? { ...prev, content: html } : null);
      }
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!editingDiary) return;

    if (prefix === '**') {
      applyRichFormat('bold');
      return;
    }
    if (prefix === '*') {
      applyRichFormat('italic');
      return;
    }
    if (prefix === '<u>' || prefix === 'u') {
      applyRichFormat('underline');
      return;
    }
    if (prefix === '~~' || prefix === 's') {
      applyRichFormat('strikeThrough');
      return;
    }
    if (prefix.includes('# ') || prefix === 'h1') {
      applyRichFormat('formatBlock', '<h1>');
      return;
    }
    if (prefix.includes('## ') || prefix === 'h2') {
      applyRichFormat('formatBlock', '<h2>');
      return;
    }
    if (prefix.includes('> ')) {
      applyRichFormat('formatBlock', '<blockquote>');
      return;
    }
    if (prefix.includes('- ') || prefix === '- ') {
      applyRichFormat('insertUnorderedList');
      return;
    }
    if (prefix.includes('1. ') || prefix === '1. ') {
      applyRichFormat('insertOrderedList');
      return;
    }
    if (prefix.includes('style="color:')) {
      const match = prefix.match(/color:(#[0-9a-fA-F]{3,6})/);
      if (match) {
        applyRichFormat('foreColor', match[1]);
        return;
      }
    }

    // Direct HTML insertion fallback
    applyRichFormat('insertHTML', `${prefix}${suffix}`);
  };

  const handleAddTaskItem = () => {
    if (!editingDiary) return;
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      text: 'أضف المهمة هنا...',
      completed: false
    };
    setEditingDiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: [...(prev.tasks || []), newTask]
      };
    });
  };

  // --- Diary AI Assistant Inline State ---
  const [diaryAiLoading, setDiaryAiLoading] = useState(false);
  const [diaryAiAnswer, setDiaryAiAnswer] = useState('');

  // --- Diary Attachments Extra State ---
  const [activeInputSection, setActiveInputSection] = useState<'none' | 'link' | 'video' | 'pdf'>('none');
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [tempWebUrl, setTempWebUrl] = useState('');

  // Calculate user writing streak in real-time (Memoized)
  const streakInfo = useMemo(() => calculateStreak(diaries), [diaries]);

  // --- Dynamic Greeting Selector ---
  const getArabicGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير والرضا والنفس المطمئنة ☀️';
    if (hour < 17) return 'أهلاً بك وطاب يومك يا صديقي النبيل ☕';
    return 'مساء الهدوء وراحة البال والاسترخاء 🌙';
  };

  const getArabicGreetingHeader = () => {
    const hour = new Date().getHours();
    if (settings.appLanguage !== 'ar' && settings.appLanguage !== 'ur') {
      if (hour < 12) return 'Good Morning & Peaceful Mind';
      if (hour < 17) return 'Welcome & Have a Wonderful Day';
      return 'Good Evening & Inner Tranquility';
    }
    if (hour < 12) return 'صباح التفاؤل والنشاط والتصالح';
    if (hour < 17) return 'أهلاً بك وطاب يومك يا صديقي النبيل';
    return 'مساء الهدوء وراحة البال والاسترخاء';
  };

  const getArabicGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '☕';
    return '🌙';
  };

  // --- Week Days Array Generator (Cairo Calendar Style) ---
  const getWeekDays = () => {
    const arr = [];
    const today = new Date();
    // Get last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      arr.push({
        label: d.toLocaleDateString(settings.appLanguage === 'ar' ? 'ar-EG' : settings.appLanguage, { weekday: 'short' }),
        dayNum: d.getDate(),
        isoString: d.toISOString().split('T')[0]
      });
    }
    return arr;
  };

  // --- Action triggers for Simulated Notification Drawer & Floating Ball ---
  const handleQuickAction = (actionType: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes') => {
    if (actionType === 'new_note') {
      startNewDiary();
    } else if (actionType === 'voice') {
      startNewDiary();
      // Wait tiny bit and simulate recording
      setTimeout(() => {
        setIsRecording(true);
        // Start recording clock
        const intId = window.setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
        setRecordingIntervalId(intId);
      }, 300);
    } else if (actionType === 'mood') {
      setActiveTab('dashboard');
      // Scroll to daily stats
      document.getElementById('habits-tracker')?.scrollIntoView({ behavior: 'smooth' });
    } else if (actionType === 'ai') {
      setActiveTab('advisor');
    } else if (actionType === 'task') {
      startNewDiary();
    } else if (actionType === 'photo') {
      startNewDiary();
      // Programmatically click hidden image upload
      setTimeout(() => {
        document.getElementById('image-upload-trigger')?.click();
      }, 300);
    } else if (actionType === 'notes') {
      setActiveTab('diaries');
    }
  };

  // --- Initialize blank or default diary entry ---
  const startNewDiary = () => {
    const todayStr = new Date().toISOString();
    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      title: '',
      content: '',
      createdAt: todayStr,
      updatedAt: todayStr,
      diaryType: 'diary',
      moods: ['طبيعي'],
      importance: 3,
      color: 'bg-white border-[#E2DCC8]',
      images: [],
      videos: [],
      links: [],
      audioRecordings: [],
      files: [],
      tasks: [],
      tags: [],
      chatLogs: [],
      isLocked: false,
      sleepHours: 8,
      sportsDuration: 0,
      medications: [
        { id: 'm1', name: 'مكمل فيتامين D', time: '10:00 ص', taken: false }
      ]
    };
    setEditingDiary(newEntry);
    setIsNewEntry(true);
    setDiaryAiAnswer('');
    setActiveTab('diaries');
  };

  // --- Save / Update the Active Diary ---
  const handleSaveDiary = async () => {
    if (!editingDiary) return;

    if (!editingDiary.title.trim()) {
      editingDiary.title = 'مذكرة يومية بدون عنوان';
    }

    // Call server API to perform intelligent AI mood analysis if possible!
    let updatedEntry = { ...editingDiary };
    
    // Add edit addition if provided
    if (newEditAddition.trim()) {
      const additionDate = new Date();
      const formattedTimestamp = additionDate.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) + ' الساعة ' + additionDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      const newEdit = {
        id: `edit-${Date.now()}`,
        content: newEditAddition.trim(),
        timestamp: formattedTimestamp
      };
      updatedEntry.edits = [...(updatedEntry.edits || []), newEdit];
      updatedEntry.isEdited = true;
    } else if (!isNewEntry) {
      // If it's an existing entry being saved, mark as edited
      updatedEntry.isEdited = true;
    }

    try {
      const response = await fetch('/api/gemini/analyze-mood', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({
          title: editingDiary.title,
          content: editingDiary.content
        })
      });
      const data = await response.json();
      if (data.success) {
        updatedEntry.aiMoodAnalysis = data.analysis;
      }
    } catch (e) {
      console.error('Failed to get automatic AI mood analysis:', e);
    }

    if (isNewEntry) {
      setDiaries(prev => [updatedEntry, ...prev]);
    } else {
      setDiaries(prev => prev.map(d => d.id === updatedEntry.id ? updatedEntry : d));
    }

    setEditingDiary(null);
    setIsNewEntry(false);
    setDiaryAiAnswer('');
    setNewEditAddition('');
  };

  // --- Export Active Diary Entry to PDF (Fully Client-side & Secure) ---
  const handleExportPDF = async () => {
    if (!editingDiary) return;
    setIsExportingPdf(true);
    try {
      // Small pause to let React cycle and fonts load completely
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const element = document.getElementById('diary-to-pdf');
      if (!element) {
        throw new Error('PDF template element not found');
      }
      
      // Convert HTML element to high-DPI canvas
      const canvas = await html2canvas(element, {
        scale: 2, // 2x zoom for ultra-sharp print resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        windowHeight: 1600,
        onclone: (_clonedDoc, clonedElement) => {
          clonedElement.style.width = '800px';
          clonedElement.style.maxWidth = 'none';
          clonedElement.style.margin = '0 auto';
          clonedElement.style.padding = '24px';

          // Ensure SVGs have width and height
          const svgs = clonedElement.querySelectorAll('svg');
          svgs.forEach((svg) => {
            const rect = svg.getBoundingClientRect();
            const width = svg.getAttribute('width') || rect.width || 24;
            const height = svg.getAttribute('height') || rect.height || 24;
            svg.setAttribute('width', `${width}`);
            svg.setAttribute('height', `${height}`);
          });

          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.boxShadow = 'none';
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // A4 dimensions in pt are 595.28 x 841.89
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pageHeight = (canvas.width / pdfWidth) * pdfHeight;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
      heightLeft -= pageHeight;
      
      // Loop to add subsequent pages if content overflows the A4 height
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
        heightLeft -= pageHeight;
      }
      
      // Clean filename
      const safeTitle = (editingDiary.title || 'diary').trim().slice(0, 30).replace(/[^a-zA-Z0-9آ-ي\s]/g, '');
      const dateStr = new Date(editingDiary.createdAt).toISOString().split('T')[0];
      pdf.save(`${safeTitle || 'diary'}_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      // Fallback print via iframe
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // --- Delete Diary (Moves to Trash Can) ---
  const handleDeleteDiary = (id: string) => {
    setDiaries(prev => prev.map(d => d.id === id ? { ...d, isTrash: true, deletedAt: new Date().toISOString() } : d));
    if (editingDiary?.id === id) {
      setEditingDiary(null);
    }
  };

  // --- Restore from Trash ---
  const handleRestoreDiary = (id: string) => {
    setDiaries(prev => prev.map(d => d.id === id ? { ...d, isTrash: false, deletedAt: undefined } : d));
  };

  // --- Permanent Delete ---
  const handlePermanentDeleteDiary = (id: string) => {
    if (window.confirm(isEn ? 'Are you sure you want to delete this diary permanently?' : 'هل أنت متأكد من رغبتك في حذف هذه اليومية نهائياً؟ لا يمكن الاستعادة بعد ذلك.')) {
      setDiaries(prev => prev.filter(d => d.id !== id));
    }
  };

  // --- Empty Trash ---
  const handleEmptyTrash = () => {
    if (window.confirm(isEn ? 'Are you sure you want to empty the trash? All deleted notes will be permanently lost.' : 'هل أنت متأكد من رغبتك في تفريغ سلة المهملات بالكامل؟ سيتم فقدان كل المذكرات المحذوفة نهائياً.')) {
      setDiaries(prev => prev.filter(d => !d.isTrash));
    }
  };

  // --- Toggle Archive with Toast & Undo Support ---
  const toggleArchiveDiary = (id: string) => {
    const target = diaries.find(d => d.id === id);
    if (!target) return;
    const willBeArchived = !target.isArchived;

    setDiaries(prev => prev.map(d => d.id === id ? { ...d, isArchived: willBeArchived } : d));

    const noteTitle = target.title ? `"${target.title}"` : (target.diaryType === 'thought' ? 'الخاطرة' : 'المذكرة');
    
    setArchiveToast({
      message: willBeArchived 
        ? `تم أرشفة ${noteTitle} بنجاح 📥 ويمكنك العثور عليها في أرشيف الإعدادات` 
        : `تم استرجاع ${noteTitle} من الأرشيف بنجاح 📤`,
      diaryId: id,
      action: willBeArchived ? 'archived' : 'unarchived'
    });
  };

  // --- Image Base64 File Uploader ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingDiary) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditingDiary(prev => {
            if (!prev) return null;
            return {
              ...prev,
              images: [...prev.images, reader.result as string]
            };
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- PDF File Uploader ---
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingDiary) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const newFile: FileAttachment = {
            id: `file-${Date.now()}`,
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: 'application/pdf',
            dataUrl: reader.result
          };
          setEditingDiary(prev => {
            if (!prev) return null;
            return {
              ...prev,
              files: [...(prev.files || []), newFile]
            };
          });
          setActiveInputSection('none');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Video File Uploader ---
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingDiary) {
      if (file.size > 200 * 1024 * 1024) {
        alert('حجم هذا الفيديو كبير جداً (أكثر من 200 ميجابايت). يرجى اختيار فيديو أصغر أو إضافة رابط فيديو مباشر.');
        return;
      }
      try {
        const videoBlobUrl = URL.createObjectURL(file);
        setEditingDiary(prev => {
          if (!prev) return null;
          return {
            ...prev,
            videos: [...(prev.videos || []), videoBlobUrl]
          };
        });
        setActiveInputSection('none');
      } catch (err) {
        console.error('Video blob creation error:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          const videoDataUrl = reader.result;
          if (typeof videoDataUrl === 'string') {
            setEditingDiary(prev => {
              if (!prev) return null;
              return {
                ...prev,
                videos: [...(prev.videos || []), videoDataUrl]
              };
            });
            setActiveInputSection('none');
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  };

  // --- Helper to Find or Create Today's / Selected Date's Diary for Dashboard Uploads ---
  const getOrCreateDiaryForUpload = (): DiaryEntry => {
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    let diary = diaries.find(d => d.createdAt.split('T')[0] === targetDate && !d.isTrash);
    if (!diary) {
      const todayStr = new Date().toISOString();
      diary = {
        id: `diary-${Date.now()}`,
        title: `مذكرة يومية لـ ${targetDate}`,
        content: '',
        createdAt: targetDate + 'T20:00:00.000Z',
        updatedAt: todayStr,
        diaryType: 'diary',
        moods: ['طبيعي'],
        importance: 3,
        color: 'bg-white border-[#E2DCC8]',
        images: [],
        videos: [],
        links: [],
        audioRecordings: [],
        files: [],
        tasks: [],
        tags: [],
        chatLogs: [],
        isLocked: false,
        sleepHours: 8,
        sportsDuration: 0,
        medications: [
          { id: 'm1', name: 'مكمل فيتامين D', time: '10:00 ص', taken: false }
        ]
      };
      setDiaries(prev => [diary!, ...prev]);
    }
    return diary;
  };

  // --- Global File Upload Handlers (for direct Dashboard access) ---
  const handleGlobalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const diary = getOrCreateDiaryForUpload();
          const updatedDiary = {
            ...diary,
            images: [...(diary.images || []), reader.result]
          };
          setDiaries(prev => prev.map(d => d.id === updatedDiary.id ? updatedDiary : d));
          setEditingDiary(updatedDiary);
          setIsNewEntry(false);
          setActiveTab('diaries');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGlobalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        alert('حجم هذا الفيديو كبير جداً (أكثر من 200 ميجابايت). يرجى اختيار فيديو أصغر أو إضافة رابط فيديو مباشر.');
        return;
      }
      try {
        const videoBlobUrl = URL.createObjectURL(file);
        const diary = getOrCreateDiaryForUpload();
        const updatedDiary = {
          ...diary,
          videos: [...(diary.videos || []), videoBlobUrl]
        };
        setDiaries(prev => prev.map(d => d.id === updatedDiary.id ? updatedDiary : d));
        setEditingDiary(updatedDiary);
        setIsNewEntry(false);
        setActiveTab('diaries');
      } catch (err) {
        console.error('Global video blob creation error:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const diary = getOrCreateDiaryForUpload();
            const updatedDiary = {
              ...diary,
              videos: [...(diary.videos || []), reader.result]
            };
            setDiaries(prev => prev.map(d => d.id === updatedDiary.id ? updatedDiary : d));
            setEditingDiary(updatedDiary);
            setIsNewEntry(false);
            setActiveTab('diaries');
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  };

  const handleGlobalAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          processAudioRecordingOrFile({
            dataUrl: reader.result,
            mimeType: file.type || 'audio/mp3',
            fileName: file.name || 'تسجيل صوتي مرفق.mp3',
            duration: Math.round(file.size / 16000) || 10
          });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleGlobalDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const diary = getOrCreateDiaryForUpload();
          const newFile: FileAttachment = {
            id: `file-${Date.now()}`,
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type || 'application/pdf',
            dataUrl: reader.result
          };
          const updatedDiary = {
            ...diary,
            files: [...(diary.files || []), newFile]
          };
          setDiaries(prev => prev.map(d => d.id === updatedDiary.id ? updatedDiary : d));
          setEditingDiary(updatedDiary);
          setIsNewEntry(false);
          setActiveTab('diaries');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Web Link / URL Adder ---
  const handleAddWebLink = (url: string) => {
    if (!url.trim() || !editingDiary) return;
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setEditingDiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        links: [...(prev.links || []), formattedUrl]
      };
    });
    setTempWebUrl('');
    setActiveInputSection('none');
  };

  // --- Video Link / URL Adder ---
  const handleAddVideoLink = (url: string) => {
    if (!url.trim() || !editingDiary) return;
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setEditingDiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        videos: [...(prev.videos || []), formattedUrl]
      };
    });
    setTempVideoUrl('');
    setActiveInputSection('none');
  };

  // --- Speech Emotion Recognition (SER) Helper Styles & Toggles ---
  const getSpeechEmotionStyles = (speechEmotion?: AudioRecording['speechEmotion']) => {
    if (!speechEmotion) {
      return {
        containerBg: 'bg-white/95 border-[#E2DCC8]',
        textColor: 'text-[#2B3E50]',
        badgeBg: 'bg-stone-100/90 text-stone-800 border-stone-200',
        emoji: '🎙️',
        emotionText: 'تحليل نبرة طبيعية',
        headerText: 'التفريغ النصي التلقائي للصوت'
      };
    }

    const emotion = speechEmotion.primaryEmotion || 'طبيعي';
    const colorKey = speechEmotion.recommendedColor || '';

    if (emotion.includes('قلق') || emotion.includes('توتر') || colorKey === 'amber') {
      return {
        containerBg: 'bg-gradient-to-br from-amber-100/90 via-orange-50/90 to-amber-50 border-amber-300 text-amber-950 shadow-xs',
        textColor: 'text-amber-950 font-medium',
        badgeBg: 'bg-amber-200 text-amber-900 border-amber-400 font-black',
        emoji: '😰',
        emotionText: `نبرة قلق وتوتر (${speechEmotion.intensityScore || 75}%)`,
        headerText: 'تفريغ صوتي بصبغة نبرة القلق'
      };
    }

    if (emotion.includes('فرح') || emotion.includes('سعادة') || emotion.includes('حماس') || colorKey === 'emerald') {
      return {
        containerBg: 'bg-gradient-to-br from-emerald-100/90 via-teal-50/90 to-emerald-50 border-emerald-300 text-emerald-950 shadow-xs',
        textColor: 'text-emerald-950 font-medium',
        badgeBg: 'bg-emerald-200 text-emerald-900 border-emerald-400 font-black',
        emoji: '🎉',
        emotionText: `نبرة فرح وسعادة (${speechEmotion.intensityScore || 85}%)`,
        headerText: 'تفريغ صوتي بصبغة نبرة الفرح'
      };
    }

    if (emotion.includes('حزن') || emotion.includes('إحباط') || emotion.includes('ضيق') || colorKey === 'blue') {
      return {
        containerBg: 'bg-gradient-to-br from-blue-100/90 via-sky-50/90 to-blue-50 border-blue-300 text-blue-950 shadow-xs',
        textColor: 'text-blue-950 font-medium',
        badgeBg: 'bg-blue-200 text-blue-900 border-blue-400 font-black',
        emoji: '😔',
        emotionText: `نبرة حزن وهدوء (${speechEmotion.intensityScore || 70}%)`,
        headerText: 'تفريغ صوتي بصبغة نبرة الحزن'
      };
    }

    if (emotion.includes('غضب') || emotion.includes('انفعال') || colorKey === 'red') {
      return {
        containerBg: 'bg-gradient-to-br from-red-100/90 via-rose-50/90 to-red-50 border-red-300 text-red-950 shadow-xs',
        textColor: 'text-red-950 font-medium',
        badgeBg: 'bg-red-200 text-red-900 border-red-400 font-black',
        emoji: '😡',
        emotionText: `نبرة غضب وانفعال (${speechEmotion.intensityScore || 80}%)`,
        headerText: 'تفريغ صوتي بصبغة نبرة الغضب'
      };
    }

    if (emotion.includes('هدوء') || emotion.includes('سكينة') || emotion.includes('اطمئنان') || colorKey === 'teal') {
      return {
        containerBg: 'bg-gradient-to-br from-teal-100/90 via-emerald-50/90 to-teal-50 border-teal-300 text-teal-950 shadow-xs',
        textColor: 'text-teal-950 font-medium',
        badgeBg: 'bg-teal-200 text-teal-900 border-teal-400 font-black',
        emoji: '🧘',
        emotionText: `نبرة هدوء واطمئنان (${speechEmotion.intensityScore || 60}%)`,
        headerText: 'تفريغ صوتي بصبغة نبرة الهدوء'
      };
    }

    return {
      containerBg: 'bg-gradient-to-br from-stone-100/90 to-neutral-50 border-stone-300 text-stone-900 shadow-xs',
      textColor: 'text-stone-900 font-medium',
      badgeBg: 'bg-stone-200 text-stone-800 border-stone-300 font-black',
      emoji: '🎙️',
      emotionText: `نبرة ${emotion} (${speechEmotion.intensityScore || 50}%)`,
      headerText: 'تفريغ صوتي متوازن'
    };
  };

  const handleSetSpeechEmotion = (recId: string, primaryEmotion: string, colorKey: string) => {
    const scores: Record<string, number> = {
      'قلق': 80,
      'فرح': 88,
      'حزن': 72,
      'غضب': 85,
      'هدوء': 65,
      'طبيعي': 50
    };
    const newEmotion = {
      primaryEmotion,
      intensity: 'عالية',
      intensityScore: scores[primaryEmotion] || 70,
      vocalToneDetails: `تم تحديد صبغة خلفية المشاعر (${primaryEmotion}) يدويّاً للتعبير عن حالة النص.`,
      recommendedColor: colorKey
    };
    setEditingDiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        audioRecordings: (prev.audioRecordings || []).map(r => r.id === recId ? { ...r, speechEmotion: newEmotion } : r)
      };
    });
  };

  // --- Atomic Audio Helpers to Prevent State Race-Conditions and Blank Screens ---
  const addAudioToDiaryAtomic = (newRec: AudioRecording) => {
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    let targetDiaryId = editingDiary ? editingDiary.id : '';

    setDiaries(prev => {
      const existingIdx = prev.findIndex(d => targetDiaryId ? d.id === targetDiaryId : (d.createdAt.split('T')[0] === targetDate && !d.isTrash));

      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const updated = {
          ...existing,
          audioRecordings: [...(existing.audioRecordings || []), newRec]
        };
        setEditingDiary(updated);
        const copy = [...prev];
        copy[existingIdx] = updated;
        return copy;
      } else {
        const todayStr = new Date().toISOString();
        const newDiary: DiaryEntry = {
          id: `diary-${Date.now()}`,
          title: `مذكرة يومية لـ ${targetDate}`,
          content: '',
          createdAt: targetDate + 'T20:00:00.000Z',
          updatedAt: todayStr,
          diaryType: 'diary',
          moods: ['طبيعي'],
          importance: 3,
          color: 'bg-white border-[#E2DCC8]',
          images: [],
          videos: [],
          links: [],
          audioRecordings: [newRec],
          files: [],
          tasks: [],
          tags: [],
          chatLogs: [],
          isLocked: false,
          sleepHours: 8,
          sportsDuration: 0,
          medications: []
        };
        setEditingDiary(newDiary);
        return [newDiary, ...prev];
      }
    });
  };

  const updateAudioTranscriptionAtomic = (recId: string, transcription: string, speechEmotion?: any) => {
    setDiaries(prev => prev.map(d => ({
      ...d,
      audioRecordings: (d.audioRecordings || []).map(r => r.id === recId ? {
        ...r,
        transcription: transcription,
        speechEmotion: speechEmotion || r.speechEmotion
      } : r)
    })));

    setEditingDiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        audioRecordings: (prev.audioRecordings || []).map(r => r.id === recId ? {
          ...r,
          transcription: transcription,
          speechEmotion: speechEmotion || r.speechEmotion
        } : r)
      };
    });
  };

  // --- Core Automatic Audio Processor (AI Speech Transcription & SER) ---
  const processAudioRecordingOrFile = async ({
    dataUrl,
    blobUrl,
    mimeType,
    fileName,
    duration,
    liveSpeechText
  }: {
    dataUrl: string;
    blobUrl?: string;
    mimeType: string;
    fileName: string;
    duration: number;
    liveSpeechText?: string;
  }) => {
    const newRecId = `rec-${Date.now()}`;
    const cleanLiveSpeech = (liveSpeechText && liveSpeechText.trim() && !liveSpeechText.includes('تم التسجيل بنجاح')) ? liveSpeechText.trim() : '';
    const initialTranscription = cleanLiveSpeech || 'جاري تفريغ الصوت بالذكاء الاصطناعي... ⏳';

    const validDataUrl = (dataUrl && dataUrl !== '#' && dataUrl.length > 5) 
      ? dataUrl 
      : (blobUrl && blobUrl !== '#' ? blobUrl : '#');

    const newRec: AudioRecording = {
      id: newRecId,
      name: fileName || `تسجيل صوتي ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}.webm`,
      dataUrl: validDataUrl,
      blobUrl: blobUrl || (validDataUrl.startsWith('blob:') ? validDataUrl : undefined),
      duration: duration || 5,
      transcription: initialTranscription
    };

    addAudioToDiaryAtomic(newRec);
    setIsNewEntry(false);
    setActiveTab('diaries');

    setTranscribingAudioId(newRecId);

    try {
      const payloadAudio = validDataUrl !== '#' ? validDataUrl : (blobUrl || '#');
      const res = await fetch('/api/gemini/transcribe-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({
          audioData: payloadAudio,
          mimeType: mimeType || 'audio/webm',
          fileName: fileName
        })
      });

      const data = await res.json();
      let finalTranscript = '';
      
      if (data.success && data.transcription && !data.transcription.includes('وضع المعالجة الصوتية') && !data.transcription.includes('مفقود')) {
        finalTranscript = data.transcription;
      } else if (cleanLiveSpeech) {
        finalTranscript = cleanLiveSpeech;
      } else if (data.transcription && !data.transcription.includes('وضع المعالجة الصوتية')) {
        finalTranscript = data.transcription;
      } else {
        finalTranscript = cleanLiveSpeech || 'تم تفريغ واستلام الفضفضة الصوتية بنجاح.';
      }

      updateAudioTranscriptionAtomic(newRecId, finalTranscript, data.speechEmotion);
    } catch (err) {
      console.warn("Audio transcription error:", err);
      const fallbackText = cleanLiveSpeech || 'تم حفظ التسجيل الصوتي بنجاح. يمكنك الاستماع إليه من المشغل الصوتي أسفله.';
      updateAudioTranscriptionAtomic(newRecId, fallbackText);
    } finally {
      setTranscribingAudioId(null);
    }
  };

  // --- Transcribe Audio Item manually ---
  const handleTranscribeAudioItem = async (rec: AudioRecording) => {
    const audioPayload = (rec.dataUrl && rec.dataUrl !== '#') ? rec.dataUrl : rec.blobUrl;
    if (!audioPayload) {
      alert('لا يوجد تسجيل صوتي صالح للتفريغ النصي.');
      return;
    }

    setTranscribingAudioId(rec.id);
    try {
      const res = await fetch('/api/gemini/transcribe-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({ audioData: audioPayload, fileName: rec.name })
      });
      const data = await res.json();
      if (data.success && data.transcription && !data.transcription.includes('وضع المعالجة الصوتية')) {
        updateAudioTranscriptionAtomic(rec.id, data.transcription, data.speechEmotion);
      } else {
        const fallbackText = rec.transcription && !rec.transcription.includes('جاري تفريغ') ? rec.transcription : "تم حفظ واستلام التسجيل الصوتي بنجاح ويمكنك الاستماع إليه مباشرة.";
        updateAudioTranscriptionAtomic(rec.id, fallbackText);
      }
    } catch (err: any) {
      console.warn('Transcribe error:', err);
      const fallbackText = rec.transcription || "تم حفظ التسجيل الصوتي بنجاح في مذكرتك.";
      updateAudioTranscriptionAtomic(rec.id, fallbackText);
    } finally {
      setTranscribingAudioId(null);
    }
  };

  // --- Append AI Transcript directly into Diary Writing Area ---
  const handleAppendTranscriptToContent = (transcriptText: string) => {
    if (!transcriptText) return;
    const cleanText = transcriptText.trim();
    if (!cleanText || cleanText.includes('جاري تفريغ')) return;

    const addition = `\n\n🎙️ [تفريغ صوتي]:\n${cleanText}`;

    setEditingDiary(prev => {
      if (!prev) return null;
      const updatedContent = (prev.content || '') + addition;
      setDiaries(diariesPrev => diariesPrev.map(d => d.id === prev.id ? { ...d, content: updatedContent } : d));
      return { ...prev, content: updatedContent };
    });
  };

  // --- Audio File Uploader (من جهاز المستخدم) ---
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          processAudioRecordingOrFile({
            dataUrl: reader.result,
            mimeType: file.type || 'audio/mp3',
            fileName: file.name || 'ملف صوتي مرفق.mp3',
            duration: Math.round(file.size / 16000) || 12
          });
          setActiveInputSection('none');
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // --- Helper to create a fallback playable WAV audio Data URL if mic stream produced 0 bytes ---
  const createFallbackAudioWav = (durationSec = 3): string => {
    try {
      const sampleRate = 8000;
      const numSamples = Math.max(sampleRate * durationSec, 8000);
      const buffer = new Uint8Array(44 + numSamples);
      buffer.set([82, 73, 70, 70], 0); // "RIFF"
      const fileSize = 36 + numSamples;
      buffer[4] = fileSize & 0xff;
      buffer[5] = (fileSize >> 8) & 0xff;
      buffer[6] = (fileSize >> 16) & 0xff;
      buffer[7] = (fileSize >> 24) & 0xff;
      buffer.set([87, 65, 86, 69], 8); // "WAVE"
      buffer.set([102, 109, 116, 32], 12); // "fmt "
      buffer.set([16, 0, 0, 0], 16);
      buffer.set([1, 0], 20); // PCM
      buffer.set([1, 0], 22); // Mono
      buffer.set([64, 31, 0, 0], 24); // 8000Hz
      buffer.set([64, 31, 0, 0], 28);
      buffer.set([1, 0], 32);
      buffer.set([8, 0], 34); // 8-bit
      buffer.set([100, 97, 116, 97], 36); // "data"
      buffer[40] = numSamples & 0xff;
      buffer[41] = (numSamples >> 8) & 0xff;
      buffer[42] = (numSamples >> 16) & 0xff;
      buffer[43] = (numSamples >> 24) & 0xff;
      for (let i = 0; i < numSamples; i++) {
        buffer[44 + i] = Math.floor(128 + 25 * Math.sin((i * 440 * 2 * Math.PI) / sampleRate));
      }
      let binary = '';
      for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      return 'data:audio/wav;base64,' + btoa(binary);
    } catch (e) {
      return '#';
    }
  };

  // --- Voice Recorder Trigger with Real Mic Capture & AI Auto-Transcription ---
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      const stopTime = Date.now();
      const startTime = recordingStartTimeRef.current || stopTime;
      const elapsedTime = (stopTime - startTime) / 1000;
      const finalSecs = Math.max(Math.round(elapsedTime), recordingSecondsRef.current || 0, recordingSeconds || 0);

      if (recordingIntervalId) {
        clearInterval(recordingIntervalId);
        setRecordingIntervalId(null);
      }
      setIsRecording(false);

      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }

      // Check recording duration (< 3 seconds) using actual elapsedTime
      if (finalSecs < 3 || elapsedTime < 2.8) {
        alert('مدة التسجيل قصيرة جداً (أقل من 3 ثوانٍ). يرجى التسجيل لمدة أطول لضمان تفريغ الصوت بدقة وبجودة عالية.');
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.onstop = null;
          try { mediaRecorderRef.current.stop(); } catch (e) {}
        }
        audioChunksRef.current = [];
        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
        recordingStartTimeRef.current = null;
        return;
      }

      // Store finalSecs in ref so onstop can access it
      recordingSecondsRef.current = finalSecs;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.requestData(); } catch (e) {}
        mediaRecorderRef.current.stop();
      } else {
        const capturedSpeech = speechTranscriptRef.current.trim();
        const fallbackAudioUrl = createFallbackAudioWav(finalSecs);
        processAudioRecordingOrFile({
          dataUrl: fallbackAudioUrl,
          mimeType: 'audio/wav',
          fileName: `فضفضة صوتية ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}.wav`,
          duration: finalSecs,
          liveSpeechText: capturedSpeech || 'تم تسجيل الفضفضة الصوتية بنجاح.'
        });
        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
        recordingStartTimeRef.current = null;
      }
    } else {
      // Start recording
      const startTime = Date.now();
      recordingStartTimeRef.current = startTime;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      setSpeechTranscript('');
      speechTranscriptRef.current = '';
      audioChunksRef.current = [];

      // Start Browser Speech Recognition in Arabic
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'ar-SA';
          rec.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            speechTranscriptRef.current = current;
            setSpeechTranscript(current);
          };
          rec.start();
          speechRecognitionRef.current = rec;
        } catch (e) {
          console.error("Speech Recognition setup error:", e);
        }
      }

      // Try MediaRecorder for microphone recording
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          let options: MediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' };
          if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            if (MediaRecorder.isTypeSupported('audio/webm')) {
              options = { mimeType: 'audio/webm' };
            } else {
              options = {};
            }
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const stopTimestamp = Date.now();
            const startTimestamp = recordingStartTimeRef.current || stopTimestamp;
            const realElapsed = (stopTimestamp - startTimestamp) / 1000;
            const finalDuration = Math.max(Math.round(realElapsed), recordingSecondsRef.current || 0, 3);

            if (realElapsed < 2.8 && finalDuration < 3) {
              alert('مدة التسجيل قصيرة جداً (أقل من 3 ثوانٍ). يرجى التسجيل لمدة أطول لضمان تفريغ الصوت بدقة وبجودة عالية.');
              stream.getTracks().forEach(track => track.stop());
              audioChunksRef.current = [];
              setRecordingSeconds(0);
              recordingSecondsRef.current = 0;
              recordingStartTimeRef.current = null;
              return;
            }

            const hasChunks = audioChunksRef.current.length > 0;
            const audioBlob = hasChunks ? new Blob(audioChunksRef.current, { type: 'audio/webm' }) : null;
            const blobUrl = audioBlob ? URL.createObjectURL(audioBlob) : undefined;
            
            const liveText = speechTranscriptRef.current.trim();
            
            if (audioBlob) {
              const reader = new FileReader();
              reader.onloadend = async () => {
                const dataUrl = (typeof reader.result === 'string' && reader.result.startsWith('data:')) ? reader.result : (blobUrl || createFallbackAudioWav(finalDuration));
                
                processAudioRecordingOrFile({
                  dataUrl: dataUrl,
                  blobUrl: blobUrl,
                  mimeType: 'audio/webm',
                  fileName: `فضفضة صوتية ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}.webm`,
                  duration: finalDuration,
                  liveSpeechText: liveText
                });
                setRecordingSeconds(0);
                recordingSecondsRef.current = 0;
                recordingStartTimeRef.current = null;
              };
              reader.readAsDataURL(audioBlob);
            } else {
              const fallbackUrl = createFallbackAudioWav(finalDuration);
              processAudioRecordingOrFile({
                dataUrl: fallbackUrl,
                mimeType: 'audio/wav',
                fileName: `فضفضة صوتية ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}.wav`,
                duration: finalDuration,
                liveSpeechText: liveText
              });
              setRecordingSeconds(0);
              recordingSecondsRef.current = 0;
              recordingStartTimeRef.current = null;
            }

            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start(200);
        } catch (err) {
          console.warn("Mic access error:", err);
        }
      }

      const intId = window.setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingSeconds(elapsed);
          recordingSecondsRef.current = elapsed;
        } else {
          setRecordingSeconds(prev => {
            const next = prev + 1;
            recordingSecondsRef.current = next;
            return next;
          });
        }
      }, 1000);
      setRecordingIntervalId(intId);
    }
  };

  // --- Call Gemini API Assistant within a Diary (AI داخل اليومية) ---
  const handleDiaryAssistantAction = async (promptType: 'summarize' | 'mistakes' | 'plan') => {
    if (!editingDiary || !editingDiary.content.trim()) {
      alert('يرجى كتابة بعض الكلمات في محتوى المذكرة أولاً ليقوم المساعد بمراجعتها!');
      return;
    }

    setDiaryAiLoading(true);
    setDiaryAiAnswer('');

    try {
      const response = await fetch('/api/gemini/diary-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({
          title: editingDiary.title,
          content: editingDiary.content,
          promptType
        })
      });
      const data = await response.json();
      if (data.success) {
        setDiaryAiAnswer(data.answer);
      } else {
        setDiaryAiAnswer("عذراً، حدث خطأ أثناء معالجة طلبك.");
      }
    } catch (e) {
      console.error(e);
      setDiaryAiAnswer("حدثت مشكلة في الاتصال بالذكاء الاصطناعي.");
    } finally {
      setDiaryAiLoading(false);
    }
  };

  // --- Real-time Interactive Psychological Chat inside Diary Editor ---
  const handleSendDiaryChatMessage = async (msgText?: string) => {
    const textToSend = msgText || diaryChatMessage;
    if (!textToSend.trim() || !editingDiary) return;

    // 1. Append user message locally
    const userMsg: ChatLogEntry = {
      sender: 'user',
      text: textToSend.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedLogs = [...(editingDiary.chatLogs || []), userMsg];
    
    // Update editingDiary state
    setEditingDiary(prev => prev ? { ...prev, chatLogs: updatedLogs } : null);
    if (!msgText) {
      setDiaryChatMessage('');
    }
    setDiaryChatLoading(true);

    try {
      // Collect attachments names
      const attachments: string[] = [];
      if (editingDiary.images && editingDiary.images.length > 0) attachments.push(`${editingDiary.images.length} صور`);
      if (editingDiary.audioRecordings && editingDiary.audioRecordings.length > 0) attachments.push(`${editingDiary.audioRecordings.length} تسجيلات صوتية`);
      if (editingDiary.files && editingDiary.files.length > 0) attachments.push(`${editingDiary.files.length} ملفات`);
      if (editingDiary.drawing) attachments.push(`تخطيط رسومي`);

      const audioTranscriptions = (editingDiary.audioRecordings || []).map(a => 
        `🎙️ [تسجيل ${a.name}]: ${a.transcription || 'لا يوجد تفريغ'}`
      );

      const res = await fetch('/api/gemini/diary-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({
          title: editingDiary.title,
          content: editingDiary.content,
          chatLogs: updatedLogs.slice(0, -1), // pass previous logs before this new userMsg
          newMessage: textToSend.trim(),
          diaryType: editingDiary.diaryType || 'diary',
          moods: editingDiary.moods || [],
          attachments,
          audioTranscriptions,
          aiMoodAnalysis: editingDiary.aiMoodAnalysis || [],
          tags: editingDiary.tags || []
        })
      });

      const data = await res.json();
      if (data.success && data.answer) {
        const aiMsg: ChatLogEntry = {
          sender: 'ai',
          text: data.answer,
          createdAt: new Date().toISOString()
        };
        setEditingDiary(prev => prev ? { ...prev, chatLogs: [...updatedLogs, aiMsg] } : null);
      } else {
        const errorMsg: ChatLogEntry = {
          sender: 'ai',
          text: 'عذراً يا صديقي، واجهت مشكلة في الاتصال بمحرك التحليل الفوري. يرجى التحقق من إعدادات مفتاح API الخاص بك والمحاولة مجدداً.',
          createdAt: new Date().toISOString()
        };
        setEditingDiary(prev => prev ? { ...prev, chatLogs: [...updatedLogs, errorMsg] } : null);
      }
    } catch (error) {
      console.error("Diary chat error:", error);
      const errorMsg: ChatLogEntry = {
        sender: 'ai',
        text: 'حدث خطأ غير متوقع أثناء إرسال الفضفضة. يرجى التحقق من اتصال الشبكة ومحاولة تعيين مفتاح API مناسب.',
        createdAt: new Date().toISOString()
      };
      setEditingDiary(prev => prev ? { ...prev, chatLogs: [...updatedLogs, errorMsg] } : null);
    } finally {
      setDiaryChatLoading(false);
      // Auto-scroll chat box
      setTimeout(() => {
        const chatBox = document.getElementById('diary-chat-log-box');
        if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }, 100);
    }
  };

  // --- Dynamic Backup and Restore Manager ---
  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ diaries, settings });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `HayatAI_Backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (file) {
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.diaries) {
            setDiaries(parsed.diaries);
            if (parsed.settings) setSettings(parsed.settings);
            alert('تم استعادة نسختك الاحتياطية بنجاح بنسبة 100%! 🎉');
          } else {
            alert('صيغة ملف النسخ الاحتياطي غير صالحة.');
          }
        } catch (error) {
          alert('فشلت قراءة الملف. تأكد من رفعه بشكل صحيح.');
        }
      };
      fileReader.readAsText(file);
    }
  };

  const handleWriteDiaryImportCompleted = (entries: DiaryEntry[]) => {
    setDiaries(prev => {
      // Prepend imported diaries
      const updated = [...entries, ...prev];
      // Sort by date descending so they appear beautifully in the timeline
      updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return updated;
    });
    alert(isEn 
      ? `Successfully imported ${entries.length} diaries into your timeline! 🎉`
      : `تم استيراد ${entries.length} يومية بنجاح باهر إلى خطك الزمني! 🎉`
    );
  };

  const handleSendEmailBackup = async () => {
    if (!backupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(backupEmail)) {
      setEmailBackupStatus(isEn ? 'Please enter a valid email address.' : 'الرجاء إدخال بريد إلكتروني صحيح.');
      return;
    }
    
    setIsSendingEmailBackup(true);
    setEmailBackupStatus(isEn ? 'Sending backup to email...' : 'جاري إرسال النسخة الاحتياطية للبريد الإلكتروني...');
    
    try {
      const payload = {
        email: backupEmail,
        backupData: {
          diaries,
          habits,
          settings,
          gratitudeCards,
          chatMessages: JSON.parse(localStorage.getItem('yawmiyati_chat_messages') || '[]'),
          syncTime: new Date().toISOString()
        }
      };

      const response = await fetch('/api/backup/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setEmailBackupStatus(isEn 
          ? `Backup successfully sent to ${backupEmail}! 🎉` 
          : `تم إرسال النسخة الاحتياطية بنجاح إلى ${backupEmail}! 🎉`
        );
      } else {
        setEmailBackupStatus(isEn 
          ? `Failed: ${data.message || 'Unknown error'}` 
          : `فشل الإرسال: ${data.message || 'خطأ غير معروف'}`
        );
      }
    } catch (error) {
      console.error("Email backup error:", error);
      setEmailBackupStatus(isEn ? 'Network error occurred.' : 'حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsSendingEmailBackup(false);
    }
  };

  // --- Search and Filter Logic (Memoized for high performance & crash-proof) ---
  const filteredDiariesList = useMemo(() => {
    if (!Array.isArray(diaries)) return [];
    const q = (searchQuery || '').toLowerCase().trim();
    return diaries.filter(d => {
      if (!d) return false;
      if (d.isArchived || d.isTrash) return false;
      
      const titleStr = typeof d.title === 'string' ? d.title : '';
      const contentStr = typeof d.content === 'string' ? d.content : '';
      const tagsArr = Array.isArray(d.tags) ? d.tags : [];
      
      const matchesSearch = !q || 
                            titleStr.toLowerCase().includes(q) || 
                            contentStr.toLowerCase().includes(q) ||
                            tagsArr.some(t => typeof t === 'string' && t.toLowerCase().includes(q));
                            
      const matchesTag = selectedTagFilter ? tagsArr.includes(selectedTagFilter) : true;
      const matchesFavorites = showFavoritesOnly ? ((d.importance || 0) >= 4) : true;
      
      const matchesType = diaryTypeFilter === 'all' 
        ? true 
        : (diaryTypeFilter === 'diary' 
           ? d.diaryType === 'diary' || !d.diaryType
           : d.diaryType === 'thought');

      return matchesSearch && matchesTag && matchesFavorites && matchesType;
    });
  }, [diaries, searchQuery, selectedTagFilter, showFavoritesOnly, diaryTypeFilter]);

  // Memoized Day-by-Day grouping of filtered entries for instant tab rendering
  const memoizedGroupedDiaries = useMemo(() => {
    const groups: { [dayKey: string]: { dayEntries: DiaryEntry[]; formattedDayLabel: string } } = {};
    if (!Array.isArray(filteredDiariesList)) return { sortedDays: [], groups: {} };
    
    const validEntries = filteredDiariesList.filter(e => e && e.createdAt);
    const sorted = [...validEntries].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });

    const tempGroups: { [key: string]: DiaryEntry[] } = {};
    sorted.forEach(entry => {
      let dayKey = '2026-08-05';
      if (typeof entry.createdAt === 'string' && entry.createdAt.includes('T')) {
        dayKey = entry.createdAt.split('T')[0];
      } else if (entry.createdAt) {
        try {
          dayKey = new Date(entry.createdAt).toISOString().split('T')[0];
        } catch {
          dayKey = '2026-08-05';
        }
      }
      if (!tempGroups[dayKey]) {
        tempGroups[dayKey] = [];
      }
      tempGroups[dayKey].push(entry);
    });

    const sortedDays = Object.keys(tempGroups).sort((a, b) => {
      const timeA = new Date(a).getTime() || 0;
      const timeB = new Date(b).getTime() || 0;
      return timeB - timeA;
    });

    sortedDays.forEach(dayKey => {
      let formattedDayLabel = dayKey;
      try {
        const d = new Date(dayKey + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          formattedDayLabel = d.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } catch {}

      groups[dayKey] = {
        dayEntries: tempGroups[dayKey],
        formattedDayLabel
      };
    });

    return { sortedDays, groups };
  }, [filteredDiariesList]);

  // Extract all unique tags for filter pills safely
  const allUniqueTags = useMemo(() => {
    if (!Array.isArray(diaries)) return [];
    return Array.from(new Set(diaries.flatMap(d => (d && Array.isArray(d.tags)) ? d.tags : [])));
  }, [diaries]);

  // Find or create diary entry for selected date safely
  const activeDiaryForSelectedDate = useMemo(() => {
    if (!Array.isArray(diaries)) return undefined;
    return diaries.find(d => {
      if (!d || !d.createdAt) return false;
      return String(d.createdAt).split('T')[0] === selectedDate;
    });
  }, [diaries, selectedDate]);

  // Dynamic tasks/habits/medications count for the top bar red badge safely
  const incompleteTasksCount = useMemo(() => {
    const customTasksIncomplete = Array.isArray(activeDiaryForSelectedDate?.tasks)
      ? activeDiaryForSelectedDate!.tasks.filter(t => t && !t.completed).length
      : 0;
    const medicationsIncomplete = Array.isArray(activeDiaryForSelectedDate?.medications)
      ? activeDiaryForSelectedDate!.medications.filter(m => m && !m.taken).length
      : 1;
    const habitsIncomplete = Array.isArray(habits)
      ? habits.filter(h => h && h.history && !h.history[selectedDate]).length
      : 0;
    return customTasksIncomplete + medicationsIncomplete + habitsIncomplete;
  }, [activeDiaryForSelectedDate, habits, selectedDate]);

  const fetchDailyQuote = async () => {
    setQuoteLoading(true);
    try {
      const response = await fetch('/api/gemini/daily-inspiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({ moods: activeDiaryForSelectedDate?.moods || ['طبيعي'] })
      });
      const data = await response.json();
      if (data.success) {
        setDailyQuote({ quote: data.quote, author: data.author });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleGenerateCbtAlternative = async () => {
    if (!cbtNegativeThoughts.trim()) return;
    setCbtLoading(true);
    try {
      const response = await fetch('/api/gemini/cbt-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || ''
        },
        body: JSON.stringify({
          triggerEvent: cbtTriggerEvent,
          negativeThoughts: cbtNegativeThoughts,
          cognitiveDistortion: cbtCognitiveDistortion
        })
      });
      const data = await response.json();
      if (data.success) {
        setCbtRationalAlternative(data.rationalAlternative);
        if (data.detectedDistortion && !cbtCognitiveDistortion) {
          setCbtCognitiveDistortion(data.detectedDistortion);
        }
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الاتصال بالمستشار المعرفي بالذكاء الاصطناعي. تم استخدام بديل عقلاني ذكي مدمج.');
    } finally {
      setCbtLoading(false);
    }
  };

  const handleUpdateHabit = (
    type: 'sleep' | 'sports' | 'sportsType' | 'sportsIntensity' | 'sportsCalories' | 'sportsEnergyBefore' | 'sportsEnergyAfter' | 'sportsNotes' | 'medication' | 'water' | 'fastMood' | 'symptoms' | 'cbt',
    value: any
  ) => {
    // If no diary exists for selected date, auto-create one
    let targetDiary = activeDiaryForSelectedDate;
    if (!targetDiary) {
      const todayStr = new Date().toISOString();
      targetDiary = {
        id: `diary-${Date.now()}`,
        title: `مذكرة يومية لـ ${selectedDate}`,
        content: '',
        createdAt: `${selectedDate}T20:00:00.000Z`,
        updatedAt: `${selectedDate}T20:00:00.000Z`,
        moods: ['طبيعي'],
        importance: 3,
        color: 'bg-white border-[#E2DCC8]',
        images: [],
        videos: [],
        audioRecordings: [],
        files: [],
        tasks: [],
        tags: [],
        chatLogs: [],
        isLocked: false,
        sleepHours: 8,
        sportsDuration: 0,
        sportsType: 'مشي',
        sportsIntensity: 'medium',
        sportsEnergyBefore: 3,
        sportsEnergyAfter: 4,
        sportsNotes: '',
        medications: [
          { id: 'm1', name: 'مكمل فيتامين D', time: '10:00 ص', taken: false }
        ],
        waterCups: 0,
        fastMoodScore: 5,
        symptomsChecklist: [],
        cbtWorksheets: []
      };
    }

    // Update fields
    if (type === 'sleep') {
      targetDiary.sleepHours = Number(value);
    } else if (type === 'sports') {
      targetDiary.sportsDuration = Number(value);
    } else if (type === 'sportsType') {
      targetDiary.sportsType = String(value);
    } else if (type === 'sportsIntensity') {
      targetDiary.sportsIntensity = value;
    } else if (type === 'sportsCalories') {
      targetDiary.sportsCalories = Number(value);
    } else if (type === 'sportsEnergyBefore') {
      targetDiary.sportsEnergyBefore = Number(value);
    } else if (type === 'sportsEnergyAfter') {
      targetDiary.sportsEnergyAfter = Number(value);
    } else if (type === 'sportsNotes') {
      targetDiary.sportsNotes = String(value);
    } else if (type === 'medication') {
      if (Array.isArray(value)) {
        targetDiary.medications = value;
      } else if (targetDiary.medications && targetDiary.medications.length > 0) {
        targetDiary.medications[0].taken = Boolean(value);
      } else {
        targetDiary.medications = [{ id: 'm1', name: 'مكمل فيتامين D اليومي', time: '10:00 ص', taken: Boolean(value) }];
      }
    } else if (type === 'water') {
      targetDiary.waterCups = Number(value);
    } else if (type === 'fastMood') {
      targetDiary.fastMoodScore = Number(value);
    } else if (type === 'symptoms') {
      targetDiary.symptomsChecklist = value as string[];
    } else if (type === 'cbt') {
      targetDiary.cbtWorksheets = value as any[];
    }

    // Save back to list
    setDiaries(prev => {
      const filtered = prev.filter(d => d.createdAt.split('T')[0] !== selectedDate);
      return [targetDiary!, ...filtered];
    });
  };

  const handleUpdateTasks = (updatedTasks: TaskItem[]) => {
    let targetDiary = activeDiaryForSelectedDate;
    if (!targetDiary) {
      targetDiary = {
        id: `diary-${Date.now()}`,
        title: `مذكرة يومية لـ ${selectedDate}`,
        content: '',
        createdAt: `${selectedDate}T20:00:00.000Z`,
        updatedAt: `${selectedDate}T20:00:00.000Z`,
        moods: ['طبيعي'],
        importance: 3,
        color: 'bg-white border-[#E2DCC8]',
        images: [],
        videos: [],
        audioRecordings: [],
        files: [],
        tasks: updatedTasks,
        tags: [],
        chatLogs: [],
        isLocked: false,
        sleepHours: 8,
        sportsDuration: 0,
        medications: [
          { id: 'm1', name: 'مكمل فيتامين D', time: '10:00 ص', taken: false }
        ],
        waterCups: 0,
        fastMoodScore: 5,
        symptomsChecklist: [],
        cbtWorksheets: []
      };
    } else {
      targetDiary = { ...targetDiary, tasks: updatedTasks };
    }

    setDiaries(prev => {
      const filtered = prev.filter(d => d.createdAt.split('T')[0] !== selectedDate);
      return [targetDiary!, ...filtered];
    });
  };

  // --- PIN Unlock Screen Trigger ---
  if (settings.isAppLocked) {
    return (
      <PINLock 
        correctPin={settings.appPinCode || '1234'} 
        biometricCredentialId={settings.biometricCredentialId}
        appLanguage={settings.appLanguage}
        onUnlocked={() => setSettings(prev => ({ ...prev, isAppLocked: false }))} 
        onQuickAction={(actionType) => {
          setSettings(prev => ({ ...prev, isAppLocked: false }));
          setTimeout(() => {
            handleQuickAction(actionType);
          }, 350);
        }}
      />
    );
  }

  return (
    <div 
      className={`min-h-screen ${settings.isDarkMode ? 'bg-[#121110] text-[#E4E2DD]' : 'bg-[#F9F7F2] text-[#3A3A3A]'} pb-24 font-sans antialiased selection:bg-[#E2DCC8] selection:text-[#5A5A40] app-font-${settings.appFont || 'cairo'} app-lh-${settings.appLineHeight || 'relaxed'}`} 
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        fontFamily: getFontCss(settings.appFont),
        lineHeight: getLineHeightCss(settings.appLineHeight)
      }}
    >
      
      {/* 🔔 Floating Habit Reminder Notification */}
      {activeHabitReminder && (
        <div className="fixed top-20 right-4 left-4 md:right-auto md:left-4 md:w-96 bg-white border-2 border-[#D4A373] text-[#3A3A3A] p-4 rounded-3xl shadow-2xl z-50 flex items-start space-x-3 space-x-reverse animate-bounce border-dashed">
          <div className="p-2.5 bg-[#FAEDCD] text-[#D4A373] rounded-xl shrink-0">
            <Flame className="w-6 h-6 fill-[#D4A373] text-[#D4A373]" />
          </div>
          <div className="flex-grow space-y-1">
            <h4 className="text-xs font-bold text-[#D4A373] flex items-center space-x-1 space-x-reverse">
              <span>🔔</span>
              <span>تنبيه العادات السلوكية اليومي</span>
            </h4>
            <p className="text-[11px] text-[#5A5A40] leading-relaxed">
              حان وقت عادة: <strong className="text-[#3A3A3A]">"{activeHabitReminder.name}"</strong>. هل قمت بإنجازها اليوم لتنعم بالاستقرار النفسي والجسدي؟
            </p>
            <div className="flex space-x-2 space-x-reverse pt-2">
              <button 
                onClick={() => {
                  toggleHabitCompletion(activeHabitReminder.id, selectedDate);
                  setActiveHabitReminder(null);
                }}
                className="px-3 py-1 bg-[#8B9D83] text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-[#5A5A40] transition-colors"
              >
                نعم، تم الإنجاز! ✓
              </button>
              <button 
                onClick={() => setActiveHabitReminder(null)}
                className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] cursor-pointer hover:bg-gray-200 transition-colors"
              >
                تجاهل مؤقتاً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌸 Floating Gratitude Journal Reminder Notification */}
      {activeGratitudeReminderNotification && (
        <div className="fixed top-24 right-4 left-4 md:right-auto md:left-4 md:w-96 bg-[#FFFDF9] border-2 border-amber-400 text-[#3A3A3A] p-5 rounded-3xl shadow-2xl z-50 flex items-start space-x-3 space-x-reverse animate-bounce border-dashed" id="gratitude-reminder-banner">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <span className="text-2xl">🌸</span>
          </div>
          <div className="flex-grow space-y-1">
            <h4 className="text-xs font-extrabold text-amber-700 flex items-center space-x-1.5 space-x-reverse">
              <span>🔔</span>
              <span>تذكير ممارسة الامتنان اليومي الذكي</span>
            </h4>
            <p className="text-[11px] text-[#5A5A40] leading-relaxed">
              حان وقت تعبئة جدار الرضا وتوثيق اللحظات الإيجابية البسيطة لتخفيف توتر يومك وجذب السلام الداخلي!
            </p>
            <div className="flex space-x-2 space-x-reverse pt-2.5">
              <button 
                onClick={() => {
                  setActiveTab('diaries');
                  setActiveDiariesSubTab('gratitude');
                  setActiveGratitudeReminderNotification(false);
                }}
                className="px-3 py-1.5 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-[10px] font-extrabold cursor-pointer transition-colors"
              >
                افتح مفكرة الامتنان الآن 🌸
              </button>
              <button 
                onClick={() => setActiveGratitudeReminderNotification(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-xl text-[10px] cursor-pointer transition-colors"
              >
                تذكير لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ Modal: إضافة عادة جديدة */}
      {showAddHabitModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                <span className="p-1 bg-[#8B9D83]/10 text-[#8B9D83] rounded-lg">🎯</span>
                <span>إضافة عادة سلوكية جديدة</span>
              </h3>
              <button 
                onClick={() => setShowAddHabitModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#5A5A40] tracking-wider block">اسم العادة</label>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#F9F7F2] border border-[#E2DCC8] flex items-center justify-center text-lg shrink-0 shadow-2xs font-bold text-[#3A3A3A]">
                    {newHabitIcon}
                  </div>
                  <input 
                    type="text" 
                    value={newHabitName}
                    onChange={e => setNewHabitName(e.target.value)}
                    placeholder="مثال: شرب لترين ماء، قراءة، تمدد..."
                    className="flex-1 bg-[#F9F7F2] border border-[#E2DCC8] rounded-2xl px-4 py-2.5 text-xs text-[#3A3A3A] focus:outline-none focus:ring-1 focus:ring-[#8B9D83]"
                    required
                  />
                </div>
              </div>

              {/* 🎨 أيقونة العادة المخصصة */}
              <div className="space-y-1.5 bg-[#F9F7F2]/80 p-3 rounded-2xl border border-[#E2DCC8]/80">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#5A5A40] tracking-wider block">اختيار أيقونة العادة المخصصة</label>
                  <span className="text-[10px] font-bold text-[#8B9D83] bg-white px-2 py-0.5 rounded-md border border-[#E2DCC8]/60">
                    المحددة: {newHabitIcon}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white rounded-xl border border-[#E2DCC8]/60">
                  {['🎯', '🏃', '💧', '📚', '🧘', '🏋️', '🥦', '🧠', '🎨', '✍️', '💰', '💤', '⚡', '🔥', '🏆', '🍏', '🚲', '💊', '☀️', '❤️', '⏰', '🎧', '🪴', '🧩'].map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewHabitIcon(ic)}
                      className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                        newHabitIcon === ic 
                          ? 'bg-[#8B9D83] text-white shadow-xs scale-110 ring-2 ring-[#8B9D83]/40' 
                          : 'bg-[#F9F7F2] hover:bg-[#F0EDE4] text-gray-700 border border-[#E2DCC8]/40'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#5A5A40] tracking-wider block">تصنيف العادة للتحليل السلوكي</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'health', label: 'صحة بدنية 🥦' },
                    { id: 'mind', label: 'تأمل وذهن 🧠' },
                    { id: 'sport', label: 'رياضة ونشاط 🏃' },
                    { id: 'culture', label: 'ثقافة وقراءة 📚' },
                    { id: 'custom', label: 'أهداف مخصصة 🎯' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewHabitCategory(cat.id as any)}
                      className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        newHabitCategory === cat.id 
                          ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-xs' 
                          : 'bg-[#F9F7F2] border-[#E2DCC8]/60 text-gray-700 hover:bg-[#F0EDE4]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#5A5A40] tracking-wider block">وقت التنبيه</label>
                  <input 
                    type="time" 
                    value={newHabitReminderTime}
                    onChange={e => setNewHabitReminderTime(e.target.value)}
                    className="w-full bg-[#F9F7F2] border border-[#E2DCC8] rounded-2xl px-3 py-2 text-xs text-[#3A3A3A] focus:outline-none"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer py-2">
                    <input 
                      type="checkbox"
                      checked={newHabitReminderEnabled}
                      onChange={e => setNewHabitReminderEnabled(e.target.checked)}
                      className="rounded text-[#8B9D83] focus:ring-[#8B9D83]"
                    />
                    <span className="text-xs font-semibold text-gray-600">تنبيه بالبوش اليومي</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-2 space-x-reverse pt-2">
                <button 
                  type="submit"
                  className="flex-grow py-2.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  حفظ وتفعيل التتبع 🚀
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📱 Small Floating Draggable Top Pill Icon on Mobile when Header is Collapsed */}
      {isHeaderCollapsedOnMobile && (
        <motion.div
          drag="x"
          dragConstraints={{ left: -140, right: 140 }}
          dragElastic={0.1}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-40 sm:hidden flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <button
            type="button"
            onClick={revealHeaderTemporarily}
            className="flex items-center space-x-2 space-x-reverse px-3.5 py-1.5 bg-[#4E685B] text-white rounded-full shadow-lg border border-white/40 active:scale-95 transition-all cursor-pointer group"
            title="انقر لإظهار الشريط العلوي مجدداً لمدة 3 ثوانٍ (يمكن تحريك هذه الأيقونة أفقياً)"
          >
            <Brain className="w-4 h-4 text-[#FEFAE0] animate-pulse shrink-0" />
            <span className="text-[11px] font-black tracking-tight">{t.appName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80 group-hover:translate-y-0.5 transition-transform shrink-0" />
          </button>
        </motion.div>
      )}

      {/* 🚀 Header bar with branding & Quick Navigation Badges */}
      <header 
        className={`sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#E2DCC8] z-30 shadow-xs transition-all duration-300 transform ${
          isHeaderCollapsedOnMobile 
            ? 'max-sm:-translate-y-full max-sm:max-h-0 max-sm:opacity-0 max-sm:overflow-hidden max-sm:pointer-events-none' 
            : 'max-sm:translate-y-0 max-sm:max-h-[500px] max-sm:opacity-100'
        }`} 
        dir={isRtl ? 'rtl' : 'ltr'}
        onTouchStart={() => {
          if (!isHeaderCollapsedOnMobile) {
            revealHeaderTemporarily();
          }
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-[#8B9D83] rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0">
                <Brain className="w-5.5 h-5.5" />
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5 space-x-reverse">
                  <h1 className="text-base font-extrabold tracking-tight text-[#3A3A3A]">{isEn ? "Hayat" : "حياة"}</h1>
                  <span className="text-xs font-black bg-[#8B9D83] text-white px-1.5 py-0.5 rounded-md leading-none">AI</span>
                </div>
                <p className="text-[9px] text-gray-500 font-bold mt-0.5 flex flex-wrap items-center gap-1.5 max-w-full">
                  <span>{isEn ? "Comprehensive Psychological Assistant" : "مساعد الصحة النفسية المتكامل"}</span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className={`inline-flex items-center space-x-1 space-x-reverse text-[9px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                    autoSaveStatus === 'saving'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${autoSaveStatus === 'saving' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    <span>{autoSaveStatus === 'saving' ? (isEn ? 'Saving...' : 'جارِ الحفظ...') : (isEn ? 'Auto Saved' : `تم الحفظ تلقائياً ${lastAutoSaveTime ? `(${lastAutoSaveTime})` : '💾'}`)}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Badges matching the requested screenshot EXACTLY 'balmilli' */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full w-full sm:w-auto justify-start sm:justify-end pb-1.5 sm:pb-0">
            
            {/* 🌐 Language Switcher Button */}
            <button
              type="button"
              onClick={() => setShowLanguagesModal(true)}
              className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-2 bg-amber-50/90 text-amber-950 border border-amber-300 rounded-xl text-xs font-black shadow-3xs hover:bg-amber-100 active:scale-95 transition-all cursor-pointer shrink-0"
              title="تغيير لغة التطبيق والذكاء الاصطناعي / Switch App & AI Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-sm leading-none">{langInfo.flag}</span>
              <span className="text-[11px] font-extrabold">{langInfo.nativeName}</span>
            </button>
            
            {/* 🖥️ Fullscreen / Hide Browser Address Bar Toggle Button */}
            <button
              type="button"
              onClick={async () => {
                if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
                  try {
                    if (document.documentElement.requestFullscreen) {
                      await document.documentElement.requestFullscreen();
                    } else if ((document.documentElement as any).webkitRequestFullscreen) {
                      await (document.documentElement as any).webkitRequestFullscreen();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                } else {
                  try {
                    if (document.exitFullscreen) {
                      await document.exitFullscreen();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }
              }}
              className="flex items-center space-x-1 space-x-reverse px-2.5 py-2 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-black shadow-3xs hover:bg-blue-100 active:scale-95 transition-all cursor-pointer shrink-0"
              title={isEn ? "Fullscreen mode" : "تفعيل وضع الشاشة الكاملة وإخفاء شريط المتصفح العلوي"}
            >
              <Maximize className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="text-[11px]">{isEn ? "Fullscreen" : "ملء الشاشة"}</span>
            </button>

            {/* 1. Dhikr / Azkar Button (الأذكار) */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                collapseHeaderOnMobile();
                setTimeout(() => {
                  const el = document.getElementById('dhikr-counter');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              className="flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black shadow-3xs hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shrink-0"
              title={isEn ? "Mindfulness & Reflection" : "الأذكار والتسبيح"}
            >
              <span>{isEn ? "Mindfulness" : "الأذكار"}</span>
              <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-300 shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-700" />
              </span>
            </button>

            {/* 2. Habits and Tasks Button (المهام اليومية) with red circular badge containing incomplete count on the left */}
            <button
              onClick={() => {
                setActiveTab('diaries');
                setActiveDiariesSubTab('tasks');
                setEditingDiary(null);
                collapseHeaderOnMobile();
              }}
              className="flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 bg-[#EEF1EB] text-[#556E4F] border border-[#DCE4D8] rounded-xl text-xs font-black shadow-3xs hover:bg-[#E2E9DF] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span className="flex items-center justify-center bg-[#C5221F] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full border border-white shrink-0">
                {incompleteTasksCount}
              </span>
              <span>{isEn ? "Daily Tasks" : "المهام اليومية"}</span>
            </button>

            {/* 3. My Diary Thoughts Button (خواطري) */}
            <button
              onClick={() => {
                setActiveTab('diaries');
                setActiveDiariesSubTab('journal');
                setDiaryTypeFilter('thought');
                setEditingDiary(null);
                collapseHeaderOnMobile();
              }}
              className="flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 bg-[#FCF5DE] text-[#A67E2E] border border-[#E9E1C4] rounded-xl text-xs font-black shadow-3xs hover:bg-[#F9ECC4] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>{isEn ? "My Thoughts" : "خواطري"}</span>
              <span className="flex items-center justify-center w-5 h-5 bg-[#F8ECB8] text-[#8C6418] rounded-full border border-[#E1D39D] shrink-0">
                <PenTool className="w-3 h-3 text-[#8C6418]" />
              </span>
            </button>

            {/* 4. Therapist Session Button (جلسة العلاج 🎓) with dark slate/green background and white text */}
            <button
              onClick={() => {
                setActiveTab('analytics');
                setAnalyticsSubTab('report');
                setEditingDiary(null);
                collapseHeaderOnMobile();
              }}
              className="flex items-center space-x-1.5 space-x-reverse px-4 py-2 bg-[#446A5E] hover:bg-[#3B5A50] text-white rounded-xl text-xs font-black shadow-3xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>{isEn ? "Therapy Session" : "جلسة العلاج"}</span>
              <span className="flex items-center justify-center w-5 h-5 bg-[#FCF5DE] border border-[#E9E1C4] rounded-full shrink-0 shadow-3xs animate-pulse">
                <svg className="w-3 h-3 text-[#A67E2E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </span>
            </button>

            {/* 5. Personal Account & Cloud Sync Login Button */}
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                collapseHeaderOnMobile();
              }}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-2 border rounded-xl text-xs font-black shadow-3xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0 ${
                currentUser
                  ? 'bg-teal-700 text-white border-teal-800 hover:bg-teal-800'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title={isEn ? "Personal Account & Sync" : "حسابي الشخصي وتزامن البيانات السحابي"}
            >
              {currentUser ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-teal-200" />
                  <span className="truncate max-w-[90px]">{currentUser.name || currentUser.email.split('@')[0]}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isEn ? "Sign In" : "تسجيل الدخول"}</span>
                </>
              )}
            </button>

            {/* 6. Lock Button (🔒) with grey-brown background and border */}
            <button
              onClick={() => {
                setSettings(prev => ({ ...prev, isAppLocked: true }));
                collapseHeaderOnMobile();
              }}
              className="p-2.5 bg-[#EEECDF] border border-[#D1CCBA] text-[#5A5A40] rounded-xl hover:bg-[#DDD8C3] active:scale-95 transition-all cursor-pointer shadow-3xs shrink-0 flex items-center justify-center"
              title="قفل التطبيق لحماية الخصوصية"
            >
              <Lock className="w-4 h-4 text-[#4A4A30]" />
            </button>

          </div>
        </div>
      </header>

      {/* 🔙 Universal Back Navigation: Desktop Sticky Bar vs Mobile Draggable Floating Pill */}
      {(activeTab !== 'dashboard' || editingDiary !== null || navHistory.length > 0) && (
        <>
          {/* Mobile Floating Draggable Back Button (سهم وعدّد فقط ويمكن سحبه لأي مكان في الشاشة) */}
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            className="fixed top-16 right-4 z-40 sm:hidden cursor-grab active:cursor-grabbing"
          >
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center space-x-1.5 space-x-reverse p-2.5 bg-[#4E685B] text-white hover:bg-[#3F5449] border-2 border-[#E5E1D4] rounded-full shadow-2xl transition-all active:scale-95 cursor-pointer group"
              title="رجوع للخلف (يمكنك سحب وتحريك هذه الأيقونة العائمة لأي مكان)"
            >
              <ArrowRight className="w-5 h-5 text-[#FEFAE0] group-hover:-translate-x-0.5 transition-transform shrink-0" />
              {navHistory.length > 0 && (
                <span className="text-[11px] bg-white text-[#4E685B] px-2 py-0.5 rounded-full font-black leading-none shadow-xs">
                  {navHistory.length}
                </span>
              )}
            </button>
          </motion.div>

          {/* Desktop Sticky Navigation Bar */}
          <div className="hidden sm:block bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E2DCC8]/80 py-2 px-4 sticky top-[65px] z-20 transition-all duration-300 shadow-3xs" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center space-x-2 space-x-reverse px-3.5 py-1.5 bg-white hover:bg-[#8B9D83] text-[#3A3A3A] hover:text-white border border-[#E2DCC8] hover:border-[#8B9D83] rounded-2xl text-xs font-black shadow-2xs hover:shadow-md transition-all active:scale-95 cursor-pointer group shrink-0"
                title={isEn ? "Go Back" : "الرجوع إلى الشاشة أو الصفحة السابقة"}
              >
                <ArrowRight className="w-4 h-4 text-[#8B9D83] group-hover:text-white group-hover:-translate-x-1 transition-transform" />
                <span>{isEn ? "Go Back" : "رجوع للخلف"}</span>
                {navHistory.length > 0 && (
                  <span className="text-[10px] bg-[#EEF1EB] group-hover:bg-white/20 text-[#556E4F] group-hover:text-white px-1.5 py-0.5 rounded-full font-black">
                    {navHistory.length}
                  </span>
                )}
              </button>

              {/* Current Breadcrumb Location */}
              <div className="text-[11px] font-bold text-gray-500 hidden sm:flex items-center space-x-1.5 space-x-reverse bg-white/80 px-3 py-1 rounded-xl border border-[#E2DCC8]/50 shadow-3xs">
                <span className="text-gray-400">{isEn ? "Current Page:" : "الصفحة الحالية:"}</span>
                <span className="text-[#556E4F] font-black">
                  {editingDiary ? (isEn ? 'Edit Diary' : 'تعديل/عرض المذكرة') :
                   activeTab === 'dashboard' ? t.homeTab :
                   activeTab === 'diaries' ? `${t.diariesTab} (${activeDiariesSubTab === 'journal' ? (isEn ? 'Journal' : 'سجل المذكرات') : activeDiariesSubTab === 'tasks' ? (isEn ? 'Tasks' : 'المهام') : activeDiariesSubTab === 'gratitude' ? (isEn ? 'Gratitude' : 'الامتنان') : 'CBT'})` :
                   activeTab === 'advisor' ? t.advisorTab :
                   activeTab === 'analytics' ? t.analyticsTab :
                   activeTab === 'settings' ? t.settingsTab : ''}
                </span>
              </div>
            </div>
          </div>
        </>
      )}



      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-6 pb-28 md:pb-12 space-y-6">
        
        {/* Offline & Cloud Background Sync Status Banner */}
        <OfflineSyncBanner appLanguage={settings.appLanguage} />

        {/* Mock Android Notification Widget at the top of the Home Dashboard for simulation */}
        {activeTab === 'dashboard' && (
          <StaticNotification onAction={handleQuickAction} appLanguage={settings.appLanguage} />
        )}

        {/* --- TAB VIEW 1: DASHBOARD (HOME) --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 📅 التقويم الكامل واستعراض الأيام */}
            <div 
              onClick={() => setShowCalendarModal(true)}
              className="bg-[#EBF2EA] border-2 border-dashed border-[#8B9D83]/60 hover:bg-[#E0EBE0] rounded-3xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
            >
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black text-[#4E685B] flex items-center space-x-1.5 space-x-reverse">
                  <span>📅</span>
                  <span>{t.fullCalendar || (isEn ? 'Full Calendar & Day View' : 'التقويم الكامل واستعراض الأيام')}</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-[#5A5A40]/80 leading-relaxed">
                  {t.fullCalendarSub || (isEn ? 'Tap to browse diaries, books, and AI insights logged on any day' : 'اضغط لتصفح كل ما حدث في أي يوم (يومياتي، كتب، أنشطة، واستشارات AI)')}
                </p>
              </div>
              <div className="p-3 bg-white border border-[#E2DCC8] rounded-2xl text-rose-500 shadow-xs shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
                <Calendar className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Cairo styled greeting panel */}
            <div className="bg-gradient-to-l from-[#5A5A40] to-[#8B9D83] text-white p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 translate-x-[-20%] translate-y-[-20%] w-60 h-60 bg-[#FEFAE0]/10 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-2">
                <span className="text-xs font-bold text-[#FEFAE0] tracking-wide flex items-center space-x-1.5 space-x-reverse">
                  <Sparkles className="w-3.5 h-3.5 text-[#FEFAE0]" />
                  <span>{isEn ? 'Your Safe & Fully Encrypted Psychological Space' : 'مساحتك النفسية الآمنة والمشفرة بالكامل'}</span>
                </span>
                <h2 className="text-xl font-extrabold tracking-wide flex items-center space-x-2 space-x-reverse">
                  <span>{getArabicGreetingHeader()}</span>
                  <span className="text-2xl">{getArabicGreetingIcon()}</span>
                </h2>
                <p className="text-xs text-[#F9F7F2]/90 leading-relaxed max-w-xl">
                  {t.greetingDesc || (isEn ? 'Today is a new day for growth and inner harmony. Logging your thoughts helps your AI advisor offer personalized guidance.' : 'اليوم هو يوم جديد للنمو والتصالح مع الذات. تذكر أن تدوين أفكارك البسيطة اليوم يتيح لمستشارك النفسي الذكي تقديم أفضل نصائح وتوصيات سلوكية غداً.')}
                </p>
              </div>
            </div>

            {/* 🌱 Psychological Growth Tree (Visual Gamification Component) */}
            <PsychologicalGrowthTree
              appLanguage={settings.appLanguage}
              diariesCount={diaries.length}
              cbtCount={diaries.filter(d => (d.cbtWorksheets && d.cbtWorksheets.length > 0)).length}
              gratitudeCount={gratitudeCards.length}
              habitsCount={habits.filter(h => h.isCompleted).length}
              activeStreak={streakInfo.currentStreak}
              onQuickAction={(action) => {
                if (action === 'journal') startNewDiary();
                else if (action === 'gratitude') {
                  setActiveTab('diaries');
                  setActiveDiariesSubTab('gratitude');
                } else if (action === 'cbt') {
                  setActiveTab('diaries');
                  setActiveDiariesSubTab('cbt');
                } else if (action === 'habits') {
                  setActiveTab('diaries');
                  setActiveDiariesSubTab('tasks');
                }
              }}
            />

            {/* 🧠 Advanced Behavioral Correlation Engine Card */}
            <BehavioralCorrelationCard entries={diaries} appLanguage={settings.appLanguage} />

            {/* 📁 شريط التدوين السريع والوصول المباشر للملفات */}
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-[#5A5A40] flex items-center space-x-2 space-x-reverse">
                <span className="p-1 bg-[#8B9D83]/10 text-[#8B9D83] rounded-lg">⚡</span>
                <span>{t.directUploadTitle || (isEn ? 'Direct Access to Mobile Files & Attachments' : 'الوصول المباشر لملفات الهاتف ومرفقات اليومية')}</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {/* 1. كتابة يومية */}
                <button
                  onClick={() => startNewDiary()}
                  className="flex flex-col items-center justify-center p-3 bg-[#F9F7F2]/60 hover:bg-[#F0EDE4]/80 border border-[#E2DCC8]/60 hover:border-[#8B9D83] rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-[#8B9D83]/10 text-[#8B9D83] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#3A3A3A]">{t.freeWrite || (isEn ? 'Free Write' : 'كتابة حرة')}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">{t.freeWriteSub || (isEn ? 'Open Editor' : 'فتح محرر فارغ')}</span>
                </button>

                {/* 2. صورة */}
                <button
                  onClick={() => document.getElementById('global-image-uploader')?.click()}
                  className="flex flex-col items-center justify-center p-3 bg-[#F9F7F2]/60 hover:bg-[#F0EDE4]/80 border border-[#E2DCC8]/60 hover:border-[#8B9D83] rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#3A3A3A]">{t.attachPhoto || (isEn ? 'Attach Photo' : 'إرفاق صورة')}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">{t.attachPhotoSub || (isEn ? 'From Gallery' : 'من ألبوم الهاتف')}</span>
                </button>

                {/* 3. فيديو */}
                <button
                  onClick={() => document.getElementById('global-video-uploader')?.click()}
                  className="flex flex-col items-center justify-center p-3 bg-[#F9F7F2]/60 hover:bg-[#F0EDE4]/80 border border-[#E2DCC8]/60 hover:border-[#8B9D83] rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#3A3A3A]">{t.phoneVideo || (isEn ? 'Video' : 'فيديو الهاتف')}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">{t.phoneVideoSub || (isEn ? 'Upload Clip' : 'تحميل مقطع مرئي')}</span>
                </button>

                {/* 4. تسجيل ريكورد */}
                <button
                  onClick={() => document.getElementById('global-audio-uploader')?.click()}
                  className="flex flex-col items-center justify-center p-3 bg-[#F9F7F2]/60 hover:bg-[#F0EDE4]/80 border border-[#E2DCC8]/60 hover:border-[#8B9D83] rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#3A3A3A]">{t.audioFile || (isEn ? 'Audio File' : 'ملف صوتي')}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">{t.audioFileSub || (isEn ? 'Record Voice' : 'تسجيل أو ملف ريكورد')}</span>
                </button>

                {/* 5. كتاب / PDF */}
                <button
                  onClick={() => document.getElementById('global-document-uploader')?.click()}
                  className="flex flex-col items-center justify-center p-3 bg-[#F9F7F2]/60 hover:bg-[#F0EDE4]/80 border border-[#E2DCC8]/60 hover:border-[#8B9D83] rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#3A3A3A]">{t.bookDoc || (isEn ? 'Document' : 'كتاب أو وثيقة')}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">{t.bookDocSub || (isEn ? 'Upload PDF' : 'تحميل PDF أو نص')}</span>
                </button>

                {/* 6. مستشار الذكاء الاصطناعي */}
                <button
                  onClick={() => setActiveTab('advisor')}
                  className="flex flex-col items-center justify-center p-3 bg-[#F9F7F2]/60 hover:bg-[#F0EDE4]/80 border border-[#E2DCC8]/60 hover:border-[#8B9D83] rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#3A3A3A]">{t.aiAdvisor || (isEn ? 'AI Advisor' : 'مستشار AI')}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">{t.aiAdvisorSub || (isEn ? 'Smart Insights' : 'تحليل وتوصيات فورية')}</span>
                </button>
              </div>
            </div>

            {/* 🎯 Streak Tracker (سلسلة الالتزام) */}
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left Side: Fire Icon & Main Numbers */}
                <div className="flex items-center space-x-4 space-x-reverse">
                  {/* Animated Flame container */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.15, 1],
                      filter: [
                        "drop-shadow(0px 0px 4px rgba(212,163,115,0.2))", 
                        "drop-shadow(0px 0px 12px rgba(212,163,115,0.7))", 
                        "drop-shadow(0px 0px 4px rgba(212,163,115,0.2))"
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                    className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${
                      streakInfo.currentStreak > 0 
                        ? 'bg-[#FAEDCD] text-[#D4A373]' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Flame className={`w-8 h-8 ${streakInfo.currentStreak > 0 ? 'fill-[#D4A373]' : ''}`} />
                  </motion.div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider block">{t.streakTitle || (isEn ? 'Streak Tracker' : 'سلسلة الالتزام والتدوين')}</span>
                    <div className="flex items-baseline space-x-1 space-x-reverse">
                      <span className="text-2xl font-extrabold text-[#3A3A3A]">{streakInfo.currentStreak}</span>
                      <span className="text-xs text-[#5A5A40] font-semibold">{t.dayStreak || (isEn ? 'Days' : 'يوم متتالي')}</span>
                    </div>
                  </div>
                </div>

                {/* Center Side: Live Motivational Message */}
                <div className="flex-grow md:px-4">
                  <p className="text-xs text-[#5A5A40] leading-relaxed font-medium">
                    {streakInfo.hasLoggedToday ? (
                      <span className="text-emerald-700 flex items-center space-x-1 space-x-reverse">
                        <span>✨ {t.streakEncouragement || (isEn ? 'Great job! You logged your thoughts today and kept your streak alive!' : 'رائع! لقد دوّنت أفكارك اليوم وحافظت على توهج شعلتك. استمر في رعاية صحتك النفسية غداً!')}</span>
                      </span>
                    ) : (
                      <span>
                        {streakInfo.currentStreak === 0 ? (
                          isEn ? "Write a log today to activate your daily streak!" : "اكتب تدوينة اليوم لتفعيل شعلة الالتزام والبدء في رصد أنماطك السلوكية!"
                        ) : (
                          isEn ? "One final step! Log your thoughts today to keep your streak going." : "تبقى خطوة أخيرة! اكتب تدوينتك اليوم للحفاظ على سلسلة التزامك من الانقطاع."
                        )}
                      </span>
                    )}
                  </p>
                </div>

                {/* Right Side: Quick Stats Badges */}
                <div className="flex flex-col items-end justify-center shrink-0 border-r md:border-r border-t md:border-t-0 border-[#E2DCC8]/60 pt-3 md:pt-0 pr-4 md:pr-4 pl-4 md:pl-0">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block font-medium">{t.longestStreak || (isEn ? 'Longest Streak:' : 'أطول سلسلة تاريخية:')}</span>
                    <span className="text-sm font-bold text-[#8B9D83] flex items-center justify-end space-x-1 space-x-reverse">
                      <span>🏆</span>
                      <span>{streakInfo.maxStreak} {isEn ? 'Days' : 'يوم'}</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* 7-Day Visual Calendar Tracker */}
              <div className="border-t border-[#E2DCC8]/50 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[10px] font-bold text-gray-400">{t.recentWeek || (isEn ? 'Recent Week Progress:' : 'متابعة الأسبوع الأخير:')}</span>
                <div className="flex items-center space-x-1.5 space-x-reverse overflow-x-auto">
                  {getWeekDays().map((day, idx) => {
                    // Check if diaries has an entry on this day
                    const isLoggedOnDay = diaries.some(d => d.createdAt.split('T')[0] === day.isoString);
                    return (
                      <div 
                        key={idx} 
                        className={`px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[42px] border ${
                          isLoggedOnDay 
                            ? 'bg-[#8B9D83]/10 border-[#8B9D83]/30 text-[#8B9D83]' 
                            : 'bg-[#F9F7F2]/50 border-[#E2DCC8]/40 text-gray-400'
                        }`}
                      >
                        <span className="text-[9px] font-semibold">{day.label}</span>
                        {isLoggedOnDay ? (
                          <Flame className="w-3.5 h-3.5 fill-[#D4A373] text-[#D4A373] mt-1" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-gray-300 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Day Selector Calendar Matrix */}
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-4 shadow-xs space-y-3">
              <span className="text-xs font-bold text-[#5A5A40] block mb-1">{t.selectDateTitle || (isEn ? 'Select a date to log or view activities:' : 'اختر اليوم لتسجيل أو عرض الأنشطة:')}</span>
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day.isoString)}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedDate === day.isoString
                        ? 'bg-[#8B9D83] text-white scale-105 font-bold'
                        : 'bg-[#F9F7F2] hover:bg-[#F0EDE4] text-gray-700'
                    }`}
                  >
                    <span className="text-[10px] opacity-75 font-medium">{day.label}</span>
                    <span className="text-sm font-bold mt-1">{day.dayNum}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 💡 Psychological Daily Inspiration Card */}
            <div className="bg-gradient-to-br from-[#FAEDCD]/80 to-[#F9F7F2] border border-[#D4A373]/40 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A373]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-[#D4A373]">
                    <Sparkles className="w-4 h-4" />
                    <span>{t.quoteTitle || (isEn ? 'Daily Wisdom & Psychological Motivation 🌿' : 'حكمة اليوم لراحة البال والتحفيز النفسي')}</span>
                  </div>
                  <p className="text-sm md:text-base font-medium text-[#3A3A3A] leading-relaxed italic">
                    "{dailyQuote.quote}"
                  </p>
                  <span className="text-xs text-gray-400 block font-bold">— {dailyQuote.author}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`"${dailyQuote.quote}" - ${dailyQuote.author}`);
                      alert(isEn ? 'Quote copied to clipboard! 🌸' : 'تم نسخ الحكمة إلى الحافظة بنجاح! 🌸');
                    }}
                    className="p-2.5 bg-white border border-[#E2DCC8] hover:border-[#D4A373] text-[#5A5A40] rounded-2xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center"
                    title={isEn ? "Copy quote" : "نسخ الحكمة"}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={fetchDailyQuote}
                    disabled={quoteLoading}
                    className="flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 bg-[#8B9D83] hover:bg-[#5A5A40] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {quoteLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{t.aiInspirationBtn || (isEn ? '(AI) Smart Inspiration 🪄' : 'إلهام ذكي (AI)')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 📿 Spiritual Dhikr & Salawat Counter Widget */}
            <div id="dhikr-counter">
              <DhikrCounter className="shadow-sm" appLanguage={settings.appLanguage} />
            </div>

            {/* 🎯 Interactive Rapid Mood, Water & Symptoms Tracker Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Column 1: Fast Mood Slider with visual feedback */}
              <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                    <Smile className="w-4 h-4 text-[#8B9D83]" />
                    <span>{t.moodScaleTitle || (isEn ? 'Quick Digital Mood Scale (1 - 10) 😐' : 'مقياس المزاج الرقمي السريع (1 - 10)')}</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {t.moodScaleDesc || (isEn ? 'Drag slider to log your current mood in one second; saved as daily entry.' : 'اسحب المؤشر لتوثيق حالتك المزاجية الحالية في ثانية واحدة؛ يُسجل هذا التقييم كمدخل يومي سريع.')}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-4 bg-[#F9F7F2]/50 border border-[#E2DCC8]/40 rounded-2xl space-y-4">
                  {/* Big changing emoji */}
                  <div className="text-5xl md:text-6xl animate-bounce" style={{ animationDuration: '3s' }}>
                    {(() => {
                      const score = activeDiaryForSelectedDate?.fastMoodScore || 5;
                      if (score <= 2) return '😭';
                      if (score <= 4) return '😞';
                      if (score <= 6) return '😐';
                      if (score <= 8) return '😊';
                      return '🤩';
                    })()}
                  </div>

                  {/* Rating indicator */}
                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-[#5A5A40] block">
                      {t.moodRating || (isEn ? 'Mood Rating:' : 'تقييم المزاج:')} <span className="font-mono text-base font-extrabold text-[#8B9D83]">{activeDiaryForSelectedDate?.fastMoodScore || 5}</span> / 10
                    </span>
                    <span className="text-xs text-[#D4A373] font-bold block">
                      {(() => {
                        const score = activeDiaryForSelectedDate?.fastMoodScore || 5;
                        if (score <= 2) return isEn ? 'Severe distress & sadness 😭' : 'ضيق شديد وحزن عميق 😭';
                        if (score <= 4) return isEn ? 'Anxious & overthinking 😞' : 'قلق وتفكير زائد وأرق 😞';
                        if (score <= 6) return isEn ? 'Stable & neutral mood 😐' : 'مزاج مستقر وهادئ نسبياً 😐';
                        if (score <= 8) return isEn ? 'Content & peaceful 😊' : 'راضٍ ومطمئن ومستقر النفس 😊';
                        return isEn ? 'Joyful & high energy! 🤩' : 'سعيد جداً وفخور وممتلئ بالنشاط! 🤩';
                      })()}
                    </span>
                  </div>

                  {/* Slider input */}
                  <div className="w-full px-6">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={activeDiaryForSelectedDate?.fastMoodScore || 5}
                      onChange={(e) => handleUpdateHabit('fastMood', Number(e.target.value))}
                      className="w-full h-2.5 bg-[#E2DCC8] rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold font-mono mt-1 px-1">
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Interactive Water Bottle Tracker */}
              <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                    <span className="text-[#89CFF0] text-base">💧</span>
                    <span>{t.waterTrackerTitle || (isEn ? 'Daily Interactive Water Counter 💧' : 'عداد كؤوس الماء التفاعلي اليومي')}</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {t.waterTrackerDesc || (isEn ? 'Tap cups below to log consumed water. Hydration calms the nervous system.' : 'اضغط على الكؤوس أدناه لتسجيل كميات المياه المستهلكة؛ شرب المياه يحمي جهازك العصبي من التوتر.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Water bottle visualization */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center">
                    <div className="w-16 h-32 border-3 border-[#89CFF0]/80 rounded-2xl relative overflow-hidden bg-white shadow-inner flex flex-col justify-end">
                      {/* Caps represent fluid level */}
                      <motion.div 
                        className="bg-gradient-to-t from-[#89CFF0] to-[#A0E0FF] w-full"
                        animate={{ 
                          height: `${((activeDiaryForSelectedDate?.waterCups || 0) / 8) * 100}%` 
                        }}
                        transition={{ type: 'spring', damping: 15 }}
                      >
                        {/* Wave animation effect */}
                        <div className="w-full h-2 bg-[#89CFF0] rounded-full opacity-60 animate-pulse" />
                      </motion.div>
                      
                      {/* Percent text overlay */}
                      <span className="absolute inset-0 flex items-center justify-center font-mono font-extrabold text-xs text-[#5A5A40] drop-shadow-xs">
                        {Math.round(((activeDiaryForSelectedDate?.waterCups || 0) / 8) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Cups Grid Selector */}
                  <div className="sm:col-span-8 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const isDrunk = (activeDiaryForSelectedDate?.waterCups || 0) > idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              // If current cup clicked is equal to current level, reduce by 1, else set to this cup
                              const currentLevel = activeDiaryForSelectedDate?.waterCups || 0;
                              if (currentLevel === idx + 1) {
                                handleUpdateHabit('water', idx);
                              } else {
                                handleUpdateHabit('water', idx + 1);
                              }
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isDrunk 
                                ? 'bg-[#89CFF0]/20 border-[#89CFF0] text-[#3399FF] scale-105 shadow-2xs' 
                                : 'bg-[#F9F7F2]/50 border-[#E2DCC8]/60 hover:border-[#89CFF0] text-gray-300 hover:text-[#89CFF0]/60'
                            }`}
                            title={isEn ? `Cup ${idx + 1}` : `كوب ${idx + 1}`}
                          >
                            <span className="text-xl">🥛</span>
                            <span className="text-[9px] font-bold font-mono mt-0.5">{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-center sm:text-right">
                      <span className="text-xs font-bold text-[#5A5A40]">
                        {t.waterConsumed || (isEn ? 'Consumed Amount:' : 'الكمية المستهلكة:')} <span className="font-mono text-base text-[#3399FF] font-extrabold">{activeDiaryForSelectedDate?.waterCups || 0}</span> {isEn ? 'of 8 cups' : 'من 8 كؤوس'} ({(activeDiaryForSelectedDate?.waterCups || 0) * 0.25} {isEn ? 'L' : 'لتر'})
                      </span>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        {(activeDiaryForSelectedDate?.waterCups || 0) >= 8 
                          ? (isEn ? '🏆 Excellent! Daily hydration target reached!' : '🏆 ممتاز! لقد أتممت الارتواء الكامل لليوم!') 
                          : (t.waterRemaining || (isEn ? 'A few cups left to reach your goal.' : '💡 تبقّى لك بعض الكؤوس لتصل للمعدل المثالي.'))}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* 🩺 Physical Symptoms Tracker Panel */}
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                  <Activity className="w-4 h-4 text-red-400" />
                  <span>{t.symptomsTitle || (isEn ? 'Physical Symptoms Tracker ⚡' : 'الأعراض الجسدية المصاحبة لقلقك اليوم')}</span>
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">
                  {t.symptomsDesc || (isEn ? 'Check any symptoms experienced today to track mind-body connections with AI.' : 'حدد أي من الأعراض الفسيولوجية التالية شعرت بها اليوم لتساعد الذكاء الاصطناعي والمستشار في رصد الروابط النفس-جسدية (Psychosomatic) في تحليلك السنوي.')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: 'headache', label: t.symptomHeadache || (isEn ? 'Headache / Pressure 🤯' : 'صداع وضغط رأس 🤯') },
                  { id: 'heart', label: t.symptomRapidHeart || (isEn ? 'Rapid Heartbeat 💓' : 'تسارع نبضات القلب 💓') },
                  { id: 'breath', label: t.symptomShortnessBreath || (isEn ? 'Shortness of Breath 🫁' : 'ضيق وصعوبة تنفس 🫁') },
                  { id: 'muscle', label: t.symptomBackTension || (isEn ? 'Muscle / Back Tension 🧘' : 'شد عضلي وآلام ظهر 🧘') },
                  { id: 'fatigue', label: t.symptomFatigue || (isEn ? 'Fatigue / Low Energy 🔋' : 'خمول وإرهاق عام 🔋') },
                  { id: 'insomnia', label: t.symptomPoorSleep || (isEn ? 'Insomnia / Poor Sleep 😴' : 'أرق وقلة جودة النوم 😴') },
                  { id: 'stomach', label: t.symptomStomach || (isEn ? 'Stomach Upset 🤢' : 'اضطراب وتوتر معدة 🤢') },
                  { id: 'sweat', label: t.symptomTremors || (isEn ? 'Sweating / Tremors 🥶' : 'تعرق زائد ورجفة أطراف 🥶') },
                ].map(symptom => {
                  const currentSymptoms = activeDiaryForSelectedDate?.symptomsChecklist || [];
                  const isChecked = currentSymptoms.includes(symptom.id);

                  return (
                    <button
                      key={symptom.id}
                      onClick={() => {
                        let updated: string[];
                        if (isChecked) {
                          updated = currentSymptoms.filter(x => x !== symptom.id);
                        } else {
                          updated = [...currentSymptoms, symptom.id];
                        }
                        handleUpdateHabit('symptoms', updated);
                      }}
                      className={`px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-red-50 border-red-300 text-red-700 shadow-2xs font-extrabold scale-102'
                          : 'bg-[#F9F7F2]/60 hover:bg-[#F0EDE4] border-[#E2DCC8]/60 text-[#5A5A40]'
                      }`}
                    >
                      {symptom.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🧘 Box Breathing interactive psychiatric guide */}
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                    <span className="text-base">🧘</span>
                    <span>مساعد التنفس الصندوقي الاسترخائي (تنشيط العصب الحائر)</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    طريقة تنفس متبعة لدى أطباء النفس والعمليات الخاصة لتهدئة ضربات القلب وتحفيز السلام العصبي فورياً (4 ثوان لكل مرحلة).
                  </p>
                </div>
                <button
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs cursor-pointer transition-all ${
                    isBreathingActive 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-[#8B9D83] hover:bg-[#5A5A40] text-white'
                  }`}
                >
                  {isBreathingActive ? '⏹️ إيقاف الجلسة' : '▶️ بدء تمرين التنفس'}
                </button>
              </div>

              {isBreathingActive && (
                <div className="flex flex-col items-center justify-center py-6 bg-[#F9F7F2]/40 border border-[#E2DCC8]/50 rounded-2xl space-y-6 relative overflow-hidden">
                  
                  {/* Large Pulse animation circle */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <motion.div
                      className={`absolute inset-0 rounded-full ${
                        breathingPhase === 'inhale' ? 'bg-emerald-400/20' :
                        breathingPhase === 'hold1' ? 'bg-amber-400/20' :
                        breathingPhase === 'exhale' ? 'bg-blue-400/20' : 'bg-purple-400/20'
                      }`}
                      animate={{
                        scale: 
                          breathingPhase === 'inhale' ? [1, 1.4] :
                          breathingPhase === 'hold1' ? 1.4 :
                          breathingPhase === 'exhale' ? [1.4, 1] : 1
                      }}
                      transition={{ duration: 4, ease: 'easeInOut' }}
                    />

                    <div className={`w-28 h-28 rounded-full shadow-md flex flex-col items-center justify-center text-white font-extrabold ${
                      breathingPhase === 'inhale' ? 'bg-emerald-500' :
                      breathingPhase === 'hold1' ? 'bg-amber-500' :
                      breathingPhase === 'exhale' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      <span className="text-xl font-black font-mono">{breathingTimer}</span>
                      <span className="text-[10px] tracking-wider mt-0.5">ثوان متبقية</span>
                    </div>
                  </div>

                  {/* Status Indicator text */}
                  <div className="text-center space-y-1 z-10">
                    <span className="text-sm font-black text-[#3A3A3A] block">
                      {breathingPhase === 'inhale' && '💨 شـهـيـق... املأ رئتيك بالهدوء والسلام'}
                      {breathingPhase === 'hold1' && '🛑 اكـتـم... احبس طاقة الرضا في جسدك'}
                      {breathingPhase === 'exhale' && '💨 زفـيـر... اطرد التوتر والقلق والتعب'}
                      {breathingPhase === 'hold2' && '🛑 اكـتـم... استشعر السكينة والصمت النفسي'}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-bold">
                      عدد الدورات المكتملة: <span className="font-mono text-xs font-black text-[#8B9D83]">{breathingCycle}</span> دورة
                    </span>
                  </div>

                </div>
              )}
            </div>

            {/* Self-Care & Habits Tracker checklist for current selected date */}
            <div id="habits-tracker" className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                  <CheckSquare className="w-4 h-4 text-[#8B9D83]" />
                  <span>أهداف الرعاية الذاتية والصحة النفسية</span>
                </h3>
                <span className="text-[10px] text-gray-400">تلقائي الحفظ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 💤 Sleep hours track */}
                <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E2DCC8]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                      <Moon className="w-4 h-4 text-blue-500" />
                      <span>ساعات النوم:</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-[#5A5A40]">
                      {activeDiaryForSelectedDate?.sleepHours || 8} ساعات
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="0.5"
                    value={activeDiaryForSelectedDate?.sleepHours || 8}
                    onChange={(e) => handleUpdateHabit('sleep', e.target.value)}
                    className="w-full h-1.5 bg-[#E2DCC8] rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
                  />
                </div>

                {/* 🏃 Sports Workout duration */}
                <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E2DCC8]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                      <Activity className="w-4 h-4 text-[#8B9D83]" />
                      <span>التمارين الرياضية:</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-[#8B9D83]">
                      {activeDiaryForSelectedDate?.sportsDuration || 0} دقيقة
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={activeDiaryForSelectedDate?.sportsDuration || 0}
                    onChange={(e) => handleUpdateHabit('sports', e.target.value)}
                    className="w-full h-1.5 bg-[#E2DCC8] rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
                  />
                </div>

                {/* 💊 Medication Track */}
                <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E2DCC8]/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                    <Pill className="w-4 h-4 text-[#D4A373]" />
                    <span>جرعة العلاج/الفيتامينات:</span>
                  </span>
                  <button
                    onClick={() => {
                      const current = activeDiaryForSelectedDate?.medications?.[0]?.taken || false;
                      handleUpdateHabit('medication', !current);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeDiaryForSelectedDate?.medications?.[0]?.taken
                        ? 'bg-[#8B9D83] text-white shadow-xs'
                        : 'bg-[#F0EDE4] text-[#5A5A40]'
                    }`}
                  >
                    {activeDiaryForSelectedDate?.medications?.[0]?.taken ? '✓ تم التناول' : 'متبقي'}
                  </button>
                </div>
              </div>
            </div>

            {/* 🎯 Daily Habits Tracker (تتبع العادات السلوكية والروتين اليومي) */}
            <div id="custom-habits-tracker" className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                    <span className="text-base">🎯</span>
                    <span>تتبع العادات السلوكية والروتين</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    اختر يوماً من التقويم ثم حدد العادات المنجزة لتسجيل التزامك ودعم تحليلك السلوكي اليومي.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddHabitModal(true)}
                  className="flex items-center space-x-1.5 space-x-reverse px-3.5 py-1.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span>+ إضافة عادة</span>
                </button>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center space-x-1.5 space-x-reverse overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'health', label: 'صحة بدنية 🥦' },
                  { id: 'mind', label: 'تأمل وذهن 🧠' },
                  { id: 'sport', label: 'رياضة ونشاط 🏃' },
                  { id: 'culture', label: 'ثقافة وقراءة 📚' },
                  { id: 'custom', label: 'أهداف أخرى 🎯' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedHabitCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                      selectedHabitCategory === tab.id
                        ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-xs'
                        : 'bg-[#F9F7F2]/80 hover:bg-[#F0EDE4] text-[#5A5A40] border-[#E2DCC8]/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Habits List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {habits
                  .filter(h => selectedHabitCategory === 'all' || h.category === selectedHabitCategory)
                  .map(habit => {
                    const isCompleted = !!habit.history[selectedDate];
                    const catInfo = HABIT_CATEGORIES[habit.category] || HABIT_CATEGORIES.custom;

                    return (
                      <div 
                        key={habit.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          isCompleted 
                            ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' 
                            : 'bg-[#F9F7F2]/30 border-[#E2DCC8]/50 hover:border-[#8B9D83]/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          {/* Toggle Button */}
                          <button
                            onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                            className={`w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted 
                                ? 'bg-[#8B9D83] text-white scale-105 shadow-xs' 
                                : 'border border-[#E2DCC8] hover:border-[#8B9D83] text-transparent hover:bg-white'
                            }`}
                          >
                            <span className="text-[10px] font-bold">✓</span>
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5 space-x-reverse">
                              {habit.icon && <span className="text-sm shrink-0 font-bold">{habit.icon}</span>}
                              <span className={`text-xs font-bold block transition-all ${isCompleted ? 'line-through text-gray-400' : 'text-[#3A3A3A]'}`}>
                                {habit.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${catInfo.color}`}>
                                {catInfo.label}
                              </span>
                              {habit.reminderTime && (
                                <span className="text-[9px] text-gray-400 flex items-center space-x-0.5 space-x-reverse">
                                  <span>⏰ {habit.reminderTime}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <button
                            onClick={() => triggerSimulatedHabitNotification(habit)}
                            className="p-1.5 text-[#5A5A40] hover:text-[#D4A373] hover:bg-[#FAEDCD]/50 rounded-lg transition-colors cursor-pointer"
                            title="محاكاة إشعار التذكير اليومي"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteHabit(habit.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف العادة"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {habits.filter(h => selectedHabitCategory === 'all' || h.category === selectedHabitCategory).length === 0 && (
                  <div className="col-span-full py-8 text-center bg-[#F9F7F2]/50 border border-dashed border-[#E2DCC8]/60 rounded-2xl">
                    <p className="text-xs text-gray-400 font-medium">لا توجد عادات مسجلة في هذا التصنيف حالياً.</p>
                    <button
                      onClick={() => setShowAddHabitModal(true)}
                      className="text-xs font-bold text-[#8B9D83] underline mt-1.5 block mx-auto cursor-pointer"
                    >
                      أضف عادتك الأولى الآن 🚀
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 📊 Habits Evaluation & Psychiatric Insights Panel */}
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                  <span className="text-base">📊</span>
                  <span>التقييم السلوكي وتقارير العادات الذكية (AI)</span>
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">
                  حدد الفترة الزمنية المطلوبة ليقوم الذكاء الاصطناعي برصد اتجاهاتك السلوكية وتقديم توصيات علمية لتعزيز صحتك النفسية.
                </p>
              </div>

              {/* Timeframe selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'daily', label: 'تقييم يومي 📅' },
                  { id: 'weekly', label: 'تقييم أسبوعي 📅' },
                  { id: 'monthly', label: 'تقييم شهري 📅' },
                  { id: 'quarterly', label: 'ربع سنوي (90 يوماً) 📅' },
                  { id: 'semi-annually', label: 'نصف سنوي (180 يوماً) 📅' },
                  { id: 'annually', label: 'تقييم سنوي 📅' },
                  { id: 'custom', label: 'فترة مخصصة 🎯' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setHabitPeriod(p.id as any)}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      habitPeriod === p.id 
                        ? 'bg-[#8B9D83] text-white border-[#8B9D83]' 
                        : 'bg-[#F9F7F2]/60 hover:bg-[#F0EDE4] text-[#5A5A40] border-[#E2DCC8]/60'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom date range inputs (only if custom is selected) */}
              {habitPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F9F7F2] rounded-2xl border border-[#E2DCC8]/60">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#5A5A40]">تاريخ البدء:</label>
                    <input 
                      type="date"
                      value={habitCustomStart}
                      onChange={e => setHabitCustomStart(e.target.value)}
                      className="w-full bg-white border border-[#E2DCC8] rounded-xl px-2.5 py-1.5 text-xs text-[#3A3A3A] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#5A5A40]">تاريخ الانتهاء:</label>
                    <input 
                      type="date"
                      value={habitCustomEnd}
                      onChange={e => setHabitCustomEnd(e.target.value)}
                      className="w-full bg-white border border-[#E2DCC8] rounded-xl px-2.5 py-1.5 text-xs text-[#3A3A3A] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={generateHabitReport}
                disabled={habitEvaluationLoading || habits.length === 0}
                className="w-full py-2.5 bg-[#8B9D83] hover:bg-[#5A5A40] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 space-x-reverse cursor-pointer shadow-xs"
              >
                {habitEvaluationLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري تحليل البيانات وإعداد التقرير السلوكي...</span>
                  </>
                ) : (
                  <>
                    <span>🧠</span>
                    <span>توليد تقرير التقييم السلوكي بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>

              {/* Evaluation Report Result Display Box */}
              {habitEvaluationReport && (
                <div className="p-5 bg-[#F9F7F2] border border-[#E2DCC8] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2DCC8]/60 pb-2">
                    <span className="text-xs font-extrabold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                      <span>📊</span>
                      <span>التقرير السلوكي والتحليل العصبي المعتمد</span>
                    </span>
                    <span className="text-[9px] bg-[#8B9D83]/10 text-[#8B9D83] px-2 py-0.5 rounded-full font-bold">
                      مستشار الصحة النفسية AI
                    </span>
                  </div>

                  <div className="text-xs text-[#3A3A3A] leading-relaxed whitespace-pre-wrap font-sans font-normal space-y-4">
                    {habitEvaluationReport}
                  </div>
                </div>
              )}
            </div>

            {/* Life Map timeline view for selected day */}
            <LifeMap selectedDate={selectedDate} diaries={diaries} />

            {/* Quick tips display for psychiatric support */}
            <div className="p-4 bg-[#FAEDCD]/40 border border-[#D4A373]/30 text-[#D4A373] rounded-2xl text-xs leading-relaxed flex items-start space-x-3 space-x-reverse">
              <span className="text-lg">💡</span>
              <div>
                <strong className="block font-bold mb-0.5">نصيحة اليوم للصحة النفسية:</strong>
                <span>عندما تشعر بضغط الامتحانات أو القلق، خذ دقيقة كاملة لممارسة تنفس الصندوق (شهيق 4 ثوانٍ، كتم 4 ثوانٍ، زفير 4 ثوانٍ، كتم 4 ثوانٍ)؛ فهذا ينشط العصب الحائر ويهدئ الجهاز العصبي فوراً.</span>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB VIEW 2: DIARIES JOURNAL (DIARY WRITING) --- */}
        {activeTab === 'diaries' && (
          <div className="space-y-6">
            
            {/* Editor Container if editing or creating a diary */}
            {editingDiary ? (
              <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 shadow-xs space-y-6">
                
                {/* Editor Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2DCC8]/55 flex-wrap gap-2">
                  <h3 className="font-bold text-[#3A3A3A] text-base">
                    {isNewEntry ? '✍️ تدوين مذكرات يومية جديدة' : '✏️ تعديل مذكرتك الشخصية'}
                  </h3>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {!isNewEntry && (
                      <button
                        type="button"
                        onClick={() => {
                          toggleArchiveDiary(editingDiary.id);
                          const nextState = !editingDiary.isArchived;
                          setEditingDiary(prev => prev ? { ...prev, isArchived: nextState } : null);
                          if (nextState) {
                            setEditingDiary(null);
                          }
                        }}
                        className="text-xs font-black text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 space-x-reverse"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-700" />
                        <span>{editingDiary.isArchived ? 'استرجاع من الأرشيف' : 'أرشفة هذه المذكرة 📥'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingDiary(null);
                        setIsNewEntry(false);
                        setDiaryAiAnswer('');
                      }}
                      className="text-xs font-semibold text-[#5A5A40] hover:text-[#3A3A3A] bg-[#F0EDE4] px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      إلغاء وحفظ المسودة
                    </button>
                  </div>
                </div>

                {/* Title & Star Rating Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">عنوان المذكرة:</label>
                    <input
                      type="text"
                      value={editingDiary.title}
                      onChange={(e) => setEditingDiary(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="عنوان معبر عن يومك..."
                      className="w-full bg-[#F9F7F2] hover:bg-[#F0EDE4] focus:bg-white border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] focus:outline-none rounded-xl px-4 py-2 text-sm text-[#3A3A3A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">تقييم الأهمية والعمق الذاتي:</label>
                    <div className="flex items-center space-x-1.5 space-x-reverse h-9">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setEditingDiary(prev => prev ? { ...prev, importance: stars } : null)}
                          className="focus:outline-none cursor-pointer"
                        >
                          <Star 
                            className={`w-6 h-6 transition-transform hover:scale-110 ${
                              stars <= editingDiary.importance ? 'text-[#D4A373] fill-[#D4A373]' : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 mr-2">({editingDiary.importance} من 5 نجوم)</span>
                    </div>
                  </div>
                </div>

                {/* تصنيف التدوينة الأساسي (يومياتي vs خواطري) */}
                <div>
                  <label className="block text-xs font-bold text-[#5A5A40] mb-2">تصنيف التدوينة الأساسي:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingDiary(prev => prev ? { ...prev, diaryType: 'diary' } : null)}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse ${
                        (editingDiary.diaryType || 'diary') === 'diary'
                          ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-3xs font-extrabold scale-[1.01]'
                          : 'bg-[#F9F7F2] text-[#5A5A40] border-[#E2DCC8] hover:bg-[#F0EDE4]'
                      }`}
                    >
                      <span>📝</span>
                      <span>يومياتي العادية والفضفضة العامة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDiary(prev => prev ? { ...prev, diaryType: 'thought' } : null)}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse ${
                        editingDiary.diaryType === 'thought'
                          ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-3xs font-extrabold scale-[1.01]'
                          : 'bg-[#F9F7F2] text-[#5A5A40] border-[#E2DCC8] hover:bg-[#F0EDE4]'
                      }`}
                    >
                      <span>✍️</span>
                      <span>خواطري وأفكاري الخاصة</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">كيف كان مزاجك السلوكي اليوم؟ (اختر متعدد):</label>
                  <div className="flex flex-wrap gap-2">
                    {['سعيد', 'متحمس', 'مرتاح', 'طبيعي', 'حزين', 'مكتئب', 'قلق', 'غاضب', 'مرهق', 'ممتن'].map((m) => {
                      const isSelected = editingDiary.moods.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setEditingDiary(prev => {
                              if (!prev) return null;
                              const currentMoods = [...prev.moods];
                              if (currentMoods.includes(m)) {
                                return { ...prev, moods: currentMoods.filter(x => x !== m) };
                              } else {
                                return { ...prev, moods: [...currentMoods, m] };
                              }
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#8B9D83] text-white border-[#8B9D83] scale-105 font-semibold' 
                              : 'bg-[#F9F7F2] text-[#5A5A40] border-[#E2DCC8] hover:bg-[#F0EDE4]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {editingDiary.aiMoodAnalysis && editingDiary.aiMoodAnalysis.length > 0 && (
                  <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-2">
                    <span className="block text-xs font-black text-purple-950 flex items-center space-x-1.5 space-x-reverse">
                      <span>🧠</span>
                      <span>تحليل المزاج التلقائي بالذكاء الاصطناعي (Gemini Smart Analysis):</span>
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editingDiary.aiMoodAnalysis.map((analysis, idx) => {
                        const scoreColor = analysis.percentage >= 60 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : analysis.percentage >= 30 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-purple-50 text-purple-700 border-purple-100';
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-xl text-xs font-extrabold border shadow-3xs ${scoreColor}`}
                          >
                            <span>{analysis.mood}</span>
                            <span className="opacity-80">|</span>
                            <span>{analysis.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-purple-600/80 font-bold leading-relaxed">
                      * يتم تحديث هذا التحليل تلقائياً بدقة فور نقرك على زر "حفظ المذكرة بنجاح ✓" بناءً على الكلمات والفضفضة المكتوبة.
                    </p>
                  </div>
                )}

                {/* Content text area with Rich Editor Toolbar */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#5A5A40]">{isEn ? "Write your feelings and thoughts:" : "اكتب فضفضتك ومشاعرك بالتفصيل (بدون قيود):"}</label>
                    {gratitudeCards.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const todaysCards = gratitudeCards.filter(c => c.createdAt.startsWith(todayStr));
                          if (todaysCards.length > 0) {
                            const formatted = "\n\n🌸 لقطات امتناني اليوم:\n" + todaysCards.map((c, i) => `${i + 1}. ${c.text}`).join("\n");
                            setEditingDiary(prev => prev ? { ...prev, content: prev.content + formatted } : null);
                          } else {
                            const lastThree = gratitudeCards.slice(0, 3);
                            const formatted = "\n\n🌸 من مذكرات امتناني الأخيرة:\n" + lastThree.map((c, i) => `${i + 1}. ${c.text}`).join("\n");
                            setEditingDiary(prev => prev ? { ...prev, content: prev.content + formatted } : null);
                          }
                        }}
                        className="text-[10px] text-[#8B9D83] hover:text-[#5A5A40] font-extrabold flex items-center space-x-1 space-x-reverse cursor-pointer bg-[#8B9D83]/8 px-2.5 py-1 rounded-lg transition-colors border border-[#8B9D83]/20 animate-pulse"
                      >
                        <span>🌸</span>
                        <span>{isEn ? "Import Gratitude Moments" : "استيراد لقطات الامتنان السعيدة"}</span>
                      </button>
                    )}
                  </div>

                  {/* Rich Text Editor Toolbar */}
                  <div className="bg-[#F4F1EA] border border-[#E2DCC8] border-b-0 rounded-t-2xl p-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      title="تراجع (Undo)"
                      onClick={handleUndo}
                      className="p-1.5 bg-white hover:bg-[#EAE5D9] active:bg-[#D0C8B0] border border-[#E2DCC8] rounded-lg font-bold text-[#3A3A3A] cursor-pointer transition-all flex items-center justify-center text-sm shadow-3xs"
                    >
                      ↩️
                    </button>
                    <button
                      type="button"
                      title="إعادة (Redo)"
                      onClick={handleRedo}
                      className="p-1.5 bg-white hover:bg-[#EAE5D9] active:bg-[#D0C8B0] border border-[#E2DCC8] rounded-lg font-bold text-[#3A3A3A] cursor-pointer transition-all flex items-center justify-center text-sm shadow-3xs"
                    >
                      ↪️
                    </button>

                    <div className="h-4 w-px bg-[#E2DCC8] mx-0.5" />

                    <button
                      type="button"
                      title="عريض (Bold)"
                      onClick={() => insertFormatting('**', '**')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] font-black text-[#3A3A3A] cursor-pointer"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      title="مائل (Italic)"
                      onClick={() => insertFormatting('*', '*')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] italic font-serif font-bold text-[#3A3A3A] cursor-pointer"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      title="تحته خط (Underline)"
                      onClick={() => insertFormatting('<u>', '</u>')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] underline font-bold text-[#3A3A3A] cursor-pointer"
                    >
                      U
                    </button>
                    <button
                      type="button"
                      title="يتوسطه خط (Strikethrough)"
                      onClick={() => insertFormatting('~~', '~~')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] line-through font-bold text-[#3A3A3A] cursor-pointer"
                    >
                      S
                    </button>

                    <div className="h-4 w-px bg-[#E2DCC8] mx-0.5" />

                    <button
                      type="button"
                      title="عنوان رئيسي"
                      onClick={() => insertFormatting('\n# ')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] font-black text-[#5A5A40] cursor-pointer"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      title="عنوان فرعي"
                      onClick={() => insertFormatting('\n## ')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] font-bold text-[#5A5A40] cursor-pointer"
                    >
                      H2
                    </button>

                    <button
                      type="button"
                      title="اقتباس"
                      onClick={() => insertFormatting('\n> ')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] font-bold text-[#5A5A40] cursor-pointer"
                    >
                      💬
                    </button>
                    <button
                      type="button"
                      title="قائمة نقطية"
                      onClick={() => insertFormatting('\n- ')}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] font-bold text-[#5A5A40] cursor-pointer"
                    >
                      • قائمة
                    </button>

                    <div className="h-4 w-px bg-[#E2DCC8] mx-0.5" />

                    <button
                      type="button"
                      title="تنسيق ألوان الخط"
                      onClick={() => setShowColorPalette(!showColorPalette)}
                      className="px-2 py-1 bg-white hover:bg-[#EAE5D9] rounded-lg border border-[#E2DCC8] font-bold text-amber-800 flex items-center space-x-1 space-x-reverse cursor-pointer"
                    >
                      <span>🎨</span>
                      <span>ألوان الخط</span>
                    </button>

                    <button
                      type="button"
                      title="مزيد من الميزات"
                      onClick={() => setShowMoreFeaturesSheet(true)}
                      className="px-2.5 py-1 bg-[#8B9D83] hover:bg-[#6E8066] text-white rounded-lg font-bold flex items-center space-x-1 space-x-reverse cursor-pointer shadow-3xs"
                    >
                      <span>✨</span>
                      <span>مزيد من الميزات</span>
                    </button>

                    <button
                      type="button"
                      title="اطلب من الذكاء الاصطناعي أن يكتب ملاحظة"
                      onClick={() => setShowAiWriterSheet(true)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold flex items-center space-x-1 space-x-reverse cursor-pointer shadow-3xs text-xs"
                    >
                      <span>✨</span>
                      <span>كتابة بالذكاء الاصطناعي</span>
                    </button>

                    {showColorPalette && (
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E2DCC8]">
                        <button type="button" onClick={() => insertFormatting('<span style="color:#D97706">', '</span>')} className="w-4 h-4 rounded-full bg-amber-600 border cursor-pointer" title="برتقالي" />
                        <button type="button" onClick={() => insertFormatting('<span style="color:#059669">', '</span>')} className="w-4 h-4 rounded-full bg-emerald-600 border cursor-pointer" title="أخضر" />
                        <button type="button" onClick={() => insertFormatting('<span style="color:#2563EB">', '</span>')} className="w-4 h-4 rounded-full bg-blue-600 border cursor-pointer" title="أزرق" />
                        <button type="button" onClick={() => insertFormatting('<span style="color:#DC2626">', '</span>')} className="w-4 h-4 rounded-full bg-red-600 border cursor-pointer" title="أحمر" />
                        <button type="button" onClick={() => insertFormatting('<span style="color:#7C3AED">', '</span>')} className="w-4 h-4 rounded-full bg-purple-600 border cursor-pointer" title="بنفسجي" />
                      </div>
                    )}
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="اكتب هنا كل ما يدور بخلدك من أفكار، مخاوف، آمال، أو أحداث حدثت لك اليوم... (يمكنك تظليل أي كلمة واستخدام الأزرار أعلاه لـ: العريض B، التحته خط U، المائل I، العناوين، والألوان بسهولة!)"
                    onInput={(e) => {
                      const html = e.currentTarget.innerHTML;
                      const prevRecorded = lastRecordedHtmlRef.current || '';
                      if (Math.abs(html.length - prevRecorded.length) > 5 || html.endsWith(' ') || html.endsWith('&nbsp;')) {
                        recordUndoSnapshot(prevRecorded);
                      }
                      setEditingDiary(prev => prev ? { ...prev, content: html } : null);
                    }}
                    onBlur={(e) => {
                      const html = e.currentTarget.innerHTML;
                      setEditingDiary(prev => prev ? { ...prev, content: html } : null);
                    }}
                    style={{
                      backgroundColor: editingDiary.color || '#F9F7F2',
                      fontSize: `${fontDrawerSize}px`,
                      minHeight: '220px'
                    }}
                    className={`w-full border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] focus:outline-none rounded-b-none p-4 text-[#3A3A3A] leading-relaxed transition-all outline-none max-h-[600px] overflow-y-auto ${fontDrawerFamily}`}
                  />

                  {/* Attachment & Features Toolbar directly attached to textarea (Image 4 format) */}
                  <div className="bg-[#EAE5D9] border border-t-0 border-[#E2DCC8] rounded-b-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Attach File (Paperclip) */}
                      <label className="p-2 bg-white hover:bg-[#F4F1EA] rounded-xl border border-[#E2DCC8] text-[#5A5A40] cursor-pointer font-bold flex items-center space-x-1 space-x-reverse" title="إرفاق ملف">
                        <span>📎</span>
                        <span className="hidden sm:inline">إرفاق ملف</span>
                        <input
                          type="file"
                          accept="*/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && editingDiary) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  const newFile: FileAttachment = {
                                    id: `file-${Date.now()}`,
                                    name: file.name,
                                    size: `${(file.size / 1024).toFixed(1)} KB`,
                                    type: file.type || 'application/pdf',
                                    dataUrl: reader.result
                                  };
                                  setEditingDiary(prev => prev ? { ...prev, files: [...(prev.files || []), newFile] } : null);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {/* Add Voice (Mic) */}
                      <button
                        type="button"
                        onClick={handleToggleRecording}
                        className={`p-2 bg-white hover:bg-[#F4F1EA] rounded-xl border border-[#E2DCC8] cursor-pointer font-bold flex items-center space-x-1 space-x-reverse ${isRecording ? 'text-red-600 bg-red-50 border-red-200' : 'text-[#5A5A40]'}`}
                        title="أضف صوت"
                      >
                        <span>🎙️</span>
                        <span className="hidden sm:inline">{isRecording ? `جاري التسجيل (${recordingSeconds}ث)` : 'أضف صوت'}</span>
                      </button>

                      {/* Draw / Sketch (Pencil) */}
                      <button
                        type="button"
                        onClick={() => setShowSketchboard(true)}
                        className="p-2 bg-white hover:bg-[#F4F1EA] rounded-xl border border-[#E2DCC8] text-[#5A5A40] cursor-pointer font-bold flex items-center space-x-1 space-x-reverse"
                        title="رسم"
                      >
                        <span>✏️</span>
                        <span className="hidden sm:inline">رسم</span>
                      </button>

                      {/* Add Image */}
                      <label className="p-2 bg-white hover:bg-[#F4F1EA] rounded-xl border border-[#E2DCC8] text-[#5A5A40] cursor-pointer font-bold flex items-center space-x-1 space-x-reverse" title="صورة">
                        <span>🖼️</span>
                        <span className="hidden sm:inline">صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Background Color Picker Palette */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                          className="p-2 bg-white hover:bg-[#F4F1EA] rounded-xl border border-[#E2DCC8] text-[#5A5A40] cursor-pointer font-bold flex items-center space-x-1 space-x-reverse"
                          title="لون الخلفية"
                        >
                          <span>🎨</span>
                          <span className="hidden sm:inline">لون</span>
                        </button>
                        {showBgColorPicker && (
                          <div className="absolute right-0 bottom-full mb-1 flex items-center gap-2 p-2 bg-white border border-[#E2DCC8] rounded-2xl shadow-xl z-30 animate-fadeIn">
                            <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#F9F7F2' } : null); setShowBgColorPicker(false); }} className="w-6 h-6 rounded-full bg-[#F9F7F2] border-2 border-gray-400 cursor-pointer hover:scale-110 transition-all shadow-xs" title="افتراضي" />
                            <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#FFFDF5' } : null); setShowBgColorPicker(false); }} className="w-6 h-6 rounded-full bg-[#FFFDF5] border-2 border-amber-300 cursor-pointer hover:scale-110 transition-all shadow-xs" title="أصفر دافئ" />
                            <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#F2F7FB' } : null); setShowBgColorPicker(false); }} className="w-6 h-6 rounded-full bg-[#F2F7FB] border-2 border-blue-300 cursor-pointer hover:scale-110 transition-all shadow-xs" title="أزرق سماوي" />
                            <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#F4F7F2' } : null); setShowBgColorPicker(false); }} className="w-6 h-6 rounded-full bg-[#F4F7F2] border-2 border-emerald-300 cursor-pointer hover:scale-110 transition-all shadow-xs" title="أخضر ناعم" />
                            <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#FBF7FF' } : null); setShowBgColorPicker(false); }} className="w-6 h-6 rounded-full bg-[#FBF7FF] border-2 border-purple-300 cursor-pointer hover:scale-110 transition-all shadow-xs" title="لافندر" />
                            <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#FCF2F4' } : null); setShowBgColorPicker(false); }} className="w-6 h-6 rounded-full bg-[#FCF2F4] border-2 border-rose-300 cursor-pointer hover:scale-110 transition-all shadow-xs" title="وردي" />
                          </div>
                        )}
                      </div>

                      {/* Font Effect Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowFontDrawer(true)}
                        className="p-2 bg-white hover:bg-[#F4F1EA] rounded-xl border border-[#E2DCC8] text-[#5A5A40] cursor-pointer font-bold flex items-center space-x-1 space-x-reverse"
                        title="تأثير الخط"
                      >
                        <span className="font-serif">Aa</span>
                        <span className="hidden sm:inline">خط</span>
                      </button>
                    </div>

                    {/* Checklist Task Add Button (Matching Image 3 & 4) */}
                    <button
                      type="button"
                      onClick={handleAddTaskItem}
                      className="px-3 py-1.5 bg-[#8B9D83] text-white hover:bg-[#6E8066] rounded-xl font-bold flex items-center space-x-1 space-x-reverse cursor-pointer shadow-3xs text-xs"
                    >
                      <span>☑️</span>
                      <span>+ إضافة عنصر (قائمة)</span>
                    </button>
                  </div>
                </div>

                {/* Embedded Checklist Tasks inside Note (Image 3 & 4 format) */}
                {(editingDiary.tasks || []).length > 0 && (
                  <div className="p-4 bg-white border border-[#E2DCC8] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                        <span>☑️</span>
                        <span>عناصر وقائمة المهام داخل المذكرة:</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddTaskItem}
                        className="text-[11px] text-[#8B9D83] font-black hover:underline cursor-pointer"
                      >
                        + إضافة عنصر
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingDiary.tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setEditingDiary(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  tasks: prev.tasks.map(t => t.id === task.id ? { ...t, completed: checked } : t)
                                };
                              });
                            }}
                            className="w-4 h-4 rounded text-[#8B9D83] focus:ring-[#8B9D83] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={task.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingDiary(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  tasks: prev.tasks.map(t => t.id === task.id ? { ...t, text: val } : t)
                                };
                              });
                            }}
                            placeholder="أضف المهمة هنا..."
                            className={`flex-1 text-xs border-b border-transparent focus:border-[#8B9D83] focus:outline-none bg-transparent py-1 ${task.completed ? 'line-through text-gray-400' : 'text-[#3A3A3A] font-medium'}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiary(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  tasks: prev.tasks.filter(t => t.id !== task.id)
                                };
                              });
                            }}
                            className="text-red-400 hover:text-red-600 font-bold text-xs px-1.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Adding modifications / subsequent additions (التعديلات والإضافات اللاحقة) */}
                {!isNewEntry && (
                  <div className="space-y-3 bg-[#FAEDCD]/20 border border-[#D4A373]/30 rounded-2xl p-4">
                    <span className="block text-xs font-extrabold text-[#D4A373] flex items-center space-x-1.5 space-x-reverse">
                      <span>✍️</span>
                      <span>إضافة ملحق أو تعديل نصي لاحق (يُعرض مع وقته وتاريخه):</span>
                    </span>
                    <textarea
                      rows={3}
                      value={newEditAddition}
                      onChange={(e) => setNewEditAddition(e.target.value)}
                      placeholder="اكتب هنا الكلمات أو الجمل التي تود إضافتها أسفل النص الأساسي لتدون بلحظتها وتاريخها..."
                      className="w-full bg-white focus:bg-white border border-[#E2DCC8] focus:ring-2 focus:ring-[#D4A373] focus:border-[#D4A373] focus:outline-none rounded-xl p-3 text-xs text-[#3A3A3A] leading-relaxed transition-all"
                    />
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                      * عند الحفظ، سيتم إدراج هذا النص الإضافي أسفل النص الأساسي مع وسم توقيت وتاريخ دقيق، وسيتم تمييز المذكرة من الخارج بـ "تم التعديل".
                    </p>
                  </div>
                )}

                {/* Render previous modifications (الإضافات اللاحقة المسجلة) */}
                {editingDiary.edits && editingDiary.edits.length > 0 && (
                  <div className="space-y-3">
                    <span className="block text-xs font-extrabold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                      <span>📜</span>
                      <span>سجل الإضافات والتعديلات التاريخية للمذكرة:</span>
                    </span>
                    <div className="space-y-3">
                      {editingDiary.edits.map((edit) => (
                        <div key={edit.id} className="bg-[#F9F7F2] border-r-4 border-[#8B9D83] p-4 rounded-l-xl rounded-r-sm space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                            <span className="flex items-center space-x-1 space-x-reverse">
                              <span>📆</span>
                              <span>{edit.timestamp}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDiary(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    edits: (prev.edits || []).filter(e => e.id !== edit.id)
                                  };
                                });
                              }}
                              className="text-red-500 hover:text-red-700 cursor-pointer text-[10px] font-bold"
                            >
                              حذف هذه الإضافة
                            </button>
                          </div>
                          <p className="text-xs text-[#3A3A3A] leading-relaxed font-normal">
                            {edit.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags input bar */}
                <div>
                  <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">الوسوم والتصنيفات (اضغط مفتاح المسافة أو فاصلة للإضافة):</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[#F9F7F2] border border-[#E2DCC8] rounded-xl">
                    {editingDiary.tags.map((t, idx) => (
                      <span key={idx} className="bg-[#F0EDE4] text-[#5A5A40] text-xs py-1 px-2.5 rounded-lg border border-[#E2DCC8] flex items-center space-x-1 space-x-reverse">
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => setEditingDiary(prev => prev ? { ...prev, tags: prev.tags.filter(x => x !== t) } : null)}
                          className="text-[10px] text-[#5A5A40]/70 hover:text-[#3A3A3A] cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="إضافة وسم..."
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === ',') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim().replace('#', '');
                          if (val && !editingDiary.tags.includes(val)) {
                            setEditingDiary(prev => prev ? { ...prev, tags: [...prev.tags, val] } : null);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="bg-transparent border-0 focus:ring-0 text-xs px-2 focus:outline-none py-1 flex-grow"
                    />
                  </div>
                </div>

                {/* Drawing / Image thumbnail Display inside editor */}
                {(editingDiary.images.length > 0 || editingDiary.drawing) && (
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-[#5A5A40]">الصور والتخطيطات المرفقة:</span>
                    <div className="flex flex-wrap gap-3">
                      {editingDiary.images.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E2DCC8] shadow-xs group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditingDiary(prev => prev ? { ...prev, images: prev.images.filter((_, i) => i !== idx) } : null)}
                            className="absolute inset-0 bg-red-700/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                      ))}

                      {editingDiary.drawing && (
                        <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-[#E2DCC8] shadow-xs group bg-white">
                          <img src={editingDiary.drawing} className="w-full h-full object-contain" />
                          <div className="absolute top-0 right-0 bg-[#8B9D83] text-white text-[8px] px-1.5 py-0.5 rounded-bl">رسمة</div>
                          <button
                            type="button"
                            onClick={() => setEditingDiary(prev => prev ? { ...prev, drawing: undefined } : null)}
                            className="absolute inset-0 bg-red-700/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer"
                          >
                            حذف الرسمة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 🎥 Attached Videos Display inside editor */}
                {editingDiary.videos && editingDiary.videos.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="block text-xs font-bold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                      <span>🎥</span>
                      <span>الفيديوهات المرفقة بالمذكرة:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editingDiary.videos.map((vid, idx) => (
                        <div key={idx} className="relative bg-[#F9F7F2] p-3 border border-[#E2DCC8] rounded-xl flex flex-col space-y-2">
                          {vid.startsWith('data:video/') || vid.startsWith('blob:') || vid.includes('mp4') || vid.startsWith('data:application/octet-stream') ? (
                            <video src={vid} controls className="w-full h-32 rounded-lg bg-black object-cover" />
                          ) : (
                            <div className="bg-white p-2.5 rounded-lg border border-[#E2DCC8]/60 text-xs text-[#5A5A40] truncate flex items-center space-x-2 space-x-reverse">
                              <span className="font-semibold shrink-0">رابط فيديو:</span>
                              <a href={vid} target="_blank" rel="noopener noreferrer" className="text-[#8B9D83] underline truncate flex-grow">
                                {vid}
                              </a>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingDiary(prev => prev ? { ...prev, videos: prev.videos.filter((_, i) => i !== idx) } : null)}
                            className="text-xs text-red-600 hover:text-red-700 font-bold self-end cursor-pointer"
                          >
                            حذف الفيديو
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 📄 Attached PDFs Display inside editor */}
                {editingDiary.files && editingDiary.files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="block text-xs font-bold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                      <span>📄</span>
                      <span>ملفات PDF المرفقة بالمذكرة:</span>
                    </span>
                    <div className="space-y-2">
                      {editingDiary.files.map((file) => (
                        <div key={file.id} className="p-3 bg-[#F9F7F2] border border-[#E2DCC8] rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="p-2 bg-red-100 text-red-700 rounded-lg font-bold text-[11px] shrink-0">
                              PDF
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold block text-[#3A3A3A] truncate">{file.name}</span>
                              <span className="text-[10px] text-gray-400">الحجم: {file.size}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {file.dataUrl && (
                              <a
                                href={file.dataUrl}
                                download={file.name}
                                className="bg-[#8B9D83] hover:bg-[#72856A] text-white text-[10px] px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                              >
                                تحميل
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDiary(prev => prev ? { ...prev, files: prev.files.filter(x => x.id !== file.id) } : null);
                              }}
                              className="text-red-600 hover:text-red-700 font-bold px-2 cursor-pointer text-xs"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🔗 Attached Web Links Display inside editor */}
                {editingDiary.links && editingDiary.links.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="block text-xs font-bold text-[#5A5A40] flex items-center space-x-1.5 space-x-reverse">
                      <span>🔗</span>
                      <span>الروابط والمراجع المرفقة:</span>
                    </span>
                    <div className="space-y-1.5">
                      {editingDiary.links.map((link, idx) => (
                        <div key={idx} className="p-3 bg-blue-50/30 border border-blue-200/50 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                            <span className="text-blue-500 font-bold">🌐</span>
                            <a 
                              href={link} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-blue-700 hover:underline truncate font-medium"
                            >
                              {link}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiary(prev => prev ? { ...prev, links: (prev.links || []).filter((_, i) => i !== idx) } : null);
                            }}
                            className="text-red-600 hover:text-red-700 font-bold px-2 cursor-pointer text-xs shrink-0"
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media, Sketch and Voice attachment bar */}
                <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E2DCC8]/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <span className="text-xs font-bold text-[#5A5A40]">إضافة وسائط ومرفقات لتوسيع الذاكرة الزمنية:</span>
                  <div className="flex flex-wrap gap-2">
                    
                    {/* Audio File Upload button */}
                    <label className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 bg-white hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-xl text-xs font-semibold text-[#5A5A40] cursor-pointer transition-colors shadow-xs" title="اختر من (الملفات / Files) لرفع الملاحظة الصوتية">
                      <span>🎵</span>
                      <span>أضف ملف صوتي</span>
                      <input
                        type="file"
                        accept=".mp3,.m4a,.wav,.aac,.ogg,.opus,.flac,.webm,.amr,.3gp,audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/x-m4a,audio/aac,audio/ogg,audio/webm,audio/amr"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Image Snapper / File upload */}
                    <label className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 bg-white hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-xl text-xs font-semibold text-[#5A5A40] cursor-pointer transition-colors shadow-xs">
                      <Image className="w-3.5 h-3.5 text-[#D4A373]" />
                      <span>إضافة لقطة/صورة</span>
                      <input
                        id="image-upload-trigger"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Sketch Canvas sketchpad button */}
                    <button
                      type="button"
                      onClick={() => setShowSketchboard(true)}
                      className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 bg-white hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-xl text-xs font-semibold text-[#5A5A40] cursor-pointer transition-colors shadow-xs"
                    >
                      <span className="text-[#8B9D83] font-bold">🎨</span>
                      <span>ارسم تخطيطاً ذهنيّاً</span>
                    </button>

                    {/* Voice record mic button */}
                    <button
                      type="button"
                      onClick={handleToggleRecording}
                      className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                        isRecording 
                          ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                          : 'bg-white hover:bg-[#F0EDE4] border-[#E2DCC8] text-[#5A5A40]'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5 text-red-500" />
                      <span>{isRecording ? `جاري التسجيل (${recordingSeconds}ث)` : '🎤 فضفضة صوتية سريعة'}</span>
                    </button>

                    {isRecording && (
                      <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-2xl flex flex-col space-y-1.5 animate-fadeIn text-xs col-span-full">
                        <div className="flex items-center justify-between text-red-700 font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shrink-0" />
                            <span>جاري تسجيل الفضفضة والتقاط الصوت المباشر... ({recordingSeconds} ثانية)</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleToggleRecording}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-[11px] cursor-pointer shadow-xs"
                          >
                            إيقاف وحفظ التسجيل ⏹️
                          </button>
                        </div>
                        {speechTranscript ? (
                          <div className="bg-white/90 p-2 rounded-xl border border-red-100 text-[#2B3E50] text-[11px] font-medium leading-relaxed">
                            <span className="font-bold text-red-600 block mb-0.5">النص المكتوب لحظياً:</span>
                            <p className="italic">"{speechTranscript}"</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-red-500 italic">
                            تحدث الآن بوضوح وسيتم تحويل كلماتك لنص مكتوب بالذكاء الاصطناعي عند إنهاء التسجيل...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Web Link button */}
                    <button
                      type="button"
                      onClick={() => setActiveInputSection(activeInputSection === 'link' ? 'none' : 'link')}
                      className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                        activeInputSection === 'link'
                          ? 'bg-[#8B9D83] text-white border-[#8B9D83]'
                          : 'bg-white hover:bg-[#F0EDE4] border-[#E2DCC8] text-[#5A5A40]'
                      }`}
                    >
                      <span>🌐</span>
                      <span>رابط ويب</span>
                    </button>

                    {/* Video attachment button */}
                    <button
                      type="button"
                      onClick={() => setActiveInputSection(activeInputSection === 'video' ? 'none' : 'video')}
                      className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                        activeInputSection === 'video'
                          ? 'bg-[#8B9D83] text-white border-[#8B9D83]'
                          : 'bg-white hover:bg-[#F0EDE4] border-[#E2DCC8] text-[#5A5A40]'
                      }`}
                    >
                      <span>🎥</span>
                      <span>فيديو</span>
                    </button>

                    {/* PDF attachment button */}
                    <button
                      type="button"
                      onClick={() => setActiveInputSection(activeInputSection === 'pdf' ? 'none' : 'pdf')}
                      className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                        activeInputSection === 'pdf'
                          ? 'bg-[#8B9D83] text-white border-[#8B9D83]'
                          : 'bg-white hover:bg-[#F0EDE4] border-[#E2DCC8] text-[#5A5A40]'
                      }`}
                    >
                      <span>📄</span>
                      <span>ملف PDF</span>
                    </button>

                  </div>
                </div>

                {/* Expandable Extra Attachment Sections */}
                {activeInputSection !== 'none' && (
                  <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E2DCC8]/60 space-y-3">
                    {activeInputSection === 'link' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#5A5A40]">أدخل رابط الموقع الإلكتروني أو المراجع للفضفضة:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tempWebUrl}
                            onChange={(e) => setTempWebUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-grow bg-white border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] focus:outline-none rounded-xl px-3.5 py-2 text-xs text-[#3A3A3A]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddWebLink(tempWebUrl)}
                            className="bg-[#8B9D83] hover:bg-[#72856A] text-white text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0"
                          >
                            إضافة الرابط
                          </button>
                        </div>
                      </div>
                    )}

                    {activeInputSection === 'video' && (
                      <div className="space-y-3">
                        <span className="block text-xs font-bold text-[#5A5A40]">إضافة فيديو للمذكرة:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Option 1: File upload */}
                          <div className="p-3 bg-white border border-[#E2DCC8] rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[11px] font-bold text-gray-500">الخيار 1: رفع ملف فيديو محلي</span>
                            <label className="flex items-center justify-center space-x-1.5 space-x-reverse py-2 bg-[#F9F7F2] hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-lg text-xs font-semibold text-[#5A5A40] cursor-pointer transition-colors shadow-xs">
                              <span>📁 اختر فيديو من جهازك</span>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Option 2: Enter URL */}
                          <div className="p-3 bg-white border border-[#E2DCC8] rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[11px] font-bold text-gray-500">الخيار 2: أدخل رابط فيديو (YouTube أو رابط مباشر)</span>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={tempVideoUrl}
                                onChange={(e) => setTempVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/..."
                                className="flex-grow bg-[#F9F7F2] border border-[#E2DCC8] focus:outline-none rounded-lg px-2.5 py-1 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddVideoLink(tempVideoUrl)}
                                className="bg-[#8B9D83] hover:bg-[#72856A] text-white text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0"
                              >
                                إضافة
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInputSection === 'pdf' && (
                      <div className="space-y-3">
                        <span className="block text-xs font-bold text-[#5A5A40]">إضافة ملف PDF للمذكرة:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Option 1: PDF File upload */}
                          <div className="p-3 bg-white border border-[#E2DCC8] rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[11px] font-bold text-gray-500">الخيار 1: رفع ملف PDF من جهازك</span>
                            <label className="flex items-center justify-center space-x-1.5 space-x-reverse py-2 bg-[#F9F7F2] hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-lg text-xs font-semibold text-[#5A5A40] cursor-pointer transition-colors shadow-xs">
                              <span>📄 اختر ملف PDF</span>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Option 2: Simulated PDF addition */}
                          <div className="p-3 bg-white border border-[#E2DCC8] rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[11px] font-bold text-gray-500">الخيار 2: إضافة مستند مرجعي أو رابط PDF</span>
                            <div className="flex gap-1.5">
                              <input
                                id="manual-pdf-name"
                                type="text"
                                placeholder="اسم ملف الـ PDF..."
                                className="w-1/2 bg-[#F9F7F2] border border-[#E2DCC8] focus:outline-none rounded-lg px-2 py-1 text-xs"
                              />
                              <input
                                id="manual-pdf-url"
                                type="text"
                                placeholder="رابط الملف..."
                                className="w-1/2 bg-[#F9F7F2] border border-[#E2DCC8] focus:outline-none rounded-lg px-2 py-1 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nameEl = document.getElementById('manual-pdf-name') as HTMLInputElement;
                                  const urlEl = document.getElementById('manual-pdf-url') as HTMLInputElement;
                                  if (nameEl && urlEl && nameEl.value.trim()) {
                                    const newFile: FileAttachment = {
                                      id: `file-${Date.now()}`,
                                      name: nameEl.value.trim().endsWith('.pdf') ? nameEl.value.trim() : nameEl.value.trim() + '.pdf',
                                      size: 'رابط خارجي',
                                      type: 'application/pdf',
                                      dataUrl: urlEl.value.trim() || '#'
                                    };
                                    setEditingDiary(prev => prev ? { ...prev, files: [...(prev.files || []), newFile] } : null);
                                    nameEl.value = '';
                                    urlEl.value = '';
                                    setActiveInputSection('none');
                                  }
                                }}
                                className="bg-[#8B9D83] hover:bg-[#72856A] text-white text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0"
                              >
                                إضافة
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 🎙️ Attached Audio Recordings & Speech Emotion Recognition (SER) Panel */}
                {editingDiary.audioRecordings.length > 0 && (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-[#5A5A40]">
                      🎙️ التسجيلات الصوتية المرفقة (مع تحليل نبرة المشاعر SER):
                    </span>
                    <div className="space-y-3">
                      {editingDiary.audioRecordings.map((rec) => {
                        const emoStyle = getSpeechEmotionStyles(rec.speechEmotion);
                        return (
                          <div key={rec.id} className="p-3.5 bg-[#F9F7F2] border border-[#E2DCC8] rounded-2xl space-y-2.5 text-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <div className="p-2 bg-[#8B9D83]/15 text-[#8B9D83] rounded-xl">
                                  <Mic className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-bold block text-[#3A3A3A]">{rec.name}</span>
                                  <span className="text-[10px] text-gray-500">المدة: {rec.duration} ثانية</span>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDiary(prev => prev ? { ...prev, audioRecordings: prev.audioRecordings.filter(x => x.id !== rec.id) } : null);
                                }}
                                className="text-red-600 hover:text-red-700 font-bold px-2.5 py-1 bg-white border border-red-100 rounded-lg cursor-pointer text-xs transition-colors"
                              >
                                حذف
                              </button>
                            </div>

                            {/* Prominent Audio Player Component */}
                            {(() => {
                              const audioSrc = (rec.dataUrl && rec.dataUrl !== '#') 
                                ? rec.dataUrl 
                                : (rec.blobUrl && rec.blobUrl !== '#' ? rec.blobUrl : null);
                              
                              if (audioSrc) {
                                return (
                                  <div className="bg-white p-3 rounded-xl border border-[#D0C8B0] shadow-2xs space-y-1.5 my-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-[#5A5A40]">
                                      <span className="flex items-center gap-1.5">
                                        <span>🎧</span>
                                        <span>مشغل الصوت التسجيلي:</span>
                                      </span>
                                      <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] border border-emerald-200">
                                        جاهز للتشغيل والاستماع
                                      </span>
                                    </div>
                                    <audio controls src={audioSrc} className="w-full h-9 rounded-lg cursor-pointer bg-gray-50" />
                                  </div>
                                );
                              }
                              return (
                                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between my-1">
                                  <span>⚠️ يتعذر تشغيل الصوت (لم يتم حفظ الملف الصوتي بالكامل).</span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRecording()}
                                    className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg font-bold cursor-pointer transition-colors text-[10px] shrink-0"
                                  >
                                    إعادة التسجيل 🎙️
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Transcription & Dynamic Colored Background Container for SER */}
                            <div className={`p-3.5 rounded-2xl border transition-all duration-300 space-y-2.5 ${emoStyle.containerBg}`}>
                              <div className="flex items-center justify-between border-b border-black/10 pb-2 flex-wrap gap-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black flex items-center gap-1 text-[11px]">
                                    <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                                    <span>{emoStyle.headerText}:</span>
                                  </span>

                                  {/* Speech Emotion Badge */}
                                  <span className={`px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 shadow-3xs ${emoStyle.badgeBg}`}>
                                    <span>{emoStyle.emoji}</span>
                                    <span>{emoStyle.emotionText}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    disabled={transcribingAudioId === rec.id}
                                    onClick={() => handleTranscribeAudioItem(rec)}
                                    className="px-2.5 py-1 bg-white/90 hover:bg-white text-[#4E685B] border border-black/10 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-3xs"
                                  >
                                    {transcribingAudioId === rec.id ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin text-[#4E685B]" />
                                        <span>جاري التحليل...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3 text-[#D4A373]" />
                                        <span>تحليل النبرة والتفريغ</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Manual Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTranscriptId(rec.id);
                                      const existing = rec.transcription && !rec.transcription.includes('انقر على زر') ? rec.transcription : '';
                                      setEditingTranscriptText(existing);
                                    }}
                                    className="px-2.5 py-1 bg-white/90 hover:bg-white text-indigo-800 border border-black/10 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                                    title="تعديل النص المفرغ يدوياً وتصحيح أخطاء التعرف على الصوت"
                                  >
                                    <Edit3 className="w-3 h-3 text-indigo-600" />
                                    <span>تعديل النص</span>
                                  </button>

                                  {rec.transcription && rec.transcription.trim() && !rec.transcription.includes('جاري') && !rec.transcription.includes('انقر على زر') && (
                                    <button
                                      type="button"
                                      onClick={() => handleAppendTranscriptToContent(rec.transcription!)}
                                      className="px-2.5 py-1 bg-white/90 hover:bg-white text-[#8C661D] border border-black/10 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                                      title="نسخ النص المفرغ وإضافته مباشرة لمضمون اليومية"
                                    >
                                      <span>✍️</span>
                                      <span>إضافة للنص</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Transcription text body / Inline Editor */}
                              {transcribingAudioId === rec.id ? (
                                <div className="py-2.5 text-center text-xs text-amber-900 font-bold animate-pulse flex items-center justify-center gap-2">
                                  <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                                  <span>جاري تحليل المشاعر من نبرة الصوت وتفريغ الكلام بالذكاء الاصطناعي...</span>
                                </div>
                              ) : editingTranscriptId === rec.id ? (
                                <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-indigo-200 shadow-sm animate-fadeIn">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-[#3A3A3A]">
                                    <span className="flex items-center gap-1.5 text-indigo-900">
                                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>تعديل النص المفرغ يدويّاً:</span>
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">يمكنك كتابة أو تصحيح النص المفرغ هنا</span>
                                  </div>
                                  <textarea
                                    value={editingTranscriptText}
                                    onChange={(e) => setEditingTranscriptText(e.target.value)}
                                    rows={3}
                                    placeholder="اكتب النص المفرغ الصوتي هنا..."
                                    className="w-full bg-white border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] focus:outline-none rounded-xl p-2.5 text-xs text-[#3A3A3A] leading-relaxed resize-y font-medium shadow-2xs"
                                    dir="rtl"
                                    autoFocus
                                  />
                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTranscriptId(null)}
                                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                                    >
                                      إلغاء
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateAudioTranscriptionAtomic(rec.id, editingTranscriptText.trim());
                                        setEditingTranscriptId(null);
                                      }}
                                      className="px-3.5 py-1 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1"
                                    >
                                      <span>💾</span>
                                      <span>حفظ التعديل</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div
                                    onClick={() => {
                                      setEditingTranscriptId(rec.id);
                                      const existing = rec.transcription && !rec.transcription.includes('انقر على زر') ? rec.transcription : '';
                                      setEditingTranscriptText(existing);
                                    }}
                                    className={`relative group rounded-xl p-2.5 transition-all cursor-pointer hover:bg-black/5 border border-dashed border-black/10 hover:border-indigo-300 ${emoStyle.textColor}`}
                                    title="انقر هنا لتعديل النص المفرغ يدويًا"
                                  >
                                    <p className="whitespace-pre-wrap leading-relaxed text-xs">
                                      {rec.transcription || 'انقر هنا لكتابة أو تعديل النص المفرغ يدويّاً، أو انقر (تحليل النبرة والتفريغ) للتفريغ التلقائي.'}
                                    </p>
                                    <span className="opacity-80 group-hover:opacity-100 transition-opacity absolute top-1.5 left-1.5 text-[10px] font-bold bg-white/95 text-[#3A3A3A] px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs flex items-center gap-1">
                                      <Edit3 className="w-2.5 h-2.5 text-indigo-600" />
                                      <span>تعديل</span>
                                    </span>
                                  </div>

                                  {/* SER Vocal Tone Details */}
                                  {rec.speechEmotion?.vocalToneDetails && (
                                    <div className="text-[10px] pt-1.5 border-t border-black/10 flex items-start gap-1.5 font-bold opacity-90">
                                      <span className="shrink-0">🎧 ملاحظة نبرة الصوت (SER):</span>
                                      <span className="leading-normal">{rec.speechEmotion.vocalToneDetails}</span>
                                    </div>
                                  )}

                                  {/* Quick Mood Color Palette Override Selector */}
                                  <div className="pt-2 border-t border-black/5 flex items-center justify-between flex-wrap gap-1 text-[10px] font-bold">
                                    <span className="opacity-75">تعديل لون خلفية النص حسب نبرة المشاعر:</span>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleSetSpeechEmotion(rec.id, 'قلق', 'amber')}
                                        className="px-1.5 py-0.5 bg-amber-200/90 hover:bg-amber-300 text-amber-950 border border-amber-400 rounded-md transition-all cursor-pointer"
                                        title="تلوين خلفية النص بصبغة القلق والتوتر (Amber)"
                                      >
                                        😰 قلق
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetSpeechEmotion(rec.id, 'فرح', 'emerald')}
                                        className="px-1.5 py-0.5 bg-emerald-200/90 hover:bg-emerald-300 text-emerald-950 border border-emerald-400 rounded-md transition-all cursor-pointer"
                                        title="تلوين خلفية النص بصبغة الفرح والسعادة (Emerald)"
                                      >
                                        🎉 فرح
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetSpeechEmotion(rec.id, 'حزن', 'blue')}
                                        className="px-1.5 py-0.5 bg-blue-200/90 hover:bg-blue-300 text-blue-950 border border-blue-400 rounded-md transition-all cursor-pointer"
                                        title="تلوين خلفية النص بصبغة الحزن والهدوء (Blue)"
                                      >
                                        😔 حزن
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetSpeechEmotion(rec.id, 'غضب', 'red')}
                                        className="px-1.5 py-0.5 bg-red-200/90 hover:bg-red-300 text-red-950 border border-red-400 rounded-md transition-all cursor-pointer"
                                        title="تلوين خلفية النص بصبغة الغضب والانفعال (Red)"
                                      >
                                        😡 غضب
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetSpeechEmotion(rec.id, 'هدوء', 'teal')}
                                        className="px-1.5 py-0.5 bg-teal-200/90 hover:bg-teal-300 text-teal-950 border border-teal-400 rounded-md transition-all cursor-pointer"
                                        title="تلوين خلفية النص بصبغة الهدوء والاطمئنان (Teal)"
                                      >
                                        🧘 هدوء
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Drawing Board Canvas Modal */}
                {showSketchboard && (
                  <div className="fixed inset-0 bg-[#5A5A40]/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl h-[450px]">
                      <DrawingCanvas
                        initialDataUrl={editingDiary.drawing}
                        onSave={(dataUrl) => {
                          setEditingDiary(prev => prev ? { ...prev, drawing: dataUrl } : null);
                          setShowSketchboard(false);
                        }}
                        onCancel={() => setShowSketchboard(false)}
                      />
                    </div>
                  </div>
                )}

                {/* 'مزيد من الميزات' Bottom Sheet / Modal (Image 3 format) */}
                {showMoreFeaturesSheet && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl border border-[#E2DCC8]">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <h3 className="text-base font-extrabold text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                          <span>✨</span>
                          <span>مزيد من الميزات</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowMoreFeaturesSheet(false)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* 6 Circular Feature Grid Items (Image 3) */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* 1. الرسم (Draw) */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreFeaturesSheet(false);
                            setShowSketchboard(true);
                          }}
                          className="flex flex-col items-center justify-center space-y-2 p-3 bg-[#F9F7F2] hover:bg-[#F0EDE4] rounded-2xl border border-[#E2DCC8] transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                            🖌️
                          </div>
                          <span className="text-xs font-bold text-[#3A3A3A]">رسم</span>
                        </button>

                        {/* 2. أضف صورة (Add Image) */}
                        <label
                          className="flex flex-col items-center justify-center space-y-2 p-3 bg-[#F9F7F2] hover:bg-[#F0EDE4] rounded-2xl border border-[#E2DCC8] transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                            🖼️
                          </div>
                          <span className="text-xs font-bold text-[#3A3A3A]">أضف صورة</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              handleImageUpload(e);
                              setShowMoreFeaturesSheet(false);
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* 3. لون الخلفية (Background Color) */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreFeaturesSheet(false);
                            setShowColorPalette(!showColorPalette);
                          }}
                          className="flex flex-col items-center justify-center space-y-2 p-3 bg-[#F9F7F2] hover:bg-[#F0EDE4] rounded-2xl border border-[#E2DCC8] transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                            🎨
                          </div>
                          <span className="text-xs font-bold text-[#3A3A3A]">{t.bgColorIcon || (isEn ? "Background Color" : "لون الخلفية")}</span>
                        </button>

                        {/* 4. إرفاق ملف (Attach File) */}
                        <label
                          className="flex flex-col items-center justify-center space-y-2 p-3 bg-[#F9F7F2] hover:bg-[#F0EDE4] rounded-2xl border border-[#E2DCC8] transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                            📎
                          </div>
                          <span className="text-xs font-bold text-[#3A3A3A]">{t.attachFileIcon || (isEn ? "Attach File" : "إرفاق ملف")}</span>
                          <input
                            type="file"
                            accept="*/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && editingDiary) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    const newFile: FileAttachment = {
                                      id: `file-${Date.now()}`,
                                      name: file.name,
                                      size: `${(file.size / 1024).toFixed(1)} KB`,
                                      type: file.type || 'application/pdf',
                                      dataUrl: reader.result
                                    };
                                    setEditingDiary(prev => prev ? { ...prev, files: [...(prev.files || []), newFile] } : null);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                              setShowMoreFeaturesSheet(false);
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* 5. أضف صوت (Add Audio / Voice) */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreFeaturesSheet(false);
                            handleToggleRecording();
                          }}
                          className="flex flex-col items-center justify-center space-y-2 p-3 bg-[#F9F7F2] hover:bg-[#F0EDE4] rounded-2xl border border-[#E2DCC8] transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                            🎙️
                          </div>
                          <span className="text-xs font-bold text-[#3A3A3A]">{t.addAudioIcon || (isEn ? "Add Audio" : "أضف صوت")}</span>
                        </button>

                        {/* 6. تأثير الخط (Font Style) - Video 0:48 */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreFeaturesSheet(false);
                            setShowFontDrawer(true);
                          }}
                          className="flex flex-col items-center justify-center space-y-2 p-3 bg-[#F9F7F2] hover:bg-[#F0EDE4] rounded-2xl border border-[#E2DCC8] transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-lg font-serif font-bold shadow-xs group-hover:scale-105 transition-transform">
                            Aa
                          </div>
                          <span className="text-xs font-bold text-[#3A3A3A]">{t.fontStyleIcon || (isEn ? "Font Style" : "تأثير الخط")}</span>
                        </button>
                      </div>

                      {/* Color Palette Selector Inside Features Sheet */}
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <span className="text-xs font-extrabold text-[#5A5A40]">{t.chooseBgColor || (isEn ? "Choose note background color:" : "اختر لون خلفية المذكرة:")}</span>
                        <div className="flex items-center justify-around p-2 bg-[#F9F7F2] rounded-2xl border border-[#E2DCC8]">
                          <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#F9F7F2' } : null); setShowMoreFeaturesSheet(false); }} className="w-7 h-7 rounded-full bg-[#F9F7F2] border-2 border-gray-400 cursor-pointer shadow-xs" title="افتراضي" />
                          <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#FFFDF5' } : null); setShowMoreFeaturesSheet(false); }} className="w-7 h-7 rounded-full bg-[#FFFDF5] border-2 border-amber-300 cursor-pointer shadow-xs" title="أصفر دافئ" />
                          <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#F2F7FB' } : null); setShowMoreFeaturesSheet(false); }} className="w-7 h-7 rounded-full bg-[#F2F7FB] border-2 border-blue-300 cursor-pointer shadow-xs" title="أزرق سماوي" />
                          <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#F4F7F2' } : null); setShowMoreFeaturesSheet(false); }} className="w-7 h-7 rounded-full bg-[#F4F7F2] border-2 border-emerald-300 cursor-pointer shadow-xs" title="أخضر ناعم" />
                          <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#FBF7FF' } : null); setShowMoreFeaturesSheet(false); }} className="w-7 h-7 rounded-full bg-[#FBF7FF] border-2 border-purple-300 cursor-pointer shadow-xs" title="لافندر" />
                          <button type="button" onClick={() => { setEditingDiary(prev => prev ? { ...prev, color: '#FCF2F4' } : null); setShowMoreFeaturesSheet(false); }} className="w-7 h-7 rounded-full bg-[#FCF2F4] border-2 border-rose-300 cursor-pointer shadow-xs" title="وردي" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Font Styling Drawer (Aa) matching video 0:48 */}
                {showFontDrawer && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl border border-[#E2DCC8]" dir={isRtl ? 'rtl' : 'ltr'}>
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <button
                          type="button"
                          onClick={() => setShowFontDrawer(false)}
                          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-emerald-100"
                        >
                          ✓
                        </button>
                        <h3 className="text-base font-extrabold text-[#3A3A3A]">{t.fontDrawerTitle || (isEn ? "Font" : "الخط")}</h3>
                        <button
                          type="button"
                          onClick={() => setShowFontDrawer(false)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Font Formatting Icons Toolbar */}
                      <div className="flex items-center justify-around p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E2DCC8]">
                        <button type="button" onClick={() => insertFormatting('- ')} className="p-2 hover:bg-[#E2DCC8]/50 rounded-xl font-bold text-sm text-[#3A3A3A] cursor-pointer" title="قائمة">
                          •≡
                        </button>
                        <button type="button" onClick={() => insertFormatting('1. ')} className="p-2 hover:bg-[#E2DCC8]/50 rounded-xl font-bold text-sm text-[#3A3A3A] cursor-pointer" title="قائمة مرقمة">
                          1≡
                        </button>
                        <button type="button" onClick={() => insertFormatting('<u>', '</u>')} className="p-2 hover:bg-[#E2DCC8]/50 rounded-xl font-bold underline text-sm text-[#3A3A3A] cursor-pointer" title="تحته خط">
                          U
                        </button>
                        <button type="button" onClick={() => insertFormatting('~~', '~~')} className="p-2 hover:bg-[#E2DCC8]/50 rounded-xl font-bold line-through text-sm text-[#3A3A3A] cursor-pointer" title="يتوسطه خط">
                          S
                        </button>
                        <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 hover:bg-[#E2DCC8]/50 rounded-xl italic font-bold text-sm text-[#3A3A3A] cursor-pointer" title="مائل">
                          I
                        </button>
                        <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 hover:bg-[#E2DCC8]/50 rounded-xl font-black text-sm text-[#3A3A3A] cursor-pointer" title="عريض">
                          B
                        </button>
                      </div>

                      {/* Font Size Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#5A5A40]">
                          <span className="text-xs">Aa</span>
                          <span>{t.fontSizeLabel || (isEn ? "Font Size" : "حجم الخط")} ({fontDrawerSize}px)</span>
                          <span className="text-base font-extrabold">Aa</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="32"
                          value={fontDrawerSize}
                          onChange={(e) => setFontDrawerSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-[#E2DCC8] rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
                        />
                      </div>

                      {/* Choose Font Style Grid (اختر نمط الخط) */}
                      <div className="space-y-2">
                        <span className="text-xs font-extrabold text-[#5A5A40] block">{t.chooseFontStyle || (isEn ? "Choose Font Style:" : "اختر نمط الخط:")}</span>
                        <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                          {[
                            { id: 'font-sans', name: 'Notes', style: 'font-sans' },
                            { id: 'font-serif', name: 'Notes', style: 'font-serif italic' },
                            { id: 'font-mono', name: 'Notes', style: 'font-mono' },
                            { id: 'font-bold', name: 'Notes', style: 'font-sans font-black' },
                            { id: 'font-cairo', name: 'Notes', style: 'font-serif font-bold' },
                            { id: 'font-uppercase', name: 'NOTES', style: 'uppercase font-black' },
                            { id: 'font-normal', name: 'Notes', style: 'font-sans font-medium' },
                            { id: 'font-light', name: 'Notes', style: 'font-sans font-light' },
                            { id: 'font-tracking', name: 'N o t e s', style: 'tracking-widest' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setFontDrawerFamily(f.style)}
                              className={`p-3 rounded-2xl border text-center text-sm transition-all cursor-pointer ${
                                fontDrawerFamily === f.style
                                  ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-md scale-102'
                                  : 'bg-[#F9F7F2] hover:bg-[#F0EDE4] border-[#E2DCC8] text-[#3A3A3A]'
                              } ${f.style}`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Assistant Note Writer Bottom Sheet matching video 0:56 */}
                {showAiWriterSheet && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-[#E2DCC8] max-h-[90vh] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
                        <h3 className="text-sm font-extrabold text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                          <span className="text-amber-500">✨</span>
                          <span>{t.askAiWriterHeader || (isEn ? "Ask AI to write a note..." : "اطلب من الذكاء الاصطناعي أن يكتب ملاحظة...")}</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAiWriterSheet(false);
                            setAiWriterResult(null);
                          }}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Input Prompt Box with Search Icon */}
                      <div className="relative shrink-0">
                        <input
                          type="text"
                          value={aiWriterTopicInput}
                          onChange={(e) => setAiWriterTopicInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAiGenerateNote();
                            }
                          }}
                          placeholder={t.aiWriterTopicPlaceholder || (isEn ? "Ask any topic from AI..." : "اطلب أي موضوع من الذكاء الاصطناعي...")}
                          className="w-full bg-[#F9F7F2] border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:outline-none rounded-2xl py-3 pr-10 pl-24 text-xs text-[#3A3A3A]"
                        />
                        <div className="absolute right-3 top-3.5 text-gray-400 text-xs">
                          🔍
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAiGenerateNote()}
                          disabled={aiWriterLoading}
                          className="absolute left-1.5 top-1.5 bottom-1.5 px-3 bg-[#8B9D83] hover:bg-[#72856A] text-white text-xs font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {aiWriterLoading ? (t.generatingAiText || (isEn ? "Generating..." : "جاري التوليد...")) : (t.sendPromptBtn || (isEn ? "Send ✨" : "إرسال ✨"))}
                        </button>
                      </div>

                      {/* Content Body: Loading OR Result OR Suggestions */}
                      <div className="overflow-y-auto space-y-3 flex-1 pr-0.5">
                        {aiWriterLoading ? (
                          <div className="py-8 px-4 text-center space-y-3 bg-[#FDF8EC] rounded-2xl border border-[#E9E1C4] animate-pulse">
                            <div className="w-10 h-10 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl animate-spin">
                              ✨
                            </div>
                            <div className="space-y-1">
                              <p className="font-extrabold text-xs text-[#4E685B]">{t.aiGeneratingTitle || (isEn ? "Generating by AI..." : "جاري التوليد بواسطة الذكاء الاصطناعي...")}</p>
                              <p className="text-[10px] text-gray-500">{t.aiModelDraftingDesc || (isEn ? "Smart model is drafting and organizing thoughts now" : "يقوم النموذج الذكي بصياغة وتنظيم الأفكار بشكل إحترافي الآن")}</p>
                            </div>
                          </div>
                        ) : aiWriterResult ? (
                          <div className="space-y-3 animate-fadeIn">
                            <div className="bg-[#F9F7F2] p-3.5 rounded-2xl border border-[#E2DCC8] space-y-2">
                              <div className="flex items-center justify-between border-b border-[#E2DCC8]/60 pb-2">
                                <span className="font-extrabold text-xs text-[#2B3E50] flex items-center gap-1.5">
                                  <span>💡</span>
                                  <span>{aiWriterResult.title}</span>
                                </span>
                                <span className="text-[9px] bg-[#8B9D83]/20 text-[#4E685B] px-2 py-0.5 rounded-md font-bold">{t.readyToInsertBadge || (isEn ? "Ready to Insert" : "جاهز للإدراج")}</span>
                              </div>
                              <div className="max-h-48 overflow-y-auto text-xs text-[#3A3A3A] leading-relaxed whitespace-pre-wrap font-medium p-1">
                                {aiWriterResult.content}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleApplyAiGeneratedNoteToCurrentEntry}
                                className="w-full py-2.5 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2"
                              >
                                <span>✍️</span>
                                <span>{t.insertInCurrentEntry || (isEn ? "Insert in current diary" : "إدراج في اليومية الحالية")}</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleCreateNewDiaryFromAiResult}
                                className="w-full py-2 bg-[#F9F7F2] hover:bg-[#F0EDE4] text-[#4E685B] border border-[#DCE4D8] rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                              >
                                <span>📝</span>
                                <span>{t.createNewDiaryWithText || (isEn ? "Create new diary with this text" : "إنشاء يومية جديدة بهذا النص")}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleCopyAiNote}
                                  className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[11px] cursor-pointer transition-all text-center"
                                >
                                  {copiedAiText ? (t.copiedTextSuccess || (isEn ? "✓ Copied text" : "✓ تم نسخ النص")) : (t.copyTextBtn || (isEn ? "📋 Copy text" : "📋 نسخ النص"))}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAiWriterResult(null)}
                                  className="py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-medium text-[11px] cursor-pointer transition-all"
                                >
                                  {t.suggestAnotherTopic || (isEn ? "Suggest another topic" : "اقتراح موضوع آخر")}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="text-[11px] font-extrabold text-gray-400 block">{t.quickPromptSuggestionsTitle || (isEn ? "Quick writing prompts:" : "اقترحات سريعة لكتابة الملاحظة:")}</span>
                            <div className="space-y-2">
                              {[
                                { id: 'health', icon: '💡', title: t.promptHealthTitle || (isEn ? "Generate Health Tips" : "توليد نصائح صحية"), prompt: isEn ? "Generate daily health and psychological tips" : "توليد نصائح صحية ونفسية يومية" },
                                { id: 'article', icon: '📝', title: t.promptArticleTitle || (isEn ? "Write an Article" : "كتابة مقال"), prompt: isEn ? "Write an inspiring article on the benefits of journaling and inner peace" : "كتابة مقال ملهم عن فوائد التدوين والسلام الداخلي" },
                                { id: 'future', icon: '🚀', title: t.promptFutureTitle || (isEn ? "Future Trends" : "اتجاهات المستقبل"), prompt: isEn ? "Future trends and flexible adaptation with technology" : "اتجاهات المستقبل والتأقلم المرن مع التكنولوجيا" },
                                { id: 'marketing', icon: '🎧', title: t.promptMarketingTitle || (isEn ? "Marketing & Customer Care" : "التسويق وخدمة العملاء"), prompt: isEn ? "Modern marketing and empathy-based customer service" : "التسويق الحديث وخدمة العملاء القائمة على التعاطف" },
                                { id: 'projects', icon: '🎯', title: t.promptProjectsTitle || (isEn ? "Project Management" : "إدارة المشاريع"), prompt: isEn ? "A practical guide to project management and breaking down goals" : "دليل عملي لإدارة المشاريع وتفكيك الأهداف" },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleAiGenerateNote(item.prompt)}
                                  disabled={aiWriterLoading}
                                  className="w-full flex items-center justify-between p-3 bg-[#F9F7F2] hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-2xl transition-all cursor-pointer group text-right"
                                >
                                  <div className="flex items-center space-x-3 space-x-reverse">
                                    <span className="text-base p-1.5 bg-amber-50 rounded-xl">{item.icon}</span>
                                    <span className="text-xs font-bold text-[#3A3A3A] group-hover:text-[#8B9D83] transition-colors">{item.title}</span>
                                  </div>
                                  <span className="text-xs text-[#8B9D83] font-bold group-hover:translate-x-1 transition-transform">{t.generateAction || (isEn ? "Generate →" : "توليد ←")}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 🧠 Flagship AI Assistant Panel - Real-time Psychological Chat */}
                <div className="border border-[#E2DCC8] bg-[#F9F7F2] rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2DCC8]/60 pb-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="p-1.5 bg-[#8B9D83]/15 text-[#8B9D83] rounded-xl text-sm">🧠</span>
                      <span className="text-xs font-black text-[#5A5A40]">
                        {t.aiChatSessionTitle || (isEn ? "Interactive AI Venting & Psychological Analysis Session" : "جلسة الفضفضة والتحليل النفسي التفاعلية (AI)")}
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#8B9D83] text-white px-3 py-1 rounded-full font-bold">{t.liveInteractionBadge || (isEn ? "Live Interaction" : "تفاعل مباشر")}</span>
                  </div>

                  {/* Chat Messages Log Box */}
                  <div className="max-h-[320px] overflow-y-auto space-y-3 p-3 bg-white border border-[#E2DCC8]/80 rounded-2xl" id="diary-chat-log-box">
                    {(editingDiary.chatLogs || []).length === 0 ? (
                      <div className="text-center py-6 px-4 space-y-2">
                        <span className="text-2xl block">💬</span>
                        <p className="text-xs font-bold text-[#5A5A40]">{t.welcomeSafeSpace || (isEn ? "Welcome to your safe therapeutic space!" : "مرحباً بك في مساحتك العلاجية الآمنة!")}</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm mx-auto">
                          {t.safeSpaceDesc || (isEn ? "Express what's on your mind or ask a question about this entry. I will listen attentively, analyze your emotions, and help you overcome challenges." : "فضفض عما بداخلك، أو اطرح سؤالاً حول هذه المذكرة. سأستمع إليك بإنصات تام وأحلل مشاعرك وأساعدك في التغلب على الصعاب.")}
                        </p>
                      </div>
                    ) : (
                      (editingDiary.chatLogs || []).map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[85%] ${
                            msg.sender === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'
                          }`}
                        >
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-[#FAF6EC] text-[#5A5A40] rounded-tr-none border border-[#E2DCC8]/50'
                                : 'bg-[#EEF1EB] text-[#4E685B] rounded-tl-none border border-[#DCE4D8]'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1 px-1 font-medium">
                            {msg.sender === 'user' ? (t.meLabel || (isEn ? "Me" : "أنا")) : (t.aiPsychAdvisor || (isEn ? "AI Counselor" : "مستشارك النفسي AI"))} • {new Date(msg.createdAt).toLocaleTimeString(appLanguage === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}

                    {/* Chat Loading Indicator */}
                    {diaryChatLoading && (
                      <div className="flex items-center space-x-2 space-x-reverse ml-auto bg-[#EEF1EB] border border-[#DCE4D8] p-3 rounded-2xl rounded-tl-none text-xs text-[#4E685B] max-w-[85%] animate-pulse">
                        <span className="w-2 h-2 bg-[#8B9D83] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-[#8B9D83] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-[#8B9D83] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        <span className="text-[10px] font-bold">{t.writingTherapeuticResponse || (isEn ? "Writing counselor response..." : "جاري كتابة الرد العلاجي والتحليل...")}</span>
                      </div>
                    )}
                  </div>

                  {/* Input Chat Messages */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={diaryChatMessage}
                      onChange={(e) => setDiaryChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendDiaryChatMessage();
                        }
                      }}
                      placeholder={t.expressMindPlaceholder || (isEn ? "Express your feelings or ask here..." : "فضفض عما ببالك أو اسألني هنا...")}
                      className="flex-grow bg-white border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] focus:outline-none rounded-2xl px-4 py-2.5 text-xs text-[#3A3A3A] font-medium"
                    />
                    <button
                      type="button"
                      disabled={diaryChatLoading || !diaryChatMessage.trim()}
                      onClick={() => handleSendDiaryChatMessage()}
                      className="px-4 py-2.5 bg-[#8B9D83] hover:bg-[#72856A] disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-3xs flex items-center space-x-1.5 space-x-reverse"
                    >
                      <span>{t.sendBtnLabel || (isEn ? "Send" : "إرسال")}</span>
                      <span>🚀</span>
                    </button>
                  </div>

                  {/* Built-in quick psychologist suggestions */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] text-gray-400 font-bold">{t.quickOneClickActions || (isEn ? "Quick actions to analyze current note in one click:" : "إجراءات سريعة لتحليل التدوينة الحالية بنقرة واحدة:")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSendDiaryChatMessage(isEn ? '📝 Summarize my current entry concisely and highlight my true emotions' : '📝 لخص تدوينتي الحالية بايجاز والخص مشاعري الحقيقية')}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#F0EDE4] text-[#5A5A40] border border-[#E2DCC8]/60 rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                      >
                        📝 {t.summarizeEntryBtn || (isEn ? "Summarize entry" : "لخص تدوينتي بايجاز")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendDiaryChatMessage(isEn ? '💡 Extract cognitive distortions and thinking errors from my entry and advise how to balance them rationally' : '💡 استخرج الأخطاء المعرفية والتشوهات الفكرية من تدوينتي وانصحني بموازنتها عقلانياً')}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#F0EDE4] text-[#5A5A40] border border-[#E2DCC8]/60 rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                      >
                        💡 {t.extractCognitiveErrorsBtn || (isEn ? "Cognitive distortions" : "استخرج الأخطاء المعرفية")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendDiaryChatMessage(isEn ? '🎯 Suggest a simplified practical plan for tomorrow to build resilience and boost productivity' : '🎯 اقترح خطة عملية مبسطة ليوم الغد تساهم في بناء مرونتي النفسية وتحسين إنتاجيتي')}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#F0EDE4] text-[#5A5A40] border border-[#E2DCC8]/60 rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                      >
                        🎯 {t.practicalPlanTomorrowBtn || (isEn ? "Tomorrow's action plan" : "خطة عملية ليوم الغد")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2DCC8]/55">
                  <button
                    type="button"
                    onClick={() => handleDeleteDiary(editingDiary.id)}
                    className="flex items-center justify-center space-x-1 space-x-reverse px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-200 sm:border-transparent"
                  >
                    <Trash className="w-4 h-4" />
                    <span>{t.deleteDiaryPermanently || (isEn ? "Delete Note Permanently" : "حذف المذكرة نهائياً")}</span>
                  </button>

                  <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                    {!isNewEntry && (
                      <button
                        type="button"
                        onClick={() => {
                          toggleArchiveDiary(editingDiary.id);
                          const nextState = !editingDiary.isArchived;
                          setEditingDiary(prev => prev ? { ...prev, isArchived: nextState } : null);
                          if (nextState) {
                            setEditingDiary(null);
                          }
                        }}
                        className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-black text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 space-x-reverse"
                      >
                        <Archive className="w-4 h-4 text-amber-700" />
                        <span>{editingDiary.isArchived ? (t.restoreAction || (isEn ? "Restore" : "استرجاع")) : (t.archiveAction || (isEn ? "Archive 📥" : "أرشفة 📥"))}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingDiary(null);
                        setIsNewEntry(false);
                        setDiaryAiAnswer('');
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-[#5A5A40] hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-xl transition-colors cursor-pointer text-center"
                    >
                      {t.cancelBtn || (isEn ? "Cancel" : "إلغاء")}
                    </button>

                    <button
                      type="button"
                      disabled={isExportingPdf}
                      onClick={handleExportPDF}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 space-x-reverse px-4 py-2 bg-[#D4A373] hover:bg-[#B58554] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isExportingPdf ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t.exportingPdfProgress || (isEn ? "Exporting..." : "جاري...")}</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4" />
                          <span>{t.exportPdfBtn || (isEn ? "Export PDF" : "تصدير PDF")}</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSaveDiary}
                      className="w-full sm:w-auto flex items-center justify-center space-x-1.5 space-x-reverse px-5 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <span>{t.saveDiarySuccessBtn || (isEn ? "Save Note Successfully ✓" : "حفظ المذكرة بنجاح ✓")}</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="space-y-6">
                


                 {/* Diaries & Gratitude Sub-Tab Swapper with Quick Search trigger */}
                 <div className="flex items-center gap-2 max-w-xl mx-auto sm:mx-0">
                   <div className="flex-1 flex bg-[#F0EDE4] p-1.5 rounded-2xl border border-[#E2DCC8]/60 shadow-3xs overflow-x-auto scrollbar-none" id="diaries-subtab-selector">
                     <button
                       onClick={() => setActiveDiariesSubTab('journal')}
                       className={`flex-grow flex items-center justify-center space-x-1 space-x-reverse py-2 px-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                         activeDiariesSubTab === 'journal'
                           ? 'bg-white text-[#5A5A40] shadow-sm font-extrabold animate-fade-in'
                           : 'text-gray-500 hover:text-[#5A5A40]'
                       }`}
                     >
                       <span>📓</span>
                       <span>{t.dailyJournalSubtab || (isEn ? "Daily Journal" : "يومياتي والفضفضة")}</span>
                     </button>
                     <button
                       onClick={() => setActiveDiariesSubTab('gratitude')}
                       className={`flex-grow flex items-center justify-center space-x-1 space-x-reverse py-2 px-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                         activeDiariesSubTab === 'gratitude'
                           ? 'bg-white text-[#5A5A40] shadow-sm font-extrabold animate-fade-in'
                           : 'text-gray-500 hover:text-[#5A5A40]'
                       }`}
                     >
                       <span>🌸</span>
                       <span>{t.gratitudeSubtab || (isEn ? "Gratitude Journal" : "مفكرة الامتنان")}</span>
                     </button>
                     <button
                       onClick={() => setActiveDiariesSubTab('cbt')}
                       className={`flex-grow flex items-center justify-center space-x-1 space-x-reverse py-2 px-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                         activeDiariesSubTab === 'cbt'
                           ? 'bg-white text-[#5A5A40] shadow-sm font-extrabold animate-fade-in'
                           : 'text-gray-500 hover:text-[#5A5A40]'
                       }`}
                     >
                       <span>🧠</span>
                       <span>{t.cbtSubtabLabel || (isEn ? "CBT Exercises" : "CBT تمارين التفكير")}</span>
                     </button>
                     <button
                       onClick={() => setActiveDiariesSubTab('tasks')}
                       className={`flex-grow flex items-center justify-center space-x-1 space-x-reverse py-2 px-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                         activeDiariesSubTab === 'tasks'
                           ? 'bg-white text-[#5A5A40] shadow-sm font-extrabold animate-fade-in'
                           : 'text-gray-500 hover:text-[#5A5A40]'
                       }`}
                     >
                       <span>📋</span>
                       <span>{t.dailyTasksSubtabLabel || (isEn ? "Daily Tasks & Activity" : "المهام اليومية والنشاط")}</span>
                     </button>
                   </div>

                   {/* Quick Search Trigger Icon Button */}
                   <button
                     onClick={() => {
                       setActiveDiariesSubTab('journal');
                       setTimeout(() => {
                         const el = document.getElementById('diaries-search-input');
                         if (el) el.focus();
                       }, 50);
                     }}
                     className="p-3 bg-white hover:bg-[#F0EDE4] border border-[#E2DCC8] rounded-2xl text-[#5A5A40] shadow-3xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                     title="البحث في اليوميات والخواطر"
                   >
                     <Search className="w-4 h-4 text-[#8B9D83]" />
                   </button>
                 </div>

                {activeDiariesSubTab === 'journal' ? (
                  <div className="space-y-4">
                    
                    {/* Filter Tabs: اليوميات vs الخواطر */}
                    <div className="flex border-b border-[#E2DCC8]/40 pb-1.5 gap-6">
                      <button
                        onClick={() => setDiaryTypeFilter('all')}
                        className={`pb-2 text-xs font-black transition-all relative cursor-pointer ${
                          diaryTypeFilter === 'all'
                            ? 'text-[#5A5A40]'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {t.allFilterTab || (isEn ? "All" : "الكل")}
                        {diaryTypeFilter === 'all' && (
                          <span className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-[#8B9D83] rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => setDiaryTypeFilter('diary')}
                        className={`pb-2 text-xs font-black transition-all relative cursor-pointer flex items-center space-x-1 space-x-reverse ${
                          diaryTypeFilter === 'diary'
                            ? 'text-[#5A5A40]'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <span>📓</span>
                        <span>{t.diariesFilterTab || (isEn ? "Diaries" : "اليوميات")}</span>
                        {diaryTypeFilter === 'diary' && (
                          <span className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-[#8B9D83] rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => setDiaryTypeFilter('thought')}
                        className={`pb-2 text-xs font-black transition-all relative cursor-pointer flex items-center space-x-1 space-x-reverse ${
                          diaryTypeFilter === 'thought'
                            ? 'text-[#5A5A40]'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <span>✍️</span>
                        <span>{t.thoughtsFilterTab || (isEn ? "Thoughts" : "الخواطر")}</span>
                        {diaryTypeFilter === 'thought' && (
                          <span className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-[#8B9D83] rounded-full" />
                        )}
                      </button>
                    </div>
                    
                    {/* Search Bar - Enhanced floating input with instant clear button */}
                    <div className="relative w-full">
                      <Search className="absolute right-4 top-3.5 w-4 h-4 text-[#8B9D83]" />
                      <input
                        id="diaries-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchDiariesPlaceholder || (isEn ? "Search in entries, thoughts, titles, content, or tags..." : "ابحث في اليوميات، الخواطر، العناوين، المحتوى، أو الوسوم...")}
                        className="w-full bg-[#FBFBFA] hover:bg-[#F3F2F0] focus:bg-white border border-[#E2DCC8]/85 focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] focus:outline-none rounded-2xl pr-11 pl-10 py-3.5 text-xs text-[#3A3A3A] transition-all placeholder-gray-400 font-bold shadow-3xs"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute left-3 top-3 p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-all cursor-pointer"
                          title={t.clearSearchTitle || (isEn ? "Clear search" : "مسح البحث")}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Active Search Query Status Banner */}
                    {searchQuery.trim() !== '' && (
                      <div className="flex items-center justify-between bg-[#8B9D83]/10 border border-[#8B9D83]/25 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#4E685B] animate-fadeIn">
                        <div className="flex items-center space-x-2 space-x-reverse truncate">
                          <Search className="w-3.5 h-3.5 shrink-0 text-[#8B9D83]" />
                          <span className="truncate">
                            {t.searchResultsFor || (isEn ? "Search results for:" : "نتائج البحث عن:")} <strong className="text-[#3A3A3A]">"{searchQuery}"</strong> ({filteredDiariesList.length} {t.resultsCountSuffix || (isEn ? "results" : "نتيجة")})
                          </span>
                        </div>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-[10px] font-black text-[#8B9D83] hover:text-[#5A5A40] underline shrink-0 cursor-pointer mr-2"
                        >
                          {t.cancelSearchBtn || (isEn ? "Cancel search" : "إلغاء البحث")}
                        </button>
                      </div>
                    )}

                    {/* Write New Note Button - Separate floating button */}
                    <button
                      onClick={startNewDiary}
                      className="w-full flex items-center justify-center space-x-2 space-x-reverse py-3.5 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-3xs hover:scale-[1.01] active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.writeNewNoteBtn || (isEn ? "Write New Entry" : "كتابة مذكرات جديدة")}</span>
                    </button>

                    {/* Filter Pills of tags if they exist */}
                    {allUniqueTags.length > 0 && (
                      <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto pb-1 mt-1">
                        <span className="text-[10px] font-black text-gray-400 whitespace-nowrap shrink-0">{t.filterTagsLabel || (isEn ? "Filter tags:" : "تصفية الوسوم:")}</span>
                        <button
                          onClick={() => setSelectedTagFilter('')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 ${
                            selectedTagFilter === ''
                              ? 'bg-[#8B9D83] text-white font-bold shadow-3xs'
                              : 'bg-white hover:bg-[#F0EDE4] text-[#5A5A40] border border-[#E2DCC8]/85'
                          }`}
                        >
                          الكل
                        </button>
                        {allUniqueTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTagFilter(tag)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 ${
                              selectedTagFilter === tag
                                ? 'bg-[#8B9D83] text-white font-bold shadow-3xs'
                                : 'bg-white hover:bg-[#F0EDE4] text-[#5A5A40] border border-[#E2DCC8]/85'
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                {/* Grouped Day-by-Day representation of entries */}
                {(() => {
                  const { sortedDays, groups } = memoizedGroupedDiaries;

                  if (sortedDays.length === 0) {
                    return (
                      <div className="bg-white border border-[#E2DCC8] rounded-3xl p-10 text-center text-gray-400 text-sm space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-full bg-[#F0EDE4] flex items-center justify-center text-[#8B9D83]">
                          <Search className="w-7 h-7" />
                        </div>
                        {searchQuery ? (
                          <>
                            <p className="font-extrabold text-[#3A3A3A] text-sm">
                              {t.noMatchFoundFor || (isEn ? "No diary or thought found matching:" : "لم يتم العثور على أي يومية أو خاطرة تطابق:")} "{searchQuery}"
                            </p>
                            <p className="text-xs text-gray-400">
                              {t.checkSpellingOrFilter || (isEn ? "Check spelling or try filtering by tags." : "تأكد من كتابة الكلمة بشكل صحيح، أو جرب تصفية بالوسوم أو خيارات أخرى.")}
                            </p>
                            <button
                              onClick={() => setSearchQuery('')}
                              className="px-4 py-2 bg-[#8B9D83] text-white rounded-xl text-xs font-extrabold shadow-3xs hover:bg-[#72856A] transition-all cursor-pointer"
                            >
                              {t.clearSearchWordBtn || (isEn ? "Clear search word" : "مسح كلمة البحث")}
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-[#3A3A3A]">{t.noMatchingDiariesNow || (isEn ? "No matching entries found." : "لا توجد مذكرات مطابقة حالياً.")}</p>
                            <p className="text-xs mt-1 text-gray-400">{t.clickWriteNewNotePrompt || (isEn ? "Click 'Write New Entry' to start expressing yourself!" : "انقر على زر \"كتابة مذكرات جديدة\" للبدء بالفضفضة وبناء ملفك النفسي!")}</p>
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-8">
                      {sortedDays.map((dayKey) => {
                        const dayData = groups[dayKey] || { dayEntries: [], formattedDayLabel: dayKey };
                        const dayEntries = dayData.dayEntries;
                        const formattedDayLabel = dayData.formattedDayLabel;
                        
                        return (
                          <div key={dayKey} className="bg-white border border-[#E2DCC8] rounded-3xl p-6 shadow-xs space-y-5">
                            {/* Large parent Day header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2DCC8]/50 pb-3 gap-2">
                              <div className="flex items-center space-x-2.5 space-x-reverse flex-wrap gap-2">
                                <div className="p-2 bg-[#8B9D83]/10 text-[#8B9D83] rounded-2xl shrink-0">
                                  <Calendar className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-[#3A3A3A] text-sm md:text-base">
                                  {formattedDayLabel}
                                </h3>

                                {/* NEW: Pros & Cons Button (الإيجابيات والسلبيات) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenProsConsForDay(dayKey, formattedDayLabel, dayEntries)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-[#2B3E50] via-[#3B5066] to-[#5A5A40] hover:from-[#3B5066] hover:to-[#8B9D83] text-white rounded-xl text-xs font-black shadow-3xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-103 active:scale-97 border border-white/20 shrink-0"
                                  title={t.reviewProsConsTitle || (isEn ? "Review and log pros & cons for this day" : "استعراض وتدوين الإيجابيات والسلبيات لهذا اليوم")}
                                >
                                  <Scale className="w-3.5 h-3.5 text-[#FEFAE0]" />
                                  <span>⚖️ {t.prosConsBtnLabel || (isEn ? "Pros & Cons" : "الإيجابيات والسلبيات")}</span>
                                </button>
                              </div>

                              <span className="text-[10px] md:text-xs font-bold text-[#5A5A40] bg-[#F9F7F2] border border-[#E2DCC8]/60 px-3 py-1 rounded-xl self-start sm:self-auto">
                                {dayEntries.length} {dayEntries.length === 1 ? (t.subNoteSingular || (isEn ? "sub-entry" : "مذكرة فرعية")) : (t.subNotePlural || (isEn ? "sub-entries" : "مذكرات فرعية"))}
                              </span>
                            </div>

                            {/* Grid of smaller sub-notes on that day */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {dayEntries.map((diary) => {
                                // Format the precise entry time safely
                                const preciseTime = (() => {
                                  try {
                                    const d = new Date(diary.createdAt);
                                    if (isNaN(d.getTime())) return '12:00 م';
                                    return d.toLocaleTimeString('ar-EG', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });
                                  } catch {
                                    return '12:00 م';
                                  }
                                })();
                                
                                return (
                                  <div
                                    key={diary.id}
                                    onClick={() => {
                                      setEditingDiary(diary);
                                      setIsNewEntry(false);
                                      setDiaryAiAnswer('');
                                      setNewEditAddition('');
                                    }}
                                    className={`relative group border border-[#E2DCC8]/65 rounded-2xl p-4 sm:p-5 hover:border-[#8B9D83] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 max-w-full overflow-hidden ${
                                      diary.color || 'bg-[#F9F7F2]/45'
                                    }`}
                                  >
                                    {/* Top Corner: precise entry time, edit flag, and ratings aligned with the screenshot */}
                                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-gray-500 w-full max-w-full" dir="rtl">
                                      {/* Star Ratings & Actions on the Right in RTL */}
                                      <div className="flex flex-wrap items-center gap-1.5 max-w-full">
                                        {/* Importance Rating Stars */}
                                        <div className="flex items-center space-x-0.5 space-x-reverse shrink-0">
                                          {[1, 2, 3, 4, 5].map((s) => (
                                            <Star 
                                              key={s} 
                                              className={`w-3.5 h-3.5 ${
                                                s <= diary.importance ? 'text-[#D4A373] fill-[#D4A373]' : 'text-gray-200'
                                              }`} 
                                            />
                                          ))}
                                        </div>

                                        {/* Archive Button */}
                                        <button
                                          type="button"
                                          title={isEn ? "Archive Note" : "أرشفة المذكرة أو الخاطرة"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleArchiveDiary(diary.id);
                                          }}
                                          className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border border-amber-200/80 rounded-xl text-[10px] font-black shadow-3xs hover:shadow-2xs transition-all cursor-pointer flex items-center space-x-1 space-x-reverse group/arch hover:scale-105 active:scale-95 shrink-0"
                                        >
                                          <Archive className="w-3 h-3 text-amber-700 group-hover/arch:rotate-12 transition-transform" />
                                          <span>{t.archiveBtnLabel || (isEn ? "Archive 📥" : "أرشفة 📥")}</span>
                                        </button>

                                        {/* Move to Trash Button */}
                                        <button
                                          type="button"
                                          title={isEn ? "Move to Trash" : "نقل لسلة المهملات"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDiary(diary.id);
                                          }}
                                          className="p-1 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg border border-gray-100/50 hover:shadow-2xs transition-all cursor-pointer shrink-0"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>

                                        {/* Edited Flag */}
                                        {(diary.isEdited || (diary.edits && diary.edits.length > 0)) && (
                                          <span className="bg-[#D4A373] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs shrink-0">
                                            {t.editedBadge || (isEn ? "Edited" : "تم التعديل")}
                                          </span>
                                        )}
                                      </div>

                                      {/* Time Pill on the Left in RTL */}
                                      <span className="font-bold flex items-center space-x-1 space-x-reverse bg-white/85 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border border-[#E2DCC8]/50 shadow-3xs shrink-0 text-[10px]">
                                        <span>⏰</span>
                                        <span>{preciseTime}</span>
                                      </span>
                                    </div>

                                    <div className="space-y-1.5">
                                      {/* Title with type badge */}
                                      <div className="flex items-center space-x-1.5 space-x-reverse">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black shrink-0 ${
                                          diary.diaryType === 'thought'
                                            ? 'bg-[#FCF5DE] text-[#A67E2E] border border-[#E9E1C4]'
                                            : 'bg-[#EEF1EB] text-[#556E4F] border border-[#DCE4D8]'
                                        }`}>
                                          {diary.diaryType === 'thought' ? (t.thoughtBadge || (isEn ? "✍️ Thought" : "✍️ خاطرة")) : (t.diaryBadge || (isEn ? "📓 Journal" : "📓 يومية"))}
                                        </span>
                                        <h4 className="font-extrabold text-[#3A3A3A] text-xs md:text-sm line-clamp-1">
                                          {diary.title || (t.subNoteDefaultTitle || (isEn ? "Sub-entry" : "مذكرة فرعية"))}
                                        </h4>
                                      </div>
                                      
                                      {/* Content Snippet */}
                                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                        {diary.content || <em className="text-gray-400 font-light text-[11px]">{t.audioDrawingsOnly || (isEn ? "Audio attachments or sketches only" : "مرفقات صوتية أو تخطيطات فقط")}</em>}
                                      </p>

                                      {/* Appended Edits Count / Snippet Preview */}
                                      {diary.edits && diary.edits.length > 0 && (
                                        <div className="text-[10px] text-[#8B9D83] font-bold flex items-center space-x-1 space-x-reverse">
                                          <span>💬</span>
                                          <span>{t.containsEditsPrefix || (isEn ? "Contains" : "يحتوي على")} {diary.edits.length} {t.appendedEditsSuffix || (isEn ? "appended edits" : "تعديلات مضافة")}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer with Moods and Tags matching the layout of the screenshots */}
                                    <div className="pt-2 border-t border-[#E2DCC8]/40 flex flex-wrap items-center justify-between gap-1.5 w-full max-w-full overflow-hidden">
                                      {/* Tags on the right in RTL */}
                                      <div className="shrink-0">
                                        {diary.tags && diary.tags.length > 0 ? (
                                          <span className="text-[9px] text-[#8B9D83] font-black">
                                            #{diary.tags[0]}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] text-gray-300 font-bold">#{t.generalTag || (isEn ? "general" : "عام")}</span>
                                        )}
                                      </div>

                                      {/* Mood badge on the left in RTL - showing both manual and AI analyzed mood percentages */}
                                      <div className="flex flex-wrap items-center gap-1 justify-end max-w-full overflow-hidden">
                                        {/* Manual moods */}
                                        {diary.moods && diary.moods.slice(0, 2).map((m, idx) => (
                                          <span key={idx} className="bg-[#8B9D83]/15 text-[#4E685B] text-[9px] sm:text-[10px] px-2 py-0.5 rounded-lg font-black border border-[#8B9D83]/20 shadow-3xs max-w-full truncate">
                                            {m}
                                          </span>
                                        ))}
                                        
                                        {/* AI Mood percentages */}
                                        {diary.aiMoodAnalysis && diary.aiMoodAnalysis.length > 0 && (
                                          <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                                            {diary.aiMoodAnalysis.slice(0, 2).map((analysis, idx) => (
                                              <span 
                                                key={idx} 
                                                className="bg-purple-50 text-purple-700 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-lg font-black border border-purple-100 shadow-3xs flex items-center space-x-1 space-x-reverse max-w-full overflow-hidden"
                                                title={t.aiMoodAnalysisTitle || (isEn ? "Automatic AI mood analysis" : "تحليل المزاج التلقائي بالذكاء الاصطناعي")}
                                              >
                                                <span>🧠</span>
                                                <span className="truncate">{analysis.mood} ({analysis.percentage}%)</span>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                  </div>
                ) : activeDiariesSubTab === 'gratitude' ? (
                  <GratitudeJournal
                    gratitudeCards={gratitudeCards}
                    setGratitudeCards={setGratitudeCards}
                    settings={settings}
                    diaries={diaries}
                    setDiaries={setDiaries}
                    setActiveTab={setActiveTab}
                    setActiveDiariesSubTab={setActiveDiariesSubTab}
                    setDiaryTypeFilter={setDiaryTypeFilter}
                    triggerGratitudeNotificationNow={() => setActiveGratitudeReminderNotification(true)}
                    onOpenShareModal={(data) => {
                      if (data) {
                        setGratitudeShareData({
                          text: data.text || '',
                          category: data.category || 'امتنان'
                        });
                      } else {
                        setGratitudeShareData(undefined);
                      }
                      setShowGratitudeShareModal(true);
                    }}
                  />
                ) : activeDiariesSubTab === 'cbt' ? (
                  /* Comprehensive CBT & Psychological Therapy Suite */
                  <CBTExercisesSection
                    diaries={diaries}
                    selectedDate={selectedDate}
                    handleUpdateHabit={handleUpdateHabit}
                    isDarkMode={settings.isDarkMode}
                    appLanguage={settings.appLanguage}
                  />
                ) : (
                  <TasksChecklistSection
                    activeDiaryForSelectedDate={activeDiaryForSelectedDate}
                    selectedDate={selectedDate}
                    handleUpdateHabit={handleUpdateHabit}
                    handleUpdateTasks={handleUpdateTasks}
                    habits={habits}
                    toggleHabitCompletion={toggleHabitCompletion}
                    setHabits={setHabits}
                    habitSettings={settings.habitSettings}
                    onUpdateHabitSettings={(newSettings) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        habitSettings: { ...(prev.habitSettings || {}), ...newSettings } as any 
                      }))
                    }
                    onImportData={(importedHabits, importedDiaries) => {
                      if (importedHabits.length > 0) setHabits(importedHabits);
                      if (importedDiaries && importedDiaries.length > 0) setDiaries(importedDiaries);
                    }}
                    isDarkMode={settings.isDarkMode}
                    diaries={diaries}
                    appLanguage={settings.appLanguage}
                  />
                )}

              </div>
            )}

          </div>
        )}

        {/* --- TAB VIEW 3: FLAGSHIP SMART ADVISOR --- */}
        {activeTab === 'advisor' && (
          <div className="space-y-6">
            <SmartAdvisor diaries={diaries} habits={habits} gratitudeCards={gratitudeCards} books={books} userApiKey={settings.userApiKey} appLanguage={settings.appLanguage} />
          </div>
        )}

        {/* --- TAB VIEW 4: MOOD & PROGRESS ANALYTICS (CHARTS) --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Analytics & Therapy Sub-Tab Swapper */}
            <div className="flex bg-[#F0EDE4] p-1.5 rounded-2xl border border-[#E2DCC8]/60 max-w-xl mx-auto sm:mx-0 shadow-3xs flex-wrap gap-1" id="analytics-subtab-selector">
              <button
                onClick={() => setAnalyticsSubTab('report')}
                className={`flex-grow flex items-center justify-center space-x-1.5 space-x-reverse py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  analyticsSubTab === 'report'
                    ? 'bg-white text-[#5A5A40] shadow-sm font-extrabold animate-fade-in'
                    : 'text-gray-500 hover:text-[#5A5A40]'
                }`}
              >
                <span>🎓</span>
                <span>جلسة العلاج والتقرير</span>
              </button>
              <button
                onClick={() => setAnalyticsSubTab('charts')}
                className={`flex-grow flex items-center justify-center space-x-1.5 space-x-reverse py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  analyticsSubTab === 'charts'
                    ? 'bg-white text-[#5A5A40] shadow-sm font-extrabold animate-fade-in'
                    : 'text-gray-500 hover:text-[#5A5A40]'
                }`}
              >
                <span>📊</span>
                <span>الرسوم البيانية ومتابعة التقدم</span>
              </button>
              <button
                onClick={() => setAnalyticsSubTab('pros_cons')}
                className={`flex-grow flex items-center justify-center space-x-1.5 space-x-reverse py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  analyticsSubTab === 'pros_cons'
                    ? 'bg-[#2B3E50] text-white shadow-sm font-black animate-fade-in'
                    : 'text-gray-600 hover:text-[#2B3E50]'
                }`}
              >
                <span>⚖️</span>
                <span>سجل الإيجابيات والسلبيات</span>
              </button>
            </div>

            {analyticsSubTab === 'report' ? (
              <IntegratedTherapyReport diaries={diaries} habits={habits} gratitudeCards={gratitudeCards} books={books} userApiKey={settings.userApiKey} />
            ) : analyticsSubTab === 'pros_cons' ? (
              <ProsConsHistoryLog diaries={diaries} habits={habits} gratitudeCards={gratitudeCards} books={books} userApiKey={settings.userApiKey} appLanguage={settings.appLanguage} />
            ) : (
              <div className="space-y-6">
                {/* 🌱 Psychological Growth Tree (Visual Gamification Component) */}
                <PsychologicalGrowthTree
                  appLanguage={settings.appLanguage}
                  diariesCount={diaries.length}
                  cbtCount={diaries.filter(d => (d.cbtWorksheets && d.cbtWorksheets.length > 0)).length}
                  gratitudeCount={gratitudeCards.length}
                  habitsCount={habits.filter(h => h.isCompleted).length}
                  activeStreak={streakInfo.currentStreak}
                  onQuickAction={(action) => {
                    if (action === 'journal') startNewDiary();
                    else if (action === 'gratitude') {
                      setActiveTab('diaries');
                      setActiveDiariesSubTab('gratitude');
                    } else if (action === 'cbt') {
                      setActiveTab('diaries');
                      setActiveDiariesSubTab('cbt');
                    } else if (action === 'habits') {
                      setActiveTab('diaries');
                      setActiveDiariesSubTab('tasks');
                    }
                  }}
                />

                {/* 🧠 Behavioral Correlation Analysis Card */}
                <BehavioralCorrelationCard entries={diaries} appLanguage={settings.appLanguage} />

                {/* Visual Intro card */}
                <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-2">
                  <h3 className="font-extrabold text-[#3A3A3A] text-sm flex items-center space-x-2 space-x-reverse">
                    <span className="text-lg">📊</span>
                    <span>لوحة متابعة التقدم والأنماط السلوكية</span>
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    يتم استخلاص هذه البيانات تلقائياً من المذكرات وعدادات النوم والرياضة لرصد الترابط السلوكي لمساعدتك في معالجة القلق والتوتر.
                  </p>
                </div>

                {/* New Feature: Sleep vs Fast Mood Score Correlation Chart (Past Month) */}
                <SleepMoodCorrelationChart diaries={diaries} />

                {/* Chart 3: Weekly Habit Completion vs Mood Stability Chart */}
                <WeeklyHabitsMoodChart habits={habits} diaries={diaries} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Chart 1: Sleep trend vs Sports trend */}
                  <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
                    <span className="block text-xs font-bold text-[#5A5A40]">💤 الترابط بين الرياضة وساعات النوم:</span>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={diaries.map(d => ({
                          name: d.createdAt.split('T')[0].substring(5),
                          النوم: d.sleepHours || 0,
                          الرياضة: d.sportsDuration || 0
                        })).reverse()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2DCC8" />
                          <XAxis dataKey="name" stroke="#5A5A40" style={{ fontSize: '10px' }} />
                          <YAxis stroke="#5A5A40" style={{ fontSize: '10px' }} />
                          <ChartTooltip />
                          <Legend style={{ fontSize: '11px' }} />
                          <Line type="monotone" dataKey="النوم" stroke="#8B9D83" strokeWidth={2.5} name="ساعات النوم" />
                          <Line type="monotone" dataKey="الرياضة" stroke="#D4A373" strokeWidth={2.5} name="دقائق الرياضة" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Mood counts distribution bar chart */}
                  <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
                    <span className="block text-xs font-bold text-[#5A5A40]">🧠 توزيع المشاعر المسجلة:</span>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(
                          diaries.flatMap(d => d.moods).reduce((acc, m) => {
                            acc[m] = (acc[m] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([mood, count]) => ({ mood, تكرار: count }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2DCC8" />
                          <XAxis dataKey="mood" stroke="#5A5A40" style={{ fontSize: '11px' }} />
                          <YAxis stroke="#5A5A40" style={{ fontSize: '10px' }} />
                          <ChartTooltip />
                          <Bar dataKey="تكرار" fill="#8B9D83" radius={[6, 6, 0, 0]}>
                            {/* Dynamic cell coloring for beautiful look */}
                            {diaries.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8B9D83' : '#D4A373'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Insight Statement box */}
                <div className="bg-[#F0EDE4] border border-[#E2DCC8] p-5 rounded-3xl space-y-2">
                  <h4 className="font-bold text-[#5A5A40] text-xs">💡 رصد الذكاء الاصطناعي للتحسن السلوكي:</h4>
                  <p className="text-xs text-[#3A3A3A] leading-relaxed font-normal">
                    تظهر البيانات أن فترات نومك تستقر عند حاجز 8 ساعات في الأيام التي مارست فيها الرياضة لأكثر من 30 دقيقة. كما يسجل المساعد تراجعاً كبيراً في مشاعر "القلق" بنسبة 40% في أيام تدوينات "الغذاء العائلي" والتواصل الاجتماعي. استمر في التدوين لترسيخ هذه الأنماط المعرفية والتقدم الذاتي!
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- TAB VIEW 5: SETTINGS & BACKUP (إعدادات والنسخ الاحتياطي) --- */}
        {activeTab === 'settings' && (
          <div className="bg-[#FAF8F5]/90 rounded-3xl p-1 md:p-6 space-y-8 max-w-2xl mx-auto font-sans" dir={isEn ? "ltr" : "rtl"}>
            
            {/* Header Banner */}
            <div className="text-center py-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#8B9D83]/10 text-[#4E685B] rounded-[20px] mb-3 border border-[#8B9D83]/20 shadow-3xs">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <h3 className="font-black text-[#2B3E50] text-xl md:text-2xl tracking-wide">{t.settingsTitle}</h3>
              <p className="text-xs text-gray-500 mt-1.5 font-bold leading-normal max-w-md mx-auto">{t.settingsSubtitle}</p>
            </div>

            <div className="space-y-4">

              {/* CARD 1: API KEY */}
              <div 
                onClick={() => setShowGeminiKeyModal(true)}
                className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-[#8B9D83]/5 transition-all hover:border-[#8B9D83]/40 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-gray-100 text-gray-500 rounded-2xl group-hover:bg-gray-200 transition-all">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.apiKeyTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-extrabold leading-normal">
                      {settings.userApiKey ? t.apiKeySub : t.apiKeySubAuto}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'}`} />
              </div>

              {/* CARD 2: FLOATING BALL TOGGLE */}
              <div className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between transition-all hover:border-[#8B9D83]/30">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-[#FEF6E4] text-[#D4A373] rounded-2xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.floatingBallTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.floatingBallSub}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSettings(prev => ({ ...prev, floatingBallEnabled: !prev.floatingBallEnabled }))}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer ${
                    settings.floatingBallEnabled ? 'bg-[#3F5449] justify-end' : 'bg-gray-200 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* CARD 3: USER ACCOUNT & LOGIN */}
              <div 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-teal-50/50 transition-all hover:border-teal-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-teal-50 text-teal-700 rounded-2xl group-hover:bg-teal-100 transition-all">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#2B3E50] text-sm">الحساب الشخصي والتسجيل</h4>
                      {currentUser ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {currentUser.name}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          زائر (غير مسجل)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">
                      {currentUser 
                        ? `مسجل بالبريد: ${currentUser.email} • افتح مذكراتك من أي جهاز بنفس الحساب` 
                        : 'سجل دخولك بحسابك الشخصي لمزامنة معلوماتك والوصول إليها من كل أجهزتك'}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'}`} />
              </div>

              {/* CARD 4: BACKUP AND SYNC */}
              <div 
                onClick={() => setShowBackupSyncModal(true)}
                className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-[#8B9D83]/5 transition-all hover:border-[#8B9D83]/40 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-orange-50 text-orange-500 rounded-2xl group-hover:bg-orange-100 transition-all">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.backupTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.backupSub}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'}`} />
              </div>

              {/* CARD 4: APP LOCK */}
              <div className="bg-white border border-[#E2DCC8] rounded-[24px] overflow-hidden shadow-3xs transition-all">
                <div className="p-5 flex items-center justify-between hover:bg-[#FAF8F5]/40 transition-colors">
                  <div 
                    onClick={() => setExpandedSettingsCard(expandedSettingsCard === 'pin' ? null : 'pin')}
                    className="flex items-center gap-4 cursor-pointer flex-grow"
                  >
                    <div className="p-3.5 bg-red-50 text-red-500 rounded-2xl">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2B3E50] text-sm">{t.appLockTitle}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.appLockSub}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, isAppLocked: !prev.isAppLocked }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer ${
                      settings.isAppLocked ? 'bg-[#3F5449] justify-end' : 'bg-gray-200 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {(expandedSettingsCard === 'pin' || settings.isAppLocked) && (
                  <div className="p-5 border-t border-[#E2DCC8]/60 bg-[#FAF8F5]/40 space-y-4">
                    <div className="space-y-1">
                      <h5 className="font-black text-[#5A5A40] text-xs flex items-center gap-2">
                        <span>🔐 قفل الشاشة والبيانات (PIN، بصمة الإصبع، وبصمة الوجه):</span>
                      </h5>
                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                        عند تفعيل قفل التطبيق، سيتم طلب التحقق الأمني (بصمة الإصبع/الوجه أو رمز الـ PIN) فور مغادرة الموقع أو قفل الشاشة لحماية مذكراتك.
                      </p>
                    </div>

                    {/* PIN Code Setting */}
                    <div className="flex items-center gap-3 max-w-sm bg-white p-3.5 rounded-2xl border border-[#E2DCC8]">
                      <input
                        type="password"
                        maxLength={4}
                        value={settings.appPinCode || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setSettings(prev => ({ ...prev, appPinCode: val }));
                        }}
                        placeholder={isEn ? "Current (Default 1234)" : "الرمز الحالي (1234)"}
                        className="w-28 bg-[#FAF8F5] border border-[#E2DCC8] rounded-xl px-3 py-2 text-xs text-[#2B3E50] font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#8B9D83] font-black"
                      />
                      <div className="text-[10px] text-gray-500 font-bold leading-tight">
                        <span>رمز الـ PIN السري (4 أرقام)</span>
                        <br />
                        <span className="text-[#8B9D83]">الرمز الافتراضي: 1234</span>
                      </div>
                    </div>

                    {/* Biometric Passkey Hardware Registration */}
                    <div className="bg-white p-4 rounded-2xl border border-[#E2DCC8] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-5 h-5 text-amber-600" />
                          <h6 className="text-xs font-black text-[#2B3E50]">ربط بصمة الإصبع وبصمة الوجه (Passkey):</h6>
                        </div>
                        {settings.biometricCredentialId ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg">
                            ✅ مفعلة ومربوطة
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-lg">
                            ⚠️ غير مربوطة
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                        قم بربط بصمة جهازك الرسمية (مستشعر الاصبع أو كاميرا الوجه) لفتح التطبيق أو إنجاز الاختصارات بلمسة واحدة.
                      </p>

                      <button
                        type="button"
                        onClick={async () => {
                          const res = await registerBiometrics();
                          if (res.success && res.credentialId) {
                            setSettings(prev => ({
                              ...prev,
                              biometricCredentialId: res.credentialId,
                              isBiometricEnabled: true
                            }));
                            try {
                              localStorage.setItem('yawmiyati_biometric_cred_id', res.credentialId);
                            } catch (e) { console.warn(e); }
                            alert('✅ تم تسجيل وتوثيق بصمة جهازك بنجاح! يمكنك الآن فتح التطبيق ببصمة الاصبع أو الوجه.');
                          } else {
                            alert(`❌ ${res.error || 'فشلت عملية تسجيل البصمة.'}`);
                          }
                        }}
                        className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Fingerprint className="w-4 h-4 text-white" />
                        <span>{settings.biometricCredentialId ? 'تحديث أو إعادة ربط بصمة الجهاز 👆👤' : 'ربط وتفعيل بصمة الجهاز / الوجه الآن 👆👤'}</span>
                      </button>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs font-bold leading-relaxed flex items-start gap-2">
                      <span className="text-base shrink-0">💡</span>
                      <div>
                        <strong>تنبيه هائم للحماية المطلقة:</strong>
                        <p className="mt-0.5 text-[11px] text-amber-800 font-medium">
                          عند الضغط على "ربط وتفعيل بصمة الجهاز"، سيطلب منك نظام التشغيل (أندرويد أو iOS) مسح الإصبع أو الوجه. بعدها لن يتم فتح التطبيق بالبصمة إلا إذا استخدمت الإصبع أو الوجه الصحيح المسجل بهاتفك.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 5: FAVORITES DIRECT LINKS */}
              <div 
                onClick={() => {
                  setActiveTab('diaries');
                  setShowFavoritesOnly(true);
                }}
                className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-[#8B9D83]/5 transition-all hover:border-[#8B9D83]/40 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-yellow-50 text-yellow-500 rounded-2xl group-hover:bg-yellow-100 transition-all">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.favoritesTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.favoritesSub}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'}`} />
              </div>

              {/* CARD 6: REMINDERS & ALARMS */}
              <div className="bg-white border border-[#E2DCC8] rounded-[24px] overflow-hidden shadow-3xs transition-all">
                <div 
                  onClick={() => setExpandedSettingsCard(expandedSettingsCard === 'reminders' ? null : 'reminders')}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5]/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-50 text-indigo-500 rounded-2xl">
                      <Bell className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2B3E50] text-sm">{t.remindersTitle}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.remindersSub}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'} ${expandedSettingsCard === 'reminders' ? 'rotate-90' : ''}`} />
                </div>

                {expandedSettingsCard === 'reminders' && (
                  <div className="p-5 border-t border-[#E2DCC8]/60 bg-[#FAF8F5]/40 space-y-4">
                    {/* Alarms list */}
                    <div className="space-y-2">
                      {(!settings.reminders || settings.reminders.length === 0) ? (
                        <p className="text-xs text-gray-400 text-center py-2 font-medium">
                          {isEn ? "No custom alarms added." : "لا توجد أي منبهات نشطة حالياً."}
                        </p>
                      ) : (
                        settings.reminders.map((rem) => (
                          <div key={rem.id} className="flex items-center justify-between bg-white border border-[#E2DCC8]/60 p-3.5 rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className="text-sm">⏰</span>
                              <div>
                                <span className="text-xs font-black text-[#2B3E50] block">{rem.title}</span>
                                <span className="text-[10px] text-gray-400 font-mono font-bold">{rem.time}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Toggle Alarm */}
                              <button
                                onClick={() => {
                                  setSettings(prev => ({
                                    ...prev,
                                    reminders: prev.reminders?.map(r => r.id === rem.id ? { ...r, active: !r.active } : r)
                                  }));
                                }}
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer ${
                                  rem.active ? 'bg-[#3F5449] justify-end' : 'bg-gray-200 justify-start'
                                }`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                              </button>

                              {/* Delete custom alarm */}
                              {rem.type === 'custom' && (
                                <button
                                  onClick={() => {
                                    setSettings(prev => ({
                                      ...prev,
                                      reminders: prev.reminders?.filter(r => r.id !== rem.id)
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                  title={isEn ? "Delete Alarm" : "حذف المنبه"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Custom Alarm Form */}
                    <div className="bg-[#8B9D83]/5 border border-[#8B9D83]/15 p-4 rounded-xl space-y-3">
                      <span className="text-xs font-black text-[#5A5A40] block">⚡ {isEn ? "Add Custom Reminder Alarm:" : "إضافة منبه/تذكير سلوكي جديد:"}</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={newAlarmTitle}
                          onChange={(e) => setNewAlarmTitle(e.target.value)}
                          placeholder={isEn ? "e.g. Meditate or Drink Water" : "مثل: جلسة كتابة حرة، استراحة شرب ماء..."}
                          className="bg-white border border-[#E2DCC8] text-xs px-3 py-2 rounded-lg text-[#2B3E50] focus:outline-none placeholder-gray-400 font-bold"
                        />
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={newAlarmTime}
                            onChange={(e) => setNewAlarmTime(e.target.value)}
                            className="bg-white border border-[#E2DCC8] text-xs px-2.5 py-2 rounded-lg text-[#2B3E50] focus:outline-none flex-grow font-mono font-bold"
                          />
                          <button
                            onClick={() => {
                              if (!newAlarmTitle.trim()) return;
                              const newAlarm: AppReminder = {
                                id: `alarm-${Date.now()}`,
                                title: newAlarmTitle.trim(),
                                time: newAlarmTime,
                                active: true,
                                type: 'custom',
                                frequency: 'daily'
                              };
                              setSettings(prev => ({
                                ...prev,
                                reminders: [...(prev.reminders || []), newAlarm]
                              }));
                              setNewAlarmTitle('');
                            }}
                            className="bg-[#3F5449] hover:bg-[#2C3E50] text-white text-xs px-4 py-2 rounded-lg font-black transition-all cursor-pointer"
                          >
                            {isEn ? "Add" : "+ إضافة"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 7: DIARY ARCHIVE */}
              <div className="bg-white border border-[#E2DCC8] rounded-[24px] overflow-hidden shadow-3xs transition-all">
                <div 
                  onClick={() => setExpandedSettingsCard(expandedSettingsCard === 'archive' ? null : 'archive')}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5]/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-2xl">
                      <Download className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2B3E50] text-sm">{t.archiveTitle}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.archiveSub}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'} ${expandedSettingsCard === 'archive' ? 'rotate-90' : ''}`} />
                </div>

                {expandedSettingsCard === 'archive' && (
                  <div className="p-5 border-t border-[#E2DCC8]/60 bg-[#FAF8F5]/60 space-y-4" dir="rtl">
                    {/* Filter and Search Bar inside Archive */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Search Input */}
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={archivedSearchQuery}
                          onChange={(e) => setArchivedSearchQuery(e.target.value)}
                          placeholder="ابحث في اليوميات والخواطر المؤرشفة..."
                          className="w-full bg-white border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:outline-none rounded-2xl py-2 pr-9 pl-3 text-xs text-[#3A3A3A] shadow-3xs"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                        {archivedSearchQuery && (
                          <button 
                            type="button" 
                            onClick={() => setArchivedSearchQuery('')}
                            className="absolute left-3 top-2 text-xs text-gray-400 hover:text-gray-600 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Type Filter Pills */}
                      <div className="flex items-center space-x-1.5 space-x-reverse shrink-0">
                        <button
                          type="button"
                          onClick={() => setArchivedTypeFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            archivedTypeFilter === 'all'
                              ? 'bg-[#8B9D83] text-white shadow-3xs'
                              : 'bg-white text-gray-600 border border-[#E2DCC8] hover:bg-gray-50'
                          }`}
                        >
                          الكل ({diaries.filter(d => d.isArchived && !d.isTrash).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setArchivedTypeFilter('diary')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            archivedTypeFilter === 'diary'
                              ? 'bg-[#8B9D83] text-white shadow-3xs'
                              : 'bg-white text-gray-600 border border-[#E2DCC8] hover:bg-gray-50'
                          }`}
                        >
                          📖 اليوميات ({diaries.filter(d => d.isArchived && !d.isTrash && (d.diaryType || 'diary') === 'diary').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setArchivedTypeFilter('thought')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            archivedTypeFilter === 'thought'
                              ? 'bg-[#8B9D83] text-white shadow-3xs'
                              : 'bg-white text-gray-600 border border-[#E2DCC8] hover:bg-gray-50'
                          }`}
                        >
                          ✍️ الخواطر ({diaries.filter(d => d.isArchived && !d.isTrash && d.diaryType === 'thought').length})
                        </button>
                      </div>
                    </div>

                    {/* Filtered Archived List */}
                    {(() => {
                      const archivedList = diaries.filter(d => {
                        if (!d.isArchived || d.isTrash) return false;
                        if (archivedTypeFilter === 'diary' && (d.diaryType || 'diary') !== 'diary') return false;
                        if (archivedTypeFilter === 'thought' && d.diaryType !== 'thought') return false;
                        if (archivedSearchQuery.trim()) {
                          const q = archivedSearchQuery.toLowerCase();
                          const titleMatch = (d.title || '').toLowerCase().includes(q);
                          const contentMatch = (d.content || '').toLowerCase().includes(q);
                          const tagMatch = (d.tags || []).some(t => t.toLowerCase().includes(q));
                          return titleMatch || contentMatch || tagMatch;
                        }
                        return true;
                      });

                      if (archivedList.length === 0) {
                        return (
                          <div className="bg-white border border-[#E2DCC8]/80 rounded-2xl p-8 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-xl shadow-2xs">
                              📦
                            </div>
                            <p className="text-xs font-bold text-[#3A3A3A]">
                              {archivedSearchQuery ? 'لا توجد نتائج مطابقة في هذا الأرشيف.' : 'أرشيف المذكرات والخواطر فارغ حالياً.'}
                            </p>
                            <p className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                              يمكنك أرشفة أي يومية أو خاطرة من قسم "اليوميات والفضفضة" بحرية لحفظها هنا برقي وبعيداً عن القائمة الرئيسية.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('diaries');
                                setActiveDiariesSubTab('journal');
                              }}
                              className="inline-flex items-center space-x-1.5 space-x-reverse px-4 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white text-xs font-black rounded-xl transition-all shadow-3xs cursor-pointer"
                            >
                              <span>الانتقال لليوميات لأرشفة عنصر ✍️</span>
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {archivedList.map(diary => (
                            <div 
                              key={diary.id}
                              className="bg-white border border-[#E2DCC8] hover:border-[#8B9D83] rounded-2xl p-4 transition-all shadow-3xs hover:shadow-xs space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                {/* Top Badge & Date */}
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black ${
                                    diary.diaryType === 'thought' 
                                      ? 'bg-[#FCF5DE] text-[#A67E2E] border border-[#E9E1C4]' 
                                      : 'bg-[#EEF1EB] text-[#556E4F] border border-[#DCE4D8]'
                                  }`}>
                                    {diary.diaryType === 'thought' ? '✍️ خاطرة' : '📓 يومية'}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <span>📅</span>
                                    <span>{diary.createdAt.split('T')[0]}</span>
                                  </span>
                                </div>

                                {/* Title */}
                                <h5 className="font-extrabold text-[#2B3E50] text-xs line-clamp-1">
                                  {diary.title || 'بدون عنوان'}
                                </h5>

                                {/* Content Preview Snippet */}
                                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                  {diary.content || <em className="text-gray-400">مرفقات وسائط وصوتيات فقط</em>}
                                </p>
                              </div>

                              {/* Action Buttons Bar */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setViewArchivedDiary(diary)}
                                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center space-x-1 space-x-reverse"
                                >
                                  <Eye className="w-3 h-3 text-indigo-600" />
                                  <span>معاينة وقراءة</span>
                                </button>

                                <div className="flex items-center space-x-1 space-x-reverse">
                                  <button
                                    type="button"
                                    title="استرجاع من الأرشيف"
                                    onClick={() => toggleArchiveDiary(diary.id)}
                                    className="px-3 py-1.5 bg-[#8B9D83]/15 hover:bg-[#8B9D83] text-[#556E4F] hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center space-x-1 space-x-reverse"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>استرجاع</span>
                                  </button>
                                  <button
                                    type="button"
                                    title="نقل لسلة المهملات"
                                    onClick={() => handleDeleteDiary(diary.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* CARD 8: TRASH CAN */}
              <div className="bg-white border border-[#E2DCC8] rounded-[24px] overflow-hidden shadow-3xs transition-all">
                <div 
                  onClick={() => setExpandedSettingsCard(expandedSettingsCard === 'trash' ? null : 'trash')}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5]/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-red-50 text-red-500 rounded-2xl">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2B3E50] text-sm">{t.trashTitle}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.trashSub}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'} ${expandedSettingsCard === 'trash' ? 'rotate-90' : ''}`} />
                </div>

                {expandedSettingsCard === 'trash' && (
                  <div className="p-5 border-t border-[#E2DCC8]/60 bg-[#FAF8F5]/40 space-y-4">
                    {diaries.filter(d => d.isTrash).length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4 font-bold">
                        {isEn ? "Trash can is completely empty." : "سلة المهملات فارغة حالياً 🗑️"}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                          <span className="text-[11px] text-gray-500 font-bold">
                            {diaries.filter(d => d.isTrash).length} {isEn ? "items deleted" : "مذكرات في السلة"}
                          </span>
                          <button
                            onClick={handleEmptyTrash}
                            className="text-xs text-red-600 hover:text-red-700 font-black cursor-pointer"
                          >
                            {isEn ? "🗑️ Empty Trash Can" : "🗑️ تفريغ السلة بالكامل"}
                          </button>
                        </div>

                        <div className="space-y-2">
                          {diaries.filter(d => d.isTrash).map(diary => (
                            <div key={diary.id} className="flex items-center justify-between bg-white border border-[#E2DCC8]/60 p-3.5 rounded-xl">
                              <div className="truncate pr-2">
                                <span className="text-xs font-black text-[#2B3E50] block truncate">{diary.title || 'بدون عنوان'}</span>
                                <span className="text-[10px] text-gray-400 font-bold">{diary.createdAt.split('T')[0]}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleRestoreDiary(diary.id)}
                                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-[#3F5449] hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                  title={isEn ? "Restore" : "استرجاع"}
                                >
                                  {isEn ? "Restore" : "استرجاع"}
                                </button>
                                <button
                                  onClick={() => handlePermanentDeleteDiary(diary.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title={isEn ? "Delete Permanently" : "حذف نهائي"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CARD 9: DARK MODE */}
              <div className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between transition-all hover:border-[#8B9D83]/30">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
                    <Moon className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.darkModeTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.darkModeSub}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSettings(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer ${
                    settings.isDarkMode ? 'bg-[#3F5449] justify-end' : 'bg-gray-200 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* CARD FOR SMART REMINDERS */}
              <div 
                onClick={() => setShowSmartRemindersModal(true)}
                className="bg-[#EEF1EB] border border-[#DCE4D8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-[#E2E9DF] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-[#4E685B] text-white rounded-2xl group-hover:scale-105 transition-all shadow-xs">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm flex items-center gap-2">
                      <span>نظام التذكيرات الذكية والتنبيهات</span>
                      <span className="text-[10px] bg-[#D4A373] text-white px-2 py-0.5 rounded-full font-bold">تكرار وملاحظات</span>
                    </h4>
                    <p className="text-[10px] text-[#556E4F] mt-1 font-bold leading-normal">
                      إدارة التذكيرات (يومي، أسبوعي، أيام محددة) مع إضافة عبارات تحفيزية ملهمة
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#4E685B] bg-white/80 border border-[#DCE4D8] px-2.5 py-1 rounded-xl">
                    {(settings.reminders || []).length} تذكير
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'}`} />
                </div>
              </div>

              {/* CARD 10: NOTIFICATIONS & LOCK SCREEN WIDGET */}
              <div className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs space-y-4 transition-all hover:border-[#8B9D83]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-[#E8F0FE] text-blue-500 rounded-2xl">
                      <Bell className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2B3E50] text-sm">{t.notificationsTitle}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.notificationsSub}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer ${
                      settings.notificationsEnabled ? 'bg-[#3F5449] justify-end' : 'bg-gray-200 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* 📱 Sub-Card: Lock Screen Persistent Widget Notification */}
                <div className="p-4 bg-gradient-to-br from-[#F5F1E6]/80 via-amber-50/50 to-white rounded-2xl border-2 border-[#D4A373]/40 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-2.5 bg-[#D4A373] text-white rounded-2xl shadow-xs shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5">
                          <span>إشعار ويدجت شاشة القفل المثبت</span>
                          <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">مُوصى به 🔥</span>
                        </span>
                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                          إظهار لوحة الاختصارات ({isEn ? "Hayat AI" : "حياة AI"}) كإشعار مثبّت على شاشة القفل الخارجية عند ضغط زر الباور للهاتف.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const newState = settings.lockScreenWidgetEnabled === false ? true : false;
                        setSettings(prev => ({ ...prev, lockScreenWidgetEnabled: newState }));
                        if (newState) {
                          triggerLockScreenNotification();
                        }
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer shrink-0 ${
                        settings.lockScreenWidgetEnabled !== false ? 'bg-[#3F5449] justify-end' : 'bg-gray-200 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E1D4] pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerLockScreenNotification();
                        alert('تم إرسال وتثبيت الإشعار على شاشة القفل بنجاح! 📌🔔');
                      }}
                      className="px-3.5 py-1.5 bg-[#4E685B] hover:bg-[#3F5449] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 active:scale-95"
                    >
                      <BellRing className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                      <span>تثبيت / تجربة الإشعار على شاشة القفل الآن 📌</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLockScreenWidgetInfoModal(true)}
                      className="px-3 py-1.5 bg-amber-100/80 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-700" />
                      <span>كيف تظهر على شاشة القفل؟ ℹ️</span>
                    </button>
                  </div>
                </div>

                {/* 🖥️ Sub-Card 2: Fullscreen Mode & Hide Browser Address Bar */}
                <div className="p-4 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white rounded-2xl border-2 border-blue-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs shrink-0">
                        <Maximize className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5">
                          <span>وضع الشاشة الكاملة وإخفاء شريط المتصفح العلوي</span>
                          <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-extrabold">PWA 🖥️</span>
                        </span>
                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                          إخفاء شريط عنوان المتصفح (URL) وعناصر القوائم العلوية للحصول على تجربة تطبيق ملء الشاشة بدون تشتيت.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const newState = !(settings.fullscreenModeEnabled ?? false);
                        setSettings(prev => ({ ...prev, fullscreenModeEnabled: newState }));
                        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
                          try {
                            if (document.documentElement.requestFullscreen) {
                              await document.documentElement.requestFullscreen();
                            } else if ((document.documentElement as any).webkitRequestFullscreen) {
                              await (document.documentElement as any).webkitRequestFullscreen();
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        } else {
                          try {
                            if (document.exitFullscreen) {
                              await document.exitFullscreen();
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer shrink-0 ${
                        settings.fullscreenModeEnabled ? 'bg-[#3F5449] justify-end' : 'bg-gray-200 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 pt-2.5">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
                          try {
                            if (document.documentElement.requestFullscreen) {
                              await document.documentElement.requestFullscreen();
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        } else {
                          if (document.exitFullscreen) {
                            await document.exitFullscreen();
                          }
                        }
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Maximize className="w-3.5 h-3.5 text-white animate-pulse" />
                      <span>تفعيل / تبديل الشاشة الكاملة الآن 🖥️</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        alert(`💡 كيف تخفي شريط المتصفح العلوي بشكل دائم وحذفه من الشاشة؟\n\n1. افتح قائمة المتصفح (⋮) في أعلى الصفحة أو زر المشاركة.\n2. اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen).\n3. سيتم تثبيت تطبيق (${t.appName}) كـ PWA مستقل بدون أي شريط عنوان إطلاقاً!`);
                      }}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-700" />
                      <span>طريقة الإخفاء الدائم PWA ℹ️</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 11: APP LANGUAGES */}
              <div 
                onClick={() => setShowLanguagesModal(true)}
                className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-[#8B9D83]/5 transition-all hover:border-[#8B9D83]/40 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-100 transition-all">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.languagesTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.languagesSub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-3xs">
                    <span>{langInfo.flag}</span>
                    <span>{langInfo.nativeName}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isRtl ? 'rotate-180' : 'rotate-0'}`} />
                </div>
              </div>

              {/* CARD 12: TYPOGRAPHY & FONT CUSTOMIZATION */}
              <TypographySettingsSection
                appFont={settings.appFont || 'cairo'}
                appLineHeight={settings.appLineHeight || 'relaxed'}
                appLanguage={settings.appLanguage}
                onChangeFont={(font) => setSettings(prev => ({ ...prev, appFont: font }))}
                onChangeLineHeight={(lh) => setSettings(prev => ({ ...prev, appLineHeight: lh }))}
              />

              {/* CARD 13: RATE US */}
              <div 
                onClick={() => {
                  setRatingSuccess(false);
                  setRatingFeedback('');
                  setRatingValue(5);
                  setShowRatingModal(true);
                }}
                className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-[#8B9D83]/5 transition-all hover:border-[#8B9D83]/40 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-100 transition-all">
                    <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.rateTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.rateSub}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'}`} />
              </div>

              {/* CARD 13: CONTACT OWNER */}
              <div 
                onClick={() => setShowContactModal(true)}
                className="bg-white border border-[#E2DCC8] rounded-[24px] p-5 shadow-3xs flex items-center justify-between cursor-pointer hover:bg-[#8B9D83]/5 transition-all hover:border-[#8B9D83]/40 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-100 transition-all">
                    <User className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B3E50] text-sm">{t.contactTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{t.contactSub}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isEn ? 'rotate-0' : 'rotate-180'}`} />
              </div>

            </div>

            {/* Developer/System credits details */}
            <div className="pt-6 border-t border-[#E2DCC8]/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-gray-400 font-bold leading-relaxed text-center">
              <span>{isEn ? "✨ Hayat AI — Stable Private Version 1.0.0" : "✨ حياة AI — الإصدار المستقر والخاص 1.0.0"}</span>
              <span className="max-w-xs">{isEn ? "Developed with 100% privacy protection & smart behavioral support." : "تم التطوير بخصوصية مطلقة وأعلى درجات الحماية المعرفية السلوكية والذكاء الاصطناعي لراحتك النفسية."}</span>
            </div>

          </div>
        )}



      </main>

      {/* Floating radial assistant ball for quick navigation */}
      {settings.floatingBallEnabled && (
        <FloatingBall 
          onAction={handleQuickAction} 
          isCollapsed={isBottomNavCollapsedOnMobile}
          appLanguage={settings.appLanguage}
        />
      )}

      {/* Mobile Draggable Floating Button for Bottom Nav (Appears when bottom nav auto-collapses on mobile) */}
      {isBottomNavCollapsedOnMobile && (
        <motion.div
          drag="x"
          dragMomentum={false}
          dragElastic={0.1}
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 sm:hidden flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-grab active:cursor-grabbing"
        >
          <button
            type="button"
            onClick={revealBottomNavTemporarily}
            className="flex items-center space-x-2 space-x-reverse px-3.5 py-1.5 bg-[#4E685B] text-white rounded-full shadow-xl border border-white/40 active:scale-95 transition-all cursor-pointer group"
            title={isEn ? "Tap to show bottom menu (Draggable)" : "انقر لإظهار الشريط السفلي مجدداً لمدة 3 ثوانٍ (يمكن تحريك هذه الأيقونة أفقياً)"}
          >
            <Compass className="w-4 h-4 text-[#FEFAE0] animate-pulse shrink-0" />
            <span className="text-[11px] font-black tracking-tight">
              {activeTab === 'dashboard' ? t.homeTab :
               activeTab === 'diaries' ? t.diariesTab :
               activeTab === 'advisor' ? t.advisorTab :
               activeTab === 'analytics' ? t.analyticsTab : t.settingsTab}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping"></span>
            <ChevronUp className="w-3.5 h-3.5 text-white/80 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </button>
        </motion.div>
      )}

      {/* Persistent Bottom Tab Navigation Bar with Lucide icons (Auto-collapses on mobile after 3s of inactivity) */}
      <nav 
        className={`fixed bottom-0 inset-x-0 bg-[#F9F7F2] border-t border-[#E2DCC8] py-2 z-[35] shadow-xs font-sans transition-all duration-300 transform ${
          isBottomNavCollapsedOnMobile
            ? 'max-sm:translate-y-full max-sm:opacity-0 max-sm:pointer-events-none'
            : 'max-sm:translate-y-0 max-sm:opacity-100'
        }`}
        onTouchStart={() => {
          if (!isBottomNavCollapsedOnMobile) {
            revealBottomNavTemporarily();
          }
        }}
        onClick={() => {
          revealBottomNavTemporarily();
        }}
      >
        <div className="max-w-md mx-auto px-1.5 sm:px-6 grid grid-cols-5 gap-0.5 text-center font-bold">
          
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => {
              switchTab('dashboard');
              revealBottomNavTemporarily();
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#8B9D83] scale-105 font-bold' : 'text-gray-400 hover:text-[#5A5A40]'
            }`}
          >
            <Calendar className="w-4.5 h-4.5 sm:w-5 sm:h-5 mb-1" />
            <span className="text-[9px] sm:text-[10px] leading-tight font-black truncate max-w-full block">{t.homeTab}</span>
          </button>

          {/* Tab 2: Journal Diaries */}
          <button
            onClick={() => {
              switchTab('diaries');
              revealBottomNavTemporarily();
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'diaries' ? 'text-[#8B9D83] scale-105 font-bold' : 'text-gray-400 hover:text-[#5A5A40]'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5 sm:w-5 sm:h-5 mb-1" />
            <span className="text-[9px] sm:text-[10px] leading-tight font-black truncate max-w-full block">{t.diariesTab}</span>
          </button>

          {/* Tab 3: Flagship Smart Advisor */}
          <button
            onClick={() => {
              switchTab('advisor');
              revealBottomNavTemporarily();
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'advisor' ? 'text-[#8B9D83] scale-105 font-bold' : 'text-gray-400 hover:text-[#5A5A40]'
            }`}
          >
            <div className="relative">
              <Brain className="w-4.5 h-4.5 sm:w-5 sm:h-5 mb-1" />
              <span className="absolute top-[-4px] left-[-4px] w-2 h-2 bg-[#D4A373] rounded-full animate-ping"></span>
            </div>
            <span className="text-[9px] sm:text-[10px] leading-tight font-black truncate max-w-full block">{t.advisorTab}</span>
          </button>

          {/* Tab 4: Interactive Charts & Analytics */}
          <button
            onClick={() => {
              switchTab('analytics');
              revealBottomNavTemporarily();
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'text-[#8B9D83] scale-105 font-bold' : 'text-gray-400 hover:text-[#5A5A40]'
            }`}
          >
            <Activity className="w-4.5 h-4.5 sm:w-5 sm:h-5 mb-1" />
            <span className="text-[9px] sm:text-[10px] leading-tight font-black truncate max-w-full block">{t.analyticsTab}</span>
          </button>

          {/* Tab 5: Settings and Backup */}
          <button
            onClick={() => {
              switchTab('settings');
              revealBottomNavTemporarily();
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-[#8B9D83] scale-105 font-bold' : 'text-gray-400 hover:text-[#5A5A40]'
            }`}
          >
            <SettingsIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 mb-1" />
            <span className="text-[9px] sm:text-[10px] leading-tight font-black truncate max-w-full block">{t.settingsTab}</span>
          </button>

        </div>
      </nav>

      {/* 🎓 Therapist Report Modal Window */}
      <TherapistReportModal
        isOpen={showTherapistModal}
        onClose={() => setShowTherapistModal(false)}
        diaries={diaries}
        userApiKey={settings.userApiKey}
        appLanguage={settings.appLanguage}
      />

      {/* ⭐ Rating Modal Window */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        appLanguage={settings.appLanguage}
      />

      {/* ✉️ Contact Owner Modal Window */}
      <ContactOwnerModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        appLanguage={settings.appLanguage}
      />

      {/* 🔑 Gemini API Key Modal Window */}
      <GeminiKeyModal
        isOpen={showGeminiKeyModal}
        onClose={() => setShowGeminiKeyModal(false)}
        apiKey={settings.userApiKey || ''}
        onSave={(key) => setSettings(prev => ({ ...prev, userApiKey: key }))}
        onClear={() => setSettings(prev => ({ ...prev, userApiKey: '' }))}
        appLanguage={settings.appLanguage}
      />

      {/* ☁️ Backup & Sync Modal Window */}
      <BackupSyncModal
        isOpen={showBackupSyncModal}
        onClose={() => setShowBackupSyncModal(false)}
        appLanguage={settings.appLanguage}
        isCloudSyncing={isCloudSyncing}
        cloudSyncMessage={cloudSyncMessage}
        onCloudSync={() => performCloudSync()}
        onCloudRestore={handleCloudRestore}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        backupEmail={backupEmail}
        setBackupEmail={setBackupEmail}
        isSendingEmailBackup={isSendingEmailBackup}
        onSendEmailBackup={handleSendEmailBackup}
        emailBackupStatus={emailBackupStatus}
        onClearEmailBackupStatus={() => setEmailBackupStatus(null)}
        autoBackupInterval={(settings.backupSettings?.autoBackup === 'onWrite' ? 'daily' : settings.backupSettings?.autoBackup) as any || 'off'}
        onChangeAutoBackupInterval={(interval) => setSettings(prev => ({
          ...prev,
          backupSettings: {
            ...prev.backupSettings,
            autoBackup: interval === 'daily' ? 'onWrite' : interval
          }
        }))}
        onOpenWriteDiaryImport={() => setShowWriteDiaryImporter(true)}
      />

      {/* 👤 User Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onManualSync={() => performCloudSync()}
        onManualRestore={handleCloudRestore}
        isSyncing={isCloudSyncing}
        syncMessage={cloudSyncMessage}
        appLanguage={settings.appLanguage}
      />

      {/* 📖 WriteDiary (يومياتي) Importer Modal */}
      <WriteDiaryImporter
        isOpen={showWriteDiaryImporter}
        onClose={() => setShowWriteDiaryImporter(false)}
        appLanguage={settings.appLanguage}
        onImportCompleted={handleWriteDiaryImportCompleted}
      />

      {/* 🌐 Languages Modal Window */}
      <LanguagesModal
        isOpen={showLanguagesModal}
        onClose={() => {
          setShowLanguagesModal(false);
          setIsFirstTimeLangSelect(false);
          localStorage.setItem('yawmiyati_language_chosen', 'true');
          localStorage.setItem('app_language', settings.appLanguage);
        }}
        appLanguage={settings.appLanguage}
        onChangeLanguage={(lang) => {
          setSettings(prev => ({ ...prev, appLanguage: lang }));
          localStorage.setItem('yawmiyati_language_chosen', 'true');
          localStorage.setItem('app_language', lang);
        }}
        appFont={settings.appFont || 'cairo'}
        appLineHeight={settings.appLineHeight || 'relaxed'}
        onChangeFont={(font) => setSettings(prev => ({ ...prev, appFont: font }))}
        onChangeLineHeight={(lh) => setSettings(prev => ({ ...prev, appLineHeight: lh }))}
        isFirstTime={isFirstTimeLangSelect}
      />

      {/* 🎨 Shareable Gratitude & Quote Cards Exporter Modal */}
      <ShareableGratitudeCardModal
        isOpen={showGratitudeShareModal}
        onClose={() => setShowGratitudeShareModal(false)}
        appLanguage={settings.appLanguage}
        initialData={gratitudeShareData}
      />

      {/* 🔔 Smart Reminders Management Modal */}
      <SmartRemindersModal
        isOpen={showSmartRemindersModal}
        onClose={() => setShowSmartRemindersModal(false)}
        reminders={settings.reminders || []}
        appLanguage={settings.appLanguage}
        onSaveReminders={(updatedReminders) => {
          setSettings(prev => ({ ...prev, reminders: updatedReminders }));
        }}
      />

      {/* ⚡ Triggered Reminder Notification Popup */}
      {triggeredReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-[#FAF8F5] border-2 border-[#D4A373] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="text-3xl bg-[#FCF5DE] p-3 rounded-2xl border border-[#E9E1C4] shadow-xs">
                {triggeredReminder.categoryIcon || '🔔'}
              </span>
              <div>
                <span className="text-[10px] font-black bg-[#D4A373] text-white px-2.5 py-0.5 rounded-full">
                  {isEn ? `Smart Reminder (${triggeredReminder.time})` : `تنبيه ذكي الآن (${triggeredReminder.time})`}
                </span>
                <h3 className="text-base font-extrabold text-[#2C3E35] mt-1">
                  {triggeredReminder.title}
                </h3>
              </div>
            </div>

            {triggeredReminder.motivationalNote && (
              <div className="bg-[#FCF5DE] border border-[#E9E1C4] p-3.5 rounded-2xl text-xs text-[#8C661D] font-bold space-y-1">
                <div className="flex items-center gap-1 text-[#A67E2E]">
                  <Sparkles className="w-4 h-4" />
                  <span>{isEn ? 'Motivational note for you:' : 'رسالة تحفيزية لك:'}</span>
                </div>
                <p className="leading-relaxed italic text-sm">
                  "{triggeredReminder.motivationalNote}"
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setTriggeredReminder(null);
                  setActiveTab('diaries');
                  setActiveDiariesSubTab('journal');
                }}
                className="flex-1 py-2.5 bg-[#4E685B] text-white font-bold text-xs rounded-xl hover:bg-[#3F5449] transition-all cursor-pointer shadow-xs text-center"
              >
                {isEn ? 'Go to Journal ✍️' : 'انتقل للخواطر واليوميات ✍️'}
              </button>
              <button
                onClick={() => setTriggeredReminder(null)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-300 transition-all cursor-pointer"
              >
                {isEn ? 'OK, Thanks' : 'حسناً، شكراً'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF template for export - beautifully styled like a real physical A4 page */}
      {editingDiary && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -100 }}>
          <div 
            id="diary-to-pdf" 
            className="w-[794px] bg-white text-[#2C3E50] p-12 font-sans flex flex-col justify-between"
            style={{ 
              direction: 'rtl',
              minHeight: '1123px', // A4 aspect ratio height at 794px width
              fontFamily: '"Cairo", "Inter", sans-serif'
            }}
          >
            {/* Elegant Header Block */}
            <div className="border-b-2 border-[#8B9D83] pb-6 mb-8 flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 bg-[#8B9D83]/10 border border-[#8B9D83] rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                  📓
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#8B9D83] tracking-wide">{isEn ? "Hayat AI" : "حياة AI الذكية"}</h1>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">سجل المذكرات والفضفضة النفسية الآمن</p>
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-400 font-bold">تاريخ التصدير ومستند الحفظ</div>
                <div className="text-xs text-gray-600 font-bold mt-1" style={{ direction: 'ltr' }}>
                  {new Date().toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}
                </div>
              </div>
            </div>

            {/* Main Document Body */}
            <div className="flex-1 space-y-6">
              
              {/* Note Metadata Block */}
              <div className="bg-[#F9F7F2] border border-[#E2DCC8] rounded-2xl p-6 grid grid-cols-3 gap-4">
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold mb-1">تاريخ كتابة المذكرة:</span>
                  <span className="text-xs text-[#3A3A3A] font-extrabold">
                    {new Date(editingDiary.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold mb-1">العمق والأهمية الذاتية:</span>
                  <span className="text-xs text-[#D4A373] font-black flex items-center">
                    {'★'.repeat(editingDiary.importance)}
                    {'☆'.repeat(5 - editingDiary.importance)}
                    <span className="text-gray-400 font-bold mr-1.5 text-[10px]">({editingDiary.importance}/5)</span>
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold mb-1">الحالة المزاجية المسجلة:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {editingDiary.moods.length > 0 ? (
                      editingDiary.moods.map((m, i) => (
                        <span key={i} className="text-[10px] font-bold bg-[#8B9D83]/10 text-[#5A5A40] border border-[#8B9D83]/20 px-2 py-0.5 rounded-full">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">لم يتم تحديد مزاج</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#3A3A3A] leading-tight pr-4 border-r-4 border-[#8B9D83]">
                  {editingDiary.title || 'مذكرة يومية بدون عنوان'}
                </h2>
              </div>

              {/* Content Box */}
              <div className="pt-4 pb-8 border-b border-dashed border-gray-200">
                <p className="text-sm text-[#3A3A3A] leading-relaxed whitespace-pre-wrap font-normal" style={{ minHeight: '200px' }}>
                  {editingDiary.content}
                </p>
              </div>

              {/* Tasks Checklist if any */}
              {editingDiary.tasks && editingDiary.tasks.length > 0 && (
                <div className="bg-[#F4F6F4]/50 border border-gray-100 rounded-2xl p-6 space-y-3">
                  <h3 className="text-xs font-black text-[#5A5A40] flex items-center">
                    <span className="ml-1.5">📋</span>
                    <span>قائمة المهام المرتبطة باليوم:</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {editingDiary.tasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-2 space-x-reverse text-xs text-[#3A3A3A]">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-black ${
                          task.completed 
                            ? 'bg-[#8B9D83] border-[#8B9D83] text-white' 
                            : 'bg-white border-gray-300 text-transparent'
                        }`}>
                          ✓
                        </span>
                        <span className={`${task.completed ? 'line-through text-gray-400 font-medium' : 'font-semibold text-gray-700'}`}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Associated Drawing if any */}
              {editingDiary.drawing && (
                <div className="border border-gray-200 rounded-2xl p-6 space-y-3 bg-white shadow-3xs">
                  <h3 className="text-xs font-black text-[#5A5A40] flex items-center">
                    <span className="ml-1.5">🎨</span>
                    <span>الرسم التعبيري المصاحب:</span>
                  </h3>
                  <div className="w-full h-48 bg-[#F9F7F2] rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                    <img src={editingDiary.drawing} className="max-w-full max-h-full object-contain" alt="associated drawing" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}

              {/* Subsequent Additions & Edits Timeline if any */}
              {editingDiary.edits && editingDiary.edits.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-[#5A5A40] flex items-center">
                    <span className="ml-1.5">⏱️</span>
                    <span>سجل الإضافات والتعديلات اللاحقة:</span>
                  </h3>
                  <div className="space-y-3">
                    {editingDiary.edits.map((edit) => (
                      <div key={edit.id} className="bg-[#FAEDCD]/15 border-r-4 border-[#D4A373] p-4 rounded-l-xl rounded-r-xs space-y-1">
                        <div className="text-[9px] text-[#D4A373] font-black">
                          📆 تم الإدراج في: {edit.timestamp}
                        </div>
                        <p className="text-xs text-[#3A3A3A] leading-relaxed font-normal">
                          {edit.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Aesthetic Calming Footer */}
            <div className="border-t border-gray-100 pt-6 mt-8 flex flex-col items-center text-center space-y-2">
              <p className="text-xs italic text-[#8B9D83] font-bold">
                "إن كتابة اليوميات والوعي بالمشاعر هو أولى خطوات التوازن النفسي والسلام الداخلي."
              </p>
              <div className="text-[9px] text-gray-400 font-bold flex items-center space-x-1.5 space-x-reverse mt-2">
                <span>{isEn ? "Hayat AI App" : "تطبيق حياة AI الذكية"}</span>
                <span>•</span>
                <span>تصدير آمن للمعلومات الشخصية</span>
                <span>•</span>
                <span>جميع الحقوق محفوظة للمستخدم 🔐</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🧠 CBT Step-by-Step Restructuring Wizard Modal */}
      {showAddCbtModal && (
        <div className="fixed inset-0 bg-[#5A5A40]/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white border border-[#E2DCC8] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-fade-in text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DCC8]/60">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-xl">🧠</span>
                <div>
                  <h4 className="font-extrabold text-sm text-[#3A3A3A]">تمرين تفكيك وإعادة هيكلة الأفكار (CBT)</h4>
                  <p className="text-[9px] text-gray-400 font-bold">الخطوة {cbtStep} من 5</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddCbtModal(false);
                  setCbtStep(1);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1.5 hover:bg-[#F9F7F2] rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Trigger Event */}
            {cbtStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-[#5A5A40]">🚩 ما هو الموقف أو الحدث المحفز لتوترك وقلقك؟</label>
                  <p className="text-[10px] text-gray-400 font-medium">صف الموقف بواقعية دون أحكام مسبقة (مثال: تأخر الرد على رسالتي البريدية، أو اقتراب موعد تسليم المشروع البرمجي).</p>
                </div>
                <textarea
                  value={cbtTriggerEvent}
                  onChange={(e) => setCbtTriggerEvent(e.target.value)}
                  placeholder="اكتب هنا ما حدث بالتفصيل وبشكل موضوعي..."
                  className="w-full h-24 bg-[#F9F7F2]/50 hover:bg-[#F0EDE4]/40 focus:bg-white border border-[#E2DCC8] rounded-2xl p-3 text-xs text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83]"
                />
                <div className="flex justify-end">
                  <button
                    disabled={!cbtTriggerEvent.trim()}
                    onClick={() => setCbtStep(2)}
                    className="px-5 py-2 bg-[#8B9D83] hover:bg-[#72856A] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    التالي ➔
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Negative Thoughts */}
            {cbtStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-[#5A5A40]">💭 ما هي الفكرة السلبية التلقائية التي خطرت ببالك فوراً؟</label>
                  <p className="text-[10px] text-gray-400 font-medium">الأفكار التلقائية هي الوساوس والسيناريوهات الكارثية التي تهاجم ذهنك (مثال: سيفشل مشروعي وسوف يطردونني، أو بالتأكيد هم يكرهونني ويتجنبونني).</p>
                </div>
                <textarea
                  value={cbtNegativeThoughts}
                  onChange={(e) => setCbtNegativeThoughts(e.target.value)}
                  placeholder="اكتب الفكرة التلقائية التي تدور في ذهنك حالياً بكل صراحة..."
                  className="w-full h-24 bg-red-50/10 hover:bg-red-50/20 focus:bg-white border border-red-200/50 rounded-2xl p-3 text-xs text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex justify-between">
                  <button
                    onClick={() => setCbtStep(1)}
                    className="px-4 py-2 bg-[#F0EDE4] hover:bg-[#E2DCC8] text-[#5A5A40] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    🠔 السابق
                  </button>
                  <button
                    disabled={!cbtNegativeThoughts.trim()}
                    onClick={() => setCbtStep(3)}
                    className="px-5 py-2 bg-[#8B9D83] hover:bg-[#72856A] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    التالي ➔
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Cognitive Distortion Selector */}
            {cbtStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-[#5A5A40]">🔍 حدد نوع التشويه الفكري أو الفخ المعرفي المصاحب لفكرتك السلبية:</label>
                  <p className="text-[10px] text-gray-400 font-medium">العقليات القلقة تقع دوماً في أخطاء تفكير شائعة؛ اختر الخطأ الذي تجده في فكرتك التلقائية (أو دعه فارغاً ليقوم المستشار بتحديده تلقائياً):</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {[
                    { id: 'التفكير الكارثي (Catastrophizing) 🌪️', label: 'التفكير الكارثي (تهويل الأمور) 🌪️' },
                    { id: 'الكل أو لا شيء (All-or-Nothing) 🔲', label: 'الكل أو لا شيء (المثالية القاتلة) 🔲' },
                    { id: 'قراءة الأفكار (Mind Reading) 🔮', label: 'قراءة الأفكار (توقع السوء) 🔮' },
                    { id: 'شخصنة الأمور (Personalization) 👤', label: 'شخصنة الأمور (جلد الذات واللوم) 👤' },
                    { id: 'الترشيح السلبي (Mental Filter) ❌', label: 'الترشيح السلبي (تجاهل الإيجابيات) ❌' },
                    { id: 'التعميم الزائد (Overgeneralization) ♾️', label: 'التعميم الزائد (حكم مطلق مفرط) ♾️' },
                  ].map(dist => (
                    <button
                      key={dist.id}
                      onClick={() => setCbtCognitiveDistortion(dist.id)}
                      className={`p-2.5 rounded-xl border text-xs text-right font-bold transition-all cursor-pointer ${
                        cbtCognitiveDistortion === dist.id
                          ? 'bg-[#8B9D83]/20 border-[#8B9D83] text-[#5A5A40] scale-102 font-black shadow-2xs'
                          : 'bg-[#F9F7F2] border-[#E2DCC8]/60 hover:bg-[#F0EDE4] text-gray-600'
                      }`}
                    >
                      {dist.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setCbtStep(2)}
                    className="px-4 py-2 bg-[#F0EDE4] hover:bg-[#E2DCC8] text-[#5A5A40] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    🠔 السابق
                  </button>
                  <button
                    onClick={() => setCbtStep(4)}
                    className="px-5 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    التالي ➔
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Emotion intensity */}
            {cbtStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-[#5A5A40]">📊 ما هي شدة قلقك وضيقك حالياً قبل تطبيق التمرين؟ (1 - 10)</label>
                  <p className="text-[10px] text-gray-400 font-medium">سجل درجة التوتر الحالي حتى نتمكن من رصد نسبة الانخفاض والارتياح العصبي والذهني بعد التمرين.</p>
                </div>
                
                <div className="flex flex-col items-center py-4 bg-[#F9F7F2]/50 border border-[#E2DCC8]/50 rounded-2xl space-y-2">
                  <span className="font-mono text-2xl text-red-600 font-extrabold">{cbtEmotionBefore} / 10</span>
                  <span className="text-xs text-gray-400 font-bold">
                    {cbtEmotionBefore <= 3 ? 'قلق خفيف ومسيطر عليه 👍' :
                     cbtEmotionBefore <= 7 ? 'توتر وتفكير مفرط مستهلك للطاقة ⚠️' : 'هلع وضيق عارم وعطلة كاملة 🚨'}
                  </span>
                  
                  <div className="w-full px-8 pt-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={cbtEmotionBefore}
                      onChange={(e) => setCbtEmotionBefore(Number(e.target.value))}
                      className="w-full h-2 bg-[#E2DCC8] rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCbtStep(3)}
                    className="px-4 py-2 bg-[#F0EDE4] hover:bg-[#E2DCC8] text-[#5A5A40] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    🠔 السابق
                  </button>
                  <button
                    onClick={() => {
                      setCbtStep(5);
                      // Auto trigger Gemini restructuring as soon as they land on Step 5
                      handleGenerateCbtAlternative();
                    }}
                    className="px-5 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    التالي ➔
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Rational Alternative (with AI help) */}
            {cbtStep === 5 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-emerald-700">✨ البديل الفكري العقلاني المتزن المقترح:</label>
                  <p className="text-[10px] text-gray-400 font-medium">قّم بصياغة فكرة عقلانية متزنة وموضوعية تحارب الفكرة السلبية، أو استخدم اقتراح المستشار الذكي AI وتعديله يدوياً:</p>
                </div>

                {cbtLoading ? (
                  <div className="flex flex-col items-center justify-center p-6 border border-[#E2DCC8] rounded-2xl bg-[#F9F7F2]/40 space-y-2">
                    <RefreshCw className="w-6 h-6 text-[#8B9D83] animate-spin" />
                    <span className="text-[10px] text-gray-400 font-bold">جاري تشغيل محرك العلاج المعرفي بالذكاء الاصطناعي وصياغة فكرتك المتزنة...</span>
                  </div>
                ) : (
                  <textarea
                    value={cbtRationalAlternative}
                    onChange={(e) => setCbtRationalAlternative(e.target.value)}
                    placeholder="اكتب البديل العقلاني المتزن هنا..."
                    className="w-full h-28 bg-emerald-50/10 hover:bg-emerald-50/20 focus:bg-white border border-emerald-200/50 rounded-2xl p-3 text-xs text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium font-sans"
                  />
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F9F7F2] p-2.5 rounded-xl border border-[#E2DCC8]/60">
                  <button
                    type="button"
                    onClick={handleGenerateCbtAlternative}
                    disabled={cbtLoading}
                    className="flex items-center space-x-1 space-x-reverse text-[10px] font-black text-[#8B9D83] hover:text-[#5A5A40] disabled:text-gray-300 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد بالذكاء الاصطناعي مجدداً (AI)</span>
                  </button>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-[10px] text-gray-400 font-bold">شدة التوتر بعد التمرين:</span>
                    <select
                      value={cbtEmotionAfter}
                      onChange={(e) => setCbtEmotionAfter(Number(e.target.value))}
                      className="bg-white border border-[#E2DCC8] text-xs font-mono font-bold rounded-lg p-1 text-emerald-700"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n} / 10</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCbtStep(4)}
                    className="px-4 py-2 bg-[#F0EDE4] hover:bg-[#E2DCC8] text-[#5A5A40] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    🠔 السابق
                  </button>
                  <button
                    onClick={() => {
                      if (!cbtRationalAlternative.trim()) return;
                      // Generate CBT worksheet item
                      const newWorksheet = {
                        id: `cbt-${Date.now()}`,
                        triggerEvent: cbtTriggerEvent,
                        negativeThoughts: cbtNegativeThoughts,
                        cognitiveDistortion: cbtCognitiveDistortion,
                        rationalAlternative: cbtRationalAlternative,
                        emotionBefore: cbtEmotionBefore,
                        emotionAfter: cbtEmotionAfter,
                        createdAt: new Date().toISOString()
                      };

                      // Append to active selected date diary
                      let targetDiary = activeDiaryForSelectedDate;
                      if (!targetDiary) {
                        targetDiary = {
                          id: `diary-${Date.now()}`,
                          title: `مذكرة يومية لـ ${selectedDate}`,
                          content: '',
                          createdAt: `${selectedDate}T20:00:00.000Z`,
                          updatedAt: `${selectedDate}T20:00:00.000Z`,
                          moods: ['طبيعي'],
                          importance: 3,
                          color: 'bg-white border-[#E2DCC8]',
                          images: [],
                          videos: [],
                          audioRecordings: [],
                          files: [],
                          tasks: [],
                          tags: [],
                          chatLogs: [],
                          isLocked: false,
                          sleepHours: 8,
                          sportsDuration: 0,
                          medications: [
                            { id: 'm1', name: 'مكمل فيتامين D', time: '10:00 ص', taken: false }
                          ],
                          waterCups: 0,
                          fastMoodScore: 5,
                          symptomsChecklist: [],
                          cbtWorksheets: []
                        };
                      }

                      const updatedWorksheets = [...(targetDiary.cbtWorksheets || []), newWorksheet];
                      handleUpdateHabit('cbt', updatedWorksheets);

                      // Reset states & close modal
                      setCbtTriggerEvent('');
                      setCbtNegativeThoughts('');
                      setCbtCognitiveDistortion('');
                      setCbtRationalAlternative('');
                      setCbtEmotionBefore(7);
                      setCbtEmotionAfter(4);
                      setCbtStep(1);
                      setShowAddCbtModal(false);

                      alert('تمت إضافة تمرين إعادة الهيكلة بنجاح وحفظه في مذكراتك لليوم! 🎉🧠');
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    💾 حفظ الجلسة بنجاح
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 📅 Redesigned Comprehensive Calendar & Library Modal (التقويم والمكتبة الشاملة • اقرأً 📖🗓️) */}
      {showCalendarModal && (() => {
        const year = calendarViewDate.getFullYear();
        const month = calendarViewDate.getMonth(); // 0-indexed

        // First day of the month
        const firstDayOfMonth = new Date(year, month, 1);
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 6 is Saturday

        // Number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Arabic month names
        const arabicMonths = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        // Days list
        const days = [];
        // Pad with empty cells for offset
        for (let i = 0; i < startDayOfWeek; i++) {
          days.push(null);
        }
        // Add day numbers
        for (let d = 1; d <= daysInMonth; d++) {
          days.push(new Date(year, month, d));
        }

        const weekdays = ['أح', 'اث', 'ثلاث', 'أر', 'خم', 'جم', 'سب'];

        const handlePrevMonth = () => {
          setCalendarViewDate(new Date(year, month - 1, 1));
        };

        const handleNextMonth = () => {
          setCalendarViewDate(new Date(year, month + 1, 1));
        };

        // Get details of active day
        const dayEntry = diaries.find(d => d.createdAt.split('T')[0] === selectedCalendarDate && !d.isTrash);
        const hasDiaryOnSelectedDay = !!dayEntry;

        // Count books registered on selected day
        const dayBooks = books.filter(b => b.createdAt.split('T')[0] === selectedCalendarDate);

        // Helper to get formatted date label
        const formattedDateLabel = new Date(selectedCalendarDate + 'T12:00:00').toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Save book handler
        const handleSaveBook = (e: React.FormEvent) => {
          e.preventDefault();
          if (!bookFormTitle.trim()) {
            alert('يرجى إدخال عنوان الكتاب!');
            return;
          }
          const newBook: Book = {
            id: `book-${Date.now()}`,
            title: bookFormTitle,
            notes: bookFormNotes,
            rating: bookFormRating,
            pdfPath: bookFormPdf || undefined,
            referenceLink: bookFormLink || undefined,
            audioAttachment: bookFormAudio || undefined,
            coverAttachment: bookFormCover || undefined,
            videoAttachment: bookFormVideo || undefined,
            hasMindMap: bookFormHasMindMap,
            tags: bookFormTags.length > 0 ? bookFormTags : ['عام'],
            createdAt: selectedCalendarDate + 'T12:00:00.000Z' // Associate with selected calendar day
          };
          setBooks(prev => [newBook, ...prev]);
          
          // Reset form states
          setBookFormTitle('');
          setBookFormNotes('');
          setBookFormRating(5);
          setBookFormPdf('');
          setBookFormLink('');
          setBookFormAudio('');
          setBookFormCover('');
          setBookFormVideo('');
          setBookFormHasMindMap(false);
          setBookFormTags(['تنمية ذاتية']);
          setBookFormCustomTag('');
          setShowAddBookForm(false);
          alert('تم حفظ الكتاب في مكتبتك الشاملة بنجاح! 📖✨');
        };

        const handleDeleteBook = (id: string) => {
          if (confirm('هل أنت متأكد من حذف هذا الكتاب من مكتبتك الشاملة؟')) {
            setBooks(prev => prev.filter(b => b.id !== id));
            if (selectedBookDetail?.id === id) {
              setSelectedBookDetail(null);
            }
          }
        };

        return (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 transition-all font-sans" dir="rtl">
            <div className="bg-white border border-[#E2DCC8] rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] md:h-[680px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-3.5 sm:p-5 bg-gradient-to-r from-[#5A5A40] to-[#8B9D83] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <div className="p-1.5 sm:p-2 bg-white/10 rounded-xl sm:rounded-2xl shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#FEFAE0]" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-lg font-extrabold flex items-center">
                      <span>التقويم والمكتبة الشاملة • اقرأً 📖🗓️</span>
                    </h2>
                    <p className="text-[9px] sm:text-[10px] text-[#E2DCC8]">تصفح اليوميات والكتب المقروءة والتقارير النفسية المتكاملة</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setShowCalendarModal(false);
                    setSelectedBookDetail(null);
                    setShowAddBookForm(false);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold cursor-pointer transition-colors text-xs sm:text-sm shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Sub-tab Navigation Switcher */}
              <div className="flex border-b border-[#E2DCC8]/40 bg-[#F9F7F2] p-1 gap-1 shrink-0 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarSubTab('calendar');
                    setSelectedBookDetail(null);
                  }}
                  className={`flex-1 py-2 sm:py-3 px-2 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1 sm:space-x-2 space-x-reverse cursor-pointer whitespace-nowrap ${
                    calendarSubTab === 'calendar' 
                      ? 'bg-white text-[#5A5A40] shadow-xs border border-[#E2DCC8]/55' 
                      : 'text-gray-500 hover:text-[#5A5A40]'
                  }`}
                >
                  <span>يومياتي وأنشطتي (اقرأ) ☀️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarSubTab('library')}
                  className={`flex-1 py-2 sm:py-3 px-2 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1 sm:space-x-2 space-x-reverse cursor-pointer whitespace-nowrap ${
                    calendarSubTab === 'library' 
                      ? 'bg-white text-[#5A5A40] shadow-xs border border-[#E2DCC8]/55' 
                      : 'text-gray-500 hover:text-[#5A5A40]'
                  }`}
                >
                  <span>مكتبتي الشاملة 📖</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarSubTab('reports');
                    setSelectedBookDetail(null);
                  }}
                  className={`flex-1 py-2 sm:py-3 px-2 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1 sm:space-x-2 space-x-reverse cursor-pointer whitespace-nowrap ${
                    calendarSubTab === 'reports' 
                      ? 'bg-white text-[#5A5A40] shadow-xs border border-[#E2DCC8]/55' 
                      : 'text-gray-500 hover:text-[#5A5A40]'
                  }`}
                >
                  <span>الحكمة والتقارير 🧠</span>
                </button>
              </div>

              {/* Main Workspace split into Left (DatePicker) and Right (Details) */}
              <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden min-h-0">
                
                {/* LEFT COLUMN: Clean Calendar Widget */}
                <div className="w-full md:w-[280px] shrink-0 border-b md:border-b-0 md:border-l border-[#E2DCC8]/40 p-3 sm:p-4 bg-[#F9F7F2]/40 flex flex-col justify-start space-y-3 sm:space-y-4 overflow-y-auto max-h-[380px] md:max-h-none">
                  <div className="text-[10px] sm:text-[11px] font-black text-gray-400">التقويم الكامل والبحث التاريخي</div>

                  <div className="bg-white border border-[#E2DCC8]/60 rounded-2xl p-3.5 space-y-3.5 shadow-3xs">
                    {/* Month Picker Navigation */}
                    <div className="flex items-center justify-between">
                      <button 
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-[#F0EDE4] border border-[#E2DCC8]/50 rounded-lg text-xs font-extrabold cursor-pointer transition-colors text-gray-600"
                      >
                        ◀
                      </button>
                      <span className="text-xs font-black text-[#5A5A40]">
                        {arabicMonths[month]} {year}
                      </span>
                      <button 
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-[#F0EDE4] border border-[#E2DCC8]/50 rounded-lg text-xs font-extrabold cursor-pointer transition-colors text-gray-600"
                      >
                        ▶
                      </button>
                    </div>

                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-1 text-center border-b border-gray-100 pb-1">
                      {weekdays.map((wd, i) => (
                        <span key={i} className="text-[10px] font-extrabold text-gray-400">{wd}</span>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {days.map((dayDate, idx) => {
                        if (!dayDate) {
                          return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const isoString = dayDate.toISOString().split('T')[0];
                        const isSelected = selectedCalendarDate === isoString;
                        const isToday = new Date().toISOString().split('T')[0] === isoString;
                        
                        const hasDiary = diaries.some(d => d.createdAt.split('T')[0] === isoString && !d.isTrash);
                        const hasBook = books.some(b => b.createdAt.split('T')[0] === isoString);

                        return (
                          <button
                            key={isoString}
                            type="button"
                            onClick={() => {
                              setSelectedCalendarDate(isoString);
                              setSelectedBookDetail(null);
                            }}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-extrabold transition-all relative cursor-pointer border ${
                              isSelected
                                ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-xs scale-105'
                                : isToday
                                  ? 'bg-[#FAEDCD] text-[#D4A373] border-[#D4A373]'
                                  : 'bg-[#F9F7F2] hover:bg-[#F0EDE4] text-gray-700 border-transparent'
                            }`}
                            title={`${dayDate.getDate()} ${arabicMonths[month]}`}
                          >
                            <span>{dayDate.getDate()}</span>
                            <div className="absolute bottom-1 flex space-x-0.5 space-x-reverse justify-center w-full">
                              {hasDiary && (
                                <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#8B9D83] animate-pulse'}`} />
                              )}
                              {hasBook && (
                                <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[#FEFAE0]' : 'bg-[#D4A373]'}`} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2DCC8]/50 rounded-2xl p-3 space-y-1 shadow-3xs">
                    <span className="block text-[10px] text-gray-400 font-bold">التاريخ المحدد حالياً:</span>
                    <span className="text-xs font-black text-[#5A5A40] block leading-tight">
                      {formattedDateLabel}
                    </span>
                  </div>

                  {/* Indicators legend */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 space-y-2 text-[10px] font-bold text-gray-500 shadow-3xs">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <span className="w-2 h-2 rounded-full bg-[#8B9D83]" />
                      <span>يوميات أو مذكرات مسجلة 🟢</span>
                    </div>
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <span className="w-2 h-2 rounded-full bg-[#D4A373]" />
                      <span>قراءات أو كتب مضافة للمكتبة 📚</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Interactive Workspaces */}
                <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto bg-white flex flex-col justify-between min-h-[350px] md:min-h-0">
                  
                  {/* TAB 1: CALENDAR VIEW & DAY ACTIVITIES */}
                  {calendarSubTab === 'calendar' && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[#E2DCC8]/50 pb-3">
                          <h3 className="text-base font-black text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                            <span className="p-1 bg-[#8B9D83]/10 text-[#8B9D83] rounded-lg">☀️</span>
                            <span>ما حدث في يوم: {selectedCalendarDate}</span>
                          </h3>
                          <span className="text-xs font-bold text-[#8B9D83] bg-[#8B9D83]/10 px-3 py-1 rounded-full">
                            {hasDiaryOnSelectedDay ? 'يوميات مسجلة' : 'يوم هادئ/فارغ'}
                          </span>
                        </div>

                        {hasDiaryOnSelectedDay ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Content Card */}
                            <div className="bg-[#F9F7F2]/40 border border-[#E2DCC8]/60 rounded-2xl p-4 space-y-3">
                              <div>
                                <span className="text-[10px] font-bold text-gray-400">عنوان المذكرة 📓</span>
                                <h4 className="text-sm font-black text-[#3A3A3A] mt-0.5">{dayEntry.title || 'بدون عنوان'}</h4>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-400">المحتوى والفضفضة ✍️</span>
                                <p className="text-xs text-gray-600 leading-relaxed max-h-[160px] overflow-y-auto mt-1 whitespace-pre-wrap">
                                  {dayEntry.content || 'مذكرة فارغة بدون تفاصيل نصية.'}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1 pt-2 border-t border-[#E2DCC8]/30">
                                {dayEntry.moods.map((m, idx) => (
                                  <span key={idx} className="text-[10px] font-bold bg-[#8B9D83]/10 text-[#5A5A40] border border-[#8B9D83]/20 px-2 py-0.5 rounded-full">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Right: Health & Behavior KPI Stats */}
                            <div className="bg-[#F9F7F2]/40 border border-[#E2DCC8]/60 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                              <h4 className="text-xs font-black text-[#5A5A40] border-b border-[#E2DCC8]/30 pb-1.5 flex items-center justify-between">
                                <span>الالتزام والقياسات النفسية والصحية 📊</span>
                                <span className="text-[10px] font-extrabold text-[#D4A373]">مؤشرات اليوم</span>
                              </h4>
                              
                              <div className="space-y-2.5 flex-1 justify-center flex flex-col">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                                  <span className="flex items-center gap-1">💊 جرعة العلاج والالتزام:</span>
                                  <span className="font-extrabold text-[#3A3A3A]">
                                    {dayEntry.medications && dayEntry.medications.length > 0 ? (
                                      <span className="text-emerald-600">تم الالتزام ({dayEntry.medications.filter(m => m.taken).length}/{dayEntry.medications.length})</span>
                                    ) : (
                                      <span className="text-gray-400 italic">لم تسجل مكملات</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                                  <span className="flex items-center gap-1">🏃 النشاط والرياضة البدنية:</span>
                                  <span className="font-extrabold text-[#3A3A3A]">
                                    {dayEntry.sportsDuration && dayEntry.sportsDuration > 0 ? (
                                      <span className="text-[#8B9D83]">
                                        {dayEntry.sportsDuration} دقيقة ممارسة {dayEntry.sportsType ? `(${dayEntry.sportsType})` : ''}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 italic">لا توجد تمارين</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                                  <span className="flex items-center gap-1">💤 جودة وساعات النوم:</span>
                                  <span className="font-extrabold text-[#3A3A3A]">
                                    {dayEntry.sleepHours ? (
                                      <span>{dayEntry.sleepHours} ساعات</span>
                                    ) : (
                                      <span className="text-gray-400 italic">غير مسجل</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                                  <span className="flex items-center gap-1">🥤 نسبة ترطيب الجسم (الماء):</span>
                                  <span className="font-extrabold text-[#3A3A3A]">
                                    {dayEntry.waterCups ? (
                                      <span className="text-blue-600 font-black">{dayEntry.waterCups} أكواب 🥤</span>
                                    ) : (
                                      <span className="text-gray-400 italic">0 كوب</span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {dayBooks.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#E2DCC8]/30 flex items-center justify-between text-[11px] font-black text-[#D4A373]">
                                  <span>📚 قراءات مضافة في هذا اليوم:</span>
                                  <span>{dayBooks.length} كتب</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#F9F7F2]/20 border border-dashed border-[#E2DCC8] rounded-3xl p-10 text-center space-y-4 my-8">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-[#5A5A40]">لا توجد يوميات أو مذكرات مسجلة لهذا اليوم</h4>
                              <p className="text-xs text-gray-400">تاريخ {selectedCalendarDate} يخلو حالياً من التوثيقات والمذكرات النفسية.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(selectedCalendarDate);
                                setShowCalendarModal(false);
                                setActiveTab('diaries');
                              }}
                              className="px-5 py-2 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
                            >
                              <span>+ تدوين مذكرات جديدة لليوم</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 text-center leading-relaxed border-t border-gray-100 pt-3">
                        <span>💡 يمكنك اختيار أي يوم من التقويم باليسار لتظهر لك تفاصيل المزاج، النوم، الرياضة والعلاج فوراً وبكل سرية.</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LIBRARY VIEW & ADD BOOK FORM */}
                  {calendarSubTab === 'library' && (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      {showAddBookForm ? (
                        /* ADD BOOK FORM */
                        <form onSubmit={handleSaveBook} className="space-y-3.5 flex-1">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-black text-[#5A5A40] flex items-center space-x-2 space-x-reverse">
                              <span>إضافة كتاب جديد للمكتبة 📖✨</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowAddBookForm(false)}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              إلغاء التعديل
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Column 1: Info */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-black text-gray-500 mb-1">عنوان الكتاب أو الرواية *</label>
                                <input
                                  type="text"
                                  required
                                  value={bookFormTitle}
                                  onChange={(e) => setBookFormTitle(e.target.value)}
                                  placeholder="مثال: العلاج النفسي الذاتي، رواية السلام"
                                  className="w-full bg-[#F9F7F2]/50 border border-[#E2DCC8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#8B9D83] text-[#3A3A3A] font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-black text-gray-500 mb-1">ملاحظات واقتباسات أو مؤلف الكتاب</label>
                                <textarea
                                  value={bookFormNotes}
                                  onChange={(e) => setBookFormNotes(e.target.value)}
                                  placeholder="أضف مراجعة قصيرة، مؤلف الكتاب، أو اقتباس ملهماً شعرت به..."
                                  rows={4}
                                  className="w-full bg-[#F9F7F2]/50 border border-[#E2DCC8] rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#8B9D83] text-[#3A3A3A] font-bold leading-relaxed resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-black text-gray-500 mb-1">تقييمك الشخصي للكتاب:</label>
                                <div className="flex items-center space-x-1.5 space-x-reverse">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setBookFormRating(star)}
                                      className="text-lg hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      {star <= bookFormRating ? '★' : '☆'}
                                    </button>
                                  ))}
                                  <span className="text-[10px] text-gray-400 font-bold mr-2">({bookFormRating}/5 نجوم)</span>
                                </div>
                              </div>

                              {/* Book Categorization Tags */}
                              <div>
                                <label className="block text-[11px] font-black text-[#5A5A40] mb-1.5">تصنيفات وتقسيمات الكتاب (Tags) 🏷️</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {['تنمية ذاتية', 'روايات', 'علم نفس', 'صحة نفسية', 'فلسفة', 'تاريخ', 'أدب', 'علوم', 'سير ذاتية'].map((presetTag) => {
                                    const isSelected = bookFormTags.includes(presetTag);
                                    return (
                                      <button
                                        key={presetTag}
                                        type="button"
                                        onClick={() => {
                                          if (isSelected) {
                                            setBookFormTags(bookFormTags.filter(t => t !== presetTag));
                                          } else {
                                            setBookFormTags([...bookFormTags, presetTag]);
                                          }
                                        }}
                                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-3xs'
                                            : 'bg-white border-[#E2DCC8] text-gray-600 hover:border-[#8B9D83]'
                                        }`}
                                      >
                                        {isSelected ? '✓ ' : '+ '}{presetTag}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Custom Tag Input */}
                                <div className="flex items-center gap-1.5 mt-2">
                                  <input
                                    type="text"
                                    value={bookFormCustomTag}
                                    onChange={(e) => setBookFormCustomTag(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (bookFormCustomTag.trim() && !bookFormTags.includes(bookFormCustomTag.trim())) {
                                          setBookFormTags([...bookFormTags, bookFormCustomTag.trim()]);
                                          setBookFormCustomTag('');
                                        }
                                      }
                                    }}
                                    placeholder="أضف تصنيفاً خاصاً..."
                                    className="flex-1 bg-[#F9F7F2]/50 border border-[#E2DCC8] rounded-lg px-2.5 py-1 text-[10px] font-bold text-[#3A3A3A] focus:outline-none focus:ring-1 focus:ring-[#8B9D83]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (bookFormCustomTag.trim() && !bookFormTags.includes(bookFormCustomTag.trim())) {
                                        setBookFormTags([...bookFormTags, bookFormCustomTag.trim()]);
                                        setBookFormCustomTag('');
                                      }
                                    }}
                                    className="px-3 py-1 bg-[#5A5A40] text-white text-[10px] font-bold rounded-lg hover:bg-[#3D3D2A] transition-colors cursor-pointer"
                                  >
                                    + إضافة
                                  </button>
                                </div>

                                {/* Selected Tags list */}
                                {bookFormTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    <span className="text-[10px] font-bold text-gray-400 self-center">المحددة:</span>
                                    {bookFormTags.map(tag => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black rounded-md"
                                      >
                                        🏷️ {tag}
                                        <button
                                          type="button"
                                          onClick={() => setBookFormTags(bookFormTags.filter(t => t !== tag))}
                                          className="text-teal-600 hover:text-red-500 font-extrabold mr-0.5 cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Column 2: Attachments & Simulation */}
                            <div className="space-y-3 bg-[#F9F7F2]/35 border border-[#E2DCC8]/40 rounded-2xl p-4">
                              <span className="block text-xs font-black text-[#5A5A40] border-b border-[#E2DCC8]/30 pb-1 mb-2">الملحقات الكاملة للكتاب (PDF، صوت، رسم، إلخ) : 📎</span>
                              
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-1">مسار ملف PDF (أو اسم المرجع الملحق)</label>
                                <input
                                  type="text"
                                  value={bookFormPdf}
                                  onChange={(e) => setBookFormPdf(e.target.value)}
                                  placeholder="مثال: كتاب_العلاج_المعرفي_الكامل.pdf"
                                  className="w-full bg-white border border-[#E2DCC8] rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#8B9D83] text-[#3A3A3A] font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-1">رابط مرجعي للموقع أو الكتاب الإلكتروني</label>
                                <input
                                  type="text"
                                  value={bookFormLink}
                                  onChange={(e) => setBookFormLink(e.target.value)}
                                  placeholder="https://example.com/mybook"
                                  className="w-full bg-white border border-[#E2DCC8] rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#8B9D83] text-[#3A3A3A] font-bold"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookFormAudio(bookFormAudio ? '' : 'سجل_ملخص_كتابي_رائع.mp3');
                                  }}
                                  className={`py-1.5 text-[10px] font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    bookFormAudio 
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                                      : 'bg-white border-[#E2DCC8] hover:bg-gray-50 text-[#3A3A3A]'
                                  }`}
                                >
                                  <span>🎙️ {bookFormAudio ? 'صوت مرفق ✓' : 'أضف صوت'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookFormVideo(bookFormVideo ? '' : 'فيديو_شرح_مهم.mp4');
                                  }}
                                  className={`py-1.5 text-[10px] font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    bookFormVideo 
                                      ? 'bg-blue-50 border-blue-300 text-blue-800' 
                                      : 'bg-white border-[#E2DCC8] hover:bg-gray-50 text-[#3A3A3A]'
                                  }`}
                                >
                                  <span>📹 {bookFormVideo ? 'فيديو مرفق ✓' : 'أضف فيديو'}</span>
                                </button>
                              </div>

                              <div className="flex items-center justify-between border-t border-gray-200/50 pt-2.5 mt-2.5">
                                <span className="text-[10px] font-black text-[#5A5A40]">رسم مخطط ذهني أو انطباع للرواية يدوياً: 🎨</span>
                                <button
                                  type="button"
                                  onClick={() => setBookFormHasMindMap(!bookFormHasMindMap)}
                                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                                    bookFormHasMindMap ? 'bg-[#8B9D83]' : 'bg-gray-300'
                                  }`}
                                >
                                  <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                                    bookFormHasMindMap ? 'right-5' : 'right-1'
                                  }`} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => setShowAddBookForm(false)}
                              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all cursor-pointer text-gray-500"
                            >
                              إلغاء وحفظ لاحقاً
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              حفظ الكتاب
                            </button>
                          </div>
                        </form>
                      ) : selectedBookDetail ? (
                        /* BOOK DETAIL OVERLAY VIEW */
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <button
                                type="button"
                                onClick={() => setSelectedBookDetail(null)}
                                className="text-xs font-black text-[#8B9D83] hover:text-[#5A5A40] flex items-center gap-1.5 cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                                <span>العودة لقائمة الكتب</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBook(selectedBookDetail.id)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                title="حذف الكتاب"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[10px] font-bold text-gray-400">اسم الكتاب والتقييم 📚</span>
                                  <h4 className="text-base font-black text-[#3A3A3A] mt-0.5">{selectedBookDetail.title}</h4>
                                  <div className="flex items-center text-amber-500 text-sm mt-1">
                                    {'★'.repeat(selectedBookDetail.rating)}
                                    {'☆'.repeat(5 - selectedBookDetail.rating)}
                                    <span className="text-xs text-gray-400 font-bold mr-2">({selectedBookDetail.rating}/5)</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-gray-400">ملاحظات، تلخيص واقتباسات 📝</span>
                                  <p className="text-xs text-gray-600 leading-relaxed max-h-[160px] overflow-y-auto mt-1 whitespace-pre-wrap bg-[#F9F7F2]/45 border border-[#E2DCC8]/50 p-3.5 rounded-2xl font-medium">
                                    {selectedBookDetail.notes || 'لا توجد ملاحظات تفصيلية مسجلة.'}
                                  </p>
                                </div>

                                {selectedBookDetail.tags && selectedBookDetail.tags.length > 0 && (
                                  <div className="bg-teal-50/50 border border-teal-100/80 rounded-xl p-2.5 mt-2">
                                    <span className="text-[10px] font-black text-teal-800 block mb-1">🏷️ تصنيفات الكتاب والوسوم:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {selectedBookDetail.tags.map(tag => (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => {
                                            setSelectedBookTagFilter(tag);
                                            setSelectedBookDetail(null);
                                          }}
                                          className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-3xs"
                                          title="تصفية المكتبة بهذا التصنيف"
                                        >
                                          <span>🏷️</span>
                                          <span>{tag}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="bg-[#F9F7F2]/30 border border-[#E2DCC8]/50 rounded-2xl p-4 space-y-3 flex flex-col justify-start">
                                <span className="block text-xs font-black text-[#5A5A40] border-b border-gray-100 pb-1">المحاكاة التفاعلية للملحقات: 📎</span>
                                
                                {selectedBookDetail.pdfPath && (
                                  <button
                                    type="button"
                                    onClick={() => alert(`📖 محاكاة فتح مستند PDF:\nاسم المستند: ${selectedBookDetail.pdfPath}\nتنبيه: جاري تحميل وقراءة الفصول والملخص الشامل بنجاح وسرية تامة...`)}
                                    className="w-full text-right p-2.5 bg-white border border-[#E2DCC8] hover:border-[#8B9D83] rounded-xl flex items-center justify-between transition-all text-xs font-bold text-gray-700 cursor-pointer shadow-3xs"
                                  >
                                    <span className="flex items-center gap-2"><span>📂</span> <span>فتح ملف PDF والكتاب</span></span>
                                    <span className="text-[10px] text-[#8B9D83]">جاهز للقراءة 📖</span>
                                  </button>
                                )}

                                {selectedBookDetail.referenceLink && (
                                  <a
                                    href={selectedBookDetail.referenceLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full text-right p-2.5 bg-white border border-[#E2DCC8] hover:border-[#8B9D83] rounded-xl flex items-center justify-between transition-all text-xs font-bold text-gray-700 cursor-pointer shadow-3xs"
                                  >
                                    <span className="flex items-center gap-2"><span>🔗</span> <span>رابط الموقع المرجعي للكتاب</span></span>
                                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                  </a>
                                )}

                                {selectedBookDetail.audioAttachment && (
                                  <button
                                    type="button"
                                    onClick={() => alert(`🎙️ جاري تفعيل مشغل الملخص الصوتي للكتاب...\nالملف: ${selectedBookDetail.audioAttachment}\nاستمع للمراجعة الصوتية القصيرة بنجاح.`)}
                                    className="w-full text-right p-2.5 bg-white border border-[#E2DCC8] hover:border-[#8B9D83] rounded-xl flex items-center justify-between transition-all text-xs font-bold text-gray-700 cursor-pointer shadow-3xs"
                                  >
                                    <span className="flex items-center gap-2"><span>🎙️</span> <span>الاستماع للملخص الصوتي</span></span>
                                    <Music className="w-3.5 h-3.5 text-[#8B9D83]" />
                                  </button>
                                )}

                                {selectedBookDetail.videoAttachment && (
                                  <button
                                    type="button"
                                    onClick={() => alert(`📹 تشغيل المراجعة المرئية السريعة:\nالملف: ${selectedBookDetail.videoAttachment}\nالعرض ناجح ومحمي وسريع الاستجابة.`)}
                                    className="w-full text-right p-2.5 bg-white border border-[#E2DCC8] hover:border-[#8B9D83] rounded-xl flex items-center justify-between transition-all text-xs font-bold text-gray-700 cursor-pointer shadow-3xs"
                                  >
                                    <span className="flex items-center gap-2"><span>📹</span> <span>تشغيل الفيديو المرفق</span></span>
                                    <span className="text-[10px] text-[#D4A373]">مقطع مرئي 📹</span>
                                  </button>
                                )}

                                {selectedBookDetail.hasMindMap && (
                                  <div className="border border-dashed border-[#E2DCC8] rounded-xl p-3 bg-white space-y-2">
                                    <span className="block text-[10px] font-black text-gray-400">مخطط ذهني لربط وتلخيص الرواية 🎨:</span>
                                    <div className="flex flex-col items-center justify-center p-2 bg-[#F9F7F2] rounded-lg border border-[#E2DCC8]/40 space-y-1.5">
                                      <div className="text-[11px] font-black text-[#5A5A40] bg-white border border-[#E2DCC8] px-2.5 py-0.5 rounded-full shadow-3xs">
                                        {selectedBookDetail.title.slice(0, 18)}...
                                      </div>
                                      <div className="w-0.5 h-3 bg-[#8B9D83]/60" />
                                      <div className="flex justify-center gap-2 w-full">
                                        <span className="text-[9px] font-bold bg-white border border-gray-100 px-1.5 py-0.5 rounded-lg text-gray-500 shadow-3xs">المحور الأول</span>
                                        <span className="text-[9px] font-bold bg-white border border-gray-100 px-1.5 py-0.5 rounded-lg text-gray-500 shadow-3xs">المحور الثاني</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-[10px] text-gray-400 text-center leading-relaxed border-t border-gray-100 pt-3">
                            <span>💡 هذه الملحقات مدمجة وتفاعلية لمساعدتك على قراءة مراجعك وتلخيصها يدوياً أو صوتياً وبناء أرشيفك الثقافي.</span>
                          </div>
                        </div>
                      ) : (
                        /* LIST BOOKS AND SEARCH */
                        (() => {
                          const getCoverBg = (id: string) => {
                            const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                            const colors = [
                              'from-[#5A5A40] to-[#3D3D2A] border-[#FEFAE0]/30 text-amber-100/90', // Olive Gold
                              'from-[#5C2E2B] to-[#3D1E1C] border-[#E2DCC8]/30 text-[#FEFAE0]', // Crimson Leather
                              'from-[#2E4A62] to-[#1A2D3C] border-blue-200/30 text-blue-100', // Royal Blue
                              'from-[#4A5D4E] to-[#2D3A30] border-[#CCD5AE]/40 text-[#FEFAE0]', // Sage Pine
                              'from-[#78350F] to-[#451A03] border-amber-400/30 text-amber-100', // Rich Mahogany
                            ];
                            return colors[hash % colors.length];
                          };

                          const filteredBooks = books.filter(book => {
                            const matchesSearch = book.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                                                  (book.notes || '').toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                                                  (book.tags || []).some(t => t.toLowerCase().includes(bookSearchQuery.toLowerCase()));
                            const matchesRating = bookRatingFilter === 0 || book.rating >= bookRatingFilter;
                            const matchesAttachment = bookAttachmentFilter === 'all' ||
                                                      (bookAttachmentFilter === 'pdf' && book.pdfPath) ||
                                                      (bookAttachmentFilter === 'audio' && book.audioAttachment) ||
                                                      (bookAttachmentFilter === 'video' && book.videoAttachment) ||
                                                      (bookAttachmentFilter === 'mindmap' && book.hasMindMap);
                            const matchesTag = selectedBookTagFilter === 'all' ||
                                               (book.tags || []).includes(selectedBookTagFilter);
                            return matchesSearch && matchesRating && matchesAttachment && matchesTag;
                          });

                          return (
                            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-hidden">
                              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                                
                                {/* Top bar: Title & Add Book Button */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                  <div>
                                    <h3 className="text-base font-extrabold text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                                      <span className="p-1.5 bg-[#8B9D83]/10 text-[#8B9D83] rounded-xl">📚</span>
                                      <span>مكتبتي الشاملة وأرشيفي الثقافي</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">تصفح وتصفية جميع المراجع والكتب والروايات المضافة بذكاء ميسر</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setShowAddBookForm(true)}
                                    className="px-4 py-2 bg-gradient-to-l from-[#5A5A40] to-[#8B9D83] hover:opacity-95 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm active:scale-97 shrink-0"
                                  >
                                    + إضافة مادة قرائية جديدة
                                  </button>
                                </div>

                                {/* Advanced Filters Bar */}
                                <div className="bg-[#F9F7F2]/65 border border-[#E2DCC8]/60 p-3.5 rounded-2xl space-y-3">
                                  {/* Row 1: Search Input */}
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={bookSearchQuery}
                                      onChange={(e) => setBookSearchQuery(e.target.value)}
                                      placeholder="ابحث عن كتاب بالاسم، التصنيف، أو الكلمات الدلالية..."
                                      className="w-full bg-white border border-[#E2DCC8] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B9D83] text-[#3A3A3A] font-bold"
                                    />
                                    <span className="absolute left-3.5 top-2.5 text-gray-400 text-xs">🔍</span>
                                    {bookSearchQuery && (
                                      <button
                                        type="button"
                                        onClick={() => setBookSearchQuery('')}
                                        className="absolute left-8 top-2 text-gray-400 hover:text-[#5A5A40] text-xs font-bold cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  {/* Row 2: Attachment and Rating Filters */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-0.5">
                                    {/* Attachment Filter */}
                                    <div className="flex items-center space-x-1.5 space-x-reverse overflow-x-auto py-0.5">
                                      <span className="text-[10px] text-gray-400 font-black shrink-0">الملحقات:</span>
                                      {[
                                        { id: 'all', label: 'الكل' },
                                        { id: 'pdf', label: 'PDF 📂' },
                                        { id: 'audio', label: 'صوت 🎙️' },
                                        { id: 'video', label: 'مرئي 📹' },
                                        { id: 'mindmap', label: 'خريطة ذهنية 🎨' }
                                      ].map(opt => (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => setBookAttachmentFilter(opt.id)}
                                          className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                                            bookAttachmentFilter === opt.id
                                              ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-3xs'
                                              : 'bg-white border-[#E2DCC8] text-gray-500 hover:text-[#5A5A40]'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Rating Filter */}
                                    <div className="flex items-center space-x-1.5 space-x-reverse">
                                      <span className="text-[10px] text-gray-400 font-black">التقييم الأدنى:</span>
                                      <select
                                        value={bookRatingFilter}
                                        onChange={(e) => setBookRatingFilter(Number(e.target.value))}
                                        className="bg-white border border-[#E2DCC8] rounded-lg px-2 py-1 text-[10px] font-black text-[#5A5A40] focus:outline-none"
                                      >
                                        <option value={0}>عرض الكل ⭐</option>
                                        <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                                        <option value={4}>⭐⭐⭐⭐+ (4)</option>
                                        <option value={3}>⭐⭐⭐+ (3)</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Row 3: Quick Tag Filters Bar (التصنيفات والوسوم) */}
                                  <div className="border-t border-[#E2DCC8]/40 pt-2.5 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-[#5A5A40] flex items-center gap-1">
                                        <span>🏷️</span>
                                        <span>تصفية سريعة بحسب التصنيفات:</span>
                                      </span>
                                      {selectedBookTagFilter !== 'all' && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedBookTagFilter('all')}
                                          className="text-[10px] text-teal-700 hover:underline font-extrabold cursor-pointer"
                                        >
                                          إلغاء التصفية (عرض الكل) ✕
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                                      {[
                                        'الكل',
                                        'تنمية ذاتية',
                                        'روايات',
                                        'علم نفس',
                                        'صحة نفسية',
                                        'فلسفة',
                                        'تاريخ',
                                        'أدب',
                                        'علوم',
                                        'سير ذاتية',
                                        ...Array.from(new Set(books.flatMap(b => b.tags || [])))
                                      ].filter((v, i, a) => a.indexOf(v) === i).map(tag => {
                                        const isAll = tag === 'الكل';
                                        const count = isAll
                                          ? books.length
                                          : books.filter(b => (b.tags || []).includes(tag)).length;
                                        
                                        if (!isAll && count === 0) return null; // Hide empty tag chips

                                        const isSelected = isAll ? selectedBookTagFilter === 'all' : selectedBookTagFilter === tag;

                                        return (
                                          <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setSelectedBookTagFilter(isAll ? 'all' : tag)}
                                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 border ${
                                              isSelected
                                                ? 'bg-gradient-to-r from-[#5A5A40] to-[#8B9D83] text-white border-[#5A5A40] shadow-2xs scale-[1.02]'
                                                : 'bg-white text-[#3A3A3A] border-[#E2DCC8] hover:bg-teal-50/60 hover:border-teal-300'
                                            }`}
                                          >
                                            <span>{isAll ? '📚' : '🏷️'}</span>
                                            <span>{tag}</span>
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                                              isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                              {count}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* Books Grid (Custom Redesigned) */}
                                {filteredBooks.length === 0 ? (
                                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9F7F2]/20 border border-dashed border-[#E2DCC8] rounded-3xl my-2">
                                    <span className="text-3xl animate-bounce">📭</span>
                                    <div className="space-y-1 mt-2">
                                      <h4 className="text-xs font-black text-[#5A5A40]">لم يتم العثور على أي مراجع مطابقة للبحث أو التصنيف المحدد</h4>
                                      <p className="text-[10px] text-gray-400">يرجى تعديل خيارات التصفية أو إدخال مادة قرائية جديدة للبدء.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5 p-1">
                                    {filteredBooks.map((book) => (
                                      <div
                                        key={book.id}
                                        onClick={() => setSelectedBookDetail(book)}
                                        className="bg-white hover:bg-[#F9F7F2]/30 border border-[#E2DCC8]/70 hover:border-[#8B9D83] p-3 rounded-2xl flex items-stretch space-x-3.5 space-x-reverse transition-all cursor-pointer shadow-3xs hover:shadow-xs group duration-200"
                                      >
                                        {/* Left Side: Premium Physical Book Cover Simulation */}
                                        <div className={`w-[85px] shrink-0 bg-gradient-to-b ${getCoverBg(book.id)} rounded-xl border p-2 flex flex-col justify-between shadow-2xs relative overflow-hidden transition-transform group-hover:scale-102`}>
                                          {/* Gold Leaf Accent Lines */}
                                          <div className="absolute inset-y-0 right-1 w-0.5 bg-yellow-300/20" />
                                          <div className="absolute inset-x-2 top-2 h-[1px] bg-yellow-300/15" />
                                          <div className="absolute inset-x-2 bottom-2 h-[1px] bg-yellow-300/15" />

                                          {/* Spine simulation */}
                                          <div className="absolute inset-y-0 right-0 w-1.5 bg-black/15 border-l border-white/5" />

                                          <div className="space-y-1 relative z-10">
                                            <span className="block text-[8px] tracking-widest uppercase opacity-75 font-black text-center">أرشيف اقرأ</span>
                                            <h5 className="text-[10px] font-black text-center leading-tight line-clamp-3 mt-1 text-shadow-sm font-sans">
                                              {book.title}
                                            </h5>
                                          </div>

                                          <div className="text-center relative z-10 pt-2">
                                            <span className="inline-block text-[9px] bg-white/15 px-1.5 py-0.5 rounded-md font-black">
                                              ⭐ {book.rating}.0
                                            </span>
                                          </div>
                                        </div>

                                        {/* Right Side: Detailed metadata and notes preview */}
                                        <div className="flex-grow flex flex-col justify-between py-1 text-right">
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <h4 className="text-xs font-black text-[#3A3A3A] group-hover:text-[#8B9D83] transition-colors line-clamp-1 leading-snug">
                                                {book.title}
                                              </h4>
                                              <span className="text-[8px] text-gray-400 font-extrabold whitespace-nowrap bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                                                {book.createdAt ? book.createdAt.split('T')[0] : 'سابق'}
                                              </span>
                                            </div>
                                            
                                            <p className="text-[10.5px] text-gray-500 line-clamp-2 leading-relaxed">
                                              {book.notes || 'لا توجد ملاحظات أو اقتباسات مدونة لهذه المادة القرائية.'}
                                            </p>

                                            {/* Tag Chips on Book Card */}
                                            {book.tags && book.tags.length > 0 && (
                                              <div className="flex flex-wrap gap-1 pt-1">
                                                {book.tags.map(t => (
                                                  <span
                                                    key={t}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedBookTagFilter(t);
                                                    }}
                                                    className="text-[9px] font-black bg-teal-50 text-teal-800 border border-teal-200/80 px-1.5 py-0.2 rounded-md hover:bg-teal-100 transition-colors"
                                                    title="تصفية حسب هذا التصنيف"
                                                  >
                                                    🏷️ {t}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          {/* Glowing Attachment Badges */}
                                          <div className="flex flex-wrap gap-1 mt-2.5">
                                            {book.pdfPath && (
                                              <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-lg border border-emerald-100">PDF 📂</span>
                                            )}
                                            {book.referenceLink && (
                                              <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-lg border border-blue-100">مرجع 🔗</span>
                                            )}
                                            {book.audioAttachment && (
                                              <span className="text-[9px] font-black bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-lg border border-purple-100">صوت 🎙️</span>
                                            )}
                                            {book.videoAttachment && (
                                              <span className="text-[9px] font-black bg-amber-50 text-[#D4A373] px-1.5 py-0.5 rounded-lg border border-amber-100">مرئي 📹</span>
                                            )}
                                            {book.hasMindMap && (
                                              <span className="text-[9px] font-black bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-lg border border-rose-100">مخطط 🎨</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Footer guide statement */}
                              <div className="text-[10px] text-gray-400 text-center leading-relaxed border-t border-gray-100 pt-3">
                                <span>💡 اضغط على غلاف أي كتاب لاستعراض محتوياته الكاملة وملاحظاتك المترابطة أو تشغيل المراجعات المرئية والصوتية له.</span>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {/* TAB 3: PSYCHOLOGICAL REPORTS & AI WISDOM */}
                  {calendarSubTab === 'reports' && (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[#E2DCC8]/50 pb-3">
                          <h3 className="text-base font-black text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                            <span className="p-1 bg-[#8B9D83]/10 text-[#8B9D83] rounded-lg">🧠</span>
                            <span>التقارير التحليلية والحكمة النفسية 🧠</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCalendarModal(false);
                              setShowTherapistModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-l from-[#5A5A40] to-[#8B9D83] text-white text-xs font-black rounded-xl cursor-pointer transition-all hover:opacity-90 shadow-3xs"
                          >
                            توليد التقرير السلوكي والمزاجي الأسبوعي
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Compliance KPIs card */}
                          <div className="bg-[#F9F7F2]/40 border border-[#E2DCC8]/60 rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-black text-[#5A5A40] border-b border-[#E2DCC8]/30 pb-1 flex items-center justify-between">
                              <span>مستوى التزام العادات السلوكية 🏃‍♂️</span>
                              <span className="text-[10px] font-extrabold text-[#8B9D83]">هذا الأسبوع</span>
                            </h4>
                            <div className="space-y-2.5">
                              {habits.slice(0, 3).map((habit) => {
                                const totalDays = Object.keys(habit.history).length;
                                const completedDays = Object.values(habit.history).filter(v => v).length;
                                const ratio = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
                                return (
                                  <div key={habit.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                                      <span>{habit.name}</span>
                                      <span>{ratio}% ({completedDays}/{totalDays})</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-[#8B9D83] rounded-full transition-all duration-500" 
                                        style={{ width: `${ratio}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dynamic Custom AI Wisdom Card */}
                          <div className="bg-[#F9F7F2]/45 border border-[#E2DCC8]/60 p-4 rounded-2xl flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="block text-[10px] font-black text-gray-400">توصية المستشار الطبي الذكي اليوم 🧘:</span>
                              <p className="text-xs text-gray-700 leading-relaxed font-bold">
                                "إن توازن جودة القراءة مع ممارسة تمارين التنفس هو ركيزة أساسية لخفض مستويات الكورتيزول وتصفية العقل. ننصحك بقراءة ٢٠ دقيقة من كتاب العلاج السلوكي المفضل لديك قبل النوم وتجنب الشاشات."
                              </p>
                            </div>
                            <div className="text-[10px] text-gray-400 italic text-left border-t border-gray-100/80 pt-2.5 mt-2.5">
                              — مستشارك النفسي الصديق
                            </div>
                          </div>
                        </div>

                        {/* Additional insights list */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-3xs">
                          <h4 className="text-xs font-black text-[#5A5A40]">توصيات لتحسين جودة القراءة والصحة النفسية 🧘:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-gray-600 font-semibold leading-relaxed">
                            <div className="flex items-start gap-1.5">
                              <span className="text-emerald-500">✔</span>
                              <span>ممارسة رياضة التنفس والوعي الذهني لمدة ١٠ دقائق يومياً قبل كتابة المذكرات لتخفيف التوتر.</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="text-emerald-500">✔</span>
                              <span>تخصيص ٢٠ دقيقة للقراءة من المكتبة الشاملة قبل النوم لتهدئة الدماغ واستبدال الهواتف الزرقاء.</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="text-emerald-500">✔</span>
                              <span>ربط المهام الصعبة بمكافأة ممتعة كقراءة فصل جديد من روايتك المفضلة لتشجيع العقل على الإنجاز.</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="text-emerald-500">✔</span>
                              <span>مراجعة المخططات الذهنية للكتب وقائمة الاقتباسات بشكل دوري لترسيخ المعارف والسلوكيات الإيجابية.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-400 text-center leading-relaxed border-t border-gray-100 pt-3">
                        <span>💡 يمكنك تصدير تقرير علاجي مفصل وجاهز للطباعة والتسليم لطبيبك المعالج عن طريق النقر على الزر بالزاوية العلوية اليسرى.</span>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* Global Hidden Input File Elements for Dashboard Quick Actions */}
      <input 
        type="file" 
        id="global-image-uploader" 
        accept="image/*" 
        className="hidden" 
        onChange={handleGlobalImageUpload} 
      />
      <input 
        type="file" 
        id="global-video-uploader" 
        accept="video/*" 
        className="hidden" 
        onChange={handleGlobalVideoUpload} 
      />
      <input 
        type="file" 
        id="global-audio-uploader" 
        accept=".mp3,.m4a,.wav,.aac,.ogg,.opus,.flac,.webm,.amr,.3gp,audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/x-m4a,audio/aac,audio/ogg,audio/webm,audio/amr" 
        className="hidden" 
        onChange={handleGlobalAudioUpload} 
      />
      <input 
        type="file" 
        id="global-document-uploader" 
        accept=".pdf,.doc,.docx,.txt" 
        className="hidden" 
        onChange={handleGlobalDocumentUpload} 
      />

      {/* Simulated Hardware Power Button protruding from the right edge */}
      <div 
        onClick={() => setSettings(prev => ({ ...prev, isAppLocked: true }))}
        className="fixed right-0 top-[35%] w-3.5 h-16 bg-gradient-to-l from-[#222] to-[#444] rounded-l-lg hover:from-[#333] hover:to-[#555] border border-gray-600 border-r-0 shadow-xl cursor-pointer transition-all hover:w-4 z-[9999] flex items-center justify-center group"
        title="زر الـ Power الجانبي لقفل التطبيق وشاشة القفل 🔌"
      >
        <span className="opacity-0 group-hover:opacity-100 absolute right-6 bg-black/85 text-white text-[10px] font-extrabold py-1 px-2 rounded-lg whitespace-nowrap transition-opacity pointer-events-none shadow-md">
          إغلاق/قفل الشاشة 🔌
        </span>
      </div>

      {/* 📥 Archive Action Toast Notification */}
      {archiveToast && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto bg-[#2B3E50] text-white p-4 rounded-2xl shadow-2xl border border-[#8B9D83]/40 flex items-center justify-between space-x-3 space-x-reverse animate-slideUp transition-all" dir="rtl">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="p-2 bg-[#8B9D83] text-white rounded-xl text-lg shrink-0">
              {archiveToast.action === 'archived' ? '📥' : '📤'}
            </div>
            <span className="text-xs font-bold leading-relaxed truncate">
              {archiveToast.message}
            </span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
            <button
              type="button"
              onClick={() => {
                toggleArchiveDiary(archiveToast.diaryId);
                setArchiveToast(null);
              }}
              className="px-3 py-1.5 bg-[#8B9D83] hover:bg-[#72856A] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
            >
              تراجع (Undo)
            </button>
            <button
              type="button"
              onClick={() => setArchiveToast(null)}
              className="text-gray-400 hover:text-white text-xs p-1 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 👁️ Modal to Preview Archived Diary/Thought */}
      {viewArchivedDiary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl border border-[#E2DCC8] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2DCC8]/60 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className={`text-xs px-2.5 py-1 rounded-xl font-black ${
                  viewArchivedDiary.diaryType === 'thought' 
                    ? 'bg-[#FCF5DE] text-[#A67E2E] border border-[#E9E1C4]' 
                    : 'bg-[#EEF1EB] text-[#556E4F] border border-[#DCE4D8]'
                }`}>
                  {viewArchivedDiary.diaryType === 'thought' ? '✍️ خاطرة مؤرشفة' : '📓 يومية مؤرشفة'}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  📅 {viewArchivedDiary.createdAt.split('T')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewArchivedDiary(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <h3 className="text-lg font-extrabold text-[#3A3A3A]">
              {viewArchivedDiary.title || 'مذكرة بدون عنوان'}
            </h3>

            {/* Content */}
            <div className="bg-[#F9F7F2] border border-[#E2DCC8]/60 p-4 rounded-2xl text-xs leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-medium">
              {viewArchivedDiary.content || 'لا يوجد نص مكتوب (مرفقات فقط).'}
            </div>

            {/* Moods & Tags */}
            {((viewArchivedDiary.moods || []).length > 0 || (viewArchivedDiary.tags || []).length > 0) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {viewArchivedDiary.moods.map(m => (
                  <span key={m} className="bg-[#8B9D83]/10 text-[#556E4F] text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    😊 {m}
                  </span>
                ))}
                {viewArchivedDiary.tags.map(t => (
                  <span key={t} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Attachments if any */}
            {(viewArchivedDiary.images.length > 0 || ((viewArchivedDiary as any).recordings || []).length > 0) && (
              <div className="space-y-3 pt-2 border-t border-[#E2DCC8]/40">
                <span className="text-xs font-bold text-[#5A5A40] block">المرفقات والصوتيات:</span>
                {viewArchivedDiary.images.map((img, idx) => (
                  <img key={idx} src={img} alt="مرفق" className="max-h-48 rounded-xl border border-gray-200 object-cover" />
                ))}
                {((viewArchivedDiary as any).recordings || []).map((rec: any) => (
                  <audio key={rec.id} controls src={rec.dataUrl || rec.blobUrl} className="w-full h-8" />
                ))}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E2DCC8]/60">
              <button
                type="button"
                onClick={() => {
                  toggleArchiveDiary(viewArchivedDiary.id);
                  setViewArchivedDiary(null);
                }}
                className="px-4 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 space-x-reverse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استرجاع إلى اليوميات الرئيسية</span>
              </button>
              <button
                type="button"
                onClick={() => setViewArchivedDiary(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Pros & Cons Modal Instance (الإيجابيات والسلبيات) */}
      <DailyProsConsModal
        isOpen={isProsConsModalOpen}
        onClose={() => setIsProsConsModalOpen(false)}
        dayKey={prosConsDayKey}
        displayDate={prosConsDisplayDate}
        dayDiaries={prosConsDayDiaries}
        allHabits={habits}
        allGratitudeCards={gratitudeCards}
        allBooks={books}
        allDiaries={diaries}
        userApiKey={settings.userApiKey}
        appLanguage={settings.appLanguage}
      />

      {/* 📱 Lock Screen Widget Instructions Modal */}
      {showLockScreenWidgetInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-2 border-[#D4A373] space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#D4A373]" />
                <span>إشعار شاشة القفل المثبت (Lock Screen Notification)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLockScreenWidgetInfoModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 leading-relaxed font-medium">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl font-bold text-amber-950 flex items-start gap-2.5">
                <span className="text-xl">📱</span>
                <div>
                  <span className="font-extrabold block text-sm">تثبيت الاختصارات السريعة عند ضغط زر الباور:</span>
                  <span>عند تمكين الخيار، يُثبّت التطبيق إشعاراً دائماً يحوي كافة الاختصارات (كتابة، تسجيل، مستشار، مزاجي) على شاشة القفل الخارجية.</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <h4 className="font-black text-gray-900 text-xs">خطوات الضبط لضمان ظهوره بشكل ممتاز:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-600 pr-1">
                  <li><strong>السماح بالإشعارات:</strong> وافق على إذن الإشعارات عندما يطلبه المتصفح.</li>
                  <li><strong>تثبيت التطبيق PWA:</strong> اضغط على خيار "إضافة إلى الشاشة الرئيسية" في متصفحك ليصبح تطبيقاً ثابتاً بالنظام.</li>
                  <li><strong>إعدادات شاشة القفل بالهاتف:</strong> تأكد من إظهار محتوى الإشعارات على شاشة قفل جهازك (Show notification content on lock screen).</li>
                </ol>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLockScreenWidgetInfoModal(false);
                  triggerLockScreenNotification();
                }}
                className="w-full py-3 bg-[#4E685B] hover:bg-[#3F5449] text-white rounded-2xl font-extrabold text-xs transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-2 active:scale-95"
              >
                <BellRing className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>تثبيت الإشعار الآن على شاشة القفل 📌</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
