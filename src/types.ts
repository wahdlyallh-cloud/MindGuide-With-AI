export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface AudioRecording {
  id: string;
  name: string;
  dataUrl: string;
  blobUrl?: string;
  duration: number; // in seconds
  transcription?: string;
  speechEmotion?: {
    primaryEmotion: 'فرح' | 'قلق' | 'حزن' | 'غضب' | 'هدوء' | 'طبيعي' | string;
    intensity: 'عالية' | 'متوسطة' | 'منخفضة' | string;
    intensityScore: number; // 0 - 100%
    vocalToneDetails?: string;
    recommendedColor?: 'amber' | 'emerald' | 'blue' | 'red' | 'teal' | 'stone' | string;
  };
}

export interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  dataUrl: string;
}

export interface ChatLogEntry {
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
  audioUrl?: string; // If recorded/synthesized
}

export interface MedicationTrack {
  id: string;
  name: string;
  time: string;
  taken: boolean;
}

export interface HabitTrack {
  id: string;
  name: string;
  completed: boolean;
}

export interface DiaryEdit {
  id: string;
  content: string;
  timestamp: string; // ISO String or custom formatted timestamp
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  isEdited?: boolean;
  edits?: DiaryEdit[];
  moods: string[]; // Manual selected emojis/mood tags (e.g. "happy", "anxious")
  aiMoodAnalysis?: { mood: string; percentage: number }[]; // Predicted by Gemini
  importance: number; // Importance rating (1 to 5 stars)
  color: string; // Theme/background color for this note (e.g. bg-amber-50)
  images: string[]; // Base64 or Object URLs
  videos: string[]; // Video links/data
  links?: string[]; // Web Links / URLs
  audioRecordings: AudioRecording[];
  files: FileAttachment[];
  drawing?: string; // Base64 data-uri of canvas drawing
  tasks: TaskItem[];
  tags: string[];
  chatLogs: ChatLogEntry[];
  isLocked: boolean;
  lockPassword?: string;
  // Dynamic life-map elements logged with this diary
  medications?: MedicationTrack[];
  sportsDuration?: number; // Minutes spent on exercise
  sportsType?: string; // Type of workout (e.g., 'مشي', 'تمارين قوة', 'يوجا واستطالة', etc.)
  sportsIntensity?: 'light' | 'medium' | 'high'; // Workout intensity
  sportsCalories?: number; // Estimated calories burned
  sportsEnergyBefore?: number; // Energy level before exercise (1-5)
  sportsEnergyAfter?: number; // Energy level after exercise (1-5)
  sportsNotes?: string; // Exercise notes / achievements
  sleepHours?: number; // Hours slept
  customHabits?: HabitTrack[];
  isArchived?: boolean; // Archived entry flag
  isTrash?: boolean; // Trashed entry flag
  deletedAt?: string; // Date when trashed
  waterCups?: number; // Water cups logged
  fastMoodScore?: number; // Daily fast mood score (1-10)
  symptomsChecklist?: string[]; // Logged physical symptoms
  cbtWorksheets?: CBTWorksheet[]; // CBT exercises attached to this day
  diaryType?: 'diary' | 'thought'; // Type of entry (diary or thought)
}

export interface CBTWorksheet {
  id: string;
  createdAt: string; // ISO string
  triggerEvent: string; // الحدث المثبت/المثير
  negativeThoughts: string; // الأفكار التلقائية السلبية
  cognitiveDistortion: string; // التشوه المعرفي المكتشف
  rationalAlternative: string; // البديل الأكثر عقلانية
  emotionBefore: number; // 1-10
  emotionAfter: number; // 1-10
  exerciseType?: 'thought_record' | 'downward_arrow' | 'worry_box' | 'exposure_ladder' | 'coping_card' | 'grounding';
  evidenceFor?: string; // الأدلة المؤيدة للفكرة
  evidenceAgainst?: string; // الأدلة المعارضة للفكرة
  coreBelief?: string; // المعتقد الأساسي المكتشف
  healthierBelief?: string; // المعتقد البديل الصحي
  worryCategory?: 'actionable' | 'uncontrollable'; // نوع القلق
  actionSteps?: string[]; // خطوات العمل للمخاوف القابلة للحل
  exposureSteps?: { id: string; stepNumber: number; situation: string; expectedAnxiety: number; actualAnxiety?: number; completed?: boolean }[];
  copingCardCategory?: 'anxiety' | 'panic' | 'depression' | 'ocd' | 'general';
}

export interface LifeMapEvent {
  id: string;
  type: 'note' | 'audio' | 'photo' | 'mood' | 'medication' | 'sports' | 'sleep';
  title: string;
  time: string; // Date or time label
  description?: string;
  icon?: string;
  moodColor?: string;
}

export interface BackupSettings {
  autoBackup: 'hourly' | 'daily' | 'weekly' | 'onWrite' | 'off';
  lastBackupTime?: string;
}

export interface AppReminder {
  id: string;
  title: string;
  time: string; // "HH:MM"
  active: boolean;
  type?: 'habit' | 'diary' | 'custom' | 'motivational' | 'meditation';
  frequency: 'daily' | 'weekly' | 'custom_days';
  selectedDays?: number[]; // [0,1,2,3,4,5,6] (0 = Sunday, 6 = Saturday)
  motivationalNote?: string;
  categoryIcon?: string;
  createdAt?: string;
}

export interface HabitSettings {
  singleTapToggle: boolean; // تبديل وضعية العادة بضغطة قصيرة
  extendDayPastMidnight: boolean; // تمديد اليوم بضع ساعات بعد منتصف الليل (3:00 ص)
  enableSkipDays: boolean; // تمكين أيام التخطي
  showMissingDataMark: boolean; // إظهار علامات الاستفهام للبيانات المفقودة
  reverseDayOrder: boolean; // ترتيب عكسي للأيام
  pureBlackDarkMode: boolean; // استخدام أسود نقي في الوضع الليلي
  disableAnimations: boolean; // Disable confetti/animations
  widgetOpacity: number; // شفافية اختصار الشاشة الرئيسية (0.1 - 1.0)
  firstDayOfWeek: 'saturday' | 'sunday' | 'monday'; // اليوم الأول من الأسبوع
  persistentNotifications: boolean; // جعل الإشعارات ثابتة
}

export interface AppSettings {
  isDarkMode: boolean;
  notificationsEnabled: boolean;
  appLanguage: 'ar' | 'en';
  floatingBallEnabled: boolean;
  appPinCode?: string; // Screen Lock PIN
  isAppLocked: boolean;
  biometricCredentialId?: string; // WebAuthn Passkey Credential ID
  isBiometricEnabled?: boolean; // Toggle for Biometrics (Fingerprint / Face ID)
  backupSettings: BackupSettings;
  userApiKey?: string; // Custom client API Key for standalone / APK usage
  reminders?: AppReminder[]; // Added scheduled reminders
  habitSettings?: HabitSettings;
}

export interface HabitHistoryEntry {
  completed: boolean;
  value?: number;
  skipped?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon?: string; // Expressive custom icon chosen by user (e.g. 🎯, 🏃, 💧, 📚, 🧘, 🏋️, 🥦, 🧠, 🎨, ✍️, 💰, 💤, ⚡, 🔥, 🏆)
  category: 'health' | 'mind' | 'sport' | 'culture' | 'custom';
  habitType?: 'boolean' | 'measurable'; // 'boolean' (نعم/لا) or 'measurable' (قابل للقياس)
  question?: string; // e.g. "هل استيقظت باكراً اليوم؟" / "كم ميلاً ركضت اليوم؟"
  color?: string; // e.g. "#3b82f6", "#10b981", "#ef4444", "#f59e0b", etc.
  unit?: string; // e.g. "كيلومترات", "صفحة", "أكواب"
  targetValue?: number; // e.g. 15
  targetType?: 'at_least' | 'at_most' | 'exactly'; // 'على الأقل', 'على الأكثر', 'بالضبط'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';
  customStartDate?: string; // "YYYY-MM-DD"
  customEndDate?: string; // "YYYY-MM-DD"
  reminderTime?: string; // "HH:MM" format
  reminderEnabled: boolean;
  notes?: string;
  isArchived?: boolean;
  isCompleted?: boolean;
  order?: number;
  createdAt: string; // ISO string
  history: { [dateStr: string]: boolean | number | HabitHistoryEntry }; // YYYY-MM-DD -> completion / value
}

export interface GratitudeCard {
  id: string;
  text: string;
  color: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  notes: string;
  rating: number;
  pdfPath?: string;
  referenceLink?: string;
  audioAttachment?: string;
  coverAttachment?: string;
  videoAttachment?: string;
  hasMindMap: boolean;
  createdAt: string;
  tags?: string[];
  category?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  token?: string;
  createdAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}



