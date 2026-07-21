import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { DiaryEntry, TaskItem, Habit } from '../types';
import WeeklyHabitsMoodChart from './WeeklyHabitsMoodChart';

interface TasksChecklistSectionProps {
  activeDiaryForSelectedDate: DiaryEntry | undefined;
  selectedDate: string;
  handleUpdateHabit: (type: 'sleep' | 'sports' | 'medication' | 'water' | 'fastMood' | 'symptoms' | 'cbt', value: any) => void;
  handleUpdateTasks: (updatedTasks: TaskItem[]) => void;
  habits: Habit[];
  toggleHabitCompletion: (habitId: string, dateStr: string) => void;
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
  isDarkMode = false,
  diaries = []
}) => {
  const [newTaskText, setNewTaskText] = useState('');

  // Extract variables
  const tasks = activeDiaryForSelectedDate?.tasks || [];
  const sleepHours = activeDiaryForSelectedDate?.sleepHours ?? 8;
  const sportsDuration = activeDiaryForSelectedDate?.sportsDuration ?? 0;
  const waterCups = activeDiaryForSelectedDate?.waterCups ?? 0;
  const isMedicationTaken = activeDiaryForSelectedDate?.medications?.[0]?.taken ?? false;

  // Calculate metrics
  const totalCustomTasks = tasks.length;
  const completedCustomTasks = tasks.filter(t => t.completed).length;

  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => h.history[selectedDate]).length;

  const totalMedsCount = 1; // 1 standard medication slot
  const completedMedsCount = isMedicationTaken ? 1 : 0;

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

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-gray-200' : 'text-[#3A3A3A]'}`} id="daily-tasks-main-section">
      
      {/* 📅 Selected Date Header */}
      <div className={`flex items-center justify-between p-5 rounded-3xl border ${
        isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8]'
      }`}>
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 bg-[#8B9D83]/10 text-[#8B9D83] rounded-2xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">متابعة اليوم الحالي:</span>
            <span className="text-sm font-black text-[#5A5A40]">{selectedDate}</span>
          </div>
        </div>

        <div className="text-left font-sans">
          <span className="text-[10px] text-gray-400 font-bold block">معدل الإنجاز العام</span>
          <span className="text-lg font-black text-[#8B9D83]">{completionPercentage}%</span>
        </div>
      </div>

      {/* 📊 Comprehensive Progress Card */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${
        isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-gradient-to-br from-[#8B9D83]/10 to-[#F4F6F4]/40 border-[#E2DCC8]/80'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B9D83]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
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

            {/* Add Task Input Form */}
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

            {/* Custom Tasks Render List */}
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
                      {/* Check Toggle */}
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
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                <span>💊</span>
                <span>تتبع الأدوية والفيتامينات اليومية</span>
              </h4>
              <p className="text-[10px] text-gray-500 font-medium">
                سجل جرعات دوائك ومكملاتك العلاجية للحفاظ على مستوياتك الحيوية مستقرة.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              isMedicationTaken 
                ? 'bg-emerald-50/20 border-emerald-200' 
                : 'bg-[#F9F7F2]/30 border-[#E2DCC8]/60'
            }`}>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`p-2.5 rounded-xl ${isMedicationTaken ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-gray-700">مكمل فيتامين D اليومي</span>
                  <span className="text-[9px] text-gray-400 block font-bold">الموعد المحدد: 10:00 ص</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateHabit('medication', !isMedicationTaken)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isMedicationTaken 
                    ? 'bg-[#8B9D83] text-white shadow-xs' 
                    : 'bg-[#F0EDE4] text-[#5A5A40] hover:bg-[#E2DCC8]/60'
                }`}
              >
                {isMedicationTaken ? '✓ تم التناول' : 'تحديد كمنجز'}
              </button>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: BEHAVIORAL ROUTINES & PHYSICAL HEALTH */}
        <div className="space-y-6">
          
          {/* 🎯 Daily Habits Checklist */}
          <div className={`p-5 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8]'
          }`}>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                <span>🎯</span>
                <span>الروتين والعادات السلوكية</span>
              </h4>
              <p className="text-[10px] text-gray-500 font-medium">
                سجل تكرار التزامك بالعادات السلوكية اليومية الإيجابية.
              </p>
            </div>

            {habits.length === 0 ? (
              <div className="bg-[#F9F7F2]/40 border border-dashed border-[#E2DCC8]/60 rounded-2xl p-6 text-center text-xs text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-[#8B9D83]" />
                <p className="font-bold text-[#5A5A40]">لا توجد عادات سلوكية مسجلة حالياً.</p>
                <p className="text-[10px] mt-0.5 text-gray-400">يمكنك إدارة وإضافة عادات جديدة من لوحة التحكم الرئيسية.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {habits.map(habit => {
                  const isCompleted = !!habit.history[selectedDate];
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
                          <span className={`text-xs font-bold block truncate transition-all ${
                            isCompleted ? 'line-through text-gray-400' : 'text-gray-700'
                          }`}>
                            {habit.name}
                          </span>
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

              {/* 🏃 Sports Duration */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span>النشاط البدني والرياضة:</span>
                  </span>
                  <span className="font-mono text-[#8B9D83]">{sportsDuration} دقيقة</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={sportsDuration}
                  onChange={(e) => handleUpdateHabit('sports', e.target.value)}
                  className="w-full h-1.5 bg-[#E2DCC8]/60 rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
                />
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
  );
};
