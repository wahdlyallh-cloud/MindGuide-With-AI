import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Moon, 
  Activity, 
  Pill, 
  Coffee, 
  Smile, 
  Sparkles, 
  Calendar,
  AlertCircle,
  Sliders,
  Settings as SettingsIcon,
  BarChart2,
  ListTodo,
  Grid,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Flame,
  Dumbbell,
  Footprints,
  HeartPulse,
  Zap,
  Trophy
} from 'lucide-react';
import { DiaryEntry, TaskItem, Habit, HabitSettings } from '../types';
import WeeklyHabitsMoodChart from './WeeklyHabitsMoodChart';
import { HabitFormModal } from './HabitFormModal';
import { HabitsMatrixGrid } from './HabitsMatrixGrid';
import { HabitSettingsScreen, DEFAULT_HABIT_SETTINGS } from './HabitSettingsScreen';

interface TasksChecklistSectionProps {
  activeDiaryForSelectedDate: DiaryEntry | undefined;
  selectedDate: string;
  handleUpdateHabit: (
    type: 'sleep' | 'sports' | 'sportsType' | 'sportsIntensity' | 'sportsCalories' | 'sportsEnergyBefore' | 'sportsEnergyAfter' | 'sportsNotes' | 'medication' | 'water' | 'fastMood' | 'symptoms' | 'cbt',
    value: any
  ) => void;
  handleUpdateTasks: (updatedTasks: TaskItem[]) => void;
  habits: Habit[];
  toggleHabitCompletion: (habitId: string, dateStr: string, customVal?: any) => void;
  setHabits?: React.Dispatch<React.SetStateAction<Habit[]>>;
  habitSettings?: HabitSettings;
  onUpdateHabitSettings?: (newSettings: Partial<HabitSettings>) => void;
  onImportData?: (importedHabits: Habit[], importedDiaries?: DiaryEntry[]) => void;
  isDarkMode?: boolean;
  diaries?: DiaryEntry[];
}

const CATEGORY_NAMES: Record<string, string> = {
  health: 'صحة بدنية 🥦',
  mind: 'تأمل وذهن 🧠',
  sport: 'رياضة ونشاط 🏃',
  culture: 'ثقافة وقراءة 📚',
  custom: 'أهداف أخرى 🎯'
};

const CATEGORY_COLORS: Record<string, string> = {
  health: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  mind: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  sport: 'bg-amber-50 text-amber-700 border-amber-100',
  culture: 'bg-sky-50 text-sky-700 border-sky-100',
  custom: 'bg-pink-50 text-pink-700 border-pink-100'
};

export const TasksChecklistSection: React.FC<TasksChecklistSectionProps> = ({
  activeDiaryForSelectedDate,
  selectedDate,
  handleUpdateHabit,
  handleUpdateTasks,
  habits,
  toggleHabitCompletion,
  setHabits,
  habitSettings = DEFAULT_HABIT_SETTINGS,
  onUpdateHabitSettings,
  onImportData,
  isDarkMode = false,
  diaries = []
}) => {
  // Sub-view inside Tasks & Activities
  const [subView, setSubView] = useState<'daily_checklist' | 'habits_matrix' | 'habit_settings'>('daily_checklist');

  // Global Periodicity / Date Range Filter for the Daily View
  const [periodicity, setPeriodicity] = useState<
    'day' | 'week' | 'month' | 'quarter' | 'semi_annual' | 'year' | 'custom'
  >('day');
  const [customRangeStart, setCustomRangeStart] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [customRangeEnd, setCustomRangeEnd] = useState<string>(
    selectedDate || new Date().toISOString().split('T')[0]
  );

  // New Custom Task Input
  const [newTaskText, setNewTaskText] = useState('');

  // Habit Form Modal State
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Medication Modal & Toast State
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('10:00 ص');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ⏱️ Integrated Workout Timer & Mode State
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'tabata'>('stopwatch');
  const [tabataPhase, setTabataPhase] = useState<'work' | 'rest'>('work');
  const [tabataCycleCount, setTabataCycleCount] = useState(1);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Workout Timer Interval Effect (supports Tabata 20s work / 10s rest)
  useEffect(() => {
    if (isWorkoutTimerRunning) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutSeconds(prev => {
          const next = prev + 1;
          if (timerMode === 'tabata') {
            const cycleSecs = next % 30;
            if (cycleSecs === 20) {
              setTabataPhase('rest');
            } else if (cycleSecs === 0 && next > 0) {
              setTabataPhase('work');
              setTabataCycleCount(c => c + 1);
            }
          }
          return next;
        });
      }, 1000);
    } else if (workoutTimerRef.current) {
      clearInterval(workoutTimerRef.current);
    }
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [isWorkoutTimerRunning, timerMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Workout Timer Control Methods
  const formatTimerTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWorkoutTimer = () => {
    setIsWorkoutTimerRunning(true);
    showToast('بدأ مؤقت التمرين الرياضي! ⏱️🏃');
  };

  const handlePauseWorkoutTimer = () => {
    setIsWorkoutTimerRunning(false);
    showToast('تم إيقاف مؤقت التمرين مؤقتاً ⏸️');
  };

  const handleResetWorkoutTimer = () => {
    setIsWorkoutTimerRunning(false);
    setWorkoutSeconds(0);
    showToast('تمت إعادة ضبط المؤقت 🔄');
  };

  const handleSaveWorkoutTimer = (mode: 'add' | 'replace' = 'add') => {
    setIsWorkoutTimerRunning(false);
    const elapsedMinutes = Math.max(1, Math.round(workoutSeconds / 60));
    
    let newTotal = elapsedMinutes;
    if (mode === 'add') {
      const current = typeof sportsDuration === 'number' ? sportsDuration : parseInt(sportsDuration || '0', 10) || 0;
      newTotal = current + elapsedMinutes;
    }

    handleUpdateHabit('sports', newTotal);
    showToast(`تم تسجيل ${elapsedMinutes} دقيقة (${sportsType}) بنجاح! 🏃💪 (المجموع: ${newTotal} دقيقة)`);
    setWorkoutSeconds(0);
  };

  // Extract daily variables
  const tasks = activeDiaryForSelectedDate?.tasks || [];
  const sleepHours = activeDiaryForSelectedDate?.sleepHours ?? 8;
  const sportsDuration = activeDiaryForSelectedDate?.sportsDuration ?? 0;
  const sportsType = activeDiaryForSelectedDate?.sportsType || 'مشي';
  const sportsIntensity = activeDiaryForSelectedDate?.sportsIntensity || 'medium';
  const sportsEnergyBefore = activeDiaryForSelectedDate?.sportsEnergyBefore ?? 3;
  const sportsEnergyAfter = activeDiaryForSelectedDate?.sportsEnergyAfter ?? 4;
  const sportsNotes = activeDiaryForSelectedDate?.sportsNotes || '';
  const waterCups = activeDiaryForSelectedDate?.waterCups ?? 0;

  // Dynamic Calorie Estimator
  const getEstimatedCalories = (durationMins: number, typeStr: string, intensityStr?: string) => {
    if (!durationMins || durationMins <= 0) return 0;
    let baseRate = 5.0; // kcal/min
    if (typeStr.includes('مشي')) baseRate = 4.5;
    else if (typeStr.includes('قوة') || typeStr.includes('حديد')) baseRate = 7.5;
    else if (typeStr.includes('يوجا') || typeStr.includes('استطالة')) baseRate = 3.5;
    else if (typeStr.includes('جري') || typeStr.includes('كارديو')) baseRate = 11.0;
    else if (typeStr.includes('دراجة')) baseRate = 8.0;
    else if (typeStr.includes('سباحة')) baseRate = 9.5;

    let intensityMult = 1.0;
    if (intensityStr === 'light') intensityMult = 0.8;
    else if (intensityStr === 'high') intensityMult = 1.35;

    return Math.round(durationMins * baseRate * intensityMult);
  };
  
  // Extract medications list
  const rawMeds = activeDiaryForSelectedDate?.medications;
  const medicationsList = Array.isArray(rawMeds) && rawMeds.length > 0
    ? rawMeds
    : [{ id: 'm1', name: 'مكمل فيتامين D اليومي', time: '10:00 ص', taken: false }];

  const isMedicationTaken = medicationsList.every(m => m.taken);

  // Toggle single medication
  const toggleMedication = (medId: string) => {
    const updated = medicationsList.map(m => {
      if (m.id === medId) {
        const nextTaken = !m.taken;
        showToast(nextTaken ? `تم تسجيل أخذ "${m.name}" بنجاح! 💊` : `تم إلغاء تحديد "${m.name}"`);
        return { ...m, taken: nextTaken };
      }
      return m;
    });
    handleUpdateHabit('medication', updated);
  };

  // Add new medication
  const handleAddMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      time: newMedTime.trim() || '10:00 ص',
      taken: false
    };

    const updated = [...medicationsList, newMed];
    handleUpdateHabit('medication', updated);
    setNewMedName('');
    setNewMedTime('10:00 ص');
    setShowMedicationModal(false);
    showToast(`تمت إضافة "${newMed.name}" لقائمة أدوية ومكملات اليوم! 💊`);
  };

  // Delete medication
  const handleDeleteMedication = (medId: string) => {
    const updated = medicationsList.filter(m => m.id !== medId);
    handleUpdateHabit('medication', updated);
    showToast('تم حذف المكمل/الدواء من القائمة.');
  };

  // Calculate metrics for selected date / period
  const totalCustomTasks = tasks.length;
  const completedCustomTasks = tasks.filter(t => t.completed).length;

  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => {
    const val = h.history[selectedDate];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val >= (h.targetValue || 1);
    if (typeof val === 'object' && val) return val.completed;
    return false;
  }).length;

  const totalMedsCount = medicationsList.length;
  const completedMedsCount = medicationsList.filter(m => m.taken).length;

  const totalItems = totalCustomTasks + totalHabits + totalMedsCount;
  const completedItems = completedCustomTasks + completedHabits + completedMedsCount;
  
  const completionPercentage = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100) 
    : 0;

  // Add a custom task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false
    };

    const updatedTasks = [...tasks, newTask];
    handleUpdateTasks(updatedTasks);
    setNewTaskText('');
  };

  // Toggle custom task completion
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    handleUpdateTasks(updatedTasks);
  };

  // Delete custom task
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    handleUpdateTasks(updatedTasks);
  };

  // Save/Create/Update Habit Handler
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (setHabits) {
      if (editingHabit) {
        // Update
        setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData } as Habit : h));
      } else {
        // Create
        const newH: Habit = {
          id: `habit-${Date.now()}`,
          name: habitData.name || 'عادة جديدة',
          category: habitData.category || 'custom',
          habitType: habitData.habitType || 'boolean',
          question: habitData.question,
          color: habitData.color || '#3B82F6',
          unit: habitData.unit,
          targetValue: habitData.targetValue,
          targetType: habitData.targetType,
          frequency: habitData.frequency || 'daily',
          customStartDate: habitData.customStartDate,
          customEndDate: habitData.customEndDate,
          reminderTime: habitData.reminderTime,
          reminderEnabled: !!habitData.reminderEnabled,
          notes: habitData.notes,
          createdAt: new Date().toISOString(),
          history: {}
        };
        setHabits(prev => [...prev, newH]);
      }
    }
    setEditingHabit(null);
  };

  const handleDeleteHabit = (habitId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه العادة نهائياً؟')) {
      if (setHabits) {
        setHabits(prev => prev.filter(h => h.id !== habitId));
      }
    }
  };

  const handleArchiveHabit = (habitId: string) => {
    if (setHabits) {
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, isArchived: !h.isArchived } : h));
    }
  };

  const handleReorderHabits = (reordered: Habit[]) => {
    if (setHabits) {
      setHabits(reordered);
    }
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-gray-200' : 'text-[#3A3A3A]'}`} id="daily-tasks-main-section" dir="rtl">
      
      {/* 1. Sub-Tab Switcher inside "المهام اليومية والنشاط" */}
      <div className="flex bg-[#F0EDE4] p-1.5 rounded-2xl border border-[#E2DCC8]/60 shadow-2xs gap-1">
        <button
          onClick={() => setSubView('daily_checklist')}
          className={`flex-1 flex items-center justify-center space-x-1.5 space-x-reverse py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subView === 'daily_checklist'
              ? 'bg-white text-[#5A5A40] shadow-xs font-extrabold'
              : 'text-gray-500 hover:text-[#5A5A40]'
          }`}
        >
          <ListTodo className="w-4 h-4 text-[#8B9D83]" />
          <span>اليومية والمهام السريعة</span>
        </button>

        <button
          onClick={() => setSubView('habits_matrix')}
          className={`flex-1 flex items-center justify-center space-x-1.5 space-x-reverse py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subView === 'habits_matrix'
              ? 'bg-white text-[#5A5A40] shadow-xs font-extrabold'
              : 'text-gray-500 hover:text-[#5A5A40]'
          }`}
        >
          <Grid className="w-4 h-4 text-[#2B529A]" />
          <span>جدول العادات الشامل (عادات)</span>
        </button>

        <button
          onClick={() => setSubView('habit_settings')}
          className={`flex-1 flex items-center justify-center space-x-1.5 space-x-reverse py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subView === 'habit_settings'
              ? 'bg-white text-[#5A5A40] shadow-xs font-extrabold'
              : 'text-gray-500 hover:text-[#5A5A40]'
          }`}
        >
          <SettingsIcon className="w-4 h-4 text-[#D4A373]" />
          <span>إعدادات العادات والبيانات</span>
        </button>
      </div>

      {/* 2. SUBVIEW 1: DAILY CHECKLIST & QUICK METRICS */}
      {subView === 'daily_checklist' && (
        <div className="space-y-6">
          
          {/* Periodicity Filter Toolbar (ميزة ظهور العادات والمهمات حسب التردد والظهور المخصص) */}
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DCC8]/40 pb-2.5">
              <span className="text-xs font-bold text-[#5A5A40] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8B9D83]" />
                <span>نطاق ظهور وتتبع العادات والتاسكات (Periodicity & Date Filter):</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono font-bold bg-[#F9F7F2] px-2.5 py-1 rounded-lg border border-[#E2DCC8]/60">
                📅 التاريخ المحدد: {selectedDate}
              </span>
            </div>

            {/* Quick Period Buttons */}
            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
              {[
                { id: 'day', label: '📅 يوم' },
                { id: 'week', label: '📆 أسبوع' },
                { id: 'month', label: '🗓️ شهر' },
                { id: 'quarter', label: '📊 ربع سنوي' },
                { id: 'semi_annual', label: '📈 نصف سنوي' },
                { id: 'year', label: '📅 سنوي' },
                { id: 'custom', label: '🎯 مخصص (من/إلى)' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriodicity(p.id as any)}
                  className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                    periodicity === p.id
                      ? 'bg-[#8B9D83] text-white shadow-2xs font-extrabold'
                      : 'bg-[#F9F7F2] text-gray-600 hover:bg-[#E2DCC8]/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Picker */}
            {periodicity === 'custom' && (
              <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-amber-900 whitespace-nowrap">من تاريخ:</span>
                  <input
                    type="date"
                    value={customRangeStart}
                    onChange={(e) => setCustomRangeStart(e.target.value)}
                    className="py-1 px-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-gray-800"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-amber-900 whitespace-nowrap">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={customRangeEnd}
                    onChange={(e) => setCustomRangeEnd(e.target.value)}
                    className="py-1 px-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-gray-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 📅 Selected Date Metrics Summary Card */}
          <div className={`p-5 rounded-3xl border ${
            isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-3 bg-[#8B9D83]/10 text-[#8B9D83] rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block">متابعة اليوم والنشاط:</span>
                  <span className="text-sm font-black text-[#5A5A40]">{selectedDate}</span>
                </div>
              </div>

              <div className="text-left font-sans">
                <span className="text-[10px] text-gray-400 font-bold block">معدل الإنجاز العام</span>
                <span className="text-lg font-black text-[#8B9D83]">{completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* 📊 Comprehensive Progress Card */}
          <div className={`p-6 rounded-3xl border relative overflow-hidden ${
            isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-gradient-to-br from-[#8B9D83]/10 to-[#F4F6F4]/40 border-[#E2DCC8]/80'
          }`}>
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-[#5A5A40] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4A373]" />
                    <span>إنجاز الرعاية الذاتية لليوم</span>
                  </h4>
                  <p className="text-[10px] text-gray-500 font-medium">
                    تتبع المهام، العادات والروتين البدني المتوازن لتغذية عافيتك الذهنية.
                  </p>
                </div>
                <span className="text-xs font-black text-[#8B9D83] bg-[#8B9D83]/10 px-2.5 py-1 rounded-full">
                  {completedItems} من أصل {totalItems} منجز
                </span>
              </div>

              {/* Progress bar container */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200/50">
                <div 
                  className="bg-gradient-to-r from-[#8B9D83] to-[#72856A] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="text-center p-2 rounded-xl bg-white/60 border border-[#E2DCC8]/30">
                  <span className="text-[10px] text-gray-400 font-bold block">المهام الخاصة</span>
                  <span className="text-xs font-bold text-gray-700">{completedCustomTasks}/{totalCustomTasks}</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-white/60 border border-[#E2DCC8]/30">
                  <span className="text-[10px] text-gray-400 font-bold block">الروتين السلوكي</span>
                  <span className="text-xs font-bold text-gray-700">{completedHabits}/{totalHabits}</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-white/60 border border-[#E2DCC8]/30">
                  <span className="text-[10px] text-gray-400 font-bold block">الأدوية العلاجية</span>
                  <span className="text-xs font-bold text-gray-700">{completedMedsCount}/1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Main Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* RIGHT COLUMN: CUSTOM DAILY TASKS & MEDICATION */}
            <div className="space-y-6">
              
              {/* 📋 Custom Tasks Checklist Box */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8]'
              }`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                    <span>📋</span>
                    <span>المهام والواجبات اليومية</span>
                  </h4>
                  <p className="text-[10px] text-gray-500 font-medium">
                    اكتب قائمة مهامك الخاصة ونظف ذهنك من المهام المتراكمة لليوم.
                  </p>
                </div>

                {/* Add Task Form */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="أضف مهمة جديدة مثلاً: جلسة تأمل، كتابة خاطرة..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-normal border outline-none focus:border-[#8B9D83] transition-all ${
                      isDarkMode 
                        ? 'bg-[#121110] border-gray-800 text-gray-100 placeholder-gray-600' 
                        : 'bg-[#F9F7F2]/50 border-[#E2DCC8]/70 text-[#3A3A3A] placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </form>

                {/* Tasks Render List */}
                {tasks.length === 0 ? (
                  <div className="bg-[#F9F7F2]/40 border border-dashed border-[#E2DCC8]/60 rounded-2xl p-6 text-center text-xs text-gray-400">
                    <Smile className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-[#8B9D83]" />
                    <p className="font-bold text-[#5A5A40]">لا توجد مهام مخصصة لليوم حتى الآن.</p>
                    <p className="text-[10px] mt-0.5 text-gray-400">دون مهامك لتتبعها وإنجازها بسهولة.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {tasks.map(task => (
                      <div 
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          task.completed 
                            ? 'bg-[#F4F6F4]/50 border-gray-200/50' 
                            : 'bg-[#F9F7F2]/30 border-[#E2DCC8]/50 hover:border-[#8B9D83]/40'
                        }`}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(task.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center text-xs cursor-pointer transition-all shrink-0 ${
                              task.completed 
                                ? 'bg-[#8B9D83] border-[#8B9D83] text-white' 
                                : 'bg-white border-gray-300 text-transparent hover:border-[#8B9D83]'
                            }`}
                          >
                            ✓
                          </button>
                          
                          <span className={`text-xs font-semibold truncate min-w-0 transition-all ${
                            task.completed ? 'line-through text-gray-400 font-medium' : 'text-gray-700'
                          }`}>
                            {task.text}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 💊 Medication Track Section */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                      <span>💊</span>
                      <span>تتبع الأدوية والفيتامينات اليومية</span>
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium">
                      سجل جرعات دوائك ومكملاتك العلاجية للحفاظ على مستوياتك الحيوية مستقرة.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMedicationModal(true)}
                    className="p-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    title="إضافة دواء أو مكمل جديد"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة دواء</span>
                  </button>
                </div>

                {medicationsList.length === 0 ? (
                  <div className="bg-[#F9F7F2]/40 border border-dashed border-[#E2DCC8]/60 rounded-2xl p-4 text-center text-xs text-gray-400 space-y-1">
                    <p className="font-bold text-gray-600">لا توجد أدوية أو مكملات مضافة لليوم</p>
                    <p className="text-[10px]">اضغط على "إضافة دواء" لإضافة جرعتك اليومية ومتابعة التزامك.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {medicationsList.map((med) => (
                      <div
                        key={med.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          med.taken 
                            ? 'bg-emerald-50/30 border-emerald-200' 
                            : 'bg-[#F9F7F2]/40 border-[#E2DCC8]/70 hover:border-[#8B9D83]/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <button
                            type="button"
                            onClick={() => toggleMedication(med.id)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              med.taken 
                                ? 'bg-emerald-500 text-white shadow-2xs' 
                                : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                            }`}
                          >
                            <Pill className="w-4 h-4" />
                          </button>
                          <div>
                            <span className={`text-xs font-bold block ${med.taken ? 'text-emerald-900 line-through' : 'text-gray-800'}`}>
                              {med.name}
                            </span>
                            <span className="text-[9px] text-gray-400 block font-bold">
                              الموعد المحدد: {med.time}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleMedication(med.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
                              med.taken 
                                ? 'bg-[#8B9D83] text-white' 
                                : 'bg-[#F0EDE4] text-[#5A5A40] hover:bg-[#E2DCC8]'
                            }`}
                          >
                            {med.taken ? '✓ تم التناول' : 'تحديد كمنجز'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMedication(med.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف هذا الدواء"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* LEFT COLUMN: BEHAVIORAL ROUTINES & PHYSICAL HEALTH */}
            <div className="space-y-6">
              
              {/* 🎯 Daily Habits Checklist */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                      <span>🎯</span>
                      <span>الروتين والعادات السلوكية</span>
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium">
                      سجل تكرار التزامك بالعادات السلوكية اليومية الإيجابية.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingHabit(null);
                      setShowHabitModal(true);
                    }}
                    className="p-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء عادة</span>
                  </button>
                </div>

                {habits.length === 0 ? (
                  <div className="bg-[#F9F7F2]/40 border border-dashed border-[#E2DCC8]/60 rounded-2xl p-6 text-center text-xs text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-[#8B9D83]" />
                    <p className="font-bold text-[#5A5A40]">لا توجد عادات سلوكية مسجلة حالياً.</p>
                    <p className="text-[10px] mt-0.5 text-gray-400">يمكنك إضافة عادات جديدة بالضغط على زر "إنشاء عادة".</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {habits.map(habit => {
                      const val = habit.history[selectedDate];
                      let isCompleted = false;
                      if (typeof val === 'boolean') isCompleted = val;
                      else if (typeof val === 'number') isCompleted = val >= (habit.targetValue || 1);
                      else if (typeof val === 'object' && val) isCompleted = val.completed;

                      const categoryName = CATEGORY_NAMES[habit.category] || 'أخرى 🎯';
                      const categoryColor = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.custom;

                      return (
                        <div 
                          key={habit.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                            isCompleted 
                              ? 'bg-emerald-50/30 border-emerald-200' 
                              : 'bg-[#F9F7F2]/30 border-[#E2DCC8]/50 hover:border-[#8B9D83]/30'
                          }`}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                isCompleted 
                                  ? 'bg-[#8B9D83] text-white scale-105 shadow-xs' 
                                  : 'border border-[#E2DCC8] hover:border-[#8B9D83] text-transparent hover:bg-white'
                              }`}
                            >
                              <span className="text-[10px] font-bold">✓</span>
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5 space-x-reverse">
                                {habit.icon && <span className="text-xs shrink-0 font-bold">{habit.icon}</span>}
                                <span className={`text-xs font-bold block truncate transition-all ${
                                  isCompleted ? 'line-through text-gray-400' : 'text-gray-700'
                                }`}>
                                  {habit.name}
                                </span>
                              </div>
                              <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded-md border font-bold mt-0.5 ${categoryColor}`}>
                                {categoryName}
                              </span>
                            </div>
                          </div>

                          {habit.reminderTime && (
                            <span className="text-[9px] text-gray-400 shrink-0 font-bold font-mono">
                              ⏰ {habit.reminderTime}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 🥦 PHYSICAL HEALTH TARGETS */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8]'
              }`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                    <span>🥦</span>
                    <span>المقاييس الصحية والبدنية</span>
                  </h4>
                  <p className="text-[10px] text-gray-500 font-medium">
                    سجل قياسات الجسد والنشاط لأنها تؤثر مباشرة على هرمونات مزاجك العصبي.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* 💤 Sleep Hours */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span className="flex items-center gap-1">
                        <Moon className="w-4 h-4 text-indigo-500" />
                        <span>ساعات النوم:</span>
                      </span>
                      <span className="font-mono text-[#8B9D83]">{sleepHours} ساعات</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="14"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => handleUpdateHabit('sleep', e.target.value)}
                      className="w-full h-1.5 bg-[#E2DCC8]/60 rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
                    />
                  </div>

                  {/* 🏃 Sports Duration & Integrated Comprehensive Workout Studio */}
                  <div className="space-y-4 p-4 sm:p-5 bg-[#FBF9F5] border-2 border-[#E2DCC8] rounded-3xl shadow-xs transition-all">
                    {/* Header with Distinctive Icon & Live Calorie Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E2DCC8]/70">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="p-3 bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-600 text-white rounded-2xl shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center">
                          <Dumbbell className="w-5.5 h-5.5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-extrabold text-[#3A3A3A] flex items-center gap-1.5">
                            <span>النشاط البدني واللياقة الرياضية</span>
                            <span className="text-xs text-amber-600">⚡</span>
                          </h4>
                          <p className="text-[11px] text-gray-500 font-medium">
                            رصد نوع التمرين، الشدة، السعرات، والمزاج النفسي قبل وبعد النشاط
                          </p>
                        </div>
                      </div>

                      {/* Current Exercise Status Badges */}
                      <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-1.5 self-start sm:self-auto">
                        {/* Calories Badge */}
                        <div className="inline-flex items-center space-x-1 space-x-reverse bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-900 border border-amber-500/30 px-2.5 py-1 rounded-2xl text-xs font-black shadow-2xs">
                          <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500/20" />
                          <span>~{getEstimatedCalories(sportsDuration, sportsType, sportsIntensity)} سعرة</span>
                        </div>

                        {/* Exercise & Duration Badge */}
                        <div className="inline-flex items-center space-x-1.5 space-x-reverse bg-[#8B9D83]/15 text-[#3F5449] border border-[#8B9D83]/30 px-3 py-1 rounded-2xl text-xs font-black shadow-2xs">
                          <span>{sportsDuration} دقيقة</span>
                          <span className="text-[#8B9D83]">•</span>
                          <span className="text-[#2D3E35] font-extrabold">{sportsType}</span>
                        </div>
                      </div>
                    </div>

                    {/* 🏋️ Workout Type Selector (نوع التمرين الرياضي) */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#5A5A40] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-600" />
                          <span>1. اختر نوع التمرين اليوم:</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">محدد: {sportsType}</span>
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { id: 'walking', name: 'مشي', emoji: '🚶‍♂️', desc: 'مشي خفيف/سريع' },
                          { id: 'strength', name: 'تمارين قوة', emoji: '🏋️‍♂️', desc: 'حديد ومقاومة' },
                          { id: 'yoga', name: 'يوجا واستطالة', emoji: '🧘‍♀️', desc: 'استرخاء وتنفس' },
                          { id: 'cardio', name: 'جري وكارديو', emoji: '🏃‍♂️', desc: 'لياقة وزيادة نبض' },
                          { id: 'cycling', name: 'دراجة هوائية', emoji: '🚴‍♂️', desc: 'دراجة ثابتة/خارجية' },
                          { id: 'swimming', name: 'سباحة', emoji: '🏊‍♂️', desc: 'تمارين مائية' },
                        ].map((typeItem) => {
                          const isSelected = sportsType === typeItem.name;
                          return (
                            <button
                              key={typeItem.id}
                              type="button"
                              onClick={() => {
                                handleUpdateHabit('sportsType', typeItem.name);
                                showToast(`تم تحديد نوع التمرين: ${typeItem.name} ${typeItem.emoji}`);
                              }}
                              className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center space-x-2 space-x-reverse ${
                                isSelected
                                  ? 'bg-amber-50/90 border-amber-400 text-amber-900 shadow-2xs font-extrabold ring-2 ring-amber-300/60 scale-[1.02]'
                                  : 'bg-white hover:bg-gray-50 border-[#E2DCC8]/80 text-[#3A3A3A]'
                              }`}
                            >
                              <span className="text-xl shrink-0 p-1 bg-amber-100/50 rounded-xl">{typeItem.emoji}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-black truncate">{typeItem.name}</div>
                                <div className="text-[9px] text-gray-400 font-medium truncate">{typeItem.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ⚡ Exercise Intensity Level Selector & Duration Slider */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-[#E2DCC8]/40">
                      {/* Intensity Level Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-[#5A5A40] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span>2. مستوى شدة المجهود البدني:</span>
                          </span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'light', label: 'خفيف 🟢', desc: 'مجهود بسيط' },
                            { id: 'medium', label: 'متوسط 🟡', desc: 'معتدل متوازن' },
                            { id: 'high', label: 'مكثف 🔴', desc: 'عالي الجهد' },
                          ].map((intItem) => {
                            const isSelected = sportsIntensity === intItem.id;
                            return (
                              <button
                                key={intItem.id}
                                type="button"
                                onClick={() => {
                                  handleUpdateHabit('sportsIntensity', intItem.id);
                                  showToast(`تم ضبط شدة التمرين إلى: ${intItem.label}`);
                                }}
                                className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#3A3A3A] text-white border-[#3A3A3A] font-black shadow-2xs scale-[1.02]'
                                    : 'bg-white text-gray-700 border-[#E2DCC8] hover:bg-gray-50 font-bold'
                                }`}
                              >
                                <div className="text-xs">{intItem.label}</div>
                                <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>{intItem.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Duration Slider & Quick Presets */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                          <span className="flex items-center gap-1.5 text-[#5A5A40]">
                            <Activity className="w-4 h-4 text-amber-500" />
                            <span>3. المدة المسجلة (دقائق):</span>
                          </span>
                          <span className="font-mono text-[#8B9D83] font-black text-sm">{sportsDuration} دقيقة</span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="120"
                          step="5"
                          value={sportsDuration}
                          onChange={(e) => handleUpdateHabit('sports', Number(e.target.value))}
                          className="w-full h-1.5 bg-[#E2DCC8]/60 rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
                        />

                        {/* Quick Duration Preset Pills */}
                        <div className="flex items-center space-x-1.5 space-x-reverse overflow-x-auto pb-1 scrollbar-none">
                          {[15, 30, 45, 60, 90].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                handleUpdateHabit('sports', mins);
                                showToast(`تم ضبط مدة التمرين إلى ${mins} دقيقة ⏱️`);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                                sportsDuration === mins
                                  ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-3xs'
                                  : 'bg-white text-gray-600 border-[#E2DCC8] hover:bg-gray-50'
                              }`}
                            >
                              {mins} دقيقة
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🧘 Mental Mood & Energy Tracker Before vs After Workout */}
                    <div className="p-3 bg-white border border-[#E2DCC8]/80 rounded-2xl space-y-2.5 shadow-3xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
                        <span className="text-xs font-extrabold text-[#5A5A40] flex items-center gap-1.5">
                          <HeartPulse className="w-4 h-4 text-rose-500" />
                          <span>مقياس مستوى الطاقة والانتعاش النفسي (قبل وبعد التمرين):</span>
                        </span>
                        {sportsEnergyAfter > sportsEnergyBefore && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full self-start sm:self-auto">
                            ✨ تحسن الطاقة: +{sportsEnergyAfter - sportsEnergyBefore} درجات
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Energy Before */}
                        <div className="flex items-center justify-between bg-[#FBF9F5] p-2 rounded-xl border border-[#E2DCC8]/50">
                          <span className="font-bold text-gray-700">⚡ قبل التمرين:</span>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleUpdateHabit('sportsEnergyBefore', lvl)}
                                className={`w-6 h-6 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                  sportsEnergyBefore === lvl
                                    ? 'bg-amber-500 text-white scale-110 shadow-2xs'
                                    : 'bg-white border border-gray-200 text-gray-400 hover:bg-amber-50'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Energy After */}
                        <div className="flex items-center justify-between bg-[#FBF9F5] p-2 rounded-xl border border-[#E2DCC8]/50">
                          <span className="font-bold text-gray-700">🚀 بعد التمرين:</span>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleUpdateHabit('sportsEnergyAfter', lvl)}
                                className={`w-6 h-6 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                  sportsEnergyAfter === lvl
                                    ? 'bg-emerald-600 text-white scale-110 shadow-2xs'
                                    : 'bg-white border border-gray-200 text-gray-400 hover:bg-emerald-50'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ⏱️ Integrated Stopwatch & HIIT Tabata Mode Timer Box */}
                    <div className="pt-2 border-t border-[#E2DCC8]/60 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5 space-x-reverse text-xs font-extrabold text-[#5A5A40]">
                          <Timer className="w-4 h-4 text-amber-600" />
                          <span>مؤقت التمرين المباشر ({sportsType}):</span>
                        </div>

                        {/* Mode Switcher: Stopwatch vs Tabata */}
                        <div className="flex items-center bg-[#E2DCC8]/40 p-0.5 rounded-xl self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setTimerMode('stopwatch');
                              showToast('تم التحويل لنظام مؤقت عادي ⏱️');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              timerMode === 'stopwatch' ? 'bg-white text-[#3A3A3A] shadow-3xs font-black' : 'text-gray-600'
                            }`}
                          >
                            مؤقت عادي ⏱️
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTimerMode('tabata');
                              showToast('تم التحويل لنظام تاباتا HIIT (20ث تمرين / 10ث راحة) ⚡');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              timerMode === 'tabata' ? 'bg-amber-500 text-white shadow-3xs font-black' : 'text-gray-600'
                            }`}
                          >
                            تاباتا HIIT ⚡
                          </button>
                        </div>
                      </div>

                      {/* Display & Control Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E2DCC8]/80 shadow-3xs gap-3">
                        {/* Digital Clock View & Mode Indicator */}
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-[#3A3A3A] bg-[#F4F2EB] px-3.5 py-1.5 rounded-xl border border-[#E2DCC8]/60 min-w-[95px] text-center shadow-3xs">
                            {formatTimerTime(workoutSeconds)}
                          </span>

                          {timerMode === 'tabata' && isWorkoutTimerRunning && (
                            <div className="flex items-center space-x-1.5 space-x-reverse">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                                tabataPhase === 'work'
                                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                                  : 'bg-emerald-500 text-white border-emerald-600'
                              }`}>
                                {tabataPhase === 'work' ? '🔥 مجهود (20ث)' : '🧘 راحة (10ث)'}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                                جولة #{tabataCycleCount}
                              </span>
                            </div>
                          )}

                          {isWorkoutTimerRunning && timerMode === 'stopwatch' && (
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-1.5 space-x-reverse flex-wrap justify-end w-full sm:w-auto">
                          {!isWorkoutTimerRunning ? (
                            <button
                              type="button"
                              onClick={handleStartWorkoutTimer}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1 space-x-reverse shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{workoutSeconds > 0 ? 'استئناف' : 'بدء التمرين'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handlePauseWorkoutTimer}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center space-x-1 space-x-reverse shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>إيقاف مؤقت</span>
                            </button>
                          )}

                          {workoutSeconds > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveWorkoutTimer('add')}
                                className="px-3.5 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-black flex items-center space-x-1 space-x-reverse shadow-xs transition-all active:scale-95 cursor-pointer"
                                title="حفظ وتراكم النتيجة تلقائياً في خانة الرياضة للمذكرة"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>تراكم وتحفيظ النتيجة</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleResetWorkoutTimer}
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                title="إعادة ضبط المؤقت"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 📝 Workout Session Notes & Record Input */}
                    <div className="pt-2 border-t border-[#E2DCC8]/40">
                      <div className="flex items-center justify-between mb-1">
                        <button
                          type="button"
                          onClick={() => setShowNotesInput(!showNotesInput)}
                          className="text-xs font-extrabold text-[#5A5A40] hover:text-[#3A3A3A] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>تعديل/إضافة ملاحظات التمرين والإنجاز الشخصي</span>
                        </button>
                      </div>

                      {showNotesInput || sportsNotes ? (
                        <textarea
                          rows={2}
                          value={sportsNotes}
                          onChange={(e) => handleUpdateHabit('sportsNotes', e.target.value)}
                          placeholder="مثال: قطع مسافة 4 كم في الهواء الطلق، شعور بالراحة والانتعاش الذهني..."
                          className="w-full text-xs p-2.5 bg-white border border-[#E2DCC8] rounded-xl text-[#3A3A3A] focus:ring-2 focus:ring-amber-300 outline-none transition-all placeholder:text-gray-400"
                        />
                      ) : null}
                    </div>
                  </div>

                  {/* 💧 Water Tracker Counter */}
                  <div className="p-3 bg-[#F9F7F2] border border-[#E2DCC8]/50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 space-x-reverse">
                      <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-gray-700">معدل شرب الماء اليومي</span>
                        <span className="text-[9px] text-gray-400 block font-bold">الهدف اليومي: 8 أكواب</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => handleUpdateHabit('water', Math.max(0, waterCups - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-[#E2DCC8]/60 text-gray-600 hover:bg-[#F0EDE4] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black font-mono w-6 text-center text-gray-700">{waterCups}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateHabit('water', waterCups + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-[#E2DCC8]/60 text-gray-600 hover:bg-[#F0EDE4] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* 📈 Weekly Habit vs Mood Correlation Chart */}
          <div className="pt-4">
            <WeeklyHabitsMoodChart habits={habits} diaries={diaries} />
          </div>

        </div>
      )}

      {/* 3. SUBVIEW 2: HABITS MATRIX GRID VIEW (عادات) */}
      {subView === 'habits_matrix' && (
        <HabitsMatrixGrid
          habits={habits}
          onToggleHabit={toggleHabitCompletion}
          onOpenAddHabit={() => {
            setEditingHabit(null);
            setShowHabitModal(true);
          }}
          onEditHabit={(h) => {
            setEditingHabit(h);
            setShowHabitModal(true);
          }}
          onDeleteHabit={handleDeleteHabit}
          onArchiveHabit={handleArchiveHabit}
          onReorderHabits={handleReorderHabits}
          onOpenSettings={() => setSubView('habit_settings')}
          habitSettings={habitSettings}
          selectedDate={selectedDate}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 4. SUBVIEW 3: HABIT SETTINGS & BACKUP/RESTORE SCREEN */}
      {subView === 'habit_settings' && (
        <HabitSettingsScreen
          onBack={() => setSubView('habits_matrix')}
          habitSettings={habitSettings}
          onUpdateSettings={(newSettings) => {
            if (onUpdateHabitSettings) {
              onUpdateHabitSettings(newSettings);
            }
          }}
          habits={habits}
          diaries={diaries}
          onImportData={(importedHabits, importedDiaries) => {
            if (onImportData) {
              onImportData(importedHabits, importedDiaries);
            } else if (setHabits && importedHabits.length > 0) {
              setHabits(importedHabits);
            }
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Habit Create / Edit Modal */}
      <HabitFormModal
        isOpen={showHabitModal}
        onClose={() => {
          setShowHabitModal(false);
          setEditingHabit(null);
        }}
        onSaveHabit={handleSaveHabit}
        initialHabit={editingHabit}
      />

      {/* Add Medication Modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#E2DCC8] space-y-5 dir-rtl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#3A3A3A] flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#8B9D83]" />
                <span>إضافة دواء أو مكمل جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMedicationModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedicationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  اسم الدواء أو المكمل الغذائي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مكمل فيتامين D، أوميغا 3، مسكن..."
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#8B9D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الموعد أو التوقيت المفضل
                </label>
                <input
                  type="text"
                  placeholder="مثال: 10:00 ص، بعد وجبة الإفطار، قبل النوم..."
                  value={newMedTime}
                  onChange={(e) => setNewMedTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#8B9D83]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setShowMedicationModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#8B9D83] hover:bg-[#72856A] rounded-xl shadow-xs cursor-pointer"
                >
                  حفظ الدواء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3A3A3A] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center space-x-2 space-x-reverse border border-amber-400/30 backdrop-blur-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
