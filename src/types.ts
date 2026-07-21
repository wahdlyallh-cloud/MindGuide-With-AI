export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface AudioRecording {
  id: string;
  name: string;
  dataUrl: string;
  duration: number; // in seconds
  transcription?: string;
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

export interface AppSettings {
  isDarkMode: boolean;
  notificationsEnabled: boolean;
  appLanguage: 'ar' | 'en';
  floatingBallEnabled: boolean;
  appPinCode?: string; // Screen Lock PIN
  isAppLocked: boolean;
  backupSettings: BackupSettings;
  userApiKey?: string; // Custom client API Key for standalone / APK usage
  reminders?: AppReminder[]; // Added scheduled reminders
}

export interface Habit {
  id: string;
  name: string;
  category: 'health' | 'mind' | 'sport' | 'culture' | 'custom';
  frequency: 'daily' | 'weekly';
  reminderTime?: string; // "HH:MM" format
  reminderEnabled: boolean;
  createdAt: string; // ISO string
  history: { [dateStr: string]: boolean }; // YYYY-MM-DD -> boolean
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
}



